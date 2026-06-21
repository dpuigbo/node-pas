"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const node_fs_1 = require("node:fs");
const auth_middleware_1 = require("../middleware/auth.middleware");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
// Normaliza texto para agrupar casi-duplicados: minusculas, sin acentos, guiones unificados, espacios colapsados.
function norm(s) {
    return (s ?? '')
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[‐-―−]/g, '-')
        .replace(/\s+/g, ' ')
        .trim();
}
function parseModels(v) {
    let arr = v;
    if (typeof v === 'string') {
        try {
            arr = JSON.parse(v);
        }
        catch {
            return [];
        }
    }
    if (!Array.isArray(arr))
        return [];
    return arr.map((x) => Number(x)).filter((n) => Number.isInteger(n));
}
// POST /api/v1/admin/dedup-actividades  { apply?: boolean }  (solo admin)
// Fusiona actividades preventivas equivalentes (mismo tipo+componente+intervalo, normalizando texto):
// deja UNA canonica con la UNION de modelos_aplicables del grupo, fusiona sus consumibles y borra el resto.
// Sin apply => dry-run (devuelve el plan). Con apply => backup a fichero + fusiona.
router.post('/dedup-actividades', auth_middleware_1.adminMiddleware, async (req, res, next) => {
    try {
        const apply = req.body?.apply === true;
        const acts = (await database_1.prisma.actividadPreventiva.findMany({
            select: {
                id: true, tipoActividadId: true, componente: true,
                intervaloHoras: true, intervaloMeses: true, intervaloCondicion: true,
                modelosAplicables: true, consumibles: { select: { id: true, consumibleId: true } },
            },
        }));
        const groups = new Map();
        for (const a of acts) {
            const key = [a.tipoActividadId, norm(a.componente), a.intervaloHoras ?? 'n', a.intervaloMeses ?? 'n', a.intervaloCondicion].join('|');
            const g = groups.get(key);
            if (g)
                g.push(a);
            else
                groups.set(key, [a]);
        }
        const dupGroups = [...groups.values()].filter((g) => g.length > 1);
        const plan = dupGroups.map((g) => {
            const sorted = [...g].sort((a, b) => (parseModels(b.modelosAplicables).length - parseModels(a.modelosAplicables).length) ||
                ((b.componente?.length ?? 0) - (a.componente?.length ?? 0)) ||
                (a.id - b.id));
            const canon = sorted[0];
            const dups = sorted.slice(1);
            const union = [...new Set(g.flatMap((a) => parseModels(a.modelosAplicables)))];
            return { canon, dups, union, modelosAntes: parseModels(canon.modelosAplicables).length };
        });
        const summary = {
            totalActividades: acts.length,
            gruposDuplicados: dupGroups.length,
            actividadesABorrar: plan.reduce((s, p) => s + p.dups.length, 0),
        };
        if (!apply) {
            res.json({
                dryRun: true, summary,
                grupos: plan.map((p) => ({ canonId: p.canon.id, canon: p.canon.componente, borrar: p.dups.map((d) => d.id), modelos: `${p.modelosAntes}->${p.union.length}` })),
            });
            return;
        }
        const backupPath = `/home/u306143177/backup-dedup-act-${Date.now()}.json`;
        (0, node_fs_1.writeFileSync)(backupPath, JSON.stringify(dupGroups));
        let borradas = 0, consMovidos = 0, consBorrados = 0;
        for (const p of plan) {
            await database_1.prisma.actividadPreventiva.update({ where: { id: p.canon.id }, data: { modelosAplicables: p.union.map(String) } });
            const canonCons = new Set(p.canon.consumibles.map((c) => c.consumibleId));
            for (const d of p.dups) {
                for (const dc of d.consumibles) {
                    if (canonCons.has(dc.consumibleId)) {
                        await database_1.prisma.actividadConsumible.delete({ where: { id: dc.id } });
                        consBorrados++;
                    }
                    else {
                        await database_1.prisma.actividadConsumible.update({ where: { id: dc.id }, data: { actividadPreventivaId: p.canon.id } });
                        canonCons.add(dc.consumibleId);
                        consMovidos++;
                    }
                }
                await database_1.prisma.actividadPreventiva.delete({ where: { id: d.id } });
                borradas++;
            }
        }
        res.json({ applied: true, backupPath, summary, borradas, consMovidos, consBorrados });
    }
    catch (err) {
        next(err);
    }
});
// --- 2a pasada: merge de grupos CURADOS (ids explicitos) ---
// Cada grupo = actividades equivalentes (misma bateria/funcion + mismo intervalo, distinta redaccion),
// que NO comparten clave normalizada y por eso la 1a pasada no junto. Canonica = mas modelos (luego
// componente mas largo, luego id menor); une modelos, fusiona consumibles (arrastra todos), borra el resto.
// renameTo: renombra la canonica. preFix: borra links de consumible erroneos ANTES del merge.
const MERGE_GRUPOS = [
    // Tests de seguridad (tipo 23, 12 meses)
    { ids: [677, 788, 820] }, // Automatic Stop
    { ids: [678, 789, 821] }, // General Stop
    { ids: [790, 822] }, // External emergency stop
    { ids: [791, 823], renameTo: 'Emergency Stop' }, // ESTOP_STATUS -> Emergency Stop (Daniel)
    { ids: [674, 786, 818] }, // Dispositivo de habilitacion de 3 posiciones
    { ids: [787, 819] }, // Safety switches
    { ids: [672, 784, 816, 832] }, // Parada de emergencia FlexPendant
    // Brake checks / modos (tipo 28)
    { ids: [593, 617, 981] }, // Brake Check (sin SafeMove)
    { ids: [594, 618, 982] }, // Cyclic Brake Check (con SafeMove)
    { ids: [785, 817] }, // Test de modos Manual/Auto/Manual full speed
    // CMOS (tipo 27)
    { ids: [699, 824, 792, 869] }, // Pila CR2032 @ 60m
    // Baterias SMB (tipo 26)
    { ids: [530, 998, 471, 148, 1063, 188, 196, 73, 931, 23, 375, 433, 1036] }, // SMB 2-polos @ alerta baja
    { ids: [500, 470, 456, 997, 1062, 552, 72, 66, 932, 24, 421, 225, 977, 1037, 432] }, // SMB 3-polos @ 36m (incl. 432 corregida)
    { ids: [655, 579, 454, 1012] }, // Ni-Cd sistema de medida @ 36m
    { ids: [135, 603] }, // EIB @ alerta baja
];
const MERGE_PREFIX = [
    { actId: 432, dropConsumibleId: 217 }, // 432: error de extraccion (linkada a EIB; el texto dice 3-polos) -> quitar EIB
];
// POST /api/v1/admin/merge-grupos  { apply?: boolean }  (solo admin). Sin apply => dry-run.
router.post('/merge-grupos', auth_middleware_1.adminMiddleware, async (req, res, next) => {
    try {
        const apply = req.body?.apply === true;
        const allIds = [...new Set(MERGE_GRUPOS.flatMap((g) => g.ids))];
        const acts = (await database_1.prisma.actividadPreventiva.findMany({
            where: { id: { in: allIds } },
            select: { id: true, componente: true, modelosAplicables: true, consumibles: { select: { id: true, consumibleId: true } } },
        }));
        const byId = new Map(acts.map((a) => [a.id, a]));
        const plan = MERGE_GRUPOS.map((g) => {
            const members = g.ids.map((id) => byId.get(id)).filter(Boolean);
            const sorted = [...members].sort((a, b) => (parseModels(b.modelosAplicables).length - parseModels(a.modelosAplicables).length) ||
                ((b.componente?.length ?? 0) - (a.componente?.length ?? 0)) ||
                (a.id - b.id));
            const canon = sorted[0];
            const dups = sorted.slice(1);
            const union = [...new Set(members.flatMap((a) => parseModels(a.modelosAplicables)))];
            const faltan = g.ids.filter((id) => !byId.has(id));
            return { grupo: g, canon, dups, union, faltan };
        });
        const summary = {
            grupos: MERGE_GRUPOS.length,
            actividadesEntran: allIds.length,
            actividadesABorrar: plan.reduce((s, p) => s + p.dups.length, 0),
            faltan: plan.flatMap((p) => p.faltan),
        };
        if (!apply) {
            res.json({
                dryRun: true, summary,
                grupos: plan.map((p) => ({
                    canonId: p.canon?.id,
                    nombreFinal: p.grupo.renameTo ?? p.canon?.componente,
                    borrar: p.dups.map((d) => d.id),
                    modelos: `${parseModels(p.canon?.modelosAplicables).length}->${p.union.length}`,
                })),
            });
            return;
        }
        const backupPath = `/home/u306143177/backup-merge-grupos-${Date.now()}.json`;
        (0, node_fs_1.writeFileSync)(backupPath, JSON.stringify({ acts, grupos: MERGE_GRUPOS, prefix: MERGE_PREFIX }));
        let prefixBorrados = 0;
        for (const f of MERGE_PREFIX) {
            const a = byId.get(f.actId);
            if (!a)
                continue;
            for (const c of a.consumibles.filter((x) => x.consumibleId === f.dropConsumibleId)) {
                await database_1.prisma.actividadConsumible.delete({ where: { id: c.id } });
                a.consumibles = a.consumibles.filter((x) => x.id !== c.id);
                prefixBorrados++;
            }
        }
        let borradas = 0, consMovidos = 0, consBorrados = 0, renombradas = 0;
        for (const p of plan) {
            if (!p.canon)
                continue;
            await database_1.prisma.actividadPreventiva.update({
                where: { id: p.canon.id },
                data: { modelosAplicables: p.union.map(String), ...(p.grupo.renameTo ? { componente: p.grupo.renameTo } : {}) },
            });
            if (p.grupo.renameTo)
                renombradas++;
            const canonCons = new Set(p.canon.consumibles.map((c) => c.consumibleId));
            for (const d of p.dups) {
                for (const dc of d.consumibles) {
                    if (canonCons.has(dc.consumibleId)) {
                        await database_1.prisma.actividadConsumible.delete({ where: { id: dc.id } });
                        consBorrados++;
                    }
                    else {
                        await database_1.prisma.actividadConsumible.update({ where: { id: dc.id }, data: { actividadPreventivaId: p.canon.id } });
                        canonCons.add(dc.consumibleId);
                        consMovidos++;
                    }
                }
                await database_1.prisma.actividadPreventiva.delete({ where: { id: d.id } });
                borradas++;
            }
        }
        res.json({ applied: true, backupPath, summary, borradas, consMovidos, consBorrados, renombradas, prefixBorrados });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=admin.routes.js.map