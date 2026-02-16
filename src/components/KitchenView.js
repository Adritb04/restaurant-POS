import React, { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle, AlertCircle, ChefHat, Play, Check, X, Filter } from 'lucide-react';
import './KitchenView.css';

function KitchenView() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, preparing
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef(null);
  const prevOrdersCount = useRef(0);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 3000); // Actualizar cada 3 segundos
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Reproducir sonido cuando llega un nuevo pedido
    if (soundEnabled && orders.length > prevOrdersCount.current && prevOrdersCount.current > 0) {
      playNotificationSound();
    }
    prevOrdersCount.current = orders.length;
  }, [orders, soundEnabled]);

  const loadOrders = async () => {
    try {
      const result = await window.electronAPI.dbQuery(`
        SELECT 
          o.id,
          o.table_id,
          o.created_at,
          o.status,
          t.number as table_number,
          e.name as waiter_name
        FROM orders o
        LEFT JOIN tables t ON o.table_id = t.id
        LEFT JOIN employees e ON o.employee_id = e.id
        WHERE o.status IN ('pending', 'preparing', 'ready')
        ORDER BY o.created_at ASC
      `);

      if (result.success) {
        // Cargar items para cada orden
        const ordersWithItems = await Promise.all(
          result.data.map(async (order) => {
            const itemsResult = await window.electronAPI.dbQuery(`
              SELECT 
                oi.*,
                p.name as product_name,
                p.description,
                c.name as category_name,
                c.icon as category_icon
              FROM order_items oi
              JOIN products p ON oi.product_id = p.id
              LEFT JOIN categories c ON p.category_id = c.id
              WHERE oi.order_id = ?
            `, [order.id]);

            return {
              ...order,
              items: itemsResult.success ? itemsResult.data : [],
              elapsed_time: getElapsedMinutes(order.created_at)
            };
          })
        );

        setOrders(ordersWithItems);
      }
    } catch (error) {
      console.error('Error loading kitchen orders:', error);
    }
  };

  const getElapsedMinutes = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    return Math.floor((now - created) / 1000 / 60);
  };

  const playNotificationSound = () => {
    // Crear un beep simple usando Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    await window.electronAPI.dbRun(
      'UPDATE orders SET status = ? WHERE id = ?',
      [newStatus, orderId]
    );
    loadOrders();
    
    if (newStatus === 'ready') {
      playNotificationSound();
    }
  };

  const updateItemStatus = async (itemId, newStatus) => {
    await window.electronAPI.dbRun(
      'UPDATE order_items SET status = ? WHERE id = ?',
      [newStatus, itemId]
    );
    loadOrders();
  };

  const getUrgencyLevel = (elapsedMinutes) => {
    if (elapsedMinutes > 20) return 'critical';
    if (elapsedMinutes > 15) return 'urgent';
    if (elapsedMinutes > 10) return 'warning';
    return 'normal';
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return '#dc2626';
      case 'urgent': return '#ea580c';
      case 'warning': return '#f59e0b';
      default: return '#10b981';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#6366f1';
      case 'preparing': return '#f59e0b';
      case 'ready': return '#10b981';
      default: return '#64748b';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Listo';
      default: return status;
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'pending') return order.status === 'pending';
    if (filter === 'preparing') return order.status === 'preparing';
    return true;
  });

  // Agrupar órdenes por urgencia
  const criticalOrders = filteredOrders.filter(o => getUrgencyLevel(o.elapsed_time) === 'critical');
  const urgentOrders = filteredOrders.filter(o => getUrgencyLevel(o.elapsed_time) === 'urgent');
  const warningOrders = filteredOrders.filter(o => getUrgencyLevel(o.elapsed_time) === 'warning');
  const normalOrders = filteredOrders.filter(o => getUrgencyLevel(o.elapsed_time) === 'normal');

  const sortedOrders = [...criticalOrders, ...urgentOrders, ...warningOrders, ...normalOrders];

  return (
    <div className="kitchen-container">
      {/* Header */}
      <div className="kitchen-header">
        <div className="kitchen-title-section">
          <ChefHat size={32} />
          <div>
            <h1 className="kitchen-title">Vista de Cocina</h1>
            <p className="kitchen-subtitle">
              {orders.length} pedido{orders.length !== 1 ? 's' : ''} activo{orders.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="kitchen-controls">
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Todos ({orders.length})
            </button>
            <button
              className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pendientes ({orders.filter(o => o.status === 'pending').length})
            </button>
            <button
              className={`filter-btn ${filter === 'preparing' ? 'active' : ''}`}
              onClick={() => setFilter('preparing')}
            >
              En Preparación ({orders.filter(o => o.status === 'preparing').length})
            </button>
          </div>

          <button
            className={`sound-toggle ${soundEnabled ? 'active' : ''}`}
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Silenciar notificaciones' : 'Activar notificaciones'}
          >
            {soundEnabled ? '🔔' : '🔕'}
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="kitchen-orders-grid">
        {sortedOrders.length === 0 ? (
          <div className="kitchen-empty">
            <ChefHat size={64} />
            <p>No hay pedidos pendientes</p>
            <p className="text-secondary">Los nuevos pedidos aparecerán aquí automáticamente</p>
          </div>
        ) : (
          sortedOrders.map(order => {
            const urgency = getUrgencyLevel(order.elapsed_time);
            const urgencyColor = getUrgencyColor(urgency);

            return (
              <div
                key={order.id}
                className={`kitchen-order-card ${urgency} ${order.status}`}
                style={{ borderColor: urgencyColor }}
              >
                {/* Order Header */}
                <div className="order-card-header">
                  <div className="order-info">
                    <div className="order-table">
                      Mesa {order.table_number}
                    </div>
                    <div className="order-id">#{order.id}</div>
                  </div>
                  <div className="order-timer" style={{ color: urgencyColor }}>
                    <Clock size={20} />
                    <span className="timer-value">{order.elapsed_time} min</span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="order-items-list">
                  {order.items.map(item => (
                    <div key={item.id} className={`order-item ${item.status}`}>
                      <div className="item-header">
                        <div className="item-info">
                          <span className="item-icon">{item.category_icon}</span>
                          <div>
                            <div className="item-name">
                              <span className="item-qty">×{item.quantity}</span>
                              {item.product_name}
                            </div>
                            {item.notes && (
                              <div className="item-notes">
                                <AlertCircle size={14} />
                                {item.notes}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          className={`item-check-btn ${item.status === 'ready' ? 'checked' : ''}`}
                          onClick={() => updateItemStatus(
                            item.id,
                            item.status === 'ready' ? 'preparing' : 'ready'
                          )}
                        >
                          <Check size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Actions */}
                <div className="order-actions">
                  {order.status === 'pending' && (
                    <button
                      className="action-btn btn-start"
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                    >
                      <Play size={18} />
                      Comenzar
                    </button>
                  )}
                  
                  {order.status === 'preparing' && (
                    <>
                      <button
                        className="action-btn btn-ready"
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        disabled={order.items.some(item => item.status !== 'ready')}
                      >
                        <CheckCircle size={18} />
                        Listo para Servir
                      </button>
                    </>
                  )}

                  {order.status === 'ready' && (
                    <div className="ready-indicator">
                      <CheckCircle size={20} />
                      <span>Listo para servir</span>
                    </div>
                  )}
                </div>

                {/* Urgency Indicator */}
                {urgency !== 'normal' && (
                  <div className="urgency-badge" style={{ backgroundColor: urgencyColor }}>
                    {urgency === 'critical' && '🔥 URGENTE'}
                    {urgency === 'urgent' && '⚠️ Prioritario'}
                    {urgency === 'warning' && '⏰ Atención'}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Statistics Bar */}
      <div className="kitchen-stats-bar">
        <div className="stat-item">
          <div className="stat-label">Pendientes</div>
          <div className="stat-value" style={{ color: '#6366f1' }}>
            {orders.filter(o => o.status === 'pending').length}
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-label">En Preparación</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>
            {orders.filter(o => o.status === 'preparing').length}
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Listos</div>
          <div className="stat-value" style={{ color: '#10b981' }}>
            {orders.filter(o => o.status === 'ready').length}
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Tiempo Promedio</div>
          <div className="stat-value">
            {orders.length > 0
              ? Math.round(orders.reduce((sum, o) => sum + o.elapsed_time, 0) / orders.length)
              : 0} min
          </div>
        </div>
      </div>
    </div>
  );
}

export default KitchenView;
