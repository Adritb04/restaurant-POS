# 🔥 Sistema KDS (Kitchen Display System) - Documentación Completa

## 📋 ¿Qué es el KDS?

El **Kitchen Display System** es una pantalla digital para cocina que reemplaza las comandas en papel. Muestra todos los pedidos activos en tiempo real, permite gestionar su preparación y optimiza el flujo de trabajo en la cocina.

## ✨ Características Implementadas

### 🎯 Funcionalidades Core

#### 1. **Visualización en Tiempo Real**
- ✅ Actualización automática cada 3 segundos
- ✅ Los pedidos nuevos aparecen instantáneamente
- ✅ Sincronización perfecta con el POS

#### 2. **Gestión de Estados de Pedidos**
- **Pendiente** (azul): Pedido recién creado
- **En Preparación** (ámbar): Cocina trabajando en él
- **Listo** (verde): Listo para servir
- **Completado**: Ya servido al cliente (no se muestra)

#### 3. **Control Individual de Items**
- Marcar productos individuales como listos
- Checkbox por cada plato
- El pedido solo puede marcarse como "Listo" cuando TODOS los items están listos

#### 4. **Sistema de Priorización Automática**

Los pedidos se ordenan automáticamente por urgencia:

| Nivel | Tiempo | Color | Indicador |
|-------|--------|-------|-----------|
| **Normal** | 0-10 min | Verde | Sin badge |
| **Atención** | 10-15 min | Ámbar | ⏰ Atención |
| **Prioritario** | 15-20 min | Naranja | ⚠️ Prioritario |
| **URGENTE** | 20+ min | Rojo | 🔥 URGENTE |

**Los pedidos urgentes:**
- Aparecen primero en la lista
- Tienen animación de pulso
- Borde rojo brillante
- Efecto de sombra pulsante

#### 5. **Timers Visibles**
- ⏱️ Timer en cada tarjeta de pedido
- Muestra minutos transcurridos desde que se creó
- Color cambia según urgencia
- Se actualiza en tiempo real

#### 6. **Notificaciones Sonoras**
- 🔔 Beep cuando llega un nuevo pedido
- 🔔 Beep cuando un pedido está listo para servir
- Botón para silenciar/activar sonidos
- Sonido generado con Web Audio API (sin archivos externos)

#### 7. **Filtros Inteligentes**
- **Todos**: Muestra todos los pedidos activos
- **Pendientes**: Solo los que no se han empezado
- **En Preparación**: Los que están en cocina
- Contador en cada filtro

#### 8. **Información Detallada por Pedido**

Cada tarjeta muestra:
- 🍽️ Número de mesa
- 🔢 ID del pedido
- ⏰ Tiempo transcurrido
- 👨‍🍳 Lista de platos con cantidades
- 📝 Notas especiales ("sin cebolla", etc.)
- 🎯 Categoría visual (icono emoji)

#### 9. **Interfaz Optimizada para Cocina**
- Diseño tipo tarjetas grandes y legibles
- Colores contrastantes para entorno de cocina
- Botones táctiles grandes (para pantallas touch)
- Grid responsive que se adapta al tamaño de pantalla
- Sin elementos innecesarios que distraigan

#### 10. **Estadísticas en Tiempo Real**

Barra inferior con métricas clave:
- 📊 Pedidos pendientes
- 🔥 Pedidos en preparación
- ✅ Pedidos listos
- ⏱️ Tiempo promedio de preparación

## 🎮 Flujo de Trabajo

### Flujo Normal de un Pedido

```
1. CAMARERO (POS)
   └─> Toma pedido en mesa
   └─> Selecciona productos
   └─> Confirma pedido
   
2. COCINA (KDS) - AUTOMÁTICO
   └─> Aparece nueva tarjeta (sonido 🔔)
   └─> Estado: "Pendiente" (azul)
   └─> Timer comienza
   
3. COCINERO
   └─> Hace clic en "Comenzar"
   └─> Estado: "En Preparación" (ámbar)
   └─> Marca items listos uno por uno ✓
   
4. COCINERO
   └─> Cuando todos los items están ✓
   └─> Hace clic en "Listo para Servir"
   └─> Estado: "Listo" (verde + sonido 🔔)
   └─> Tarjeta con animación de pulso
   
5. CAMARERO (POS)
   └─> Sirve la mesa
   └─> Procesa el pago
   └─> La tarjeta desaparece del KDS
```

