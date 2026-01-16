---
description: Análisis financiero con proyecciones, métricas y escenarios
argument-hint: "[--scenarios] [--years 3|5]"
allowed-tools:
  - Read
  - Write
  - Glob
  - Task
  - AskUserQuestion
---

# Análisis Financiero

Genera proyecciones financieras y métricas clave como ROI, CAC, LTV.

## Argumentos recibidos
$ARGUMENTS

## Instrucciones

### 1. Parsear argumentos

Extrae:
- `--scenarios`: Si incluir escenarios pesimista/base/optimista
- `--years`: 3 (default) | 5 años de proyección

### 2. Contexto del producto

Lee el codebase para entender:
- Tipo de producto (SaaS, marketplace, etc.)
- Features que sugieren modelo de negocio
- Cualquier pricing existente

Lee también `.claude/biz/context.local.md` si existe para datos previos.

### 3. Invocar agente

Usa Task para invocar `financial-analyst`:

```
Genera un análisis financiero para este producto:

**Producto:**
[descripción del producto]

**Parámetros:**
- Incluir escenarios: [true/false]
- Años de proyección: [3/5]

**Contexto previo (si existe):**
- Pricing definido: [si hay]
- User data: [si hay]
- Validaciones previas: [insights relevantes]

Genera un modelo financiero con:
- Proyecciones de ingresos y costos
- Métricas unitarias (CAC, LTV, etc.)
- Break-even analysis
- Escenarios si aplica
- Recomendaciones
```

### 4. Guardar resultado

```
.claude/biz/finance-<timestamp>.md
```

Formato:
```markdown
---
type: financial-analysis
date: "<timestamp>"
years_projected: 3|5
scenarios_included: true|false
---

# Análisis Financiero

## Resumen Ejecutivo
[Overview del modelo y conclusiones principales]

## Modelo de Negocio

### Tipo
[SaaS | Marketplace | E-commerce | Service | Other]

### Revenue Streams
| Stream | Modelo | % del Total |
|--------|--------|-------------|
| [stream] | subscription/transaction/etc | X% |

### Etapa
[Pre-revenue | Early | Growing | Mature]

## Supuestos del Modelo

### Crecimiento
| Variable | Valor | Fuente |
|----------|-------|--------|
| Crecimiento mensual usuarios | X% | Benchmark SaaS |
| Tasa de conversión | X% | Asunción |
| Churn mensual | X% | Benchmark industria |
| Expansión revenue | X% | Asunción |

### Pricing
| Variable | Valor |
|----------|-------|
| ARPU | $X |
| Incremento anual precio | X% |

### Costos
| Variable | Valor |
|----------|-------|
| CAC | $X |
| COGS % | X% |
| Crecimiento OpEx | X% |

## Proyecciones

### Escenario Base

#### Año 1
| Métrica | Q1 | Q2 | Q3 | Q4 | Total |
|---------|----|----|----|----|-------|
| Usuarios | X | X | X | X | X |
| Usuarios de pago | X | X | X | X | X |
| MRR | $X | $X | $X | $X | $X |
| Costos | $X | $X | $X | $X | $X |
| Net | $X | $X | $X | $X | $X |

[Repetir para cada año]

### Resumen Multi-año

| Métrica | Año 1 | Año 2 | Año 3 | Año 4 | Año 5 |
|---------|-------|-------|-------|-------|-------|
| ARR | $X | $X | $X | $X | $X |
| Gross Margin | X% | X% | X% | X% | X% |
| Net Margin | X% | X% | X% | X% | X% |
| Usuarios totales | X | X | X | X | X |

### Comparación de Escenarios (si aplica)

| Métrica (Año 3) | Pesimista | Base | Optimista |
|-----------------|-----------|------|-----------|
| ARR | $X | $X | $X |
| Break-even | Año X | Año X | Año X |
| Funding necesario | $X | $X | $X |

## Unit Economics

### Métricas Clave

| Métrica | Valor | Benchmark | Status |
|---------|-------|-----------|--------|
| CAC | $X | $Y | ✅/⚠️/❌ |
| LTV | $X | $Y | ✅/⚠️/❌ |
| LTV:CAC | X:1 | >3:1 | ✅/⚠️/❌ |
| Payback (meses) | X | <12 | ✅/⚠️/❌ |
| Gross Margin | X% | >70% | ✅/⚠️/❌ |

### Análisis de Unit Economics

**LTV Calculation:**
- Average revenue per user: $X/mes
- Gross margin: X%
- Churn rate: X%/mes
- **LTV = $X**

**CAC Calculation:**
- Marketing spend: $X
- Sales spend: $X
- New customers: X
- **CAC = $X**

**Ratio:** X:1 - [Saludable/Necesita mejora/Crítico]

## Break-even Analysis

- **Break-even MRR:** $X
- **Break-even usuarios de pago:** X
- **Timeline estimado:** Año X, Mes Y
- **Suposiciones clave:**
  - [suposición 1]
  - [suposición 2]

## Necesidades de Financiamiento

### Runway Actual
- Cash disponible: $X (si conocido)
- Burn rate mensual: $X
- Runway: X meses

### Financiamiento Sugerido

| Fase | Monto | Uso | Timeline |
|------|-------|-----|----------|
| Seed | $X | [uso] | Meses 1-12 |
| Series A | $X | [uso] | Meses 12-24 |

### Recomendación
[Cuánto levantar y cuándo]

## Análisis de Sensibilidad

| Variable | Cambio | Impacto en ARR Año 3 |
|----------|--------|---------------------|
| Churn +3% | 5% → 8% | -25% |
| Precio +50% | $50 → $75 | +30% |
| CAC +50% | $50 → $75 | LTV:CAC de 4:1 a 2.7:1 |

## Riesgos Financieros

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Alto churn | LTV baja | Invertir en retention |
| CAC creciente | Unit economics negativas | Diversificar canales |

## Recomendaciones

### Prioridad Alta
1. **[Recomendación]** - Impacto financiero: [descripción]

### Prioridad Media
1. **[Recomendación]** - Impacto financiero: [descripción]

## Notas y Limitaciones

- Este modelo es una proyección basada en supuestos
- [Lista de limitaciones y áreas de incertidumbre]

---
*Generado por Business Advisor*
```

### 5. Presentar resumen

```
## Análisis Financiero

### Unit Economics
- CAC: $45
- LTV: $180
- LTV:CAC: 4:1 ✅
- Payback: 8 meses ✅

### Proyección a 3 Años
| Año | ARR | Usuarios | Net Margin |
|-----|-----|----------|------------|
| 1 | $120K | 1,000 | -50% |
| 2 | $480K | 3,500 | 10% |
| 3 | $1.2M | 8,000 | 25% |

### Break-even
- Año 2, Q2 (~18 meses)
- Requiere ~800 usuarios de pago

### Funding Sugerido
- $200K seed para 18 meses runway
- Levantar en próximos 3 meses

### Riesgos Principales
1. Churn > 8% rompe unit economics
2. CAC creciente con escala

📄 Modelo completo: .claude/biz/finance-2024-01-15.md
```
