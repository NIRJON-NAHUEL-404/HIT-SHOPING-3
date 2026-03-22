
import React, { useContext, useEffect, useState } from 'react';
import { Product } from '../types';
import { AppContext } from '../App';
import { CategoryIcon } from './CategoryIcons';

interface ProductCardProps { product: Product; }

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const context = useContext(AppContext);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!product.flashSaleExpiry) return;
    const interval = setInterval(() => {
      const diff = product.flashSaleExpiry! - Date.now();
      if (diff <= 0) { setTimeLeft(null); clearInterval(interval); }
      else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [product.flashSaleExpiry]);

  if (!context) return null;
  const { setSelectedProduct, toggleWishlist, state } = context;
  const categoryDef = state.categories.find(c => c.name === product.category || c.id === product.category);
  const isWishlisted = state.currentUser?.wishlist?.includes(product.id) ?? false;

  const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

  return (
    <div 
      onClick={() => setSelectedProduct(product)}
      className="group bg-white rounded-[1rem] md:rounded-[1.5rem] overflow-hidden flex flex-col relative transition-all duration-500 border border-zinc-200 hover:border-zinc-400 shadow-sm hover:shadow-md cursor-pointer"
    >
      <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md border border-cyan-500/40 text-cyan-500 w-7 h-7 md:w-9 md:h-9 flex items-center justify-center rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-transform group-hover:scale-110 overflow-hidden">
        <div className="absolute inset-0 bg-cyan-500/10"></div>
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)', backgroundSize: '4px 4px' }}></div>
        <CategoryIcon category={product.category} image={categoryDef?.image} className={categoryDef?.image ? "w-full h-full" : "w-4 h-4 md:w-5 md:h-5 relative z-10 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]"} />
      </div>
      
      <button 
        onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
        className={`absolute z-10 bg-white/80 p-2 rounded-full border border-gray-200 hover:border-[#D4AF37] transition-all ${timeLeft ? 'top-10' : 'top-3'} right-3`}
      >
        <i className={`fa-${isWishlisted ? 'solid' : 'regular'} fa-heart text-[#D4AF37] text-[10px]`}></i>
      </button>
      
      {timeLeft && (
        <div className="absolute top-3 right-3 z-10 bg-[#FF3131] text-white text-[7px] md:text-[9px] font-black px-2 md:px-3 py-0.5 md:py-1 rounded-full flex items-center gap-1 shadow-xl animate-pulse">
          <i className="fa-solid fa-bolt text-[6px]"></i> {timeLeft}
        </div>
      )}

      <div className="aspect-[1/1] overflow-hidden bg-gray-100 relative">
        <img 
          src={product.image} 
          alt={product.name} 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-100 via-transparent to-transparent opacity-50"></div>
      </div>

      <div className="p-2 md:p-4 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[#D4AF37] text-[7px] md:text-[9px] font-black uppercase tracking-[0.3em] truncate max-w-[60%]">
            {categoryDef?.name || (product.category.startsWith('C-') ? 'Category' : product.category)}
          </span>
          <div className="flex text-[#D4AF37] text-[8px] gap-0.5">
            <i className="fa-solid fa-star text-[6px]"></i>
            <i className="fa-solid fa-star text-[6px]"></i>
            <i className="fa-solid fa-star text-[6px]"></i>
            <i className="fa-solid fa-star text-[6px]"></i>
            <i className="fa-solid fa-star-half-stroke text-[6px]"></i>
          </div>
        </div>
        
        <h3 className="text-[13px] md:text-[17px] font-black text-gray-900 mb-1 line-clamp-2 leading-snug transition-all group-hover:text-cyan-600 drop-shadow-md bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          {product.name}
        </h3>
        
        <div className="flex items-center gap-1 mb-2">
          <span className="text-xs md:text-lg font-black text-gray-900">৳{product.price}</span>
          {product.originalPrice && (
            <span className="text-[8px] md:text-xs text-gray-500 line-through font-bold">৳{product.originalPrice}</span>
          )}
        </div>

        <div 
          onClick={() => setSelectedProduct(product)}
          className="mt-auto w-full relative overflow-hidden bg-zinc-100 border border-zinc-200 text-zinc-800 group-hover:bg-zinc-800 group-hover:text-white font-black py-1.5 md:py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-1 text-[8px] md:text-[10px] uppercase tracking-widest cursor-pointer"
        >
          বিস্তারিত
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
