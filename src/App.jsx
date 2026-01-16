// deployment read build
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth, db } from './utils/firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import Login from './components/Login';
import PageTransition from './components/page-transition';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import { Toaster } from 'sonner';
import StockEntry from './pages/StockEntry';
// import ShopCreation from './pages/ShopCreation'; 
import InventoryPage from './pages/Inventory';
import { doc, onSnapshot } from 'firebase/firestore';
import ShopCreation from './pages/ShopCreation';

function App() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [darkMode, setDarkMode] = useState(false);

  // 🔹 Global Firestore listener
  useEffect(() => {
    const ref = doc(db, "settings", "global");
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setDarkMode(!!snap.data().dark_mode);
      }
    });
  }, []);

  // 🔹 Apply shadcn dark class
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);


  useEffect(() => {
    // Listen for auth state changes (login/logout/refresh)
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe(); 
  }, []);

  if (loading) return null; 

  return (
    <PageTransition key={location.pathname}>
      <Toaster position="top-center" richColors />
      
      {/* Navbar only shows if user is logged in */}
      {user && <Navbar user={user} />}

      <Routes location={location}>
        {/* If user is logged in, don't let them go back to login page */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" /> : <Login />} 
        />
        {/* <Route 
          path="/forgot-password" 
          element={user ? <Navigate to="/dashboard" /> : <ForgotPassword />} 
        /> */}

        

        {/* Protected Route: If not logged in, force to login */}
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard /> : <Navigate to="/login" />} 
        />
        {/* Protected Shops Page */}
        <Route 
          path="/shops" 
          element={user ? <ShopCreation /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/stock-entery" 
          element={user ? <StockEntry /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/inventory" 
          element={user ? <InventoryPage /> : <Navigate to="/login" />} 
        />
        
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </PageTransition>
  );
}

export default App;