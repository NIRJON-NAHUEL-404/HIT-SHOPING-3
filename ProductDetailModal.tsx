import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { CategoryIcon } from './CategoryIcons';

const ProductDetailModal: React.FC = () => {
  const context = useContext(AppContext);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImage, setReviewImage] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const compressImage = (file: File) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max = 800;
        if (width > height && width > max) { height *= max / width; width = max; }
        else if (height > max) { width *= max / height; height = max; }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        setReviewImage(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
  };

  if (!context || !context.selectedProduct) return null;
  const { selectedProduct, setSelectedProduct, addToCart, state, submitReview } = context;

  const approvedReviews = selectedProduct.reviews?.filter(r => r.isApproved) || [];

  const productImages = [selectedProduct.image, ...(selectedProduct.images || [])];
  const currentImage = productImages[activeImageIndex];

  const validVariations = selectedProduct.variations?.filter(v => v.size && v.size.trim() !== '') || [];

  const handleAddToCart = () => {
    if (validVariations.length > 0 && !selectedSize) {
      alert('দয়া করে একটি সাইজ নির্বাচন করুন!');
      return;
    }
    addToCart(selectedProduct, selectedSize ? selectedSize : undefined);
    setSelectedSize('');
  };

  const handleWhatsAppOrder = () => {
    const phone = "8801403250736"; // Admin Phone
    const message = `হ্যালো Royal HIT SHOPING! আমি এই পণ্যটি কিনতে চাই:\n\nনাম: ${selectedProduct.name}\nক্যাটাগরি: ${selectedProduct.category}${selectedSize ? `\nসাইজ: ${selectedSize}` : ''}\nমূল্য: ৳${selectedProduct.price}\n\nধন্যবাদ।`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.currentUser) {
      alert('রিভিউ দিতে দয়া করে লগইন করুন!');
      return;
    }
    if (!reviewComment.trim()) {
      alert('দয়া করে একটি মন্তব্য লিখুন!');
      return;
    }

    setIsSubmittingReview(true);
    try {
      await submitReview(selectedProduct.id, {
        userId: state.currentUser.id,
        userName: state.currentUser.name,
        rating: reviewRating,
        comment: reviewComment,
        image: reviewImage || undefined
      });
      setReviewComment('');
      setReviewRating(5);
      setReviewImage(null);
      alert('আপনার রিভিউটি জমা দেওয়া হয়েছে এবং অ্যাডমিনের অনুমোদনের অপেক্ষায় আছে। ধন্যবাদ!');
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert('রিভিউ জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <>
      {fullScreenImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-[3000] flex items-center justify-center p-4 animate-in zoom-in duration-300 cursor-zoom-out"
          onClick={() => setFullScreenImage(null)}
        >
          <button className="absolute top-6 right-6 text-white text-2xl hover:scale-110 transition-transform">
            <i className="fa-solid fa-xmark"></i>
          </button>
          <img src={fullScreenImage} alt="Full Screen" referrerPolicy="no-referrer" className="max-w-full max-h-full object-contain shadow-2xl" />
        </div>
      )}

      <div className="fixed inset-0 bg-white/90 z-[2500] backdrop-blur-sm overflow-y-auto animate-in fade-in duration-300">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] border border-gray-200 overflow-hidden shadow-2xl my-8 relative">
            <div className="flex flex-col md:flex-row">
            {/* Image Section */}
            <div className="md:w-1/2 flex flex-col bg-gray-50 relative">
              <button 
                onClick={() => {
                  setSelectedProduct(null);
                  setSelectedSize('');
                  setActiveImageIndex(0);
                }}
                className="absolute top-4 left-4 z-20 px-4 h-10 flex items-center justify-center bg-white/80 backdrop-blur-md text-gray-900 rounded-full hover:bg-white transition-all border border-gray-200 shadow-sm text-[10px] font-black uppercase tracking-widest gap-2"
              >
                <i className="fa-solid fa-arrow-left"></i> পিছনে যান
              </button>

              <div 
                className="relative w-full h-[350px] md:h-[600px] overflow-hidden group cursor-pointer bg-gray-100 flex items-center justify-center"
                onClick={() => setFullScreenImage(currentImage)}
              >
                  {/* Blurred Background to fill empty space */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-40 blur-2xl scale-110"
                    style={{ backgroundImage: `url(${currentImage || 'https://picsum.photos/seed/product/800/800'})` }}
                  ></div>
                  
                  <img 
                    src={currentImage || 'https://picsum.photos/seed/product/800/800'} 
                    alt={selectedProduct.name} 
                    referrerPolicy="no-referrer"
                    className="relative z-10 w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 drop-shadow-2xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none z-20"></div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 z-20">
                    <i className="fa-solid fa-expand text-white text-3xl drop-shadow-lg"></i>
                  </div>
                  
                  {/* Navigation Arrows */}
                  {productImages.length > 1 && (
                    <>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveImageIndex(prev => (prev === 0 ? productImages.length - 1 : prev - 1)); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/50 backdrop-blur-md rounded-full text-gray-900 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                      >
                        <i className="fa-solid fa-chevron-left"></i>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveImageIndex(prev => (prev === productImages.length - 1 ? 0 : prev + 1)); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/50 backdrop-blur-md rounded-full text-gray-900 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                      >
                        <i className="fa-solid fa-chevron-right"></i>
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {productImages.length > 1 && (
                  <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar justify-center bg-white border-t border-gray-100">
                    {productImages.map((img, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${activeImageIndex === idx ? 'border-gray-900 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={img} alt={`Thumbnail ${idx}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

            {/* Details Section */}
            <div className="md:w-1/2 p-6 md:p-10 flex flex-col justify-center bg-white">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-cyan-50 rounded-xl flex items-center justify-center border border-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                    <CategoryIcon category={selectedProduct.category} className="w-4 h-4 text-cyan-500 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]" />
                  </div>
                  <span className="text-cyan-600 text-[10px] font-black uppercase tracking-[0.4em] block">{selectedProduct.category}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight mb-4">{selectedProduct.name}</h2>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex text-[#D4AF37] text-xs">
                    {[...Array(5)].map((_, i) => (
                      <i key={i} className={`fa-solid fa-star ${i < Math.floor(selectedProduct.rating) ? '' : 'opacity-30'}`}></i>
                    ))}
                  </div>
                  <span className="text-gray-400 text-[10px] font-bold">({selectedProduct.rating})</span>
                </div>
              </div>
              
              <div className="mb-8">
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed font-medium">{selectedProduct.description || 'প্রিমিয়াম কোয়ালিটি পণ্য।'}</p>
              </div>

              {validVariations.length > 0 && (
                <div className="mb-8">
                  <p className="text-gray-900 text-[10px] font-black uppercase tracking-widest mb-4">সাইজ নির্বাচন:</p>
                  <div className="flex flex-wrap gap-3">
                    {validVariations.map(v => (
                      <button 
                        key={v.size} 
                        onClick={() => setSelectedSize(v.size)} 
                        className={`min-w-[50px] h-12 flex items-center justify-center px-4 rounded-xl border font-black text-[11px] transition-all ${selectedSize === v.size ? 'bg-gray-900 border-gray-900 text-white shadow-lg scale-105' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-400'}`}
                      >
                        {v.size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-baseline gap-4 mb-8">
                <span className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter">৳{selectedProduct.price}</span>
                {selectedProduct.originalPrice && (
                  <span className="text-sm text-gray-400 line-through font-bold">৳{selectedProduct.originalPrice}</span>
                )}
                {selectedProduct.originalPrice && (
                  <span className="bg-red-50 text-red-500 text-[10px] font-black px-2 py-1 rounded-lg">
                    {Math.round(((selectedProduct.originalPrice - selectedProduct.price) / selectedProduct.originalPrice) * 100)}% ছাড়
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={handleAddToCart} className="bg-gray-900 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 text-[10px] md:text-xs uppercase tracking-[0.2em] hover:bg-black">
                  <i className="fa-solid fa-cart-plus"></i> কার্টে যোগ করুন
                </button>
                <button onClick={handleWhatsAppOrder} className="bg-[#25D366] text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 text-[10px] md:text-xs uppercase tracking-[0.2em] hover:bg-[#20bd5a]">
                  <i className="fa-brands fa-whatsapp text-lg"></i> হোয়াটসঅ্যাপে অর্ডার
                </button>
              </div>

              {/* User Reviews Section */}
              <div className="mt-10 pt-8 border-t border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-gray-900 text-[10px] font-black uppercase tracking-widest">কাস্টমার রিভিউ ({approvedReviews.length})</p>
                  <div className="flex items-center gap-1 text-[#D4AF37] text-[10px] font-bold">
                    <i className="fa-solid fa-star"></i>
                    <span>{selectedProduct.rating}</span>
                  </div>
                </div>

                {approvedReviews.length > 0 ? (
                  <div className="space-y-6 mb-8">
                    {approvedReviews.map((review) => (
                      <div key={review.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-900 text-[11px] font-black">{review.userName}</span>
                          <div className="flex text-[#D4AF37] text-[8px]">
                            {[...Array(5)].map((_, i) => (
                              <i key={i} className={`fa-solid fa-star ${i < review.rating ? '' : 'opacity-30'}`}></i>
                            ))}
                          </div>
                        </div>
                        {review.image && (
                          <img 
                            src={review.image} 
                            alt="Review" 
                            onClick={() => setFullScreenImage(review.image!)}
                            referrerPolicy="no-referrer"
                            className="w-full h-32 object-cover rounded-xl mb-3 cursor-pointer hover:opacity-90 transition-opacity" 
                          />
                        )}
                        <p className="text-gray-600 text-[11px] leading-relaxed italic">"{review.comment}"</p>
                        <span className="text-gray-400 text-[8px] mt-2 block">{new Date(review.createdAt).toLocaleDateString('bn-BD')}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-[11px] italic mb-8">এখনো কোনো রিভিউ নেই। প্রথম রিভিউটি আপনি দিন!</p>
                )}

                {/* Review Form */}
                {state.currentUser ? (
                  <form onSubmit={handleSubmitReview} className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                    <p className="text-gray-900 text-[10px] font-black uppercase tracking-widest mb-4">আপনার মতামত দিন</p>
                    <div className="flex gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className={`text-lg transition-all ${star <= reviewRating ? 'text-[#D4AF37] scale-110' : 'text-gray-300 hover:text-[#D4AF37]'}`}
                        >
                          <i className="fa-solid fa-star"></i>
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="আপনার অভিজ্ঞতা শেয়ার করুন..."
                      className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-xs focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none min-h-[100px] resize-none mb-4"
                    ></textarea>
                    
                    <div className="mb-4">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) compressImage(file);
                        }}
                      />
                      {reviewImage ? (
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                          <img src={reviewImage} className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => setReviewImage(null)}
                            className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                          >
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-gray-900 transition-all"
                        >
                          <i className="fa-solid fa-camera text-lg"></i> ছবি যোগ করুন
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="w-full bg-gray-900 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
                    >
                      {isSubmittingReview ? 'জমা হচ্ছে...' : 'রিভিউ জমা দিন'}
                    </button>
                  </form>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 text-center">
                    <p className="text-gray-600 text-[11px] mb-4">রিভিউ দিতে দয়া করে লগইন করুন।</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
);
};

export default ProductDetailModal;