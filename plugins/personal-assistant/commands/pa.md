---
description: Asistente personal - memoria, tareas, calendario, briefings e investigacion
argument-hint: "<subcomando> [args] | remember | recall | task | brief | research | plan-day | review-week | help"
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Task
  - AskUserQuestion
  - WebSearch
  - WebFetch
  - Bash
---

# Asistente Personal - Comando Principal

Punto de entrada al plugin de asistente personal.

## Argumentos recibidos

$ARGUMENTS

## Instrucciones

### 1. Inicializar estado

Antes de cualquier accion, verifica que exista el directorio `.claude/pa/`.

Si no existe o le faltan subdirectorios, ejecuta el script de inicializacion:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/init-state.sh
```

### 2. Parsear subcomando

Detecta el subcomando al inicio de los argumentos:

- `remember <contenido>` → Guardar memoria o nota
- `recall <consulta>` → Buscar en memorias
- `task <accion>` → Gestionar tareas personales
- `brief` → Generar briefing diario
- `research <tema>` → Investigar un tema
- `plan-day` → Planificar el dia
- `review-week` → Review semanal
- `help` → Mostrar ayuda

Si no hay subcomando o no se reconoce, mostrar menu interactivo.

### 3. Menu interactivo

Si no hay subcomando, usa AskUserQuestion:

```json
{
  "questions": [
    {
      "question": "Que quieres hacer con tu asistente personal?",
      "header": "Asistente Personal",
      "options": [
        {"label": "Guardar memoria", "description": "Guarda una nota o informacion importante"},
        {"label": "Buscar en memorias", "description": "Recupera informacion guardada anteriormente"},
        {"label": "Gestionar tareas", "description": "Agregar, listar o actualizar tareas"},
        {"label": "Briefing del dia", "description": "Resumen de tareas, eventos y prioridades"},
        {"label": "Investigar tema", "description": "Busca y guarda informacion sobre un tema"},
        {"label": "Planificar mi dia", "description": "Organiza tu jornada con bloques de tiempo"},
        {"label": "Review semanal", "description": "Revisa logros y planifica la proxima semana"},
        {"label": "Ayuda", "description": "Ver todos los comandos disponibles"}
      ],
      "multiSelect": false
    }
  ]
}
```

Segun la seleccion, delegar al subcomando correspondiente con los argumentos restantes.

### 4. Delegar al agente correspondiente

Extrae los argumentos despues del subcomando y delega via Task al agente apropiado:

Si es `remember`:
- Invoca el agente `memory-manager` via Task
- Pasa: contenido completo, flags `--topic` y `--tags` si estan presentes

Si es `recall`:
- Invoca el agente `memory-manager` en modo busqueda via Task
- Pasa: query, flags `--topic`, `--limit`, `--topics`

Si es `task`:
- Invoca el agente `task-manager` via Task
- Pasa: accion (add/list/complete/update/delete) y sus argumentos

Si es `brief`:
- Invoca el agente `briefing-agent` via Task
- Pasa: flags `--weekly`, `--no-calendar` si estan presentes

Si es `research`:
- Invoca el agente `research-agent` via Task
- Pasa: tema, flags `--deep`, `--save-to-memory`

Si es `plan-day`:
- Invoca el agente `briefing-agent` con modo plan-day via Task
- Pasa: flag `--focus` si esta presente

Si es `review-week`:
- Invoca el agente `briefing-agent` con modo review-week via Task

Si es `help`:
- Lee y muestra el contenido estatico de ayuda

### 5. Presentar resultado

Muestra el resultado del agente al usuario de forma clara.

## Ejemplos de uso

```bash
# Guardar una nota
/pa remember "La reunion con el cliente es los martes" --topic trabajo

# Buscar en memorias
/pa recall "reunion cliente"

# Agregar tarea
/pa task add "Revisar propuesta de diseno" --priority alta --due 2024-03-20

# Listar tareas pendientes
/pa task list --status pendiente

# Briefing del dia
/pa brief

# Investigar un tema
/pa research "mejores practicas de product management" --save-to-memory

# Planificar el dia
/pa plan-day --focus desarrollo

# Review semanal
/pa review-week

# Mostrar ayuda
/pa help
```

## Notas importantes

- Todo el contenido se guarda en `.claude/pa/` del proyecto actual
- Los archivos `.local.md` no se versionan (agregar a .gitignore si aplica)
- El asistente funciona completamente en espanol
