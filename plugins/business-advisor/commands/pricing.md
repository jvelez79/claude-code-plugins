---
description: Define estrategia de precios y modelo de monetización
argument-hint: "[--model saas|freemium|onetime]"
allowed-tools:
  - Read
  - Write
  - Glob
  - Task
  - AskUserQuestion
  - WebSearch
---

# Estrategia de Pricing

Analiza competencia y define estructura de precios con tiers.

## Argumentos recibidos
$ARGUMENTS

## Instrucciones

### 1. Parsear argumentos

Extrae:
- `--model`: saas | freemium | onetime | usage (opcional, para explorar modelo específico)

### 2. Contexto del producto

Lee el codebase para entender:
- Features del producto
- Costos de delivery (si aplica)
- Cualquier pricing existente

### 3. Invocar agente

Usa Task para invocar `pricing-strategist`:

```
Define una estrategia de pricing para este producto:

**Producto:**
[descripción del producto y features]

**Modelo a explorar:** [si especificado, o "recomendar"]

**Contexto previo:**
- Research de mercado: [si existe]
- Competidores conocidos: [si hay]

Genera una estrategia de pricing completa con:
- Análisis competitivo de precios
- Modelo recomendado
- Estructura de tiers
- Justificación basada en valor
- Plan de implementación
```

### 4. Guardar resultado

```
.claude/biz/pricing-<timestamp>.md
```

Formato:
```markdown
---
type: pricing-strategy
date: "<timestamp>"
model: freemium|subscription|usage|one-time|hybrid
---

# Estrategia de Pricing

## Resumen Ejecutivo
[Recomendación de pricing en 2-3 párrafos]

## Análisis de Valor

### Propuesta de Valor
[Qué valor entrega el producto]

### Valor Cuantificable
| Beneficio | Valor estimado | Para quién |
|-----------|----------------|------------|
| Ahorro de tiempo | X hrs/semana = $Y | [segmento] |
| Aumento productividad | X% | [segmento] |

## Análisis Competitivo

### Pricing de Competidores

| Competidor | Modelo | Free | Básico | Pro | Enterprise |
|------------|--------|------|--------|-----|------------|
| [Comp A] | Freemium | Sí | $X/mo | $Y/mo | Custom |
| [Comp B] | Subscription | No | $X/mo | $Y/mo | $Z/mo |

### Posicionamiento de Precio
```
Premium ($$$)
    |
    |     [Comp A]
    |
    |         [Tu producto]
    |
    |  [Comp B]
    |
Budget ($)
```

### Insights del Mercado
- Precio promedio: $X/mo
- Rango: $Y - $Z
- Tendencia: [subiendo/estable/bajando]

## Modelo Recomendado

### Tipo: [Freemium con Subscription]

**Por qué este modelo:**
1. [Razón 1]
2. [Razón 2]
3. [Razón 3]

**Métrica de valor:** [Por qué cobrar - usuarios, features, uso, etc.]

## Estructura de Tiers

### Tier 1: Free
**Precio:** $0
**Target:** [Quién usa este tier]
**Propósito:** [Lead generation, awareness, etc.]

| Feature | Límite |
|---------|--------|
| [Feature 1] | Hasta X |
| [Feature 2] | Básico |
| [Feature 3] | ❌ |

**Triggers a upgrade:**
- [Trigger 1]
- [Trigger 2]

---

### Tier 2: Pro
**Precio:** $X/mes ($Y/año - 20% descuento)
**Target:** [Profesionales individuales]
**Propósito:** [Tier principal de monetización]

| Feature | Límite |
|---------|--------|
| [Feature 1] | Ilimitado |
| [Feature 2] | Completo |
| [Feature 3] | Hasta Y |
| Soporte | Email |

**Por qué este precio:**
- [Justificación basada en valor]
- [Comparación con competencia]

---

### Tier 3: Team
**Precio:** $X/usuario/mes (mín. 3 usuarios)
**Target:** [Equipos pequeños]
**Propósito:** [Expansión de cuenta]

| Feature | Límite |
|---------|--------|
| Todo de Pro | Por usuario |
| Colaboración | Completo |
| Admin | Básico |
| Soporte | Prioritario |

---

### Tier 4: Enterprise
**Precio:** Custom (desde $X/mes)
**Target:** [Grandes empresas]
**Propósito:** [High-touch, high-value]

| Feature | Límite |
|---------|--------|
| Todo de Team | Ilimitado |
| SSO/SAML | ✅ |
| SLA | 99.9% |
| Soporte | Dedicado |
| Onboarding | Personalizado |

## Estrategia de Descuentos

| Tipo | Descuento | Condiciones |
|------|-----------|-------------|
| Anual | 20% | Pago por adelantado |
| Startup | 50% x 12 meses | < $1M funding |
| Non-profit | 30% | Verificación |
| Educational | 50% | Instituciones |

## Tácticas de Pricing Psychology

### Anchoring
Mostrar Enterprise primero para que Pro parezca accesible.

### Decoy
Team pricing diseñado para hacer Pro más atractivo para individuos.

## Validación de Unit Economics

| Métrica | Con este pricing |
|---------|------------------|
| ARPU | $X |
| Gross margin | X% |
| LTV (asumiendo X meses) | $Y |
| CAC máximo sostenible | $Z |

**Viabilidad:** ✅ Unit economics saludables

## Plan de Implementación

### Fase 1: MVP Launch
- Free + Pro solamente
- Validar willingness to pay
- Timeline: Mes 1-3

### Fase 2: Expansion
- Agregar Team tier
- Introducir descuentos anuales
- Timeline: Mes 4-6

### Fase 3: Scale
- Enterprise con sales team
- Usage-based add-ons
- Timeline: Mes 7+

## Experimentos Sugeridos

| Experimento | Hipótesis | Métricas |
|-------------|-----------|----------|
| Precio Pro $X vs $Y | Mayor precio no afecta conversión | Conversion rate |
| Trial 7 vs 14 días | Trial más largo mejora conversión | Trial to paid |

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Precio muy alto | Media | Empezar bajo, subir con valor |
| Free tier muy generoso | Alta | Definir limits claros |

## Recomendaciones

1. **Lanzar con Free + Pro** - Validar antes de complicar
2. **Precio inicial conservador** - Más fácil subir que bajar
3. **Medir conversión Free→Pro** - Ajustar triggers

---
*Generado por Business Advisor*
```

### 5. Presentar resumen

```
## Estrategia de Pricing

### Modelo Recomendado
Freemium con Subscription mensual/anual

### Estructura de Tiers

| Tier | Precio | Target |
|------|--------|--------|
| Free | $0 | Awareness + leads |
| Pro | $12/mo | Profesionales |
| Team | $10/user/mo | Equipos |
| Enterprise | Custom | Grandes empresas |

### Posicionamiento
Mid-market: Más accesible que [Comp A], más completo que [Comp B]

### Unit Economics
- ARPU estimado: $15
- Gross margin: 85%
- LTV:CAC target: 3:1 viable

### Próximos Pasos
1. Validar precio Pro con 10 usuarios potenciales
2. Definir límites específicos del tier Free
3. Crear página de pricing

📄 Estrategia completa: .claude/biz/pricing-2024-01-15.md
```
