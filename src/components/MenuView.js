import React from 'react';

function MenuView() {
  return (
    <div className="view-container">
      <div className="view-header">
        <h1 className="view-title">Gestión de Menú</h1>
        <p className="view-subtitle">Administra productos, categorías y precios</p>
      </div>
      <div className="card">
        <p style={{color: 'var(--text-secondary)'}}>
          Próximamente: Gestión completa de productos, categorías, modificadores y precios
        </p>
      </div>
    </div>
  );
}

export default MenuView;
