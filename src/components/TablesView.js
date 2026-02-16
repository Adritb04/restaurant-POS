import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, ShoppingCart, Users, Grid, List, DollarSign, Move, Lock, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import './TablesView.css';

const STORAGE_KEY = 'floorplan_positions_v1';

function TablesView({ currentUser }) {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState('floor'); // 'floor' | 'list'
  const [activeZone, setActiveZone] = useState('interior'); // 'interior' | 'terraza' | 'barra'
  const [editMode, setEditMode] = useState(false);

  // pan/zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const api = window.electronAPI || window.localElectronAPI;

  // refs para drag/pan
  const canvasRef = useRef(null);
  const dragRef = useRef({
    draggingTableId: null,
    startClientX: 0,
    startClientY: 0,
    startX: 0,
    startY: 0,
    panning: false,
    panStartX: 0,
    panStartY: 0,
    panX: 0,
    panY: 0
  });

  const [positions, setPositions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    if (!api) {
      console.error('No API found: window.electronAPI or window.localElectronAPI is missing.');
      setLoading(false);
      return;
    }
    loadTables();
    loadProducts();
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTables = async () => {
    const result = await api.dbQuery('SELECT * FROM tables ORDER BY number');
    if (result.success) setTables(result.data);
    setLoading(false);
  };

  const loadProducts = async () => {
    const result = await api.dbQuery(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.available = 1'
    );
    if (result.success) setProducts(result.data);
  };

  const loadCategories = async () => {
    const result = await api.dbQuery('SELECT * FROM categories');
    if (result.success) setCategories(result.data);
  };

  const getCourseTypeByCategory = (categoryId) => {
    const categoryMap = { 1: 'entrante', 2: 'main', 3: 'postre', 4: 'bebida' };
    return categoryMap[categoryId] || 'main';
  };

  const getTableStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'var(--accent-success)';
      case 'occupied':
        return 'var(--accent-danger)';
      case 'reserved':
        return 'var(--accent-warning)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const fetchOrderForTable = async (table) => {
    const orderResult = await api.dbGet(
      "SELECT * FROM orders WHERE table_id = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1",
      [table.id]
    );

    if (orderResult.success && orderResult.data) {
      const itemsResult = await api.dbQuery(
        `
        SELECT oi.*, p.name as product_name, p.price as product_price
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `,
        [orderResult.data.id]
      );

      setCurrentOrder({
        ...orderResult.data,
        items: itemsResult.success ? itemsResult.data : []
      });
      return orderResult.data;
    }

    const newOrderResult = await api.dbRun(
      'INSERT INTO orders (table_id, employee_id, status) VALUES (?, ?, ?)',
      [table.id, currentUser.id, 'pending']
    );

    if (newOrderResult.success) {
      const newOrder = {
        id: newOrderResult.data.lastInsertRowid,
        table_id: table.id,
        employee_id: currentUser.id,
        status: 'pending',
        total: 0,
        items: []
      };
      setCurrentOrder(newOrder);
      return newOrder;
    }

    return null;
  };

  const handleTableClick = async (table) => {
    if (editMode) return; // en modo editar, click NO abre pedido (evita frustración)
    if (table.status === 'reserved') return;

    setSelectedTable(table);

    await api.dbRun("UPDATE tables SET status = 'occupied' WHERE id = ?", [table.id]);
    await fetchOrderForTable(table);
    loadTables();
  };

  const updateOrderTotal = async (orderId) => {
    const itemsResult = await api.dbQuery(
      'SELECT SUM(price * quantity) as total FROM order_items WHERE order_id = ?',
      [orderId]
    );

    if (itemsResult.success && itemsResult.data[0]) {
      const total = itemsResult.data[0].total || 0;
      await api.dbRun('UPDATE orders SET total = ? WHERE id = ?', [total, orderId]);
    }
  };

  const quickAddProduct = async (product) => {
    if (!currentOrder) return;

    await api.dbRun(
      `INSERT INTO order_items
       (order_id, product_id, quantity, price, course_type, notes, temperature, cooking_point, modifications, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        currentOrder.id,
        product.id,
        1,
        product.price,
        getCourseTypeByCategory(product.category_id),
        '',
        '',
        '',
        JSON.stringify([]),
        'preparing'
      ]
    );

    await updateOrderTotal(currentOrder.id);
    await fetchOrderForTable(selectedTable);
  };

  const removeItem = async (itemId) => {
    await api.dbRun('DELETE FROM order_items WHERE id = ?', [itemId]);
    await updateOrderTotal(currentOrder.id);
    await fetchOrderForTable(selectedTable);
  };

  const closeOrder = async (paymentMethod) => {
    if (!currentOrder || currentOrder.items.length === 0) return;

    await api.dbRun(
      "UPDATE orders SET status = 'completed', payment_method = ?, closed_at = CURRENT_TIMESTAMP WHERE id = ?",
      [paymentMethod, currentOrder.id]
    );

    await api.dbRun("UPDATE tables SET status = 'available' WHERE id = ?", [selectedTable.id]);

    for (const item of currentOrder.items) {
      await api.dbRun('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    setSelectedTable(null);
    setCurrentOrder(null);
    loadTables();
  };

  const closeModal = async () => {
    if (currentOrder && currentOrder.items.length === 0) {
      await api.dbRun('DELETE FROM orders WHERE id = ?', [currentOrder.id]);
      await api.dbRun("UPDATE tables SET status = 'available' WHERE id = ?", [selectedTable.id]);
      loadTables();
    }
    setSelectedTable(null);
    setCurrentOrder(null);
  };

  // ---------- PLANO: posiciones ----------
  const zoneTables = useMemo(() => tables.filter((t) => t.zone === activeZone), [tables, activeZone]);

  const ensureDefaultsForZone = (zone) => {
    // crea un layout inicial si no hay posiciones guardadas
    setPositions((prev) => {
      const next = { ...prev };
      if (!next[zone]) next[zone] = {};

      const existing = next[zone];

      // si ya tiene algo, no pisamos
      const hasAny = Object.keys(existing).length > 0;
      if (hasAny) return prev;

      // layout base: rejilla
      const spacingX = 180;
      const spacingY = 150;

      const list = tables.filter((t) => t.zone === zone).sort((a, b) => a.number - b.number);
      list.forEach((t, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        existing[t.id] = {
          x: 40 + col * spacingX,
          y: 40 + row * spacingY,
          w: zone === 'barra' ? 260 : 140,
          h: zone === 'barra' ? 90 : 90
        };
      });

      next[zone] = existing;
      return next;
    });
  };

  useEffect(() => {
    if (tables.length) {
      ensureDefaultsForZone(activeZone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables.length, activeZone]);

  const getPos = (tableId) => {
    const z = positions[activeZone] || {};
    return z[tableId] || { x: 60, y: 60, w: 140, h: 90 };
  };

  const setPos = (tableId, patch) => {
    setPositions((prev) => {
      const next = { ...prev };
      if (!next[activeZone]) next[activeZone] = {};
      const current = next[activeZone][tableId] || { x: 60, y: 60, w: 140, h: 90 };
      next[activeZone][tableId] = { ...current, ...patch };
      return next;
    });
  };

  // ---------- Drag mesa / Pan canvas ----------
  const onTablePointerDown = (e, tableId) => {
    // en móvil evita scroll accidental
    e.preventDefault();
    e.stopPropagation();

    if (!editMode) return; // solo draggable en editMode

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const p = getPos(tableId);

    dragRef.current.draggingTableId = tableId;
    dragRef.current.startClientX = e.clientX;
    dragRef.current.startClientY = e.clientY;
    dragRef.current.startX = p.x;
    dragRef.current.startY = p.y;

    // capture pointer
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const onCanvasPointerDown = (e) => {
    // Pan con dedo/ratón cuando NO estás moviendo mesas
    if (editMode) return; // en editMode, panning lo puedes hacer con rueda/zoom botones; si quieres pan también, lo habilito luego
    dragRef.current.panning = true;
    dragRef.current.panStartX = e.clientX;
    dragRef.current.panStartY = e.clientY;
    dragRef.current.panX = pan.x;
    dragRef.current.panY = pan.y;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;

    // mover mesa
    if (d.draggingTableId) {
      const dx = (e.clientX - d.startClientX) / zoom;
      const dy = (e.clientY - d.startClientY) / zoom;

      // snap a rejilla suave (10px)
      const nx = Math.round((d.startX + dx) / 10) * 10;
      const ny = Math.round((d.startY + dy) / 10) * 10;

      setPos(d.draggingTableId, { x: nx, y: ny });
      return;
    }

    // pan
    if (d.panning) {
      const dx = e.clientX - d.panStartX;
      const dy = e.clientY - d.panStartY;
      setPan({ x: d.panX + dx, y: d.panY + dy });
    }
  };

  const onPointerUp = () => {
    dragRef.current.draggingTableId = null;
    dragRef.current.panning = false;
  };

  const onWheel = (e) => {
    // zoom con rueda (desktop)
    if (!canvasRef.current) return;
    e.preventDefault();

    const delta = -Math.sign(e.deltaY) * 0.08;
    setZoom((z) => {
      const nz = Math.min(2.2, Math.max(0.6, +(z + delta).toFixed(2)));
      return nz;
    });
  };

  const fitToView = () => {
    // simple: centrar y reset zoom
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // ---------- productos ----------
  const filteredProducts = useMemo(() => {
    return selectedCategory ? products.filter((p) => p.category_id === selectedCategory) : products;
  }, [products, selectedCategory]);

  const total = useMemo(() => {
    if (!currentOrder?.items?.length) return 0;
    return currentOrder.items.reduce((sum, it) => sum + (it.price || it.product_price || 0) * it.quantity, 0);
  }, [currentOrder]);

  if (!api) {
    return (
      <div className="loading-container">
        <div style={{ color: '#fff' }}>
          No hay API de BD disponible. Carga <b>src/utils/localDB.js</b> en <b>src/index.js</b>.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">Gestión de Mesas</h1>
          <p className="view-subtitle">Selecciona una mesa para tomar pedidos</p>
        </div>

        <div className="tables-top-actions">
          <div className="view-mode-toggle">
            <button className={`mode-btn ${viewMode === 'floor' ? 'active' : ''}`} onClick={() => setViewMode('floor')}>
              <Grid size={20} />
              Plano
            </button>
            <button className={`mode-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
              <List size={20} />
              Lista
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="tables-grid">
          {tables.map((table) => (
            <div
              key={table.id}
              className={`table-card ${table.status}`}
              onClick={() => table.status !== 'reserved' && handleTableClick(table)}
              style={{ borderColor: getTableStatusColor(table.status) }}
            >
              <div className="table-number">Mesa {table.number}</div>
              <div className="table-info">
                <Users size={16} />
                <span>{table.capacity} personas</span>
              </div>
              <div className="table-zone">{table.zone}</div>
              <div className={`table-status-badge ${table.status}`}>
                {table.status === 'available' ? 'Disponible' : table.status === 'occupied' ? 'Ocupada' : 'Reservada'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="floor-wrapper">
          {/* Tabs zona */}
          <div className="zone-tabs">
            <button className={`zone-tab ${activeZone === 'interior' ? 'active' : ''}`} onClick={() => setActiveZone('interior')}>
              Salón
            </button>
            <button className={`zone-tab ${activeZone === 'terraza' ? 'active' : ''}`} onClick={() => setActiveZone('terraza')}>
              Terraza
            </button>
            <button className={`zone-tab ${activeZone === 'barra' ? 'active' : ''}`} onClick={() => setActiveZone('barra')}>
              Barra
            </button>

            <div className="zone-tools">
              <button
                className={`tool-btn ${editMode ? 'active' : ''}`}
                onClick={() => setEditMode((s) => !s)}
                title={editMode ? 'Salir de editar' : 'Editar plano (mover mesas)'}
              >
                {editMode ? <Lock size={16} /> : <Move size={16} />}
                <span className="tool-btn-text">{editMode ? 'Bloquear' : 'Editar'}</span>
              </button>

              <button className="tool-btn" onClick={() => setZoom((z) => Math.min(2.2, +(z + 0.1).toFixed(2)))} title="Zoom +">
                <ZoomIn size={16} />
              </button>
              <button className="tool-btn" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.1).toFixed(2)))} title="Zoom -">
                <ZoomOut size={16} />
              </button>
              <button className="tool-btn" onClick={fitToView} title="Centrar">
                <Maximize2 size={16} />
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div
            className={`floor-canvas ${editMode ? 'edit' : ''}`}
            ref={canvasRef}
            onPointerDown={onCanvasPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
          >
            <div
              className="floor-stage"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
              }}
            >
              {zoneTables.map((table) => {
                const p = getPos(table.id);
                const occupiedBg = table.status === 'occupied' ? 'rgba(239, 68, 68, 0.10)' : 'rgba(255,255,255,0.02)';

                return (
                  <div
                    key={table.id}
                    className={`floor-table-abs ${table.status}`}
                    style={{
                      left: p.x,
                      top: p.y,
                      width: p.w,
                      height: p.h,
                      borderColor: getTableStatusColor(table.status),
                      background: occupiedBg
                    }}
                    onClick={() => handleTableClick(table)}
                    onPointerDown={(e) => onTablePointerDown(e, table.id)}
                    title={editMode ? 'Arrastra para mover' : 'Click para abrir'}
                  >
                    <div className="floor-table-num">{table.number}</div>
                    <div className="floor-table-meta">
                      <Users size={13} />
                      <span>{table.capacity}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* hint */}
            <div className="floor-hint">
              {editMode ? 'Modo edición: arrastra mesas para colocarlas' : 'Arrastra el plano para moverte · Click en mesa para abrir'}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PEDIDO */}
      {selectedTable && currentOrder && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Mesa {selectedTable.number}</h2>
                <div className="order-id">Pedido #{currentOrder.id}</div>
              </div>
              <button className="icon-btn" onClick={closeModal} title="Cerrar">
                <X size={18} />
              </button>
            </div>

            <div className="order-content">
              {/* Productos */}
              <div className="products-section">
                <div className="categories-filter">
                  <button
                    className={`category-btn ${selectedCategory === null ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(null)}
                  >
                    Todas
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      className={`category-btn ${selectedCategory === c.id ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(c.id)}
                    >
                      {c.icon ? c.icon : ''} {c.name}
                    </button>
                  ))}
                </div>

                <div className="products-grid">
                  {filteredProducts.map((p) => (
                    <div key={p.id} className="product-card" onClick={() => quickAddProduct(p)}>
                      <div className="product-name">{p.name}</div>
                      <div className="product-price">{Number(p.price).toFixed(2)}€</div>
                      {p.stock <= (p.min_stock || 0) ? <div className="product-low-stock">Bajo stock</div> : null}
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumen */}
              <div className="order-summary">
                <div className="summary-title">
                  <ShoppingCart size={18} /> Resumen
                </div>

                <div className="order-items">
                  {!currentOrder.items.length ? (
                    <div className="empty-order">
                      <div>Añade productos</div>
                      <div className="text-secondary">Haz click en un producto para añadirlo</div>
                    </div>
                  ) : (
                    currentOrder.items.map((it) => (
                      <div key={it.id} className="order-item">
                        <div className="item-info">
                          <div className="item-name">
                            {it.quantity}× {it.product_name}
                          </div>
                          <div className="item-price">{Number(it.price).toFixed(2)}€</div>
                        </div>
                        <div className="item-actions">
                          <button className="qty-btn" onClick={() => removeItem(it.id)} title="Eliminar">
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="order-total">
                  <div className="total-row total-final">
                    <span>Total</span>
                    <span>{total.toFixed(2)}€</span>
                  </div>
                </div>

                <div className="payment-actions">
                  <button className="btn btn-primary" onClick={() => closeOrder('cash')}>
                    <DollarSign size={16} /> Efectivo
                  </button>
                  <button className="btn btn-secondary" onClick={() => closeOrder('card')}>
                    <DollarSign size={16} /> Tarjeta
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TablesView;
