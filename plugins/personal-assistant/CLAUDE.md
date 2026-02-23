# CLAUDE.md

Este archivo guia a Claude Code cuando trabaja con el plugin personal-assistant.

## Descripcion del Plugin

**personal-assistant** es un asistente personal integrado en Claude Code para gestionar memoria, tareas, calendario, briefings diarios e investigacion web. Inspirado en **nanoclaw**, este plugin esta disenado para ser 100% compatible con los Terminos de Servicio de Anthropic: no utiliza scraping de redes sociales, no accede a datos privados de terceros y opera exclusivamente con herramientas estandar de Claude Code (Read, Write, Edit, Glob, Grep, WebSearch, WebFetch, Bash, AskUserQuestion).

## Arquitectura

### Flujo de Datos

```
Usuario (lenguaje natural o comando directo)
    |
    v
Skill de routing NLP (skills/assistant/SKILL.md)
    |  detecta intent, extrae parametros
    v
Comando especifico (/pa:remember, /pa:task, /pa:brief, etc.)
    |
    v
Agente especializado (via Task tool)
    |  lee config, lee/escribe estado, consulta calendario/web
    v
Archivos de estado (.claude/pa/)
    |
    v
Respuesta estructurada al usuario
```

### Estructura de Estado `.claude/pa/`

```
.claude/pa/
├── config.local.md          # Preferencias del usuario (nombre, timezone, rutina)
├── tasks.md                 # Lista de tareas con estados
├── memories/
│   ├── _index.md            # Indice de temas de memoria
│   └── <slug>.md            # Un archivo por tema (ej: proyectos-ia.md)
├── briefings/
│   └── <YYYY-MM-DD>.md      # Briefing diario guardado
└── research/
    └── <slug>-<timestamp>.md # Resultados de investigacion
```

El directorio `.claude/pa/` es **local al proyecto** y no se sube al repositorio. Los archivos `.local.md` deben estar en `.gitignore`.

## Comandos del Plugin

| Comando | Agente | Proposito |
|---------|--------|-----------|
| `/pa:help` | - | Muestra todos los comandos disponibles |
| `/pa:remember <contenido>` | memory-manager | Guarda informacion en la memoria |
| `/pa:recall <query>` | memory-manager | Busca en la memoria por termino |
| `/pa:task add <titulo>` | task-manager | Agrega una tarea pendiente |
| `/pa:task list` | task-manager | Lista tareas con filtros opcionales |
| `/pa:task complete <id>` | task-manager | Marca una tarea como completada |
| `/pa:task update <id>` | task-manager | Actualiza datos de una tarea |
| `/pa:task delete <id>` | task-manager | Elimina una tarea |
| `/pa:brief` | briefing-agent | Genera briefing del dia (tareas + calendario) |
| `/pa:plan-day` | planner-agent | Ayuda a planificar y priorizar el dia |
| `/pa:review-week` | planner-agent | Resume y analiza la semana |
| `/pa:research <tema>` | research-agent | Investiga un tema en internet |

## Tools por Agente

| Agente | Tools |
|--------|-------|
| memory-manager | Read, Write, Edit, Glob, Grep |
| task-manager | Read, Write, Edit, Glob |
| briefing-agent | Read, Glob, Bash (gcalcli) |
| planner-agent | Read, Write, Glob, AskUserQuestion |
| research-agent | WebSearch, WebFetch, Read, Write |
| skill (router) | AskUserQuestion |

## Estrategia de Cumplimiento TOS

Cada componente del plugin cumple con los TOS de Anthropic de la siguiente manera:

| Componente | Enfoque de cumplimiento |
|------------|------------------------|
| Memoria | Archivos locales Markdown. Sin base de datos externa, sin APIs de terceros. |
| Tareas | Archivo `tasks.md` local. Sin integracion con servicios externos (Jira, Todoist) por defecto. |
| Calendario | Delegado a `gcalcli` (herramienta CLI open source). Claude solo lee el output; no accede a OAuth tokens directamente. |
| Briefing | Composicion de datos locales + output de gcalcli. Sin scraping. |
| Investigacion | Usa `WebSearch` y `WebFetch`, herramientas nativas de Claude Code aprobadas por Anthropic. |
| Skill NLP | Routing local sin llamadas externas. Usa AskUserQuestion para clarificacion. |

## Integracion de Calendario

El plugin se integra con Google Calendar a traves de `gcalcli`, una herramienta CLI de terceros que el usuario instala y autentica por separado.

### Flujo de integracion

1. Usuario instala `gcalcli`: `pip install gcalcli`
2. Usuario autentica: `gcalcli init` (abre OAuth en el navegador)
3. El agente `briefing-agent` ejecuta via Bash: `gcalcli agenda today --nocolor`
4. Claude lee el output de texto plano y lo incluye en el briefing

### Degradacion graceful

Si `gcalcli` no esta instalado o falla:
- El briefing se genera sin seccion de calendario
- Se notifica al usuario con instrucciones de instalacion
- Las demas secciones (tareas, memorias recientes) funcionan normalmente

La configuracion de calendario se controla en `.claude/pa/config.local.md`:
```yaml
google_calendar:
  enabled: false        # Cambiar a true para activar
  calendar_id: "primary"
  cli_tool: "gcalcli"
```

## Patrones de Diseno

### Dialogo Iterativo

Los agentes que necesitan informacion del usuario usan el patron de pregunta unica con opciones:
1. Identifican el gap de informacion minimo necesario
2. Usan AskUserQuestion con una pregunta clara y opciones enumeradas
3. Procesan la respuesta y continuan
4. Nunca hacen mas de una pregunta por turno

### Output Estructurado

Cada agente produce output en formato Markdown estandarizado:
- Encabezados claros con emojis opcionales
- Tablas para listas de tareas y memorias
- Separadores horizontales entre secciones
- Fecha y hora en cada entrada

### Aislamiento de Agentes

Cada agente tiene:
- Acceso limitado solo a las tools que necesita
- Scope de lectura/escritura limitado a `.claude/pa/`
- Instrucciones especificas en su archivo Markdown
- Sin conocimiento del estado de otros agentes (stateless)

### Inicializacion Lazy

El estado se inicializa solo cuando es necesario:
- Si `.claude/pa/` no existe, el agente informa al usuario
- El usuario ejecuta: `bash plugins/personal-assistant/scripts/init-state.sh`
- El script crea la estructura completa con archivos base

## Convenciones de Archivos

### Nombres de archivos de memoria

Los slugs de temas de memoria siguen estas reglas:
- Minusculas
- Espacios y caracteres especiales reemplazados por guiones
- Sin acentos ni caracteres no ASCII
- Ejemplos: `proyectos-ia.md`, `recetas-cocina.md`, `cliente-acme.md`

### IDs de tareas

Las tareas tienen IDs autoincrementales en formato `TASK-NNN`:
- Ejemplo: `TASK-001`, `TASK-042`
- El ID se obtiene del frontmatter de `tasks.md`

### Timestamps en nombres de archivo

Los archivos de research y briefings usan formato ISO 8601:
- Briefings: `2024-01-15.md`
- Research: `langchain-20240115-143022.md`
