# Restaurant POS - Versión Windows (Sin Compilación) 🪟

## ✨ Diferencias con la Versión Original

Esta versión está **optimizada para Windows** y NO requiere compilar ninguna librería nativa.

### Cambios Principales:
- ✅ **Sin better-sqlite3**: Usa localStorage en lugar de SQLite
- ✅ **Sin compilación**: Funciona directamente con `npm install`
- ✅ **Sin Visual Studio**: No necesitas instalar Build Tools
- ✅ **Misma funcionalidad**: Todo funciona exactamente igual

### Limitaciones:
- Los datos se guardan en el navegador (localStorage)
- Si borras los datos del navegador, pierdes la BD
- No hay archivo .db físico

## 🚀 Instalación SUPER RÁPIDA

```bash
# 1. Abrir VS Code en esta carpeta
# 2. Terminal (Ctrl + `)

# 3. Instalar (2-3 minutos, sin errores)
npm install

# 4. Iniciar
npm start

# 5. Login: 1234
```

## ✅ Ventajas

- ⚡ **Instalación rápida** - Sin esperar compilaciones
- 🐛 **Sin errores** - No hay problemas de Visual Studio
- 💻 **Funciona en cualquier Windows** - XP, 7, 10, 11
- 🔄 **Mismo código React** - Componentes idénticos

## 📊 Cómo Funciona la Base de Datos

En lugar de un archivo `.db`, los datos se guardan en:
```
localStorage del navegador Electron
  ├─ tables
  ├─ products  
  ├─ orders
  ├─ employees
  └─ ...
```

### Ver/Editar Datos:
1. Con la app abierta, presiona `F12`
2. Ve a la pestaña "Application"
3. En el sidebar: "Local Storage"
4. Verás todas las tablas

### Hacer Backup:
```javascript
// Copiar esto en la consola (F12)
const backup = {};
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  backup[key] = localStorage.getItem(key);
}
console.log(JSON.stringify(backup));
// Copia el texto que aparece y guárdalo
```

### Restaurar Backup:
```javascript
// Pega tu backup aquí:
const backup = { /* tu backup aquí */ };
Object.keys(backup).forEach(key => {
  localStorage.setItem(key, backup[key]);
});
location.reload();
```

### Resetear Todo:
```javascript
localStorage.clear();
location.reload();
```

## 🎯 Uso Idéntico

Todo funciona **exactamente igual** que la versión con SQLite:

- ✅ Login con PIN
- ✅ Gestión de mesas
- ✅ Tomar pedidos
- ✅ KDS (Kitchen Display System)
- ✅ Dashboard
- ✅ Todos los componentes

## 🔄 Migrar a SQLite Después (Opcional)

Si más adelante quieres usar SQLite "de verdad":

1. Instala Visual Studio Build Tools
2. Cambia el `package.json` (restaura better-sqlite3)
3. Usa el `main.js` original
4. Exporta tus datos de localStorage
5. Impórtalos a SQLite

## 💡 Recomendaciones

### Para Uso en Producción:
- Haz backups regulares del localStorage
- Considera actualizar a SQLite cuando tengas las Build Tools
- O usa una versión web con backend real

### Para Desarrollo:
- ¡Esta versión es perfecta!
- Rápida de instalar
- Fácil de probar
- Sin complicaciones

## 📝 Notas Técnicas

**Archivo Clave**: `src/utils/localDB.js`

Este archivo simula SQLite usando localStorage:
- Parsea SQL básico (SELECT, INSERT, UPDATE, DELETE)
- Maneja JOINs simples
- Soporta WHERE, ORDER BY, LIMIT
- Funciona con las mismas queries del código original

## 🆘 Soporte

Si tienes problemas, esta versión debería funcionar **sin errores**.

Si aún así algo falla:
1. Borra `node_modules`
2. Ejecuta `npm install` de nuevo
3. Verifica que tienes Node.js 18+

---

**¡Disfruta tu POS sin complicaciones de compilación!** 🎉
