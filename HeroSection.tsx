import React, { useState, useEffect } from 'react';

const HeroSection: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({ h: '05', m: '20', s: '10' });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let h = parseInt(prev.h);
        let m = parseInt(prev.m);
        let s = parseInt(prev.s);
        if (s > 0) s--;
        else if (m > 0) { s = 59; m--; }
        else if (h > 0) { s = 59; m = 59; h--; }
        return {
          h: h.toString().padStart(2, '0'),
          m: m.toString().padStart(2, '0'),
          s: s.toString().padStart(2, '0')
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleShopNow = () => {
    const grid = document.getElementById('product-grid');
    if (grid) {
      grid.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative rounded-[1rem] md:rounded-[2rem] overflow-hidden bg-zinc-200 h-[200px] md:h-[300px] border border-zinc-300 cinematic-in shadow-sm group">
      {/* Background Image - Significantly Smaller Height */}
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80" 
          alt="Luxury Collection" 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-60 scale-100 group-hover:scale-105 transition-transform duration-[2s]"
        />
        <div className="absolute inset-0 bg-zinc-200/40"></div>
      </div>
      
      <div className="relative h-full container mx-auto px-6 md:px-12 flex flex-col justify-center items-center text-center z-20">
        <div className="bg-zinc-800/20 backdrop-blur-sm px-4 py-1 rounded-full mb-3 md:mb-5 border border-zinc-800/40 text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-zinc-900">
          লিমিটেড অফার
        </div>
        
        <h1 className="text-lg md:text-2xl font-black text-zinc-900 mb-2 md:mb-3 leading-tight tracking-tighter italic">
          <span className="bg-zinc-900 text-white px-2 py-0.5 rounded">বিশাল অফার</span> চলছে<br/> 
          <span className="text-xs md:text-xl text-zinc-900 mt-2 md:mt-4 block font-bold tracking-[0.2em] uppercase border-b border-zinc-900 pb-1">এখনই কেনাকাটা করুন</span>
        </h1>
        
        {/* Extra Compact Luxury Timer */}
        <div className="flex gap-2.5 md:gap-6 mb-4 md:mb-8">
          {[
            { v: timeLeft.h, l: 'ঘন্টা' },
            { v: timeLeft.m, l: 'মিনিট' },
            { v: timeLeft.s, l: 'সেকেন্ড' }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="bg-white/80 w-10 h-14 md:w-16 md:h-20 rounded-lg md:rounded-2xl flex items-center justify-center border border-zinc-300 shadow-inner">
                <span className="text-base md:text-3xl font-black text-zinc-900 font-mono">
                  {item.v}
                </span>
              </div>
              <span className="text-[7px] md:text-[9px] font-black text-zinc-600 mt-1 md:mt-2 uppercase tracking-widest">{item.l}</span>
            </div>
          ))}
        </div>

        <button 
          onClick={handleShopNow}
          className="bg-zinc-900 text-white font-black px-5 py-2 md:px-10 md:py-3 rounded-full hover:scale-105 transition-all active:scale-95 text-[7px] md:text-sm uppercase tracking-[0.2em]"
        >
          শপ কালেকশন
        </button>
      </div>
    </div>
  );
};

export default HeroSection;