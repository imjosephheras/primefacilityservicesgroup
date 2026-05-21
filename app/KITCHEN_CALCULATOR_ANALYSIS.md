# Análisis de la Lógica de Cálculo - Kitchen Calculator

## Resumen Ejecutivo

La calculadora de Kitchen utiliza una lógica de precios basada en costos directos más márgenes de ganancia, con optimización automática opcional para alcanzar objetivos de rentabilidad específicos.

## Flujo de Cálculo Detallado

### 1. **Costos Base de Mano de Obra**

#### 1.1 Asignación de Personal
- Si hay más de 1 trabajador, se asigna automáticamente 1 supervisor
- Supervisor: $18/hora (configurable)
- Trabajador regular: $16/hora (configurable)

```
Costo Labor = (Trabajadores regulares × $16 × horas × días) + 
              (Supervisores × $18 × horas × días)
```

#### 1.2 Impuestos sobre Nómina
- Se aplica 17% sobre el costo total de mano de obra
- Este porcentaje parece fijo y no configurable

### 2. **Costos de Seguros**

#### 2.1 Workers' Compensation
- 1.88% del costo de mano de obra (configurable)
- Solo se aplica si `includeInsurance` está activo

#### 2.2 General Liability
- $7.33 por cada $1,000 del precio total
- Se calcula DESPUÉS del markup pero ANTES del redondeo

### 3. **Costos de Transporte**

#### 3.1 Tarifas Base
- Dentro de Houston: $150/día
- Fuera de Houston: $300/día

#### 3.2 Descuentos por Volumen
- 8-21 días: 20% descuento
- 21+ días: 30% descuento

### 4. **Materiales y Equipos**

- Materiales: Monto configurable por día
- Equipos: Monto configurable por día
- Ambos son opcionales vía checkboxes

### 5. **Costos Operacionales (Overhead)**

Se calculan como porcentajes de los costos base:
- Regular Supplies: 6%
- Additional Equipment: 2.75%
- Uniforms & Safety: 2.5%
- Communications: 1%
- General Overhead: 5%
**Total Overhead: 17.25% de costos base**

### 6. **Hood Cleaning (Limpieza de Campanas)**

#### 6.1 Precios
- Large Hood: $650 (costo interno: $250)
- Small Hood: $550 (costo interno: $200)

#### 6.2 Descuentos por Frecuencia
- 2x al año: 5% descuento
- 3x al año: 10% descuento
- 4x al año: 15% descuento
- 5x+ al año: 20% descuento

**NOTA IMPORTANTE**: Hood cleaning se suma DESPUÉS del markup, no antes.

### 7. **Markup (Margen de Ganancia)**

#### 7.1 Markup Estándar
- 1 día: 120%
- Disminuye progresivamente hasta 35% para contratos largos (30+ días)

#### 7.2 Optimización Automática
Si está habilitada, ajusta el markup para alcanzar un costo objetivo del 62%:

```
Markup% = ((Costos Directos × 100 / 62) / Subtotal Ajustado - 1) × 100
```

### 8. **Cargos Adicionales**

#### 8.1 Holiday Surcharge
- 25% sobre el total después del markup
- Solo aplica si `isHoliday` está activo

#### 8.2 Initial Fee
- Monto fijo configurable
- Se suma al final antes del redondeo

#### 8.3 Residual Percentage
- Porcentaje adicional sobre el subtotal
- Se aplica ANTES del markup

### 9. **Redondeo**

- Opcional, redondea hacia arriba en incrementos de $50
- Se aplica al gran total final

## Cálculo de Rentabilidad

### Profit Calculations

1. **Net Profit**:
   - Con subcontratista: `Grand Total - Costo Subcontratista - Costo Interno Hood Cleaning`
   - Sin subcontratista: `Grand Total - Costos Directos - Costo Interno Hood Cleaning`

2. **Cost Percentage**:
   - Con subcontratista: `(Costo Subcontratista / Precio Total) × 100`
   - Sin subcontratista: `(Costos Directos / Precio Total) × 100`

3. **Comisiones**:
   - Estándar: 20% del Net Profit
   - Split: Configurable en múltiples porcentajes

## Problemas Potenciales Identificados

### 1. **Inconsistencia en Hood Cleaning**
- Se suma DESPUÉS del markup, lo que significa que no se le aplica margen de ganancia
- Sin embargo, sí se le aplican descuentos por volumen
- Esto podría resultar en márgenes más bajos de lo esperado

### 2. **Impuesto Fijo del 17%**
- No parece ser configurable
- Podría no reflejar las tasas reales de impuestos que varían por ubicación

### 3. **Overhead Fijo**
- Los porcentajes de overhead están hardcodeados
- Total de 17.25% podría ser alto o bajo según el tipo de operación

### 4. **Lógica de Subcontratista**
- El "extra benefit" se calcula pero podría no reflejar el verdadero beneficio
- No considera overhead del subcontratista

### 5. **Optimización de Costos**
- El objetivo del 62% es fijo
- La fórmula de optimización podría resultar en markups muy altos o muy bajos

## Recomendaciones

1. **Hacer configurables todos los porcentajes de impuestos y overhead**
2. **Incluir hood cleaning en el cálculo del markup**
3. **Permitir configurar el objetivo de costo para la optimización**
4. **Agregar validación para evitar markups negativos o excesivos**
5. **Considerar diferentes estructuras de costos para subcontratistas**
6. **Agregar opciones para diferentes tipos de seguros con tarifas variables**

## Fórmula Completa Simplificada

```
1. Costos Base = Mano de Obra + Impuestos (17%) + Workers Comp + Transporte + Materiales + Equipos
2. Costos Operacionales = Costos Base × 17.25%
3. Subtotal = Costos Base + Costos Operacionales
4. Subtotal Ajustado = Subtotal + (Subtotal × Residual%)
5. Markup = Subtotal Ajustado × Markup%
6. Total con Markup = Subtotal Ajustado + Markup + Hood Cleaning
7. Holiday Surcharge = Total con Markup × 25% (si aplica)
8. Precio Total = Total con Markup + Holiday Surcharge
9. General Liability = Precio Total × 0.733%
10. Gran Total = Precio Total + General Liability + Initial Fee
11. Gran Total Final = Redondear(Gran Total) hacia arriba en $50
```

Esta estructura permite flexibilidad pero podría beneficiarse de mayor granularidad en la configuración.