---
description: Muestra los comandos disponibles del asistente personal
argument-hint: ""
allowed-tools:
  - Read
---

# Ayuda del Asistente Personal

Muestra la referencia completa de comandos disponibles.

## Instrucciones

Lee el archivo de configuracion `.claude/pa/config.local.md` si existe para personalizar el saludo con el nombre del usuario. Si no existe, usa "usuario" como nombre.

Muestra el siguiente texto de ayuda estatico al usuario:

---

## Asistente Personal - Referencia de Comandos

### Memoria

Guarda y recupera informacion importante de tu base de conocimiento personal.

**`/remember <contenido> [opciones]`**
Guarda una nota o informacion en tu base de conocimiento.

```bash
/remember "La API usa autenticacion Bearer"
/remember "Reunion con cliente los martes" --topic trabajo
/remember "Leer Atomic Habits" --topic personal --tags libros,metas
```

Opciones:
- `--topic <tema>` — Categoria de la memoria (trabajo, personal, aprendizaje, ideas, recursos...)
- `--tags tag1,tag2` — Etiquetas para facilitar la busqueda

---

**`/recall <consulta> [opciones]`**
Busca en tus memorias guardadas.

```bash
/recall "API autenticacion"
/recall "reuniones" --topic trabajo
/recall "javascript" --limit 5
/recall --topics
```

Opciones:
- `--topic <tema>` — Filtrar busqueda a un tema especifico
- `--limit N` — Maximo de resultados (default: 10)
- `--topics` — Lista todos los temas disponibles

---

### Tareas

Gestiona tu lista de tareas personal con prioridades y fechas de vencimiento.

**`/task add "<titulo>" [opciones]`**
Agrega una nueva tarea.

```bash
/task add "Revisar propuesta" --priority alta --due 2024-03-25
/task add "Leer documentacion" --tags estudio,dev
```

Opciones:
- `--priority alta|media|baja` — Prioridad (default: media)
- `--due YYYY-MM-DD` — Fecha de vencimiento
- `--tags tag1,tag2` — Etiquetas

---

**`/task list [opciones]`**
Lista tus tareas.

```bash
/task list
/task list --status todas
/task list --due hoy
/task list --due vencidas --priority alta
```

Opciones:
- `--status pendiente|en-progreso|completada|todas` (default: pendiente)
- `--priority alta|media|baja` — Filtrar por prioridad
- `--due hoy|semana|vencidas` — Filtrar por fecha

---

**`/task complete <TASK-ID>`** — Marca una tarea como completada
```bash
/task complete TASK-042
```

**`/task update <TASK-ID> [opciones]`** — Actualiza una tarea
```bash
/task update TASK-042 --priority alta
/task update TASK-042 --due 2024-03-28
/task update TASK-042 --note "El cliente adelanto la revision"
/task update TASK-042 --status en-progreso
```

**`/task delete <TASK-ID>`** — Elimina una tarea
```bash
/task delete TASK-042
```

---

### Planificacion

Organiza tu tiempo y revisa tu productividad.

**`/brief [opciones]`**
Genera un briefing con tus tareas, eventos y prioridades del dia.

```bash
/brief
/brief --weekly
/brief --no-calendar
```

Opciones:
- `--weekly` — Genera briefing semanal en lugar de diario
- `--no-calendar` — Omite la seccion de calendario

---

**`/plan-day [opciones]`**
Planifica tu dia interactivamente con bloques de tiempo.

```bash
/plan-day
/plan-day --focus desarrollo
/plan-day --focus reuniones
```

Opciones:
- `--focus <area>` — Area de enfoque del dia (desarrollo, reuniones, admin, escritura...)

---

**`/review-week`**
Review semanal interactivo: logros, blockers, reflexion y plan para la proxima semana.

```bash
/review-week
```

---

### Investigacion

Investiga temas y guarda los hallazgos en tu base de conocimiento.

**`/research <tema> [opciones]`**
Investiga un tema con busqueda web y genera un reporte estructurado.

```bash
/research "mejores practicas de code review"
/research "arquitectura de microservicios" --deep
/research "tecnicas de negociacion" --save-to-memory
/research "machine learning" --deep --save-to-memory
```

Opciones:
- `--deep` — Investigacion mas profunda (mas fuentes y mayor detalle)
- `--save-to-memory` — Guarda el resumen ejecutivo en tus memorias

---

### Configuracion

Edita directamente el archivo de configuracion:

```
.claude/pa/config.local.md
```

Opciones disponibles:
- `name` — Tu nombre para personalizar los briefings
- `timezone` — Zona horaria (ej: "America/Mexico_City")
- `daily_routine.morning_start` — Hora de inicio (ej: "09:00")
- `daily_routine.lunch` — Hora de almuerzo (ej: "13:00")
- `daily_routine.end_of_day` — Hora de fin (ej: "18:00")
- `google_calendar.enabled` — Activar integracion con Google Calendar (true/false)
- `google_calendar.cli_tool` — Herramienta CLI (default: "gcalcli")

Para configurar Google Calendar:
```bash
pip install gcalcli
gcalcli init
```

---

### Ubicacion de datos

Todos los datos se guardan en `.claude/pa/` del directorio actual:

```
.claude/pa/
├── config.local.md          # Configuracion personal
├── tasks.md                 # Lista de tareas
├── memories/
│   ├── _index.md            # Indice de memorias
│   ├── trabajo.md           # Memorias de trabajo
│   ├── personal.md          # Memorias personales
│   └── aprendizaje.md       # Notas de aprendizaje
├── briefings/
│   ├── briefing-YYYY-MM-DD.md     # Briefings diarios
│   └── briefing-semanal-YYYY-WNN.md  # Reviews semanales
└── research/
    └── <tema>-<timestamp>.md      # Reportes de investigacion
```

Los archivos `.local.md` contienen datos personales. Considera agregarlos a `.gitignore`:
```
.claude/pa/
```

---

**Tip:** Usa `/pa` sin argumentos para el menu interactivo principal.
