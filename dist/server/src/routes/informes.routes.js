"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findManuales = findManuales;
exports.resolveManualPath = resolveManualPath;
const express_1 = require("express");
const role_middleware_1 = require("../middleware/role.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const database_1 = require("../config/database");
const informes_validation_1 = require("../validation/informes.validation");
const initDatos_1 = require("../lib/initDatos");
const assembleReport_1 = require("../lib/assembleReport");
const generateTemplate_1 = require("../lib/generateTemplate");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
// ===== Manuales (servidos CON LOGIN desde una carpeta privada del servidor) =====
const MANUALES_DIR = (() => {
    if (process.env.MANUALES_DIR)
        return process.env.MANUALES_DIR;
    // Subir desde __dirname hasta el package.json del proyecto (app/ en local; nodejs/ en el server,
    // que en el build está MUCHOS niveles por encima de dist/server/src/routes). El buscador anterior
    // solo miraba 3 niveles fijos → en producción no llegaba a nodejs/ y MANUALES_DIR apuntaba mal.
    let d = __dirname;
    for (let i = 0; i < 10; i++) {
        if (node_fs_1.default.existsSync(node_path_1.default.join(d, 'package.json')))
            break;
        const parent = node_path_1.default.dirname(d);
        if (parent === d)
            break;
        d = parent;
    }
    return node_path_1.default.join(d, '..', 'manuales');
})();
const BRANCH_BY_TIPO = {
    mechanical_unit: 'Manipuladores', controller: 'Controladoras', drive_unit: 'Controladoras', external_axis: 'EjesExternos',
};
/** Raíz de las ramas: admite manuales/<rama> o manuales/ABB Manuals/<rama>. */
function manualesBranchRoot() {
    for (const c of [MANUALES_DIR, node_path_1.default.join(MANUALES_DIR, 'ABB Manuals')]) {
        try {
            if (node_fs_1.default.existsSync(node_path_1.default.join(c, 'Manipuladores')))
                return c;
        }
        catch { /* noop */ }
    }
    return MANUALES_DIR;
}
function normNombre(s) { return s.toUpperCase().replace(/[^A-Z0-9]/g, ''); }
/** "Tipo/familia" del modelo para ejes externos: letras iniciales (IRBT, IRBP, IRP, IRT, MID, MTD, MU...). */
function tipoToken(s) { const m = s.toUpperCase().match(/^[A-Z]+/); return m ? m[0] : ''; }
/**
 * Todos los manuales que ayudan a un modelo. La estructura NO es uniforme:
 *  - Manipuladores/Controladoras: subcarpeta por modelo (nombre = prefijo del modelo) → todos sus PDFs.
 *  - EjesExternos: PDFs sueltos en la raíz de la rama → se casan por familia (tipo: IRBT, IRBP, IRP...).
 *  - Generales (lubricación/gearbox) en la raíz de Manipuladores → para toda unidad mecánica.
 * Devuelve rutas relativas a la raíz de manuales (para servir luego por `ruta`, anti-traversal).
 */
function findManuales(modeloNombre, tipo) {
    const root = manualesBranchRoot();
    const branch = BRANCH_BY_TIPO[tipo] || 'Manipuladores';
    const branchDir = node_path_1.default.join(root, branch);
    if (!node_fs_1.default.existsSync(branchDir))
        return [];
    const nm = normNombre(modeloNombre);
    const tok = normNombre(tipoToken(modeloNombre));
    const out = [];
    const add = (full, general = false) => out.push({ nombre: node_path_1.default.basename(full), ruta: node_path_1.default.relative(root, full), general });
    let entries;
    try {
        entries = node_fs_1.default.readdirSync(branchDir, { withFileTypes: true });
    }
    catch {
        return [];
    }
    const isPdf = (n) => n.toLowerCase().endsWith('.pdf');
    // 1) Subcarpeta del modelo (coincidencia de prefijo más larga) → todos sus PDFs.
    let bestDir = null, bestLen = 0;
    for (const e of entries) {
        if (!e.isDirectory())
            continue;
        const nf = normNombre(e.name);
        if (nf && nm.startsWith(nf) && nf.length > bestLen) {
            bestDir = node_path_1.default.join(branchDir, e.name);
            bestLen = nf.length;
        }
    }
    if (bestDir) {
        try {
            for (const f of node_fs_1.default.readdirSync(bestDir))
                if (isPdf(f))
                    add(node_path_1.default.join(bestDir, f));
        }
        catch { /* noop */ }
    }
    // 2) PDFs sueltos en la raíz de la rama.
    for (const e of entries) {
        if (!e.isFile() || !isPdf(e.name))
            continue;
        const fn = normNombre(e.name);
        const esGeneral = fn.includes('LUBRICATION') || fn.includes('GEARBOX');
        if (branch === 'Manipuladores' && esGeneral) {
            add(node_path_1.default.join(branchDir, e.name), true);
            continue;
        }
        // Ejes externos (y similares): casar por familia/tipo presente en el nombre del fichero.
        if (branch === 'EjesExternos' && tok.length >= 2 && fn.includes(tok)) {
            add(node_path_1.default.join(branchDir, e.name));
        }
    }
    // Dedup por ruta.
    const seen = new Set();
    return out.filter((m) => (seen.has(m.ruta) ? false : (seen.add(m.ruta), true)));
}
/** Resuelve y valida una ruta de manual (relativa a la raíz de manuales) para servirla. Anti-traversal. */
function resolveManualPath(ruta) {
    if (!ruta || ruta.includes('..') || ruta.includes('\0'))
        return null;
    const root = node_path_1.default.resolve(manualesBranchRoot());
    const full = node_path_1.default.resolve(root, ruta);
    if (!full.startsWith(root + node_path_1.default.sep) || !full.toLowerCase().endsWith('.pdf'))
        return null;
    try {
        return node_fs_1.default.existsSync(full) ? full : null;
    }
    catch {
        return null;
    }
}
async function modeloDeComponenteInforme(ciId) {
    const ci = await database_1.prisma.componenteInforme.findUnique({
        where: { id: ciId },
        select: { componenteSistema: { select: { modeloComponente: { select: { nombre: true, tipo: true } } } } },
    });
    const m = ci?.componenteSistema?.modeloComponente;
    return m ? { nombre: m.nombre, tipo: m.tipo } : null;
}
const router = (0, express_1.Router)();
// ================================================================
// POST /intervenciones/:intervencionId/informes
// Admin only. Atomic: creates one Informe per sistema, one
// ComponenteInforme per ComponenteSistema in that sistema.
// ================================================================
router.post('/intervenciones/:intervencionId/informes', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const intervencionId = Number(req.params.intervencionId);
        const user = (0, auth_middleware_1.getAuthUser)(req);
        const intervencion = await database_1.prisma.intervencion.findUnique({
            where: { id: intervencionId },
            include: {
                sistemas: {
                    include: {
                        sistema: {
                            include: {
                                componentes: {
                                    orderBy: { orden: 'asc' },
                                    include: {
                                        modeloComponente: {
                                            include: {
                                                versiones: {
                                                    where: { estado: 'activo' },
                                                    orderBy: { version: 'desc' },
                                                    take: 1,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                informes: { select: { sistemaId: true } },
            },
        });
        if (!intervencion) {
            res.status(404).json({ error: 'Intervencion no encontrada' });
            return;
        }
        // Idempotency: skip sistemas that already have informes
        const existingSistemaIds = new Set(intervencion.informes.map((i) => i.sistemaId));
        const sistemasToProcess = intervencion.sistemas.filter((is) => !existingSistemaIds.has(is.sistemaId));
        if (sistemasToProcess.length === 0) {
            res.status(409).json({
                error: 'Ya existen informes para todos los sistemas de esta intervencion',
            });
            return;
        }
        const created = await database_1.prisma.$transaction(async (tx) => {
            const results = [];
            for (const is of sistemasToProcess) {
                const sistema = is.sistema;
                const informe = await tx.informe.create({
                    data: {
                        intervencionId,
                        sistemaId: sistema.id,
                        estado: 'inactivo',
                        creadoPorId: user.id,
                    },
                });
                for (let i = 0; i < sistema.componentes.length; i++) {
                    const comp = sistema.componentes[i];
                    // Find active version; fallback to most recent if none active
                    let version = comp.modeloComponente.versiones[0];
                    if (!version) {
                        const fallback = await tx.versionTemplate.findFirst({
                            where: { modeloComponenteId: comp.modeloComponenteId },
                            orderBy: { version: 'desc' },
                        });
                        if (!fallback) {
                            console.warn(`[informes] No hay version de template para modeloComponenteId=${comp.modeloComponenteId}. Componente ${comp.etiqueta} omitido.`);
                            continue;
                        }
                        console.warn(`[informes] Sin version activa para modeloComponenteId=${comp.modeloComponenteId}. Usando version ${fallback.version} (${fallback.estado}).`);
                        version = fallback;
                    }
                    const schemaCongelado = version.schema;
                    const datos = (0, initDatos_1.initDatos)(schemaCongelado);
                    await tx.componenteInforme.create({
                        data: {
                            informeId: informe.id,
                            componenteSistemaId: comp.id,
                            versionTemplateId: version.id,
                            tipoComponente: comp.tipo,
                            etiqueta: comp.etiqueta,
                            orden: i,
                            schemaCongelado: schemaCongelado,
                            datos: datos,
                        },
                    });
                }
                results.push(informe);
            }
            return results;
        });
        res.status(201).json({ created: created.length, informes: created });
    }
    catch (err) {
        next(err);
    }
});
// ================================================================
// GET /informes/:id
// Any authenticated user. Returns full informe with components.
// ================================================================
router.get('/informes/:id', async (req, res, next) => {
    try {
        const informe = await database_1.prisma.informe.findUnique({
            where: { id: Number(req.params.id) },
            include: {
                intervencion: {
                    select: {
                        id: true, titulo: true, tipo: true, estado: true,
                        referencia: true, fechaInicio: true, fechaFin: true,
                        cliente: {
                            select: {
                                id: true, nombre: true, sede: true,
                                direccion: true, ciudad: true, codigoPostal: true,
                                provincia: true, telefono: true, email: true,
                                personaContacto: true,
                            },
                        },
                    },
                },
                sistema: {
                    select: {
                        id: true,
                        nombre: true,
                        descripcion: true,
                        linea: true,
                        denominacion: true,
                        fabricante: { select: { id: true, nombre: true } },
                        maquina: { select: { id: true, nombre: true } },
                    },
                },
                creadoPor: { select: { id: true, nombre: true } },
                componentes: {
                    orderBy: { orden: 'asc' },
                    include: {
                        componenteSistema: {
                            select: {
                                id: true,
                                etiqueta: true,
                                tipo: true,
                                numeroSerie: true,
                                numEjes: true,
                                modeloComponente: {
                                    select: { id: true, nombre: true, tipo: true },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!informe) {
            res.status(404).json({ error: 'Informe no encontrado' });
            return;
        }
        res.json(informe);
    }
    catch (err) {
        next(err);
    }
});
// ================================================================
// GET /informes/:id/assembled
// Any authenticated user. Returns the fully assembled report
// merging document template + component frozen schemas.
// ================================================================
router.get('/informes/:id/assembled', async (req, res, next) => {
    try {
        const informeId = Number(req.params.id);
        // Fetch informe with full context for placeholder resolution
        const informe = await database_1.prisma.informe.findUnique({
            where: { id: informeId },
            include: {
                intervencion: {
                    select: {
                        id: true, titulo: true, tipo: true, estado: true,
                        referencia: true, fechaInicio: true, fechaFin: true,
                        cliente: {
                            select: {
                                id: true, nombre: true, sede: true,
                                direccion: true, ciudad: true, codigoPostal: true,
                                provincia: true, telefono: true, email: true,
                                personaContacto: true,
                            },
                        },
                    },
                },
                sistema: {
                    select: {
                        id: true,
                        nombre: true,
                        descripcion: true,
                        linea: true,
                        denominacion: true,
                        fabricante: { select: { id: true, nombre: true } },
                        maquina: { select: { id: true, nombre: true } },
                    },
                },
                creadoPor: { select: { id: true, nombre: true } },
                componentes: {
                    orderBy: { orden: 'asc' },
                    include: {
                        componenteSistema: {
                            select: {
                                id: true,
                                etiqueta: true,
                                tipo: true,
                                numeroSerie: true,
                                numEjes: true,
                                modeloComponente: {
                                    select: { id: true, nombre: true, tipo: true },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!informe) {
            res.status(404).json({ error: 'Informe no encontrado' });
            return;
        }
        // Determine document template type from intervencion tipo
        const docTipo = informe.intervencion.tipo === 'preventiva'
            ? 'preventivo'
            : 'correctivo';
        const documentTemplate = await database_1.prisma.documentTemplate.findUnique({
            where: { tipo: docTipo },
        });
        if (!documentTemplate) {
            res.status(422).json({
                error: `No se encontro plantilla de documento para tipo "${docTipo}"`,
            });
            return;
        }
        const documentSchema = documentTemplate.schema;
        // Build placeholder context (el usuario logueado se usa como técnico de PAS)
        const authUser = (0, auth_middleware_1.getAuthUser)(req);
        const usuario = authUser
            ? await database_1.prisma.user.findUnique({ where: { id: authUser.id }, select: { nombre: true, email: true } })
            : null;
        const baseContext = (0, assembleReport_1.buildPlaceholderContext)(informe, usuario ?? undefined);
        // Map component data for assembly
        const componentes = informe.componentes.map((c) => ({
            id: c.id,
            componenteSistemaId: c.componenteSistemaId,
            etiqueta: c.etiqueta,
            orden: c.orden,
            tipoComponente: c.tipoComponente,
            schemaCongelado: c.schemaCongelado,
            datos: c.datos || {},
            componenteSistema: c.componenteSistema,
        }));
        // Run assembly
        const assembled = (0, assembleReport_1.assembleReport)({
            documentSchema,
            componentes,
            baseContext,
            datosDocumento: informe.datosDocumento || {},
        });
        res.json({
            informe: {
                id: informe.id,
                estado: informe.estado,
                intervencion: {
                    id: informe.intervencion.id,
                    titulo: informe.intervencion.titulo,
                    tipo: informe.intervencion.tipo,
                    referencia: informe.intervencion.referencia,
                    fechaInicio: informe.intervencion.fechaInicio,
                },
                sistema: {
                    id: informe.sistema.id,
                    nombre: informe.sistema.nombre,
                    fabricante: informe.sistema.fabricante,
                    maquina: informe.sistema.maquina,
                },
            },
            assembled,
            documentTemplate: {
                id: documentTemplate.id,
                tipo: documentTemplate.tipo,
                nombre: documentTemplate.nombre,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
// ================================================================
// PATCH /componentes-informe/:id/datos
// Technician or admin. Shallow-merges incoming datos.
// ================================================================
router.patch('/componentes-informe/:id/datos', async (req, res, next) => {
    try {
        const { datos: incoming } = informes_validation_1.updateDatosComponenteSchema.parse(req.body);
        const id = Number(req.params.id);
        const existing = await database_1.prisma.componenteInforme.findUnique({
            where: { id },
        });
        if (!existing) {
            res.status(404).json({ error: 'Componente de informe no encontrado' });
            return;
        }
        const merged = {
            ...existing.datos,
            ...incoming,
        };
        const updated = await database_1.prisma.componenteInforme.update({
            where: { id },
            data: { datos: merged },
        });
        res.json(updated);
    }
    catch (err) {
        next(err);
    }
});
// ================================================================
// GET /componentes-informe/:id/manuales         — TODOS los manuales que ayudan al modelo (con login)
// GET /componentes-informe/:id/manual?ruta=...  — sirve un PDF por su ruta (con login, anti-traversal)
// ================================================================
router.get('/componentes-informe/:id/manuales', async (req, res, next) => {
    try {
        const modelo = await modeloDeComponenteInforme(Number(req.params.id));
        if (!modelo) {
            res.status(404).json({ error: 'Componente no encontrado' });
            return;
        }
        const manuales = findManuales(modelo.nombre, modelo.tipo);
        res.json({ modelo: modelo.nombre, manuales });
    }
    catch (err) {
        next(err);
    }
});
router.get('/componentes-informe/:id/manual', async (req, res, next) => {
    try {
        const ruta = String(req.query.ruta || req.query.archivo || '');
        const filePath = resolveManualPath(ruta);
        if (!filePath) {
            res.status(404).json({ error: 'Manual no encontrado' });
            return;
        }
        // sendFile soporta Range requests (Accept-Ranges) → el navegador renderiza por streaming/seek,
        // mucho más rápido que descargar el PDF entero antes de abrirlo.
        res.sendFile(filePath, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${encodeURIComponent(node_path_1.default.basename(filePath))}"`,
            },
        }, (err) => { if (err && !res.headersSent)
            next(err); });
    }
    catch (err) {
        next(err);
    }
});
// ================================================================
// PATCH /informes/:id/datos-documento
// Technician or admin. Shallow-merges incoming document-level datos.
// ================================================================
router.patch('/informes/:id/datos-documento', async (req, res, next) => {
    try {
        const { datos: incoming } = informes_validation_1.updateDatosComponenteSchema.parse(req.body);
        const id = Number(req.params.id);
        const existing = await database_1.prisma.informe.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ error: 'Informe no encontrado' });
            return;
        }
        const merged = {
            ...(existing.datosDocumento || {}),
            ...incoming,
        };
        const updated = await database_1.prisma.informe.update({
            where: { id },
            data: { datosDocumento: merged },
        });
        res.json({ id: updated.id, datosDocumento: updated.datosDocumento });
    }
    catch (err) {
        next(err);
    }
});
// ================================================================
// PATCH /informes/:id/estado
// Admin only. Changes informe estado.
// ================================================================
router.patch('/informes/:id/estado', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const { estado } = informes_validation_1.updateEstadoInformeSchema.parse(req.body);
        const informe = await database_1.prisma.informe.update({
            where: { id: Number(req.params.id) },
            data: { estado },
        });
        res.json(informe);
    }
    catch (err) {
        next(err);
    }
});
// Campos de fila que vienen de la plantilla (fijos/identidad), NO editables por el técnico.
// Al regenerar se RE-SIEMBRAN desde el schema nuevo (así un `eje` que quedó "NaN" en datos
// viejos se corrige). El resto (control, cambio, na/bien/mal, observaciones…) se preserva.
const FIXED_ROW_KEYS = ['eje', 'operacion', 'bateria', 'referencia', 'tipoSuministro', 'aceiteId', 'unidad', 'volumen', 'niveles', 'lifetime', '_valor'];
/** Funde un array de filas: campos FIJOS desde la plantilla nueva (`fresh`), resto del dato viejo. */
function mergeRowArray(fresh, old) {
    if (!Array.isArray(old))
        return fresh;
    return fresh.map((fr, i) => {
        const ol = old[i];
        if (fr && typeof fr === 'object' && ol && typeof ol === 'object') {
            const row = { ...ol };
            const frObj = fr;
            for (const key of FIXED_ROW_KEYS)
                if (key in frObj)
                    row[key] = frObj[key];
            return row;
        }
        return ol ?? fr;
    });
}
/** Re-inicializa datos para el nuevo schema, preservando lo EDITABLE del viejo; en arrays de filas
 *  re-siembra los campos fijos desde el schema nuevo (corrige p.ej. ejes 'NaN' heredados en datos). */
function regenDatos(schema, old) {
    const fresh = (0, initDatos_1.initDatos)(schema);
    const merged = { ...fresh };
    for (const k of Object.keys(fresh)) {
        if (!(k in old))
            continue;
        merged[k] = Array.isArray(fresh[k]) ? mergeRowArray(fresh[k], old[k]) : old[k];
    }
    return merged;
}
async function pickVersion(modeloComponenteId, versionTemplateId) {
    if (versionTemplateId) {
        return database_1.prisma.versionTemplate.findUnique({ where: { id: Number(versionTemplateId) } });
    }
    return ((await database_1.prisma.versionTemplate.findFirst({
        where: { modeloComponenteId, estado: 'activo' },
        orderBy: { version: 'desc' },
    })) ??
        (await database_1.prisma.versionTemplate.findFirst({
            where: { modeloComponenteId },
            orderBy: { version: 'desc' },
        })));
}
// GET /componentes-informe/:id/versiones — plantillas disponibles para el modelo del componente
router.get('/componentes-informe/:id/versiones', async (req, res, next) => {
    try {
        const ci = await database_1.prisma.componenteInforme.findUnique({
            where: { id: Number(req.params.id) },
            include: { componenteSistema: { select: { modeloComponenteId: true } } },
        });
        if (!ci) {
            res.status(404).json({ error: 'Componente de informe no encontrado' });
            return;
        }
        const versiones = await database_1.prisma.versionTemplate.findMany({
            where: { modeloComponenteId: ci.componenteSistema.modeloComponenteId },
            orderBy: { version: 'desc' },
            select: { id: true, version: true, estado: true, notas: true, createdAt: true },
        });
        res.json({ actual: ci.versionTemplateId, versiones });
    }
    catch (err) {
        next(err);
    }
});
// POST /componentes-informe/:id/regenerar — regenera schema/datos desde una version (o la activa/ultima)
router.post('/componentes-informe/:id/regenerar', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const ci = await database_1.prisma.componenteInforme.findUnique({
            where: { id },
            include: {
                informe: { select: { estado: true } },
                componenteSistema: { select: { modeloComponenteId: true } },
            },
        });
        if (!ci) {
            res.status(404).json({ error: 'Componente de informe no encontrado' });
            return;
        }
        if (ci.informe.estado === 'finalizado') {
            res.status(409).json({ error: 'No se puede regenerar un informe finalizado' });
            return;
        }
        const version = await pickVersion(ci.componenteSistema.modeloComponenteId, req.body?.versionTemplateId);
        if (!version) {
            res.status(404).json({ error: 'No hay version de plantilla para este modelo' });
            return;
        }
        const schema = version.schema;
        const datos = regenDatos(schema, ci.datos || {});
        const updated = await database_1.prisma.componenteInforme.update({
            where: { id },
            data: { versionTemplateId: version.id, schemaCongelado: schema, datos: datos },
        });
        res.json({ id: updated.id, versionTemplateId: version.id, version: version.version });
    }
    catch (err) {
        next(err);
    }
});
// POST /informes/:id/regenerar — regenera TODOS los componentes a su version activa/ultima
router.post('/informes/:id/regenerar', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const informeId = Number(req.params.id);
        const informe = await database_1.prisma.informe.findUnique({
            where: { id: informeId },
            include: { componentes: { include: { componenteSistema: { select: { modeloComponenteId: true } } } } },
        });
        if (!informe) {
            res.status(404).json({ error: 'Informe no encontrado' });
            return;
        }
        if (informe.estado === 'finalizado') {
            res.status(409).json({ error: 'No se puede regenerar un informe finalizado' });
            return;
        }
        // desdePlan=true: regenera la plantilla desde el plan de mantenimiento y la
        // sobreescribe EN SITIO (version activa o mas reciente) antes de bajarla al
        // informe. Asi un solo clic en "Actualizar plantillas" aplica las mejoras del
        // generador (colores, tablas, fix del NaN) sin pasar antes por Modelos.
        const desdePlan = req.body?.desdePlan === true;
        let regenerados = 0;
        const fallosPlan = [];
        for (const ci of informe.componentes) {
            const modeloId = ci.componenteSistema.modeloComponenteId;
            let version = null;
            if (desdePlan) {
                try {
                    const fresh = await (0, generateTemplate_1.generateTemplateForModel)(database_1.prisma, modeloId);
                    const activa = await database_1.prisma.versionTemplate.findFirst({
                        where: { modeloComponenteId: modeloId, estado: 'activo' },
                        orderBy: { version: 'desc' },
                    });
                    const target = activa ?? await database_1.prisma.versionTemplate.findFirst({
                        where: { modeloComponenteId: modeloId },
                        orderBy: { version: 'desc' },
                    });
                    version = target
                        ? await database_1.prisma.versionTemplate.update({ where: { id: target.id }, data: { schema: fresh } })
                        : await database_1.prisma.versionTemplate.create({
                            data: { modeloComponenteId: modeloId, version: 1, schema: fresh, estado: 'activo', notas: 'Regenerada desde el plan' },
                        });
                }
                catch (e) {
                    const msg = e?.message ?? String(e);
                    console.error(`[regenerar desdePlan] generación falló para modelo ${modeloId}: ${msg}`);
                    fallosPlan.push({ modeloId, error: msg });
                    version = null;
                }
            }
            if (!version)
                version = await pickVersion(modeloId);
            if (!version)
                continue;
            const schema = version.schema;
            const datos = regenDatos(schema, ci.datos || {});
            await database_1.prisma.componenteInforme.update({
                where: { id: ci.id },
                data: { versionTemplateId: version.id, schemaCongelado: schema, datos: datos },
            });
            regenerados++;
        }
        res.json({ regenerados, total: informe.componentes.length, fallosPlan });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=informes.routes.js.map