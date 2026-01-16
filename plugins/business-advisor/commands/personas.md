---
description: Genera perfiles detallados de usuarios objetivo
argument-hint: "[--count 2-4]"
allowed-tools:
  - Read
  - Write
  - Glob
  - Task
  - AskUserQuestion
  - WebSearch
---

# Crear User Personas

Genera perfiles de usuarios objetivo con demografía, comportamiento y pain points.

## Argumentos recibidos
$ARGUMENTS

## Instrucciones

### 1. Parsear argumentos

Extrae:
- `--count`: Número de personas a crear (2-4, default: 3)

### 2. Contexto del producto

Lee el codebase para entender:
- Qué hace el producto
- Para quién parece estar diseñado
- Features y flujos principales

### 3. Invocar agente

Usa Task para invocar `persona-creator`:

```
Crea [N] user personas para este producto:

**Producto:**
[descripción del producto]

**Features principales:**
[lista de features]

**Contexto adicional:**
- Validaciones previas: [si hay insights de usuarios]
- Research de mercado: [si hay datos de segmentos]

Genera personas detalladas y útiles para tomar decisiones de producto.
```

### 4. Guardar resultado

```
.claude/biz/personas-<timestamp>.md
```

Formato:
```markdown
---
type: user-personas
date: "<timestamp>"
personas_count: 3
primary_persona: "persona_1"
---

# User Personas

## Resumen
[Para qué producto y por qué estos segmentos]

## Matriz de Personas

| Aspecto | [Persona 1] | [Persona 2] | [Persona 3] |
|---------|-------------|-------------|-------------|
| Rol | PM | Developer | Founder |
| Tech Level | Alto | Muy Alto | Medio |
| Decisor | Influencer | User | Buyer |
| Sensibilidad precio | Baja | Media | Alta |
| Prioridad | Primary | Secondary | Secondary |

---

## Persona 1: [Nombre]

### "[Quote característico]"

**Tagline:** [Descripción en una frase]

### Perfil

| | |
|-|-|
| **Nombre** | [Nombre completo] |
| **Edad** | [Edad] |
| **Ubicación** | [Ciudad, País] |
| **Cargo** | [Título] |
| **Empresa** | [Tipo de empresa] |
| **Industria** | [Industria] |

### Contexto Profesional
[Párrafo describiendo su trabajo, equipo, responsabilidades]

### Contexto Personal
[Párrafo describiendo su vida fuera del trabajo]

### Goals

**Objetivos Principales:**
1. [Goal 1] - Importancia: Crítica
2. [Goal 2] - Importancia: Alta
3. [Goal 3] - Importancia: Media

**Aspiraciones:**
- [Aspiración a largo plazo]

### Pain Points

| Pain Point | Severidad | Frecuencia | Workaround Actual |
|------------|-----------|------------|-------------------|
| [Pain 1] | Alta | Diario | [Cómo lo maneja] |
| [Pain 2] | Media | Semanal | [Cómo lo maneja] |

### Comportamiento

**Un Día Típico:**
- 7:00 - [Actividad]
- 9:00 - [Actividad]
- 12:00 - [Actividad]
- 14:00 - [Actividad]
- 18:00 - [Actividad]

**Herramientas que usa:**
[Lista de herramientas]

**Fuentes de información:**
[Dónde se informa]

**Estilo de decisión:**
[Cómo toma decisiones]

### Tecnología

- **Dispositivos:** [Lista]
- **Plataformas preferidas:** [Web/Mobile/Desktop]
- **Redes sociales:** [Lista]

### Relación con el Producto

| Etapa | Comportamiento |
|-------|---------------|
| Awareness | [Cómo descubriría el producto] |
| Consideration | [Qué evaluaría] |
| Decision | [Qué lo convencería] |
| Onboarding | [Expectativas] |
| Uso | [Patrones de uso esperados] |
| Advocacy | [Cuándo recomendaría] |

**Triggers de conversión:**
- [Trigger 1]
- [Trigger 2]

**Riesgos de churn:**
- [Riesgo 1]
- [Riesgo 2]

### Quotes Característicos

> "[Quote 1]"

> "[Quote 2]"

### Implicaciones de Diseño

1. **[Implicación 1]** - [Por qué importa]
2. **[Implicación 2]** - [Por qué importa]
3. **[Implicación 3]** - [Por qué importa]

---

[Repetir para cada persona]

---

## Journey Map

### Etapas del Journey

| Etapa | [Persona 1] | [Persona 2] | Touchpoints | Oportunidades |
|-------|-------------|-------------|-------------|---------------|
| Awareness | [Comportamiento] | [Comportamiento] | [Canales] | [Qué hacer] |
| Consideration | [Comportamiento] | [Comportamiento] | [Canales] | [Qué hacer] |
| Decision | [Comportamiento] | [Comportamiento] | [Canales] | [Qué hacer] |
| Onboarding | [Comportamiento] | [Comportamiento] | [Canales] | [Qué hacer] |
| Uso Regular | [Comportamiento] | [Comportamiento] | [Canales] | [Qué hacer] |
| Advocacy | [Comportamiento] | [Comportamiento] | [Canales] | [Qué hacer] |

## Recomendaciones

### Para Producto
1. [Recomendación basada en personas]
2. [Recomendación basada en personas]

### Para Marketing
1. [Recomendación basada en personas]
2. [Recomendación basada en personas]

### Para Ventas
1. [Recomendación basada en personas]

## Cómo Usar Estas Personas

1. **En diseño:** Preguntar "¿Qué haría [Persona]?"
2. **En priorización:** Considerar impacto en persona primaria
3. **En marketing:** Adaptar mensajes por persona
4. **En ventas:** Identificar con qué persona hablas

---
*Generado por Business Advisor*
```

### 5. Presentar resumen

```
## User Personas

### Personas Creadas

**1. María García - "La PM Pragmática"** (Primary)
- Product Manager, 32 años
- Pain: Demasiado tiempo en tareas admin
- Motivación: Lanzar features que impacten métricas

**2. Carlos Rodríguez - "El Dev Eficiente"**
- Senior Developer, 28 años
- Pain: Interrupciones constantes de stakeholders
- Motivación: Código limpio y tiempo para aprender

**3. Ana López - "La Founder Multitasking"**
- CEO/Founder, 35 años
- Pain: Hacer todo con recursos limitados
- Motivación: Escalar sin perder calidad

### Insights Clave
1. Todos valoran simplicidad sobre features
2. Mobile no es prioridad para ninguno
3. Integración con herramientas existentes es crítica

### Implicaciones para Producto
1. Onboarding < 10 minutos
2. Integraciones con Slack/Jira son must-have
3. Exports para stakeholders

📄 Personas completas: .claude/biz/personas-2024-01-15.md
```
