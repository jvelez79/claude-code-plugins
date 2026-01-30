---
description: Inicia el workflow de desarrollo de un nuevo feature a través de agentes especializados
argument-hint: "[idea] o [--from agente] [--auto] [--skip-review] [--skip-e2e] [--linear]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---

# Feature Development Workflow

Orquesta el desarrollo de un nuevo feature:

```
Design Phase (Idea Refiner) -> Spec Writer -> Task Planner -> Implementer -> E2E Tester -> Reviewer
```

**Design Phase incluye:**
- Refinamiento iterativo (3+ rondas)
- Exploración paralela del codebase (design-explorer agents)
- Mindmap visual con Pencil MCP
- Prototipos opcionales con Pencil MCP

## Argumentos recibidos
$ARGUMENTS

## Instrucciones

### 1. Parsear argumentos

Detecta estos flags en los argumentos:
- `--from <agente>`: Empezar desde un agente (idea-refiner, spec-writer, task-planner, implementer, e2e-tester, reviewer)
- `--auto`: Ejecutar sin confirmaciones entre agentes
- `--skip-review`: Omitir el Reviewer
- `--skip-e2e`: Omitir el E2E Tester (útil si Chrome no está disponible)
- `--linear`: Crear tareas en Linear después del Task Planner

El resto del texto es la descripción de la idea.

### 2. Crear directorio del feature

Genera un slug desde la descripción (lowercase, guiones, sin caracteres especiales).

```
.claude/features/<feature-slug>/
```

### 3. Ejecutar agentes en secuencia

Empezar desde Idea Refiner (o desde `--from` si se especificó).

Para cada agente:

1. **Invocar el agente** usando Task con el subagent_type correspondiente:
   - `idea-refiner`
   - `spec-writer`
   - `task-planner`
   - `implementer`
   - `e2e-tester`
   - `reviewer`

2. **Guardar output** en el archivo correspondiente:
   - Idea Refiner (Design Phase) -> genera múltiples archivos:
     - `.claude/features/<feature-slug>/exploration.md` (hallazgos del codebase)
     - `.claude/features/<feature-slug>/mindmap.pen` (mapa conceptual visual)
     - `.claude/features/<feature-slug>/prototypes/*.pen` (prototipos UI, si se aceptan)
     - `.claude/features/<feature-slug>/concept.md` (requisitos estructurados)
   - Spec Writer -> `.claude/features/<feature-slug>/spec.md`
   - Task Planner -> `.claude/features/<feature-slug>/tasks.md`
   - Reviewer -> `.claude/features/<feature-slug>/review.md`

3. **Si NO hay `--auto`**, preguntar usando AskUserQuestion:
   ```
   [Agente] completado -> <archivo>
   ¿Continuar a [siguiente agente]?
   ```
   Opciones:
   - `Continuar`: Pasar al siguiente agente
   - `Pausar`: Detener workflow (indicar cómo retomar con --from)
   - `Editar`: Permitir editar antes de continuar

4. **Si `--linear`** y agente es Task Planner: Crear tareas en Linear

5. **Si `--skip-review`**: Omitir Reviewer

6. **Si `--skip-e2e`**: Omitir E2E Tester

### 4. Contexto para cada agente

Pasar a cada agente:
- Output de agentes anteriores (leer de los .md generados)
- Acceso al codebase del proyecto

### 5. Loop de corrección: Implementer <-> E2E Tester

El E2E Tester verifica el feature usando el browser en vivo (Chrome).

**Flujo del loop:**

```
Implementer completa código
        |
   E2E Tester prueba
        |
   ¿Todo pasa? -------> SÍ -> Continuar a Reviewer
        |
       NO
        |
   Reportar errores al Implementer
        |
   Implementer corrige
        |
   (volver a E2E Tester)
```

**Comportamiento:**

1. Después del Implementer, invocar E2E Tester
2. E2E Tester prueba en el browser y reporta resultados
3. **Si hay errores:**
   - Pasar el reporte de errores al Implementer
   - Implementer corrige los problemas
   - Volver a invocar E2E Tester
   - Repetir hasta que todo pase (máximo 3 iteraciones)
4. **Si todo pasa:** Continuar al Reviewer

**Máximo de iteraciones:** 3
- Si después de 3 correcciones aún hay errores, preguntar al usuario cómo proceder

### 6. Integración con Pencil MCP (Design Phase)

La Design Phase (Idea Refiner) usa Pencil MCP para crear artefactos visuales:
- **mindmap.pen**: Mapa conceptual del proyecto/feature
- **prototypes/*.pen**: Prototipos de UI de las pantallas
- **flows/*.pen**: Diagramas de flujo de usuario (via /flow)

Pencil MCP debe estar disponible para generar estos artefactos.

### 7. Verificación de Chrome para E2E Tester

Antes de invocar el E2E Tester, verificar si Chrome está conectado.

**Si Chrome NO está disponible:**
```
E2E Testing requiere Chrome conectado.

Opciones:
1. Conectar Chrome y continuar (instrucciones abajo)
2. Saltar E2E testing (--skip-e2e)
3. Pausar workflow

Para conectar Chrome:
- Instala: https://chromewebstore.google.com/detail/claude-in-chrome
- Reinicia con: claude --chrome
- Retoma con: /feature --from e2e-tester
```

### 8. Manejo de errores

Si falla un agente:
1. Informar el error
2. Guardar estado parcial
3. Indicar: `Retomar con: /feature --from <agente>`

## Comandos de diseño standalone

Estos comandos se pueden usar independientemente del workflow:

```bash
# Crear prototipos desde el concept existente
/prototype --from-concept

# Crear prototipo de pantalla específica
/prototype --screen dashboard

# Crear diagrama de flujo
/flow checkout

# Crear todos los flujos del concept
/flow --from-concept
```

## Ejemplo de uso

```bash
# Nueva feature
/feature Agregar login con OAuth para Google y GitHub

# Retomar desde un punto específico
/feature --from implementer

# Ejecutar sin confirmaciones
/feature --auto Agregar logout button

# Saltar E2E testing
/feature --skip-e2e Agregar dark mode toggle
```
