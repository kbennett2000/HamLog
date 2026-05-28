import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Radio, LogOut, Menu, X } from 'lucide-react';

const NavBar: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkBase = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors';
  const activeClass = `${linkBase} bg-[var(--color-nav-active)] text-[var(--color-nav-text-active)]`;
  const inactiveClass = `${linkBase} text-[var(--color-nav-text)] hover:text-[var(--color-nav-text-active)] hover:bg-[var(--color-nav-active)]`;

  return (
    <nav className="bg-[var(--color-nav-bg)] border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary-400" />
            <span className="text-lg font-bold text-white tracking-tight">HamLog</span>
          </div>

          <div className="hidden sm:flex items-center gap-1">
            <NavLink to="/" end className={({ isActive }) => isActive ? activeClass : inactiveClass}>
              Log
            </NavLink>
            <NavLink to="/map" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
              Map
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
              Settings
            </NavLink>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <span className="text-sm font-mono font-semibold text-primary-300 bg-white/5 px-2.5 py-1 rounded-md">
              {user?.callsign}
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-[var(--color-nav-text)] hover:text-danger-400 text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>

          <button
            className="sm:hidden text-[var(--color-nav-text)] hover:text-white p-1"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="sm:hidden border-t border-white/5 px-4 py-3 space-y-2 animate-slide-in-up">
          <div className="flex items-center gap-2 pb-2 mb-2 border-b border-white/5">
            <span className="text-sm font-mono font-semibold text-primary-300">
              {user?.callsign}
            </span>
          </div>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `block ${isActive ? activeClass : inactiveClass}`}
            onClick={() => setMobileOpen(false)}
          >
            Log
          </NavLink>
          <NavLink
            to="/map"
            className={({ isActive }) => `block ${isActive ? activeClass : inactiveClass}`}
            onClick={() => setMobileOpen(false)}
          >
            Map
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) => `block ${isActive ? activeClass : inactiveClass}`}
            onClick={() => setMobileOpen(false)}
          >
            Settings
          </NavLink>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-[var(--color-nav-text)] hover:text-danger-400 text-sm pt-2 mt-2 border-t border-white/5 w-full"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
