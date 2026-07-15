# Sistema de Diseño - Paleta de Colores Oficial

## Prime Facility Services Group - Identidad Visual

### Versión 1.0 | Establecido: Julio 2026

---

## 📋 Tabla de Contenidos

1. [Paleta Oficial de Colores](#paleta-oficial-de-colores)
2. [Aplicación del Diseño](#aplicación-del-diseño)
3. [Variables CSS](#variables-css)
4. [Guías de Componentes](#guías-de-componentes)
5. [Ejemplos de Implementación](#ejemplos-de-implementación)
6. [Buenas Prácticas](#buenas-prácticas)

---

## 🎨 Paleta Oficial de Colores

Esta es la identidad visual oficial del proyecto. **TODOS los componentes deben utilizar estos colores de forma consistente** sin sustituirse por tonos similares.

### Colores Primarios de Marca

| Color | Código | Uso |
|-------|--------|-----|
| **Primary** | `#C70532` | Rojo/Magenta oscuro - Color principal de la marca |
| **Secondary** | `#E91E63` | Rosa/Magenta - Color de apoyo |

### Colores de Interfaz

| Color | Código | Uso |
|-------|--------|-----|
| **Navbar Background (Scrolled)** | `rgba(3, 20, 58, 0.95)` | Fondo del navbar cuando el usuario hace scroll |
| **Overlay** | `rgba(0, 0, 0, 0.50)` | Máscara para videos e imágenes de fondo |
| **Background** | `#FFFFFF` | Color de fondo principal |

### Colores de Texto

| Color | Código | Uso |
|-------|--------|-----|
| **Text Primary** | `#1F2937` | Texto principal sobre fondos claros |
| **Text Secondary** | `#6B7280` | Texto secundario / muted |
| **Text Light** | `#FFFFFF` | Texto sobre fondos oscuros |

---

## 🎯 Aplicación del Diseño

### 1. Navbar

```html
<!-- El navbar inicia transparente sobre el Hero -->
<nav class="navbar navbar-transparent">
    <!-- Contenido -->
</nav>

<!-- Al hacer scroll, el navbar cambia automáticamente -->
<!-- Clase aplicada: navbar-scrolled -->
```

**Estilos aplicados automáticamente:**
- Fondo: `rgba(3, 20, 58, 0.95)`
- Efecto backdrop blur: `10px`
- Sombra: `0 4px 30px rgba(0, 0, 0, 0.3)`

### 2. Enlaces del Menú

Los enlaces del menú muestran una línea inferior (underline) activa:

```html
<a class="nav-link active" href="#home">Inicio</a>
```

**Comportamiento:**
- Color underline: `#C70532`
- Animación suave en hover y estado activo
- Ancho: 80% del ancho del enlace

### 3. Botones Principales (CTA)

Todos los botones principales utilizan un gradiente de color:

```html
<button class="cta-button">Contáctenos</button>
<!-- O -->
<button class="btn-primary">Solicitar Servicio</button>
```

**Estilos:**
- Gradiente: `linear-gradient(135deg, #C70532 0%, #E91E63 100%)`
- Efecto hover: Elevación suave + Sombra expandida
- Border Radius: `50px` (estilo pill)
- Padding: `0.75rem 2rem`

### 4. Botones Secundarios

Los botones secundarios mantienen un estilo limpio:

```html
<button class="btn-secondary">Más Información</button>
```

**Estilos:**
- Fondo: Transparente
- Borde: `2px solid #C70532`
- Texto: `#C70532`
- En hover: Fondo se llena con color primario, texto blanco

### 5. Títulos

Los títulos mantienen un aspecto elegante y corporativo:

```html
<!-- Sobre fondo claro -->
<h1>Título Principal</h1>

<!-- Sobre fondo oscuro -->
<h1 class="on-dark">Título sobre Fondo Oscuro</h1>
```

**Colores:**
- Sobre fondo claro: `#1F2937` (oscuro)
- Sobre fondo oscuro: `#FFFFFF` (blanco)

### 6. Iconos, Badges e Indicadores

```html
<!-- Icono primario -->
<i class="icon-primary">🔧</i>

<!-- Badge primario -->
<span class="badge-primary">Nuevo</span>

<!-- Indicador activo -->
<div class="indicator-active"></div>
```

**Colores utilizados:**
- Iconos: `#C70532` y `#E91E63` como colores de apoyo
- Badges: Color de fondo `#C70532`, texto blanco
- Indicadores: Color `#C70532`

### 7. Videos de Fondo e Imágenes

Todos los videos e imágenes de fondo deben incluir un overlay:

```html
<div class="hero-background" style="background: url('image.jpg');">
    <div class="overlay-dark"></div>
    <div class="content" style="position: relative; z-index: 2;">
        <!-- Contenido sobre el overlay -->
    </div>
</div>
```

**Overlay:**
- Color: `rgba(0, 0, 0, 0.50)`
- Propósito: Garantizar legibilidad del contenido

---

## 🔧 Variables CSS

El proyecto utiliza **CSS Custom Properties (Variables)** para mantener consistencia. Están definidas en `assets/css/design-system.css`.

### Cómo Usar las Variables

```css
/* En lugar de usar colores hardcoded */
.elemento {
    background: var(--color-primary);     /* #C70532 */
    color: var(--text-light);              /* #FFFFFF */
    box-shadow: var(--shadow-primary);     /* Sombra predefinida */
    transition: var(--transition-ease);    /* Transición consistente */
}
```

### Variables Disponibles

```css
/* Colores Primarios */
--color-primary: #C70532;
--color-secondary: #E91E63;

/* Navbar */
--navbar-bg-scrolled: rgba(3, 20, 58, 0.95);
--navbar-blur: 10px;

/* Overlays */
--overlay-dark: rgba(0, 0, 0, 0.50);

/* Fondos */
--bg-light: #FFFFFF;

/* Texto */
--text-primary: #1F2937;
--text-secondary: #6B7280;
--text-light: #FFFFFF;

/* Gradientes */
--gradient-primary: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);

/* Sombras */
--shadow-primary: 0 4px 20px rgba(199, 5, 50, 0.3);
--shadow-primary-hover: 0 8px 30px rgba(199, 5, 50, 0.5);
--shadow-navbar: 0 4px 30px rgba(0, 0, 0, 0.3);

/* Transiciones */
--transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
--transition-ease: all 0.3s ease;

/* Border Radius */
--radius-pill: 50px;
--radius-md: 8px;
--radius-sm: 4px;
```

---

## 📦 Guías de Componentes

### Componente: Navbar

**Archivo CSS:** `assets/css/design-system.css`

**Clases disponibles:**
- `.navbar` - Contenedor principal
- `.navbar-scrolled` - Estado después del scroll
- `.nav-link` - Enlace de navegación
- `.nav-link.active` - Enlace activo
- `.cta-button` - Botón principal

**Ejemplo:**

```html
<nav class="navbar">
    <div class="nav-container">
        <a class="nav-brand" href="#home">Prime Facility Services</a>
        <div class="nav-links">
            <a class="nav-link active" href="#home">Inicio</a>
            <a class="nav-link" href="#services">Servicios</a>
            <a class="nav-link" href="#about">Acerca de</a>
            <button class="cta-button">Contacto</button>
        </div>
    </div>
</nav>
```

### Componente: Hero Section

**Estructura:**

```html
<section class="hero">
    <div class="hero-background" style="background: url('hero-image.jpg') center/cover;">
        <div class="overlay-dark"></div>
        <div class="hero-content">
            <h1 class="on-dark">Título del Hero</h1>
            <p class="on-dark subtitle">Subtítulo descriptivo</p>
            <button class="cta-button">Llamada a la Acción</button>
        </div>
    </div>
</section>
```

### Componente: Botones

```html
<!-- Botón Primario -->
<button class="btn-primary">Acción Principal</button>

<!-- Botón Secundario -->
<button class="btn-secondary">Acción Secundaria</button>

<!-- CTA Button (Mismo que Primary) -->
<button class="cta-button">Llamada a la Acción</button>
```

### Componente: Badges e Indicadores

```html
<!-- Badge Primario -->
<span class="badge-primary">Nuevo</span>

<!-- Badge Secundario -->
<span class="badge-secondary">Destacado</span>

<!-- Indicador Activo -->
<div class="indicator-active"></div>
```

---

## 💡 Ejemplos de Implementación

### Ejemplo 1: Sección de Servicios con Tarjetas

```html
<section class="services-section">
    <h2>Nuestros Servicios</h2>
    <div class="services-grid">
        <div class="service-card">
            <div class="service-icon icon-primary">🏢</div>
            <h3>Facility Management</h3>
            <p class="text-secondary">Gestión completa de instalaciones</p>
            <button class="btn-secondary">Saber más</button>
        </div>
        <!-- Más tarjetas -->
    </div>
</section>
```

### Ejemplo 2: Formulario de Contacto

```html
<form class="contact-form">
    <div class="form-group">
        <label for="name" class="text-primary">Nombre</label>
        <input type="text" id="name" class="form-input" placeholder="Tu nombre">
    </div>
    <div class="form-group">
        <label for="email" class="text-primary">Correo</label>
        <input type="email" id="email" class="form-input" placeholder="tu@email.com">
    </div>
    <button type="submit" class="btn-primary">Enviar Mensaje</button>
</form>
```

### Ejemplo 3: Video con Overlay

```html
<section class="video-section">
    <div class="video-background" style="background: url('video-thumb.jpg') center/cover;">
        <div class="overlay-dark"></div>
        <div class="video-content" style="position: relative; z-index: 2;">
            <h2 class="on-dark">Conoce Nuestro Proceso</h2>
            <button class="cta-button">
                <span>▶</span> Ver Video
            </button>
        </div>
    </div>
</section>
```

---

## ✅ Buenas Prácticas

### ✓ SÍ - Haz esto

```css
/* ✓ Usar variables CSS */
.elemento {
    background: var(--color-primary);
    color: var(--text-light);
    transition: var(--transition-ease);
}

/* ✓ Usar clases predefinidas */
<button class="btn-primary">Acción</button>

/* ✓ Aplicar overlay en fondos */
<div class="hero-background">
    <div class="overlay-dark"></div>
</div>

/* ✓ Usar colores de texto consistentes */
<p class="text-secondary">Texto secundario</p>
```

### ✗ NO - No hagas esto

```css
/* ✗ NO usar colores hardcoded */
.elemento {
    background: #c70532;  /* Mal - usa la variable */
    color: #FF0000;       /* Mal - usa un color diferente */
}

/* ✗ NO crear nuevas clases de colores */
.my-custom-button {
    background: #d91e63;  /* Mal - similar a secondary */
}

/* ✗ NO omitir overlays en fondos */
<div style="background: url('image.jpg');">
    <!-- Mal - falta overlay, texto ilegible -->
</div>

/* ✗ NO usar transiciones inconsistentes */
.elemento {
    transition: transform 0.5s linear;  /* Inconsistente */
}
```

### Integración en HTML

**Asegúrate de incluir el archivo de Design System en tu HTML:**

```html
<!DOCTYPE html>
<html>
<head>
    <!-- ✓ Design System CSS debe cargarse primero -->
    <link rel="stylesheet" href="assets/css/design-system.css">
    <!-- Otros CSS -->
    <link rel="stylesheet" href="assets/css/navbar.css">
</head>
<body>
    <!-- Contenido -->
</body>
</html>
```

---

## 🎯 Checklist de Implementación

Antes de finalizar cualquier nueva sección, verifica:

- [ ] Se utilizan SOLO los colores de la paleta oficial
- [ ] Los botones principales utilizan el gradiente `#C70532` → `#E91E63`
- [ ] Los botones secundarios tienen estilo clean con bordes
- [ ] El navbar es transparente inicialmente y `rgba(3, 20, 58, 0.95)` al scroll
- [ ] Los enlaces del menú tienen underline en `#C70532` cuando están activos
- [ ] Los títulos son oscuros sobre fondos claros, blancos sobre oscuros
- [ ] Los videos e imágenes de fondo tienen overlay `rgba(0, 0, 0, 0.50)`
- [ ] Las transiciones son suaves y consistentes
- [ ] Los iconos y badges utilizan colores de la paleta
- [ ] Todas las clases CSS provienen de `design-system.css` o están basadas en él

---

## 📞 Soporte y Cambios

Si necesitas ajustar la paleta de colores o agregar nuevos componentes:

1. **Modifica** `assets/css/design-system.css`
2. **Documenta** los cambios en esta guía
3. **Verifica** que todos los componentes existentes se vean correctamente
4. **Realiza un commit** con descripción clara de los cambios

---

## 📝 Histórico de Versiones

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | Jul 2026 | Creación inicial del Sistema de Diseño |

---

**Última actualización:** Julio 15, 2026  
**Mantenedor:** Prime Facility Services Group  
**Estado:** Activo - En cumplimiento obligatorio
