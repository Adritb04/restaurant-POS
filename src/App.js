import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Componentes
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import TablesView from './components/TablesView';
import MenuView from './components/MenuView';
import InventoryView from './components/InventoryView';
import ReportsView from './components/ReportsView';
import EmployeesView from './components/EmployeesView';
import DigitalMenuView from './components/DigitalMenuView';
import KitchenView from './components/KitchenView';
import Sidebar from './components/Sidebar';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="app-container">
        <Sidebar currentUser={currentUser} onLogout={handleLogout} />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/tables" replace />} />
            <Route path="/dashboard" element={<Dashboard currentUser={currentUser} />} />
            <Route path="/tables" element={<TablesView currentUser={currentUser} />} />
            <Route path="/menu" element={<MenuView />} />
            <Route path="/inventory" element={<InventoryView />} />
            <Route path="/reports" element={<ReportsView />} />
            <Route path="/employees" element={<EmployeesView />} />
            <Route path="/digital-menu" element={<DigitalMenuView />} />
            <Route path="/kitchen" element={<KitchenView />} />
            <Route path="*" element={<Navigate to="/tables" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
