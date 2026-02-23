# Personal Assistant Plugin

Asistente personal integrado en Claude Code para gestionar tu memoria, tareas, calendario y productividad diaria.

Inspirado en **nanoclaw**, este plugin te da un asistente personal que vive dentro de tu flujo de trabajo en Claude Code, sin salir al navegador ni usar aplicaciones externas. Habla en lenguaje natural o usa comandos directos.

## Instalacion

```bash
# Agregar el marketplace
/plugin marketplace add jvelez79/claude-code-plugins

# Instalar el plugin
/plugin install personal-assistant
```

Inicializa el directorio de estado en tu proyecto:

```bash
bash plugins/personal-assistant/scripts/init-state.sh
```

## Quick Start

La primera vez que uses el plugin:

```bash
# Ver todos los comandos disponibles
/pa:help

# Guarda tu primera memoria
/pa:remember soy desarrollador backend, prefiero TypeScript sobre JavaScript

# Agrega tu primera tarea
/pa:task add revisar la documentacion de la API

# Ve tu briefing del dia
/pa:brief
```

Tambien puedes hablar en lenguaje natural directamente:

```
"que tengo hoy?"
"recuerdame que el cliente prefiere reuniones por la manana"
"tengo que revisar el PR de Maria"
```

---

## Comandos de Memoria

### `/pa:remember <contenido>`

Guarda informacion en tu archivo de memorias, organizada automaticamente por tema.

```bash
/pa:remember el proyecto Alpha usa arquitectura hexagonal
/pa:remember prefiero commits atomicos con conventional commits
/pa:remember cliente Acme: contacto es sofia@acme.com, timezone UTC-6
```

El plugin detecta el tema automaticamente y organiza la informacion en `.claude/pa/memories/<tema>.md`. Si ya existe una memoria del mismo tema, agrega la nueva entrada al final.

### `/pa:recall <query>`

Busca en tus memorias guardadas por termino o frase.

```bash
/pa:recall arquitectura del proyecto
/pa:recall cliente Acme
/pa:recall preferencias de commits
```

Retorna los extractos mas relevantes con el archivo de origen y las etiquetas asociadas.

---

## Comandos de Tareas

### `/pa:task add <titulo>`

Agrega una nueva tarea a tu lista de pendientes.

```bash
/pa:task add revisar PR de Maria
/pa:task add "preparar demo para el cliente" --priority alta
/pa:task add actualizar dependencias del proyecto --due manana
```

**Flags:**
- `--priority alta|media|baja`: Prioridad de la tarea (default: media)
- `--due <fecha>`: Fecha limite (hoy, manana, YYYY-MM-DD)

### `/pa:task list`

Lista tus tareas con filtros opcionales.

```bash
/pa:task list
/pa:task list --status pending
/pa:task list --priority alta
/pa:task list --all
```

**Flags:**
- `--status pending|in-progress|completed`: Filtrar por estado
- `--priority alta|media|baja`: Filtrar por prioridad
- `--all`: Incluir tareas completadas y archivadas

### `/pa:task complete <id>`

Marca una tarea como completada.

```bash
/pa:task complete TASK-003
/pa:task complete TASK-007
```

### `/pa:task update <id>`

Actualiza el titulo, prioridad o estado de una tarea.

```bash
/pa:task update TASK-003 --priority alta
/pa:task update TASK-005 --status in-progress
/pa:task update TASK-002 "nuevo titulo de la tarea"
```

### `/pa:task delete <id>`

Elimina una tarea permanentemente. Pide confirmacion antes de borrar.

```bash
/pa:task delete TASK-008
```

---

## Comandos de Planificacion

### `/pa:brief`

Genera un briefing del dia: tareas pendientes, eventos del calendario (si esta configurado) y memorias recientes relevantes.

```bash
/pa:brief
/pa:brief --date manana
/pa:brief --no-calendar
```

**Flags:**
- `--date <fecha>`: Briefing para una fecha especifica (default: hoy)
- `--no-calendar`: Omitir seccion de calendario aunque este configurado

**Ejemplo de output:**

```
## Briefing del dia - Lunes 15 de enero

### Tareas Pendientes (3)
- [ALTA] TASK-003: Revisar PR de Maria
- [MEDIA] TASK-005: Actualizar documentacion
- [BAJA] TASK-007: Explorar Next.js 15

### Calendario (via gcalcli)
- 10:00 - Standup del equipo (30 min)
- 14:00 - Demo con cliente Acme (1 hora)

### Memorias Recientes
- cliente-acme: Prefieren reuniones por la manana (hace 2 dias)
```

### `/pa:plan-day`

Ayuda interactiva para planificar y priorizar el dia. Revisa tus tareas, te pregunta sobre prioridades y genera un plan de accion.

