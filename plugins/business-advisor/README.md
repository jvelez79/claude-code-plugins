# Business Advisor Plugin

Consultor de negocios integrado con tu codebase para Claude Code.

## Instalación

```bash
claude plugins:add /path/to/plugins/business-advisor
```

## Comandos

### `/biz validate <idea>`
Evalúa si una idea tiene potencial de mercado.

```bash
/biz validate "Agregar modo oscuro premium"
/biz validate "SaaS para gestión de inventario" --deep
/biz validate "API de pagos" --focus tech
```

**Flags:**
- `--deep`: Análisis más profundo con research de mercado
- `--focus market|tech|business`: Enfocarse en un área específica

**Output:** Score 1-10 + recomendación (proceed/pivot/abandon)

---

### `/biz prioritize`
Prioriza features basado en impacto de negocio.

```bash
/biz prioritize
/biz prioritize --framework rice
/biz prioritize --include-backlog
```

**Flags:**
- `--framework rice|ice`: Framework de priorización (default: rice)
- `--include-backlog`: Incluir features del backlog, no solo implementadas

**Output:** Lista priorizada + quick wins + strategic bets

---

### `/biz launch`
Define estrategia de lanzamiento.

```bash
/biz launch
/biz launch --timeline 4
/biz launch --budget high
```

**Flags:**
- `--timeline N`: Timeline en semanas
- `--budget low|medium|high`: Presupuesto disponible

**Output:** Plan de lanzamiento con timeline, audiencia, canales y KPIs

---

### `/biz research <topic>`
Investiga mercado, competencia y tendencias.

```bash
/biz research "productivity apps"
/biz research "AI tools" --competitors notion,obsidian
/biz research "fintech" --depth deep
```

**Flags:**
- `--competitors name1,name2`: Competidores específicos a analizar
- `--depth shallow|deep`: Profundidad del análisis

**Output:** Reporte de mercado con oportunidades y amenazas

---

### `/biz finance`
Análisis financiero y proyecciones.

```bash
/biz finance
/biz finance --scenarios
/biz finance --years 5
```

**Flags:**
- `--scenarios`: Incluir escenarios pesimista/base/optimista
- `--years 3|5`: Años de proyección

**Output:** Modelo financiero con métricas (ROI, CAC, LTV, break-even)

---

### `/biz pricing`
Estrategia de precios y monetización.

```bash
/biz pricing
/biz pricing --model saas
/biz pricing --model freemium
```

**Flags:**
- `--model saas|freemium|onetime`: Modelo de monetización a explorar

**Output:** Estrategia de pricing con tiers y justificación

---

### `/biz personas`
Genera perfiles de usuarios objetivo.

```bash
/biz personas
/biz personas --count 4
```

**Flags:**
- `--count 2-4`: Número de personas a generar

**Output:** 2-4 user personas con demografía, comportamiento y pain points

---

## Estado Persistente

El plugin guarda análisis en `.claude/biz/`:

```
.claude/biz/
├── context.local.md          # Contexto acumulado del producto
├── validation-*.md           # Validaciones de ideas
├── prioritization-*.md       # Matrices de priorización
├── launch-strategy-*.md      # Planes de lanzamiento
├── research-*.md             # Reportes de mercado
├── finance-*.md              # Análisis financieros
├── pricing-*.md              # Estrategias de precios
└── personas-*.md             # User personas
```

## Flujo Recomendado

Para un producto nuevo:

1. **Validar** - `/biz validate "tu idea"`
2. **Personas** - `/biz personas`
3. **Research** - `/biz research "tu mercado"`
4. **Priorizar** - `/biz prioritize`
5. **Pricing** - `/biz pricing`
6. **Finanzas** - `/biz finance`
7. **Lanzamiento** - `/biz launch`

## Idioma

Todos los análisis y reportes se generan en **español**.