## 🎨 Diseño Visual

### Código de Colores

```css
Estados:
- Pendiente:      #6366f1 (Azul índigo)
- En Preparación: #f59e0b (Ámbar)
- Listo:          #10b981 (Verde)

Urgencia:
- Normal:         #10b981 (Verde)
- Atención:       #f59e0b (Ámbar)
- Prioritario:    #ea580c (Naranja)
- URGENTE:        #dc2626 (Rojo)
```

### Elementos Visuales

- **Iconos de categorías**: Emojis grandes y reconocibles (🥗 🍽️ 🍰 🍹)
- **Cantidades**: Badges circulares con el número de unidades
- **Notas especiales**: Fondo amarillo con borde izquierdo naranja
- **Checkboxes**: Círculos grandes que se vuelven verdes al marcar

## 💻 Aspectos Técnicos

### Actualización en Tiempo Real

```javascript
// Se actualiza cada 3 segundos automáticamente
useEffect(() => {
  loadOrders();
  const interval = setInterval(loadOrders, 3000);
  return () => clearInterval(interval);
}, []);
```

### Detección de Nuevos Pedidos

```javascript
// Compara cantidad de pedidos actual vs anterior
if (orders.length > prevOrdersCount.current) {
  playNotificationSound(); // Beep
}
```

### Query SQL Optimizado

```sql
-- Obtiene pedidos activos con joins eficientes
SELECT 
  o.id,
  o.created_at,
  o.status,
  t.number as table_number,
  e.name as waiter_name
FROM orders o
LEFT JOIN tables t ON o.table_id = t.id
LEFT JOIN employees e ON o.employee_id = e.id
WHERE o.status IN ('pending', 'preparing', 'ready')
ORDER BY o.created_at ASC
```

### Generación de Sonido

```javascript
// Web Audio API - sin necesidad de archivos .mp3
const audioContext = new AudioContext();
const oscillator = audioContext.createOscillator();
oscillator.frequency.value = 800; // Hz
oscillator.type = 'sine';
// ... (ver código completo)
```

## 🔧 Configuración y Personalización

### Ajustar Tiempos de Urgencia

En `KitchenView.js`, función `getUrgencyLevel()`:

```javascript
const getUrgencyLevel = (elapsedMinutes) => {
  if (elapsedMinutes > 20) return 'critical';  // Cambiar a 25 para más tolerancia
  if (elapsedMinutes > 15) return 'urgent';    // Cambiar a 18
  if (elapsedMinutes > 10) return 'warning';   // Cambiar a 12
  return 'normal';
};
```

### Cambiar Frecuencia de Actualización

```javascript
// De 3 segundos a 5 segundos
const interval = setInterval(loadOrders, 5000);
```

### Personalizar Sonido

```javascript
oscillator.frequency.value = 1000; // Más agudo
oscillator.frequency.value = 600;  // Más grave
oscillator.type = 'square';        // Sonido diferente
```

### Modificar Colores

En `KitchenView.css`, cambiar variables:

```css
/* Ejemplo: hacer el urgente más dramático */
.kitchen-order-card.critical {
  border-color: #ff0000;
  box-shadow: 0 0 50px rgba(255, 0, 0, 0.5);
}
```

## 📱 Uso Recomendado

### Hardware Ideal

1. **Pantalla Táctil de 21-27"**
   - Montada en pared a altura cómoda
   - Orientación horizontal (landscape)
   - Mejor si es mate (anti-reflejos)

