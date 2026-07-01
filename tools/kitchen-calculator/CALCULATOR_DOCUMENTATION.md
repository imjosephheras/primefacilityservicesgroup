# Kitchen Cleaning Calculator - Documentación Completa

## Índice
1. [Descripción General](#descripción-general)
2. [Características Principales](#características-principales)
3. [Navegación y Pestañas](#navegación-y-pestañas)
4. [Funcionalidad de Ajuste Manual del Grand Total](#funcionalidad-de-ajuste-manual-del-grand-total)
5. [Cálculos y Fórmulas](#cálculos-y-fórmulas)
6. [Configuración del Sistema](#configuración-del-sistema)
7. [Generación de Documentos](#generación-de-documentos)
8. [Modo Oscuro y Accesibilidad](#modo-oscuro-y-accesibilidad)

## Descripción General

El **Kitchen Cleaning Calculator** es una herramienta profesional diseñada para Prime Facility Services Group que permite calcular cotizaciones detalladas para servicios de limpieza de cocinas comerciales. La calculadora optimiza automáticamente los precios para mantener márgenes de ganancia ideales mientras proporciona transparencia total en la estructura de costos.

## Características Principales

### 1. Cálculo Inteligente de Costos
- **Labor**: Calcula costos basados en trabajadores regulares y supervisores
- **Impuestos y Seguros**: Incluye automáticamente payroll tax (17%), worker's compensation y general liability
- **Materiales y Equipos**: Costos diarios personalizables
- **Limpieza de Campanas**: Precios diferenciados para campanas grandes y pequeñas
- **Costos Operacionales**: Porcentajes configurables para suministros, uniformes, comunicaciones y overhead

### 2. Optimización de Ganancias
- **Modo Automático**: Ajusta el markup para mantener un porcentaje objetivo de costos (por defecto 62%)
- **Modo Manual**: Permite establecer un porcentaje de markup personalizado
- **Porcentaje Residual**: Opción para agregar un porcentaje adicional antes del markup

### 3. Opciones Especiales
- **Servicio de Días Festivos**: Aplica un recargo del 25%
- **Fuera de Houston**: Ajusta los costos de transporte
- **Subcontratista**: Calcula ganancias cuando se subcontrata el servicio
- **Tarifa Inicial**: Cobra única al inicio del contrato

## Navegación y Pestañas

### Quick Quote (Cotización Rápida)
La pestaña principal donde se ingresan todos los detalles del servicio:
- Número de trabajadores, horas y días
- Costos de materiales y equipos
- Cantidad de campanas a limpiar
- Opciones especiales y ajustes

### Configuration (Configuración) ✅
Permite ajustar todos los valores base del sistema:
- **Tarifas de Pago**: Regular ($16/hr) y Supervisor ($18/hr)
- **Costos de Transporte**: Houston ($150/día) y Fuera de Houston ($300/día)
- **Tasas de Seguro**: Worker's Comp ($1.88 por $100) y General Liability ($7.33 por $1,000)
- **Precios de Campanas**: Grande ($650) y Pequeña ($550)
- **Costos Internos**: Para cálculo de márgenes en limpieza de campanas
- **Porcentajes Operacionales**: Todos los costos adicionales configurables

### Breakdown (Desglose) ⚠️
Actualmente redirige a Quick Quote y hace scroll automático hasta la sección "Quote Summary" donde se muestra el desglose completo de costos.

## Funcionalidad de Ajuste Manual del Grand Total 🆕

### Cómo Funciona

1. **Activación**: Haz clic en el botón de edición (🖊️) junto a "GRAND TOTAL"
2. **Edición**: El total se convierte en un campo editable donde puedes escribir cualquier valor
3. **Cálculo Inverso**: Al presionar Enter o hacer clic fuera del campo:
   - El sistema calcula automáticamente el Service Markup necesario
   - Activa el modo "Custom Markup"
   - Desactiva la optimización automática si estaba activa
   - Muestra un indicador de "Manual adjustment mode"

### Características Técnicas

- **Sin Límites**: Puedes establecer cualquier valor de Grand Total
- **Markup Dinámico**: El Service Markup se ajusta automáticamente (puede ser cualquier porcentaje positivo)
- **Preservación de Costos**: Todos los demás costos permanecen iguales, solo el markup cambia
- **Consideración de Factores**: El cálculo considera:
  - Costos base y operacionales
  - Porcentaje residual (si está activo)
  - Recargo por días festivos (si aplica)
  - Costos de seguro
  - Tarifa inicial (si está activa)
  - Ajuste por redondeo

### Ejemplo de Uso

Si los costos totales son $1,000 y estableces un Grand Total de $3,000:
- El sistema calculará que necesitas un markup de aproximadamente 200%
- Todos los costos base permanecen iguales
- Solo el Service Markup se ajusta para alcanzar el objetivo

## Cálculos y Fórmulas

### Estructura de Costos

1. **Costos de Labor**
   ```
   Labor = Trabajadores × Horas × Días × Tarifa
   + Costos de labor para limpieza de campanas
   ```

2. **Impuestos y Seguros**
   ```
   Labor Tax = Labor × 17%
   Worker's Comp = Labor × ($1.88 / $100)
   ```

3. **Costos Operacionales**
   ```
   Base = Labor + Labor Tax + Worker's Comp + Transporte + Materiales + Equipos
   Operacionales = Base × (Suma de porcentajes operacionales)
   ```

4. **Subtotal y Markup**
   ```
   Subtotal = Costos Base + Operacionales + Ganancia de Campanas
   Si hay Residual: Subtotal Ajustado = Subtotal × (1 + Residual%)
   Markup = Subtotal Ajustado × Markup%
   ```

5. **Total Final**
   ```
   Total = Subtotal + Markup + Recargo Festivo (si aplica)
   General Liability = Total × ($7.33 / $1,000)
   Grand Total = Total + General Liability + Tarifa Inicial + Redondeo
   ```

### Cálculo Inverso (Grand Total Manual)

Cuando estableces un Grand Total objetivo, el sistema calcula hacia atrás:

1. Resta la tarifa inicial y ajuste de redondeo
2. Calcula el total antes del seguro
3. Remueve el recargo por días festivos (si aplica)
4. Determina el markup necesario:
   ```
   Markup% = ((Total Objetivo / Subtotal Ajustado) - 1) × 100
   ```

## Configuración del Sistema

### Valores Modificables

Todos los valores en la pestaña Configuration se guardan y aplican inmediatamente:

- **Tarifas de Pago**: Ajustables según el mercado
- **Costos de Transporte**: Diferenciados por ubicación
- **Tasas de Seguro**: Actualizables según las pólizas
- **Precios de Campanas**: Personalizables por tamaño
- **Target Cost %**: Define el objetivo para la optimización automática

### Indicador de Cambios

Un asterisco (*) aparece en la pestaña Configuration cuando hay cambios sin guardar.

## Generación de Documentos

### PDF de Cotización
- Diseño profesional con logo de la empresa
- Información completa del cliente
- Desglose detallado de costos
- Términos y condiciones
- Formato listo para imprimir

### Work Order
- Genera orden de trabajo basada en la cotización
- Incluye servicios detallados
- Términos de pago configurables
- Número de orden automático

### Captura de Pantalla
- Guarda la cotización como imagen
- Útil para compartir rápidamente
- Mantiene el formato visual

## Modo Oscuro y Accesibilidad

- **Toggle de Modo Oscuro**: Cambia entre tema claro y oscuro
- **Diseño Responsivo**: Funciona en desktop, tablet y móvil
- **Atajos de Teclado**:
  - `Ctrl/Cmd + Z`: Deshacer
  - `Ctrl/Cmd + Shift + Z`: Rehacer
  - `Ctrl/Cmd + P`: Imprimir
  - `Ctrl/Cmd + S`: Guardar configuración (en pestaña Config)
  - `Ctrl/Cmd + D`: Toggle modo oscuro

## Notas Técnicas

- **Almacenamiento Local**: Las configuraciones se guardan en el navegador
- **Historial de Cambios**: Permite deshacer/rehacer hasta 20 acciones
- **Validación en Tiempo Real**: Todos los campos se validan al instante
- **Cálculos Automáticos**: Cualquier cambio recalcula todo inmediatamente

---

*Versión 2.4.0 - Desarrollado por Christian Reyes para Prime Facility Services Group*