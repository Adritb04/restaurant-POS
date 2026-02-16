const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  dbQuery: async (sql, params) => ({ success: true, data: [] }),
  dbRun: async (sql, params) => ({ success: true, data: { lastInsertRowid: Date.now() } }),
  dbGet: async (sql, params) => ({ success: true, data: null }),
});
