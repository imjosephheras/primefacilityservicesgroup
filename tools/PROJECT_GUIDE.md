# 📚 Prime Facility Services Calculator Suite - Guía Completa del Proyecto

## 🎯 Visión General

Este proyecto consiste en una suite de calculadoras profesionales para Prime Facility Services Group, diseñada con principios de iOS 18 y optimizada para uso móvil y desktop.

### Componentes Principales:
1. **Página Principal (index.html)** - Portal de autenticación
2. **Janitorial Calculator** - Calculadora de cotizaciones de limpieza de cocinas
3. **Timesheet Calculator** - Calculadora de hojas de tiempo y costos laborales

## 🎨 Sistema de Diseño

### Filosofía de Diseño
- **Inspirado en iOS 18**: Interfaces limpias, transiciones suaves, feedback háptico visual
- **Mobile-first**: Optimizado primero para móviles, luego escalado a desktop
- **Minimalista**: Sin efectos hover excesivos, enfoque en funcionalidad
- **Accesible**: Contraste adecuado, áreas táctiles de mínimo 44px

### Paleta de Colores
```css
/* Colores de Marca */
--brand-blue: #03143A      /* Azul oscuro principal */
--brand-red: #C70532       /* Rojo de acento */
--light-blue: #EBF2FA      /* Azul claro de fondo */

/* Colores de Estado */
--success-green: #27ae60   /* Éxito/Positivo */
--warning-orange: #f39c12  /* Advertencia */
--danger-red: #e74c3c      /* Error/Peligro */
--optimize-color: #1abc9c  /* Estado óptimo (62% target) */

/* Escala de Grises iOS */
--ios-gray-1: #f2f2f7      /* Fondo más claro */
--ios-gray-2: #e5e5ea      /* Bordes sutiles */
--ios-gray-3: #d1d1d6      /* Bordes normales */
--ios-gray-4: #c7c7cc      /* Texto deshabilitado */
--ios-gray-5: #8e8e93      /* Texto secundario */
--ios-gray-6: #48484a      /* Texto principal oscuro */
```

### Tipografía
- **Font Principal**: Montserrat (300, 400, 500, 600, 700)
- **Font Secundaria**: Inter (para index principal)
- **Tamaños Base**: 
  - Mobile: 16px
  - Desktop: 18px
  - Headers: 2xl-4xl responsivos

### Componentes UI Característicos

#### Botones iOS Style
```css
/* Botón primario con efecto de presión */
.primary-action {
    background: var(--brand-blue);
    color: white;
    border-radius: 12px;
    padding: 12px 24px;
    transition: all 200ms;
}
.primary-action:active {
    transform: scale(0.95);
}
```

#### Cards con Sombras iOS
```css
shadow-ios-light: 0 1px 3px rgba(0, 0, 0, 0.04)
shadow-ios-medium: 0 4px 12px rgba(0, 0, 0, 0.06)
shadow-ios-heavy: 0 8px 24px rgba(0, 0, 0, 0.08)
```

#### Inputs con Estados
- Border radius: 12px (rounded-xl)
- Background: ios-gray-1
- Focus ring: 2px brand-blue
- Transition: 200ms

### Animaciones y Transiciones
```css
--transition-fast: 200ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-medium: 300ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-slow: 500ms cubic-bezier(0.4, 0, 0.2, 1)
```

## 💻 Arquitectura Técnica

### Stack Tecnológico
- **Frontend Framework**: Vanilla JavaScript (sin frameworks pesados)
- **CSS Framework**: Tailwind CSS (via CDN)
- **Iconos**: Font Awesome 6.4.0
- **Librerías Externas**:
  - jsPDF 2.5.1 - Generación de PDFs
  - Chart.js 3.9.1 - Gráficos interactivos
  - html2canvas 1.4.1 - Capturas de pantalla

### Estructura de Archivos
```
/
├── index.html                    # Portal principal con auth
├── janitorial-calculator/
│   ├── index.html               # UI de calculadora de limpieza
│   ├── app.js                   # Lógica de negocio (2000+ líneas)
│   ├── styles.css               # Estilos específicos
│   └── README.md                # Documentación específica
├── timesheet-calculator/
│   ├── index.html               # UI de calculadora de tiempo
│   ├── app.js                   # Lógica de negocio (900+ líneas)
│   └── styles.css               # Estilos específicos
└── PROJECT_GUIDE.md             # Esta guía

```

### Patrones de Código

#### State Management
Cada calculadora usa un objeto de estado centralizado:
```javascript
const state = {
    // Janitorial Calculator
    workers: 2,
    largeHoods: 0,
    smallHoods: 0,
    // ... más propiedades
    
    // Métodos de actualización
    updateState(key, value) {
        this[key] = value;
        calculateAll(); // Recalcula automáticamente
    }
};
```

#### Debouncing para Performance
```javascript
const debouncedCalculate = (() => {
    let timeoutId;
    return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            calculateAll();
        }, 300);
    };
})();
```

#### Lazy Loading de Librerías
```javascript
async function loadExportLibraries() {
    if (typeof window.jspdf === 'undefined') {
        // Carga dinámica solo cuando se necesita
        await loadScript('jspdf.min.js');
    }
}
```

## 🔧 Funcionalidades Principales

### 1. Sistema de Autenticación (index.html)
- **Password**: Prime2024
- **Duración**: 24 horas en localStorage
- **Características**:
  - Animaciones suaves de transición
  - Toggle de visibilidad de password
  - Mensajes de error contextuales
  - Loading states realistas

### 2. Janitorial Calculator
**Propósito**: Generar cotizaciones profesionales para limpieza de cocinas comerciales

