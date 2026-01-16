---
description: Valida si una idea de negocio tiene potencial de mercado
argument-hint: "<idea description> [--deep] [--focus market|tech|business]"
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Task
  - AskUserQuestion
  - WebSearch
---

# Validar Idea de Negocio

Evalúa una idea contra criterios de viabilidad de mercado, competencia y propuesta de valor.

## Argumentos recibidos
$ARGUMENTS

## Instrucciones

### 1. Parsear argumentos

Extrae:
- `idea`: Todo el texto que no sea un flag
- `--deep`: Si presente, hacer análisis profundo con WebSearch
- `--focus`: market | tech | business (opcional, para enfocarse)

### 2. Preparar contexto

Lee el codebase para entender el producto actual:
- README.md
- package.json
- Estructura de directorios principal

### 3. Crear directorio de estado

```bash
mkdir -p .claude/biz
```

### 4. Invocar agente

Usa Task para invocar el agente `idea-validator`:

```
Valida la siguiente idea de negocio:

**Idea:** [idea del usuario]

**Contexto del producto actual:**
[resumen del codebase]

**Flags:**
- deep: [true/false]
- focus: [market/tech/business o none]

Sigue tu proceso de validación y devuelve el análisis estructurado.
```

### 5. Guardar resultado

Genera un slug de la idea (lowercase, guiones, sin caracteres especiales).

Guarda el resultado en:
```
.claude/biz/validation-<slug>.md
```

Formato del archivo:
```markdown
---
type: validation
idea: "<idea original>"
date: "<timestamp>"
score: <número>
recommendation: "<proceed|pivot|abandon>"
---

# Validación: <Idea>

## Resumen Ejecutivo
[Resumen de 2-3 párrafos]

## Score: X/10

### Desglose
- Problem Fit: X/10
- Market Size: X/10
- Competition: X/10
- Differentiation: X/10
- Feasibility: X/10

## Recomendación: [PROCEED|PIVOT|ABANDON]

[Explicación de la recomendación]

## Análisis Detallado

### Problema y Oportunidad
[Contenido]

### Mercado
[TAM/SAM/SOM y análisis]

### Competencia
[Análisis de competidores]

### Propuesta de Valor
[Diferenciadores y defensibilidad]

### Riesgos
[Lista de riesgos con mitigaciones]

### Oportunidades
[Oportunidades identificadas]

## Próximos Pasos
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

---
*Generado por Business Advisor*
```

### 6. Actualizar contexto

Actualiza `.claude/biz/context.local.md` con:
- Última validación realizada
- Score y recomendación
- Insights clave

### 7. Presentar resumen

Muestra al usuario:
- Score y recomendación
- Top 3 hallazgos
- Top 3 riesgos
- Próximos pasos recomendados
- Path al archivo completo

## Ejemplo

```bash
/biz validate "Agregar sistema de gamification con achievements"
```

Output esperado:
```
## Validación de Idea

**Idea:** Agregar sistema de gamification con achievements

**Score:** 7/10 - PROCEED con ajustes

### Hallazgos Principales
1. El mercado de gamification empresarial crece 15% anual
2. Hay espacio para diferenciación en UX
3. Usuarios existentes han pedido esta feature

### Riesgos
1. Puede distraer del core value proposition
2. Requiere inversión significativa en diseño
3. Engagement inicial pero posible fatiga

### Próximos Pasos
1. Validar con 10 usuarios actuales
2. Definir MVP mínimo de achievements
3. Establecer métricas de éxito

📄 Análisis completo: .claude/biz/validation-gamification-achievements.md
```
