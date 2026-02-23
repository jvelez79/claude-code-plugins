---
description: Gestiona tu lista de tareas personal
argument-hint: "<accion> [args] | add | list | complete | update | delete"
allowed-tools:
  - Read
  - Write
  - Task
  - AskUserQuestion
  - Glob
---

# Gestionar Tareas

Administra tu lista de tareas personal: agregar, listar, completar, actualizar y eliminar.

## Argumentos recibidos

$ARGUMENTS

## Instrucciones

### 1. Verificar estado

Comprueba que existe `.claude/pa/tasks.md`. Si no existe, informa al usuario que debe ejecutar `/pa` para inicializar el estado.

### 2. Parsear accion y argumentos

Detecta la accion al inicio de los argumentos:

**`add "<titulo>" [--priority alta|media|baja] [--due YYYY-MM-DD] [--tags tag1,tag2]`**
- `titulo`: Texto entre comillas o el texto completo antes de los flags
- `--priority`: alta | media | baja (default: media)
- `--due`: Fecha de vencimiento en formato YYYY-MM-DD (opcional)
- `--tags`: Etiquetas separadas por coma (opcional)

**`list [--status pendiente|en-progreso|completada|todas] [--priority P] [--due hoy|semana|vencidas]`**
- `--status`: Filtro de estado (default: pendiente)
- `--priority`: Filtro de prioridad (opcional)
- `--due`: Filtro temporal: hoy (vence hoy), semana (vence esta semana), vencidas (ya vencidas)

**`complete <TASK-ID>`**
- `TASK-ID`: Identificador de la tarea (formato TASK-NNN)

**`update <TASK-ID> [--priority P] [--due FECHA] [--status ESTADO] [--note "texto"]`**
- `TASK-ID`: Identificador de la tarea
- Flags opcionales para actualizar campos especificos
- `--note`: Agrega una nota o comentario a la tarea

**`delete <TASK-ID>`**
- `TASK-ID`: Identificador de la tarea a eliminar

Si no hay accion o es invalida, usa AskUserQuestion:

```json
{
  "questions": [
    {
      "question": "Que quieres hacer con tus tareas?",
      "header": "Gestion de Tareas",
      "options": [
        {"label": "Agregar tarea", "description": "Crear una nueva tarea"},
        {"label": "Ver tareas", "description": "Listar tareas pendientes o en progreso"},
        {"label": "Completar tarea", "description": "Marcar una tarea como completada"},
        {"label": "Actualizar tarea", "description": "Cambiar prioridad, fecha o estado"},
        {"label": "Eliminar tarea", "description": "Borrar una tarea de la lista"}
      ],
      "multiSelect": false
    }
  ]
}
```

### 3. Invocar agente

Usa Task para invocar el agente `task-manager` con toda la informacion parseada:

```
Gestiona la siguiente accion en la lista de tareas personal:

**Accion:** [add|list|complete|update|delete]
**Argumentos:**
- Titulo (si aplica): [titulo]
- Task ID (si aplica): [TASK-ID]
- Priority: [alta|media|baja o null]
- Due date: [YYYY-MM-DD o null]
- Tags: [lista o vacia]
- Status filter (si es list): [pendiente|en-progreso|completada|todas]
- Due filter (si es list): [hoy|semana|vencidas o null]
- Note (si es update): [texto o null]

Lee .claude/pa/tasks.md y aplica la accion correspondiente.
Genera IDs en formato TASK-NNN (numeracion incremental).
Guarda el archivo actualizado.
```

### 4. Presentar resultado

Para `add`:
```
Tarea agregada correctamente.

- ID: TASK-042
- Titulo: <titulo>
- Prioridad: alta
- Vence: 2024-03-25
- Tags: diseno, cliente
```

Para `list`:
```
Tareas pendientes (5):

ALTA PRIORIDAD
  [ ] TASK-042 Revisar propuesta de diseno (vence: 2024-03-25)
  [ ] TASK-038 Responder emails del cliente

MEDIA PRIORIDAD
  [ ] TASK-041 Actualizar documentacion API
  [ ] TASK-039 Code review PR #45

BAJA PRIORIDAD
  [ ] TASK-040 Organizar carpetas de proyecto
```

Para `complete`:
```
Tarea TASK-042 completada.
"Revisar propuesta de diseno" marcada como completada el 2024-03-20.
```

Para `update`:
```
Tarea TASK-042 actualizada.
- Prioridad: media → alta
- Nota agregada: "El cliente adelanto la revision"
```

Para `delete`:
```
Tarea TASK-042 eliminada.
"Revisar propuesta de diseno" ha sido removida de la lista.
```

## Formato del archivo de tareas

`.claude/pa/tasks.md` sigue este formato:

```markdown
---
total_tasks: 42
pending: 5
in_progress: 2
completed: 35
---

# Lista de Tareas

## Pendientes

### TASK-042
- **Titulo:** Revisar propuesta de diseno
- **Prioridad:** alta
- **Estado:** pendiente
- **Creada:** 2024-03-18
- **Vence:** 2024-03-25
- **Tags:** diseno, cliente
- **Notas:**

---

## En Progreso

### TASK-038
- **Titulo:** Implementar modulo de pagos
- **Prioridad:** alta
- **Estado:** en-progreso
- **Creada:** 2024-03-10
- **Tags:** desarrollo

---

## Completadas

### TASK-001
- **Titulo:** Configurar entorno de desarrollo
- **Prioridad:** alta
- **Estado:** completada
- **Creada:** 2024-03-01
- **Completada:** 2024-03-02

---

## Archivadas
```

## Ejemplos

```bash
# Agregar tarea con prioridad y fecha
/task add "Revisar propuesta de diseno" --priority alta --due 2024-03-25

# Listar tareas pendientes (default)
/task list

# Listar todas las tareas
/task list --status todas

# Listar tareas que vencen hoy
/task list --due hoy

# Tareas vencidas de alta prioridad
/task list --due vencidas --priority alta

# Completar tarea
/task complete TASK-042

# Actualizar prioridad
/task update TASK-042 --priority alta

# Agregar nota a tarea
/task update TASK-042 --note "El cliente adelanto la revision"

# Cambiar fecha de vencimiento
/task update TASK-042 --due 2024-03-28

# Eliminar tarea
/task delete TASK-042
```