#### Características Principales:
- **Cálculo Dinámico**: Actualización en tiempo real
- **Validación Inteligente**: Mínimo 1 trabajador O 1 campana
- **Optimización de Profit**: Target 62% de costo
- **Frecuencias de Limpieza**: Mensual, bimestral, trimestral
- **Descuentos Automáticos**: Basados en frecuencia
- **Generación de PDF**: Con logo y formato profesional

#### Tabs de Navegación:
1. **Quick Quote**: Entrada rápida de datos
2. **Configuration**: Ajustes avanzados (rates, markups)
3. **Breakdown**: Desglose detallado de costos

#### Fórmulas Clave:
```javascript
// Costo base de limpieza
baseCost = workers * hourlyRate * estimatedHours

// Descuento por frecuencia
discount = basePrice * discountPercentage

// Markup objetivo
targetCostPercentage = 62%
markup = (totalCost / 0.62) - totalCost
```

### 3. Timesheet Calculator
**Propósito**: Calcular costos laborales semanales con impuestos de Texas

#### Características Principales:
- **Multi-posición**: Hasta 10 posiciones diferentes
- **Cálculos de Impuestos Texas**:
  - FICA (Social Security): 6.2%
  - Medicare: 1.45%
  - FUTA: 0.6%
  - SUTA (Texas): 2.7% configurable
  - Worker's Comp: 2.5% configurable
- **Análisis de Rentabilidad**: Markup recomendado 42%
- **Gráficos Interactivos**: Chart.js para visualización
- **Captura de Pantalla**: Con opciones de copiar/descargar

#### Tabs:
1. **Weekly Timesheet**: Entrada de horas por día
2. **Configuration**: Tasas de impuestos y costos
3. **Summary**: Resumen con gráficos y métricas

## 🎯 Optimizaciones de Performance

### Mobile
- `inputmode="numeric"` en inputs numéricos
- Touch targets mínimos de 44px
- Scroll indicators en tablas
- Debounce de 300ms en cálculos
- Lazy loading de librerías pesadas

### Desktop
- Hover states sutiles
- Atajos de teclado (Tab navigation)
- Tooltips informativos
- Layouts multi-columna

### General
- Service Worker ready (PWA potential)
- Viewport meta tags optimizados
- CSS crítico inline
- Imágenes optimizadas (logos en CDN)

## 🛠 Mantenimiento y Troubleshooting

### Problemas Comunes

#### 1. Cálculos no se actualizan
**Causa**: Debounce muy largo o error en calculateAll()
**Solución**: Verificar console.log, reducir debounce a 200ms

#### 2. PDF no se genera
**Causa**: Librería no cargada o bloqueador de popups
**Solución**: Verificar loadExportLibraries(), permitir popups

#### 3. Gráficos no aparecen
**Causa**: Chart.js no cargado o canvas no encontrado
**Solución**: Verificar CDN, IDs de canvas

### Agregar Nuevas Funcionalidades

#### Nuevo Campo en Formulario:
1. Agregar al objeto `state`
2. Crear input con validación
3. Agregar listener con debounce
4. Incluir en calculateAll()
5. Agregar a PDF si necesario

#### Nueva Sección:
1. Crear nuevo tab en navegación
2. Agregar div con data-content
3. Implementar lógica en switchTab()
4. Estilizar consistentemente

### Actualizar Tarifas/Impuestos:
```javascript
// Janitorial Calculator - app.js línea ~50
const DEFAULT_HOURLY_RATE = 16;

// Timesheet Calculator - app.js línea ~30
const TAX_RATES = {
    fica: 0.062,
    medicare: 0.0145,
    futa: 0.006,
    suta: 0.027  // Configurable
};
```

## 📱 Testing Checklist

### Mobile (iOS/Android)
- [ ] Teclado numérico aparece correctamente
- [ ] No hay zoom no deseado
- [ ] Scroll suave en tablas
- [ ] Botones alcanzables con pulgar
- [ ] Modales centrados correctamente

### Desktop (Chrome/Safari/Firefox)
- [ ] Hover states funcionan
- [ ] Tab navigation completa
- [ ] Print styles correctos
- [ ] PDFs se generan bien
- [ ] Screenshots funcionan

### Funcionalidad
- [ ] Cálculos precisos
- [ ] Validaciones activas
- [ ] Persistencia de datos (localStorage)
- [ ] Navegación entre calculadoras
- [ ] Autenticación 24h

## 🚀 Deployment

### Requisitos:
- Servidor web estático (Apache/Nginx)
- HTTPS recomendado
- No requiere backend
- Compatible con CDN

### Pasos:
1. Clonar repositorio
2. No hay build process necesario
3. Subir archivos al servidor
4. Configurar headers de caché
5. Testear en producción

## 🔐 Seguridad

### Consideraciones:
- Password en frontend (no para alta seguridad)
- No datos sensibles en localStorage
- Validación client-side solamente
- HTTPS recomendado para producción
- CSP headers recomendados

## 📈 Futuras Mejoras Potenciales

1. **PWA Completa**: Service worker, offline mode
2. **Backend Integration**: Guardar cotizaciones
3. **Multi-idioma**: Español/Inglés
4. **Temas**: Dark mode nativo
5. **Analytics**: Tracking de uso
6. **Export Options**: Excel, CSV
7. **Cliente Portal**: Ver historial de cotizaciones

## 👨‍💻 Desarrollado por

**Christian Reyes** para **Prime Facility Services Group**

Contacto para soporte: [Información de contacto]

---

*Última actualización: Diciembre 2024*