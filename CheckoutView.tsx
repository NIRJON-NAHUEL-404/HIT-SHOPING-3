import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { OrderStatus } from '../types';

const CheckoutView: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Bkash' | 'Nagad' | 'Rocket' | 'COD' | 'SSLCommerz' | 'Shurjopay'>('Bkash');
  const [formData, setFormData] = useState({ name: '', address: '', phone: '', email: '', whatsapp: '', transactionId: '' });
  const [screenshot, setScreenshot] = useState<string>('');
  
  // Stages: 'idle' | 'submitting' | 'success'
  const [orderStage, setOrderStage] = useState<'idle' | 'submitting' | 'success'>('idle');

  if (!context) return null;
  const { state, addOrder } = context;

  useEffect(() => {
    if (state.currentUser) {
      setFormData(prev => ({
        ...prev,
        name: state.currentUser?.name || '',
        address: state.currentUser?.address || '',
        phone: state.currentUser?.phone || '',
        email: state.currentUser?.email || '',
        whatsapp: state.currentUser?.whatsapp || ''
      }));
    }
    window.scrollTo(0, 0);
  }, [state.currentUser]);

  const compressImage = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_size = 800;
        
        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, (base64) => {
        setScreenshot(base64);
      });
    }
  };

  const playVoiceFeedback = () => {
    const message = new SpeechSynthesisUtterance("আপনার অর্ডার পেন্ডিং এ আছে শীগ্রই এডমিন আপনার সাথে যোগাগজ করবে");
    message.lang = 'bn-BD';
    message.rate = 0.9;
    window.speechSynthesis.speak(message);
  };

  const subtotal = state.cart?.reduce((acc, item) => acc + (item.price * item.quantity), 0) || 0;
  const total = subtotal + state.deliveryCharge;

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (state.cart.length === 0) return;
    if (!screenshot) { alert('দয়া করে পেমেন্ট এর স্ক্রিনশট আপলোড করুন!'); return; }
    if (!formData.transactionId) { alert('দয়া করে ট্রানজেকশন আইডি দিন!'); return; }

    setOrderStage('submitting');

    // Simulate Payment Submission
    setTimeout(() => {
      setOrderStage('success');
      playVoiceFeedback();

      const newOrder = { 
        id: `ORD-${Date.now()}`, 
        userId: state.currentUser?.id || 'guest', 
        items: [...state.cart], 
        total, 
        deliveryCharge: state.deliveryCharge, 
        status: OrderStatus.PENDING, 
        paymentMethod, 
        shippingDetails: { ...formData, paymentScreenshot: screenshot }, 
        createdAt: Date.now() 
      };
      
      addOrder(newOrder);

      // Final redirect after showing success
      setTimeout(() => {
        navigate('/');
      }, 5000);
    }, 3500);
  };

  const paymentNumber = state.paymentNumber || "01403-250736";

  if (state.cart.length === 0 && orderStage === 'idle') {
    return (
      <div className="max-w-xl mx-auto text-center py-20 bg-white rounded-[2rem] border border-gray-200 shadow-sm mx-4">
        <i className="fa-solid fa-cart-shopping text-5xl text-gray-300 mb-6 block"></i>
        <h2 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-widest">ব্যাগ খালি!</h2>
        <button onClick={() => navigate('/')} className="bg-gray-900 text-white font-black py-3 px-8 rounded-xl shadow-lg hover:scale-105 transition-all uppercase tracking-widest text-[10px]">শপিংয়ে ফিরুন</button>
      </div>
    );
  }

  // --- SUBMITTING PAGE ---
  if (orderStage === 'submitting') {
    return (
      <div className="fixed inset-0 bg-white z-[3000] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
        <div className="relative mb-12">
          <div className="w-24 h-24 border-8 border-gray-100 border-t-gray-900 rounded-full animate-spin"></div>
          <i className="fa-solid fa-credit-card absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-900 text-2xl animate-pulse"></i>
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-widest leading-relaxed max-w-lg mb-4">পেমেন্ট সাবমিট করা হচ্ছে...</h2>
        <p className="text-gray-500 font-bold tracking-[0.2em] text-xs uppercase">দয়া করে ব্রাউজার বন্ধ করবেন না</p>
      </div>
    );
  }

  // --- SUCCESS PAGE ---
  if (orderStage === 'success') {
    return (
      <div className="fixed inset-0 bg-white z-[3000] flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-700">
        <div className="mb-8 flex flex-wrap justify-center gap-4">
          {state.cart.map((item, idx) => (
            <div key={idx} className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg border-4 border-green-500 relative animate-bounce" style={{ animationDelay: `${idx * 0.1}s` }}>
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                <i className="fa-solid fa-check text-white text-2xl drop-shadow-md"></i>
              </div>
            </div>
          ))}
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-gray-900 italic tracking-tighter mb-6">সফলভাবে সাবমিট হয়েছে!</h2>
        <div className="bg-gray-50 border border-gray-200 px-8 py-4 rounded-2xl max-w-lg">
          <p className="text-gray-700 font-bold text-lg leading-relaxed">আপনার অর্ডার পেন্ডিং এ আছে শীগ্রই এডমিন আপনার সাথে যোগাগজ করবে।</p>
        </div>
        <div className="mt-12 flex items-center gap-3 text-gray-900 text-xs font-black uppercase tracking-[0.4em]">
           <div className="w-3 h-3 bg-gray-900 rounded-full animate-ping"></div>
           হোম পেজে ফিরিয়ে নেওয়া হচ্ছে
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 cinematic-in mb-20">
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-900 font-black uppercase tracking-[0.2em] text-[10px] hover:-translate-x-1 transition-transform">
          <i className="fa-solid fa-arrow-left"></i> পিছনে যান
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Shipping Details - Moved to top of DOM for mobile, but lg:order-1 for desktop */}
        <div className="lg:order-1">
          <div className="bg-white p-4 md:p-6 rounded-[1.5rem] border border-gray-200 shadow-sm">
            <h2 className="text-[11px] font-black mb-6 text-gray-900 uppercase tracking-[0.4em] flex items-center gap-3">
              <i className="fa-solid fa-id-card"></i> শিপিং ডিটেইলস
            </h2>
            <form id="orderForm" onSubmit={handlePlaceOrder} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-[7px] font-black text-gray-500 mb-1 uppercase tracking-widest">আপনার নাম</label>
                <input type="text" required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-gray-900 text-gray-900 font-bold text-[10px]" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-[7px] font-black text-gray-500 mb-1 uppercase tracking-widest">ফোন নম্বর</label>
                <input type="tel" required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-gray-900 text-gray-900 font-bold text-[10px]" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-[7px] font-black text-gray-500 mb-1 uppercase tracking-widest">ইমেইল (ঐচ্ছিক)</label>
                <input type="email" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-gray-900 text-gray-900 font-bold text-[10px]" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="block text-[7px] font-black text-gray-500 mb-1 uppercase tracking-widest">ঠিকানা</label>
                <textarea rows={1} required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-gray-900 text-gray-900 font-bold text-[10px]" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="col-span-2 mt-4">
                <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4">পেমেন্ট পদ্ধতি</h3>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`relative overflow-hidden flex flex-col items-center justify-center p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${paymentMethod === 'Bkash' ? 'border-[#E2136E] bg-[#E2136E]/5 shadow-[0_0_20px_rgba(226,19,110,0.2)] scale-[1.02]' : 'border-gray-200 bg-white hover:border-[#E2136E]/50 hover:bg-gray-50'}`}>
                    {paymentMethod === 'Bkash' && <div className="absolute top-3 right-3 w-5 h-5 bg-[#E2136E] rounded-full flex items-center justify-center"><i className="fa-solid fa-check text-white text-xs"></i></div>}
                    <input type="radio" name="payment" className="hidden" onChange={() => setPaymentMethod('Bkash')} />
                    <div className={`w-14 h-14 flex items-center justify-center text-white text-2xl font-black rounded-xl mb-3 transition-all duration-300 ${paymentMethod === 'Bkash' ? 'bg-[#E2136E] shadow-lg shadow-[#E2136E]/40' : 'bg-gray-300'}`}>ব</div>
                    <span className={`text-sm font-black uppercase tracking-widest ${paymentMethod === 'Bkash' ? 'text-[#E2136E]' : 'text-gray-500'}`}>বিকাশ</span>
                  </label>
                  <label className={`relative overflow-hidden flex flex-col items-center justify-center p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${paymentMethod === 'Nagad' ? 'border-[#F44336] bg-[#F44336]/5 shadow-[0_0_20px_rgba(244,67,54,0.2)] scale-[1.02]' : 'border-gray-200 bg-white hover:border-[#F44336]/50 hover:bg-gray-50'}`}>
                    {paymentMethod === 'Nagad' && <div className="absolute top-3 right-3 w-5 h-5 bg-[#F44336] rounded-full flex items-center justify-center"><i className="fa-solid fa-check text-white text-xs"></i></div>}
                    <input type="radio" name="payment" className="hidden" onChange={() => setPaymentMethod('Nagad')} />
                    <div className={`w-14 h-14 flex items-center justify-center text-white text-2xl font-black rounded-xl mb-3 transition-all duration-300 ${paymentMethod === 'Nagad' ? 'bg-[#F44336] shadow-lg shadow-[#F44336]/40' : 'bg-gray-300'}`}>ন</div>
                    <span className={`text-sm font-black uppercase tracking-widest ${paymentMethod === 'Nagad' ? 'text-[#F44336]' : 'text-gray-500'}`}>নগদ</span>
                  </label>
                </div>
                <div className="mt-8 space-y-6">
                  <div className="bg-gray-50 border border-gray-200 p-5 rounded-2xl border-l-4 border-gray-900">
                     <p className="text-gray-900 text-[10px] font-black uppercase tracking-widest mb-2">পেমেন্ট ইনস্ট্রাকশন:</p>
                     <p className="text-gray-900 text-[14px] md:text-[16px] font-bold leading-relaxed">
                       আমাদের <span className={`text-lg px-2 rounded font-black ${paymentMethod === 'Bkash' ? 'bg-[#E2136E] text-white' : 'bg-[#F44336] text-white'}`}>{paymentMethod}</span> পারসোনাল নম্বর <span className="text-gray-900 text-xl font-black bg-gray-200 px-2 rounded">{paymentNumber}</span>-এ সেন্ড মানি করুন।
                     </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[9px] font-black text-gray-500 uppercase ml-1 mb-2">ট্রানজেকশন আইডি (Transaction ID)</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="TrxID এখানে লিখুন..."
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-gray-900 text-gray-900 font-black text-xl outline-none uppercase placeholder:text-gray-400"
                        value={formData.transactionId}
                        onChange={e => setFormData({...formData, transactionId: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[9px] font-black text-gray-500 uppercase ml-1 mb-2">পেমেন্ট স্ক্রিনশট আপলোড</label>
                      <div onClick={() => fileInputRef.current?.click()} className="w-full h-24 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-gray-900 transition-all relative overflow-hidden group">
                        {screenshot ? <img src={screenshot} className="w-full h-full object-cover" /> : <><i className="fa-solid fa-camera text-2xl text-gray-400 mb-2"></i><span className="text-[9px] font-black text-gray-500 uppercase">ছবি সিলেক্ট করুন</span></>}
                        <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleScreenshotUpload} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Order Summary - Now below Shipping Details in DOM */}
        <div className="lg:order-2">
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-200 shadow-sm">
            <h2 className="text-[12px] font-black mb-6 text-gray-900 uppercase tracking-widest">অর্ডার সামারি</h2>
            <div className="space-y-3 mb-6 max-h-[200px] overflow-y-auto pr-1 no-scrollbar">
              {state.cart.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="flex justify-between items-center bg-gray-50 p-2 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <img src={item.image} className="w-10 h-10 object-cover rounded-lg" />
                    <div>
                      <span className="text-gray-900 font-bold text-[10px] truncate w-24 block">{item.name}</span>
                      {item.selectedSize && (
                        <span className="text-gray-500 text-[8px] font-black uppercase">Size: {item.selectedSize}</span>
                      )}
                    </div>
                  </div>
                  <span className="font-black text-gray-900 text-[11px]">৳{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-[9px] font-black text-gray-500 uppercase"><span>পণ্যের মূল্য</span><span>৳{subtotal}</span></div>
              <div className="flex justify-between text-[9px] font-black text-gray-500 uppercase"><span>ডেলিভারি চার্জ</span><span>৳{state.deliveryCharge}</span></div>
              <div className="flex justify-between items-center text-2xl font-black text-gray-900 pt-4 border-t border-gray-200"><span>সর্বমোট</span><span>৳{total}</span></div>
            </div>
            <button form="orderForm" type="submit" className="w-full bg-gray-900 hover:bg-black text-white font-black py-4 rounded-2xl transition-all active:scale-95 mt-6 uppercase tracking-[0.3em] text-xs">প্লেস অর্ডার করুন</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutView;