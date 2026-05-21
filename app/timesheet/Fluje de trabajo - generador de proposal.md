# FLUJO DE TRABAJO SIMPLIFICADO

## 🎯 PASO 1: MARKUP GENERAL
```
IA: "¿Qué porcentaje de markup desea aplicar a todas las tarifas?"
Usuario: "25%"

[Este markup se aplicará a TODAS las posiciones]
```

## 📝 PASO 2: DATOS DEL CLIENTE
```
IA: "Por favor complete la información del cliente:"
- Nombre del cliente: ___________
- Dirección: ___________
- Empresa gestora: ___________
- Fecha de inicio: ___________
- Fecha de fin: ___________
- Duración en años: ___________
```

## 💼 PASO 3: SELECCIÓN Y CONFIGURACIÓN DE POSICIONES

### Interfaz de Selección:
```
FOOD & BEVERAGE
┌─────────────────────────┬────────────┬─────────────┬──────────┐
│ ☐ Seleccionar          │ Posición   │ Tarifa Base │ Bill Rate│
├─────────────────────────┼────────────┼─────────────┼──────────┤
│ ☐                      │ Line Cook  │ $[17.18]    │ $21.48   │
│ ☐                      │ Cook       │ $[16.00]    │ $20.00   │
│ ☐                      │ Barista    │ $[15.00]    │ $18.75   │
│ ☐                      │ Server     │ $[16.00]    │ $20.00   │
└─────────────────────────┴────────────┴─────────────┴──────────┘

[El Bill Rate se actualiza automáticamente cuando se edita la tarifa base]
```

### Ejemplo de Interacción:
```
Usuario: [Marca Line Cook y Server]
Usuario: [Cambia tarifa de Line Cook a $18.00]

Sistema actualiza automáticamente:
Line Cook: Base $18.00 → Bill Rate $22.50 (con 25% markup)
```

## 📊 PASO 4: CONFIRMACIÓN
```
IA: "Resumen de su selección:"

POSICIONES SELECCIONADAS:
- Line Cook: $22.50/hr
- Server: $20.00/hr
- Dishwasher: $16.25/hr
[etc...]

Total de posiciones: 12
Markup aplicado: 25%

¿Confirma esta configuración? [Sí] [Editar]
```

## 🖨️ PASO 5: GENERACIÓN DEL PDF

### El PDF contendrá:
1. **Portada** con logo de Prime
2. **Páginas 2-5**: Acuerdo completo con datos del cliente
3. **Página 6**: Exhibit A (formato de carta de confirmación)
4. **Página 7**: Exhibit B con SOLO las posiciones seleccionadas y Bill Rates

### Exhibit B en el PDF se verá así:
```
                    EXHIBIT B
            TEMPORARY PERSONNEL FEES
                RATES BEFORE TAXES

FOOD & BEVERAGE                          Bill Rate
Line Cook                                $22.50
Server                                   $20.00

HOUSEKEEPING                             Bill Rate  
Housekeeper                              $16.25
Housekeeping Supervisor                  $20.00

[Solo áreas y posiciones seleccionadas]
```

## 🔧 CONFIGURACIÓN ADICIONAL

### Montos de Seguro:
```
- Employer's liability: $_______
- General liability: $_______
- Automobile liability: $_______
- Umbrella liability: $_______
```

## 💾 OPCIONES FINALES
```
- Guardar como plantilla reutilizable
- Exportar PDF: Proposal_[Cliente]_[Fecha].pdf
- Enviar por email
- Crear nueva propuesta
```

## ⚡ EJEMPLO RÁPIDO COMPLETO

```
IA: "Markup a aplicar: "
Usuario: "30%"

IA: "Nombre del cliente:"
Usuario: "Hotel Paradise"

IA: "Seleccione posiciones para Food & Beverage:"
Usuario: [Selecciona Cook $16→$20.80, Server $16→$20.80]

IA: "Seleccione posiciones para Housekeeping:"
Usuario: [Selecciona Housekeeper $13→$16.90]

IA: "¿Desea incluir otras áreas?"
Usuario: "No"

IA: "Generando PDF con 3 posiciones..."
[PDF generado con solo esas 3 posiciones y sus Bill Rates]
```