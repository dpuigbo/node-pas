# Base de Datos — PAS Robotics Manage

La base de datos de producción (MariaDB en Hostinger, `u306143177_admin_db`) es la **fuente de verdad**. Este documento recoge la auditoría realizada sobre el dump del 10-06-2026, los scripts disponibles, y las recomendaciones para mantenerla estándar.

---

## 1. Resultado de la auditoría del dump

### Lo que está bien (no hace falta tocarlo)

- **Integridad referencial casi perfecta**: de ~6.500 filas, solo hay 1 registro huérfano (una planta de prueba).
- **Claves foráneas declaradas** en casi todas las relaciones, con `ON DELETE` coherentes.
- **Tablas lookup** (`lu_familia`, `lu_nivel_mantenimiento`, `lu_tipo_actividad`, `lu_montaje`, `lu_proteccion`, `lu_generacion_controlador`) bien normalizadas con códigos únicos.
- **Charset `utf8mb4`** en todas las tablas.
- **Columnas JSON validadas** con `CHECK (json_valid(...))`.
- Índices únicos compuestos correctos (ej: `modelos_componente (fabricante_id, tipo, nombre)`).

### Problemas detectados

| # | Problema | Gravedad | Solución |
|---|----------|----------|----------|
| 1 | La vista `v_lubricacion` está **rota**: referencia `cc.codigo_abb`, columna que renombraste a `codigo_fabricante` | Alta — la vista falla al consultarla | Script de limpieza la recrea corregida |
| 2 | Planta huérfana de prueba (`id=1, nombre='x'`) apunta a un `cliente_id=1` inexistente | Baja | Script la elimina |
| 3 | Falta la FK `plantas → clientes` (no se puede crear por culpa del huérfano) | Media | Script la añade tras limpiar |
| 4 | 10 tablas `_backup_*` de migraciones de mayo 2026 (~1.200 filas muertas) | Baja — ruido y peso | Script las elimina (haz export antes) |
| 5 | Las vistas tienen `DEFINER` del usuario de Hostinger → no son portables (fallan al importar el dump en otra máquina) | Media | Script las recrea sin DEFINER |

### Script de limpieza

Todo lo anterior se corrige ejecutando **una sola vez** en producción (phpMyAdmin > pestaña SQL):

```
server/src/db/sql/limpieza_produccion.sql
```

**⚠️ Exporta la base de datos completa antes de ejecutarlo.** El script elimina las tablas `_backup_*`; el export que hagas justo antes es tu copia de seguridad de esos datos.

---

## 2. Archivos SQL del repositorio

| Archivo | Uso |
|---------|-----|
| `server/src/db/sql/schema_limpio.sql` | Estructura completa estandarizada (35 tablas + 2 vistas, sin datos). Para crear una BD nueva desde cero. |
| `server/src/db/sql/limpieza_produccion.sql` | Saneamiento puntual de la BD de producción actual. |

### Crear un entorno local con tus datos reales

```bash
# 1. Exporta el dump desde phpMyAdmin en Hostinger (formato SQL)

# 2. Crea la BD local
mysql -e "CREATE DATABASE pas_robotics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 3. Importa el dump
mysql pas_robotics < tu_dump.sql

# 4. Si el dump es anterior a la limpieza, aplica el saneamiento
mysql pas_robotics < server/src/db/sql/limpieza_produccion.sql

# 5. Configura .env (copia de .env.example) y arranca
npm run dev
```

### Crear una BD vacía con la estructura estándar

```bash
mysql -e "CREATE DATABASE pas_robotics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql pas_robotics < server/src/db/sql/schema_limpio.sql
```

---

## 3. Mapa de la base de datos

```
CRM / Operaciones
  clientes ──< plantas ──< maquinas
  clientes ──< sistemas ──< componentes_sistema (controller / mech_unit / drive_unit / external_axis)
  clientes ──< ofertas ──< oferta_sistema, oferta_componente, oferta_bloque_calendario
  clientes ──< intervenciones ──< intervencion_sistema, pedidos_compra
  intervenciones ──< informes ──< componentes_informe (schema congelado + datos)

Catálogo técnico (el grueso de los datos)
  fabricantes ──< lu_familia ──< modelos_componente (645 modelos)
  modelos_componente ──< lubricacion (1.586 filas: aceite/grasa por eje)
  modelos_componente ──< mantenimiento_horas_modelo (834 filas: horas por modelo+controlador+nivel)
  actividad_preventiva (60) ──< actividad_consumible ──> consumible_catalogo (87)
  consumible_catalogo ──< consumible_precio_historico

Lookups
  lu_nivel_mantenimiento, lu_tipo_actividad, lu_montaje,
  lu_proteccion, lu_generacion_controlador

Plantillas e informes
  versiones_template (schema JSON por modelo), document_templates

Otros
  usuarios (login Microsoft), configuracion_app (clave/valor)

Vistas
  v_lubricacion, v_actividad_preventiva
```

---

## 4. Recomendaciones para el futuro (no urgentes)

1. **Arrays JSON de compatibilidad → tablas puente.** Columnas como `modelos_componente.controladores_compatibles`, `montajes_disponibles`, `protecciones_disponibles` y los `*_aplicables` de `actividad_preventiva`/`lubricacion` guardan arrays de IDs en JSON. Ya tienes las tablas relacionales equivalentes (`_trazabilidad_compatibilidad_modelo_controlador`, `_trazabilidad_modelo_montaje`, `_trazabilidad_modelo_proteccion`) con información extra (fuente documental, página del manual). Lo estándar sería usar solo las tablas puente y eliminar la duplicación JSON. Mientras ambas convivan, hay riesgo de que se desincronicen.

2. **Renombrar las tablas `_trazabilidad_*`.** El prefijo `_` sugiere "interno/temporal", pero contienen datos de referencia valiosos. Nombres como `modelo_controlador_compat` serían más claros.

3. **Columna obsoleta marcada para borrar**: `modelos_componente.niveles_legacy_eliminar` — cuando confirmes que nada la usa, elimínala.

4. **No crear más tablas `_backup_*` en la BD.** Para snapshots puntuales, exporta a un archivo `.sql` con phpMyAdmin y guárdalo fuera (o en un repositorio privado). La BD de producción solo debe contener datos vivos.

5. **`int(11)` y `tinyint(1)`** son notación legacy de MySQL/MariaDB; funcionan perfectamente, no merece la pena migrarlos.
