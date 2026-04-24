# PAS Robotics Manage — Resumen de cambios de schema v1 → v2

**Fecha:** 2026-04-24
**Origen de datos:** BD Excel `ABB_BD_Mantenimiento_v7.xlsx` + export real `u306143177_admin_db.json`
**Destino:** MySQL/MariaDB con Prisma (BD `u306143177_admin_db`)

---

## Índice

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Divergencias respecto a una primera estimación](#2-divergencias-respecto-a-una-primera-estimación)
3. [Tablas nuevas](#3-tablas-nuevas)
4. [Tablas alteradas](#4-tablas-alteradas)
5. [Sistema de compatibilidad de ejes externos](#5-sistema-de-compatibilidad-de-ejes-externos)
6. [Migración de datos (texto → FK)](#6-migración-de-datos-texto--fk)
7. [Impacto en la interfaz](#7-impacto-en-la-interfaz)
8. [Orden de ejecución y rollback](#8-orden-de-ejecución-y-rollback)
9. [Checklist para Claude Code](#9-checklist-para-claude-code)

---

## 1. Resumen ejecutivo

Los scripts de esta entrega están **adaptados al schema REAL** de tu BD `u306143177_admin_db` (export JSON del 24-abr-2026). El schema v2 añade **6 lookups + 7 tablas de negocio + 3 alteraciones** sin eliminar ni modificar ninguna tabla existente. Todo lo que tienes ahora se preserva tal cual, incluyendo:

- `clientes` con sus 24 campos (tarifa_hora_trabajo, dietas, peajes, km, precio_km, logo, etc.)
- `plantas` como nivel intermedio cliente→sistema (yo no lo tenía en la primera estimación)
- `sistemas` con su `planta_id`
- `configuracion_app` con los 17 pares clave-valor de empresa y recargos
- `document_templates` + `versiones_template` para plantillas de informes
- `usuarios` con `microsoft_id` y rol
- Columna `niveles` CSV en `modelos_componente` (se mantiene y se espeja en tabla normalizada)

**Ganancias principales:**

- `lubricacion_reductora` (match por texto) → `lubricacion` (FK a modelos + FK a aceites)
- `actividades_mantenimiento` (texto libre + intervalo texto) → `actividad_preventiva` (FK a familia + intervalos numéricos)
- Compatibilidad de ejes externos modelada en **3 tablas separadas** (whitelist/blacklist/controlador) derivadas del Excel v7
- **2 nuevas tablas**: `actividad_cabinet` (171 filas) y `actividad_drive_module` (15 filas) — que NO existían en el modelo anterior
- Normalización de aceites con tabla de alias para resolver los 49 aceites actuales (hay duplicados escritos distinto)
- Registro de los 2 modelos de drive module en `modelos_componente` (no existían: tipo='drive_unit' tiene 0 filas en tu BD real)

**Tamaños esperados después de migración:**

| Tabla | Filas esperadas |
|---|---|
| `lu_familia` | ~118 |
| `lu_generacion_controlador` | 7 |
| `lu_tipo_actividad` | 18 |
| `lu_nivel_mantenimiento` | 4 |
| `lu_unidad_intervalo` | 6 |
| `modelo_nivel_aplicable` | ~3.740 (935 modelos × ~4 niveles) |
| `aceite_alias` | ≥61 (49 identidad + 12 manuales, crece con uso) |
| `lubricacion` | ~600-680 (depende del ratio de match) |
| `actividad_preventiva` | ~400-411 |
| `actividad_cabinet` | 171 |
| `actividad_drive_module` | 15 |
| `equivalencia_familia` | 76 |
| `punto_control_generico` | 38 |
| `compatibilidad_eje_permitida` | ~530 |
| `compatibilidad_eje_excluye` | 115 |
| `compatibilidad_eje_controlador` | ~90 |

---

## 2. Divergencias respecto a una primera estimación

El export JSON que me pasaste reveló diferencias con el modelo asumido en la primera iteración. Lo que cambió:

| Item | Estimación inicial | Schema REAL | Impacto |
|---|---|---|---|
| Tabla `plantas` | No la tenía | Existe: cliente→planta→sistema | Scripts adaptados. Sistemas usan `planta_id` |
| Tabla `configuracion_app` | No la tenía | 17 pares KV (empresa, recargos, festivos) | No se toca. Scripts respetan |
| Tabla `document_templates` | No la tenía | Plantillas de informes (preventivo, correctivo) | No se toca |
| Tabla `usuarios` con MS-SSO | No la tenía | `microsoft_id` + rol admin | No se toca |
| `clientes.tarifa_*` y campos financieros | No los tenía | 24 campos (tarifas, dietas, km, logo…) | Seed demo los pobla |
| `modelos_componente.niveles` | Quería eliminarlo | Ya está poblado como CSV | Se CONSERVA. Nueva tabla `modelo_nivel_aplicable` se sincroniza con el CSV |
| `drive_unit` en modelos_componente | Asumí que existían | 0 filas (tipo 'drive_unit' vacío) | Script 03 los CREA antes de asociar actividades |
| `IRC5 Single` id | Sin asumir | id=28 en tu BD | Scripts usan match por nombre (robusto a IDs) |

**Decisión clave:** ninguna tabla existente se toca ni se borra. Las columnas añadidas son aditivas. Todos los INSERTs usan `INSERT IGNORE` o subquerys con JOIN para ser **idempotentes** y re-ejecutables.

---

## 3. Tablas nuevas

### 3.1 Lookups

**`lu_generacion_controlador`** — 7 filas (S4, S4C, S4C+, IRC5, IRC5P, OmniCore, OmniCore A line). Se vincula a `modelos_componente.generacion_controlador_id` solo para tipo='controller'.

**`lu_familia`** — ~118 filas. PK compuesta `(fabricante_id, codigo, tipo)` porque una familia como "IRB 6700" puede existir teóricamente con el mismo nombre en KUKA (hoy no pasa). Cada `modelos_componente` se vincula via `familia_id`.

**`lu_tipo_actividad`** — 18 filas. Normaliza los 21 valores únicos actuales del Excel donde "Inspección" y "Inspeccion" eran strings distintos. Campo `categoria` ENUM y `requiere_parada` para planificación.

**`lu_unidad_intervalo`** — 6 valores: horas, meses, anios, alerta_baja, condicion, inspeccion.

**`lu_nivel_mantenimiento`** — 4 niveles: `1`, `2_inferior`, `2_superior`, `3`. Mismos códigos que el CSV actual en `modelos_componente.niveles`.

### 3.2 Negocio

**`modelo_nivel_aplicable`** (M:N) — parsea el CSV existente y lo explota a filas para queries eficientes. Ambos formatos coexisten.

**`aceite_alias`** — cada aceite entra como alias de sí mismo + 12 alias manuales para los duplicados detectados (Kyodo TMO 150, Mobilgear XP 320, Harmonic Grease, SHC Cibus).

**`lubricacion`** — reemplaza a `lubricacion_reductora`. FK a modelo + aceite, cantidad numérica + unidad ENUM. Preserva campos `*_legacy` para auditoría.

**`actividad_preventiva`** — reemplaza a `actividades_mantenimiento`. FK a familia + tipo_actividad. Intervalos parseados a horas/meses/condicion. Foundry Prime como campos separados.

**`actividad_cabinet`** ⭐ NUEVA — 171 actividades específicas de cabinets (IRC5 Single: 24, OmniCore C90XT: 17, V250XT Type B: 17, V400XT: 17, C30: 16, V250XT: 15, V250XT Type A: 15, IRC5 Compact: 14, E10: 14, IRC5 PMC: 13, IRC5P: 7, A250XT: 1, A400XT: 1).

**`actividad_drive_module`** ⭐ NUEVA — 15 actividades (IRC5 Drive Unit: 10, OmniCore Drive Module: 5). Campo `controlador_asociado_id` porque cada DU se conecta a una controladora específica.

**`equivalencia_familia`** ⭐ NUEVA — 76 reglas del Excel tipo "IRB 2600 Type A = Type B en lubricación". Útil para inferir datos de variantes no documentadas.

**`punto_control_generico`** ⭐ NUEVA — 38 puntos transversales (verificar backlash, test tarjeta frenos, etc.) agrupados por `categoria` (manipulador/controladora/drive_module/cabling/eje_externo/seguridad).

### 3.3 Compatibilidad (ver §5)

- `compatibilidad_eje_permitida`
- `compatibilidad_eje_excluye`
- `compatibilidad_eje_controlador`

---

## 4. Tablas alteradas

### 4.1 `modelos_componente`

**Añadidos:**
- `familia_id INT NULL` → FK a `lu_familia`
- `generacion_controlador_id INT NULL` → FK a `lu_generacion_controlador`

**Conservados (NO se tocan):**
- `familia` VARCHAR → convive como legacy; la FK `familia_id` es la nueva autoridad
- `niveles` TEXT CSV → se sincroniza con `modelo_nivel_aplicable`
- `aceites_config` JSON → queda disponible, datos reales viven en `lubricacion`

### 4.2 `aceites`

**Añadidos:**
- `codigo_canonico VARCHAR(100) UNIQUE` → identificador estable
- `categoria` ENUM → aceite/grasa/food_grade/foundry/harmonic/otro
- `notas_tecnicas TEXT`

### 4.3 `compatibilidad_controlador`

**Añadidos:**
- `notas VARCHAR(255)` — para anotar casos especiales

**Conservado:** los 7.605 registros existentes de matching controller↔componente.

---

## 5. Sistema de compatibilidad de ejes externos

### 5.1 Motivación

Al analizar la hoja "Unidades Mecánicas" del Excel v7 se detectaron **3 tipos de restricción** que no caben en una columna de texto:

1. **Whitelist (permitidos)**: "este track solo funciona con estos robots" — IRBT/IRT
2. **Blacklist (excluidos)**: "este posicionador es compatible con casi todo ABB excepto X" — IRBP
3. **Controlador requerido**: "este positioner OmniCore necesita V250XT o V400XT" — IRP

La v2 modela las tres lógicas por separado.

### 5.2 Tablas

```
┌──────────────────────┐
│ modelos_componente   │  (tipo='external_axis')
│  id                  │
│  familia_id ─────────┼─────┐
└──────────────────────┘     │
                              │
  ┌───────────────────────────┼────────────────────────┐
  ▼                           ▼                        ▼
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────────┐
│compatibilidad_eje_    │ │compatibilidad_eje_    │ │compatibilidad_eje_        │
│  permitida            │ │  excluye              │ │  controlador              │
│ (whitelist familias)  │ │ (blacklist familias)  │ │ (whitelist controladores) │
│  eje_modelo_id        │ │  eje_modelo_id        │ │  eje_modelo_id            │
│  familia_id ──▶lu_fam │ │  familia_id ──▶lu_fam │ │  controlador_modelo_id    │
└───────────────────────┘ └───────────────────────┘ └───────────────────────────┘
```

### 5.3 Reglas codificadas en el seed

| Familia eje | Whitelist (permitida) | Blacklist (excluye) | Controlador |
|---|---|---|---|
| **IRBP A/B/C/D/K/L/R** | — | `IRB 120` | — |
| **IRBT 2005** | IRB 1520, 1600, 2600, 4600 | — | — |
| **IRBT 4002** | IRB 1400, 2400, 4400 | — | — |
| **IRBT 4004** | IRB 4400, 4450S, 4600 | — | — |
| **IRBT 6002** | IRB 6400, 640, 6400R, 1400, 2400, 4400 | — | — |
| **IRBT 6004** | IRB 6620, 6650S, 6700 | — | — |
| **IRBT 7004** | IRB 6620, 6650S, 6700, 7600 | — | — |
| **IRT 510** | IRB 1520, 1600, 2600, 4600 | — | — |
| **IRT 710 OmniCore** | 17 familias OmniCore grandes | — | — |
| **IRP A/B/C/D/K/L/R** | — | — | V250XT, V400XT |

### 5.4 Algoritmo de evaluación (backend)

```typescript
function esCompatible(
  ejeModeloId: number,
  robotFamiliaId: number,
  controladorModeloId: number
): { compatible: boolean, motivo?: string } {

  // 1. Whitelist de familias
  const permitidas = await db.compatibilidadEjePermitida.findMany({
    where: { eje_modelo_id: ejeModeloId }
  });
  if (permitidas.length > 0 &&
      !permitidas.some(p => p.familia_id === robotFamiliaId)) {
    return { compatible: false, motivo: 'Familia de robot no permitida por el eje externo' };
  }

  // 2. Blacklist de familias
  const excluidas = await db.compatibilidadEjeExcluye.findMany({
    where: { eje_modelo_id: ejeModeloId }
  });
  if (excluidas.some(e => e.familia_id === robotFamiliaId)) {
    return { compatible: false, motivo: 'Familia de robot excluida para este eje externo' };
  }

  // 3. Whitelist de controladores
  const ctrlReq = await db.compatibilidadEjeControlador.findMany({
    where: { eje_modelo_id: ejeModeloId }
  });
  if (ctrlReq.length > 0 &&
      !ctrlReq.some(c => c.controlador_modelo_id === controladorModeloId)) {
    return { compatible: false, motivo: 'Eje requiere controlador específico (ej: V250XT/V400XT)' };
  }

  return { compatible: true };
}
```

**Caso por defecto**: si el eje no tiene filas en ninguna de las 3 tablas → compatible con todo.

### 5.5 Vista de conveniencia

```sql
SELECT * FROM v_eje_compatibilidad WHERE eje_nombre LIKE 'IRBT 4004%';
-- eje_modelo_id | eje_nombre      | familia_eje | familias_permitidas     | familias_excluidas | controladores_requeridos
-- 125           | IRBT 4004 1.9m  | IRBT 4004   | IRB 4400, IRB 4450S,... | NULL               | NULL
```

---

## 6. Migración de datos (texto → FK)

### 6.1 Estrategia

1. **No destruir nada**: todos los campos originales se preservan
2. **Match best-effort**: 80% automatizable con LIKE/REGEXP; el resto queda en la tabla vieja para revisión manual
3. **Idempotencia total**: `INSERT IGNORE` y subquerys con JOIN

### 6.2 Casos especiales

**Lubricación:**
- `lubricacion_reductora.variante_trm` → `modelos_componente.nombre` (match exacto)
- `tipo_lubricante` → `aceite_alias.alias` → `aceites.id`
- Variantes con "all variants" quedan pendientes: query de auditoría al final del script 02 las identifica

**Actividades preventivas:**
- `familia_robot` (string) → `lu_familia.codigo` por (fabricante_id + codigo)
- `tipo_actividad` con typos → `lu_tipo_actividad.nombre` (comparación con/sin tildes)
- `intervalo_estandar` REGEXP → `intervalo_horas INT` + `intervalo_meses SMALLINT` + `intervalo_condicion ENUM`

**Aceites (49 registros con duplicados):**
- Cada uno entra como alias de sí mismo automáticamente
- 12 alias manuales añadidos en script 02 para los duplicados más obvios (Kyodo, Mobilgear, Harmonic, Cibus)
- Resto se resuelve manualmente según vayas encontrando duplicados

---

## 7. Impacto en la interfaz

### 7.1 Páginas/formularios a adaptar

| Página | Cambio | Prioridad |
|---|---|---|
| Formulario `modelos_componente` | Dropdown `familia` desde `lu_familia` | Alta |
| Formulario controlador | Dropdown `generacion` desde `lu_generacion_controlador` | Alta |
| Formulario `modelos_componente` niveles | Multi-select desde `lu_nivel_mantenimiento` (mantener sync con CSV) | Alta |
| Listado actividades mantenimiento | JOIN con `lu_tipo_actividad` y `lu_familia` | Alta |
| Editor actividades | Dropdown tipo + inputs numéricos horas/meses (vs texto libre actual) | Alta |
| Editor lubricación | Dropdown aceite con búsqueda por alias + numérico cantidad/unidad | Alta |
| Constructor sistemas | Validar compatibilidad robot+controlador+eje (ver §5.4) | **Crítica** |
| Vista sistema | Mostrar icono de aviso si alguna pieza es incompatible | Media |
| Nueva página Cabinets | CRUD `actividad_cabinet` | Media |
| Nueva página Drive Modules | CRUD `actividad_drive_module` | Media |
| Nueva página Equivalencias | Consulta `equivalencia_familia` | Baja |
| Nueva página Puntos Control | `punto_control_generico` por categoría | Media |
| Informes | Añadir sección "Puntos control aplicables" según componente | Media |

### 7.2 Endpoints API nuevos

| Endpoint | Cambio |
|---|---|
| `GET /api/modelos-componente/:id` | Incluir `familia` y `generacion` como objetos anidados |
| `GET /api/familias` | Nuevo — listado para dropdowns |
| `GET /api/tipos-actividad` | Nuevo |
| `GET /api/generaciones-controlador` | Nuevo |
| `GET /api/niveles-mantenimiento` | Nuevo |
| `GET /api/ejes/:id/compatibilidad` | Nuevo — resuelve whitelist+blacklist+controlador |
| `POST /api/sistemas/:id/validar-compatibilidad` | Nuevo — valida el sistema completo |
| `GET /api/cabinets/:modelo_id/actividades` | Nuevo |
| `GET /api/drive-modules/:modelo_id/actividades` | Nuevo |
| `GET /api/puntos-control?categoria=X` | Nuevo |
| `GET /api/aceites?q=texto` | Modificar para buscar por alias también |

### 7.3 Ejemplo de modelo Prisma actualizado

```prisma
model ModeloComponente {
  id                        Int      @id @default(autoincrement())
  fabricanteId              Int      @map("fabricante_id")
  tipo                      TipoComponente
  familia                   String?   // legacy, mantener para no romper
  familiaId                 Int?     @map("familia_id")
  generacionControladorId   Int?     @map("generacion_controlador_id")
  nombre                    String
  notas                     String?
  aceitesConfig             Json?    @map("aceites_config")   // legacy
  niveles                   String?                            // legacy CSV
  createdAt                 DateTime @map("created_at")
  updatedAt                 DateTime @map("updated_at")

  // Relaciones nuevas
  familiaRel                LuFamilia? @relation(fields: [familiaId], references: [id])
  generacion                LuGeneracionControlador? @relation(fields: [generacionControladorId], references: [id])
  nivelesAplicables         ModeloNivelAplicable[]
  lubricaciones             Lubricacion[]

  // Relaciones compatibilidad (si tipo='external_axis')
  compatPermitida           CompatibilidadEjePermitida[]   @relation("EjeCompat")
  compatExcluye             CompatibilidadEjeExcluye[]     @relation("EjeExcl")
  compatControlador         CompatibilidadEjeControlador[] @relation("EjeCtrl")

  @@unique([fabricanteId, nombre])
  @@map("modelos_componente")
}
```

---

## 8. Orden de ejecución y rollback

### 8.1 Orden de aplicación

```bash
mysql -u u306143177_admin -p u306143177_admin_db < 01_schema_ddl.sql
mysql -u u306143177_admin -p u306143177_admin_db < 02_migration.sql
mysql -u u306143177_admin -p u306143177_admin_db < 03_seed_catalogo.sql
mysql -u u306143177_admin -p u306143177_admin_db < 04_seed_demo.sql   # OPCIONAL
```

### 8.2 Validación post-migración

```sql
-- Modelos sin familia asignada (debe ser 0)
SELECT COUNT(*) FROM modelos_componente WHERE familia_id IS NULL;

-- Lubricaciones sin aceite resuelto (indica alias faltantes)
SELECT COUNT(*) FROM lubricacion
WHERE aceite_id IS NULL AND tipo_lubricante_legacy NOT IN ('N/A', '');

-- Registros legacy sin migrar (candidatos a revisión manual)
SELECT lr.* FROM lubricacion_reductora lr
LEFT JOIN lubricacion l ON l.variante_trm_legacy = lr.variante_trm AND l.eje = lr.eje
WHERE l.id IS NULL LIMIT 20;

-- Conteo final
SELECT
  (SELECT COUNT(*) FROM lu_familia)                  AS familias,
  (SELECT COUNT(*) FROM lubricacion)                 AS lubric_migradas,
  (SELECT COUNT(*) FROM actividad_preventiva)        AS act_prev_migradas,
  (SELECT COUNT(*) FROM actividad_cabinet)           AS act_cabinet,
  (SELECT COUNT(*) FROM actividad_drive_module)      AS act_dm,
  (SELECT COUNT(*) FROM compatibilidad_eje_permitida) AS compat_perm,
  (SELECT COUNT(*) FROM compatibilidad_eje_excluye)   AS compat_excl,
  (SELECT COUNT(*) FROM compatibilidad_eje_controlador) AS compat_ctrl,
  (SELECT COUNT(*) FROM modelo_nivel_aplicable)      AS niveles_explode;
```

### 8.3 Rollback

```sql
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS compatibilidad_eje_permitida, compatibilidad_eje_excluye, compatibilidad_eje_controlador;
DROP TABLE IF EXISTS lubricacion, actividad_preventiva, actividad_cabinet, actividad_drive_module;
DROP TABLE IF EXISTS equivalencia_familia, punto_control_generico, modelo_nivel_aplicable, aceite_alias;
DROP TABLE IF EXISTS lu_familia, lu_generacion_controlador, lu_tipo_actividad, lu_unidad_intervalo, lu_nivel_mantenimiento;
DROP VIEW IF EXISTS v_eje_compatibilidad, v_lubricacion;

ALTER TABLE modelos_componente DROP FOREIGN KEY fk_modcomp_familia;
ALTER TABLE modelos_componente DROP FOREIGN KEY fk_modcomp_gen;
ALTER TABLE modelos_componente DROP COLUMN familia_id, DROP COLUMN generacion_controlador_id;

-- Si se registraron los drive modules en modelos_componente:
DELETE FROM modelos_componente WHERE tipo='drive_unit';

ALTER TABLE aceites DROP COLUMN codigo_canonico, DROP COLUMN categoria, DROP COLUMN notas_tecnicas;
ALTER TABLE compatibilidad_controlador DROP COLUMN notas;
SET FOREIGN_KEY_CHECKS = 1;
```

### 8.4 Fase de limpieza (OPCIONAL, dentro de 2-4 semanas)

Tras validar que todo funciona:

```sql
RENAME TABLE lubricacion_reductora TO _archived_lubricacion_reductora;
RENAME TABLE actividades_mantenimiento TO _archived_actividades_mantenimiento;

-- Columnas legacy CSV/JSON que la tabla normalizada ya espeja:
-- (DEJAR POR AHORA — se pueden quitar solo si el frontend ya no las usa)
-- ALTER TABLE modelos_componente DROP COLUMN niveles;
-- ALTER TABLE modelos_componente DROP COLUMN aceites_config;
```

---

## 9. Checklist para Claude Code

Pasos ordenados para la sesión de implementación frontend:

- [ ] **1.** Hacer backup de la BD `u306143177_admin_db` antes de ejecutar scripts
- [ ] **2.** Ejecutar `01_schema_ddl.sql` en staging primero
- [ ] **3.** Ejecutar `02_migration.sql` y revisar queries de auditoría
- [ ] **4.** Ejecutar `03_seed_catalogo.sql` y verificar conteos
- [ ] **5.** (Opcional) Ejecutar `04_seed_demo.sql` para tener datos demo
- [ ] **6.** Actualizar `schema.prisma` añadiendo los 13 nuevos modelos + 3 alterados
- [ ] **7.** `prisma db pull` para sincronizar con el DDL manual (NO `migrate dev` porque perderías los datos)
- [ ] **8.** `prisma generate` para regenerar el client TS
- [ ] **9.** Implementar endpoints nuevos (sección 7.2)
- [ ] **10.** Implementar servicio `validarCompatibilidadSistema()` con algoritmo §5.4
- [ ] **11.** Tests unitarios del validador con las 10 reglas de §5.3
- [ ] **12.** Adaptar formularios (sección 7.1) de mayor a menor prioridad
- [ ] **13.** Migrar los casos pendientes de `lubricacion_reductora` que no hicieron match manualmente
- [ ] **14.** (Fase 2) Añadir páginas Cabinets, Drive Modules, Puntos Control
- [ ] **15.** (Fase 3, tras validación en prod) Ejecutar fase de limpieza §8.4

---

**Fin del resumen.** Cualquier duda sobre bloques específicos del SQL, están comentados en cada script.
