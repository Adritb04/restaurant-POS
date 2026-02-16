# 🚀 Guía de Instalación - Restaurant POS

Esta guía te llevará paso a paso para tener tu sistema POS funcionando en minutos.

## 📋 Pre-requisitos

### 1. Node.js
Necesitas Node.js versión 18 o superior.

**Verificar si ya lo tienes**:
```bash
node --version
```

**Si no lo tienes, descarga desde**:
- Windows/Mac: https://nodejs.org/
- Linux: `sudo apt install nodejs npm` (Ubuntu/Debian)

### 2. Editor de Código (Opcional pero recomendado)
- VS Code: https://code.visualstudio.com/
- Sublime Text
- Atom

## 🔧 Instalación

### Paso 1: Descomprimir el Proyecto
Extrae el archivo ZIP del proyecto en la ubicación que prefieras, por ejemplo:
- Windows: `C:\restaurant-pos-app\`
- Mac/Linux: `~/restaurant-pos-app/`

### Paso 2: Abrir Terminal en el Proyecto

**Windows**:
1. Abre la carpeta del proyecto
2. Haz clic en la barra de direcciones
3. Escribe `cmd` y presiona Enter

**Mac**:
1. Abre Terminal
2. Escribe: `cd ` (con espacio al final)
3. Arrastra la carpeta del proyecto a la Terminal
4. Presiona Enter

**Linux**:
1. Clic derecho en la carpeta → "Abrir en Terminal"

### Paso 3: Instalar Dependencias

Ejecuta este comando en la terminal:
```bash
npm install
```

**Esto puede tardar 2-5 minutos**. Verás muchos textos pasando - es normal.

**Si encuentras errores**:

- **Error de permisos en Windows**: Ejecuta como Administrador
- **Error de permisos en Mac/Linux**: Usa `sudo npm install`
- **Error de compilación de better-sqlite3**: 
  - Windows: Instala Windows Build Tools
  - Mac: Instala Xcode Command Line Tools

### Paso 4: Iniciar la Aplicación

Una vez instaladas las dependencias, ejecuta:
```bash
npm start
```

**¿Qué va a pasar?**:
1. Se abrirá una ventana de navegador (esto es normal, puedes cerrarla)
2. Se abrirá la aplicación de escritorio del POS
3. Verás la pantalla de login

**Esto puede tardar 20-30 segundos la primera vez**.

## 🎉 ¡Listo! Ya puedes usar el POS

### Credenciales de Prueba

**Administrador**:
- PIN: `1234`

**Camarero**:
- PIN: `1111`

## 📱 Primeros Pasos

1. **Inicia sesión** con el PIN `1234`
2. **Ve a "Mesas"** en el menú lateral
3. **Haz clic en una mesa** para abrir el modal de pedido
4. **Agrega productos** del menú
5. **Procesa el pago** con efectivo o tarjeta

## 🛠️ Comandos Útiles

### Iniciar en Desarrollo
```bash
npm start
```

### Compilar para Producción
```bash
npm run build
npm run build:electron
```

Esto creará instaladores en la carpeta `dist/`:
- Windows: `Restaurant POS Setup.exe`
- Mac: `Restaurant POS.dmg`
- Linux: `Restaurant POS.AppImage`

### Detener la Aplicación
- Cierra la ventana de Electron
- En la terminal: `Ctrl + C` (dos veces si es necesario)

## ⚙️ Configuración Inicial

### Personalizar Mesas

Edita `electron/main.js`, función `insertSampleData()`:

```javascript
// Cambiar número de mesas
for (let i = 1; i <= 20; i++) {  // De 12 a 20 mesas
  const zone = i <= 6 ? 'terraza' : i <= 14 ? 'interior' : 'barra';
  insertTable.run(i, 4, zone);  // 4 es la capacidad
}
```

### Personalizar Productos

En la misma función, modifica el array `products`:

```javascript
const products = [
  { 
    name: 'Tu Producto', 
    description: 'Descripción', 
    price: 12.50, 
    category_id: 1,  // 1=Entrantes, 2=Principales, 3=Postres, 4=Bebidas
    stock: 50 
  },
  // ... más productos
];
```

### Cambiar Tema de Colores

Edita `src/index.css`, variables `:root`:

```css
:root {
  --accent-primary: #6366f1;  /* Cambia este color */
  --accent-success: #10b981;
  /* ... */
}
```

## 🐛 Solución de Problemas Comunes

### La aplicación no arranca

**Problema**: Error "Could not connect to development server"

**Solución**:
1. Cierra todo
2. Ejecuta: `npm start` y espera 30 segundos
3. Debería abrirse automáticamente

### Error de base de datos

**Problema**: "Database is locked" o errores de SQLite

**Solución**:
1. Cierra la aplicación
2. Localiza el archivo de base de datos:
   - Windows: `C:\Users\TuUsuario\AppData\Roaming\restaurant-pos\restaurant.db`
   - Mac: `~/Library/Application Support/restaurant-pos/restaurant.db`
   - Linux: `~/.config/restaurant-pos/restaurant.db`
3. Elimina el archivo (se recreará automáticamente)
4. Reinicia la aplicación

### Pantalla en blanco

**Problema**: La aplicación se abre pero está en blanco

**Solución**:
1. Presiona `Ctrl+Shift+I` (Windows/Linux) o `Cmd+Opt+I` (Mac)
2. Revisa los errores en la consola
3. Si ves errores de "module not found", ejecuta `npm install` de nuevo

### No aparecen productos

**Problema**: El modal de pedidos está vacío

**Solución**:
- Los productos se crean automáticamente la primera vez
- Si no aparecen, elimina la base de datos (ver "Error de base de datos")

## 📊 Ubicación de Datos

### Base de Datos
Tu base de datos se guarda en:
- **Windows**: `C:\Users\TuUsuario\AppData\Roaming\restaurant-pos\`
- **Mac**: `~/Library/Application Support/restaurant-pos/`
- **Linux**: `~/.config/restaurant-pos/`

### Hacer Backup
Simplemente copia el archivo `restaurant.db` a un lugar seguro.

### Restaurar Backup
Reemplaza el archivo `restaurant.db` con tu backup.

## 🔄 Actualizar la Aplicación

1. Descarga la nueva versión
2. Extrae en una carpeta nueva
3. Copia tu archivo `restaurant.db` (ver ubicación arriba)
4. Ejecuta `npm install` en la nueva carpeta
5. Inicia con `npm start`

## 🎓 Recursos Adicionales

- **README.md**: Información general del proyecto
- **ARCHITECTURE.md**: Detalles técnicos de la arquitectura
- **Documentación de React**: https://react.dev
- **Documentación de Electron**: https://electronjs.org

## 💡 Consejos

1. **Prueba con datos reales gradualmente**: Primero familiarízate con la interfaz
2. **Haz backups regulares**: Especialmente antes de actualizaciones
3. **Reporta bugs**: Cualquier error que encuentres, documéntalo
4. **Personaliza a tu gusto**: El código es tuyo, modifícalo como necesites

## 📞 ¿Necesitas Ayuda?

Si encuentras problemas:
1. Revisa esta guía de nuevo
2. Busca el error en Google (suele haber soluciones)
3. Revisa los archivos de log en la consola de Electron
4. Contacta al desarrollador

## ✅ Checklist de Instalación

- [ ] Node.js instalado (v18+)
- [ ] Proyecto descomprimido
- [ ] Terminal abierta en la carpeta del proyecto
- [ ] `npm install` ejecutado sin errores
- [ ] `npm start` ejecutado
- [ ] Aplicación abierta correctamente
- [ ] Login exitoso con PIN 1234
- [ ] Mesas visibles
- [ ] Pedido de prueba realizado

---

**¡Disfruta tu nuevo sistema POS!** 🎉
