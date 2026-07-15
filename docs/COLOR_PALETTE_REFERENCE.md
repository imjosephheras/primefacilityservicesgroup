# 🎨 Referencia Rápida - Paleta de Colores Oficial

**Prime Facility Services Group**  
**Versión 1.0 | Julio 2026**

---

## 📌 Colores Primarios de Marca

### Primary (Rojo/Magenta Oscuro)
- **Código HEX:** `#C70532`
- **RGB:** `rgb(199, 5, 50)`
- **Uso:** Botones principales, accents, enlaces activos, iconos primarios
- **Aplicación:** CTA buttons, active indicators, primary badges

```css
background: #C70532;
color: #C70532;
border-color: #C70532;
```

### Secondary (Rosa/Magenta)
- **Código HEX:** `#E91E63`
- **RGB:** `rgb(233, 30, 99)`
- **Uso:** Gradientes, elementos de apoyo, hover states
- **Aplicación:** Gradientes (primary → secondary), secondary badges

```css
background: #E91E63;
color: #E91E63;
border-color: #E91E63;
```

---

## 🖼️ Colores de Interfaz

### Navbar Background (Scrolled)
- **Código RGBA:** `rgba(3, 20, 58, 0.95)`
- **Uso:** Fondo del navbar cuando el usuario hace scroll
- **Efecto:** Backdrop blur 10px

```css
background: rgba(3, 20, 58, 0.95);
backdrop-filter: blur(10px);
```

### Overlay/Máscara
- **Código RGBA:** `rgba(0, 0, 0, 0.50)`
- **Uso:** Overlay para videos e imágenes de fondo
- **Propósito:** Garantizar legibilidad del contenido

```css
background: rgba(0, 0, 0, 0.50);
```

### Background (Claro)
- **Código HEX:** `#FFFFFF`
- **RGB:** `rgb(255, 255, 255)`
- **Uso:** Fondo principal, contenedores claros

---

## 📝 Colores de Texto

### Text Primary (Oscuro)
- **Código HEX:** `#1F2937`
- **RGB:** `rgb(31, 41, 55)`
- **Uso:** Texto principal sobre fondos claros
- **Contraste:** ✅ AAA (WCAG)

### Text Secondary (Muted)
- **Código HEX:** `#6B7280`
- **RGB:** `rgb(107, 114, 128)`
- **Uso:** Texto secundario, descripción, subtítulos
- **Contraste:** ✅ AA (WCAG)

### Text Light (Blanco)
- **Código HEX:** `#FFFFFF`
- **RGB:** `rgb(255, 255, 255)`
- **Uso:** Texto sobre fondos oscuros
- **Contraste:** ✅ AAA (WCAG)

---

## 🎨 Gradientes

### Gradiente Principal
```css
background: linear-gradient(135deg, #C70532 0%, #E91E63 100%);
/* O */
background: var(--gradient-primary);
```

**Uso:** Botones CTA, headers destacados, elementos de marca

---

## ✨ Efectos y Sombras

### Shadow Primary
```css
box-shadow: 0 4px 20px rgba(199, 5, 50, 0.3);
/* O */
box-shadow: var(--shadow-primary);
```

### Shadow Primary Hover
```css
box-shadow: 0 8px 30px rgba(199, 5, 50, 0.5);
/* O */
box-shadow: var(--shadow-primary-hover);
```

### Shadow Navbar
```css
box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
/* O */
box-shadow: var(--shadow-navbar);
```

---

## 🔄 Transiciones

### Transición Smooth (Cubic Bezier)
```css
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
/* O */
transition: var(--transition-smooth);
```

### Transición Ease
```css
transition: all 0.3s ease;
/* O */
transition: var(--transition-ease);
```

---

## 📐 Border Radius

| Tipo | Valor | Uso |
|------|-------|-----|
| **Pill** | `50px` | Botones, badges |
| **Medium** | `8px` | Cards, inputs, modals |
| **Small** | `4px` | Elementos pequeños |

```css
border-radius: var(--radius-pill);    /* 50px */
border-radius: var(--radius-md);      /* 8px */
border-radius: var(--radius-sm);      /* 4px */
```

---

## 💾 Variables CSS Disponibles

### En tu CSS, usa:

```css
/* Colores Primarios */
var(--color-primary)          /* #C70532 */
var(--color-secondary)        /* #E91E63 */

/* Navbar */
var(--navbar-bg-scrolled)     /* rgba(3, 20, 58, 0.95) */
var(--navbar-blur)            /* 10px */

/* Overlays */
var(--overlay-dark)           /* rgba(0, 0, 0, 0.50) */

/* Backgrounds */
var(--bg-light)               /* #FFFFFF */

/* Texto */
var(--text-primary)           /* #1F2937 */
var(--text-secondary)         /* #6B7280 */
var(--text-light)             /* #FFFFFF */

/* Gradientes */
var(--gradient-primary)       /* linear-gradient(...) */

/* Sombras */
var(--shadow-primary)
var(--shadow-primary-hover)
var(--shadow-navbar)

/* Transiciones */
var(--transition-smooth)      /* 0.3s cubic-bezier(...) */
var(--transition-ease)        /* 0.3s ease */

/* Border Radius */
var(--radius-pill)            /* 50px */
var(--radius-md)              /* 8px */
var(--radius-sm)              /* 4px */
```

