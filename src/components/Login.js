import React, { useState } from 'react';
import { LogIn, User, Lock } from 'lucide-react';
import './Login.css';

function Login({ onLogin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ API selector (Electron preload o fallback localDB)
  const api = window.electronAPI || window.localElectronAPI;

  const handlePinInput = (number) => {
    if (pin.length < 4) setPin(pin + number);
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleLogin = async () => {
    if (!api) {
      setError('No hay API de BD disponible');
      return;
    }

    if (pin.length !== 4) {
      setError('El PIN debe tener 4 dígitos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await api.dbGet(
        'SELECT * FROM employees WHERE pin = ? AND active = 1',
        [pin]
      );

      if (result.success && result.data) {
        onLogin(result.data);
      } else {
        setError('PIN incorrecto');
        setPin('');
      }
    } catch (err) {
      setError('Error al iniciar sesión');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleLogin();
    else if (e.key === 'Backspace') setPin(pin.slice(0, -1));
    else if (/^[0-9]$/.test(e.key)) handlePinInput(e.key);
  };

  return (
    <div className="login-container" onKeyDown={handleKeyPress} tabIndex={0}>
      <div className="login-background">
        <div className="login-gradient-orb orb-1"></div>
        <div className="login-gradient-orb orb-2"></div>
        <div className="login-gradient-orb orb-3"></div>
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            <LogIn size={40} />
          </div>
          <h1 className="login-title">Restaurant POS</h1>
          <p className="login-subtitle">Ingresa tu PIN para continuar</p>
        </div>

        <div className="pin-display">
          <div className="pin-dots">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />
            ))}
          </div>
        </div>

        {error && (
          <div className="login-error">
            <Lock size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="pin-pad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              className="pin-button"
              onClick={() => handlePinInput(num.toString())}
              disabled={loading}
            >
              {num}
            </button>
          ))}
          <button className="pin-button pin-button-clear" onClick={handleClear} disabled={loading}>
            Borrar
          </button>
          <button className="pin-button" onClick={() => handlePinInput('0')} disabled={loading}>
            0
          </button>
          <button className="pin-button pin-button-enter" onClick={handleLogin} disabled={loading || pin.length !== 4}>
            {loading ? '...' : 'OK'}
          </button>
        </div>

        <div className="login-footer">
          <p className="login-hint">
            <User size={14} />
            PIN de prueba: <strong>1234</strong> (Admin)
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
