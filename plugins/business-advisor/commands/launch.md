---
description: Define estrategia de lanzamiento - audiencia, timing, canales, KPIs
argument-hint: "[--timeline <weeks>] [--budget low|medium|high]"
allowed-tools:
  - Read
  - Write
  - Glob
  - Task
  - AskUserQuestion
  - WebSearch
---

# Estrategia de Lanzamiento

Crea un plan de go-to-market con audiencia, canales, timeline y métricas.

## Argumentos recibidos
$ARGUMENTS

## Instrucciones

### 1. Parsear argumentos

Extrae:
- `--timeline`: Número de semanas disponibles (default: 4)
- `--budget`: low | medium | high (default: low)

### 2. Entender el producto

Lee el codebase:
- README.md
- Landing page o marketing copy si existe
- Features principales

### 3. Invocar agente

Usa Task para invocar `launch-strategist`:

```
Crea una estrategia de lanzamiento para este producto:

**Producto:**
[descripción del producto desde codebase]

**Restricciones:**
- Timeline: [X semanas]
- Budget: [low/medium/high]

**Contexto adicional:**
[cualquier info relevante del .claude/biz/context.local.md]

Genera un plan de lanzamiento completo y accionable.
```

### 4. Guardar resultado

```
.claude/biz/launch-strategy-<timestamp>.md
```

Formato:
```markdown
---
type: launch-strategy
date: "<timestamp>"
timeline_weeks: <número>
budget: low|medium|high
---

# Plan de Lanzamiento

## Resumen Ejecutivo
[2-3 párrafos con la estrategia en resumen]

## Producto
[Qué es y qué problema resuelve]

## Audiencia Objetivo

### Segmento Primario: [Nombre]
- **Quiénes son:** [descripción]
- **Pain points:** [lista]
- **Dónde están:** [canales]
- **Mensaje clave:** [messaging]

### Segmento Secundario: [Nombre]
[similar estructura]

## Posicionamiento

**Categoría:** [En qué categoría compite]

**Para:** [Audiencia objetivo]
**Que necesitan:** [Problema/necesidad]
**[Producto] es:** [Descripción breve]
**Que provee:** [Beneficio principal]
**A diferencia de:** [Competencia]

**Tagline:** [Propuesta de valor en una frase]

## Canales

### Canales Primarios
| Canal | Tipo | Tácticas | Timeline |
|-------|------|----------|----------|
| [Canal] | owned/earned/paid | [lista] | Semana X-Y |

### Canales Secundarios
[Similar tabla]

## Fases del Lanzamiento

### Fase 1: Pre-lanzamiento (Semanas 1-2)
**Objetivo:** [Qué lograr]

**Actividades:**
- [ ] [Actividad 1] - Responsable - Deadline
- [ ] [Actividad 2] - Responsable - Deadline

**Milestones:**
- [Milestone 1]
- [Milestone 2]

### Fase 2: Lanzamiento (Semanas 3-4)
[Similar estructura]

### Fase 3: Post-lanzamiento (Semanas 5+)
[Similar estructura]

## Plan de Contenido

| Tipo | Título/Tema | Canal | Deadline |
|------|-------------|-------|----------|
| Blog | [Tema] | Website | Semana X |
| Social | [Tema] | Twitter | Semana Y |

## KPIs y Métricas

| Métrica | Target | Cómo medir |
|---------|--------|------------|
| Signups | X | Analytics |
| Activation | X% | Producto |
| PR Coverage | X menciones | Media monitoring |

## Presupuesto Estimado

| Categoría | Monto | % del total |
|-----------|-------|-------------|
| Ads | $X | X% |
| Content | $X | X% |
| Tools | $X | X% |
| **Total** | **$X** | 100% |

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| [Riesgo] | Alta/Media/Baja | Alto/Medio/Bajo | [Acción] |

## Criterios de Éxito

El lanzamiento se considera exitoso si:
1. [Criterio 1]
2. [Criterio 2]
3. [Criterio 3]

## Checklist Pre-Lanzamiento

- [ ] Landing page lista
- [ ] Analytics configurado
- [ ] Email sequences listas
- [ ] Social media programado
- [ ] Press kit preparado
- [ ] FAQ/Support docs listos

---
*Generado por Business Advisor*
```

### 5. Presentar resumen

```
## Plan de Lanzamiento

**Timeline:** 4 semanas
**Budget:** Medium

### Audiencia Principal
Product Managers en startups tech

### Posicionamiento
"La herramienta de priorización que realmente usa tu equipo"

### Canales Principales
1. Product Hunt (Launch day)
2. LinkedIn (Pre y post launch)
3. Newsletter de PM (Partnerships)

### KPIs
- 500 signups en semana 1
- 20% activation rate
- 3 PR mentions

### Próximas Acciones
1. Preparar landing page
2. Configurar analytics
3. Crear assets para Product Hunt

📄 Plan completo: .claude/biz/launch-strategy-2024-01-15.md
```
