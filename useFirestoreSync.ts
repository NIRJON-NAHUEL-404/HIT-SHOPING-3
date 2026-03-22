import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc, query, where } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { AppState, Product, Order, User, CategoryDef, Coupon, Banner, OrderStatus } from '../../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email || undefined,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId || undefined,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function useFirestoreSync(initialState: AppState) {
  const [state, setState] = useState<AppState>(initialState);
  const [userRole, setUserRole] = useState<'admin' | 'user' | 'guest'>('guest');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
        if (user.email === 'savlogging2.0@gmail.com') {
          setUserRole('admin');
        } else {
          setUserRole('user');
        }
      } else {
        setUserId(null);
        setUserRole('guest');
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setState(prev => ({ ...prev, products }));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'products'));

    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryDef));
      setState(prev => ({ ...prev, categories }));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'categories'));

    const unsubCoupons = onSnapshot(collection(db, 'coupons'), (snapshot) => {
      const coupons = snapshot.docs.map(doc => ({ code: doc.id, ...doc.data() } as Coupon));
      setState(prev => ({ ...prev, coupons }));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'coupons'));

    const unsubBanners = onSnapshot(collection(db, 'banners'), (snapshot) => {
      const banners = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner));
      setState(prev => ({ ...prev, banners }));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'banners'));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setState(prev => ({
          ...prev,
          siteSettings: data.siteSettings || prev.siteSettings,
          shippingRates: data.shippingRates || prev.shippingRates,
          paymentNumber: data.paymentNumber || prev.paymentNumber,
          announcements: data.announcements || prev.announcements
        }));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/general'));

    return () => {
      unsubProducts();
      unsubCategories();
      unsubCoupons();
      unsubBanners();
      unsubSettings();
    };
  }, []);

  useEffect(() => {
    let unsubOrders: () => void;
    let unsubUsers: () => void;

    if (userRole === 'admin') {
      unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setState(prev => ({ ...prev, orders: orders.sort((a, b) => b.createdAt - a.createdAt) }));
      }, (error) => handleFirestoreError(error, OperationType.GET, 'orders'));

      unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setState(prev => ({ ...prev, users }));
      }, (error) => handleFirestoreError(error, OperationType.GET, 'users'));
    } else if (userRole === 'user' && userId) {
      const qOrders = query(collection(db, 'orders'), where('userId', '==', userId));
      unsubOrders = onSnapshot(qOrders, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setState(prev => ({ ...prev, orders: orders.sort((a, b) => b.createdAt - a.createdAt) }));
      }, (error) => handleFirestoreError(error, OperationType.GET, 'orders'));

      const unsubUserDoc = onSnapshot(doc(db, 'users', userId), (docSnap) => {
        if (docSnap.exists()) {
          const user = { id: docSnap.id, ...docSnap.data() } as User;
          setState(prev => ({ ...prev, users: [user] }));
        } else {
          setState(prev => ({ ...prev, users: [] }));
        }
      }, (error) => handleFirestoreError(error, OperationType.GET, `users/${userId}`));
      unsubUsers = unsubUserDoc;
    } else {
      // Guest
      setState(prev => ({ ...prev, orders: [], users: [] }));
    }

    return () => {
      if (unsubOrders) unsubOrders();
      if (unsubUsers) unsubUsers();
    };
  }, [userRole, userId]);

  const saveProduct = async (product: Product) => {
    try {
      await setDoc(doc(db, 'products', product.id), JSON.parse(JSON.stringify(product)));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `products/${product.id}`);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  };

  const saveOrder = async (order: Order) => {
    try {
      await setDoc(doc(db, 'orders', order.id), JSON.parse(JSON.stringify(order)));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `orders/${order.id}`);
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'orders', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `orders/${id}`);
    }
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  };

  const saveUser = async (user: User) => {
    try {
      await setDoc(doc(db, 'users', user.id), JSON.parse(JSON.stringify(user)));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.id}`);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
    }
  };

  const saveCategory = async (category: CategoryDef) => {
    try {
      await setDoc(doc(db, 'categories', category.id), JSON.parse(JSON.stringify(category)));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `categories/${category.id}`);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
    }
  };

  const saveCoupon = async (coupon: Coupon) => {
    try {
      await setDoc(doc(db, 'coupons', coupon.code), JSON.parse(JSON.stringify(coupon)));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `coupons/${coupon.code}`);
    }
  };

  const deleteCoupon = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'coupons', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `coupons/${id}`);
    }
  };

  const saveBanner = async (banner: Banner) => {
    try {
      await setDoc(doc(db, 'banners', banner.id), JSON.parse(JSON.stringify(banner)));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `banners/${banner.id}`);
    }
  };

  const deleteBanner = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'banners', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `banners/${id}`);
    }
  };

  const updateGeneralSettings = async (updates: any) => {
    try {
      await setDoc(doc(db, 'settings', 'general'), updates, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `settings/general`);
    }
  };

  return {
    state,
    setState,
    saveProduct,
    deleteProduct,
    saveOrder,
    deleteOrder,
    updateOrderStatus,
    saveUser,
    deleteUser,
    saveCategory,
    deleteCategory,
    saveCoupon,
    deleteCoupon,
    saveBanner,
    deleteBanner,
    updateGeneralSettings
  };
}
