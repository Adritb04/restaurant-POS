// Base de datos simulada con localStorage
// Reemplaza SQLite para funcionar en Windows sin compilación

class LocalDB {
  constructor() {
    this.initializeData();
  }

  initializeData() {
    if (!localStorage.getItem('db_initialized')) {
      this.createTables();
      this.insertSampleData();
      localStorage.setItem('db_initialized', 'true');
    }
  }

  createTables() {
    const tables = {
      tables: [],
      categories: [],
      products: [],
      employees: [],
      orders: [],
      order_items: [],
      cash_register: [],
      digital_menu: []
    };

    Object.keys(tables).forEach(table => {
      localStorage.setItem(table, JSON.stringify([]));
    });
  }

  insertSampleData() {
    const tables = [];
    for (let i = 1; i <= 12; i++) {
      const zone = i <= 4 ? 'terraza' : i <= 8 ? 'interior' : 'barra';
      tables.push({
        id: i,
        number: i,
        capacity: i % 4 === 0 ? 6 : 4,
        zone,
        status: 'available'
      });
    }
    localStorage.setItem('tables', JSON.stringify(tables));

    const categories = [
      { id: 1, name: 'Entrantes', color: '#FF6B6B', icon: '🥗' },
      { id: 2, name: 'Principales', color: '#4ECDC4', icon: '🍽️' },
      { id: 3, name: 'Postres', color: '#FFE66D', icon: '🍰' },
      { id: 4, name: 'Bebidas', color: '#95E1D3', icon: '🍹' }
    ];
    localStorage.setItem('categories', JSON.stringify(categories));

    const products = [
      { id: 1, name: 'Ensalada César', description: 'Lechuga, pollo, parmesano', price: 8.50, category_id: 1, stock: 50, min_stock: 5, available: 1 },
      { id: 2, name: 'Nachos con guacamole', description: 'Nachos caseros con guacamole', price: 6.90, category_id: 1, stock: 30, min_stock: 5, available: 1 },
      { id: 3, name: 'Hamburguesa Clásica', description: 'Carne, queso, lechuga, tomate', price: 12.50, category_id: 2, stock: 40, min_stock: 5, available: 1 },
      { id: 4, name: 'Pizza Margarita', description: 'Tomate, mozzarella, albahaca', price: 11.00, category_id: 2, stock: 35, min_stock: 5, available: 1 },
      { id: 5, name: 'Risotto de setas', description: 'Arroz cremoso con setas', price: 13.50, category_id: 2, stock: 25, min_stock: 5, available: 1 },
      { id: 6, name: 'Tarta de queso', description: 'Tarta de queso casera', price: 5.50, category_id: 3, stock: 20, min_stock: 5, available: 1 },
      { id: 7, name: 'Brownie con helado', description: 'Brownie caliente con helado', price: 6.00, category_id: 3, stock: 15, min_stock: 5, available: 1 },
      { id: 8, name: 'Coca-Cola', description: '33cl', price: 2.50, category_id: 4, stock: 100, min_stock: 5, available: 1 },
      { id: 9, name: 'Cerveza', description: '33cl', price: 2.80, category_id: 4, stock: 80, min_stock: 5, available: 1 },
      { id: 10, name: 'Vino tinto copa', description: 'Copa de vino tinto', price: 3.50, category_id: 4, stock: 60, min_stock: 5, available: 1 }
    ];
    localStorage.setItem('products', JSON.stringify(products));

    const employees = [
      { id: 1, name: 'Administrador', role: 'admin', pin: '1234', active: 1, created_at: new Date().toISOString() },
      { id: 2, name: 'Camarero 1', role: 'waiter', pin: '1111', active: 1, created_at: new Date().toISOString() }
    ];
    localStorage.setItem('employees', JSON.stringify(employees));

    localStorage.setItem('orders', JSON.stringify([]));
    localStorage.setItem('order_items', JSON.stringify([]));
  }

  async query(sql, params = []) {
    try {
      const result = this.parseSQL(sql, params);
      return { success: true, data: result };
    } catch (error) {
      console.error('DB Query Error:', error);
      return { success: false, error: error.message };
    }
  }

