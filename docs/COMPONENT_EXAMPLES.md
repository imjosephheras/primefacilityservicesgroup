# Ejemplos de Componentes - Design System

Este documento contiene ejemplos prácticos de cómo implementar componentes utilizando el Design System oficial.

---

## 📋 Tabla de Contenidos

1. [Navbar Completo](#navbar-completo)
2. [Hero Section](#hero-section)
3. [Cards/Tarjetas](#cardstarjetas)
4. [Secciones de Contenido](#secciones-de-contenido)
5. [Formularios](#formularios)
6. [Footer](#footer)
7. [Elementos Interactivos](#elementos-interactivos)

---

## Navbar Completo

### HTML

```html
<nav class="navbar navbar-expand-lg navbar-light">
    <div class="container-fluid">
        <!-- Logo/Brand -->
        <a class="navbar-brand" href="#home">
            <span class="brand-icon">🏢</span>
            Prime Facility Services
        </a>

        <!-- Toggle Button para Mobile -->
        <button class="navbar-toggler" type="button" id="mobileMenuToggle">
            <span class="navbar-toggler-icon"></span>
        </button>

        <!-- Navigation Links -->
        <div class="navbar-collapse">
            <ul class="navbar-nav ms-auto">
                <li class="nav-item">
                    <a class="nav-link active" href="#home">Inicio</a>
                </li>
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#services">
                        Servicios
                    </a>
                    <div class="dropdown-menu">
                        <a class="dropdown-item" href="#facility">Facility Management</a>
                        <a class="dropdown-item" href="#hospitality">Hospitality</a>
                        <a class="dropdown-item" href="#catering">Catering</a>
                    </div>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#about">Acerca de</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#contact">Contacto</a>
                </li>
                <li class="nav-item">
                    <button class="cta-button" onclick="openContactForm()">
                        Solicitar Servicio
                    </button>
                </li>
            </ul>
        </div>
    </div>
</nav>

<!-- Mobile Menu Overlay -->
<div class="mobile-menu-overlay" id="mobileMenuOverlay">
    <div class="mobile-menu-content">
        <button class="mobile-menu-close" id="mobileMenuClose">✕</button>
        <ul class="mobile-nav-links">
            <li><a href="#home" class="mobile-nav-link">Inicio</a></li>
            <li><a href="#services" class="mobile-nav-link">Servicios</a></li>
            <li><a href="#about" class="mobile-nav-link">Acerca de</a></li>
            <li><a href="#contact" class="mobile-nav-link">Contacto</a></li>
            <li><button class="cta-button" style="width: 100%; margin-top: 1rem;">
                Solicitar Servicio
            </button></li>
        </ul>
    </div>
</div>
```

### CSS Adicional (si es necesario)

```css
.navbar {
    background: transparent;
    transition: all 0.3s ease;
    padding: 1rem 0;
}

.navbar.navbar-scrolled {
    background: var(--navbar-bg-scrolled);
    backdrop-filter: blur(var(--navbar-blur));
    box-shadow: var(--shadow-navbar);
    padding: 0.5rem 0;
}

.navbar-brand {
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
    margin-right: 2rem;
}

.nav-item {
    margin: 0 0.5rem;
}

.navbar-nav .nav-link {
    color: white;
    font-weight: 500;
}

/* Mobile Menu */
.mobile-menu-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--text-light);
    cursor: pointer;
    margin-bottom: 1rem;
}

.mobile-nav-link {
    display: block;
    padding: 0.75rem 0;
    color: var(--text-light);
}
```

### JavaScript

```javascript
// Scroll event para cambiar navbar
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('navbar-scrolled');
    } else {
        navbar.classList.remove('navbar-scrolled');
    }
});

// Mobile menu toggle
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
const mobileMenuClose = document.getElementById('mobileMenuClose');

mobileMenuToggle?.addEventListener('click', function() {
    mobileMenuOverlay.classList.add('active');
});

mobileMenuClose?.addEventListener('click', function() {
    mobileMenuOverlay.classList.remove('active');
});

mobileMenuOverlay?.addEventListener('click', function(e) {
    if (e.target === mobileMenuOverlay) {
        mobileMenuOverlay.classList.remove('active');
    }
});
```

---

## Hero Section

### HTML

```html
<section class="hero-section" id="home">
    <!-- Background Image with Overlay -->
    <div class="hero-background" 
         style="background-image: url('assets/images/hero-bg.jpg'); 
                 background-position: center; 
                 background-size: cover;
                 background-attachment: fixed;">
        <div class="overlay-dark"></div>

        <!-- Content -->
        <div class="hero-content" style="position: relative; z-index: 2;">
            <div class="container">
                <div class="hero-text">
                    <h1 class="on-dark hero-title">
                        Soluciones Profesionales de Facility Management
                    </h1>
                    <p class="on-dark hero-subtitle">
                        Más de 20 años de experiencia en gestión integral de servicios
                    </p>

                    <!-- CTA Buttons -->
                    <div class="hero-buttons">
                        <button class="cta-button" onclick="scrollToSection('services')">
                            Descubre Nuestros Servicios
                        </button>
                        <button class="btn-secondary" onclick="openContactForm()">
                            Solicitar Información
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
```

### CSS

```css
.hero-section {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
}

.hero-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.hero-content {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.hero-text {
    text-align: center;
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
}

.hero-title {
    font-size: 3.5rem;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 1.5rem;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.hero-subtitle {
    font-size: 1.5rem;
    font-weight: 300;
    margin-bottom: 2rem;
    color: rgba(255, 255, 255, 0.9);
}

.hero-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
}

.hero-buttons .btn-secondary {
    background: transparent;
    border-color: var(--text-light);
    color: var(--text-light);
}

.hero-buttons .btn-secondary:hover {
    background: var(--text-light);
    color: var(--text-primary);
}

@media (max-width: 768px) {
    .hero-title {
        font-size: 2rem;
    }

    .hero-subtitle {
        font-size: 1.1rem;
    }

    .hero-buttons {
        flex-direction: column;
    }

    .hero-buttons button {
        width: 100%;
    }
}
```

---

## Cards/Tarjetas

### Tarjeta de Servicio

```html
<div class="service-card">
    <div class="card-icon">
        <i class="icon-primary">🏢</i>
    </div>
    <h3>Facility Management</h3>
    <p class="text-secondary">
        Gestión integral de instalaciones, mantenimiento preventivo y correctivo
    </p>
    <ul class="card-features">
        <li><span class="icon-primary">✓</span> Mantenimiento 24/7</li>
        <li><span class="icon-primary">✓</span> Personal especializado</li>
        <li><span class="icon-primary">✓</span> Reportes detallados</li>
    </ul>
    <button class="btn-secondary">Conocer más</button>
</div>
```

### CSS

```css
.service-card {
    background: white;
    border-radius: var(--radius-md);
    padding: 2rem;
    text-align: center;
    transition: var(--transition-ease);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    border-top: 4px solid var(--color-primary);
}

.service-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 30px rgba(199, 5, 50, 0.15);
}

.card-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    display: inline-block;
}

.card-icon .icon-primary {
    color: var(--color-primary);
    transition: var(--transition-ease);
}

.service-card:hover .card-icon .icon-primary {
    color: var(--color-secondary);
    transform: scale(1.1);
}

.service-card h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: var(--text-primary);
}

.service-card p {
    margin-bottom: 1.5rem;
    line-height: 1.6;
}

.card-features {
    list-style: none;
    padding: 0;
    margin-bottom: 1.5rem;
    text-align: left;
}

.card-features li {
    padding: 0.5rem 0;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
}

.card-features .icon-primary {
    margin-right: 0.75rem;
    font-weight: bold;
}

.service-card .btn-secondary {
    width: 100%;
}
```

---

## Secciones de Contenido

### Sección con Dos Columnas

```html
<section class="content-section" style="background: white; padding: 4rem 2rem;">
    <div class="container">
        <div class="row align-items-center">
            <!-- Columna Izquierda: Imagen -->
            <div class="col-lg-6">
                <div class="content-image">
                    <img src="assets/images/content-image.jpg" alt="Descripción" class="img-fluid">
                </div>
            </div>

            <!-- Columna Derecha: Texto -->
            <div class="col-lg-6">
                <h2>Nuestro Compromiso con la Excelencia</h2>
                <p class="text-secondary" style="font-size: 1.1rem; margin: 1rem 0;">
                    En Prime Facility Services, nos comprometemos a proporcionar soluciones 
                    de gestión de instalaciones de clase mundial.
                </p>

                <ul class="content-list">
                    <li><span class="icon-primary">✓</span> Experiencia de 20+ años</li>
                    <li><span class="icon-primary">✓</span> Equipo certificado</li>
                    <li><span class="icon-primary">✓</span> Atención personalizada</li>
                </ul>

                <button class="cta-button" style="margin-top: 2rem;">
                    Contáctanos Hoy
                </button>
            </div>
        </div>
    </div>
</section>
```

### CSS

```css
.content-section {
    padding: 4rem 2rem;
}

.content-image {
    margin-bottom: 2rem;
    border-radius: var(--radius-md);
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.content-list {
    list-style: none;
    padding: 0;
    margin: 2rem 0;
}

.content-list li {
    display: flex;
    align-items: center;
    padding: 0.75rem 0;
    font-size: 1.1rem;
    color: var(--text-primary);
}

.content-list .icon-primary {
    margin-right: 1rem;
    font-weight: bold;
    color: var(--color-primary);
}
```

---

## Formularios

### Formulario de Contacto

```html
<form class="contact-form" id="contactForm">
    <div class="form-group">
        <label for="fullName" class="form-label">Nombre Completo *</label>
        <input 
            type="text" 
            id="fullName" 
            name="fullName" 
            class="form-input" 
            placeholder="Tu nombre completo"
            required>
    </div>

    <div class="row">
        <div class="col-md-6">
            <div class="form-group">
                <label for="email" class="form-label">Correo Electrónico *</label>
                <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    class="form-input" 
                    placeholder="tu@email.com"
                    required>
            </div>
        </div>
        <div class="col-md-6">
            <div class="form-group">
                <label for="phone" class="form-label">Teléfono</label>
                <input 
                    type="tel" 
                    id="phone" 
                    name="phone" 
                    class="form-input" 
                    placeholder="(555) 123-4567">
            </div>
        </div>
    </div>

    <div class="form-group">
        <label for="service" class="form-label">Servicio de Interés *</label>
        <select id="service" name="service" class="form-input" required>
            <option value="">Selecciona un servicio</option>
            <option value="facility">Facility Management</option>
            <option value="hospitality">Hospitality</option>
            <option value="catering">Catering</option>
        </select>
    </div>

    <div class="form-group">
        <label for="message" class="form-label">Mensaje *</label>
        <textarea 
            id="message" 
            name="message" 
            class="form-input form-textarea" 
            rows="5"
            placeholder="Cuéntanos sobre tu proyecto..."
            required></textarea>
    </div>

    <button type="submit" class="btn-primary" style="width: 100%;">
        Enviar Solicitud
    </button>
</form>
```

### CSS

```css
.contact-form {
    max-width: 600px;
    margin: 0 auto;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: var(--text-primary);
    font-size: 0.95rem;
}

.form-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #E5E7EB;
    border-radius: var(--radius-md);
    font-size: 1rem;
    font-family: inherit;
    transition: var(--transition-ease);
    color: var(--text-primary);
    background: white;
}

.form-input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(199, 5, 50, 0.1);
    outline: none;
}

.form-input::placeholder {
    color: var(--text-secondary);
}

.form-textarea {
    resize: vertical;
    min-height: 120px;
}
```

---

## Footer

### HTML

```html
<footer class="footer" style="background: rgba(3, 20, 58, 0.95); color: white; padding: 3rem 2rem;">
    <div class="container">
        <div class="row">
            <!-- Columna 1: About -->
            <div class="col-md-3">
                <h5 style="margin-bottom: 1rem;">Prime Facility Services</h5>
                <p class="text-secondary" style="font-size: 0.9rem;">
                    Soluciones integrales de gestión de instalaciones con más de 20 años de experiencia.
                </p>
            </div>

            <!-- Columna 2: Services -->
            <div class="col-md-3">
                <h5 style="margin-bottom: 1rem;">Servicios</h5>
                <ul style="list-style: none; padding: 0;">
                    <li><a href="#facility" style="color: rgba(255, 255, 255, 0.7);">Facility Management</a></li>
                    <li><a href="#hospitality" style="color: rgba(255, 255, 255, 0.7);">Hospitality</a></li>
                    <li><a href="#catering" style="color: rgba(255, 255, 255, 0.7);">Catering</a></li>
                </ul>
            </div>

            <!-- Columna 3: Company -->
            <div class="col-md-3">
                <h5 style="margin-bottom: 1rem;">Empresa</h5>
                <ul style="list-style: none; padding: 0;">
                    <li><a href="#about" style="color: rgba(255, 255, 255, 0.7);">Acerca de</a></li>
                    <li><a href="#team" style="color: rgba(255, 255, 255, 0.7);">Equipo</a></li>
                    <li><a href="#contact" style="color: rgba(255, 255, 255, 0.7);">Contacto</a></li>
                </ul>
            </div>

            <!-- Columna 4: Contact -->
            <div class="col-md-3">
                <h5 style="margin-bottom: 1rem;">Contacto</h5>
                <p style="font-size: 0.9rem; margin: 0.5rem 0;">
                    📞 (555) 123-4567<br>
                    📧 info@primefacility.com<br>
                    📍 Ciudad, País
                </p>
            </div>
        </div>

        <!-- Divider -->
        <hr style="border-color: rgba(199, 5, 50, 0.3); margin: 2rem 0;">

        <!-- Bottom Footer -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">
                © 2026 Prime Facility Services. Todos los derechos reservados.
            </p>
            <div style="display: flex; gap: 1.5rem;">
                <a href="#privacy" style="color: var(--color-primary);">Privacidad</a>
                <a href="#terms" style="color: var(--color-primary);">Términos</a>
            </div>
        </div>
    </div>
</footer>
```

---

## Elementos Interactivos

### Modal/Dialog

```html
<div class="modal-overlay" id="contactModal">
    <div class="modal-dialog">
        <div class="modal-header">
            <h3>Solicitar Servicio</h3>
            <button class="modal-close" onclick="closeModal('contactModal')">✕</button>
        </div>
        <div class="modal-body">
            <!-- Incluir formulario aquí -->
        </div>
    </div>
</div>
```

### CSS Modal

```css
.modal-overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--overlay-dark);
    z-index: 1000;
    align-items: center;
    justify-content: center;
}

.modal-overlay.active {
    display: flex;
}

.modal-dialog {
    background: white;
    border-radius: var(--radius-md);
    max-width: 500px;
    width: 90%;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    max-height: 90vh;
    overflow-y: auto;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #E5E7EB;
}

.modal-header h3 {
    margin: 0;
    color: var(--text-primary);
}

.modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-secondary);
}

.modal-body {
    padding: 1.5rem;
}
```

---

**Nota:** Estos ejemplos asumen que estás usando un framework CSS como Bootstrap. Adapta según tu estructura específica.
