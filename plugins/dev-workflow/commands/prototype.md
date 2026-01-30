---
description: "Crear prototipos visuales de UI usando Pencil MCP"
argument-hint: "[--screen <name>] [--from-concept]"
allowed-tools:
  - Read
  - Glob
  - Write
  - mcp__pencil__open_document
  - mcp__pencil__batch_design
  - mcp__pencil__batch_get
  - mcp__pencil__get_screenshot
  - mcp__pencil__get_guidelines
  - mcp__pencil__get_style_guide
  - mcp__pencil__get_style_guide_tags
  - mcp__pencil__get_editor_state
---

# /prototype - Crear Prototipos Visuales

Crea prototipos de UI usando Pencil MCP. Los prototipos se guardan como archivos `.pen`.

## Argumentos

- `--screen <name>`: Crear prototipo de una pantalla específica
- `--from-concept`: Leer concept.md y crear prototipos de todas las pantallas identificadas
- Sin argumentos: Modo interactivo, pregunta qué prototipar

## Proceso

### 1. Determinar Pantallas a Prototipar

**Si `--from-concept`:**
1. Busca el feature activo: `ls .claude/features/`
2. Lee el concept.md más reciente
3. Identifica pantallas/flujos descritos en `flows_or_user_stories` y `mvp_or_feature_scope`
4. Crea un prototipo por cada pantalla identificada

**Si `--screen <name>`:**
1. Crea un solo prototipo para la pantalla especificada

**Sin argumentos:**
1. Lista features disponibles en `.claude/features/`
2. Pregunta qué pantallas prototipar

### 2. Preparar Estilo

```javascript
// Obtener tags disponibles
mcp__pencil__get_style_guide_tags()

// Seleccionar style guide apropiado
// Para webapp: ["webapp", "modern", "dashboard", "professional"]
// Para mobile: ["mobile", "ios", "clean", "minimal"]
// Para landing: ["website", "landing-page", "marketing"]
mcp__pencil__get_style_guide({
  tags: [/* tags según tipo de proyecto */]
})
```

### 3. Crear Cada Prototipo

Para cada pantalla:

```javascript
// 1. Crear/abrir documento
mcp__pencil__open_document({
  filePathOrTemplate: ".claude/features/<slug>/prototypes/<screen-name>.pen"
})

// 2. Obtener guidelines
mcp__pencil__get_guidelines({topic: "design-system"})

// 3. Diseñar la pantalla usando batch_design
// Seguir las guías del style guide
// Incluir:
// - Header/navegación
// - Contenido principal
// - Elementos interactivos (botones, formularios)
// - Footer si aplica

// 4. Screenshot para validación
mcp__pencil__get_screenshot({nodeId: "root"})
```

### 4. Estructura de Archivos

```
.claude/features/<feature-slug>/
├── concept.md
├── mindmap.pen
└── prototypes/
    ├── dashboard.pen
    ├── login.pen
    ├── settings.pen
    └── ...
```

## Ejemplos de Uso

```bash
# Prototipar todas las pantallas del concept actual
/prototype --from-concept

# Prototipar una pantalla específica
/prototype --screen dashboard

# Modo interactivo
/prototype
```

## Guidelines de Diseño

Al crear prototipos, sigue estas reglas:

1. **Consistencia**: Usa el mismo style guide para todas las pantallas
2. **Jerarquía visual**: Establece clara jerarquía con tamaños y colores
3. **Espaciado**: Usa padding y gap consistentes
4. **Tipografía**: Máximo 2 familias de fuentes
5. **Colores**: Usa la paleta del style guide

## Output

Cada prototipo genera:
- Archivo `.pen` con el diseño
- Screenshot embebido para revisión rápida
- Actualización del concept.md con referencia al prototipo
