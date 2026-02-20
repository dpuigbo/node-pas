"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PAGE_CONFIG = exports.MAINTENANCE_LEVEL_COLORS = exports.BLOCK_CATEGORY_LABELS = exports.BLOCK_CATEGORIES = exports.ROL = exports.TIPO_INTERVENCION_LABELS = exports.TIPO_INTERVENCION = exports.ESTADO_INFORME = exports.ESTADO_INTERVENCION_LABELS = exports.ESTADO_INTERVENCION = exports.ESTADO_TEMPLATE = exports.TIPO_COMPONENTE_LABELS = exports.TIPO_COMPONENTE = void 0;
// Tipos de componente
exports.TIPO_COMPONENTE = {
    CONTROLLER: 'controller',
    MECHANICAL_UNIT: 'mechanical_unit',
    DRIVE_UNIT: 'drive_unit',
};
exports.TIPO_COMPONENTE_LABELS = {
    controller: 'Controladora',
    mechanical_unit: 'Unidad Mecanica',
    drive_unit: 'Drive Unit',
};
// Estados de template
exports.ESTADO_TEMPLATE = {
    BORRADOR: 'borrador',
    ACTIVO: 'activo',
    OBSOLETO: 'obsoleto',
};
// Estados de intervencion
exports.ESTADO_INTERVENCION = {
    BORRADOR: 'borrador',
    EN_CURSO: 'en_curso',
    COMPLETADA: 'completada',
    FACTURADA: 'facturada',
};
exports.ESTADO_INTERVENCION_LABELS = {
    borrador: 'Borrador',
    en_curso: 'En Curso',
    completada: 'Completada',
    facturada: 'Facturada',
};
// Estados de informe
exports.ESTADO_INFORME = {
    BORRADOR: 'borrador',
    FINALIZADO: 'finalizado',
    ENTREGADO: 'entregado',
};
// Tipos de intervencion
exports.TIPO_INTERVENCION = {
    PREVENTIVA: 'preventiva',
    CORRECTIVA: 'correctiva',
};
exports.TIPO_INTERVENCION_LABELS = {
    preventiva: 'Preventiva',
    correctiva: 'Correctiva',
};
// Roles
exports.ROL = {
    ADMIN: 'admin',
    TECNICO: 'tecnico',
};
// Categorias de bloques
exports.BLOCK_CATEGORIES = {
    ESTRUCTURA: 'estructura',
    CAMPOS: 'campos',
    INSPECCION: 'inspeccion',
    MEDIA: 'media',
};
exports.BLOCK_CATEGORY_LABELS = {
    estructura: 'Estructura',
    campos: 'Campos de datos',
    inspeccion: 'Inspeccion',
    media: 'Media y firma',
};
// Niveles de mantenimiento (tristate)
exports.MAINTENANCE_LEVEL_COLORS = {
    general: '#6b7280',
    level1: '#22c55e',
    level2: '#f59e0b',
    level3: '#ef4444',
};
// Config pagina por defecto
exports.DEFAULT_PAGE_CONFIG = {
    orientation: 'portrait',
    margins: { top: 20, right: 15, bottom: 20, left: 15 },
    fontSize: 10,
};
//# sourceMappingURL=constants.js.map