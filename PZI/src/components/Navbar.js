import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

function Navbar({ user, userRole }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
      setOpen(false);
    } catch (error) {
      console.error('Greška pri odjavi:', error);
    }
  };

  const MenuLink = ({ to, children, onClick }) => (
    <Link
      to={to}
      onClick={() => { setOpen(false); onClick?.(); }}
      className="block px-3 py-2 rounded-lg hover:bg-blue-500/20"
    >
      {children}
    </Link>
  );

  return (
    <nav className="bg-blue-600 text-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight">Volontiranje HR</Link>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-4">
          <MenuLink to="/">Početna</MenuLink>

          {user ? (
            <>
              <MenuLink to="/dashboard">Dashboard</MenuLink>
              {userRole === 'admin' && <MenuLink to="/admin">Admin Panel</MenuLink>}
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-lg hover:bg-blue-500/20 text-left"
                title={user.email}
              >
                Odjava ({user.email})
              </button>
            </>
          ) : (
            <>
              <MenuLink to="/login">Prijava</MenuLink>
              <MenuLink to="/register">Registracija</MenuLink>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden inline-flex items-center justify-center p-2 rounded-lg hover:bg-blue-500/20 focus:outline-none"
          aria-expanded={open}
          aria-label="Toggle menu"
          onClick={() => setOpen(!open)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu (collapsible) */}
      {open && (
        <div className="md:hidden border-t border-white/10">
          <div className="container mx-auto px-4 py-2 space-y-1">
            <MenuLink to="/">Početna</MenuLink>

            {user ? (
              <>
                <MenuLink to="/dashboard">Dashboard</MenuLink>
                {userRole === 'admin' && <MenuLink to="/admin">Admin Panel</MenuLink>}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-500/20"
                  title={user.email}
                >
                  Odjava ({user.email})
                </button>
              </>
            ) : (
              <>
                <MenuLink to="/login">Prijava</MenuLink>
                <MenuLink to="/register">Registracija</MenuLink>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
