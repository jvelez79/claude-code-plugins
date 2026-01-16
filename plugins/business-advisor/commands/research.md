---
description: Investiga mercado, competencia y tendencias
argument-hint: "<topic> [--competitors name1,name2] [--depth shallow|deep]"
allowed-tools:
  - Read
  - Write
  - Glob
  - Task
  - AskUserQuestion
  - WebSearch
  - WebFetch
---

# Research de Mercado

Investiga competidores, tendencias y oportunidades en un mercado.

## Argumentos recibidos
$ARGUMENTS

## Instrucciones

### 1. Parsear argumentos

Extrae:
- `topic`: El tema o mercado a investigar
- `--competitors`: Lista de competidores separados por coma
- `--depth`: shallow (default) | deep

### 2. Contexto del producto

Lee el codebase para entender:
- Qué hace el producto del usuario
- En qué categoría compite
- Features actuales

### 3. Invocar agente

Usa Task para invocar `market-researcher`:

```
Investiga el siguiente mercado:

**Tema:** [topic del usuario]
**Competidores específicos:** [lista o "identificar"]
**Profundidad:** [shallow/deep]

**Contexto del producto propio:**
[descripción del producto del usuario]

Genera un reporte de mercado completo con:
- Overview de la industria
- Análisis de competidores
- Tendencias
- Oportunidades y amenazas
- Recomendaciones accionables

Incluye fuentes para todos los datos.
```

### 4. Guardar resultado

Genera slug del topic.

```
.claude/biz/research-<topic-slug>-<timestamp>.md
```

Formato:
```markdown
---
type: market-research
topic: "<topic>"
date: "<timestamp>"
depth: shallow|deep
competitors_analyzed: <número>
---

# Research de Mercado: [Topic]

## Resumen Ejecutivo
[3-4 párrafos con hallazgos principales]

## Overview de la Industria

### Tamaño del Mercado
- **Mercado actual:** $X billion (Fuente)
- **Proyección:** $Y billion para 20XX
- **CAGR:** X%

### Etapa del Mercado
[emerging | growing | mature | declining]

### Tendencias Principales

#### Tendencia 1: [Nombre]
- **Descripción:** [Qué está pasando]
- **Impacto:** Alto/Medio/Bajo
- **Oportunidad:** [Cómo aprovechar]
- **Fuente:** [URL o referencia]

[Repetir para cada tendencia]

### Disrupciones
[Cambios tecnológicos o de mercado que están alterando la industria]

## Análisis de Competencia

### Landscape Competitivo
| Competidor | Tipo | Posicionamiento | Pricing | Fortaleza Principal |
|------------|------|-----------------|---------|---------------------|
| [Nombre] | Directo | [descripción] | $X/mo | [fortaleza] |

### Análisis Detallado

#### [Competidor 1]
- **URL:** [website]
- **Descripción:** [qué hacen]
- **Target:** [a quién apuntan]
- **Pricing:**
  - Free: [features]
  - Pro: $X/mo - [features]
  - Enterprise: Custom
- **Fortalezas:**
  - [fortaleza 1]
  - [fortaleza 2]
- **Debilidades:**
  - [debilidad 1]
  - [debilidad 2]
- **Sentimiento de usuarios:**
  - Positivo: [qué les gusta]
  - Negativo: [qué no les gusta]
  - Fuente: [G2, reviews, etc.]

[Repetir para cada competidor]

### Mapa Competitivo

```
                  Premium
                     |
         [Comp A]    |    [Comp B]
                     |
    Generalista -----+------ Especialista
                     |
         [Comp C]    |    [Tu producto?]
                     |
                  Budget
```

## Insights de Clientes

### Segmentos Principales
| Segmento | Tamaño | Necesidades | Comportamiento |
|----------|--------|-------------|----------------|
| [Segmento] | X% | [lista] | [descripción] |

### Pain Points Comunes
1. [Pain point] - Severidad: Alta
2. [Pain point] - Severidad: Media

### Factores de Decisión
[Qué consideran al elegir una solución]

## Oportunidades

### Oportunidad 1: [Nombre]
- **Descripción:** [Qué es la oportunidad]
- **Evidencia:** [Qué la soporta]
- **Tamaño potencial:** [Estimación]
- **Dificultad:** Fácil/Media/Difícil
- **Acción recomendada:** [Qué hacer]

[Repetir para cada oportunidad]

## Amenazas

### Amenaza 1: [Nombre]
- **Descripción:** [Qué amenaza]
- **Probabilidad:** Alta/Media/Baja
- **Impacto:** Alto/Medio/Bajo
- **Mitigación:** [Cómo protegerse]

[Repetir para cada amenaza]

## Gaps en el Mercado

| Gap | Evidencia | Oportunidad | Barreras |
|-----|-----------|-------------|----------|
| [gap] | [evidencia] | [tamaño] | [barreras] |

## Recomendaciones

### Prioridad Alta
1. **[Recomendación]**
   - Por qué: [rationale]
   - Impacto esperado: [descripción]

### Prioridad Media
[Similar formato]

## Fuentes

| Título | URL | Tipo | Confiabilidad |
|--------|-----|------|---------------|
| [título] | [url] | Report/Article/Website | Alta/Media |

---
*Generado por Business Advisor*
```

### 5. Presentar resumen

```
## Research de Mercado: Productivity Apps

### Tamaño del Mercado
$15B en 2024, creciendo 12% anual

### Competidores Principales
1. **Notion** - Líder, muy completo pero complejo
2. **Obsidian** - Nicho técnico, fuerte comunidad
3. **Coda** - B2B focus, integraciones

### Oportunidades Identificadas
1. Simplicidad vs. feature bloat de competidores
2. Mejor mobile experience
3. AI-first approach

### Amenazas
1. Notion expandiendo a tu segmento
2. Commoditización de features básicas

### Próximos Pasos
1. Profundizar en segmento SMB
2. Validar pricing contra Notion/Coda
3. Investigar partnerships potenciales

📄 Reporte completo: .claude/biz/research-productivity-apps-2024-01-15.md
```