  async run(sql, params = []) {
    try {
      const result = this.executeSQL(sql, params);
      return { success: true, data: result };
    } catch (error) {
      console.error('DB Run Error:', error);
      return { success: false, error: error.message };
    }
  }

  async get(sql, params = []) {
    try {
      const results = this.parseSQL(sql, params);
      return { success: true, data: results.length > 0 ? results[0] : null };
    } catch (error) {
      console.error('DB Get Error:', error);
      return { success: false, error: error.message };
    }
  }

  parseSQL(sql, params) {
    const sqlLower = sql.toLowerCase();
    if (sqlLower.includes('select')) return this.handleSelect(sql, params);
    return [];
  }

  executeSQL(sql, params) {
    const sqlLower = sql.toLowerCase();
    if (sqlLower.includes('insert')) return this.handleInsert(sql, params);
    if (sqlLower.includes('update')) return this.handleUpdate(sql, params);
    if (sqlLower.includes('delete')) return this.handleDelete(sql, params);
    return {};
  }

  handleSelect(sql, params) {
    let tableName = this.extractTableName(sql);
    let data = JSON.parse(localStorage.getItem(tableName) || '[]');

    if (sql.includes('JOIN categories')) {
      const categories = JSON.parse(localStorage.getItem('categories') || '[]');
      data = data.map(product => {
        const category = categories.find(c => c.id === product.category_id);
        return { ...product, category_name: category?.name, category_icon: category?.icon };
      });
    }

    if (sql.includes('JOIN tables') || sql.includes('JOIN employees')) {
      const tables = JSON.parse(localStorage.getItem('tables') || '[]');
      const employees = JSON.parse(localStorage.getItem('employees') || '[]');
      data = data.map(order => {
        const table = tables.find(t => t.id === order.table_id);
        const employee = employees.find(e => e.id === order.employee_id);
        return { ...order, table_number: table?.number, employee_name: employee?.name, waiter_name: employee?.name };
      });
    }

    if (sql.includes('FROM order_items')) {
      const products = JSON.parse(localStorage.getItem('products') || '[]');
      const categories = JSON.parse(localStorage.getItem('categories') || '[]');
      data = data.map(item => {
        const product = products.find(p => p.id === item.product_id);
        const category = categories.find(c => c.id === product?.category_id);
        return {
          ...item,
          product_name: product?.name,
          product_price: product?.price,
          description: product?.description,
          category_name: category?.name,
          category_icon: category?.icon
        };
      });
    }

    if (sql.includes('WHERE')) data = this.applyWhere(data, sql, params);
    if (sql.includes('ORDER BY')) data = this.applyOrderBy(data, sql);

    if (sql.includes('LIMIT')) {
      const limitMatch = sql.match(/LIMIT (\d+)/i);
      if (limitMatch) data = data.slice(0, parseInt(limitMatch[1], 10));
    }

    if (sql.match(/SUM\(|COUNT\(|AVG\(/i)) return this.handleAggregation(sql, data);

    return data;
  }

  handleInsert(sql, params) {
    const tableName = this.extractTableName(sql);
    const data = JSON.parse(localStorage.getItem(tableName) || '[]');
    const newId = data.length > 0 ? Math.max(...data.map(item => item.id || 0)) + 1 : 1;
    const values = this.extractInsertValues(sql, params);
    values.id = newId;
    data.push(values);
    localStorage.setItem(tableName, JSON.stringify(data));
    return { lastInsertRowid: newId };
  }

  handleUpdate(sql, params) {
    const tableName = this.extractTableName(sql);
    let data = JSON.parse(localStorage.getItem(tableName) || '[]');
    const updates = this.extractUpdateValues(sql, params);
    const whereCondition = this.extractWhereCondition(sql, params);

    data = data.map(item => (this.matchesCondition(item, whereCondition) ? { ...item, ...updates } : item));
    localStorage.setItem(tableName, JSON.stringify(data));
    return { changes: 1 };
  }

  handleDelete(sql, params) {
    const tableName = this.extractTableName(sql);
    let data = JSON.parse(localStorage.getItem(tableName) || '[]');
    const whereCondition = this.extractWhereCondition(sql, params);
    data = data.filter(item => !this.matchesCondition(item, whereCondition));
    localStorage.setItem(tableName, JSON.stringify(data));
    return { changes: 1 };
  }

  extractTableName(sql) {
    const fromMatch = sql.match(/FROM\s+(\w+)/i);
    const intoMatch = sql.match(/INTO\s+(\w+)/i);
    const updateMatch = sql.match(/UPDATE\s+(\w+)/i);
    if (fromMatch) return fromMatch[1];
    if (intoMatch) return intoMatch[1];
    if (updateMatch) return updateMatch[1];
    return '';
  }

  applyWhere(data, sql, params) {
    let paramIndex = 0;

    if (sql.includes('pin =')) return data.filter(item => item.pin === params[paramIndex]);
    if (sql.includes('table_id =')) return data.filter(item => item.table_id === params[paramIndex]);
    if (sql.includes('order_id =')) return data.filter(item => item.order_id === params[paramIndex]);
    if (sql.includes('id =')) return data.filter(item => item.id === params[paramIndex]);

    if (sql.includes('status')) {
      if (sql.includes('IN')) {
        const statuses = ['pending', 'preparing', 'ready'];
        return data.filter(item => statuses.includes(item.status));
      }
      return data.filter(item => item.status === params[paramIndex]);
    }

    if (sql.includes('available = 1')) return data.filter(item => item.available === 1);
    if (sql.includes('active = 1')) return data.filter(item => item.active === 1);
    if (sql.includes('category_id =')) return data.filter(item => item.category_id === params[paramIndex]);

    if (sql.includes('DATE(created_at) =')) {
      const today = new Date().toISOString().split('T')[0];
      return data.filter(item => {
        const itemDate = new Date(item.created_at || item.created_at).toISOString().split('T')[0];
        return itemDate === params[paramIndex] || itemDate === today;
      });
    }

    return data;
  }

  applyOrderBy(data, sql) {
    const orderMatch = sql.match(/ORDER BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
    if (!orderMatch) return data;

    const field = orderMatch[1];
    const direction = (orderMatch[2] || 'ASC').toUpperCase();

    return [...data].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      if (direction === 'ASC') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });
  }

  handleAggregation(sql, data) {
    if (sql.includes('SUM(total)')) {
      const total = data.reduce((sum, item) => sum + (item.total || 0), 0);
      return [{ total, count: data.length }];
    }
    if (sql.includes('COUNT(*)')) return [{ count: data.length }];
    return data;
  }

  extractInsertValues(sql, params) {
    const values = {};
    const fieldsMatch = sql.match(/\(([^)]+)\)/);

    if (fieldsMatch) {
      const fields = fieldsMatch[1].split(',').map(f => f.trim());
      fields.forEach((field, i) => {
        if (params[i] !== undefined) values[field] = params[i];
      });
    }

    if (sql.includes('orders')) values.created_at = values.created_at || new Date().toISOString();
    return values;
  }

  extractUpdateValues(sql, params) {
    const updates = {};
    const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i);

    if (setMatch) {
      const setPart = setMatch[1];
      const assignments = setPart.split(',');
      let paramIndex = 0;

      assignments.forEach(assignment => {
        const [field] = assignment.split('=').map(s => s.trim());
        if (params[paramIndex] !== undefined) {
          updates[field] = params[paramIndex];
          paramIndex++;
        }
      });

      if (sql.includes('closed_at')) updates.closed_at = new Date().toISOString();
    }

    return updates;
  }

  extractWhereCondition(sql, params) {
    const whereMatch = sql.match(/WHERE\s+(.+)$/i);
    if (!whereMatch) return null;

    const condition = whereMatch[1];
    const parts = condition.split('=');

    if (parts.length === 2) {
      const field = parts[0].trim();
      const value = params[params.length - 1];
      return { field, value };
    }

    return null;
  }

  matchesCondition(item, condition) {
    if (!condition) return true;
    return item[condition.field] === condition.value;
  }
}

// Crear instancia global
window.localDB = new LocalDB();

// ✅ NO reasignamos window.electronAPI (puede ser read-only por preload).
// Creamos un API local alternativo:
window.localElectronAPI = {
  dbQuery: (sql, params) => window.localDB.query(sql, params),
  dbRun: (sql, params) => window.localDB.run(sql, params),
  dbGet: (sql, params) => window.localDB.get(sql, params),
};

export default window.localDB;
