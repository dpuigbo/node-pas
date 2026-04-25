"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const role_middleware_1 = require("../middleware/role.middleware");
const database_1 = require("../config/database");
const sistemas_validation_1 = require("../validation/sistemas.validation");
const router = (0, express_1.Router)();
// ===== SISTEMAS =====
// GET /api/v1/sistemas
router.get('/', async (req, res, next) => {
    try {
        const where = {};
        if (req.query.clienteId)
            where.clienteId = Number(req.query.clienteId);
        if (req.query.maquinaId)
            where.maquinaId = Number(req.query.maquinaId);
        const sistemas = await database_1.prisma.sistema.findMany({
            where,
            orderBy: { nombre: 'asc' },
            include: {
                cliente: { select: { id: true, nombre: true } },
                maquina: { select: { id: true, nombre: true } },
                fabricante: { select: { id: true, nombre: true } },
                _count: { select: { componentes: true } },
            },
        });
        res.json(sistemas);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/sistemas/:id
router.get('/:id', async (req, res, next) => {
    try {
        const sistema = await database_1.prisma.sistema.findUnique({
            where: { id: Number(req.params.id) },
            include: {
                cliente: { select: { id: true, nombre: true } },
                maquina: { select: { id: true, nombre: true } },
                fabricante: { select: { id: true, nombre: true } },
                componentes: {
                    orderBy: { orden: 'asc' },
                    include: {
                        modeloComponente: {
                            select: { id: true, nombre: true, tipo: true },
                        },
                    },
                },
            },
        });
        if (!sistema) {
            res.status(404).json({ error: 'Sistema no encontrado' });
            return;
        }
        res.json(sistema);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/sistemas (admin)
router.post('/', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const data = sistemas_validation_1.createSistemaSchema.parse(req.body);
        const sistema = await database_1.prisma.sistema.create({
            data,
            include: {
                cliente: { select: { id: true, nombre: true } },
                fabricante: { select: { id: true, nombre: true } },
            },
        });
        res.status(201).json(sistema);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/sistemas/completo (admin) — wizard: create sistema + all components atomically
router.post('/completo', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const { componentes, ...sistemaData } = sistemas_validation_1.createSistemaCompletoSchema.parse(req.body);
        const sistema = await database_1.prisma.$transaction(async (tx) => {
            // 1. Create the sistema
            const newSistema = await tx.sistema.create({ data: sistemaData });
            // 2. Crear componentes en 2 pases:
            //    - Pase 1: padres (sin padreTempId)
            //    - Pase 2: hijos (con padreTempId resuelto al id real)
            const tempIdToReal = new Map();
            for (const pass of [1, 2]) {
                for (const comp of componentes) {
                    const isHijo = !!comp.padreTempId;
                    if ((pass === 1 && isHijo) || (pass === 2 && !isHijo))
                        continue;
                    const padreId = comp.padreTempId ? tempIdToReal.get(comp.padreTempId) ?? null : null;
                    const created = await tx.componenteSistema.create({
                        data: {
                            sistemaId: newSistema.id,
                            modeloComponenteId: comp.modeloComponenteId,
                            tipo: comp.tipo,
                            etiqueta: comp.etiqueta,
                            numeroSerie: comp.numeroSerie ?? null,
                            numEjes: comp.numEjes ?? null,
                            orden: comp.orden,
                            componentePadreId: padreId,
                        },
                    });
                    if (comp.tempId)
                        tempIdToReal.set(comp.tempId, created.id);
                }
            }
            return tx.sistema.findUnique({
                where: { id: newSistema.id },
                include: {
                    cliente: { select: { id: true, nombre: true } },
                    fabricante: { select: { id: true, nombre: true } },
                    componentes: {
                        orderBy: { orden: 'asc' },
                        include: { modeloComponente: { select: { id: true, nombre: true, tipo: true } } },
                    },
                },
            });
        });
        res.status(201).json(sistema);
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/v1/sistemas/:id/completo (admin) — wizard: update sistema + replace all components atomically
router.put('/:id/completo', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const sistemaId = Number(req.params.id);
        const { componentes, ...sistemaData } = sistemas_validation_1.createSistemaCompletoSchema.parse(req.body);
        const sistema = await database_1.prisma.$transaction(async (tx) => {
            // 1. Update the sistema
            await tx.sistema.update({
                where: { id: sistemaId },
                data: {
                    nombre: sistemaData.nombre,
                    descripcion: sistemaData.descripcion ?? null,
                    fabricanteId: sistemaData.fabricanteId,
                },
            });
            // 2. Delete all existing components
            await tx.componenteSistema.deleteMany({ where: { sistemaId } });
            // 3. Recreate all components (2 pases para resolver padreTempId)
            const tempIdToReal = new Map();
            for (const pass of [1, 2]) {
                for (const comp of componentes) {
                    const isHijo = !!comp.padreTempId;
                    if ((pass === 1 && isHijo) || (pass === 2 && !isHijo))
                        continue;
                    const padreId = comp.padreTempId ? tempIdToReal.get(comp.padreTempId) ?? null : null;
                    const created = await tx.componenteSistema.create({
                        data: {
                            sistemaId,
                            modeloComponenteId: comp.modeloComponenteId,
                            tipo: comp.tipo,
                            etiqueta: comp.etiqueta,
                            numeroSerie: comp.numeroSerie ?? null,
                            numEjes: comp.numEjes ?? null,
                            orden: comp.orden,
                            componentePadreId: padreId,
                        },
                    });
                    if (comp.tempId)
                        tempIdToReal.set(comp.tempId, created.id);
                }
            }
            // 4. Return with full includes
            return tx.sistema.findUnique({
                where: { id: sistemaId },
                include: {
                    cliente: { select: { id: true, nombre: true } },
                    fabricante: { select: { id: true, nombre: true } },
                    componentes: {
                        orderBy: { orden: 'asc' },
                        include: { modeloComponente: { select: { id: true, nombre: true, tipo: true } } },
                    },
                },
            });
        });
        if (!sistema) {
            res.status(404).json({ error: 'Sistema no encontrado' });
            return;
        }
        res.json(sistema);
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/v1/sistemas/:id (admin)
router.put('/:id', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const data = sistemas_validation_1.updateSistemaSchema.parse(req.body);
        const sistema = await database_1.prisma.sistema.update({
            where: { id: Number(req.params.id) },
            data,
        });
        res.json(sistema);
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/v1/sistemas/:id (admin)
router.delete('/:id', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        await database_1.prisma.sistema.delete({ where: { id: Number(req.params.id) } });
        res.json({ message: 'Sistema eliminado' });
    }
    catch (err) {
        next(err);
    }
});
// ===== COMPONENTES SISTEMA (nested under sistema) =====
// GET /api/v1/sistemas/:sistemaId/componentes
router.get('/:sistemaId/componentes', async (req, res, next) => {
    try {
        const componentes = await database_1.prisma.componenteSistema.findMany({
            where: { sistemaId: Number(req.params.sistemaId) },
            orderBy: { orden: 'asc' },
            include: {
                modeloComponente: {
                    select: { id: true, nombre: true, tipo: true, fabricanteId: true },
                    include: { fabricante: { select: { nombre: true } } },
                },
            },
        });
        res.json(componentes);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/sistemas/:sistemaId/componentes (admin)
router.post('/:sistemaId/componentes', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const data = sistemas_validation_1.createComponenteSchema.parse(req.body);
        const componente = await database_1.prisma.componenteSistema.create({
            data: { ...data, sistemaId: Number(req.params.sistemaId) },
        });
        res.status(201).json(componente);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/sistemas/:sistemaId/componentes/robot-con-du (admin)
// Adds a robot + auto-creates a drive unit in a single transaction
router.post('/:sistemaId/componentes/robot-con-du', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const sistemaId = Number(req.params.sistemaId);
        const data = sistemas_validation_1.createComponenteSchema.parse(req.body);
        if (data.tipo !== 'mechanical_unit') {
            res.status(400).json({ error: 'Este endpoint es solo para unidades mecanicas' });
            return;
        }
        // Count existing components to set orden
        const count = await database_1.prisma.componenteSistema.count({ where: { sistemaId } });
        await database_1.prisma.$transaction(async (tx) => {
            // Create the drive unit first
            await tx.componenteSistema.create({
                data: {
                    sistemaId,
                    modeloComponenteId: data.modeloComponenteId, // same modelo for now, DU is virtual
                    tipo: 'drive_unit',
                    etiqueta: `DU - ${data.etiqueta}`,
                    orden: count,
                },
            });
            // Create the robot
            await tx.componenteSistema.create({
                data: {
                    ...data,
                    sistemaId,
                    orden: count + 1,
                },
            });
        });
        // Return updated component list
        const componentes = await database_1.prisma.componenteSistema.findMany({
            where: { sistemaId },
            orderBy: { orden: 'asc' },
            include: { modeloComponente: { select: { id: true, nombre: true, tipo: true } } },
        });
        res.status(201).json(componentes);
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/v1/sistemas/:sistemaId/componentes/:componenteId (admin)
router.put('/:sistemaId/componentes/:componenteId', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const data = sistemas_validation_1.updateComponenteSchema.parse(req.body);
        const componente = await database_1.prisma.componenteSistema.update({
            where: { id: Number(req.params.componenteId) },
            data,
        });
        res.json(componente);
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/v1/sistemas/:sistemaId/componentes/:componenteId (admin)
router.delete('/:sistemaId/componentes/:componenteId', (0, role_middleware_1.requireRole)('admin'), async (req, res, next) => {
    try {
        await database_1.prisma.componenteSistema.delete({ where: { id: Number(req.params.componenteId) } });
        res.json({ message: 'Componente eliminado' });
    }
    catch (err) {
        next(err);
    }
});
// ===== COMPATIBILIDAD EJES EXTERNOS (tri-vía v2) =====
// GET /api/v1/sistemas/ejes-compatibles?controladorId=X&robotModeloId=Y
// (alternativa legacy: &robotFamiliaId=Y)
// Devuelve solo los ejes externos compatibles con esa combinacion segun:
//   1. compatibilidad_controlador (basico controlador↔eje)
//   2. compatibilidad_eje_permitida (whitelist familias robot)
//   3. compatibilidad_eje_excluye (blacklist familias robot)
//   4. compatibilidad_eje_controlador (whitelist controladores)
router.get('/ejes-compatibles', async (req, res, next) => {
    try {
        const controladorId = req.query.controladorId ? Number(req.query.controladorId) : undefined;
        const robotModeloId = req.query.robotModeloId ? Number(req.query.robotModeloId) : undefined;
        let robotFamiliaId = req.query.robotFamiliaId ? Number(req.query.robotFamiliaId) : undefined;
        if (!controladorId) {
            res.status(400).json({ error: 'controladorId es obligatorio' });
            return;
        }
        // Resolver familiaId desde el modelo del robot (mas robusto que confiar en frontend)
        if (!robotFamiliaId && robotModeloId) {
            const robot = await database_1.prisma.modeloComponente.findUnique({
                where: { id: robotModeloId },
                select: { familiaId: true },
            });
            robotFamiliaId = robot?.familiaId ?? undefined;
        }
        // 1. Ejes compatibles con la controladora (compatibilidad_controlador)
        const candidatos = await database_1.prisma.modeloComponente.findMany({
            where: {
                tipo: 'external_axis',
                controladoresCompatibles: { some: { controladorId } },
            },
            orderBy: [{ familia: 'asc' }, { nombre: 'asc' }],
            include: {
                fabricante: { select: { id: true, nombre: true } },
                compatEjePermitida: { select: { familiaId: true } },
                compatEjeExcluye: { select: { familiaId: true } },
                compatEjeControladorEje: { select: { controladorModeloId: true } },
            },
        });
        // 2. Aplicar reglas tri-vía
        const compatibles = candidatos.filter((eje) => {
            // Whitelist de familias robot
            if (eje.compatEjePermitida.length > 0) {
                if (!robotFamiliaId)
                    return false; // si hay whitelist, necesitamos saber familia
                if (!eje.compatEjePermitida.some(p => p.familiaId === robotFamiliaId))
                    return false;
            }
            // Blacklist de familias robot
            if (robotFamiliaId && eje.compatEjeExcluye.some(e => e.familiaId === robotFamiliaId)) {
                return false;
            }
            // Whitelist de controladores
            if (eje.compatEjeControladorEje.length > 0) {
                if (!eje.compatEjeControladorEje.some(c => c.controladorModeloId === controladorId)) {
                    return false;
                }
            }
            return true;
        });
        // Stripear las relaciones tri-via del response (solo informacion)
        const result = compatibles.map(({ compatEjePermitida, compatEjeExcluye, compatEjeControladorEje, ...rest }) => rest);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/sistemas/ejes/:ejeModeloId/compatibilidad?robotFamiliaId=X&controladorModeloId=Y
router.get('/ejes/:ejeModeloId/compatibilidad', async (req, res, next) => {
    try {
        const ejeModeloId = Number(req.params.ejeModeloId);
        const robotFamiliaId = req.query.robotFamiliaId ? Number(req.query.robotFamiliaId) : undefined;
        const controladorModeloId = req.query.controladorModeloId ? Number(req.query.controladorModeloId) : undefined;
        // 1. Whitelist de familias
        const permitidas = await database_1.prisma.compatibilidadEjePermitida.findMany({
            where: { ejeModeloId },
            include: { familia: { select: { id: true, codigo: true } } },
        });
        if (permitidas.length > 0 && robotFamiliaId &&
            !permitidas.some(p => p.familiaId === robotFamiliaId)) {
            res.json({
                compatible: false,
                motivo: 'Familia de robot no permitida por el eje externo',
                familiasPermitidas: permitidas.map(p => p.familia),
            });
            return;
        }
        // 2. Blacklist de familias
        const excluidas = await database_1.prisma.compatibilidadEjeExcluye.findMany({
            where: { ejeModeloId },
            include: { familia: { select: { id: true, codigo: true } } },
        });
        if (robotFamiliaId && excluidas.some(e => e.familiaId === robotFamiliaId)) {
            res.json({
                compatible: false,
                motivo: 'Familia de robot excluida para este eje externo',
                familiasExcluidas: excluidas.map(e => e.familia),
            });
            return;
        }
        // 3. Whitelist de controladores
        const ctrlReq = await database_1.prisma.compatibilidadEjeControlador.findMany({
            where: { ejeModeloId },
            include: { controlador: { select: { id: true, nombre: true } } },
        });
        if (ctrlReq.length > 0 && controladorModeloId &&
            !ctrlReq.some(c => c.controladorModeloId === controladorModeloId)) {
            res.json({
                compatible: false,
                motivo: 'Eje requiere controlador específico',
                controladoresRequeridos: ctrlReq.map(c => c.controlador),
            });
            return;
        }
        res.json({
            compatible: true,
            reglas: {
                familiasPermitidas: permitidas.length > 0 ? permitidas.map(p => p.familia) : null,
                familiasExcluidas: excluidas.length > 0 ? excluidas.map(e => e.familia) : null,
                controladoresRequeridos: ctrlReq.length > 0 ? ctrlReq.map(c => c.controlador) : null,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=sistemas.routes.js.map