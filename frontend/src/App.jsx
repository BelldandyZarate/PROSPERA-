import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoadingScreen from './components/LoadingScreen';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import Profile from './components/profile/Profile';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './App.css';

// ==============================
// Persistencia de ruta
// ==============================
const RoutePersister = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!['/login', '/register'].includes(location.pathname)) {
      sessionStorage.setItem('lastPath', location.pathname);
    }
  }, [location]);

  useEffect(() => {
    if (user) {
      const lastPath = sessionStorage.getItem('lastPath');
      if (
        lastPath &&
        lastPath !== location.pathname &&
        !['/login', '/register'].includes(lastPath)
      ) {
        setTimeout(() => {
          window.history.replaceState(null, '', lastPath);
        }, 100);
      }
    }
  }, [user]);

  return null;
};

// ==============================
// App content
// ==============================
const AppContent = () => {
  const { loading, user } = useAuth();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setIsInitialLoad(false), 500);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading || isInitialLoad) {
    return <LoadingScreen />;
  }

  return (
    <div className="App">
      <RoutePersister />
      <Navbar />

      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protegidas */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRoles={['superadministrador']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route
          path="*"
          element={
            user ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />
          }
        />
      </Routes>
    </div>
  );
};

// ==============================
// Root
// ==============================
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
