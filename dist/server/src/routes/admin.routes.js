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
exports.default = router;
//# sourceMappingURL=admin.routes.js.map