import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const linkBase = 'px-3 py-1 rounded text-sm font-medium';
const activeClass = `${linkBase} bg-blue-800 text-white`;
const inactiveClass = `${linkBase} text-blue-100 hover:bg-blue-700`;

const NavBar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-blue-600 dark:bg-blue-900 px-4 py-2 flex items-center justify-between mb-4">
      <h1 className="text-xl font-bold text-white">HamLog</h1>
      <div className="flex items-center space-x-2">
        <NavLink to="/" end className={({ isActive }) => isActive ? activeClass : inactiveClass}>
          Log
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
          Settings
        </NavLink>
      </div>
      <div className="flex items-center space-x-3">
        <span className="text-sm text-blue-100 font-mono">{user?.callsign}</span>
        <button
          onClick={logout}
          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
