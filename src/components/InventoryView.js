import React from 'react';

function InventoryView() {
  return (
    <div className="view-container">
      <div className="view-header">
        <h1 className="view-title">Inventario</h1>
        <p className="view-subtitle">Control de stock y alertas de productos</p>
      </div>
      <div className="card">
        <p style={{color: 'var(--text-secondary)'}}>
          Próximamente: Control de stock en tiempo real, alertas de stock bajo, historial de movimientos
        </p>
      </div>
    </div>
  );
}

export default InventoryView;
