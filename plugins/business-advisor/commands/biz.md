---
description: Consultor de negocios integrado - valida ideas, prioriza features, planifica lanzamientos, investiga mercados
argument-hint: "<subcommand> [args] | validate | prioritize | launch | research | finance | pricing | personas"
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Task
  - AskUserQuestion
  - WebSearch
  - WebFetch
---

# Business Advisor - Comando Principal

Punto de entrada al plugin de consultoría de negocios.

## Argumentos recibidos
$ARGUMENTS

## Instrucciones

### 1. Parsear argumentos

Detecta el subcomando en los argumentos:
- `validate <idea>` → Valida idea de negocio
- `prioritize` → Prioriza features
- `launch` → Estrategia de lanzamiento
- `research <topic>` → Research de mercado
- `finance` → Análisis financiero
- `pricing` → Estrategia de precios
- `personas` → Crear user personas

Si no hay subcomando, muestra el menú de opciones usando AskUserQuestion.

### 2. Detectar flags

Flags comunes que pueden aparecer:
- `--deep`: Análisis más profundo
- `--focus <area>`: Enfocarse en área específica
- `--framework <name>`: Framework a usar (rice, ice)
- `--timeline <weeks>`: Timeline en semanas
- `--budget <level>`: Presupuesto (low, medium, high)
- `--competitors <list>`: Lista de competidores
- `--depth <level>`: Profundidad (shallow, deep)
- `--scenarios`: Incluir escenarios
- `--years <n>`: Años de proyección
- `--model <type>`: Modelo de monetización
- `--count <n>`: Número de items a generar

### 3. Inicializar estado

Asegura que existe el directorio de estado:
```
.claude/biz/
```

Si no existe `.claude/biz/context.local.md`, créalo con template inicial.

### 4. Leer contexto del producto

Lee archivos clave del codebase para entender el producto:
- README.md
- package.json
- CLAUDE.md (si existe)

Resume el contexto del producto en 2-3 párrafos.

### 5. Invocar subcomando

Delega al comando específico con el contexto recopilado.

Si es `validate`:
- Invoca el agente `idea-validator` via Task
- Pasa: idea, flags (deep, focus), contexto del producto
- Guarda resultado en `.claude/biz/validation-<slug>.md`

Si es `prioritize`:
- Invoca el agente `feature-prioritizer` via Task
- Pasa: framework (rice/ice), include_backlog, contexto
- Guarda resultado en `.claude/biz/prioritization-<timestamp>.md`

Si es `launch`:
- Invoca el agente `launch-strategist` via Task
- Pasa: timeline, budget, contexto del producto
- Guarda resultado en `.claude/biz/launch-strategy-<timestamp>.md`

Si es `research`:
- Invoca el agente `market-researcher` via Task
- Pasa: topic, competitors, depth, contexto
- Guarda resultado en `.claude/biz/research-<topic>-<timestamp>.md`

Si es `finance`:
- Invoca el agente `financial-analyst` via Task
- Pasa: scenarios, years, contexto del producto
- Guarda resultado en `.claude/biz/finance-<timestamp>.md`

Si es `pricing`:
- Invoca el agente `pricing-strategist` via Task
- Pasa: model, contexto del producto
- Guarda resultado en `.claude/biz/pricing-<timestamp>.md`

Si es `personas`:
- Invoca el agente `persona-creator` via Task
- Pasa: count (default 3), contexto del producto
- Guarda resultado en `.claude/biz/personas-<timestamp>.md`

### 6. Actualizar contexto

Después de cada análisis, actualiza `.claude/biz/context.local.md` con:
- Insights clave del análisis
- Fecha del último análisis de cada tipo
- Datos relevantes descubiertos

### 7. Presentar resultados

Muestra al usuario:
1. Resumen ejecutivo del análisis
2. Hallazgos principales
3. Recomendaciones top 3
4. Path al archivo completo guardado

## Menú interactivo

Si no hay subcomando, usa AskUserQuestion:

```json
{
  "questions": [
    {
      "question": "¿Qué tipo de análisis de negocio necesitas?",
      "header": "Análisis",
      "options": [
        {"label": "Validar idea", "description": "Evaluar potencial de mercado de una idea"},
        {"label": "Priorizar features", "description": "Decidir qué construir primero"},
        {"label": "Plan de lanzamiento", "description": "Estrategia de go-to-market"},
        {"label": "Research de mercado", "description": "Investigar competidores y tendencias"}
      ],
      "multiSelect": false
    }
  ]
}
```

O si seleccionan análisis adicionales:

```json
{
  "questions": [
    {
      "question": "¿Qué análisis adicional necesitas?",
      "header": "Adicional",
      "options": [
        {"label": "Análisis financiero", "description": "Proyecciones y métricas"},
        {"label": "Estrategia de pricing", "description": "Definir precios y modelo"},
        {"label": "User personas", "description": "Perfiles de usuarios objetivo"}
      ],
      "multiSelect": false
    }
  ]
}
```

## Ejemplo de uso

```bash
# Validar idea
/biz validate "Sistema de rewards para usuarios activos"

# Priorizar con RICE
/biz prioritize --framework rice

# Plan de lanzamiento
/biz launch --timeline 4 --budget medium

# Research de mercado
/biz research "productivity apps" --competitors notion,obsidian

# Análisis financiero
/biz finance --scenarios --years 3

# Estrategia de precios
/biz pricing --model freemium

# User personas
/biz personas --count 3
```

## Notas importantes

- Todos los análisis se generan en español
- Los resultados se guardan en `.claude/biz/` para referencia futura
- El contexto se acumula para mejorar análisis subsecuentes
- Cada análisis puede requerir diálogo iterativo con el usuario
