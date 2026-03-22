
import React from 'react';

const FlashSaleBanner: React.FC = () => {
  return (
    <div className="relative h-[300px] md:h-[400px] rounded-3xl overflow-hidden mb-12 bg-gradient-to-r from-blue-700 to-indigo-900 shadow-xl group">
      <img 
        src="https://picsum.photos/1200/400?grayscale&blur=2" 
        className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-700" 
        alt="Banner" 
      />
      <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-8">
        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
          বিশাল <span className="text-yellow-400">অফার</span> চলছে!
        </h1>
        <p className="text-blue-100 text-lg md:text-xl max-w-lg mx-auto font-medium">
          সেরা ব্র্যান্ডের ঘড়ি, গ্যাজেট এবং প্রিমিয়াম সব পোশাকে পেয়ে যান আকর্ষণীয় ছাড়।
        </p>
        <div className="mt-8 flex gap-4">
          <button className="bg-white text-blue-900 font-extrabold px-8 py-4 rounded-2xl shadow-lg hover:shadow-white/20 transition-all">
            শপ নাও
          </button>
          <button className="bg-blue-600/50 backdrop-blur-md border border-white/30 text-white font-extrabold px-8 py-4 rounded-2xl">
            বিস্তারিত
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashSaleBanner;
