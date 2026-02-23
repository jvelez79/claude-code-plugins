---
description: Busca en tu base de conocimiento personal
argument-hint: "<consulta> [--topic <tema>] [--limit N]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Task
---

# Buscar en Memorias

Busca y recupera informacion guardada en tu base de conocimiento personal.

## Argumentos recibidos

$ARGUMENTS

## Instrucciones

### 1. Parsear argumentos

Extrae de los argumentos:
- `query`: Todo el texto que no sea un flag (la consulta de busqueda)
- `--topic <tema>`: Filtrar busqueda a un topic especifico (opcional)
- `--limit N`: Numero maximo de resultados (default: 10)
- `--topics`: Flag especial - lista los topics disponibles sin buscar

### 2. Verificar estado

Comprueba que existe `.claude/pa/memories/`. Si no existe o esta vacio, informa al usuario:
```
No hay memorias guardadas todavia. Usa /remember para guardar tu primera nota.
```

### 3. Modo --topics: listar temas disponibles

Si el flag `--topics` esta presente, lee `.claude/pa/memories/_index.md` y muestra:

```
Temas disponibles en tu base de conocimiento:

| Tema       | Entradas | Ultima actualizacion |
|------------|----------|----------------------|
| trabajo    | 12       | 2024-03-15          |
| personal   | 5        | 2024-03-10          |
| aprendizaje| 8        | 2024-03-12          |
| ideas      | 3        | 2024-03-08          |

Total: 28 memorias en 4 temas.
Usa /recall <consulta> --topic <tema> para filtrar por tema.
```

### 4. Busqueda normal

Si hay una query, invoca el agente `memory-manager` en modo busqueda via Task:

```
Busca en la base de conocimiento personal lo siguiente:

**Query:** [consulta del usuario]
**Topic filter:** [topic o "todos"]
**Limit:** [N]

Proceso:
1. Si hay topic filter, leer solo .claude/pa/memories/[topic-slug].md
2. Si no hay filter, usar Grep para buscar la query en todos los archivos de .claude/pa/memories/
3. Ordenar resultados por relevancia (coincidencias exactas primero, luego parciales)
4. Devolver los primeros N resultados con: tema, fecha de entrada, snippet del contenido

Formato de cada resultado:
- Topic: [tema]
- Fecha: [fecha]
- Extracto: [primeras 150 chars del contenido relevante]
```

### 5. Presentar resultados

Si hay resultados:
```
Encontradas X memorias para "<query>":

1. [Tema: trabajo] - 2024-03-15
   "La API de pagos usa autenticacion Bearer..."
   Tags: api, pagos

2. [Tema: aprendizaje] - 2024-03-10
   "Los tokens JWT expiran segun la configuracion..."
   Tags: seguridad

...

Busqueda en: [todos los temas | tema: <topic>]
Para ver el archivo completo: .claude/pa/memories/<topic-slug>.md
```

Si no hay resultados:
```
No se encontraron memorias para "<query>".

Sugerencias:
- Prueba con terminos mas generales
- Usa /recall --topics para ver los temas disponibles
- Guarda nuevas memorias con /remember
```

## Ejemplos

```bash
# Busqueda simple
/recall "API pagos"

# Busqueda en un tema especifico
/recall "reuniones" --topic trabajo

# Limitar resultados
/recall "javascript" --limit 5

# Ver temas disponibles
/recall --topics

# Busqueda amplia
/recall "productividad" --limit 20
```

## Notas

- La busqueda es case-insensitive
- Se busca en el contenido, tags y titulo de cada entrada
- Con `--topics` se ignoran los demas argumentos
