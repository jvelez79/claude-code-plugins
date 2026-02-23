---
description: Investiga un tema y guarda los hallazgos
argument-hint: "<tema> [--deep] [--save-to-memory]"
allowed-tools:
  - Read
  - Write
  - Glob
  - Task
  - AskUserQuestion
  - WebSearch
  - WebFetch
---

# Investigar un Tema

Investiga un tema usando busqueda web y guarda los hallazgos organizados en tu base de conocimiento.

## Argumentos recibidos

$ARGUMENTS

## Instrucciones

### 1. Parsear argumentos

Extrae de los argumentos:
- `tema`: Todo el texto que no sea un flag (el tema a investigar)
- `--deep`: Investigacion mas profunda: mas fuentes, mayor detalle (opcional)
- `--save-to-memory`: Guarda el resumen ejecutivo en memorias (opcional)

Si no hay tema, usa AskUserQuestion para pedirlo.

### 2. Verificar estado

Comprueba que existe `.claude/pa/research/`. Si no existe, informa al usuario que debe ejecutar `/pa` para inicializar el estado.

### 3. Clarificar el alcance (opcional)

Si el tema es ambiguo o muy amplio, usa AskUserQuestion:

```json
{
  "questions": [
    {
      "question": "Que aspecto del tema te interesa mas?",
      "header": "Enfoque de investigacion",
      "options": [
        {"label": "Conceptos basicos", "description": "Entender los fundamentos"},
        {"label": "Mejores practicas", "description": "Como aplicarlo correctamente"},
        {"label": "Herramientas y recursos", "description": "Software, libros, cursos"},
        {"label": "Casos de uso", "description": "Ejemplos reales y aplicaciones"},
        {"label": "Comparativa", "description": "Comparar opciones o enfoques"},
        {"label": "Todo lo anterior", "description": "Investigacion completa"}
      ],
      "multiSelect": false
    }
  ]
}
```

### 4. Invocar agente de investigacion

Usa Task para invocar el agente `research-agent`:

```
Investiga el siguiente tema y genera un reporte estructurado:

**Tema:** [tema del usuario]
**Modo:** [estandar | profundo si --deep]
**Enfoque:** [aspecto seleccionado o "completo"]

Instrucciones:
1. Usa WebSearch para encontrar 3-5 fuentes relevantes (8-10 si --deep)
2. Usa WebFetch para leer el contenido de las fuentes mas relevantes
3. Sintetiza la informacion en un reporte estructurado
4. Incluye fuentes con URLs para todas las afirmaciones importantes
5. Genera un resumen ejecutivo de 3-5 puntos clave

Guarda el reporte en .claude/pa/research/<tema-slug>-<timestamp>.md
```

### 5. Guardar en memorias (si --save-to-memory)

Si el flag `--save-to-memory` esta presente, despues de la investigacion:

Lee el resumen ejecutivo del reporte generado y guardalo en memorias:
- Archivo: `.claude/pa/memories/aprendizaje.md`
- Topic: `aprendizaje`
- Tags: `research, <tema-slug>`
- Contenido: Puntos clave del resumen ejecutivo + enlace al reporte completo

### 6. Presentar resumen

Muestra al usuario:

```
Investigacion completada: "<tema>"

Resumen Ejecutivo:
1. [Punto clave 1]
2. [Punto clave 2]
3. [Punto clave 3]
4. [Punto clave 4]
5. [Punto clave 5]

Fuentes principales:
- [Titulo fuente 1] → [URL]
- [Titulo fuente 2] → [URL]
- [Titulo fuente 3] → [URL]

Reporte completo: .claude/pa/research/<tema-slug>-<timestamp>.md
[Guardado en memorias: si] (si --save-to-memory)
```

## Formato del reporte de investigacion

```markdown
---
type: research
topic: "<tema>"
date: "<timestamp>"
depth: estandar|profundo
sources_count: N
saved_to_memory: true|false
---

# Investigacion: <Tema>

## Resumen Ejecutivo

1. [Punto clave 1]
2. [Punto clave 2]
3. [Punto clave 3]
4. [Punto clave 4]
5. [Punto clave 5]

## Contexto y Definicion

[Explicacion del tema, definiciones clave, por que es relevante]

## Conceptos Clave

### [Concepto 1]
[Descripcion y explicacion]

### [Concepto 2]
[Descripcion y explicacion]

## Mejores Practicas y Recomendaciones

1. [Practica 1] - [Por que es importante]
2. [Practica 2] - [Por que es importante]

## Herramientas y Recursos

| Recurso     | Tipo       | Descripcion              | URL          |
|-------------|------------|--------------------------|--------------|
| [Nombre]    | Libro/Tool | [Descripcion breve]      | [url]        |

## Casos de Uso y Ejemplos

[Ejemplos reales o casos practicos]

## Limitaciones y Consideraciones

[Advertencias, trade-offs, cuando NO usar]

## Proximos Pasos Sugeridos

1. [Accion concreta 1]
2. [Accion concreta 2]
3. [Accion concreta 3]

## Fuentes

| Titulo        | URL       | Tipo    | Relevancia |
|---------------|-----------|---------|------------|
| [titulo]      | [url]     | Articulo| Alta       |

---
*Generado por Personal Assistant*
```

## Ejemplos

```bash
# Investigacion estandar
/research "mejores practicas de code review"

# Investigacion profunda
/research "arquitectura de microservicios" --deep

# Guardar hallazgos en memorias
/research "tecnicas de negociacion" --save-to-memory

# Investigacion profunda y guardar
/research "machine learning para principiantes" --deep --save-to-memory
```

## Notas

- La investigacion estandar usa 3-5 fuentes, la profunda usa 8-10
- El reporte se guarda aunque no uses `--save-to-memory`
- `--save-to-memory` solo guarda el resumen ejecutivo, no el reporte completo
- Los reportes de investigacion se guardan en `.claude/pa/research/`
