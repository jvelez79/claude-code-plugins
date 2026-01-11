---
description: "Review UI design and provide professional improvement suggestions"
argument-hint: "[screenshot or description]"
---

# UI Review - Professional Design Standards

Revisa esta UI y propón cómo transformarla en un diseño profesional: $ARGUMENTS

## IMPORTANTE: SOLO REVIEW
**NO modifiques ningún archivo. Solo analiza y genera reporte.**

---

## PASO 0: Identificar Contexto

**ANTES de evaluar, identifica el tipo de aplicación:**

| Tipo | Referencias | Prioridades |
|------|-------------|-------------|
| SaaS / Herramienta | Linear, Notion, Figma | Eficiencia, densidad, atajos |
| Admin Panel | Stripe Dashboard, Vercel | Datos claros, navegación, bulk actions |
| E-commerce | Shopify, Gumroad | Conversión, trust, checkout |
| Landing / Marketing | Stripe.com, Vercel.com | Impacto visual, storytelling, CTA |
| Mobile App | iOS HIG, Material 3 | Touch 44px, gestures, thumb zones |
| Dashboard Analytics | Amplitude, Mixpanel | Data viz, filtros, drill-down |
| Content / Blog | Medium, Substack | Legibilidad, typography, focus |
| Social / Community | Discord, Slack | Engagement, notifications, real-time |
| Developer Tools | GitHub, Railway | Densidad, terminal aesthetic, keyboard-first |

**Evalúa SIEMPRE en el contexto identificado.**

---

## Filosofía
Evalúa como si fueras a reimaginar la UI. Sin cambios conservadores.
Compara contra los mejores **en la misma categoría**.

---

## Framework de Evaluación

### 1. SPACING & LAYOUT

**Escala permitida (base 4/8px):** 4, 8, 12, 16, 24, 32, 48, 64, 96px

**Reglas:**
- Elementos relacionados → spacing tight
- Elementos no relacionados → más separación
- Padding de contenedor > spacing interno
- Márgenes consistentes en toda la app

**Red Flags:**
- Valores random (13px, 17px, 22px)
- Spacing uniforme en todo (mata jerarquía)
- Elementos pegados a bordes del contenedor
- Gaps inconsistentes entre elementos similares

**Checklist:**
□ Todos los valores siguen escala 4/8px
□ Items relacionados agrupados visualmente
□ Breathing room adecuado
□ Padding consistente en contenedores similares

---

### 2. TYPOGRAPHY

**Escala de tamaños:** 12, 14, 16, 18, 20, 24, 30, 36, 48px
**Weights:** 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
**Line-height:** 1.4-1.6 para body, 1.1-1.3 para headings
**Max line length:** 60-75 caracteres

**Reglas:**
- Máximo 2 font families (1 preferido)
- Máximo 5-6 tamaños diferentes
- Jerarquía clara: title > subtitle > body > caption

**Red Flags:**
- Demasiados tamaños de fuente
- Uso inconsistente de weights
- Líneas demasiado anchas (difícil de leer)
- Poco contraste entre niveles de heading
- Solo color para diferenciar niveles de texto

**Checklist:**
□ Tamaños siguen escala definida
□ Jerarquía clara y consistente
□ Mismo weight para elementos del mismo nivel
□ Line lengths legibles

---

### 3. COLOR

**Paleta:**
- 1-2 colores de marca + neutrals
- 8-10 tonos de neutral (near-white a near-black)
- Colores semánticos: success, warning, error, info

**Contraste WCAG AA:**
- Texto normal: 4.5:1 mínimo
- Texto grande (18px+ o 14px bold): 3:1 mínimo
- Componentes UI: 3:1 mínimo