2. **Tablet Grande (12"+)**
   - Para cocinas pequeñas
   - Más portable
   - iPad Pro, Surface Pro, etc.

3. **Monitor Estándar + Mouse**
   - Opción más económica
   - Funciona perfectamente

### Configuración Física

```
           [Campana]
              |
    [Parrilla] [Freidora] [Plancha]
              |
         [PANTALLA KDS] ← Aquí
              |
         [Prep Table]
```

**Posición ideal:**
- Altura: 140-160cm del suelo
- Distancia: 60-100cm de la zona de trabajo
- Ángulo: Ligeramente inclinado hacia abajo
- Iluminación: Evitar reflejos directos

### Workflow de Cocina

**Para Cocina Pequeña (1-2 cocineros):**
- Una pantalla central
- Filtro en "Todos"
- Ordenar por urgencia (automático)

**Para Cocina Mediana (3-4 cocineros):**
- Una pantalla por estación:
  - Estación caliente (principales)
  - Estación fría (ensaladas, entrantes)
  - Postres
- Filtrar por categoría (personalizar código)

**Para Cocina Grande (5+ cocineros):**
- Múltiples pantallas + coordinador
- Dashboard central de estadísticas
- Pantallas específicas por sección

## 🚀 Extensiones Futuras Posibles

### Funcionalidades Avanzadas (No implementadas aún)

1. **Multi-Estación**
   - Filtrar por categoría de plato
   - Una pantalla solo muestra "Principales"
   - Otra solo muestra "Postres"

2. **Modificadores Visuales**
   - Mostrar claramente "SIN cebolla"
   - Alergias en rojo brillante
   - Cambios de cocción

3. **Impresión Automática**
   - Imprimir ticket en impresora de cocina
   - Backup en papel por si falla pantalla

4. **Integración con Bump Bars**
   - Botón físico externo para marcar "Listo"
   - Más rápido que tocar pantalla

5. **Estadísticas Avanzadas**
   - Tiempo promedio por tipo de plato
   - Picos de actividad
   - Eficiencia por cocinero

6. **Alertas Escaladas**
   - Notificar al gerente si pedido >30 min
   - SMS/WhatsApp al dueño
   - Log de pedidos críticos

7. **Modo Nocturno**
   - Pantalla más tenue después de cierta hora
   - Sonidos más suaves

8. **Vista Expo (Pass)**
   - Pantalla para coordinador
   - Marca qué platos van juntos
   - Coordina salida de pedidos

## 🐛 Troubleshooting

### El KDS no muestra pedidos

**Causa**: Pedidos creados antes del KDS tienen estado incorrecto

**Solución**:
```javascript
// Actualizar estado de items antiguos
UPDATE order_items SET status = 'preparing' WHERE status = 'pending';
```

### Sonido no funciona

**Causa**: Autoplay bloqueado por navegador

**Solución**: 
- Hacer clic en la pantalla una vez
- O ajustar configuración del navegador

### Pedidos no desaparecen cuando se cierran

**Causa**: Estado del pedido no cambia a "completed"

**Verificar en TablesView**:
```javascript
// Al cerrar pedido debe cambiar a 'completed'
UPDATE orders SET status = 'completed' WHERE id = ?
```

### Pantalla se congela

**Causa**: Demasiados pedidos antiguos acumulados

**Solución**: Limpiar pedidos viejos:
```sql
DELETE FROM orders 
WHERE status = 'completed' 
AND closed_at < datetime('now', '-7 days');
```

## 📊 Métricas de Éxito

El KDS está funcionando bien si:

- ✅ Tiempo promedio de preparación < 15 minutos
- ✅ Pedidos urgentes < 5% del total
- ✅ 0% de pedidos olvidados
- ✅ Cocineros pueden leer desde 1 metro de distancia
- ✅ No hay interrupciones por dudas de comandas
- ✅ Menos errores de preparación

## 🎯 Ventajas vs Papel

| Aspecto | Papel | KDS Digital |
|---------|-------|-------------|
| Legibilidad | ⚠️ Variable | ✅ Perfecta |
| Priorización | ❌ Manual | ✅ Automática |
| Timers | ❌ No | ✅ Sí |
| Organización | ⚠️ Se pierden | ✅ Digital |
| Notificaciones | ❌ No | ✅ Sonoras |
| Estadísticas | ❌ No | ✅ Automáticas |
| Espacio físico | ⚠️ Acumulación | ✅ Ninguno |
| Ecológico | ❌ Papel | ✅ 100% |

## 💡 Consejos de Uso

1. **Capacita a tu equipo** - 15 minutos de explicación son suficientes
2. **Empieza en horario bajo** - Prueba primero sin presión
3. **Mantén backup de papel** - Los primeros días, por si acaso
4. **Ajusta los tiempos** - Cada cocina tiene su ritmo
5. **Pide feedback** - Los cocineros sabrán qué mejorar
6. **Limpia pedidos viejos** - Una vez por semana
7. **Monitorea tiempos** - Optimiza tu cocina con datos reales

---

**El KDS es una herramienta poderosa que puede transformar completamente el flujo de trabajo en tu cocina. ¡Úsalo bien!** 🔥👨‍🍳
