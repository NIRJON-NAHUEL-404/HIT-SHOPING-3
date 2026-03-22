import React, { useContext, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import ProductCard from './ProductCard';
import Fuse from 'fuse.js';

const ProductGrid: React.FC = () => {
  const context = useContext(AppContext);
  const { cat } = useParams<{ cat: string }>();
  const navigate = useNavigate();

  if (!context) return null;
  const { state, searchQuery } = context;

  const maxProductPrice = useMemo(() => {
    if (state.products.length === 0) return 100000;
    return Math.max(...state.products.map(p => p.price));
  }, [state.products]);

  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterPriceRange, setFilterPriceRange] = useState<[number, number]>([0, maxProductPrice]);

  // Update max price if products change and current max is less than new max
  React.useEffect(() => {
    if (filterPriceRange[1] > maxProductPrice || filterPriceRange[1] === 100000) {
      setFilterPriceRange([0, maxProductPrice]);
    }
  }, [maxProductPrice]);

  const fuse = useMemo(() => new Fuse(state.products, {
    keys: ['name', 'category', 'description'],
    threshold: 0.4,
  }), [state.products]);

  const filteredProducts = useMemo(() => {
    let ps = state.products;
    
    // 1. Search filter (fuzzy)
    if (searchQuery) {
      ps = fuse.search(searchQuery).map(result => result.item);
    }

    // 2. Route category filter
    if (cat) {
      const categoryName = state.categories.find(c => c.id === cat)?.name;
      ps = ps.filter(p => p.category === cat || p.category === categoryName);
    }

    // 3. Local category filter (only if not on a specific category route)
    if (!cat && filterCategory) {
      ps = ps.filter(p => p.category === filterCategory);
    }

    // 4. Price range filter
    ps = ps.filter(p => p.price >= filterPriceRange[0] && p.price <= filterPriceRange[1]);

    return ps;
  }, [state.products, cat, searchQuery, fuse, filterCategory, filterPriceRange]);

  const hasFlashSale = filteredProducts.some(p => p.flashSaleExpiry && p.flashSaleExpiry > Date.now());

  const getCategoryName = (c: string) => {
    const category = state.categories.find(cat => cat.id === c);
    if (category) {
      const labels: Record<string, string> = {
        'Panjabi': 'পাঞ্জাবি',
        'Formal': 'ফরমাল',
        'ThreePiece': 'থ্রিপিছ',
        'Shirt': 'শার্ট',
        'TShirt': 'টি-শার্ট',
        'Gadget': 'গ্যাজেট',
        'Pant': 'প্যান্ট'
      };
      return labels[c] || category.name;
    }
    return c;
  };

  const allCategories = Array.from(new Set(state.products.map(p => p.category)));

  return (
    <section id="product-grid" className="pb-10 pt-2 scroll-mt-24">
      {cat && (
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div>
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-[#D4AF37] font-black uppercase tracking-[0.3em] text-[10px] mb-8 hover:translate-x-[-8px] transition-transform"
            >
              <i className="fa-solid fa-arrow-left"></i> পিছনে যান
            </button>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 italic tracking-tighter mb-4">
              {getCategoryName(cat)} কালেকশন
            </h2>
            <div className="w-12 h-1 bg-[#D4AF37] mb-4"></div>
          </div>
        </div>
      )}

      {searchQuery && (
        <div className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <div className="flex flex-col md:flex-row gap-6 items-end">
            {!cat && (
              <div className="w-full md:w-1/3">
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">ক্যাটাগরি ফিল্টার</label>
                <select 
                  value={filterCategory} 
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3 outline-none focus:border-[#D4AF37] text-xs font-bold"
                >
                  <option value="">সব ক্যাটাগরি</option>
                  {allCategories.map(c => (
                    <option key={String(c)} value={String(c)}>{getCategoryName(String(c))}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="w-full md:w-1/3">
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">সর্বোচ্চ দাম: ৳{filterPriceRange[1]}</label>
              <input 
                type="range" 
                min="0" 
                max={maxProductPrice} 
                step="500"
                value={filterPriceRange[1]} 
                onChange={(e) => setFilterPriceRange([0, parseInt(e.target.value)])}
                className="w-full accent-[#D4AF37]"
              />
            </div>

            <div className="w-full md:w-1/3 flex justify-end">
               <button 
                onClick={() => { setFilterCategory(''); setFilterPriceRange([0, maxProductPrice]); }}
                className="text-xs font-black text-zinc-500 hover:text-[#D4AF37] uppercase tracking-widest underline"
              >
                রিসেট ফিল্টার
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-6">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-40 glass-card rounded-[3rem] border-2 border-dashed border-gray-300">
          <i className="fa-solid fa-box-open text-7xl text-gray-300 mb-8 block"></i>
          <h3 className="text-2xl font-black text-gray-900 mb-3 uppercase tracking-widest">পণ্য পাওয়া যায়নি</h3>
          <p className="text-gray-500 font-bold">আমাদের অন্যান্য কালেকশনগুলো ট্রাই করুন</p>
          <button onClick={() => navigate('/')} className="mt-8 text-[#D4AF37] font-black underline uppercase text-xs tracking-widest">সব পণ্য দেখুন</button>
        </div>
      )}
    </section>
  );
};

export default ProductGrid;