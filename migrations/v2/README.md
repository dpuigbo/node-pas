# PAS Robotics Manage — Entrega schema v2 (adaptada a BD real)

**Fecha:** 2026-04-24
**Para:** Daniel Puigbó — PAS Robotics

---

## Contenido del paquete

| Archivo | Descripción |
|---|---|
| `01_schema_ddl.sql` | DDL: crea 13 tablas nuevas + altera 3 existentes + 2 vistas |
| `02_migration.sql` | Migra datos actuales de `lubricacion_reductora` y `actividades_mantenimiento` al nuevo modelo con FKs |
| `03_seed_catalogo.sql` | Puebla el catálogo ABB del Excel v7: 171 actividades cabinet + 15 drive module + 76 equivalencias + 38 puntos control + ~735 reglas de compatibilidad de ejes |
| `04_seed_demo.sql` | **OPCIONAL** — Crea cliente demo "ACME Metalúrgica" con plantas, sistemas completos para probar. NO toca tu cliente "xx" (id=3) |
| `05_RESUMEN_CAMBIOS.md` | Documento maestro con toda la arquitectura explicada. Pásalo a Claude Code en la sesión de frontend. |
| `ABB_BD_Mantenimiento_v7.xlsx` | Fuente de datos del catálogo. Conservar como backup documental. |
| `BD_export_original.json` | Copia del export que me enviaste (para referencia / reversión emergencia). |

---

## Orden de ejecución

```bash
# 1. BACKUP PRIMERO
mysqldump -u u306143177_admin -p u306143177_admin_db > backup_pre_v2_$(date +%Y%m%d).sql

# 2. DDL
mysql -u u306143177_admin -p u306143177_admin_db < 01_schema_ddl.sql

# 3. Migración de datos
mysql -u u306143177_admin -p u306143177_admin_db < 02_migration.sql

# 4. Catálogo ABB
mysql -u u306143177_admin -p u306143177_admin_db < 03_seed_catalogo.sql

# 5. (Opcional) Demo
mysql -u u306143177_admin -p u306143177_admin_db < 04_seed_demo.sql
```

## Importantísimo

- **Haz backup antes** — los scripts son idempotentes pero alterables (ALTER TABLE y UPDATE).
- Los scripts **preservan TODAS** las tablas existentes (plantas, document_templates, configuracion_app, clientes con sus tarifas, etc).
- **Requieren MySQL 8.0+** o MariaDB 10.0.5+ por `REGEXP_REPLACE`.
- Tras ejecutar, **revisa las queries de auditoría** al final del script `02_migration.sql` para identificar los casos que no hicieron match automático (lubricantes con variantes de nombres exóticos, principalmente).

## Qué se preserva sin tocar

- `clientes` y sus 24 campos financieros (tarifas, dietas, peajes, km, precio_km, logo, etc.)
- `plantas` con su relación cliente → planta → sistema
- `sistemas` incluyendo `planta_id` y el ya existente cliente "xx" (id=3)
- `configuracion_app` con los 17 pares KV (empresa, recargos, festivos, comunidad autónoma)
- `document_templates` + `versiones_template` — plantillas de informes
- `usuarios` con `microsoft_id` y rol
- `modelos_componente.niveles` (CSV) — se conserva + se espeja en tabla normalizada
- `compatibilidad_controlador` — se conservan los 7.605 registros actuales

## Siguiente paso recomendado

Pasar el **`05_RESUMEN_CAMBIOS.md`** a Claude Code en la sesión de frontend. Contiene:
- Checklist de páginas/formularios a adaptar con prioridades (§7.1)
- Endpoints API nuevos con sus contratos (§7.2)
- Ejemplo de modelo Prisma actualizado (§7.3)
- Pseudocódigo del validador de compatibilidad sistema (§5.4) — servicio backend crítico
- Reglas de compatibilidad codificadas (§5.3) — para tests unitarios
- Orden de rollback (§8.3) — por si aparece algo en producción
