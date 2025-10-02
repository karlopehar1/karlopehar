// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import './index.css';

import Navbar from './components/Navbar';
import Homepage from './pages/Homepage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('gost');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Dohvati ulogu korisnika iz Firestore
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role || 'korisnik');
        }
      } else {
        setUser(null);
        setUserRole('gost');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Učitava...</div>;
  }

function ScrollToHash() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash]);
  return null;
}

return (
  <BrowserRouter>
    <ScrollToHash />
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} userRole={userRole} />

      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} userRole={userRole} /> : <Navigate to="/login" />} />
        <Route path="/admin" element={user && userRole === 'admin' ? <AdminPanel /> : <Navigate to="/" />} />
      </Routes>
    </div>
  </BrowserRouter>
);
}

export default App;