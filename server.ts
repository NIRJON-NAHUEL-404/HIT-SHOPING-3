import express from "express";
import path from "path";
import nodemailer from "nodemailer";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SMTP_CONFIG_FILE = path.join(process.cwd(), 'smtp-config.json');

function getSmtpConfig() {
  // Priority 1: Environment Variables (Best for Vercel)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      from: process.env.EMAIL_FROM || process.env.SMTP_USER
    };
  }

  // Priority 2: Local JSON file (Works in local dev/containers)
  try {
    if (fs.existsSync(SMTP_CONFIG_FILE)) {
      const data = fs.readFileSync(SMTP_CONFIG_FILE, 'utf8');
      const config = JSON.parse(data);
      if (config.host && config.user && config.pass) {
        return {
          host: config.host,
          port: parseInt(config.port || "587"),
          secure: config.port === "465",
          auth: {
            user: config.user,
            pass: config.pass,
          },
          from: config.from || config.user
        };
      }
    }
  } catch (e) {
    console.error("Error reading SMTP config:", e);
  }
  
  return null;
}

const app = express();

async function startServer() {
  const PORT = parseInt(process.env.PORT || "3000");

  app.use(express.json());

  // API Route to get SMTP config
  app.get("/api/smtp-config", (req, res) => {
    try {
      if (fs.existsSync(SMTP_CONFIG_FILE)) {
        const data = fs.readFileSync(SMTP_CONFIG_FILE, 'utf8');
        const config = JSON.parse(data);
        res.json({ ...config, pass: config.pass ? '********' : '' });
      } else {
        // If file doesn't exist, check env vars
        if (process.env.SMTP_HOST) {
          res.json({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || "587",
            user: process.env.SMTP_USER,
            pass: '********',
            from: process.env.EMAIL_FROM || process.env.SMTP_USER
          });
        } else {
          res.json({});
        }
      }
    } catch (e) {
      res.status(500).json({ error: "Failed to read config" });
    }
  });

  // API Route to save SMTP config
  app.post("/api/smtp-config", (req, res) => {
    try {
      const { host, port, user, pass, from } = req.body;
      let newConfig = { host, port, user, pass, from };
      
      if (pass === '********') {
        if (fs.existsSync(SMTP_CONFIG_FILE)) {
          const oldData = JSON.parse(fs.readFileSync(SMTP_CONFIG_FILE, 'utf8'));
          newConfig.pass = oldData.pass;
        } else if (process.env.SMTP_PASS) {
          newConfig.pass = process.env.SMTP_PASS;
        }
      }

      // Note: This will fail on Vercel at runtime, but works in local/containers
      try {
        fs.writeFileSync(SMTP_CONFIG_FILE, JSON.stringify(newConfig, null, 2));
      } catch (fsErr) {
        console.warn("Could not write to filesystem (expected on Vercel). Use environment variables instead.");
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to save config" });
    }
  });

  // API Route for sending order status email
  app.post("/api/send-order-status-email", async (req, res) => {
    const { email, orderId, customerName, total, status } = req.body;

    if (!email || !orderId || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const smtpConfig = getSmtpConfig();
    if (!smtpConfig) {
      console.warn("SMTP configuration missing. Email not sent.");
      return res.status(500).json({ error: "Email service not configured. Please set environment variables or use the admin panel (if supported by environment)." });
    }

    try {
      const transporter = nodemailer.createTransport(smtpConfig);

      const isConfirmed = status === 'Confirmed';
      const subjectText = isConfirmed ? 'অর্ডার কনফার্মেশন' : 'অর্ডার বাতিলকরণ';
      const titleText = isConfirmed ? `অভিনন্দন ${customerName}!` : `দুঃখিত ${customerName},`;
      const messageText = isConfirmed 
        ? 'আপনার অর্ডারটি সফলভাবে কনফার্ম করা হয়েছে।' 
        : 'আপনার অর্ডারটি বাতিল করা হয়েছে। কোনো প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করুন।';
      const titleColor = isConfirmed ? '#06b6d4' : '#ef4444';

      const highlightMessage = isConfirmed 
        ? `<div style="background-color: #fffbeb; border: 2px solid #f59e0b; padding: 20px; text-align: center; border-radius: 10px; margin: 25px 0;">
             <h1 style="color: #d97706; margin: 0; font-size: 24px;">৩ দিন অপেক্ষা করুন</h1>
             <p style="color: #b45309; margin: 10px 0 0 0; font-size: 18px; font-weight: bold;">প্রোডাক্ট হাতে পাওয়ার জন্য!</p>
           </div>`
        : '';

      const mailOptions = {
        from: smtpConfig.from,
        to: email,
        subject: `${subjectText} - #${orderId.split('-')[1]}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: ${titleColor}; text-align: center;">${titleText}</h2>
            <p style="text-align: center; font-size: 16px;">${messageText}</p>
            ${highlightMessage}
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>অর্ডার আইডি:</strong> #${orderId.split('-')[1]}</p>
              <p><strong>মোট মূল্য:</strong> ৳${total}</p>
              <p><strong>স্ট্যাটাস:</strong> ${isConfirmed ? 'কনফার্মড' : 'ক্যানসেলড'}</p>
            </div>
            <p style="text-align: center;">আমাদের সাথে থাকার জন্য ধন্যবাদ।</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #888; text-align: center;">© Royal HIT SHOPING</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: "Email sent successfully" });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  app.post("/api/send-verification-code", async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const smtpConfig = getSmtpConfig();
    if (!smtpConfig) {
      console.warn("SMTP configuration missing. Email not sent.");
      return res.status(500).json({ error: "Email service not configured" });
    }

    try {
      const transporter = nodemailer.createTransport(smtpConfig);

      const mailOptions = {
        from: smtpConfig.from,
        to: email,
        subject: `ভেরিফিকেশন কোড`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #06b6d4; text-align: center;">ভেরিফিকেশন কোড</h2>
            <p style="text-align: center; font-size: 16px;">আপনার অ্যাকাউন্ট তৈরির জন্য নিচের কোডটি ব্যবহার করুন:</p>
            <div style="background-color: #f0fdfa; border: 2px dashed #0d9488; padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center;">
              <h1 style="letter-spacing: 12px; color: #0f766e; margin: 0; font-size: 42px;">${code}</h1>
            </div>
            <p style="text-align: center; color: #666;">এই কোডটি কারো সাথে শেয়ার করবেন না।</p>
            <p style="text-align: center;">আমাদের সাথে থাকার জন্য ধন্যবাদ।</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #888; text-align: center;">© Royal HIT SHOPING</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: "Verification code sent successfully" });
    } catch (error) {
      console.error("Error sending verification code:", error);
      res.status(500).json({ error: "Failed to send verification code" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn("Vite not found, skipping middleware. This is normal in production.");
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
  
  return app;
}

startServer();
export default app;
