# Documentación Técnica - Prime Facility Services Group

## Índice

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Componentes JavaScript](#componentes-javascript)
3. [Estilos CSS](#estilos-css)
4. [Páginas del Sitio](#páginas-del-sitio)
5. [Problemas Identificados y Soluciones](#problemas-identificados-y-soluciones)
6. [Guía de Mantenimiento](#guía-de-mantenimiento)
7. [Mejoras Recomendadas](#mejoras-recomendadas)

## Arquitectura del Sistema

### Estructura General
El sitio utiliza una arquitectura de páginas estáticas con componentes JavaScript reutilizables. No hay framework frontend, se usa vanilla JavaScript para mantener el sitio ligero y rápido.

### Tecnologías Base
- **HTML5**: Estructura semántica
- **Tailwind CSS**: Estilos inline mediante CDN
- **JavaScript Vanilla**: Sin dependencias externas
- **AOS Library**: Animaciones al hacer scroll
- **Font Awesome**: Iconos vectoriales

## Componentes JavaScript

### 1. Navbar Component (`navbar.js`)
**Propósito**: Crea una barra de navegación dinámica e inyectada en todas las páginas.

**Características**:
- Inyección automática del HTML de navegación
- Menú dropdown para servicios
- Navegación móvil con overlay
- Detección de página actual
- Efecto de scroll (cambio de transparencia)

**Uso**:
```javascript
// Se auto-ejecuta al cargar la página
// No requiere inicialización manual
```

### 2. Job Application Button (`job-application-button.js`)
**Propósito**: Botón flotante para aplicaciones de trabajo.

**Características**:
- Versión desktop y móvil
- Enlace a formulario JotForm externo
- Posición fija en la esquina inferior derecha
- Tracking opcional de clicks

### 3. Preloader (`preloader.js`)
**Propósito**: Animación de carga profesional.

**Características**:
- Logo SVG animado de Prime
- Barra de progreso simulada
- Prevención de scroll durante carga
- Auto-remoción después de cargar

## Estilos CSS

### 1. Navbar Styles (`navbar.css`)
- Estilos para el componente de navegación
- Animaciones de dropdown
- Transiciones de hover
- Estilos responsivos

### 2. Image Protection (`image-protection.css`)
- Deshabilita selección de imágenes
- Previene arrastre de imágenes
- Protección contra copia fácil
- Deshabilita impresión de imágenes

### 3. Preloader Styles (`preloader.css`)
- Animaciones del logo SVG
- Estilos de la barra de progreso
- Transiciones de fade-out
- Diseño responsivo

## Páginas del Sitio

### 1. Página Principal (`index.html`)
- Hero section con imagen de fondo
- Secciones de servicios
- Logos de clientes
- Llamadas a la acción

### 2. About (`/about/index.html`)
- Historia de la empresa
- Valores corporativos
- Equipo de liderazgo
- Estadísticas de la empresa

### 3. Servicios
- **Staffing** (`/staffing/index.html`): Personal para hospitalidad
- **Cleaning** (`/cleaning/index.html`): Limpieza comercial
- **Valet** (`/valet/index.html`): Servicios de estacionamiento

### 4. Contact (`/contact/index.html`)
- Formulario de contacto unificado
- Mapa de Google Maps integrado
- Información de contacto
- Horarios de atención

### 5. Perfiles del Equipo (`/profile/*/index.html`)
- Tarjetas digitales individuales
- Descarga de vCard dinámica
- Enlaces a redes sociales
- Información de contacto personal

## Problemas Identificados y Soluciones

### 1. Archivo Deprecado
**Problema**: `contact-form.html` está marcado como deprecado pero aún existe.
**Solución**: Este archivo debe ser eliminado en la próxima limpieza. Todo el funcionamiento está en `/contact/index.html`.

### 2. Formulario de Contacto Sin Backend
**Problema**: El formulario simula el envío pero no tiene integración real.
**Código Actual**:
```javascript
// Simulate API call (replace with actual backend integration)
setTimeout(() => {
    alert('Thank you for contacting...');
}, 1000);
```
**Solución Recomendada**: Integrar con un servicio como EmailJS o crear endpoint backend.

### 3. Rutas de Archivos Absolutas
**Problema**: Algunos archivos usan rutas absolutas que podrían fallar en diferentes entornos.
**Solución**: Usar rutas relativas o configurar base URL.

## Guía de Mantenimiento

### Actualizar Información del Equipo
1. Navegar a `/profile/[nombre]/index.html`
2. Modificar las variables CSS en la sección `:root`
3. Actualizar imagen de perfil si es necesario

### Agregar Nuevo Servicio
1. Crear nueva carpeta en la raíz (ej: `/nuevo-servicio/`)
2. Copiar estructura de página existente
3. Actualizar el dropdown en `navbar.js`

### Modificar Información de Contacto
1. Actualizar en `navbar.js` para el header
2. Actualizar en `/contact/index.html`
3. Verificar perfiles del equipo si aplica

## Mejoras Recomendadas

### 1. Optimización de Rendimiento
- **Imágenes**: Comprimir y usar formatos modernos (WebP)
- **CSS/JS**: Minificar archivos en producción
- **Lazy Loading**: Implementar para imágenes fuera del viewport

### 2. SEO
- Agregar meta tags descriptivos
- Implementar Schema.org markup
- Crear sitemap.xml
- Agregar robots.txt

### 3. Accesibilidad
- Agregar atributos ARIA
- Mejorar contraste de colores
- Asegurar navegación por teclado
- Alt text descriptivo en imágenes

### 4. Funcionalidades
- Integración real del formulario de contacto
- Sistema de analytics más robusto
- Versión multiidioma (inglés)
- Chat en vivo o WhatsApp Business

### 5. Seguridad
- Implementar CSP (Content Security Policy)
- Validación del lado del servidor para formularios
- HTTPS en todos los recursos externos
- Rate limiting para formularios

## Scripts de Utilidad

### Servidor de Desarrollo Local
```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server -p 8000
```

### Verificar Enlaces Rotos
```bash
# Usar herramienta como linkchecker
linkchecker http://localhost:8000
```

### Comprimir Imágenes
```bash
# Usando ImageMagick
mogrify -resize 1920x1920\> -quality 85 *.jpg
```

---

*Documentación técnica creada en Enero 2025*