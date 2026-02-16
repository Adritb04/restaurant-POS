import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, TrendingUp, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';
import './Dashboard.css';

function Dashboard({ currentUser }) {
  const [stats, setStats] = useState({
    todaySales: 0,
    todayOrders: 0,
    activeTables: 0,
    avgOrderValue: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    loadStats();
    loadRecentOrders();
  }, []);

  const loadStats = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const salesResult = await window.electronAPI.dbGet(
      `SELECT SUM(total) as total, COUNT(*) as count 
       FROM orders 
       WHERE DATE(created_at) = ? AND status = 'completed'`,
      [today]
    );

    const tablesResult = await window.electronAPI.dbGet(
      "SELECT COUNT(*) as count FROM tables WHERE status = 'occupied'"
    );

    if (salesResult.success && tablesResult.success) {
      const total = salesResult.data?.total || 0;
      const count = salesResult.data?.count || 0;
      
      setStats({
        todaySales: total,
        todayOrders: count,
        activeTables: tablesResult.data?.count || 0,
        avgOrderValue: count > 0 ? total / count : 0
      });
    }
  };

  const loadRecentOrders = async () => {
    const result = await window.electronAPI.dbQuery(
      `SELECT o.*, t.number as table_number, e.name as employee_name 
       FROM orders o 
       LEFT JOIN tables t ON o.table_id = t.id 
       LEFT JOIN employees e ON o.employee_id = e.id 
       WHERE o.status = 'completed' 
       ORDER BY o.closed_at DESC 
       LIMIT 10`
    );

    if (result.success) {
      setRecentOrders(result.data);
    }
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <h1 className="view-title">Dashboard</h1>
        <p className="view-subtitle">Bienvenido, {currentUser.name}</p>
      </div>

      <div className="grid grid-4">
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(16, 185, 129, 0.1)'}}>
            <DollarSign size={24} style={{color: 'var(--accent-success)'}} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Ventas Hoy</div>
            <div className="stat-value">€{stats.todaySales.toFixed(2)}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(99, 102, 241, 0.1)'}}>
            <ShoppingBag size={24} style={{color: 'var(--accent-primary)'}} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Pedidos Hoy</div>
            <div className="stat-value">{stats.todayOrders}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(239, 68, 68, 0.1)'}}>
            <Users size={24} style={{color: 'var(--accent-danger)'}} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Mesas Activas</div>
            <div className="stat-value">{stats.activeTables}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(245, 158, 11, 0.1)'}}>
            <TrendingUp size={24} style={{color: 'var(--accent-warning)'}} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Ticket Promedio</div>
            <div className="stat-value">€{stats.avgOrderValue.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{marginTop: '32px'}}>
        <div className="card-header">
          <h3 className="card-title">Pedidos Recientes</h3>
        </div>
        <div className="orders-table">
          {recentOrders.length === 0 ? (
            <div style={{padding: '40px', textAlign: 'center', color: 'var(--text-secondary)'}}>
              No hay pedidos recientes
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Mesa</th>
                  <th>Camarero</th>
                  <th>Total</th>
                  <th>Pago</th>
                  <th>Hora</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id}>
                    <td className="text-mono">#{order.id}</td>
                    <td>Mesa {order.table_number}</td>
                    <td>{order.employee_name}</td>
                    <td className="text-mono">€{order.total.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${order.payment_method === 'cash' ? 'badge-success' : 'badge-info'}`}>
                        {order.payment_method === 'cash' ? 'Efectivo' : 'Tarjeta'}
                      </span>
                    </td>
                    <td className="text-secondary">
                      {order.closed_at ? format(new Date(order.closed_at), 'HH:mm') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
