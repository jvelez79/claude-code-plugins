---
description: Guarda una memoria o nota en tu base de conocimiento personal
argument-hint: "<contenido> [--topic <tema>] [--tags tag1,tag2]"
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---

# Guardar Memoria

Guarda una nota, idea o informacion importante en tu base de conocimiento personal.

## Argumentos recibidos

$ARGUMENTS

## Instrucciones

### 1. Parsear argumentos

Extrae de los argumentos:
- `contenido`: Todo el texto que no sea un flag (puede estar entre comillas o no)
- `--topic <tema>`: Categoria o tema de la memoria (opcional)
- `--tags tag1,tag2`: Etiquetas separadas por coma (opcional)

### 2. Verificar estado

Comprueba que existe `.claude/pa/memories/`. Si no existe, informa al usuario que debe ejecutar `/pa` primero para inicializar el estado.

### 3. Determinar el topic

Si `--topic` no fue proporcionado:

Usa AskUserQuestion para categorizar:

```json
{
  "questions": [
    {
      "question": "En que categoria guardar esta memoria?",
      "header": "Categorizar memoria",
      "options": [
        {"label": "trabajo", "description": "Proyectos, clientes, reuniones, decisiones laborales"},
        {"label": "personal", "description": "Metas, reflexiones, vida personal"},
        {"label": "aprendizaje", "description": "Conceptos, recursos, notas de estudio"},
        {"label": "ideas", "description": "Ideas de proyectos, mejoras, innovaciones"},
        {"label": "contactos", "description": "Informacion sobre personas"},
        {"label": "recursos", "description": "Links, herramientas, referencias utiles"},
        {"label": "otro", "description": "Categoria personalizada"}
      ],
      "multiSelect": false
    }
  ]
}
```

Si seleccionan "otro", preguntar el nombre de la categoria con una segunda pregunta de texto libre.

Si hay contexto claro en el contenido, se puede auto-categorizar sin preguntar.

### 4. Invocar agente

Usa Task para invocar el agente `memory-manager`:

```
Guarda la siguiente memoria en la base de conocimiento personal:

**Contenido:** [contenido del usuario]
**Topic:** [topic determinado]
**Tags:** [tags o lista vacia]

Lee el archivo .claude/pa/memories/[topic-slug].md si existe para agregar la entrada.
Si no existe, crealo con el template de memorias.
Actualiza el indice .claude/pa/memories/_index.md.

Confirma el guardado con: "Guardado en memories/[topic-slug].md (entrada #N)"
```

### 5. Confirmar al usuario

Muestra confirmacion clara:
```
Memoria guardada correctamente.

- Archivo: .claude/pa/memories/<topic-slug>.md
- Entrada: #N
- Topic: <topic>
- Tags: <tags o "ninguno">
- Fecha: <timestamp>
```

## Formato del archivo de memorias

Cada topic tiene su propio archivo `.claude/pa/memories/<topic-slug>.md`:

```markdown
---
topic: "<topic>"
total_entries: N
last_updated: "<timestamp>"
tags: [tag1, tag2]
---

# Memorias: <Topic>

## <Fecha ISO>

<Contenido de la memoria>

**Tags:** tag1, tag2

---

## <Fecha ISO anterior>

<Contenido anterior>

---
```

## Ejemplos

```bash
# Con topic explicito
/remember "La API de pagos usa autenticacion Bearer" --topic trabajo --tags api,pagos

# Sin topic (pregunta interactivamente)
/remember "Leer el libro Atomic Habits este mes"

# Con tags multiples
/remember "Usar prettier con config estandar en todos los proyectos" --topic trabajo --tags herramientas,codigo

# Nota personal
/remember "Hoy aprendi que el descanso es parte de la productividad" --topic personal
```

## Notas

- El contenido se guarda tal cual, sin modificacion
- Los topics se normalizan a slug (minusculas, guiones)
- Se puede buscar despues con `/recall`