```bash
/pa:plan-day
```

El agente:
1. Lista tus tareas pendientes ordenadas por prioridad
2. Pregunta cuanto tiempo tienes disponible
3. Sugiere un orden de ejecucion
4. Identifica que puedes delegar o posponer
5. Genera un plan del dia guardado en `.claude/pa/briefings/`

### `/pa:review-week`

Resume y analiza tu semana: tareas completadas, pendientes arrastrados, memorias guardadas e insights de productividad.

```bash
/pa:review-week
/pa:review-week --week anterior
```

**Flags:**
- `--week actual|anterior`: Semana a revisar (default: actual)

**Ejemplo de output:**

```
## Review Semanal - Semana del 13 al 19 de enero

### Completadas esta semana (5)
- TASK-001: Migrar base de datos ...
- TASK-004: Deploy a produccion ...

### Arrastradas a la siguiente semana (2)
- TASK-006: Documentar API (3 dias pendiente)
- TASK-008: Code review del modulo auth

### Memorias guardadas esta semana (3)
- arquitectura-sistema, cliente-acme, decisiones-tecnicas

### Insights
- Completaste el 71% de tus tareas planeadas
- Las tareas de alta prioridad todas completadas
```

---

## Comando de Investigacion

### `/pa:research <tema>`

Investiga un tema en internet usando las herramientas nativas de Claude Code (WebSearch y WebFetch). Guarda el resultado en `.claude/pa/research/`.

```bash
/pa:research LangChain integraciones con TypeScript
/pa:research "mejores practicas de seguridad en APIs REST" --depth profundo
/pa:research competidores de Notion para equipos pequenos
```

**Flags:**
- `--depth rapido|profundo`: Nivel de investigacion (default: rapido)
  - `rapido`: 3-5 fuentes, resumen ejecutivo
  - `profundo`: 8-12 fuentes, analisis detallado con comparativas

**Output guardado en:** `.claude/pa/research/<slug>-<timestamp>.md`

---

## Configuracion

Edita `.claude/pa/config.local.md` para personalizar el asistente:

```yaml
---
name: "Tu Nombre"          # El asistente te llamara por tu nombre
timezone: "America/Mexico_City"
locale: "es"
daily_routine:
  morning_start: "09:00"   # Hora de inicio de tu dia
  lunch: "13:00"
  end_of_day: "18:00"
google_calendar:
  enabled: false            # Cambiar a true para activar
  calendar_id: "primary"
  cli_tool: "gcalcli"
task_defaults:
  default_priority: "medium"
briefing_preferences:
  include_calendar: true
  include_tasks: true
  include_recent_memories: true
  include_research: false
---
```

## Google Calendar Setup

El plugin se integra con Google Calendar a traves de `gcalcli`:

```bash
# Instalar gcalcli
pip install gcalcli

# Autenticar con tu cuenta Google
gcalcli init
# (abre el navegador para autorizar)

# Verificar que funciona
gcalcli agenda today
```

Una vez autenticado, edita `.claude/pa/config.local.md` y cambia `google_calendar.enabled` a `true`.

Si `gcalcli` no esta disponible, el briefing se genera sin la seccion de calendario y las demas funciones siguen operando normalmente.

---

## Ubicacion de Datos y Privacidad

Todos los datos se almacenan **localmente** en tu proyecto:

```
.claude/pa/
├── config.local.md     # Tu configuracion
├── tasks.md            # Lista de tareas
├── memories/           # Tus memorias por tema
├── briefings/          # Briefings guardados
└── research/           # Resultados de investigacion
```

**Privacidad:**
- Ningun dato se envia a servidores externos por el plugin
- `gcalcli` autentica directamente con Google desde tu maquina
- `WebSearch` y `WebFetch` usan las herramientas nativas de Claude Code
- Agrega `.claude/pa/` a tu `.gitignore` para no subir datos personales al repositorio

```bash
# Agregar a .gitignore
echo ".claude/pa/" >> .gitignore
```

---

## Flujo de Trabajo Recomendado

### Manana (al empezar el dia)

```bash
/pa:brief                    # Ver tareas y calendario
/pa:plan-day                 # Planificar y priorizar
```

### Durante el dia

```bash
/pa:task add <nueva tarea>   # Capturar tareas nuevas
/pa:remember <informacion>   # Guardar informacion importante
/pa:recall <tema>            # Recuperar contexto cuando lo necesites
/pa:research <tema>          # Investigar cuando necesites profundizar
```

### Viernes (cierre de semana)

```bash
/pa:review-week              # Revisar lo logrado
/pa:task list --status pending  # Ver que queda pendiente
```

---

## Idioma

Todos los outputs del asistente se generan en **espanol**.
