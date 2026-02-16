# Arquitectura Técnica - Restaurant POS

## 🏗️ Visión General

Este documento detalla la arquitectura técnica del sistema POS, diseñada para ser escalable, mantenible y de alto rendimiento.

## 📐 Arquitectura de Capas

### 1. Capa de Presentación (Frontend)
**Tecnología**: React 18

**Responsabilidades**:
- Renderizado de UI
- Gestión de estado local
- Interacción con el usuario
- Validación de formularios

**Componentes Principales**:
- `Login`: Autenticación con PIN
- `Sidebar`: Navegación principal
- `TablesView`: Core del POS - gestión de mesas y pedidos
- `Dashboard`: Métricas y estadísticas
- Componentes auxiliares: Menu, Inventory, Reports, etc.

**Patrón de Diseño**: Component-based architecture con hooks

### 2. Capa de Lógica (Electron Main Process)
**Tecnología**: Electron + Node.js

**Responsabilidades**:
- Gestión de ventanas
- Acceso al sistema de archivos
- Operaciones de base de datos
- IPC (Inter-Process Communication)

**Archivo Principal**: `electron/main.js`

**Funciones Críticas**:
- `initDatabase()`: Inicialización y creación de esquema
- `insertSampleData()`: Datos de demostración
- IPC Handlers: `db-query`, `db-run`, `db-get`

### 3. Capa de Datos (Persistencia)
**Tecnología**: SQLite (better-sqlite3)

**Ventajas**:
- ✅ Sin servidor - archivo local
- ✅ Funcionamiento 100% offline
- ✅ Alta velocidad
- ✅ Confiabilidad ACID
- ✅ Fácil backup (copiar archivo)

**Ubicación**: `userData/restaurant.db` (gestionado por Electron)

## 🗄️ Modelo de Datos

### Esquema de Base de Datos

```sql
-- Mesas del restaurante
CREATE TABLE tables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number INTEGER UNIQUE NOT NULL,
  capacity INTEGER NOT NULL,
  zone TEXT,                        -- terraza, interior, barra
  status TEXT DEFAULT 'available'   -- available, occupied, reserved
);

-- Categorías de productos
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT,    -- Color para UI
  icon TEXT      -- Emoji o icono
);

-- Productos del menú
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  category_id INTEGER,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,      -- Alerta de stock bajo
  available INTEGER DEFAULT 1,      -- Flag de disponibilidad
  image TEXT,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Empleados
CREATE TABLE employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL,              -- admin, waiter, kitchen
  pin TEXT NOT NULL,               -- PIN de acceso (hash en producción)
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Pedidos
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_id INTEGER,
  employee_id INTEGER,
  status TEXT DEFAULT 'pending',   -- pending, completed, cancelled
  total REAL DEFAULT 0,
  payment_method TEXT,             -- cash, card
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  closed_at DATETIME,
  FOREIGN KEY (table_id) REFERENCES tables(id),
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Items de pedido
CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,            -- Precio al momento de la orden
  notes TEXT,                     -- Modificadores (sin cebolla, etc.)
  status TEXT DEFAULT 'pending',  -- pending, preparing, ready, served
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Cierres de caja
CREATE TABLE cash_register (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER,
  opening_amount REAL DEFAULT 0,
  closing_amount REAL,
  total_sales REAL DEFAULT 0,
  cash_sales REAL DEFAULT 0,
  card_sales REAL DEFAULT 0,
  opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  closed_at DATETIME,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Configuración carta digital
CREATE TABLE digital_menu (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  qr_code TEXT,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Relaciones

```
tables 1 ──── N orders
employees 1 ──── N orders
categories 1 ──── N products
orders 1 ──── N order_items
products 1 ──── N order_items
```

## 🔄 Flujo de Datos

### 1. Autenticación
```
Usuario → Ingresa PIN → Login Component
  ↓
Login → IPC: db-get('SELECT * FROM employees WHERE pin = ?')
  ↓
Electron Main → SQLite Query
  ↓
Resultado → Login Component → Set currentUser → App State
```

### 2. Tomar Pedido
```
Usuario → Selecciona Mesa → TablesView
  ↓
TablesView → IPC: db-get('SELECT * FROM orders WHERE table_id = ? AND status = pending')
  ↓
Si existe orden → Cargar items
Si no existe → IPC: db-run('INSERT INTO orders...')
  ↓
Usuario agrega productos → IPC: db-run('INSERT INTO order_items...')
  ↓
Actualizar total → IPC: db-run('UPDATE orders SET total = ?')
  ↓
Renderizar UI actualizada
```

### 3. Cerrar Pedido
```
Usuario → Selecciona método de pago → TablesView
  ↓
TablesView → IPC: db-run('UPDATE orders SET status = completed, payment_method = ?, closed_at = NOW')
  ↓
TablesView → IPC: db-run('UPDATE tables SET status = available')
  ↓
TablesView → Para cada item: IPC: db-run('UPDATE products SET stock = stock - quantity')
  ↓
