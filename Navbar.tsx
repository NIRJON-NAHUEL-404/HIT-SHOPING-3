
import React, { useContext, useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { Category } from '../types';
import Logo from './Logo';
import { useDebounce } from 'use-debounce';
import Fuse from 'fuse.js';

interface NavbarProps {
  onOpenCart: () => void;
  onOpenProfile: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onOpenCart, onOpenProfile }) => {
  const context = useContext(AppContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounce(localSearchQuery, 300);

  if (!context) return null;
  const { state, searchQuery, setSearchQuery, setSelectedProduct } = context;

  // Sync global search query to local if it changes from outside
  useEffect(() => {
    if (searchQuery !== debouncedSearchQuery) {
      setLocalSearchQuery(searchQuery);
    }
  }, [searchQuery]);

  // Sync debounced query to global
  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) {
      setSearchQuery(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, setSearchQuery]);

  const getIcon = (catId: string, customIcon?: string) => {
    if (customIcon && customIcon.startsWith('fa-')) return customIcon;
    const icons: Record<string, string> = {
      'Panjabi': 'fa-user-tie',
      'Formal': 'fa-briefcase',
      'ThreePiece': 'fa-person-dress',
      'Shirt': 'fa-shirt',
      'TShirt': 'fa-shirt',
      'Gadget': 'fa-mobile-screen',
      'Pant': 'fa-socks'
    };
    return icons[catId] || 'fa-tag';
  };

  const getLabel = (catId: string, name: string) => {
    const labels: Record<string, string> = {
      'Panjabi': 'পাঞ্জাবি',
      'Formal': 'ফরমাল',
      'ThreePiece': 'থ্রিপিছ',
      'Shirt': 'শার্ট',
      'TShirt': 'টি-শার্ট',
      'Gadget': 'গ্যাজেট',
      'Pant': 'প্যান্ট'
    };
    return labels[catId] || name;
  };

  const cartCount = state.cart?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  const fuse = useMemo(() => new Fuse(state.products, {
    keys: ['name', 'category', 'description'],
    threshold: 0.4,
  }), [state.products]);

  const filteredProducts = useMemo(() => {
    if (!localSearchQuery) return [];
    return fuse.search(localSearchQuery).map(result => result.item);
  }, [localSearchQuery, fuse]);

  return (
    <nav className="bg-zinc-100/90 border-b border-zinc-200 sticky top-0 z-[1000] backdrop-blur-2xl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20 md:h-24 gap-4">
          <Link to="/" className="flex-shrink-0 scale-75 md:scale-90">
            <Logo variant="light" />
          </Link>

          {/* Luxury Search Bar */}
          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6 mr-6">
            {state.categories.map((cat) => (
              <Link 
                key={cat.id} 
                to={`/category/${cat.id}`}
                className="text-[10px] font-black text-gray-900 hover:text-[#D4AF37] transition-all uppercase tracking-[0.2em] whitespace-nowrap"
              >
                {cat.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex flex-grow max-w-md relative group mx-4">
            <input 
              type="text" 
              placeholder="পছন্দের পণ্য খুঁজুন..." 
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="w-full bg-zinc-200 text-zinc-900 placeholder-zinc-500 border border-zinc-300 rounded-full px-6 py-2.5 outline-none focus:bg-white focus:border-[#D4AF37] transition-all text-sm"
            />
            <i className="fa-solid fa-magnifying-glass absolute right-5 top-1/2 -translate-y-1/2 text-[#D4AF37] opacity-60 text-[10px]"></i>
            
            {/* Suggestions */}
            {localSearchQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-50 border border-zinc-200 rounded-xl shadow-2xl overflow-hidden z-50">
                {filteredProducts.length > 0 ? (
                  filteredProducts.slice(0, 5).map(p => (
                    <div 
                      key={p.id} 
                      className="flex items-center gap-3 p-3 text-zinc-900 text-xs hover:bg-zinc-100 cursor-pointer" 
                      onClick={() => { setSelectedProduct(p); setLocalSearchQuery(''); setSearchQuery(''); }}
                    >
                      <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded-lg" />
                      <div className="flex flex-col">
                        <span className="font-bold">{p.name}</span>
                        <span className="text-[#D4AF37] font-black">৳{p.price}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-zinc-500 text-xs text-center">কোনো পণ্য পাওয়া যায়নি</div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3 md:space-x-5">
            <a 
              href="https://wa.me/8801403250736" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden md:flex flex-col items-center group"
            >
              <div className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center border border-[#25D366]/30 group-hover:border-[#25D366] transition-all">
                <i className="fa-brands fa-whatsapp text-[#25D366] text-sm"></i>
              </div>
              <span className="text-[7px] text-[#25D366] font-bold uppercase tracking-tighter mt-1 opacity-80">হেল্প</span>
            </a>

            <div className="flex flex-col items-center">
              <button 
                onClick={onOpenProfile}
                className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center border border-zinc-300 group hover:border-[#D4AF37] transition-all"
              >
                <i className="fa-solid fa-user text-[#D4AF37] text-[8px]"></i>
              </button>
              <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-tighter mt-1 opacity-80">ক্রিয়েট একাউন্ট</span>
            </div>

            <button 
              id="cart-icon"
              onClick={onOpenCart}
              className="relative w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center border border-zinc-300 group hover:border-[#D4AF37] transition-all"
            >
              <i className="fa-solid fa-shopping-bag text-[#D4AF37] text-[8px]"></i>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-white text-[8px] font-black px-1 py-0.5 rounded-full border border-white">
                  {cartCount}
                </span>
              )}
            </button>

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#D4AF37] bg-zinc-200 rounded-full w-8 h-8 flex items-center justify-center border border-zinc-300"
            >
              <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars-staggered'} text-sm`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-zinc-50 border-t border-zinc-200 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="p-6">
            <div className="grid grid-cols-2 gap-3 mb-6">
              {state.categories.map((cat) => (
                <Link 
                  key={cat.id} 
                  to={`/category/${cat.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="bg-zinc-100 p-4 rounded-xl flex flex-col items-center gap-2 border border-zinc-200 hover:border-[#D4AF37] transition-all"
                >
                  <i className={`fa-solid ${getIcon(cat.id, cat.icon)} text-[10px] text-[#D4AF37]`}></i>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{getLabel(cat.id, cat.name)}</span>
                </Link>
              ))}
              <a 
                href="https://wa.me/8801403250736" 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-[#25D366]/10 p-4 rounded-xl flex flex-col items-center gap-2 border border-[#25D366]/30 hover:border-[#25D366] transition-all"
              >
                <i className="fa-brands fa-whatsapp text-lg text-[#25D366]"></i>
                <span className="text-[10px] font-bold text-[#25D366] uppercase tracking-widest">হেল্প</span>
              </a>
            </div>
            <div className="relative mb-2">
              <input 
                type="text" 
                placeholder="সার্চ করুন..." 
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="w-full bg-zinc-100 text-zinc-900 border border-zinc-200 rounded-xl px-4 py-3 outline-none text-xs"
              />
              <i className="fa-solid fa-magnifying-glass absolute right-4 top-1/2 -translate-y-1/2 text-[#D4AF37] opacity-60 text-[10px]"></i>
              
              {/* Mobile Suggestions */}
              {localSearchQuery && (
                <div className="mt-2 bg-zinc-50 border border-zinc-200 rounded-xl shadow-2xl overflow-hidden">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.slice(0, 5).map(p => (
                      <div 
                        key={p.id} 
                        className="flex items-center gap-3 p-3 text-zinc-900 text-xs hover:bg-zinc-100 cursor-pointer" 
                        onClick={() => { setSelectedProduct(p); setLocalSearchQuery(''); setSearchQuery(''); setMobileMenuOpen(false); }}
                      >
                        <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded-lg" />
                        <div className="flex flex-col">
                          <span className="font-bold">{p.name}</span>
                          <span className="text-[#D4AF37] font-black">৳{p.price}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-zinc-500 text-xs text-center">কোনো পণ্য পাওয়া যায়নি</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
