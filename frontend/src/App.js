import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";

// Pages
import HomePage from "@/pages/HomePage";
import ShopPage from "@/pages/ShopPage";
import ProductPage from "@/pages/ProductPage";
import CartPage from "@/pages/CartPage";
import CheckoutPage from "@/pages/CheckoutPage";
import OrderConfirmationPage from "@/pages/OrderConfirmationPage";
import OrdersPage from "@/pages/OrdersPage";
import TrackOrderPage from "@/pages/TrackOrderPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminOrders from "@/pages/admin/AdminOrders";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/auth/callback';
     window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUrl}&response_type=code&scope=openid%20email%20profile`;
    // window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// Cart Context
const CartContext = createContext(null);

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    try {
      const response = await axios.get(`${API}/cart`, { withCredentials: true });
      setCart(response.data);
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const addToCart = async (productId, quantity = 1, size = null, color = null) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/cart/add`,
        { product_id: productId, quantity, size, color },
        { withCredentials: true }
      );
      setCart(response.data);
      return true;
    } catch (error) {
      console.error("Error adding to cart:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (productId, quantity, size = null, color = null) => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${API}/cart/update`,
        null,
        { 
          params: { product_id: productId, quantity, size, color },
          withCredentials: true 
        }
      );
      setCart(response.data);
    } catch (error) {
      console.error("Error updating cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId, size = null, color = null) => {
    setLoading(true);
    try {
      const response = await axios.delete(
        `${API}/cart/remove/${productId}`,
        { 
          params: { size, color },
          withCredentials: true 
        }
      );
      setCart(response.data);
    } catch (error) {
      console.error("Error removing from cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      await axios.delete(`${API}/cart/clear`, { withCredentials: true });
      setCart({ items: [] });
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  const cartItemCount = cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const cartTotal = cart.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{ 
      cart, 
      loading, 
      addToCart, 
      updateCartItem, 
      removeFromCart, 
      clearCart, 
      fetchCart,
      cartItemCount,
      cartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
};

// Auth Callback Component
const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, checkAuth } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      
      if (code) {
        try {
          const response = await axios.get(
            `${API}/auth/callback?code=${code}`,
            { withCredentials: true }
          );
          setUser(response.data);
          navigate('/', { replace: true });
        } catch (error) {
          console.error("Auth callback error:", error);
          navigate('/', { replace: true });
        }
      } else {
        navigate('/', { replace: true });
      }
    };

    processAuth();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFCFA]">
      <div className="text-center">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-[#7D7D7D]">Signing you in...</p>
      </div>
    </div>
  );
};
// const AuthCallback = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { setUser } = useAuth();
//   const hasProcessed = useRef(false);

//   useEffect(() => {
//     if (hasProcessed.current) return;
//     hasProcessed.current = true;

//     const processAuth = async () => {
//       const hash = location.hash;
//       const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
//       if (sessionIdMatch) {
//         const sessionId = sessionIdMatch[1];
//         try {
//           const response = await axios.get(
//             `${API}/auth/session?session_id=${sessionId}`,
//             { withCredentials: true }
//           );
//           setUser(response.data);
//           navigate('/', { replace: true });
//         } catch (error) {
//           console.error("Auth callback error:", error);
//           navigate('/', { replace: true });
//         }
//       } else {
//         navigate('/', { replace: true });
//       }
//     };

//     processAuth();
//   }, []);

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-[#FFFCFA]">
//       <div className="text-center">
//         <div className="spinner mx-auto mb-4"></div>
//         <p className="text-[#7D7D7D]">Signing you in...</p>
//       </div>
//     </div>
//   );
// };

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, login } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFCFA]">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFCFA]">
        <div className="text-center">
          <h2 className="font-serif text-2xl mb-4">Please Sign In</h2>
          <p className="text-[#7D7D7D] mb-6">You need to be signed in to access this page.</p>
          <button onClick={login} className="btn-primary" data-testid="sign-in-btn">
            Sign In with Google
          </button>
        </div>
      </div>
    );
  }

  if (adminOnly && !user.is_admin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// App Router
function AppRouter() {
  const location = useLocation();

  // Check for session_id in URL hash synchronously
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/shop/:category" element={<ShopPage />} />
      <Route path="/product/:productId" element={<ProductPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={
        <ProtectedRoute>
          <CheckoutPage />
        </ProtectedRoute>
      } />
      <Route path="/order-confirmation" element={
        <ProtectedRoute>
          <OrderConfirmationPage />
        </ProtectedRoute>
      } />
      <Route path="/orders" element={
        <ProtectedRoute>
          <OrdersPage />
        </ProtectedRoute>
      } />
      <Route path="/track" element={<TrackOrderPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute adminOnly>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/products" element={
        <ProtectedRoute adminOnly>
          <AdminProducts />
        </ProtectedRoute>
      } />
      <Route path="/admin/orders" element={
        <ProtectedRoute adminOnly>
          <AdminOrders />
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRouter />
          <Toaster position="top-right" richColors />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
