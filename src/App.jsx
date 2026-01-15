import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth } from './utils/firebase'; // Ensure your firebase path is correct
import { onAuthStateChanged } from 'firebase/auth';
import ShopCreation from './pages/ShopCreation'; // Import your new page
import Login from './components/Login';
import PageTransition from './components/page-transition';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import { Toaster } from 'sonner';
import StockEntry from './pages/StockEntry';
import InventoryPage from './pages/Inventory';

function App() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes (login/logout/refresh)
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup
  }, []);

  if (loading) return null; // Or a sleek GSAP spinner/loading screen

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