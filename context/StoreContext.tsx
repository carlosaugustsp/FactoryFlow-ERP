import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Order, Product, Role, OrderStatus, OrderLog } from '../types';
import { INITIAL_USERS, INITIAL_PRODUCTS } from '../constants';
import { db, auth, isFirebaseConfigured } from '../services/firebase';
import { 
  collection, onSnapshot, addDoc, updateDoc, doc, setDoc, query, orderBy, deleteDoc 
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, onAuthStateChanged 
} from 'firebase/auth';

interface StoreContextType {
  currentUser: User | null;
  users: User[];
  products: Product[];
  orders: Order[];
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  createOrder: (order: Omit<Order, 'id' | 'createdAt' | 'status' | 'logs'>) => void;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, note?: string, extraFields?: Partial<Order>) => void;
  updateOrderFields: (orderId: string, fields: Partial<Order>) => void;
  splitOrder: (originalOrderId: string, producedItems: {productId: string, qtyProduced: number}[]) => void;
  updateOrder: (order: Order) => void;
  addProduct: (product: Product) => void;
  addProductsBatch: (newProducts: Product[]) => void;
  updateProductStock: (productId: string, rawChange: number, finishedChange: number) => void;
  addUser: (user: User) => Promise<void>;
  updateUser: (user: User) => void;
  removeUser: (userId: string) => void;
  initializeDatabase: () => Promise<void>; // Helper to seed DB
  loading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FIREBASE LISTENERS ---
  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      // Fallback to local storage logic for dev without keys
      const savedUsers = localStorage.getItem('ff_users');
      if (savedUsers) setUsers(JSON.parse(savedUsers));
      else setUsers(INITIAL_USERS);

      const savedProds = localStorage.getItem('ff_products');
      if (savedProds) setProducts(JSON.parse(savedProds));
      else setProducts(INITIAL_PRODUCTS);

      const savedOrders = localStorage.getItem('ff_orders');
      if (savedOrders) setOrders(JSON.parse(savedOrders));
      
      setLoading(false);
      return;
    }

    // 1. Auth Listener
    const unsubscribeAuth = onAuthStateChanged(auth!, (firebaseUser) => {
      if (firebaseUser) {
        // Find user details in Firestore 'users' collection matches the auth email
        // Note: Ideally we store uid in the user doc, but for simplicity we match email or load from users collection
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // 2. Data Listeners (Real-time)
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
      setUsers(usersData);
      
      // Update current user if logged in
      if (auth?.currentUser) {
         const found = usersData.find(u => u.username === auth.currentUser?.email || u.username === auth.currentUser?.email?.split('@')[0]);
         if (found) setCurrentUser(found);
      }
    });

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const prodsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
      setProducts(prodsData);
    });

    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
      setOrders(ordersData);
    });

    return () => {
      unsubscribeAuth();
      unsubUsers();
      unsubProducts();
      unsubOrders();
    };
  }, []);

  // --- ACTIONS ---

  const login = async (email: string, password?: string) => {
    if (!isFirebaseConfigured || !auth) {
        // Local Mock Login
        const user = users.find(u => u.username === email);
        if (user && (user.password === password || password === '123456')) {
            setCurrentUser(user);
            return true;
        }
        return false;
    }

    try {
      // Append fake domain if user typed just "admin"
      const finalEmail = email.includes('@') ? email : `${email}@factoryflow.app`;
      await signInWithEmailAndPassword(auth, finalEmail, password || '123456');
      
      // The auth listener will update currentUser, but we manually find it here to return success
      const user = users.find(u => u.username === finalEmail || u.username === email);
      if (user) setCurrentUser(user);
      return true;
    } catch (error) {
      console.error("Login error", error);
      return false;
    }
  };

  const logout = () => {
    if (auth) signOut(auth);
    setCurrentUser(null);
  };

  const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'status' | 'logs'>) => {
    const timestamp = new Date().toISOString();
    const newOrder: Omit<Order, 'id'> = {
      ...orderData,
      createdAt: timestamp,
      status: OrderStatus.ANALISE_PCP,
      logs: [
        {
          stage: OrderStatus.ANALISE_PCP,
          timestamp: timestamp,
          userId: currentUser?.id || 'system',
          userName: currentUser?.name || 'Sistema',
          note: 'Movido para o PCP'
        },
        {
          stage: OrderStatus.CRIADO,
          timestamp: timestamp,
          userId: currentUser?.id || 'system',
          userName: currentUser?.name || 'Sistema',
          note: 'Pedido Criado'
        }
      ]
    };

    if (db) {
      await addDoc(collection(db, 'orders'), newOrder);
    } else {
      // Local Fallback
      const localOrder = { ...newOrder, id: `ORD-${Date.now()}` } as Order;
      setOrders(prev => [localOrder, ...prev]);
      localStorage.setItem('ff_orders', JSON.stringify([localOrder, ...orders]));
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus, note?: string, extraFields?: Partial<Order>) => {
    const orderToUpdate = orders.find(o => o.id === orderId);
    if (!orderToUpdate) return;

    const newLog: OrderLog = {
      stage: newStatus,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'Sistema',
      note: note
    };

    const updatedData = {
      ...extraFields,
      status: newStatus,
      logs: [newLog, ...orderToUpdate.logs]
    };

    if (db) {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, updatedData);
    } else {
       // Local
       const newOrders = orders.map(o => o.id === orderId ? { ...o, ...updatedData } : o);
       setOrders(newOrders);
       localStorage.setItem('ff_orders', JSON.stringify(newOrders));
    }
  };

  const updateOrderFields = async (orderId: string, fields: Partial<Order>) => {
    if (db) {
        await updateDoc(doc(db, 'orders', orderId), fields);
    } else {
        const newOrders = orders.map(o => o.id === orderId ? { ...o, ...fields } : o);
        setOrders(newOrders);
        localStorage.setItem('ff_orders', JSON.stringify(newOrders));
    }
  };

  const splitOrder = async (originalOrderId: string, producedItems: {productId: string, qtyProduced: number}[]) => {
     // Complex logic simplified for Firestore:
     // 1. Update original order in DB
     // 2. Create new backlog order in DB
     const originalOrder = orders.find(o => o.id === originalOrderId);
     if (!originalOrder) return;

     const remainingItems = originalOrder.items.map(item => {
        const produced = producedItems.find(p => p.productId === item.productId)?.qtyProduced || 0;
        return { ...item, quantity: Math.max(0, item.quantity - produced) };
      }).filter(item => item.quantity > 0);

      const itemsProducedState = originalOrder.items.map(item => {
          const produced = producedItems.find(p => p.productId === item.productId)?.qtyProduced || 0;
          return { ...item, quantity: produced, quantityProduced: produced };
      });

      // Update Original
      if (db) {
          await updateDoc(doc(db, 'orders', originalOrderId), {
              items: itemsProducedState,
              logs: [{
                  stage: OrderStatus.QUALIDADE_PENDENTE,
                  timestamp: new Date().toISOString(),
                  userId: currentUser?.id || 'sys',
                  userName: currentUser?.name || 'Sys',
                  note: 'Entrega Parcial'
              }, ...originalOrder.logs]
          });

          // Create Backlog
          if (remainingItems.length > 0) {
              await addDoc(collection(db, 'orders'), {
                  ...originalOrder,
                  id: undefined, // Let firestore gen ID
                  externalId: `${originalOrder.externalId || originalOrder.id}-REM`,
                  status: OrderStatus.EM_PRODUCAO,
                  items: remainingItems,
                  logs: [{
                    stage: OrderStatus.EM_PRODUCAO,
                    timestamp: new Date().toISOString(),
                    userId: currentUser?.id || 'sys',
                    userName: currentUser?.name || 'Sys',
                    note: 'Saldo remanescente'
                  }, ...originalOrder.logs]
              });
          }
      } else {
          // Local fallback (simplified)
          alert("Split order only fully supported in Firebase mode.");
      }
  };

  const updateOrder = (order: Order) => { /* Not used often, specific updates preferred */ };

  const addProduct = async (product: Product) => {
    if (db) {
        const { id, ...data } = product;
        await addDoc(collection(db, 'products'), data);
    } else {
        const newProds = [...products, product];
        setProducts(newProds);
        localStorage.setItem('ff_products', JSON.stringify(newProds));
    }
  };

  const addProductsBatch = async (newProducts: Product[]) => {
      if (db) {
          // Batch writes
          newProducts.forEach(async (p) => {
              const { id, ...data } = p;
              await addDoc(collection(db, 'products'), data);
          });
      } else {
          const newProds = [...products, ...newProducts];
          setProducts(newProds);
          localStorage.setItem('ff_products', JSON.stringify(newProds));
      }
  };

  const updateProductStock = async (productId: string, rawChange: number, finishedChange: number) => {
    if (db) {
        const prod = products.find(p => p.id === productId);
        if (prod) {
            await updateDoc(doc(db, 'products', productId), {
                stockRaw: Math.max(0, prod.stockRaw + rawChange),
                stockFinished: Math.max(0, prod.stockFinished + finishedChange)
            });
        }
    } else {
        const newProds = products.map(p => {
            if (p.id !== productId) return p;
            return {
                ...p,
                stockRaw: Math.max(0, p.stockRaw + rawChange),
                stockFinished: Math.max(0, p.stockFinished + finishedChange)
            };
        });
        setProducts(newProds);
        localStorage.setItem('ff_products', JSON.stringify(newProds));
    }
  };

  const addUser = async (user: User) => {
    if (db && auth) {
      // 1. Create Auth Login
      const email = user.username.includes('@') ? user.username : `${user.username}@factoryflow.app`;
      try {
        // Note: In a real app, you shouldn't create users while logged in as another user 
        // because Firebase Auth switches context. Ideally use a secondary app instance or Cloud Functions.
        // For this demo, we will just write to Firestore 'users' collection so the logic works,
        // but actual Authentication creation requires logging out or Cloud Admin SDK.
        // We will just simulate adding the user to the DB.
        
        await addDoc(collection(db, 'users'), {
            ...user,
            username: email // Ensure email format in DB
        });
        
        alert(`Usuário criado no banco de dados. Para login funcionar, é necessário criar também no Firebase Auth (Painel) com e-mail: ${email}`);

      } catch (e) {
          console.error(e);
          alert("Erro ao criar usuário");
      }
    } else {
        const newUsers = [...users, user];
        setUsers(newUsers);
        localStorage.setItem('ff_users', JSON.stringify(newUsers));
    }
  };

  const updateUser = async (updatedUser: User) => {
      if (db) {
          await updateDoc(doc(db, 'users', updatedUser.id), updatedUser as any);
      } else {
          const newUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
          setUsers(newUsers);
          localStorage.setItem('ff_users', JSON.stringify(newUsers));
      }
  };

  const removeUser = async (userId: string) => {
      if (db) {
          await deleteDoc(doc(db, 'users', userId));
      } else {
          const newUsers = users.filter(u => u.id !== userId);
          setUsers(newUsers);
          localStorage.setItem('ff_users', JSON.stringify(newUsers));
      }
  };

  // --- SEED DATABASE ---
  const initializeDatabase = async () => {
    if (!db) return;
    
    // Check if empty
    if (users.length > 0) {
        if(!confirm("O banco de dados já parece ter usuários. Deseja sobrescrever/adicionar os dados padrão?")) return;
    }

    setLoading(true);
    try {
        // Add Users
        for (const user of INITIAL_USERS) {
            const email = `${user.username}@factoryflow.app`;
            // Only add to firestore collection
            await addDoc(collection(db, 'users'), { ...user, username: email });
            
            // Try to create auth user (This will fail if already logged in, but we try)
            try {
                // This resets current session, caveat of client-side admin creation
                // await createUserWithEmailAndPassword(auth!, email, '123456');
            } catch (e) {}
        }

        // Add Products
        for (const prod of INITIAL_PRODUCTS) {
            const { id, ...data } = prod;
            await addDoc(collection(db, 'products'), data);
        }
        alert("Dados iniciais carregados no Firestore! Crie os usuários no Authentication com o final @factoryflow.app e senha '123456' para acessar.");
    } catch (e) {
        console.error(e);
        alert("Erro ao inicializar.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <StoreContext.Provider value={{
      currentUser, users, products, orders, loading,
      login, logout, createOrder, updateOrderStatus, updateOrderFields, splitOrder, updateOrder,
      addProduct, addProductsBatch, updateProductStock, addUser, updateUser, removeUser, initializeDatabase
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};