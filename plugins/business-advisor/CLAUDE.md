# CLAUDE.md

Este archivo guía a Claude Code cuando trabaja con este plugin.

## Descripción del Plugin

**business-advisor** es un plugin de consultoría de negocios genérico que funciona con cualquier aplicación. Proporciona 7 capacidades de análisis de negocio a través de agentes especializados.

## Capacidades

| Comando | Agente | Propósito |
|---------|--------|-----------|
| `/biz validate <idea>` | idea-validator | Evalúa potencial de mercado de una idea |
| `/biz prioritize` | feature-prioritizer | Prioriza features por impacto de negocio |
| `/biz launch` | launch-strategist | Define estrategia de lanzamiento |
| `/biz research <topic>` | market-researcher | Investiga competidores y tendencias |
| `/biz finance` | financial-analyst | Proyecciones financieras y métricas |
| `/biz pricing` | pricing-strategist | Estrategia de precios y monetización |
| `/biz personas` | persona-creator | Genera perfiles de usuarios objetivo |

## Arquitectura

### Flujo de Datos

```
Usuario invoca /biz <subcomando>
    |
    v
Comando router (biz.md) detecta subcomando
    |
    v
Invoca agente especializado via Task
    |
    v
Agente:
  1. Lee codebase para entender el producto
  2. Usa WebSearch para investigar (si aplica)
  3. Dialoga con AskUserQuestion para recopilar info
  4. Genera análisis estructurado (JSON + Markdown)
    |
    v
Guarda resultado en .claude/biz/<tipo>-<slug>.md
    |
    v
Actualiza .claude/biz/context.local.md con insights
```

### Estado Persistente

```
.claude/biz/
├── context.local.md          # Contexto acumulado del producto
├── validation-<slug>.md      # Validaciones de ideas
├── prioritization-<ts>.md    # Matrices de priorización
├── launch-strategy-<ts>.md   # Planes de lanzamiento
├── research-<topic>-<ts>.md  # Reportes de mercado
├── finance-<ts>.md           # Análisis financieros
├── pricing-<ts>.md           # Estrategias de precios
└── personas-<ts>.md          # User personas
```

### Tools por Agente

| Agente | Tools |
|--------|-------|
| idea-validator | AskUserQuestion, Read, Glob, Grep, WebSearch |
| feature-prioritizer | Read, Glob, Grep, AskUserQuestion |
| launch-strategist | AskUserQuestion, Read, Glob, WebSearch |
| market-researcher | WebSearch, WebFetch, Read, Glob, AskUserQuestion |
| financial-analyst | AskUserQuestion, Read, Glob |
| pricing-strategist | AskUserQuestion, WebSearch, Read |
| persona-creator | AskUserQuestion, Read, Glob, WebSearch |

## Idioma

Todos los reportes y análisis se generan en **español**.

## Patrones de Diseño

### Diálogo Iterativo

Los agentes usan el patrón de `idea-refiner`:
1. Reciben contexto inicial
2. Analizan contra checklist de completitud
3. Identifican gaps de información
4. Usan AskUserQuestion para llenar gaps
5. Devuelven JSON estructurado + done_flag
6. Iteran hasta completitud

### Output Estructurado

Cada agente devuelve:
```json
{
  "analysis": { /* resultado específico del agente */ },
  "gaps": [ /* información faltante */ ],
  "recommendations": [ /* acciones sugeridas */ ],
  "done_flag": true/false
}
```

### Integración con Codebase

Los agentes leen el codebase del proyecto actual para:
- Entender el producto existente
- Identificar features implementadas
- Detectar patrones y convenciones
- Generar recomendaciones contextuales

## Uso Típico

```bash
# Validar una nueva idea
/biz validate "Agregar subscripciones premium con AI features"

# Priorizar backlog de features
/biz prioritize --framework rice

# Planificar lanzamiento
/biz launch --timeline 4 --budget medium

# Investigar competencia
/biz research "AI productivity tools" --competitors notion,obsidian

# Análisis financiero
/biz finance --scenarios --years 3

# Definir precios
/biz pricing --model saas

# Crear user personas
/biz personas --count 3
```

## Flujo Recomendado

Para un producto nuevo:
1. `/biz validate` - Validar la idea principal
2. `/biz personas` - Definir usuarios objetivo
3. `/biz research` - Investigar el mercado
4. `/biz prioritize` - Priorizar MVP
5. `/biz pricing` - Definir modelo de monetización
6. `/biz finance` - Proyectar viabilidad financiera
7. `/biz launch` - Planificar lanzamiento