Recargar estado de mesas
```

## 🔐 Seguridad

### Nivel 1 (Implementado)
- ✅ Context Isolation en Electron
- ✅ Preload script para IPC seguro
- ✅ No Node Integration en renderer
- ✅ Autenticación con PIN

### Nivel 2 (Próximamente)
- 🔜 Hash de PINs (bcrypt)
- 🔜 Sesiones con timeout
- 🔜 Permisos granulares por rol
- 🔜 Audit log de operaciones críticas

### Nivel 3 (Futuro)
- 📋 Encriptación de base de datos
- 📋 2FA opcional
- 📋 Firmas digitales en tickets

## ⚡ Optimizaciones

### Performance
1. **Consultas Preparadas**: Uso de prepared statements en SQLite
2. **Índices**: En tablas con búsquedas frecuentes
3. **Lazy Loading**: Componentes cargados bajo demanda
4. **Virtualización**: Para listas largas (futuro)

### UX
1. **Operaciones Optimistas**: UI actualizada antes de confirmar BD
2. **Debouncing**: En búsquedas y filtros
3. **Feedback Inmediato**: Animaciones y estados de carga
4. **Offline First**: Funciona sin internet

## 🔧 Configuración de Desarrollo

### Variables de Entorno
```bash
NODE_ENV=development  # development | production
```

### Build Process
1. **Desarrollo**: `npm start`
   - React dev server (port 3000)
   - Electron conecta a localhost:3000
   - Hot reload activado

2. **Producción**: `npm run build && npm run build:electron`
   - React build optimizado
   - Electron empaqueta con electron-builder
   - Genera instaladores por plataforma

## 📦 Distribución

### Plataformas Soportadas
- **Windows**: NSIS installer (.exe)
- **macOS**: DMG (.dmg)
- **Linux**: AppImage, Deb, RPM

### Tamaño Aproximado
- Instalador: ~100-150 MB
- Aplicación instalada: ~200-250 MB
(Incluye Chromium y Node.js embebidos)

## 🚀 Roadmap Técnico

### v1.0 (MVP) ✅
- [x] Arquitectura base Electron + React
- [x] Esquema de BD SQLite
- [x] Login y autenticación
- [x] Gestión de mesas y pedidos
- [x] Dashboard básico

### v1.1 (Q2 2024)
- [ ] CRUD completo de productos
- [ ] Control de inventario
- [ ] Vista de cocina en tiempo real
- [ ] Impresión de tickets

### v1.2 (Q3 2024)
- [ ] Reportes avanzados con gráficas
- [ ] Carta digital con QR
- [ ] Integración WhatsApp Business
- [ ] Sistema de reservas

### v2.0 (Q4 2024)
- [ ] Modo multi-sucursal
- [ ] Sincronización cloud (opcional)
- [ ] App móvil nativa (iOS/Android)
- [ ] API REST para integraciones

## 🧪 Testing

### Estrategia de Testing
```
Unit Tests (Jest)
  ├── Componentes React
  ├── Funciones de utilidad
  └── Lógica de negocio

Integration Tests
  ├── Flujos de usuario completos
  ├── IPC communication
  └── Operaciones de BD

E2E Tests (Playwright/Spectron)
  ├── Casos de uso críticos
  └── Flujos de trabajo completos
```

## 📊 Monitoreo y Analytics

### Métricas Clave (Futuro)
- Tiempo de respuesta de operaciones
- Uso de memoria
- Errores y crashes
- Operaciones por minuto
- Tiempo promedio de atención por mesa

### Logging
```javascript
// Estructura de logs
{
  timestamp: ISO8601,
  level: 'info' | 'warn' | 'error',
  module: 'database' | 'ui' | 'electron',
  action: 'order_created' | 'payment_processed',
  user_id: number,
  data: {...}
}
```

## 🔄 Migraciones de Base de Datos

### Estrategia (Futuro)
```javascript
// migrations/001_add_modifiers_table.js
module.exports = {
  up: (db) => {
    db.exec(`
      CREATE TABLE modifiers (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL DEFAULT 0
      )
    `);
  },
  down: (db) => {
    db.exec('DROP TABLE modifiers');
  }
};
```

## 🎯 Decisiones de Diseño

### ¿Por qué Electron?
- ✅ Cross-platform nativo
- ✅ Acceso completo al sistema
- ✅ Funcionamiento offline
- ✅ Comunidad grande
- ❌ Tamaño de aplicación mayor

### ¿Por qué SQLite?
- ✅ Zero-configuration
- ✅ Embedded - no requiere servidor
- ✅ Rápido para operaciones locales
- ✅ Transacciones ACID
- ❌ No apto para múltiples escritores concurrentes

### ¿Por qué React?
- ✅ Componentes reutilizables
- ✅ Virtual DOM performante
- ✅ Ecosistema maduro
- ✅ Fácil debugging
- ✅ Hooks para estado

---

**Última actualización**: Febrero 2026
**Versión**: 1.0.0
