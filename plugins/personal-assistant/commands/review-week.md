---
description: Review semanal de logros, patrones y planificacion de la proxima semana
argument-hint: ""
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Task
  - AskUserQuestion
  - Bash
---

# Review Semanal

Revisa los logros de la semana, identifica patrones y planifica la siguiente semana con intension.

## Argumentos recibidos

$ARGUMENTS

## Instrucciones

### 1. Verificar estado

Comprueba que existen `.claude/pa/tasks.md` y `.claude/pa/config.local.md`. Si no existen, informa al usuario que debe ejecutar `/pa` para inicializar el estado.

### 2. Obtener datos de la semana

Recopila la informacion de la semana actual:

Ejecuta via Bash para obtener la semana actual:
```bash
date +%Y-W%V
```

Lee los siguientes archivos:
- `.claude/pa/tasks.md` para estado de tareas
- `.claude/pa/briefings/` para buscar briefings de esta semana
- `.claude/pa/memories/` para memorias guardadas esta semana

Si `google_calendar.enabled: true` en config, obtener eventos de la semana:
```bash
command -v gcalcli &>/dev/null && gcalcli --nocolor agenda "monday" "next monday" --tsv 2>/dev/null || echo "no-disponible"
```

### 3. Generar review inicial

Usa Task para invocar el agente `briefing-agent` en modo review semanal:

```
Genera el review semanal del usuario.

**Semana:** [YYYY-WNN]
**Rango de fechas:** [lunes] - [domingo]

Archivos a analizar:
- .claude/pa/tasks.md (tareas completadas, pendientes, en progreso)
- .claude/pa/briefings/ (briefings de la semana para contexto)
- .claude/pa/memories/_index.md (memorias guardadas esta semana)

**Datos de calendario:** [eventos de la semana o "no disponible"]

Genera:
1. Lista de tareas COMPLETADAS esta semana (con fecha)
2. Lista de tareas EN PROGRESO que continuan
3. Lista de tareas NUEVAS que quedaron sin iniciar
4. Lista de memorias guardadas esta semana
5. Patron de trabajo observado (si hay datos)
6. Tareas pendientes de alta prioridad para la proxima semana
```

### 4. Presentar overview de la semana

Muestra el resumen generado al usuario antes de pedir reflexion.

### 5. Reflexion del usuario

Usa AskUserQuestion para capturar la perspectiva del usuario:

```json
{
  "questions": [
    {
      "question": "Cual fue tu mayor logro esta semana?",
      "header": "Reflexion semanal (1/3)"
    },
    {
      "question": "Que te bloqueo o dificultades encontraste?",
      "header": "Reflexion semanal (2/3)"
    },
    {
      "question": "Cual es tu enfoque principal para la proxima semana?",
      "header": "Reflexion semanal (3/3)"
    }
  ]
}
```

### 6. Generar review completo con reflexiones

Usa Task para invocar nuevamente el agente `briefing-agent` para integrar las reflexiones del usuario en el review final:

```
Genera el review semanal completo integrando la reflexion del usuario.

**Datos de la semana:** [resumen del paso 3]
**Reflexiones del usuario:**
- Mayor logro: [respuesta 1]
- Blockers: [respuesta 2]
- Enfoque proxima semana: [respuesta 3]

Genera el documento de review semanal completo con:
1. Resumen ejecutivo de la semana
2. Logros (combinando datos + reflexion del usuario)
3. Tareas completadas con detalle
4. Tareas en progreso
5. Aprendizajes y memorias de la semana
6. Blockers identificados y posibles soluciones
7. Plan de enfoque para la proxima semana
8. Top 3 tareas prioritarias para manana

Guarda el review en .claude/pa/briefings/briefing-semanal-[semana].md
```

### 7. Mostrar review final y ubicacion

Presenta el review completo al usuario y muestra donde quedo guardado:

```
Review semanal completado. Semana [YYYY-WNN]

[Contenido del review]

Archivo guardado: .claude/pa/briefings/briefing-semanal-[semana].md
```

## Formato del review semanal guardado

```markdown
---
type: review-semanal
week: "YYYY-WNN"
date_range: "YYYY-MM-DD / YYYY-MM-DD"
generated_at: "HH:MM"
logro_principal: "<texto>"
enfoque_proxima_semana: "<texto>"
---

# Review Semanal - Semana [WNN] / [Fechas]

## Resumen Ejecutivo

[Parrafo sintetizando la semana: que se logro, que quedo pendiente, como fue la semana en general]

## Logros de la Semana

[Mayor logro segun el usuario]

### Tareas Completadas
- [x] TASK-042 Revisar propuesta de diseno (completada: 2024-03-20)
- [x] TASK-038 Responder emails del cliente (completada: 2024-03-19)

### Otras Victorias
[Logros no capturados como tareas formales]

## En Progreso

- [ ] TASK-041 Actualizar documentacion API (continua la proxima semana)
- [ ] TASK-045 Implementar modulo de pagos (continua)

## Aprendizajes y Notas

[Memorias guardadas esta semana relevantes]

## Blockers y Friccion

[Dificultades identificadas]

**Posibles soluciones:**
1. [Solucion 1]
2. [Solucion 2]

## Plan para la Proxima Semana

**Enfoque:** [enfoque principal del usuario]

### Top 3 Prioridades
1. [Tarea o meta 1] - [Por que es prioritaria]
2. [Tarea o meta 2]
3. [Tarea o meta 3]

### Tareas Pendientes de Alta Prioridad
[Lista de tareas pendientes importantes]

## Metricas de la Semana

| Metrica               | Valor |
|-----------------------|-------|
| Tareas completadas    | X     |
| Tareas nuevas creadas | X     |
| Memorias guardadas    | X     |
| Investigaciones       | X     |

---
*Generado por Personal Assistant*
```

## Notas

- El review semanal es mas util cuando se hace el viernes por la tarde o el domingo
- Las reflexiones del usuario enriquecen el review con contexto que los datos no capturan
- Los reviews anteriores se pueden consultar con `/recall review semanal`
- Usa `/brief --weekly` si solo quieres el briefing semanal sin la reflexion interactiva
