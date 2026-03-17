import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar: React.FC = () => {
  return (
    <div className="bg-slate-200 h-full w-64 rounded-l-lg shadow-md">
      <ul className="p-4">
        <li>
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `block p-2 my-2 rounded-lg transition-all duration-300 ease-in-out ${isActive ? 'bg-teal-700 text-white rounded-lg' : 'text-slate-700 hover:bg-slate-300 hover:text-slate-900'}`}
          >
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink 
            to="/products" 
            className={({ isActive }) => `block p-2 my-2 rounded-lg transition-all duration-300 ease-in-out ${isActive ? 'bg-teal-700 text-white rounded-lg' : 'text-slate-700 hover:bg-slate-300 hover:text-slate-900'}`}
          >
            Products
          </NavLink>
        </li>
        <li>
          <NavLink 
            to="/sales" 
            className={({ isActive }) => `block p-2 my-2 rounded-lg transition-all duration-300 ease-in-out ${isActive ? 'bg-teal-700 text-white rounded-lg' : 'text-slate-700 hover:bg-slate-300 hover:text-slate-900'}`}
          >
            Sales
          </NavLink>
        </li>
        <li>
          <NavLink 
            to="/settings" 
            className={({ isActive }) => `block p-2 my-2 rounded-lg transition-all duration-300 ease-in-out ${isActive ? 'bg-teal-700 text-white rounded-lg' : 'text-slate-700 hover:bg-slate-300 hover:text-slate-900'}`}
          >
            Settings
          </NavLink>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;