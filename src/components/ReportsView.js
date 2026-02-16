import React from 'react';

function ReportsView() {
  return (
    <div className="view-container">
      <div className="view-header">
        <h1 className="view-title">Reportes y Estadísticas</h1>
        <p className="view-subtitle">Análisis de ventas y rendimiento</p>
      </div>
      <div className="card">
        <p style={{color: 'var(--text-secondary)'}}>
          Próximamente: Reportes de ventas, productos más vendidos, análisis por período, gráficas interactivas
        </p>
      </div>
    </div>
  );
}

export default ReportsView;