**Reglas:**
- NUNCA pure black (#000) para texto → usar #1a1a1a o similar
- NUNCA gray puro para texto → añadir ligera calidez/frialdad
- Colores saturados NO en áreas grandes

**Red Flags:**
- Demasiados colores compitiendo
- Texto gris sobre fondo gris (bajo contraste)
- Uso inconsistente de colores de marca
- Color como ÚNICO indicador (accessibility issue)

**Checklist:**
□ Paleta limitada e intencional
□ Todo el texto pasa contraste mínimo
□ Colores semánticos usados consistentemente
□ Colores soportan jerarquía, no compiten

---

### 4. VISUAL HIERARCHY

**Reglas:**
- UN punto focal claro por pantalla/sección
- Size, weight, color y spacing contribuyen a jerarquía
- De-enfatizar elementos secundarios (color más claro, menor tamaño)
- Labels menos prominentes que valores

**Jerarquía de acciones:**
- Primary buttons: filled, color saturado
- Secondary buttons: outlined o ghost
- Tertiary actions: text links
- Destructive: rojo, pero no compitiendo con primary

**Red Flags:**
- Múltiples elementos compitiendo por atención
- Todo se ve igual de importante
- Labels más prominentes que datos
- Demasiados botones "primarios"
- Sin punto de entrada visual claro

**Checklist:**
□ Acción primaria clara por pantalla
□ Jerarquía obvia (squint test)
□ Elementos secundarios apropiadamente de-enfatizados
□ El ojo fluye naturalmente al contenido importante

---

### 5. COMPONENTS

**Buttons:**
- Touch target mínimo: 44x44px (mobile), 32px height (desktop)
- Border-radius consistente en todos
- Estados claros: default, hover, active, disabled, loading
- Icon + text bien centrados

**Inputs:**
- Focus states claros (no solo cambio de color)
- Padding interno adecuado (12-16px)
- Labels arriba del campo (NO solo placeholder)
- Error states con mensajes útiles
- Altura consistente con buttons

**Cards:**
- Border-radius consistente (8px, 12px, o 16px - elegir uno)
- Sombras O bordes sutiles, no ambos pesados
- Jerarquía clara dentro del card
- Padding interno adecuado

**Red Flags:**
- Border-radius inconsistente
- Estados interactivos faltantes
- Placeholder como único label
- Buttons e inputs no alinean
- Sin estados loading/disabled

**Checklist:**
□ Sistema de border-radius consistente
□ Todos los elementos interactivos tienen hover/focus
□ Form fields tienen labels propios
□ Touch targets de tamaño adecuado
□ Estados loading y disabled existen

---

### 6. ICONS & IMAGERY

**Reglas:**
- Estilo consistente (outlined, filled, o duo-tone - elegir uno)
- Tamaños consistentes por contexto (16px, 20px, 24px)
- Alineación óptica, no matemática
- Spacing entre icon y texto: 8-12px

**Red Flags:**
- Estilos mezclados (outlined + filled random)
- Icons de diferentes tamaños en mismo contexto
- Icons tocando texto
- Icons decorativos añadiendo ruido
- Icons faltantes donde se esperan (external links, actions)

---

### 7. EMPTY, LOADING & ERROR STATES

**Requerimientos - toda sección dinámica necesita:**
- Empty state: mensaje útil + acción sugerida
- Loading state: skeleton (preferido) o spinner
- Error state: mensaje claro + acción de recovery

**Red Flags:**
- Áreas en blanco cuando no hay data
- "Loading..." genérico
- Errores técnicos mostrados al usuario
- Sin forma de recuperarse de errores

---

### 8. STRUCTURAL DESIGN & UX PATTERNS

**Patrones de Layout - Cuándo usar:**

| Patrón | Usar cuando |
|--------|-------------|
| Single column | Forms, artículos, tareas focalizadas |
| Two column (sidebar + content) | Apps con navegación pesada, dashboards, settings |
| Card grid | Browsing, galerías, selección entre opciones |
| Split view (master-detail) | Email clients, file managers, listas con preview |
| Wizard/Stepper | Forms complejos (3+ pasos, 5+ inputs), onboarding |

**Problemas estructurales comunes:**

| Problema | Solución |
|----------|----------|
| Form largo abrumador | Dividir en wizard/accordion |
| Demasiados datos en tabla | Filtros, search, pagination, summary row |
| Dashboard sobrecargado | Hero metric + supporting details |
| Settings caóticos | Agrupar en categorías con navegación |
| Empty states que no llevan a nada | Onboarding steps o acciones sugeridas |
| Modal dentro de modal | Rediseñar como página o slide-over |
| Tabs dentro de tabs | Aplanar jerarquía, usar otro patrón |

**Placement de acciones:**
- Primary actions: Top-right de sección o bottom-right de form
- Destructive actions: Separadas de primary, requieren confirmación
- Bulk actions: Aparecen al seleccionar items
- Navigation: Ubicación consistente (usualmente left o top)

**Checklist estructural:**
□ ¿Usuario identifica propósito de la página en 3 segundos?
□ ¿Acción primaria obvia y accesible?
□ ¿Información agrupada lógicamente?
□ ¿Un patrón de layout diferente serviría mejor?
□ ¿Complejidad apropiada para la tarea?
□ ¿Hay pasos o clicks innecesarios?

---

### 9. PATRONES POR TIPO DE PANTALLA

**Dashboard:**
- Estructura: Hero metric(s) → Charts de soporte → Activity/Recent
- Must have: KPIs claros, selector de período, quick actions
- Evitar: Todo con igual peso, demasiados charts, sin conclusión clara

**Data Table / List:**
- Estructura: Filters/Search → Bulk actions → Table → Pagination
- Must have: Columnas ordenables, row actions, empty state, loading skeleton
- Considerar: Toggle de visibilidad de columnas, export, saved views

**Form Simple (<5 campos):**
- Estructura: Single column, fields stacked, actions abajo
- Must have: Labels claros, feedback de validación, cancel + submit

**Form Complejo (5+ campos):**
- Estructura: Secciones con headers O wizard steps
- Must have: Indicador de progreso, save draft, agrupación de fields
- Considerar: Campos condicionales, ayuda inline, resumen antes de submit

**Detail Page:**
- Estructura: Header (título + status + actions) → Info primaria → Tabs para secundaria
- Must have: Back navigation, edit action, related items
- Considerar: Activity log, comments, attachments

**Settings:**
- Estructura: Navigation (left o tabs) → Opciones agrupadas → Save por sección
- Must have: Categorías claras, confirmación en cambios destructivos
- Evitar: Un form masivo, settings sin contexto/explicación

**Modal / Dialog:**
- Estructura: Title → Content → Actions (cancel left, confirm right)
- Must have: Botón cerrar, ESC cierra, focus trap
- Evitar: Modals con scroll, forms con muchos fields, modals anidados
- Max width: 500px simple, 800px complejo

---

### 10. RESPONSIVE

**Reglas:**
- Contenido debe respirar en pantallas grandes (max-width containers)
- Touch targets más grandes en mobile
- Reducir complejidad visual en mobile
- Testear en: 375px, 768px, 1024px, 1440px

---

## Sistema de Scoring (1-10)

**El score refleja el estado ACTUAL, antes de mejoras.**

| Score | Significado |
|-------|-------------|
| 1-3 | Roto/inutilizable, problemas mayores de usabilidad |
| 4-5 | Funcional pero amateur, inconsistente, pobre jerarquía |
| 6-7 | Decente, problemas menores, falta pulido |
| 8 | Calidad profesional, refinamientos menores posibles |
| 9 | Excelente, production-ready, bien crafteado |
| 10 | Excepcional, podría ser referencia |

---

## Output Requerido

### 0. Contexto Identificado
- **Tipo**: [SaaS/Admin/E-commerce/Landing/Mobile/Dashboard/Content/Social/DevTools]
- **Público objetivo**: [inferido del diseño]
- **Referencias relevantes**: [2-3 apps líderes en ese espacio]
- **Prioridades para este contexto**: [qué importa más aquí]

### 1. Score Actual (1-10)
Número + justificación breve (2-3 líneas max).

### 2. Structural Assessment
- Patrón de layout actual identificado
- ¿Es apropiado para el caso de uso?
- Cambios estructurales recomendados (si aplica)

### 3. Critical Issues (must fix)
Problemas específicos con ubicación exacta y fix concreto.

### 4. Improvements (should fix)
Mejoras que elevarían la calidad.

### 5. Suggestions (nice to have)
Items de pulido para refinamiento extra.

### 6. Código Before/After
Cambios CSS/componentes específicos:
```css
/* Before */
.card { padding: 15px; border-radius: 5px; }

/* After */
.card { padding: 16px; border-radius: 12px; }
```

### 7. Referencia
App conocida con patrón similar que funciona bien.

---

## Reglas
- **SOLO genera reporte, NO edites archivos**
- Sé brutalmente honesto
- Propón cambios agresivos sin miedo
- Prioriza: usability > consistency > polish
- Da fixes específicos e implementables, no sugerencias vagas