---

## 🎯 Guía Rápida de Uso

### Botón Principal (CTA)
```html
<button class="cta-button">Acción</button>
```

```css
background: var(--gradient-primary);
padding: 0.75rem 2rem;
border-radius: var(--radius-pill);
box-shadow: var(--shadow-primary);
```

### Botón Secundario
```html
<button class="btn-secondary">Acción</button>
```

```css
background: transparent;
border: 2px solid var(--color-primary);
color: var(--color-primary);
border-radius: var(--radius-pill);
```

### Enlace Activo
```css
color: var(--color-primary);
border-bottom: 2px solid var(--color-primary);
```

### Card/Tarjeta
```css
background: var(--bg-light);
color: var(--text-primary);
border-top: 4px solid var(--color-primary);
border-radius: var(--radius-md);
box-shadow: var(--shadow-primary);
```

### Elemento sobre Fondo Oscuro
```css
color: var(--text-light);
background: var(--navbar-bg-scrolled);
```

### Elemento sobre Fondo Claro
```css
color: var(--text-primary);
background: var(--bg-light);
```

### Badge
```html
<span class="badge-primary">Nuevo</span>
```

```css
background: var(--color-primary);
color: var(--text-light);
border-radius: var(--radius-md);
padding: 0.25rem 0.75rem;
```

---

## 🔗 Combinaciones de Colores Recomendadas

### En Fondos Claros
- **Texto:** `--text-primary` (#1F2937)
- **Accent:** `--color-primary` (#C70532)
- **Links:** `--color-primary` → hover `--color-secondary`

### En Fondos Oscuros
- **Texto:** `--text-light` (#FFFFFF)
- **Accent:** `--color-secondary` (#E91E63)
- **Links:** `--color-secondary` → hover `--color-primary`

### Para Botones
- **Primary:** Gradiente `--gradient-primary`
- **Secondary:** Borde `--color-primary`, texto `--color-primary`
- **Hover:** Elevación + Sombra aumentada

---

## 🚫 No Hagas Esto

```css
/* ❌ NO usar colores similares */
background: #C71533;  /* Similar a primary */
background: #E91F63;  /* Similar a secondary */

/* ❌ NO crear variantes nuevas */
--color-primary-light: #FF6B7C;  /* Innecesario */

/* ❌ NO cambiar transparencias */
rgba(3, 20, 58, 0.80);  /* Debe ser 0.95 */

/* ❌ NO omitir overlays */
background: url('image.jpg');  /* Falta overlay */

/* ❌ NO usar transiciones inconsistentes */
transition: transform 0.2s linear;  /* Debe ser 0.3s */
```

---

## ✅ Así Sí

```css
/* ✅ Usar variables CSS */
background: var(--color-primary);
color: var(--text-light);
transition: var(--transition-ease);

/* ✅ Usar clases predefinidas */
<button class="cta-button">Acción</button>
<span class="badge-primary">Nuevo</span>

/* ✅ Combinar colores consistentes */
.card {
    background: var(--bg-light);
    color: var(--text-primary);
    border-top: 4px solid var(--color-primary);
}

/* ✅ Aplicar overlays */
<div class="hero-background">
    <div class="overlay-dark"></div>
</div>
```

---

## 🎓 Accesibilidad (WCAG)

| Combinación | Ratio | Nivel |
|------------|-------|-------|
| `#1F2937` sobre `#FFFFFF` | 11.2:1 | ✅ AAA |
| `#6B7280` sobre `#FFFFFF` | 4.5:1 | ✅ AA |
| `#FFFFFF` sobre `#031234` | 15.1:1 | ✅ AAA |
| `#C70532` sobre `#FFFFFF` | 5.4:1 | ✅ AA |

---

## 📱 Responsive Design

Las variables y clases funcionan en todos los tamaños de pantalla:

- **Mobile:** Buttons adaptan tamaño automáticamente
- **Tablet:** Layouts responsivos con flexbox/grid
- **Desktop:** Full width disponible

---

## 📞 Preguntas Frecuentes

**P: ¿Puedo usar `#C70530` en lugar de `#C70532`?**  
R: No. Usa exactamente `#C70532`. La consistencia es crítica.

**P: ¿Cuándo uso Primary vs Secondary?**  
R: Primary para acciones principales, Secondary para gradientes y hover states.

**P: ¿Qué overlay usar en imágenes?**  
R: Siempre `rgba(0, 0, 0, 0.50)` para garantizar legibilidad.

**P: ¿Puedo crear mis propias variables?**  
R: Usa solo las variables oficiales. Extiéndelas si es necesario, pero documenta.

---

**Última actualización:** Julio 15, 2026  
**Archivo de referencia:** `docs/COLOR_PALETTE_REFERENCE.md`  
**CSS Principal:** `assets/css/design-system.css`
