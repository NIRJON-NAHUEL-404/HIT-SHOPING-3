import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';
import { User, OrderStatus } from '../types';
import { auth, googleProvider, facebookProvider } from '../firebase';
import { signInWithPopup, signOut } from 'firebase/auth';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const context = useContext(AppContext);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<'details' | 'verification'>('details');
  const [activeTab, setActiveTab] = useState<'info' | 'notifications' | 'orders'>('info');
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '', name: '', address: '', phone: '' });
  const [verificationCode, setVerificationCode] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!context) return null;
  const { state, login, logout, updateUserProfile } = context;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
      onClose();
      alert('লগআউট সফল হয়েছে!');
    } catch (error) {
      console.error('Logout error:', error);
      alert('লগআউট ব্যর্থ হয়েছে!');
    }
  };

  const handleSocialLogin = async (provider: any) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (user.email) {
        const newUser: User = {
          id: user.uid,
          email: user.email,
          name: user.displayName || 'সম্মানিত ইউজার',
          address: '',
          phone: '',
          notifications: [],
          wishlist: []
        };
        login(newUser);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('লগইন ব্যর্থ হয়েছে!');
    }
  };

  useEffect(() => {
    if (state.currentUser) {
      setFormData({
        email: state.currentUser.email,
        password: '',
        name: state.currentUser.name || '',
        address: state.currentUser.address || '',
        phone: state.currentUser.phone || ''
      });
    }
  }, [state.currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.currentUser) {
      updateUserProfile({ ...state.currentUser, ...formData });
      alert('প্রোফাইল আপডেট সফল হয়েছে!');
    } else if (isRegistering) {
      if (registrationStep === 'details') {
        if (formData.password !== formData.confirmPassword) {
          alert('পাসওয়ার্ড মিলছে না!');
          return;
        }
        
        // Generate code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setSentCode(code);
        setIsVerifying(true);

        try {
          const response = await fetch('/api/send-verification-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email, code })
          });
          
          if (response.ok) {
            setRegistrationStep('verification');
            alert('আপনার জিমেইলে একটি ভেরিফিকেশন কোড পাঠানো হয়েছে।');
          } else {
            alert('কোড পাঠাতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
          }
        } catch (error) {
          console.error('Error sending code:', error);
          alert('কোড পাঠাতে ব্যর্থ হয়েছে।');
        } finally {
          setIsVerifying(false);
        }
      } else {
        // Verification step
        if (verificationCode === sentCode) {
          const newUser: User = {
            id: Math.random().toString(36).substr(2, 9),
            email: formData.email,
            password: formData.password,
            name: formData.name || 'সম্মানিত ইউজার',
            address: formData.address,
            phone: formData.phone,
            notifications: [],
            wishlist: []
          };
          login(newUser);
          alert('অ্যাকাউন্ট তৈরি সফল হয়েছে!');
          onClose();
        } else {
          alert('ভেরিফিকেশন কোড সঠিক নয়!');
        }
      }
    } else {
      // Login logic
      const existingUser = state.users.find(u => u.email === formData.email);
      if (existingUser) {
        if (existingUser.password === formData.password) {
          login(existingUser);
          alert('লগইন সফল হয়েছে!');
          onClose();
        } else {
          alert('ভুল পাসওয়ার্ড!');
        }
      } else {
        alert('এই জিমেইল দিয়ে কোনো অ্যাকাউন্ট নেই!');
      }
    }
  };

  const userOrders = state.orders.filter(o => o.userId === state.currentUser?.id);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#020617]/90 z-[2000] flex items-center justify-center p-4 backdrop-blur-xl transition-all">
      <div className="bg-[#0F172A] rounded-[3rem] w-full max-w-xl overflow-hidden shadow-[0_0_100px_rgba(212,175,55,0.15)] border border-[#D4AF37]/30 animate-in fade-in zoom-in duration-300">
        <div className="p-6 md:p-10">
          <div className="flex flex-col mb-6">
            <button 
              onClick={onClose}
              className="flex items-center gap-2 text-[#D4AF37] font-black uppercase tracking-[0.2em] text-[10px] mb-6 hover:translate-x-[-5px] transition-transform self-start"
            >
              <i className="fa-solid fa-arrow-left text-[8px]"></i> পিছনে যান
            </button>
            
            {state.currentUser && (
              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 mb-6 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('info')} className={`flex-grow py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'info' ? 'bg-[#D4AF37] text-black shadow-lg' : 'text-gray-500'}`}>তথ্য</button>
                <button onClick={() => setActiveTab('orders')} className={`flex-grow py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'orders' ? 'bg-[#D4AF37] text-black shadow-lg' : 'text-gray-500'}`}>অর্ডার ({userOrders.length})</button>
                <button onClick={() => setActiveTab('notifications')} className={`flex-grow py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap relative ${activeTab === 'notifications' ? 'bg-[#D4AF37] text-black shadow-lg' : 'text-gray-500'}`}>
                  বার্তা
                  {(state.currentUser.notifications?.length || 0) > 0 && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full"></span>}
                </button>
              </div>
            )}

            <h2 className="text-lg font-black text-white uppercase tracking-widest gold-text-glow">
              {state.currentUser ? (activeTab === 'info' ? 'আপনার প্রোফাইল' : activeTab === 'orders' ? 'আমার অর্ডারসমূহ' : 'বার্তা বক্স') : (isRegistering ? (registrationStep === 'details' ? 'নতুন আইডি তৈরি' : 'কোড ভেরিফাই করুন') : 'লগইন করুন')}
            </h2>
            {state.currentUser && (
              <button type="button" onClick={handleLogout} className="text-red-500 font-black text-[9px] uppercase tracking-widest mt-2">লগআউট</button>
            )}
          </div>

          <div className="max-h-[450px] overflow-y-auto pr-1 custom-scrollbar">
            {state.currentUser ? (
              <>
                {activeTab === 'info' && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[8px] font-black text-gray-500 mb-2 uppercase tracking-widest">পুরো নাম</label>
                      <input type="text" className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-[#D4AF37] outline-none text-white font-bold text-xs" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-gray-500 mb-2 uppercase tracking-widest">জিমেইল</label>
                      <input type="email" disabled className="w-full px-5 py-4 bg-white/10 border border-white/10 rounded-2xl text-gray-500 font-bold text-xs" value={formData.email} />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-gray-500 mb-2 uppercase tracking-widest">মোবাইল নম্বর</label>
                      <input type="tel" className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-[#D4AF37] outline-none text-white font-bold text-xs" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-gray-500 mb-2 uppercase tracking-widest">ঠিকানা</label>
                      <textarea rows={2} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-[#D4AF37] outline-none text-white font-bold text-xs" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                    </div>
                    <button type="submit" className="w-full bg-[#D4AF37] text-black font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest text-[10px] mt-4">আপডেট করুন</button>
                  </form>
                )}

                {activeTab === 'orders' && (
                  <div className="space-y-4">
                    {userOrders.length === 0 ? (
                      <div className="text-center py-10">
                        <i className="fa-solid fa-box-open text-xl text-gray-800 mb-4 block"></i>
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">আপনি এখনো কোনো অর্ডার করেননি</p>
                      </div>
                    ) : (
                      userOrders.map(order => (
                        <div key={order.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="text-[#D4AF37] font-black text-[10px] uppercase">আইডি: #{order.id.split('-')[1].slice(-5)}</p>
                              <p className="text-gray-500 text-[8px] font-mono">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${order.status === OrderStatus.CONFIRMED ? 'bg-green-500/10 text-green-500' : order.status === OrderStatus.CANCELLED ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{order.status}</span>
                          </div>
                          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {order.items.map((it, i) => (
                              <img key={i} src={it.image} className="w-10 h-10 object-cover rounded-lg border border-white/10" title={it.name} />
                            ))}
                          </div>
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                            <span className="text-gray-500 text-[8px] font-black uppercase">মোট:</span>
                            <span className="text-white font-black text-[10px]">৳{order.total}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-4">
                    {(state.currentUser.notifications || []).length === 0 ? (
                      <div className="text-center py-10">
                        <i className="fa-solid fa-bell-slash text-xl text-gray-800 mb-4 block"></i>
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">কোনো বার্তা নেই</p>
                      </div>
                    ) : (
                      state.currentUser.notifications.map(notif => (
                        <div key={notif.id} className={`p-4 rounded-2xl border ${notif.type === 'success' ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                          <p className="text-white text-[11px] font-bold leading-relaxed">{notif.message}</p>
                          <span className="text-[8px] text-gray-600 block mt-2 font-mono">{new Date(notif.timestamp).toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {registrationStep === 'details' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <button type="button" onClick={() => handleSocialLogin(googleProvider)} className="w-full bg-white text-black font-black py-3 rounded-xl shadow-xl text-[9px] uppercase tracking-widest flex items-center justify-center gap-2">
                        <i className="fa-brands fa-google text-[8px]"></i> Google
                      </button>
                      <button type="button" onClick={() => handleSocialLogin(facebookProvider)} className="w-full bg-[#1877F2] text-white font-black py-3 rounded-xl shadow-xl text-[9px] uppercase tracking-widest flex items-center justify-center gap-2">
                        <i className="fa-brands fa-facebook text-[8px]"></i> Facebook
                      </button>
                    </div>
                    <div className="relative flex items-center py-2">
                      <div className="flex-grow border-t border-white/10"></div>
                      <span className="flex-shrink mx-4 text-gray-500 text-[8px] uppercase font-black">অথবা</span>
                      <div className="flex-grow border-t border-white/10"></div>
                    </div>
                    {isRegistering && (
                      <div>
                        <label className="block text-[8px] font-black text-gray-500 mb-2 uppercase tracking-widest">পুরো নাম</label>
                        <input type="text" required className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-[#D4AF37] outline-none text-white font-bold text-xs" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                      </div>
                    )}
                    <div>
                      <label className="block text-[8px] font-black text-gray-500 mb-2 uppercase tracking-widest">জিমেইল</label>
                      <input type="email" required className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-[#D4AF37] outline-none text-white font-bold text-xs" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-gray-500 mb-2 uppercase tracking-widest">পাসওয়ার্ড</label>
                      <input type="password" required className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-[#D4AF37] outline-none text-white font-bold text-xs" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    </div>
                    {isRegistering && (
                      <div>
                        <label className="block text-[8px] font-black text-gray-500 mb-2 uppercase tracking-widest">পাসওয়ার্ড নিশ্চিত করুন</label>
                        <input type="password" required className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-[#D4AF37] outline-none text-white font-bold text-xs" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
                      </div>
                    )}
                    <button type="submit" disabled={isVerifying} className="w-full bg-[#D4AF37] text-black font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest text-[10px] mt-4 disabled:opacity-50">
                      {isVerifying ? 'অপেক্ষা করুন...' : (isRegistering ? 'পরবর্তী ধাপ' : 'লগইন করুন')}
                    </button>
                    <p className="text-center text-[9px] font-bold text-gray-500 mt-6 uppercase tracking-widest">
                      {isRegistering ? 'আগে থেকেই আইডি আছে?' : 'আইডি নেই?'} 
                      <button type="button" onClick={() => { setIsRegistering(!isRegistering); setRegistrationStep('details'); }} className="ml-2 text-[#D4AF37] font-black">{isRegistering ? 'লগইন করুন' : 'নতুন আইডি খুলুন'}</button>
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-center mb-6">
                      <p className="text-gray-400 text-[10px] font-bold mb-2">আমরা আপনার জিমেইলে একটি ৬-সংখ্যার কোড পাঠিয়েছি।</p>
                      <p className="text-[#D4AF37] text-xs font-black">{formData.email}</p>
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-gray-500 mb-2 uppercase tracking-widest text-center">ভেরিফিকেশন কোড</label>
                      <input 
                        type="text" 
                        maxLength={6}
                        required 
                        className="w-full px-5 py-6 bg-white/5 border border-white/10 rounded-2xl focus:border-[#D4AF37] outline-none text-white font-black text-3xl text-center tracking-[1em]" 
                        value={verificationCode} 
                        onChange={e => setVerificationCode(e.target.value)} 
                      />
                    </div>
                    <button type="submit" className="w-full bg-[#D4AF37] text-black font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest text-[10px] mt-4">
                      ভেরিফাই করুন
                    </button>
                    <button type="button" onClick={() => setRegistrationStep('details')} className="w-full text-gray-500 font-black text-[9px] uppercase tracking-widest mt-4">পিছনে যান</button>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;