#!/bin/bash
# Personal Assistant - Inicializacion de directorio de estado
# Crea la estructura .claude/pa/ si no existe
# Uso: bash init-state.sh (desde la raiz del proyecto)

set -e

PA_DIR=".claude/pa"

# Crear directorios
mkdir -p "$PA_DIR/memories"
mkdir -p "$PA_DIR/briefings"
mkdir -p "$PA_DIR/research"

# Crear config si no existe
if [ ! -f "$PA_DIR/config.local.md" ]; then
  cat > "$PA_DIR/config.local.md" << 'HEREDOC'
---
name: ""
timezone: "America/Mexico_City"
locale: "es"
daily_routine:
  morning_start: "09:00"
  lunch: "13:00"
  end_of_day: "18:00"
google_calendar:
  enabled: false
  calendar_id: "primary"
  cli_tool: "gcalcli"
task_defaults:
  default_priority: "medium"
briefing_preferences:
  include_calendar: true
  include_tasks: true
  include_recent_memories: true
  include_research: false
---

# Configuracion del Asistente Personal

Edita este archivo para personalizar las preferencias de tu asistente personal.

## Notas
- Google Calendar requiere `gcalcli` instalado y autenticado por separado.
- Instalar: `pip install gcalcli && gcalcli init`
HEREDOC
fi

# Crear archivo de tareas si no existe
if [ ! -f "$PA_DIR/tasks.md" ]; then
  cat > "$PA_DIR/tasks.md" << 'HEREDOC'
---
total_tasks: 0
pending: 0
in_progress: 0
completed: 0
---

# Lista de Tareas

## Pendientes

## En Progreso

## Completadas

## Archivadas
HEREDOC
fi

# Crear indice de memorias si no existe
if [ ! -f "$PA_DIR/memories/_index.md" ]; then
  cat > "$PA_DIR/memories/_index.md" << 'HEREDOC'
---
total_memories: 0
topics: []
---

# Indice de Memorias

| Tema | Archivo | Entradas | Ultima Actualizacion |
|------|---------|----------|----------------------|
HEREDOC
fi
