import React from 'react';

function EmployeesView() {
  return (
    <div className="view-container">
      <div className="view-header">
        <h1 className="view-title">Empleados</h1>
        <p className="view-subtitle">Gestión de personal y permisos</p>
      </div>
      <div className="card">
        <p style={{color: 'var(--text-secondary)'}}>
          Próximamente: Gestión de empleados, roles, horarios y permisos de acceso
        </p>
      </div>
    </div>
  );
}

export default EmployeesView;
