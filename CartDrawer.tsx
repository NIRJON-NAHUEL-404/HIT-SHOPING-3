
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const context = useContext(AppContext);
  const navigate = useNavigate();

  if (!context) return null;
  const { state, removeFromCart, updateQuantity } = context;

  const total = state.cart?.reduce((acc, item) => acc + (item.price * item.quantity), 0) || 0;

  return (
    <>
      <div 
        className={`fixed inset-0 bg-[#020617]/80 z-[1500] backdrop-blur-md transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#020617] border-l border-[#D4AF37]/20 z-[1600] shadow-[0_0_80px_rgba(0,0,0,1)] transition-transform duration-500 ease-in-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-8 border-b border-[#D4AF37]/10">
            <button 
              onClick={onClose}
              className="flex items-center gap-2 text-[#D4AF37] font-black uppercase tracking-[0.2em] text-[10px] mb-8 hover:translate-x-[-5px] transition-transform"
            >
              <i className="fa-solid fa-arrow-left"></i> পিছনে যান
            </button>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white flex items-center gap-4 uppercase tracking-widest gold-text-glow">
                <i className="fa-solid fa-shopping-bag text-[#D4AF37]"></i>
                আপনার ব্যাগ ({state.cart.length})
              </h2>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto p-8 space-y-8 custom-scrollbar">
            {state.cart.length === 0 ? (
              <div className="text-center py-20">
                <i className="fa-solid fa-basket-shopping text-7xl text-white/5 mb-8 block"></i>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">আপনার ব্যাগ খালি</p>
                <button 
                  onClick={onClose}
                  className="mt-6 text-[#D4AF37] font-black uppercase tracking-widest text-[10px] hover:scale-110 transition-transform"
                >
                  কেনাকাটা শুরু করুন
                </button>
              </div>
            ) : (
              state.cart.map((item, idx) => (
                <div key={`${item.id}-${item.selectedSize}-${idx}`} className="flex gap-6 group">
                  <div className="w-20 h-24 glass-card rounded-2xl overflow-hidden flex-shrink-0 border border-white/5">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-white text-sm line-clamp-1 group-hover:text-[#D4AF37] transition-colors">{item.name}</h4>
                        {item.selectedSize && (
                          <span className="text-[#D4AF37] text-[10px] font-black uppercase">সাইজ: {item.selectedSize}</span>
                        )}
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id, item.selectedSize)}
                        className="text-gray-600 hover:text-red-500 transition-colors"
                      >
                        <i className="fa-solid fa-trash-can text-sm"></i>
                      </button>
                    </div>
                    <p className="text-[#D4AF37] font-black mt-2">৳{item.price}</p>
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center glass-card border border-[#D4AF37]/20 rounded-xl overflow-hidden">
                        <button 
                          onClick={() => updateQuantity(item.id, -1, item.selectedSize)}
                          className="px-4 py-1.5 hover:bg-[#D4AF37]/10 text-white transition-colors"
                        >
                          <i className="fa-solid fa-minus text-[10px]"></i>
                        </button>
                        <span className="px-4 py-1.5 font-black text-xs text-white border-x border-white/5">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1, item.selectedSize)}
                          className="px-4 py-1.5 hover:bg-[#D4AF37]/10 text-white transition-colors"
                        >
                          <i className="fa-solid fa-plus text-[10px]"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {state.cart.length > 0 && (
            <div className="p-8 bg-black/40 border-t border-[#D4AF37]/20 space-y-6 backdrop-blur-2xl">
              <div className="flex justify-between items-end">
                <span className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">উপ-মোট</span>
                <span className="text-3xl font-black text-[#D4AF37] gold-text-glow">৳{total}</span>
              </div>
              <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest text-center">শিপিং চার্জ পরবর্তী ধাপে যোগ হবে।</p>
              <button 
                onClick={() => {
                  onClose();
                  navigate('/checkout');
                }}
                className="w-full bg-[#D4AF37] hover:bg-white text-black font-black py-5 rounded-2xl transition-all shadow-[0_15px_40px_rgba(212,175,55,0.2)] active:scale-95 uppercase tracking-[0.3em] text-xs"
              >
                চেকআউট করুন
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
