---
description: Genera un briefing diario o semanal
argument-hint: "[--weekly] [--no-calendar]"
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Task
  - Bash
---

# Generar Briefing

Genera un resumen ejecutivo del dia o de la semana con tareas, eventos y prioridades.

## Argumentos recibidos

$ARGUMENTS

## Instrucciones

### 1. Parsear argumentos

Extrae de los argumentos:
- `--weekly`: Activa modo review semanal (default: briefing diario)
- `--no-calendar`: Omite la seccion de calendario aunque este configurado

### 2. Verificar estado

Comprueba que existen `.claude/pa/tasks.md` y `.claude/pa/config.local.md`. Si no existen, informa al usuario que debe ejecutar `/pa` para inicializar el estado.

### 3. Leer configuracion

Lee `.claude/pa/config.local.md` para obtener:
- Nombre del usuario (campo `name`)
- Timezone configurado
- Preferencias de briefing (`briefing_preferences`)
- Configuracion de Google Calendar (`google_calendar.enabled`)

### 4. Verificar disponibilidad de calendario

Si `google_calendar.enabled: true` y NO se paso `--no-calendar`:

Ejecuta via Bash:
```bash
command -v gcalcli &>/dev/null && echo "disponible" || echo "no-disponible"
```

Si gcalcli esta disponible, obtener eventos del dia (o semana si `--weekly`):
```bash
# Briefing diario
gcalcli --nocolor agenda "today" "tomorrow" --tsv 2>/dev/null || echo "error-gcalcli"

# Briefing semanal
gcalcli --nocolor agenda "monday" "next monday" --tsv 2>/dev/null || echo "error-gcalcli"
```

Si gcalcli no esta disponible o da error, continuar sin datos de calendario y notificar al usuario.

### 5. Invocar agente

Usa Task para invocar el agente `briefing-agent`:

```
Genera un [briefing diario | review semanal] para el usuario.

**Modo:** [diario | semanal]
**Incluir calendario:** [true | false]
**Datos de calendario:** [output de gcalcli o "no disponible"]
**Nombre del usuario:** [nombre o ""]

Archivos a leer:
- .claude/pa/tasks.md (tareas)
- .claude/pa/memories/_index.md (ultimas memorias)
- .claude/pa/config.local.md (configuracion y rutina)
- .claude/pa/briefings/ (briefings anteriores para contexto)

Genera el briefing con las secciones relevantes segun el modo.
Guarda el resultado en .claude/pa/briefings/[tipo]-[fecha].md
```

### 6. Mostrar resumen y ubicacion

Presenta el briefing generado al usuario y muestra la ubicacion del archivo guardado:

```
Briefing [diario | semanal] generado.
Archivo: .claude/pa/briefings/<tipo>-<fecha>.md
```

## Formato del briefing diario

```markdown
---
type: briefing-diario
date: "YYYY-MM-DD"
generated_at: "HH:MM"
---

# Briefing del Dia - [Dia de la semana], [Fecha]

## Buenos dias, [Nombre]!

[Frase motivacional o nota sobre el dia]

## Calendario de Hoy

| Hora  | Evento              | Duracion |
|-------|---------------------|----------|
| 10:00 | Reunion de equipo   | 1h       |
| 15:00 | Demo con cliente    | 30min    |

*[Sin eventos programados para hoy]* (si no hay eventos)

## Tareas Prioritarias

### Alta Prioridad
- [ ] TASK-042 Revisar propuesta de diseno (vence hoy)
- [ ] TASK-038 Responder emails del cliente

### Media Prioridad
- [ ] TASK-041 Actualizar documentacion API

## Pendientes de Ayer
- [ ] TASK-039 Code review PR #45 (vencio ayer)

## Resumen del Estado

- Tareas totales pendientes: X
- Vencen hoy: X
- Vencidas: X
- En progreso: X

## Notas Recientes

[Ultimas 2-3 memorias guardadas relevantes]

---
*Generado por Personal Assistant*
```

## Formato del briefing semanal

```markdown
---
type: briefing-semanal
week: "YYYY-WNN"
date_range: "YYYY-MM-DD / YYYY-MM-DD"
generated_at: "HH:MM"
---

# Briefing Semanal - Semana del [Fecha inicio] al [Fecha fin]

## Resumen de la Semana

[Resumen ejecutivo del estado actual]

## Eventos de la Semana

| Dia        | Hora  | Evento            |
|------------|-------|-------------------|
| Lunes      | 10:00 | Reunion de equipo |
| Miercoles  | 15:00 | Demo con cliente  |

## Tareas por Estado

### Pendientes esta semana
[Lista de tareas que vencen esta semana]

### En Progreso
[Lista de tareas en curso]

### Completadas esta semana
[Lista de tareas completadas en los ultimos 7 dias]

## Prioridades de la Semana

1. [Tarea o proyecto mas importante]
2. [Segunda prioridad]
3. [Tercera prioridad]

## Memorias y Notas Recientes

[Ultimas memorias guardadas esta semana]

---
*Generado por Personal Assistant*
```

## Ejemplos

```bash
# Briefing del dia
/brief

# Review semanal
/brief --weekly

# Briefing sin calendario
/brief --no-calendar
```

## Notas

- El briefing diario se guarda como `briefing-YYYY-MM-DD.md`
- El briefing semanal se guarda como `briefing-semanal-YYYY-WNN.md`
- Si Google Calendar no esta configurado, la seccion de calendario se omite automaticamente
- Para configurar gcalcli: `pip install gcalcli && gcalcli init`
