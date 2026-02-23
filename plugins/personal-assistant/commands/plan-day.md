---
description: Planifica tu dia basado en tareas, calendario y prioridades
argument-hint: "[--focus <area>]"
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Task
  - AskUserQuestion
  - Bash
---

# Planificar el Dia

Organiza tu jornada con bloques de tiempo basados en tus tareas, eventos y rutina configurada.

## Argumentos recibidos

$ARGUMENTS

## Instrucciones

### 1. Parsear argumentos

Extrae de los argumentos:
- `--focus <area>`: Area de enfoque principal del dia (opcional). Ejemplos: desarrollo, reuniones, admin, escritura

### 2. Verificar estado

Comprueba que existen `.claude/pa/tasks.md` y `.claude/pa/config.local.md`. Si no existen, informa al usuario que debe ejecutar `/pa` para inicializar el estado.

### 3. Leer configuracion de rutina

Lee `.claude/pa/config.local.md` para obtener:
- Nombre del usuario
- Horario de rutina: `morning_start`, `lunch`, `end_of_day`
- Configuracion de Google Calendar

### 4. Obtener datos de calendario

Si `google_calendar.enabled: true` en la configuracion:

Ejecuta via Bash:
```bash
command -v gcalcli &>/dev/null && gcalcli --nocolor agenda "today" "tomorrow" --tsv 2>/dev/null || echo "no-disponible"
```

Captura los eventos del dia para considerarlos en la planificacion.

### 5. Generar briefing del dia

Usa Task para invocar el agente `briefing-agent` en modo diario para obtener el panorama completo:

```
Genera el briefing del dia para usar como base del plan diario.

Archivos a leer:
- .claude/pa/tasks.md
- .claude/pa/config.local.md
- .claude/pa/memories/_index.md (memorias recientes relevantes)

Datos de calendario: [output de gcalcli o "no disponible"]

Devuelve: lista de tareas pendientes por prioridad, eventos del dia, tareas vencidas.
```

### 6. Presentar overview y preguntar prioridades

Muestra al usuario las tareas y eventos detectados, luego usa AskUserQuestion para priorizar de forma interactiva:

```json
{
  "questions": [
    {
      "question": "Selecciona las tareas que quieres hacer HOY (en orden de importancia):",
      "header": "Tareas para hoy",
      "options": [
        {"label": "TASK-042: Revisar propuesta de diseno", "description": "Alta prioridad - vence hoy"},
        {"label": "TASK-038: Responder emails del cliente", "description": "Alta prioridad"},
        {"label": "TASK-041: Actualizar documentacion API", "description": "Media prioridad"},
        {"label": "TASK-039: Code review PR #45", "description": "Media prioridad - vencida"},
        {"label": "TASK-040: Organizar carpetas", "description": "Baja prioridad"}
      ],
      "multiSelect": true
    }
  ]
}
```

Nota: Las opciones deben generarse dinamicamente con las tareas reales de `.claude/pa/tasks.md`. Incluir primero las tareas de alta prioridad, luego media, luego baja. Marcar claramente las que vencen hoy o estan vencidas.

### 7. Generar plan con bloques de tiempo

Con las tareas seleccionadas por el usuario y los eventos del calendario, genera el plan del dia.

Usa Task para invocar el agente `briefing-agent` en modo plan-dia:

```
Genera un plan del dia con bloques de tiempo para el usuario.

**Tareas seleccionadas:** [lista de IDs y titulos elegidos por el usuario]
**Eventos del calendario:** [lista de eventos con horarios]
**Area de enfoque:** [--focus o "ninguna"]
**Rutina configurada:**
  - Inicio: [morning_start]
  - Almuerzo: [lunch]
  - Fin: [end_of_day]

Instrucciones:
1. Reserva tiempo para los eventos fijos del calendario
2. Asigna bloques de trabajo para las tareas seleccionadas segun prioridad
3. Incluye bloques de descanso (minimo 10min cada 90min)
4. Reserva buffer de 30min al inicio para emails/mensajes urgentes
5. No programes mas del 80% del tiempo disponible (dejar margen)
6. Agrupa tareas similares cuando sea posible

Guarda el plan en el briefing del dia: .claude/pa/briefings/briefing-[fecha].md
```

### 8. Presentar plan final

Muestra el plan del dia de forma clara:

```
Plan para hoy - [Dia], [Fecha]
[Nombre del usuario]

09:00 - 09:30  Emails y mensajes urgentes
09:30 - 11:00  TASK-042: Revisar propuesta de diseno
11:00 - 11:10  Descanso
11:10 - 12:00  TASK-038: Responder emails del cliente
12:00 - 13:00  TASK-039: Code review PR #45
13:00 - 14:00  Almuerzo
14:00 - 15:00  Reunion de equipo (calendario)
15:00 - 16:30  TASK-041: Actualizar documentacion API
16:30 - 16:40  Descanso
16:40 - 17:30  Buffer: tareas pendientes / imprevistos
17:30 - 18:00  Cierre del dia: revisar progreso

Tiempo de trabajo efectivo: 7h
Tareas programadas: 4
Eventos fijos: 1

Plan guardado en: .claude/pa/briefings/briefing-[fecha].md
```

## Ejemplos

```bash
# Plan del dia estandar
/plan-day

# Plan con enfoque en desarrollo
/plan-day --focus desarrollo

# Plan con enfoque en reuniones
/plan-day --focus reuniones
```

## Notas

- El plan se guarda en el briefing del dia para referencia posterior
- Si no hay tareas, el plan mostrara solo eventos de calendario y tiempo libre estructurado
- El `--focus` ayuda al agente a priorizar tareas relacionadas con esa area
- Usa `/brief` si solo quieres un resumen sin planificacion interactiva
