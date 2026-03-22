import React, { useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppContext } from '../App';
import { CategoryIcon } from './CategoryIcons';

const CategorySelection: React.FC = () => {
  const context = useContext(AppContext);
  const { cat: activeCat } = useParams<{ cat: string }>();
  
  if (!context) return null;
  const { state } = context;

  // Find subcategories if a parent category is active
  const subcategories = activeCat ? state.categories.filter(c => c.parentId === activeCat) : [];
  const displayCategories = subcategories.length > 0 ? subcategories : state.categories.filter(c => !c.parentId);

  const getLabel = (catId: string, name: string) => {
    return name;
  };

  return (
    <div className="py-8 overflow-x-auto no-scrollbar scroll-smooth w-full">
      <div className="flex flex-col items-center gap-4">
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-yellow-500/40 blur-2xl rounded-full"></div>
          <h2 className="relative text-xl md:text-2xl font-black uppercase tracking-[0.3em] text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]">
            প্রিমিয়াম কালেকশন
          </h2>
        </div>
        {activeCat && subcategories.length > 0 && (
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-600 mb-2">
            <Link to="/" className="hover:underline">Home</Link>
            <span>/</span>
            <span>{state.categories.find(c => c.id === activeCat)?.name} Subcategories</span>
          </div>
        )}
        <div className="flex justify-start md:justify-center gap-6 md:gap-12 px-6 min-w-max">
          {displayCategories.map((cat) => {
            const isActive = activeCat === cat.id;
            return (
              <Link 
                key={cat.id} 
                to={`/category/${cat.id}`}
                className="group flex flex-col items-center"
              >
                <div className={`relative w-10 h-10 md:w-14 md:h-14 glass-card rounded-2xl flex items-center justify-center border border-cyan-500/50 category-item-glow ${isActive ? 'active' : ''} group-hover:scale-110 active:scale-95 transition-all duration-300 overflow-hidden shadow-[0_0_35px_rgba(6,182,212,0.8)]`}>
                  <div className="absolute inset-0 rounded-2xl bg-cyan-600/70 transition-opacity opacity-100"></div>
                  {/* Digital Grid Overlay - More Visible */}
                  <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #06b6d4 1.5px, transparent 1.5px)', backgroundSize: '10px 10px' }}></div>
                  {/* Lighting Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative z-10 transform group-hover:translate-z-10 transition-transform duration-300">
                    <CategoryIcon 
                      category={cat.id} 
                      image={cat.image}
                      className={cat.image ? "w-full h-full" : "w-5 h-5 md:w-6 md:h-6 text-cyan-400 group-hover:text-cyan-300 transition-all drop-shadow-[0_0_20px_rgba(6,182,212,1)]"} 
                    />
                  </div>
                </div>
                <span className={`mt-3 font-black text-[9px] md:text-[11px] transition-colors tracking-[0.2em] uppercase text-center max-w-[80px] md:max-w-[110px] leading-tight ${isActive ? 'text-cyan-400' : 'text-zinc-500 group-hover:text-cyan-400'}`}>
                  {getLabel(cat.id, cat.name)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategorySelection;