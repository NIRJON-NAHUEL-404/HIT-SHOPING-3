import React, { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { Category, CategoryDef, Product, OrderStatus, Order, User } from '../types';
import Logo from './Logo';
import { auth } from '../firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'categories' | 'orders' | 'customers' | 'marketing' | 'reviews' | 'settings' | 'staff'>('overview');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [chargeInputInside, setChargeInputInside] = useState<number>(context?.state.shippingRates?.insideDhaka || 80);
  const [chargeInputOutside, setChargeInputOutside] = useState<number>(context?.state.shippingRates?.outsideDhaka || 150);
  const [paymentNumberInput, setPaymentNumberInput] = useState<string>(context?.state.paymentNumber || '01403-250736');
  const [newAnnouncement, setNewAnnouncement] = useState('');
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [flashSaleHours, setFlashSaleHours] = useState<number>(0);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ 
    category: 'Watch', price: 0, image: '', images: [], description: '', flashSaleExpiry: 0, variations: [], sku: '', stock: 0, reviewScreenshots: []
  });

  // New states for Categories
  const [newCategory, setNewCategory] = useState({ name: '', parentId: '', icon: '', image: '' });
  const [editingCategory, setEditingCategory] = useState<CategoryDef | null>(null);

  // New states for Coupons
  const [newCoupon, setNewCoupon] = useState({ code: '', discountPercentage: 0, isActive: true });

  // New states for Banners
  const [newBanner, setNewBanner] = useState({ imageUrl: '', link: '' });

  // New states for Site Settings
  const [siteSettingsInput, setSiteSettingsInput] = useState(context?.state.siteSettings || { logoName: 'Royal HIT SHOPING', logoUrl: '', contactNumber: '01403-250736', facebookUrl: '', instagramUrl: '', footerCopyright: '© Royal HIT SHOPING' });

  // New states for SMTP
  const [smtpConfig, setSmtpConfig] = useState({ host: '', port: '587', user: '', pass: '', from: '' });
  const [smtpLoading, setSmtpLoading] = useState(false);

  // New states for Staff
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', role: 'Editor' as 'Manager' | 'Editor' });

  // Custom Modals State
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; message: string; onConfirm: () => void }>({ isOpen: false, message: '', onConfirm: () => {} });
  const [alertDialog, setAlertDialog] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });

  const showAlert = (message: string) => setAlertDialog({ isOpen: true, message });
  const showConfirm = (message: string, onConfirm: () => void) => setConfirmDialog({ isOpen: true, message, onConfirm });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user?.email === 'savlogging2.0@gmail.com') {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
        if (user) {
          navigate('/');
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (isAuthorized) {
      fetch('/api/smtp-config')
        .then(res => res.json())
        .then(data => {
          if (data.host) {
            setSmtpConfig({
              host: data.host || '',
              port: data.port?.toString() || '587',
              user: data.user || '',
              pass: data.pass || '',
              from: data.from || ''
            });
          }
        })
        .catch(err => console.error('Failed to fetch SMTP config:', err));
    }
  }, [isAuthorized]);

  if (!context) return null;
  const { 
    state, updateProducts, deleteProduct: contextDeleteProduct, updatePaymentNumber, 
    updateOrderStatus, deleteOrder: contextDeleteOrder, updateAnnouncements, updateCategories, updateCoupons, updateBanners, 
    updateSiteSettings, updateShippingRates, updateUsers,
    submitReview, updateReviewStatus,
    saveProduct, saveCategory, saveCoupon, saveBanner, saveUser, updateGeneralSettings,
    deleteCategory: contextDeleteCategory, deleteCoupon: contextDeleteCoupon, deleteBanner: contextDeleteBanner, deleteUser: contextDeleteUser
  } = context;

  const handleAdminLogin = async () => {
    try {
      const { googleProvider } = await import('../firebase');
      const { signInWithPopup } = await import('firebase/auth');
      const result = await signInWithPopup(auth, googleProvider);
      
      if (result.user.email !== 'savlogging2.0@gmail.com') {
        await auth.signOut();
        showAlert('আপনার এই ইমেইলটি অ্যাডমিন হিসেবে অনুমোদিত নয়!');
        navigate('/');
      }
    } catch (error) {
      console.error('Admin login error:', error);
    }
  };

  const handleEdit = (p: Product) => {
    setEditingProduct(p);
    setNewProduct(p);
    if (p.flashSaleExpiry && p.flashSaleExpiry > Date.now()) {
      setFlashSaleHours(Math.round((p.flashSaleExpiry - Date.now()) / 3600000));
    } else {
      setFlashSaleHours(0);
    }
  };

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file: File) => {
        compressImage(file, (base64) => {
          setNewProduct(prev => {
            if (!prev.image) {
              return { ...prev, image: base64 };
            } else {
              return { ...prev, images: [...(prev.images || []), base64] };
            }
          });
        });
      });
    }
  };

  const handleReviewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, (base64) => {
        setNewProduct(prev => ({ ...prev, reviewScreenshots: [...(prev.reviewScreenshots || []), base64] }));
      });
    }
  };

  const handleCategoryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, (base64) => {
        setNewCategory(prev => ({ ...prev, image: base64 }));
      });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, (base64) => {
        setSiteSettingsInput(prev => ({ ...prev, logoUrl: base64 }));
      });
    }
  };

  const handleEditCategory = (cat: CategoryDef) => {
    setEditingCategory(cat);
    setNewCategory({ name: cat.name, parentId: cat.parentId || '', icon: cat.icon || '', image: cat.image || '' });
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name) return;
    
    const categoryData: CategoryDef = { 
      ...newCategory, 
      id: editingCategory ? editingCategory.id : newCategory.name.replace(/\s+/g, '') 
    };

    if (saveCategory) {
      await saveCategory(categoryData);
    } else {
      if (editingCategory) {
        updateCategories((state.categories || []).map(c => c.id === editingCategory.id ? categoryData : c));
      } else {
        updateCategories([...(state.categories || []), categoryData]);
      }
    }

    setNewCategory({ name: '', parentId: '', icon: '', image: '' });
    setEditingCategory(null);
    showAlert(editingCategory ? 'ক্যাটাগরি আপডেট হয়েছে!' : 'ক্যাটাগরি যোগ হয়েছে!');
  };

  const deleteCategory = async (id: string) => {
    showConfirm('আপনি কি নিশ্চিত?', async () => {
      try {
        if (contextDeleteCategory) await contextDeleteCategory(id);
        else updateCategories((state.categories || []).filter(c => c.id !== id));
      } catch (error: any) {
        console.error("Error deleting category:", error);
        showAlert(`ডিলিট করতে সমস্যা হয়েছে: ${error.message}`);
      }
    });
  };

  const handleDeleteAllCategories = async () => {
    showConfirm('আপনি কি নিশ্চিত যে সব ক্যাটাগরি ডিলিট করতে চান?', async () => {
      try {
        const categories = state.categories || [];
        for (const cat of categories) {
          if (contextDeleteCategory) await contextDeleteCategory(cat.id);
        }
        if (!contextDeleteCategory) updateCategories([]);
        showAlert('সব ক্যাটাগরি ডিলিট করা হয়েছে!');
      } catch (error: any) {
        console.error("Error deleting all categories:", error);
        showAlert(`ডিলিট করতে সমস্যা হয়েছে: ${error.message}`);
      }
    });
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code) return;
    const couponData = { ...newCoupon, id: `CP-${Date.now()}` };
    if (saveCoupon) await saveCoupon(couponData);
    else updateCoupons([...(state.coupons || []), couponData]);
    setNewCoupon({ code: '', discountPercentage: 0, isActive: true });
    showAlert('কুপন যোগ হয়েছে!');
  };

  const deleteCoupon = async (id: string) => {
    showConfirm('আপনি কি নিশ্চিত?', async () => {
      try {
        if (context.deleteCoupon) await context.deleteCoupon(id);
        else updateCoupons((state.coupons || []).filter(c => c.id !== id));
      } catch (error: any) {
        console.error("Error deleting coupon:", error);
        showAlert(`ডিলিট করতে সমস্যা হয়েছে: ${error.message}`);
      }
    });
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBanner.imageUrl) return;
    const bannerData = { ...newBanner, id: `B-${Date.now()}`, isActive: true };
    if (saveBanner) await saveBanner(bannerData);
    else updateBanners([...(state.banners || []), bannerData]);
    setNewBanner({ imageUrl: '', link: '' });
    showAlert('ব্যানার যোগ হয়েছে!');
  };

  const deleteBanner = async (id: string) => {
    showConfirm('আপনি কি নিশ্চিত?', async () => {
      try {
        if (contextDeleteBanner) await contextDeleteBanner(id);
        else updateBanners((state.banners || []).filter(b => b.id !== id));
      } catch (error: any) {
        console.error("Error deleting banner:", error);
        showAlert(`ডিলিট করতে সমস্যা হয়েছে: ${error.message}`);
      }
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.image) { showAlert('ছবি আপলোড করুন!'); return; }
    
    const expiry = flashSaleHours > 0 ? Date.now() + (flashSaleHours * 3600000) : 0;
    
    const productData = editingProduct ? { ...editingProduct, ...newProduct, flashSaleExpiry: expiry } : {
      ...newProduct, id: `P-${Date.now()}`, flashSaleExpiry: expiry
    } as Product;

    if (saveProduct) {
      await saveProduct(productData);
    } else {
      if (editingProduct) updateProducts(state.products.map(p => p.id === editingProduct.id ? productData : p));
      else updateProducts([...state.products, productData]);
    }
    
    setEditingProduct(null);
    setNewProduct({ category: 'Watch', price: 0, image: '', images: [], description: '', flashSaleExpiry: 0, reviewScreenshots: [] });
    setFlashSaleHours(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    showAlert('সফলভাবে আপডেট হয়েছে!');
  };

  const deleteProduct = async (id: string) => {
    showConfirm('আপনি কি নিশ্চিত?', async () => {
      try {
        if (contextDeleteProduct) {
           await contextDeleteProduct(id);
        } else {
           updateProducts((state.products || []).filter(p => p.id !== id));
        }
      } catch (error: any) {
        console.error("Error deleting product:", error);
        showAlert(`ডিলিট করতে সমস্যা হয়েছে: ${error.message}`);
      }
    });
  };

  const handleDeleteAllProducts = async () => {
    showConfirm('আপনি কি নিশ্চিত যে সব পণ্য ডিলিট করতে চান? এটি আর ফিরে পাওয়া যাবে না!', async () => {
      try {
        const products = state.products || [];
        for (const product of products) {
          if (contextDeleteProduct) await contextDeleteProduct(product.id);
        }
        if (!contextDeleteProduct) updateProducts([]);
        showAlert('সব পণ্য ডিলিট করা হয়েছে!');
      } catch (error: any) {
        console.error("Error deleting all products:", error);
        showAlert(`ডিলিট করতে সমস্যা হয়েছে: ${error.message}`);
      }
    });
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.email || !newStaff.password) return;
    
    // In a real app, you would create the user in Firebase Auth here.
    // For this prototype, we just add them to the local state.
    const staffUser: User = {
      id: `U-${Date.now()}`,
      name: newStaff.name,
      email: newStaff.email,
      password: newStaff.password,
      role: newStaff.role,
      address: '',
      phone: '',
      notifications: [],
      wishlist: []
    };

    if (saveUser) await saveUser(staffUser);
    else updateUsers([...state.users, staffUser]);
    setNewStaff({ name: '', email: '', password: '', role: 'Editor' });
    showAlert('স্টাফ সফলভাবে যোগ করা হয়েছে!');
  };

  const removeStaff = async (id: string) => {
    showConfirm('আপনি কি নিশ্চিত যে এই স্টাফকে রিমুভ করতে চান?', async () => {
      try {
        if (contextDeleteUser) await contextDeleteUser(id);
        else updateUsers(state.users.filter(u => u.id !== id));
      } catch (error: any) {
        console.error("Error removing staff:", error);
        showAlert(`রিমুভ করতে সমস্যা হয়েছে: ${error.message}`);
      }
    });
  };

  const deleteOrder = async (id: string) => {
    showConfirm('আপনি কি নিশ্চিত?', async () => {
      try {
        if (contextDeleteOrder) {
           await contextDeleteOrder(id);
        } else {
           // Fallback if needed
           // updateOrders is not defined in AdminDashboard, so we can't do local fallback easily without it.
           // But contextDeleteOrder handles local fallback in App.tsx if fsDeleteOrder is missing.
        }
      } catch (error: any) {
        console.error("Error deleting order:", error);
        showAlert(`ডিলিট করতে সমস্যা হয়েছে: ${error.message}`);
      }
    });
  };

  const totalSales = state.orders.filter(o => o.status === OrderStatus.CONFIRMED || o.status === OrderStatus.DELIVERED).reduce((acc, o) => acc + o.total, 0);
  const pendingOrders = state.orders.filter(o => o.status === OrderStatus.PENDING).length;
  const newCustomers = state.users.filter(u => u.role === 'Customer' || !u.role).length; // Simplified

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 cinematic-in flex flex-col items-center justify-center min-h-[60vh]">
        <Logo className="mb-10" />
        <button 
          onClick={handleAdminLogin}
          className="bg-gray-900 text-white font-black py-4 px-10 rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all uppercase tracking-[0.3em] text-xs flex items-center gap-3"
        >
          <i className="fa-brands fa-google"></i> অ্যাডমিন লগইন
        </button>
      </div>
    );
  }

  const currentUserRole = 'Admin'; // Only savlogging2.0@gmail.com can access now

  const tabs = [
    { id: 'overview', label: 'ড্যাশবোর্ড', icon: 'fa-chart-line', roles: ['Admin'] },
    { id: 'products', label: 'পণ্য', icon: 'fa-boxes-stacked', roles: ['Admin'] },
    { id: 'categories', label: 'ক্যাটাগরি', icon: 'fa-folder-tree', roles: ['Admin'] },
    { id: 'orders', label: 'অর্ডার', icon: 'fa-receipt', roles: ['Admin'] },
    { id: 'customers', label: 'কাস্টমার', icon: 'fa-users', roles: ['Admin'] },
    { id: 'marketing', label: 'মার্কেটিং', icon: 'fa-bullhorn', roles: ['Admin'] },
    { id: 'reviews', label: 'রিভিউ', icon: 'fa-star', roles: ['Admin'] },
    { id: 'settings', label: 'সেটিংস', icon: 'fa-gears', roles: ['Admin'] }
  ].filter(tab => tab.roles.includes(currentUserRole));

  return (
    <div className="w-full max-w-[1800px] mx-auto cinematic-in px-4 md:px-8 xl:px-12 mb-20">
      <div className="flex bg-white border border-gray-200 p-1.5 rounded-2xl mb-8 overflow-x-auto no-scrollbar gap-1.5 sticky top-24 z-50 shadow-lg lg:hidden">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setSelectedOrder(null); }}
            className={`flex-grow flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <i className={`fa-solid ${tab.icon} text-xs`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="hidden lg:block lg:w-60 flex-shrink-0">
          <div className="bg-white p-8 rounded-[2rem] sticky top-32 border border-gray-200 shadow-xl">
            <Logo className="scale-75 mb-10" />
            <nav className="space-y-2">
              {tabs.map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as any); setSelectedOrder(null); }}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-gray-500 hover:bg-gray-50 hover:text-cyan-600'}`}
                >
                  <i className={`fa-solid ${tab.icon} text-xs`}></i>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-grow">
          <div className="bg-white rounded-[2.5rem] border border-gray-200 p-5 md:p-10 shadow-xl relative overflow-hidden">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">আজকের সেলস</p>
                    <p className="text-2xl font-black text-gray-900">৳{totalSales}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">মোট অর্ডার</p>
                    <p className="text-2xl font-black text-gray-900">{state.orders.length}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">নতুন কাস্টমার</p>
                    <p className="text-2xl font-black text-gray-900">{newCustomers}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 h-80">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em] mb-6">গত ৭ দিনের সেলস গ্রাফ</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={state.orders.slice(-7).map(o => ({ name: new Date(o.createdAt).toLocaleDateString(), sales: o.total }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                      <YAxis stroke="#9ca3af" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #06b6d4', borderRadius: '12px' }} />
                      <Line type="monotone" dataKey="sales" stroke="#06b6d4" strokeWidth={3} dot={{ fill: '#06b6d4' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em] mb-6">সর্বশেষ ১০টি অর্ডার</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">অর্ডার আইডি</th>
                          <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">কাস্টমার</th>
                          <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">স্ট্যাটাস</th>
                          <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">টাকার পরিমাণ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.orders.slice(0, 10).map(order => (
                          <tr key={order.id} className="border-b border-gray-100 hover:bg-white transition-colors">
                            <td className="p-3 text-xs font-bold text-gray-900">#{order.id.split('-')[1].slice(-5)}</td>
                            <td className="p-3 text-xs text-gray-600">{order.shippingDetails.name}</td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                order.status === OrderStatus.DELIVERED ? 'bg-green-100 text-green-600' :
                                order.status === OrderStatus.SHIPPED ? 'bg-blue-100 text-blue-600' :
                                order.status === OrderStatus.PROCESSING ? 'bg-purple-100 text-purple-600' :
                                order.status === OrderStatus.CONFIRMED ? 'bg-cyan-100 text-cyan-600' :
                                order.status === OrderStatus.CANCELLED ? 'bg-red-100 text-red-600' :
                                'bg-yellow-100 text-yellow-600'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="p-3 text-xs font-black text-gray-900">৳{order.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em]">পণ্য ম্যানেজমেন্ট</h3>
                  <div className="flex gap-4">
                    <button 
                      onClick={async () => {
                        showConfirm('আপনি কি ডেমো পণ্যগুলো অ্যাড করতে চান?', async () => {
                          const demoProducts = [
                            {
                              id: 'demo-panjabi-1',
                              name: 'Royal Blue Cotton Panjabi',
                              price: 1850,
                              originalPrice: 2200,
                              category: 'Panjabi',
                              image: 'https://picsum.photos/seed/panjabi1/800/1000',
                              description: 'Premium quality cotton panjabi for any occasion. Comfortable and stylish.',
                              variations: [{ size: '40', color: 'Blue', stock: 10 }, { size: '42', color: 'Blue', stock: 5 }],
                              rating: 4.8,
                              tags: ['new', 'cotton']
                            },
                            {
                              id: 'demo-panjabi-2',
                              name: 'White Silk Panjabi',
                              price: 2500,
                              originalPrice: 3000,
                              category: 'Panjabi',
                              image: 'https://picsum.photos/seed/panjabi2/800/1000',
                              description: 'Elegant white silk panjabi with fine embroidery. Perfect for festivals.',
                              variations: [{ size: '40', color: 'White', stock: 8 }, { size: '44', color: 'White', stock: 3 }],
                              rating: 4.9,
                              tags: ['premium', 'silk']
                            },
                            {
                              id: 'demo-shirt-1',
                              name: 'Casual Check Shirt',
                              price: 1200,
                              originalPrice: 1500,
                              category: 'Shirt',
                              image: 'https://picsum.photos/seed/shirt1/800/1000',
                              description: 'Stylish check shirt for casual wear. Made from breathable fabric.',
                              variations: [{ size: 'M', color: 'Red/Black', stock: 15 }, { size: 'L', color: 'Red/Black', stock: 10 }],
                              rating: 4.5,
                              tags: ['casual', 'check']
                            },
                            {
                              id: 'demo-shirt-2',
                              name: 'Formal White Shirt',
                              price: 1500,
                              originalPrice: 1800,
                              category: 'Shirt',
                              image: 'https://picsum.photos/seed/shirt2/800/1000',
                              description: 'Classic white formal shirt. Essential for every wardrobe.',
                              variations: [{ size: 'M', color: 'White', stock: 20 }, { size: 'XL', color: 'White', stock: 12 }],
                              rating: 4.7,
                              tags: ['formal', 'white']
                            },
                            {
                              id: 'demo-pant-1',
                              name: 'Slim Fit Denim Jeans',
                              price: 1650,
                              originalPrice: 2000,
                              category: 'Pant',
                              image: 'https://picsum.photos/seed/pant1/800/1000',
                              description: 'High-quality slim fit denim jeans. Durable and comfortable.',
                              variations: [{ size: '32', color: 'Dark Blue', stock: 12 }, { size: '34', color: 'Dark Blue', stock: 8 }],
                              rating: 4.6,
                              tags: ['denim', 'slim-fit']
                            },
                            {
                              id: 'demo-pant-2',
                              name: 'Formal Gabardine Pant',
                              price: 1400,
                              originalPrice: 1700,
                              category: 'Pant',
                              image: 'https://picsum.photos/seed/pant2/800/1000',
                              description: 'Premium gabardine pant for formal and semi-formal wear.',
                              variations: [{ size: '30', color: 'Black', stock: 10 }, { size: '32', color: 'Black', stock: 15 }],
                              rating: 4.7,
                              tags: ['formal', 'gabardine']
                            }
                          ];
                          
                          for (const p of demoProducts) {
                            if (saveProduct) await saveProduct(p as any);
                          }
                          showAlert('ডেমো পণ্যগুলো সফলভাবে যোগ করা হয়েছে!');
                        });
                      }}
                      className="bg-cyan-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-600 transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
                    >
                      <i className="fa-solid fa-seedling"></i> ডেমো পণ্য যোগ করুন
                    </button>
                    {state.products && state.products.length > 0 && (
                      <button 
                        onClick={handleDeleteAllProducts}
                        className="bg-red-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 flex items-center gap-2"
                      >
                        <i className="fa-solid fa-trash-can"></i> সব ডিলিট করুন
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <div className="flex gap-4 items-center">
                    <input type="text" placeholder="পণ্য খুঁজুন (নাম বা আইডি)..." className="bg-white border border-gray-200 p-3 rounded-xl text-xs w-64 focus:border-cyan-500 outline-none" />
                    <select className="bg-white border border-gray-200 p-3 rounded-xl text-xs focus:border-cyan-500 outline-none">
                      <option value="">সব ক্যাটাগরি</option>
                      {state.categories?.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-4 items-center">
                    <select className="bg-white border border-gray-200 p-3 rounded-xl text-xs focus:border-cyan-500 outline-none">
                      <option value="">বাল্ক অ্যাকশন</option>
                      <option value="delete">ডিলিট করুন</option>
                      <option value="category">ক্যাটাগরি পরিবর্তন</option>
                    </select>
                    <button className="bg-gray-900 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all">অ্যাপ্লাই</button>
                  </div>
                </div>

                <form onSubmit={handleSaveProduct} className="bg-gray-50 p-8 rounded-3xl border border-gray-200 space-y-6">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em] mb-6">{editingProduct ? 'পণ্য এডিট করুন' : 'নতুন পণ্য যোগ করুন'}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">পণ্যের নাম</label>
                      <input type="text" placeholder="পণ্যের নাম" value={newProduct.name || ''} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-white border border-gray-200 p-4 rounded-xl text-gray-900 text-xs focus:border-cyan-500 outline-none" required />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">রেগুলার দাম</label>
                      <input type="number" placeholder="রেগুলার দাম" value={newProduct.originalPrice || ''} onChange={e => setNewProduct({...newProduct, originalPrice: Number(e.target.value)})} className="w-full bg-white border border-gray-200 p-4 rounded-xl text-gray-900 text-xs focus:border-cyan-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">সেল দাম</label>
                      <input type="number" placeholder="সেল দাম" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} className="w-full bg-white border border-gray-200 p-4 rounded-xl text-gray-900 text-xs focus:border-cyan-500 outline-none" required />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">SKU কোড</label>
                      <input type="text" placeholder="SKU কোড" value={newProduct.sku || ''} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} className="w-full bg-white border border-gray-200 p-4 rounded-xl text-gray-900 text-xs focus:border-cyan-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">স্টক পরিমাণ</label>
                      <input type="number" placeholder="স্টক পরিমাণ" value={newProduct.stock || ''} onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})} className="w-full bg-white border border-gray-200 p-4 rounded-xl text-gray-900 text-xs focus:border-cyan-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">ক্যাটাগরি</label>
                      <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value as any})} className="w-full bg-white border border-gray-200 p-4 rounded-xl text-gray-900 text-xs focus:border-cyan-500 outline-none">
                        {state.categories?.filter(c => !c.parentId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        {(!state.categories || state.categories.length === 0) && ['Watch', 'Panjabi', 'T-Shirt', 'Shoe', 'Gadget'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">ফ্ল্যাশ সেল (ঘন্টা - ০ মানে বন্ধ)</label>
                      <input type="number" placeholder="ফ্ল্যাশ সেল ঘন্টা" value={flashSaleHours} onChange={e => setFlashSaleHours(Number(e.target.value))} className="w-full bg-white border border-gray-200 p-4 rounded-xl text-gray-900 text-xs focus:border-cyan-500 outline-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">পণ্যের বিবরণ</label>
                    <textarea placeholder="পণ্যের বিবরণ" value={newProduct.description || ''} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full bg-white border border-gray-200 p-4 rounded-xl text-gray-900 text-xs focus:border-cyan-500 outline-none h-32" required />
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest ml-2">ভ্যারিয়েশন (সাইজ/স্টক)</h4>
                    {newProduct.variations?.map((v, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input type="text" placeholder="সাইজ" value={v.size} onChange={e => setNewProduct({...newProduct, variations: newProduct.variations?.map((varr, i) => i === idx ? {...varr, size: e.target.value} : varr)})} className="bg-white border border-gray-200 p-3 rounded-lg text-gray-900 text-xs flex-grow focus:border-cyan-500 outline-none" />
                        <input type="number" placeholder="স্টক" value={v.stock} onChange={e => setNewProduct({...newProduct, variations: newProduct.variations?.map((varr, i) => i === idx ? {...varr, stock: Number(e.target.value)}: varr)})} className="bg-white border border-gray-200 p-3 rounded-lg text-gray-900 text-xs w-24 focus:border-cyan-500 outline-none" />
                        <button type="button" onClick={() => setNewProduct({...newProduct, variations: newProduct.variations?.filter((_, i) => i !== idx)})} className="text-red-500 px-2 hover:bg-red-50 rounded-lg transition-all"><i className="fa-solid fa-trash"></i></button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setNewProduct({...newProduct, variations: [...(newProduct.variations || []), { size: '', stock: 0 }]})} className="text-cyan-600 text-xs font-black uppercase tracking-widest hover:text-cyan-700">+ ভ্যারিয়েশন যোগ করুন</button>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest ml-2">গ্রাহকের রিভিউ (স্ক্রিনশট)</h4>
                    <div className="flex flex-wrap gap-4 items-center">
                      {(newProduct.reviewScreenshots || []).map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img src={img} className="h-16 w-16 object-cover rounded-xl border border-gray-200" />
                          <button type="button" onClick={() => setNewProduct({...newProduct, reviewScreenshots: newProduct.reviewScreenshots?.filter((_, i) => i !== idx)})} className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><i className="fa-solid fa-xmark"></i></button>
                        </div>
                      ))}
                      <label className="h-16 w-16 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500 transition-all text-gray-400 hover:text-cyan-500">
                        <i className="fa-solid fa-plus text-xs"></i>
                        <span className="text-[10px]">রিভিউ</span>
                        <input type="file" onChange={handleReviewImageUpload} className="hidden" accept="image/*" />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest ml-2">পণ্যের ছবি (প্রথমটি কভার হিসেবে ব্যবহৃত হবে)</h4>
                    <div className="flex flex-wrap gap-4 items-center">
                      {newProduct.image && (
                        <div className="relative group">
                          <img src={newProduct.image} className="h-24 w-24 object-cover rounded-xl border-2 border-cyan-500" />
                          <button type="button" onClick={() => setNewProduct({...newProduct, image: newProduct.images?.[0] || '', images: newProduct.images?.slice(1) || []})} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center shadow-lg"><i className="fa-solid fa-xmark"></i></button>
                          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-cyan-500 text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase">Cover</span>
                        </div>
                      )}
                      {(newProduct.images || []).map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img src={img} className="h-24 w-24 object-cover rounded-xl border border-gray-200" />
                          <button type="button" onClick={() => setNewProduct({...newProduct, images: newProduct.images?.filter((_, i) => i !== idx)})} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center shadow-lg"><i className="fa-solid fa-xmark"></i></button>
                        </div>
                      ))}
                      <label className="h-24 w-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500 transition-all text-gray-400 hover:text-cyan-500 bg-white">
                        <i className="fa-solid fa-plus text-lg mb-1"></i>
                        <span className="text-[10px] font-black uppercase">ছবি যোগ করুন</span>
                        <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" multiple />
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 items-center pt-4">
                    <button type="submit" className="bg-cyan-500 text-white px-10 py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-cyan-600 transition-all ml-auto shadow-lg shadow-cyan-500/20">
                      {editingProduct ? 'আপডেট করুন' : 'যোগ করুন'}
                    </button>
                    {editingProduct && <button type="button" onClick={() => { setEditingProduct(null); setNewProduct({ category: 'Watch', price: 0, image: '', images: [], description: '', flashSaleExpiry: 0, reviewScreenshots: [] }); }} className="bg-gray-200 text-gray-900 px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-300 transition-all">বাতিল</button>}
                  </div>
                </form>

                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">পণ্য</th>
                        <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">দাম</th>
                        <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">স্টক</th>
                        <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {state.products.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-all group">
                          <td className="py-5 px-4">
                            <div className="flex items-center gap-3">
                              <img src={p.image} className="w-10 h-10 rounded-lg object-cover" />
                              <span className="text-[10px]">{p.name}</span>
                            </div>
                          </td>
                          <td className="py-5 px-4 text-xs font-black text-cyan-600">৳{p.price}</td>
                          <td className="py-5 px-4 text-xs text-gray-500 font-bold">{p.variations?.reduce((acc, v) => acc + v.stock, 0) || 0}</td>
                          <td className="py-5 px-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => handleEdit(p)} className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all"><i className="fa-solid fa-pen-to-square"></i></button>
                              <button onClick={() => deleteProduct(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"><i className="fa-solid fa-trash"></i></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'categories' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em]">ক্যাটাগরি ম্যানেজমেন্ট</h3>
                  {state.categories && state.categories.length > 0 && (
                    <button 
                      onClick={handleDeleteAllCategories}
                      className="bg-red-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 flex items-center gap-2"
                    >
                      <i className="fa-solid fa-trash-can"></i> সব ডিলিট করুন
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveCategory} className="bg-gray-50 p-8 rounded-3xl border border-gray-200 space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em]">{editingCategory ? 'ক্যাটাগরি এডিট করুন' : 'নতুন ক্যাটাগরি যোগ করুন'}</h3>
                    {editingCategory && (
                      <button 
                        type="button"
                        onClick={() => { setEditingCategory(null); setNewCategory({ name: '', parentId: '', icon: '', image: '' }); }}
                        className="text-gray-500 hover:text-gray-700 text-[10px] font-black uppercase tracking-widest"
                      >
                        বাতিল করুন
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">ক্যাটাগরি নাম</label>
                      <input
                        type="text"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        className="w-full bg-white border border-gray-200 p-4 rounded-xl text-gray-900 text-xs focus:border-cyan-500 outline-none"
                        placeholder="যেমন: পাঞ্জাবি"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">প্যারেন্ট ক্যাটাগরি (ঐচ্ছিক)</label>
                      <select
                        value={newCategory.parentId}
                        onChange={(e) => setNewCategory({ ...newCategory, parentId: e.target.value })}
                        className="w-full bg-white border border-gray-200 p-4 rounded-xl text-gray-900 text-xs focus:border-cyan-500 outline-none"
                      >
                        <option value="">কোনটি না</option>
                        {state.categories?.filter(c => !c.parentId && (!editingCategory || c.id !== editingCategory.id)).map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">আইকন (FontAwesome class)</label>
                      <input
                        type="text"
                        value={newCategory.icon}
                        onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                        className="w-full bg-white border border-gray-200 p-4 rounded-xl text-gray-900 text-xs focus:border-cyan-500 outline-none"
                        placeholder="যেমন: fa-shirt"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">ক্যাটাগরি ইমেজ</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCategoryImageUpload}
                        className="w-full text-gray-500 text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                      />
                    </div>
                  </div>
                  <button type="submit" className="bg-cyan-500 text-white px-10 py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-cyan-600 transition-all shadow-lg shadow-cyan-500/20">
                    ক্যাটাগরি সেভ করুন
                  </button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {state.categories?.map((cat) => (
                    <div key={cat.id} className="bg-white p-5 rounded-3xl border border-gray-100 flex items-center justify-between group shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} className="w-12 h-12 rounded-2xl object-cover border border-gray-100 shadow-sm" />
                        ) : (
                          <div className="w-12 h-12 bg-cyan-50 rounded-2xl flex items-center justify-center border border-cyan-100">
                            <i className={`fa-solid ${cat.icon || 'fa-folder'} text-cyan-500 text-sm`}></i>
                          </div>
                        )}
                        <div>
                          <h3 className="text-gray-900 font-black text-[10px] uppercase tracking-widest">{cat.name}</h3>
                          {cat.parentId && <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tight">প্যারেন্ট: {cat.parentId}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEditCategory(cat)}
                          className="text-cyan-500 hover:text-cyan-700 transition-colors p-2"
                        >
                          <i className="fa-solid fa-pen-to-square text-xs"></i>
                        </button>
                        <button 
                          onClick={() => deleteCategory(cat.id)}
                          className="text-red-400 hover:text-red-600 transition-colors p-2"
                        >
                          <i className="fa-solid fa-trash-can text-xs"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-8">
                {/* Stats Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-cyan-50 border border-cyan-100 p-6 rounded-3xl text-center shadow-sm">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">মোট বিক্রয়</p>
                    <p className="text-xs font-black text-gray-900 italic">৳{totalSales}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 p-6 rounded-3xl text-center shadow-sm">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">পেন্ডিং অর্ডার</p>
                    <p className="text-xs font-black text-gray-900 italic">{pendingOrders}</p>
                  </div>
                </div>

                <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em] mb-6">অর্ডার লিস্ট ({state.orders.length})</h3>
                {selectedOrder ? (
                  <div className="bg-white p-6 md:p-8 rounded-3xl animate-in fade-in duration-300 border border-gray-200 shadow-lg">
                    <button onClick={() => setSelectedOrder(null)} className="text-cyan-600 font-black text-xs uppercase mb-8 flex items-center gap-2 hover:text-cyan-700 transition-all"><i className="fa-solid fa-arrow-left"></i> ব্যাক</button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <p className="text-[8px] font-black text-gray-400 uppercase mb-2 tracking-widest">শিপিং তথ্য</p>
                          <p className="text-gray-900 font-bold text-[10px] mb-1">{selectedOrder.shippingDetails.name}</p>
                          <p className="text-cyan-600 font-black text-[10px] mb-1">{selectedOrder.shippingDetails.phone}</p>
                          <p className="text-gray-500 text-[10px] leading-relaxed">{selectedOrder.shippingDetails.address}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <p className="text-[8px] font-black text-gray-400 uppercase mb-2 tracking-widest">পেমেন্ট মেথড: {selectedOrder.paymentMethod}</p>
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-tight">TrxID: {selectedOrder.shippingDetails.transactionId || 'N/A'}</p>
                        </div>
                        {selectedOrder.shippingDetails.paymentScreenshot && (
                          <div className="space-y-2">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">পেমেন্ট স্ক্রিনশট</p>
                            <img src={selectedOrder.shippingDetails.paymentScreenshot} className="w-full max-h-48 object-contain rounded-xl border border-gray-200 bg-white p-2" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <p className="text-[8px] font-black text-gray-400 uppercase mb-2 tracking-widest">অর্ডার আইটেম</p>
                          <div className="space-y-2">
                            {selectedOrder.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-bold text-gray-800">{it.name} {it.selectedSize ? `(${it.selectedSize})` : ''}</span>
                                  <span className="text-[8px] text-gray-400">পরিমাণ: {it.quantity}</span>
                                </div>
                                <span className="text-[10px] font-black text-gray-900">৳{it.price * it.quantity}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 pt-3 border-t border-cyan-100 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-bold text-gray-500">ডেলিভারি চার্জ</span>
                              <span className="text-[10px] font-bold text-gray-900">৳{selectedOrder.deliveryCharge}</span>
                            </div>
                            {selectedOrder.items.some(it => it.originalPrice && it.originalPrice > it.price) && (
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-bold text-gray-500">ডিসকাউন্ট</span>
                                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1 rounded">-৳{selectedOrder.items.reduce((acc, it) => acc + ((it.originalPrice || it.price) - it.price) * it.quantity, 0)}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-bold text-gray-500">সর্বমোট</span>
                              <span className="text-sm font-black text-cyan-600 bg-cyan-50 px-2 py-1 rounded-lg border border-cyan-100">৳{selectedOrder.total}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3 pt-4">
                          <button onClick={() => { updateOrderStatus(selectedOrder.id, OrderStatus.CONFIRMED); setSelectedOrder(null); }} className="flex-grow bg-cyan-600 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-600/20">কনফার্ম</button>
                          <button onClick={() => { updateOrderStatus(selectedOrder.id, OrderStatus.PROCESSING); setSelectedOrder(null); }} className="flex-grow bg-purple-600 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20">প্রসেসিং</button>
                          <button onClick={() => { updateOrderStatus(selectedOrder.id, OrderStatus.SHIPPED); setSelectedOrder(null); }} className="flex-grow bg-blue-600 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">শিপড</button>
                          <button onClick={() => { updateOrderStatus(selectedOrder.id, OrderStatus.DELIVERED); setSelectedOrder(null); }} className="flex-grow bg-green-600 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-600/20">ডেলিভারড</button>
                          <button onClick={() => { updateOrderStatus(selectedOrder.id, OrderStatus.CANCELLED); setSelectedOrder(null); }} className="flex-grow bg-red-600 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20">বাতিল</button>
                        </div>
                        <div className="pt-4">
                          <button onClick={() => window.print()} className="w-full bg-gray-900 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20"><i className="fa-solid fa-print mr-2"></i> ইনভয়েস প্রিন্ট করুন</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">আইডি</th>
                          <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">কাস্টমার</th>
                          <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">মূল্য</th>
                          <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">স্ট্যাটাস</th>
                          <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {state.orders.map(order => (
                          <tr key={order.id} className="hover:bg-gray-50 transition-all group">
                            <td className="py-5 px-4 text-gray-400 font-mono text-xs">#{order.id.split('-')[1].slice(-4)}</td>
                            <td className="py-5 px-4">
                              <p className="text-xs font-bold text-gray-800">{order.shippingDetails.name}</p>
                              <p className="text-xs text-gray-400">{order.shippingDetails.phone}</p>
                            </td>
                            <td className="py-5 px-4 text-xs font-black text-cyan-600">৳{order.total}</td>
                            <td className="py-5 px-4">
                              <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                order.status === OrderStatus.DELIVERED ? 'bg-green-100 text-green-600' :
                                order.status === OrderStatus.SHIPPED ? 'bg-blue-100 text-blue-600' :
                                order.status === OrderStatus.PROCESSING ? 'bg-purple-100 text-purple-600' :
                                order.status === OrderStatus.CONFIRMED ? 'bg-cyan-100 text-cyan-600' :
                                order.status === OrderStatus.CANCELLED ? 'bg-red-100 text-red-600' :
                                'bg-yellow-100 text-yellow-600'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="py-5 px-4 text-right flex justify-end gap-2">
                              <button onClick={() => setSelectedOrder(order)} className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all"><i className="fa-solid fa-eye"></i></button>
                              <button onClick={() => { showConfirm('আপনি কি এই অর্ডারটি ডিলিট করতে চান?', () => deleteOrder(order.id)); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"><i className="fa-solid fa-trash"></i></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'customers' && (
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-lg">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em] mb-6">কাস্টমার লিস্ট</h3>
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">নাম</th>
                          <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">ইমেইল</th>
                          <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">মোট অর্ডার</th>
                          <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">মোট খরচ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {state.users.filter(u => u.role === 'Customer' || !u.role).map(user => {
                          const userOrders = state.orders.filter(o => o.userId === user.id);
                          const totalSpent = userOrders.reduce((acc, o) => acc + o.total, 0);
                          return (
                            <tr key={user.id} className="hover:bg-gray-50 transition-all group">
                              <td className="py-5 px-4 text-xs font-bold text-gray-800">{user.name}</td>
                              <td className="py-5 px-4 text-xs text-gray-500">{user.email}</td>
                              <td className="py-5 px-4 text-xs font-bold text-gray-800">{userOrders.length}</td>
                              <td className="py-5 px-4 text-xs font-black text-cyan-600">৳{totalSpent}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'marketing' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Coupons */}
                  <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-lg">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em] mb-6">কুপন কোড</h3>
                    <form onSubmit={handleSaveCoupon} className="space-y-4 mb-8">
                      <input type="text" placeholder="কুপন কোড (যেমন: EID20)" value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-900 text-xs focus:border-cyan-500 outline-none" required />
                      <input type="number" placeholder="ডিসকাউন্ট (%)" value={newCoupon.discountPercentage || ''} onChange={e => setNewCoupon({...newCoupon, discountPercentage: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-900 text-xs focus:border-cyan-500 outline-none" required />
                      <button type="submit" className="w-full bg-cyan-500 text-white px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-cyan-600 transition-all shadow-lg shadow-cyan-500/20">যোগ করুন</button>
                    </form>
                    <div className="space-y-3">
                      {state.coupons?.map(c => (
                        <div key={c.id} className="flex justify-between items-center p-4 bg-gray-50 border border-gray-100 rounded-xl">
                          <div>
                            <p className="text-xs font-bold text-gray-900">{c.code}</p>
                            <p className="text-xs text-cyan-600 font-black">{c.discountPercentage}% ছাড়</p>
                          </div>
                          <button onClick={() => deleteCoupon(c.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><i className="fa-solid fa-trash"></i></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Banners */}
                  <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-lg">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em] mb-6">ব্যানার অ্যাড</h3>
                    <form onSubmit={handleSaveBanner} className="space-y-4 mb-8">
                      <input type="text" placeholder="ছবির URL" value={newBanner.imageUrl} onChange={e => setNewBanner({...newBanner, imageUrl: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-900 text-xs focus:border-cyan-500 outline-none" required />
                      <input type="text" placeholder="লিংক (ঐচ্ছিক)" value={newBanner.link} onChange={e => setNewBanner({...newBanner, link: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-900 text-xs focus:border-cyan-500 outline-none" />
                      <button type="submit" className="w-full bg-cyan-500 text-white px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-cyan-600 transition-all shadow-lg shadow-cyan-500/20">যোগ করুন</button>
                    </form>
                    <div className="space-y-3">
                      {state.banners?.map(b => (
                        <div key={b.id} className="flex justify-between items-center p-4 bg-gray-50 border border-gray-100 rounded-xl">
                          <img src={b.imageUrl} className="h-12 w-24 object-cover rounded-lg" />
                          <button onClick={() => deleteBanner(b.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><i className="fa-solid fa-trash"></i></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'staff' && (
              <div className="space-y-10">
                <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-lg">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em] mb-6">নতুন স্টাফ যোগ করুন</h3>
                  </div>
                  <form onSubmit={handleSaveStaff} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">স্টাফের নাম</label>
                      <input 
                        type="text" 
                        required
                        value={newStaff.name} 
                        onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 text-xs outline-none focus:border-cyan-500 transition-all" 
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">ইমেইল</label>
                      <input 
                        type="email" 
                        required
                        value={newStaff.email} 
                        onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 text-xs outline-none focus:border-cyan-500 transition-all" 
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">পাসওয়ার্ড</label>
                      <input 
                        type="text" 
                        required
                        value={newStaff.password} 
                        onChange={(e) => setNewStaff({...newStaff, password: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 text-xs outline-none focus:border-cyan-500 transition-all" 
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">রোল (Role)</label>
                      <select 
                        value={newStaff.role} 
                        onChange={(e) => setNewStaff({...newStaff, role: e.target.value as 'Manager' | 'Editor'})}
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 text-xs outline-none focus:border-cyan-500 transition-all appearance-none"
                      >
                        <option value="Manager">Manager (অর্ডার দেখতে পারবে)</option>
                        <option value="Editor">Editor (প্রডাক্ট এড করতে পারবে)</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 flex justify-end mt-4">
                      <button type="submit" className="bg-cyan-500 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-cyan-500/30 hover:bg-cyan-600 transition-all">
                        স্টাফ যোগ করুন
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em] mb-6">স্টাফ তালিকা</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-100">
                          <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">নাম</th>
                          <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">ইমেইল</th>
                          <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">রোল</th>
                          <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {state.users.filter(u => u.role === 'Manager' || u.role === 'Editor' || u.role === 'Admin').map((staff) => (
                          <tr key={staff.id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="py-5 px-6">
                              <div className="font-bold text-gray-900 text-xs">{staff.name}</div>
                            </td>
                            <td className="py-5 px-6">
                              <div className="text-gray-500 text-xs">{staff.email}</div>
                            </td>
                            <td className="py-5 px-6">
                              <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                staff.role === 'Admin' ? 'bg-purple-100 text-purple-600' :
                                staff.role === 'Manager' ? 'bg-blue-100 text-blue-600' :
                                'bg-green-100 text-green-600'
                              }`}>
                                {staff.role}
                              </span>
                            </td>
                            <td className="py-5 px-6 text-right">
                              {staff.role !== 'Admin' && (
                                <button 
                                  onClick={() => removeStaff(staff.id)}
                                  className="text-red-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-all"
                                  title="রিমুভ করুন"
                                >
                                  <i className="fa-solid fa-trash"></i>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {state.users.filter(u => u.role === 'Manager' || u.role === 'Editor' || u.role === 'Admin').length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-12 text-center text-gray-400 text-xs font-medium italic">
                              কোনো স্টাফ পাওয়া যায়নি
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-8">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em] mb-6">রিভিউ ম্যানেজমেন্ট</h3>
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">পণ্য</th>
                        <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">কাস্টমার</th>
                        <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">রেটিং</th>
                        <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">মন্তব্য</th>
                        <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">স্ট্যাটাস</th>
                        <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {state.products.flatMap(product => 
                        (product.reviews || []).map(review => (
                          <tr key={review.id} className="hover:bg-gray-50 transition-all group">
                            <td className="py-5 px-4">
                              <div className="flex items-center gap-2">
                                <img src={product.image} className="w-8 h-8 rounded-lg object-cover" />
                                <span className="text-[10px] font-bold truncate max-w-[100px]">{product.name}</span>
                              </div>
                            </td>
                            <td className="py-5 px-4 text-[10px] font-bold text-gray-800">{review.userName}</td>
                            <td className="py-5 px-4">
                              <div className="flex text-[#D4AF37] text-[8px]">
                                {[...Array(5)].map((_, i) => (
                                  <i key={i} className={`fa-solid fa-star ${i < review.rating ? '' : 'opacity-30'}`}></i>
                                ))}
                              </div>
                            </td>
                            <td className="py-5 px-4 text-[10px] text-gray-600 italic max-w-xs truncate">
                              <div className="flex items-center gap-2">
                                {review.image && <img src={review.image} className="w-8 h-8 rounded-lg object-cover cursor-pointer" onClick={() => window.open(review.image, '_blank')} />}
                                <span>"{review.comment}"</span>
                              </div>
                            </td>
                            <td className="py-5 px-4">
                              <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                review.isApproved ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                              }`}>
                                {review.isApproved ? 'অনুমোদিত' : 'পেন্ডিং'}
                              </span>
                            </td>
                            <td className="py-5 px-4 text-right">
                              <div className="flex gap-2 justify-end">
                                {!review.isApproved && (
                                  <button 
                                    onClick={() => updateReviewStatus(product.id, review.id, true)} 
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                    title="অনুমোদন করুন"
                                  >
                                    <i className="fa-solid fa-check"></i>
                                  </button>
                                )}
                                {review.isApproved && (
                                  <button 
                                    onClick={() => updateReviewStatus(product.id, review.id, false)} 
                                    className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all"
                                    title="অনুমোদন বাতিল করুন"
                                  >
                                    <i className="fa-solid fa-rotate-left"></i>
                                  </button>
                                )}
                                <button 
                                  onClick={() => { showConfirm('আপনি কি এই রিভিউটি ডিলিট করতে চান?', () => updateReviewStatus(product.id, review.id, false, true)); }} 
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="ডিলিট করুন"
                                >
                                  <i className="fa-solid fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                      {state.products.every(p => !p.reviews || p.reviews.length === 0) && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-gray-400 text-xs font-medium italic">
                            কোনো রিভিউ পাওয়া যায়নি
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-2xl space-y-10">
                <div className="space-y-6">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em] mb-6">শিপিং ও পেমেন্ট</h3>
                  <div className="bg-white p-8 rounded-3xl border border-gray-200 space-y-8 shadow-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">ডেলিভারি চার্জ (ঢাকার ভেতরে)</label>
                        <input 
                          type="number" 
                          value={chargeInputInside} 
                          onChange={(e) => setChargeInputInside(Number(e.target.value))}
                          className="w-full px-6 py-5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-black text-xs outline-none focus:border-cyan-500 transition-all" 
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">ডেলিভারি চার্জ (ঢাকার বাইরে)</label>
                        <input 
                          type="number" 
                          value={chargeInputOutside} 
                          onChange={(e) => setChargeInputOutside(Number(e.target.value))}
                          className="w-full px-6 py-5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-black text-xs outline-none focus:border-cyan-500 transition-all" 
                        />
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        if (updateGeneralSettings) await updateGeneralSettings({ shippingRates: { insideDhaka: chargeInputInside, outsideDhaka: chargeInputOutside } });
                        else updateShippingRates({ insideDhaka: chargeInputInside, outsideDhaka: chargeInputOutside });
                        showAlert('শিপিং চার্জ সফলভাবে আপডেট হয়েছে!');
                      }} 
                      className="w-full bg-cyan-500 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-cyan-500/20 hover:bg-cyan-600 transition-all"
                    >
                      চার্জ সেভ করুন
                    </button>

                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">বিকাশ/নগদ নম্বর</label>
                      <div className="flex flex-col gap-4">
                        <input 
                          type="text" 
                          value={paymentNumberInput} 
                          onChange={(e) => setPaymentNumberInput(e.target.value)}
                          className="w-full px-6 py-5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-black text-xs outline-none focus:border-cyan-500 transition-all" 
                        />
                        <button 
                          onClick={async () => {
                            if (updateGeneralSettings) await updateGeneralSettings({ paymentNumber: paymentNumberInput });
                            else updatePaymentNumber(paymentNumberInput);
                            showAlert('পেমেন্ট নম্বর সফলভাবে আপডেট হয়েছে!');
                          }} 
                          className="w-full bg-cyan-500 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-cyan-500/20 hover:bg-cyan-600 transition-all"
                        >
                          নম্বর সেভ করুন
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em] mb-6">সাইট সেটিংস</h3>
                  <div className="bg-white p-8 rounded-3xl border border-gray-200 space-y-8 shadow-lg">
                    <div className="space-y-4">
                      <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">লোগো নাম</label>
                      <input 
                        type="text" 
                        value={siteSettingsInput.logoName || ''} 
                        onChange={(e) => setSiteSettingsInput({...siteSettingsInput, logoName: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 text-xs outline-none focus:border-cyan-500 transition-all" 
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">কপিরাইট টেক্সট</label>
                      <input 
                        type="text" 
                        value={siteSettingsInput.footerCopyright || ''} 
                        onChange={(e) => setSiteSettingsInput({...siteSettingsInput, footerCopyright: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 text-xs outline-none focus:border-cyan-500 transition-all" 
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">লোগো ইমেজ আপলোড</label>
                      <div className="flex items-center gap-4">
                        {siteSettingsInput.logoUrl && (
                          <div className="w-16 h-16 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                            <img src={siteSettingsInput.logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                          </div>
                        )}
                        <label className="flex-grow">
                          <div className="w-full px-6 py-4 bg-gray-50 border border-gray-200 border-dashed rounded-2xl text-gray-500 text-xs cursor-pointer hover:border-cyan-500 hover:text-cyan-500 transition-all flex items-center justify-center gap-2">
                            <i className="fa-solid fa-cloud-arrow-up"></i>
                            <span>{siteSettingsInput.logoUrl ? 'লোগো পরিবর্তন করুন' : 'লোগো আপলোড করুন'}</span>
                          </div>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden" 
                          />
                        </label>
                        {siteSettingsInput.logoUrl && (
                          <button 
                            onClick={() => setSiteSettingsInput({...siteSettingsInput, logoUrl: ''})}
                            className="p-4 text-red-500 bg-red-50 rounded-2xl hover:bg-red-100 transition-all"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">যোগাযোগের নম্বর</label>
                      <input 
                        type="text" 
                        value={siteSettingsInput.contactNumber || ''} 
                        onChange={(e) => setSiteSettingsInput({...siteSettingsInput, contactNumber: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 text-xs outline-none focus:border-cyan-500 transition-all" 
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">ফেসবুক পেজ URL</label>
                      <input 
                        type="text" 
                        value={siteSettingsInput.facebookUrl || ''} 
                        onChange={(e) => setSiteSettingsInput({...siteSettingsInput, facebookUrl: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 text-xs outline-none focus:border-cyan-500 transition-all" 
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">ইন্সটাগ্রাম URL</label>
                      <input 
                        type="text" 
                        value={siteSettingsInput.instagramUrl || ''} 
                        onChange={(e) => setSiteSettingsInput({...siteSettingsInput, instagramUrl: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 text-xs outline-none focus:border-cyan-500 transition-all" 
                      />
                    </div>
                    <button 
                      onClick={async () => {
                        if (updateGeneralSettings) await updateGeneralSettings({ siteSettings: siteSettingsInput });
                        else updateSiteSettings(siteSettingsInput);
                        showAlert('সাইট সেটিংস সফলভাবে আপডেট হয়েছে!');
                      }} 
                      className="w-full bg-cyan-500 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-cyan-500/20 hover:bg-cyan-600 transition-all"
                    >
                      সেটিংস সেভ করুন
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em] mb-6">ঈদ টাইটেল / ঘোষণা</h3>
                  <div className="bg-white p-8 rounded-3xl border border-gray-200 space-y-8 shadow-lg">
                    <div className="space-y-6">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="নতুন ঘোষণা লিখুন..."
                          value={newAnnouncement}
                          onChange={(e) => setNewAnnouncement(e.target.value)}
                          className="flex-grow px-6 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs outline-none focus:border-cyan-500 transition-all"
                        />
                        <button 
                          onClick={async () => {
                            if (newAnnouncement.trim()) {
                              const newAnns = [...(state.announcements || []), newAnnouncement.trim()];
                              if (updateGeneralSettings) await updateGeneralSettings({ announcements: newAnns });
                              else updateAnnouncements(newAnns);
                              setNewAnnouncement('');
                            }
                          }}
                          className="bg-cyan-500 text-white px-6 rounded-xl font-black text-xs uppercase tracking-widest"
                        >
                          যোগ করুন
                        </button>
                      </div>

                      <div className="space-y-3">
                        {state.announcements?.map((ann, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 group">
                            <span className="text-xs text-gray-700">{ann}</span>
                            <button 
                              onClick={async () => {
                                const newAnns = state.announcements.filter((_, i) => i !== idx);
                                if (updateGeneralSettings) await updateGeneralSettings({ announcements: newAnns });
                                else updateAnnouncements(newAnns);
                              }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        ))}
                        {(!state.announcements || state.announcements.length === 0) && (
                          <p className="text-xs text-gray-400 text-center py-4 italic">কোনো ঘোষণা নেই</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em] mb-6">ইমেইল সেটিংস (অটোমেটিক ইমেইল)</h3>
                    <div className="bg-white p-8 rounded-3xl border border-gray-200 space-y-6 shadow-lg">
                      <p className="text-xs text-gray-500 mb-4">
                        অর্ডার কনফার্ম বা ক্যানসেল করলে কাস্টমারকে অটোমেটিক ইমেইল পাঠানোর জন্য আপনার জিমেইল এবং অ্যাপ পাসওয়ার্ড (App Password) সেট করুন।
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">SMTP Host</label>
                          <input 
                            type="text" 
                            placeholder="smtp.gmail.com"
                            value={smtpConfig.host} 
                            onChange={(e) => setSmtpConfig({...smtpConfig, host: e.target.value})}
                            className="w-full px-6 py-5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-black text-xs outline-none focus:border-cyan-500 transition-all" 
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">SMTP Port</label>
                          <input 
                            type="text" 
                            placeholder="587"
                            value={smtpConfig.port} 
                            onChange={(e) => setSmtpConfig({...smtpConfig, port: e.target.value})}
                            className="w-full px-6 py-5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-black text-xs outline-none focus:border-cyan-500 transition-all" 
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">আপনার জিমেইল (User)</label>
                          <input 
                            type="email" 
                            placeholder="example@gmail.com"
                            value={smtpConfig.user} 
                            onChange={(e) => setSmtpConfig({...smtpConfig, user: e.target.value})}
                            className="w-full px-6 py-5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-black text-xs outline-none focus:border-cyan-500 transition-all" 
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">অ্যাপ পাসওয়ার্ড (App Password)</label>
                          <input 
                            type="password" 
                            placeholder="••••••••"
                            value={smtpConfig.pass} 
                            onChange={(e) => setSmtpConfig({...smtpConfig, pass: e.target.value})}
                            className="w-full px-6 py-5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-black text-xs outline-none focus:border-cyan-500 transition-all" 
                          />
                        </div>
                        <div className="space-y-4 md:col-span-2">
                          <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">প্রেরকের নাম (From)</label>
                          <input 
                            type="text" 
                            placeholder="Royal HIT SHOPING <example@gmail.com>"
                            value={smtpConfig.from} 
                            onChange={(e) => setSmtpConfig({...smtpConfig, from: e.target.value})}
                            className="w-full px-6 py-5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-black text-xs outline-none focus:border-cyan-500 transition-all" 
                          />
                        </div>
                      </div>
                      <button 
                        onClick={async () => {
                          setSmtpLoading(true);
                          try {
                            const res = await fetch('/api/smtp-config', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(smtpConfig)
                            });
                            if (res.ok) showAlert('ইমেইল সেটিংস সফলভাবে সেভ হয়েছে!');
                            else showAlert('ইমেইল সেটিংস সেভ করতে সমস্যা হয়েছে।');
                          } catch (e) {
                            showAlert('ইমেইল সেটিংস সেভ করতে সমস্যা হয়েছে।');
                          }
                          setSmtpLoading(false);
                        }} 
                        disabled={smtpLoading}
                        className="bg-cyan-500 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-cyan-600 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                      >
                        {smtpLoading ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Modals */}
            {confirmDialog.isOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                  <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-black text-center text-gray-900 mb-2">নিশ্চিত করুন</h3>
                  <p className="text-sm text-center text-gray-500 mb-8">{confirmDialog.message}</p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setConfirmDialog({ isOpen: false, message: '', onConfirm: () => {} })}
                      className="flex-1 bg-gray-100 text-gray-900 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                    >
                      বাতিল
                    </button>
                    <button 
                      onClick={() => {
                        confirmDialog.onConfirm();
                        setConfirmDialog({ isOpen: false, message: '', onConfirm: () => {} });
                      }}
                      className="flex-1 bg-red-500 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                    >
                      হ্যাঁ, নিশ্চিত
                    </button>
                  </div>
                </div>
              </div>
            )}

            {alertDialog.isOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                  <div className="w-16 h-16 bg-cyan-100 text-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fa-solid fa-circle-info text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-black text-center text-gray-900 mb-2">নোটিফিকেশন</h3>
                  <p className="text-sm text-center text-gray-500 mb-8">{alertDialog.message}</p>
                  <button 
                    onClick={() => setAlertDialog({ isOpen: false, message: '' })}
                    className="w-full bg-cyan-500 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-cyan-600 transition-all shadow-lg shadow-cyan-500/20"
                  >
                    ঠিক আছে
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;