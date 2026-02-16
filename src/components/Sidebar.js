import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Utensils,
  Menu,
  Package,
  BarChart3,
  Users,
  QrCode,
  ChefHat,
  LogOut,
  User,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import './Sidebar.css';

function Sidebar({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(() => {
    const v = localStorage.getItem('sidebar_collapsed');
    return v === '1';
  });

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  const menuItems = useMemo(
    () => [
      { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { id: 'tables', icon: Utensils, label: 'Mesas', path: '/tables' },
      { id: 'menu', icon: Menu, label: 'Menú', path: '/menu' },
      { id: 'inventory', icon: Package, label: 'Inventario', path: '/inventory' },
      { id: 'kitchen', icon: ChefHat, label: 'Cocina', path: '/kitchen' },
      { id: 'reports', icon: BarChart3, label: 'Reportes', path: '/reports' },
      { id: 'employees', icon: Users, label: 'Empleados', path: '/employees', adminOnly: true },
      { id: 'digital-menu', icon: QrCode, label: 'Carta Digital', path: '/digital-menu' }
    ],
    []
  );

  const isActive = (path) => location.pathname === path;

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo" onClick={() => navigate('/tables')} role="button" tabIndex={0}>
          <div className="logo-icon">
            <Utensils size={22} />
          </div>
          {!collapsed && (
            <div className="logo-text">
              <h1>Restaurant</h1>
              <span>POS System</span>
            </div>
          )}
        </div>

        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed((s) => !s)}
          title={collapsed ? 'Expandir' : 'Minimizar'}
          aria-label={collapsed ? 'Expandir sidebar' : 'Minimizar sidebar'}
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          if (item.adminOnly && currentUser?.role !== 'admin') return null;

          return (
            <button
              key={item.id}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info" title={collapsed ? `${currentUser?.name || ''}` : undefined}>
          <div className="user-avatar">
            <User size={18} />
          </div>

          {!collapsed && (
            <div className="user-details">
              <div className="user-name">{currentUser?.name}</div>
              <div className="user-role">{currentUser?.role === 'admin' ? 'Administrador' : 'Camarero'}</div>
            </div>
          )}
        </div>

        <button className="logout-btn" onClick={onLogout} title="Salir" aria-label="Salir">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
