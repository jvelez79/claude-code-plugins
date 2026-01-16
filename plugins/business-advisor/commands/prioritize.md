---
description: Prioriza features basado en impacto de negocio usando RICE o ICE
argument-hint: "[--framework rice|ice] [--include-backlog]"
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---

# Priorizar Features

Analiza y prioriza features existentes y/o planeadas por impacto de negocio.

## Argumentos recibidos
$ARGUMENTS

## Instrucciones

### 1. Parsear argumentos

Extrae:
- `--framework`: rice (default) | ice
- `--include-backlog`: Si incluir features planeadas, no solo implementadas

### 2. Escanear codebase

Busca features en el proyecto:
- Rutas y páginas
- Componentes principales
- TODOs y comentarios sobre features
- Issues o backlog si existe

Usa Glob para encontrar archivos relevantes:
```
**/routes/**
**/pages/**
**/views/**
**/features/**
**/components/**
```

### 3. Crear lista inicial

Compila lista de features detectadas con:
- Nombre
- Estado (implemented | partial | planned)
- Archivos relacionados
- Descripción breve

### 4. Invocar agente

Usa Task para invocar `feature-prioritizer`:

```
Prioriza las siguientes features detectadas:

**Features encontradas:**
[lista de features]

**Framework:** [rice/ice]
**Incluir backlog:** [true/false]

**Contexto del producto:**
[resumen del codebase y negocio]

Aplica el framework de priorización y devuelve la lista ordenada.
```

### 5. Guardar resultado

```
.claude/biz/prioritization-<timestamp>.md
```

Formato:
```markdown
---
type: prioritization
framework: rice|ice
date: "<timestamp>"
features_analyzed: <número>
---

# Priorización de Features

## Framework: [RICE|ICE]

## Resumen Ejecutivo
[2-3 párrafos con insights principales]

## Lista Priorizada

| Rank | Feature | Score | Categoría |
|------|---------|-------|-----------|
| 1 | Feature A | 850 | Quick Win |
| 2 | Feature B | 720 | Strategic Bet |
| ... | ... | ... | ... |

## Quick Wins (Alto impacto, bajo esfuerzo)
[Lista con justificación]

## Strategic Bets (Alto impacto, alto esfuerzo)
[Lista con justificación]

## Evitar (Bajo retorno)
[Lista con justificación]

## Análisis Detallado

### Feature 1: [Nombre]
- **Estado:** implemented|partial|planned
- **Archivos:** [lista]
- **Scores:**
  - Reach: X
  - Impact: X
  - Confidence: X%
  - Effort: X weeks
  - **Total:** X
- **Categoría:** Quick Win|Strategic Bet|Fill-in|Time Sink
- **Dependencias:** [lista]
- **Notas:** [observaciones]

[Repetir para cada feature]

## Recomendaciones

### Para el próximo sprint
1. [Feature X] - Quick win para momentum
2. [Feature Y] - Prepara terreno para Z

### A mediano plazo
1. [Feature A] - Strategic bet importante

## Notas sobre el análisis
[Suposiciones, limitaciones, áreas donde falta información]

---
*Generado por Business Advisor*
```

### 6. Presentar resumen

```
## Priorización de Features

**Framework:** RICE
**Features analizadas:** 12

### Top 5 Prioridades
1. Dark Mode (Score: 850) - Quick Win
2. API Integrations (Score: 720) - Strategic Bet
3. Export to PDF (Score: 680) - Quick Win
4. Team Collaboration (Score: 650) - Strategic Bet
5. Mobile App (Score: 520) - Strategic Bet

### Quick Wins (hacer primero)
- Dark Mode
- Export to PDF
- Keyboard Shortcuts

### Evitar por ahora
- Legacy Browser Support (bajo ROI)

📄 Análisis completo: .claude/biz/prioritization-2024-01-15.md
```

## Notas

- El agente preguntará métricas de negocio si no las tiene
- Las estimaciones de esfuerzo son aproximadas
- Dependencias técnicas afectan el orden real
