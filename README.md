# Prime Facility Services Group Website

## Descripción General

Este es el sitio web oficial de Prime Facility Services Group, una empresa líder en servicios de facility management con sede en Houston, Texas. El sitio presenta los servicios de la empresa en staffing profesional, limpieza comercial y valet parking.

## Estructura del Proyecto

```
Prime Website/
├── index.html                 # Página principal
├── about/                     # Página "Acerca de"
│   └── index.html
├── cleaning/                  # Servicios de limpieza
│   └── index.html
├── staffing/                  # Servicios de staffing
│   └── index.html
├── valet/                     # Servicios de valet parking
│   └── index.html
├── contact/                   # Página de contacto
│   └── index.html
├── contact-form.html          # [DEPRECADO] Antiguo formulario de contacto
├── profile/                   # Perfiles digitales del equipo
│   ├── angel/
│   ├── christian/
│   ├── dory/
│   └── ...                    # Otros perfiles del equipo
├── navbar.js                  # Componente de navegación
├── navbar.css                 # Estilos de navegación
├── job-application-button.js  # Botón flotante de aplicación
├── preloader.js              # Script del preloader
├── preloader.css             # Estilos del preloader
├── image-protection.css      # Protección de imágenes
├── Company Logo/             # Logos de clientes
├── Team-Profile-Pictures/    # Fotos del equipo
└── Logo-Prime-Svg.svg       # Logo principal de la empresa
```

## Características Principales

### 1. **Diseño Responsivo**
- Adaptable a todos los dispositivos (móvil, tablet, desktop)
- Navegación móvil con menú deslizante
- Optimización para diferentes tamaños de pantalla

### 2. **Componentes Reutilizables**
- **Navbar Component** (`navbar.js`): Navegación dinámica con dropdown para servicios
- **Job Application Button** (`job-application-button.js`): Botón flotante para aplicaciones de trabajo
- **Preloader** (`preloader.js`): Animación de carga profesional con el logo SVG

### 3. **Páginas de Servicios**
- **Staffing**: Servicios de personal para hospitalidad y eventos
- **Cleaning**: Servicios de limpieza comercial y de instalaciones
- **Valet**: Servicios profesionales de valet parking

### 4. **Perfiles Digitales del Equipo**
- Tarjetas digitales individuales para cada miembro del equipo
- Funcionalidad de descarga vCard
- Enlaces a redes sociales
- Información de contacto completa

### 5. **Sistema de Contacto**
- Formulario de contacto unificado en `/contact/`
- Validación de formularios
- Integración con servicios externos (JotForm para aplicaciones)

## Tecnologías Utilizadas

- **HTML5**: Estructura semántica
- **CSS3**: Estilos modernos con animaciones
- **JavaScript**: Funcionalidad interactiva (vanilla JS)
- **Tailwind CSS**: Framework de utilidades CSS
- **AOS (Animate On Scroll)**: Animaciones al hacer scroll
- **Font Awesome**: Iconos
- **Google Fonts**: Tipografía (Montserrat/Inter)

## Configuración de Colores

- **Color Primario**: `#03143A` (Azul oscuro)
- **Color Secundario**: `#C70532` (Rojo corporativo)
- **Gradientes**: Combinaciones de rojo y rosa para CTAs

## Funcionalidades Especiales

### Navegación Inteligente
- Detección automática de página actual
- Efecto de scroll con cambio de fondo
- Menú dropdown para servicios
- Navegación móvil optimizada

### Botón de Aplicación de Trabajo
- Botón flotante siempre visible
- Enlace directo a JotForm
- Versiones para desktop y móvil
- Texto en español: "Trabaja con Nosotros"

### Preloader Animado
- Logo SVG animado
- Barra de progreso
- Transición suave al contenido
- Prevención de scroll durante la carga

### Protección de Imágenes
- CSS para prevenir descarga fácil de imágenes
- Deshabilitación del menú contextual en imágenes

## Notas Importantes

### Archivos Deprecados
- `contact-form.html` está marcado como DEPRECADO y no debe usarse
- Todo el funcionamiento de contacto está en `/contact/index.html`

### Optimizaciones Pendientes
1. **Formulario de Contacto**: Actualmente simula el envío. Necesita integración con backend real
2. **Compresión de Imágenes**: Las imágenes del equipo podrían optimizarse para carga más rápida
3. **SEO**: Agregar meta tags adicionales para mejor posicionamiento

### Mantenimiento
- Los perfiles del equipo usan variables CSS para fácil actualización
- El navbar se inyecta dinámicamente en todas las páginas
- Los estilos están modularizados para fácil mantenimiento

## Enlaces Externos

- **Aplicación de Trabajo**: https://form.jotform.com/243473978786176
- **Google Reviews**: https://g.page/r/CcStPEFjyuxzEBM/review
- **Redes Sociales**:
  - LinkedIn: https://www.linkedin.com/company/prime-facility-services-group-inc
  - Facebook: https://www.facebook.com/primefsgroup
  - Instagram: https://www.instagram.com/primefsgroup/
  - TikTok: https://www.tiktok.com/@primefsgroup

## Contacto

- **Teléfono**: (713) 338-2553
- **Dirección**: 8303 Westglen Dr, Houston, TX 77063
- **Website**: www.primefacilityservicesgroup.com

## Actualizaciones Recientes

- Enero 2025: Unificación del sistema de contacto
- Implementación de perfiles digitales del equipo
- Mejoras en la navegación móvil
- Optimización del preloader

---

*Documentación creada en Enero 2025*