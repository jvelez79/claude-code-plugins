---
description: "Crear diagramas de flujo de usuario usando Pencil MCP"
argument-hint: "<flow-name> [--from-concept]"
allowed-tools:
  - Read
  - Glob
  - Write
  - mcp__pencil__open_document
  - mcp__pencil__batch_design
  - mcp__pencil__batch_get
  - mcp__pencil__get_screenshot
  - mcp__pencil__get_guidelines
  - mcp__pencil__get_editor_state
---

# /flow - Crear Diagramas de Flujo

Crea diagramas de flujo de usuario usando Pencil MCP. Los diagramas se guardan como archivos `.pen`.

## Argumentos

- `<flow-name>`: Nombre del flujo a diagramar (ej: "checkout", "onboarding")
- `--from-concept`: Leer concept.md y extraer flujos descritos

## Proceso

### 1. Identificar el Flujo

**Si `--from-concept`:**
1. Lee `.claude/features/<slug>/concept.md`
2. Extrae flujos de `flows_or_user_stories`
3. Diagrama cada flujo identificado

**Si `<flow-name>`:**
1. Diagrama el flujo especificado
2. Puede pedir descripción si no existe concept.md

### 2. Crear el Diagrama

```javascript
// 1. Abrir documento
mcp__pencil__open_document({
  filePathOrTemplate: ".claude/features/<slug>/flows/<flow-name>.pen"
})

// 2. Obtener guidelines
mcp__pencil__get_guidelines({topic: "design-system"})

// 3. Crear nodos del flujo con batch_design
```

### 3. Tipos de Nodos

| Tipo | Forma | Color | Uso |
|------|-------|-------|-----|
| Inicio | Círculo | Verde (#22c55e) | Punto de entrada |
| Fin | Círculo | Verde (#22c55e) | Punto de salida |
| Acción | Rectángulo | Azul (#3b82f6) | Paso del usuario |
| Decisión | Rombo | Amarillo (#eab308) | Bifurcación |
| Error | Rectángulo | Rojo (#ef4444) | Estado de error |
| Sistema | Rectángulo | Gris (#6b7280) | Acción del sistema |

### 4. Ejemplo de Diseño

```javascript
// Flujo: Login
root=I(document, {type: "frame", name: "Login Flow", width: 1000, height: 600, fill: "#f8fafc"})

// Título
title=I(root, {type: "text", content: "Flujo: Login de Usuario", fontSize: 24, textColor: "#1e293b", x: 20, y: 20})

// Nodo inicio
start=I(root, {type: "ellipse", width: 80, height: 80, fill: "#22c55e", x: 460, y: 80})
startLabel=I(root, {type: "text", content: "Inicio", fontSize: 12, textColor: "#ffffff", x: 485, y: 115})

// Acción: Ingresar credenciales
action1=I(root, {type: "frame", width: 200, height: 60, fill: "#3b82f6", cornerRadius: [8,8,8,8], x: 400, y: 180})
action1Text=I(action1, {type: "text", content: "Ingresar email y password", fontSize: 14, textColor: "#ffffff"})

// Decisión: Credenciales válidas?
decision=I(root, {type: "frame", width: 160, height: 80, fill: "#eab308", rotation: 45, x: 420, y: 280})
decisionText=I(root, {type: "text", content: "¿Válidas?", fontSize: 14, textColor: "#1e293b", x: 470, y: 310})

// Rama: Error
error=I(root, {type: "frame", width: 180, height: 60, fill: "#ef4444", cornerRadius: [8,8,8,8], x: 600, y: 350})
errorText=I(error, {type: "text", content: "Mostrar error", fontSize: 14, textColor: "#ffffff"})

// Rama: Éxito
success=I(root, {type: "frame", width: 180, height: 60, fill: "#3b82f6", cornerRadius: [8,8,8,8], x: 200, y: 350})
successText=I(success, {type: "text", content: "Ir al dashboard", fontSize: 14, textColor: "#ffffff"})

// Fin
end=I(root, {type: "ellipse", width: 80, height: 80, fill: "#22c55e", x: 250, y: 450})
endLabel=I(root, {type: "text", content: "Fin", fontSize: 12, textColor: "#ffffff", x: 280, y: 485})

// Conectores (líneas entre nodos)
// Usar type: "line" para conexiones
```

### 5. Estructura de Archivos

```
.claude/features/<feature-slug>/
├── concept.md
├── mindmap.pen
├── flows/
│   ├── login.pen
│   ├── checkout.pen
│   └── onboarding.pen
└── prototypes/
    └── ...
```

## Ejemplos de Uso

```bash
# Crear diagrama de flujo específico
/flow checkout

# Crear todos los flujos del concept
/flow --from-concept

# Flujo con nombre descriptivo
/flow user-onboarding
```

## Guidelines

1. **Dirección**: Los flujos van de arriba hacia abajo o izquierda a derecha
2. **Espaciado**: Mantener distancia uniforme entre nodos (40-60px)
3. **Conectores**: Las líneas deben ser claras y no cruzarse innecesariamente
4. **Labels**: Cada decisión debe tener etiquetas "Sí/No" o el valor de la condición
5. **Simplicidad**: Un diagrama por flujo principal, sub-flujos aparte

## Output

Cada diagrama genera:
- Archivo `.pen` con el diseño del flujo
- Screenshot para revisión rápida
- Actualización del concept.md con referencia al flujo
