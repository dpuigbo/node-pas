import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load .env
config();

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log('No DATABASE_URL — using default PrismaClient');
    return new PrismaClient();
  }
  try {
    const parsed = new URL(url);
    const adapter = new PrismaMariaDb({
      host: parsed.hostname,
      port: Number(parsed.port) || 3306,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.slice(1),
      connectionLimit: 5,
      connectTimeout: 10000,
      acquireTimeout: 10000,
      idleTimeout: 60000,
    });
    return new PrismaClient({ adapter } as any);
  } catch {
    return new PrismaClient();
  }
}

const prisma = createPrismaClient();

function loadJSON<T>(filename: string): T {
  // Try relative to this file first, then from project root
  const candidates = [
    join(__dirname, 'data', filename),
    join(process.cwd(), 'prisma', 'data', filename),
  ];
  for (const p of candidates) {
    try {
      return JSON.parse(readFileSync(p, 'utf-8'));
    } catch { /* try next */ }
  }
  throw new Error(`Cannot find data file: ${filename}`);
}

async function main() {
  console.log('Seeding database...');

  // ===== LIMPIEZA DE DATOS DE PRUEBA =====
  // Borra datos operativos (clientes, sistemas, intervenciones, etc.)
  // NO borra: modelos_componente, versiones_template, fabricantes, configuracion_app
  console.log('Limpiando datos de prueba...');
  await prisma.$transaction([
    prisma.pedidoCompra.deleteMany(),
    prisma.ofertaSistema.deleteMany(),
    prisma.oferta.deleteMany(),
    prisma.componenteInforme.deleteMany(),
    prisma.informe.deleteMany(),
    prisma.intervencionSistema.deleteMany(),
    prisma.intervencion.deleteMany(),
    prisma.componenteSistema.deleteMany(),
    prisma.sistema.deleteMany(),
    prisma.maquina.deleteMany(),
    prisma.cliente.deleteMany(),
    prisma.consumibleNivel.deleteMany(),
    prisma.consumible.deleteMany(),
    prisma.aceite.deleteMany(),
  ]);
  console.log('Datos de prueba eliminados OK');

  // Limpiar modelos SIN plantillas (los que tienen plantillas se preservan)
  const modelosSinPlantillas = await prisma.modeloComponente.findMany({
    where: { versiones: { none: {} } },
    select: { id: true },
  });
  if (modelosSinPlantillas.length > 0) {
    await prisma.compatibilidadControlador.deleteMany({
      where: {
        OR: [
          { componenteId: { in: modelosSinPlantillas.map((m) => m.id) } },
          { controladorId: { in: modelosSinPlantillas.map((m) => m.id) } },
        ],
      },
    });
    await prisma.modeloComponente.deleteMany({
      where: { id: { in: modelosSinPlantillas.map((m) => m.id) } },
    });
    console.log(`Modelos sin plantillas eliminados: ${modelosSinPlantillas.length}`);
  }

  // ===== FABRICANTES =====
  const abb = await prisma.fabricante.upsert({
    where: { nombre: 'ABB' },
    update: {},
    create: { nombre: 'ABB', orden: 1 },
  });

  await Promise.all([
    prisma.fabricante.upsert({ where: { nombre: 'KUKA' }, update: {}, create: { nombre: 'KUKA', orden: 2 } }),
    prisma.fabricante.upsert({ where: { nombre: 'FANUC' }, update: {}, create: { nombre: 'FANUC', orden: 3 } }),
    prisma.fabricante.upsert({ where: { nombre: 'Yaskawa' }, update: {}, create: { nombre: 'Yaskawa', orden: 4 } }),
    prisma.fabricante.upsert({ where: { nombre: 'Universal Robots' }, update: {}, create: { nombre: 'Universal Robots', orden: 5 } }),
  ]);
  console.log('Fabricantes OK');

  // ===== CONFIGURACION APP =====
  const configs = [
    { clave: 'empresa_nombre', valor: 'PAS Robotics S.L.' },
    { clave: 'empresa_direccion', valor: '' },
    { clave: 'empresa_telefono', valor: '' },
    { clave: 'empresa_logo', valor: '' },
  ];
  for (const config of configs) {
    await prisma.configuracionApp.upsert({
      where: { clave: config.clave },
      update: {},
      create: config,
    });
  }
  console.log('Configuración app OK');

  // ===== CONTROLADORAS =====
  const controllersData = loadJSON<Array<{ familia: string; nombre: string; notas: string | null }>>('controllers.json');

  // Map familia -> controller IDs for later compatibility linking
  const controllerIdsByFamilia = new Map<string, number[]>();

  for (const ctrl of controllersData) {
    const modelo = await prisma.modeloComponente.upsert({
      where: {
        fabricanteId_tipo_nombre: {
          fabricanteId: abb.id,
          tipo: 'controller',
          nombre: ctrl.nombre,
        },
      },
      update: { familia: ctrl.familia, notas: ctrl.notas },
      create: {
        fabricanteId: abb.id,
        tipo: 'controller',
        familia: ctrl.familia,
        nombre: ctrl.nombre,
        notas: ctrl.notas,
        niveles: '1',
      },
    });

    if (!controllerIdsByFamilia.has(ctrl.familia)) {
      controllerIdsByFamilia.set(ctrl.familia, []);
    }
    controllerIdsByFamilia.get(ctrl.familia)!.push(modelo.id);
  }
  console.log(`Controladoras: ${controllersData.length} OK`);

  // ===== MODELOS (mechanical_unit + external_axis) =====
  const modelsData = loadJSON<Array<{
    tipo: string; familia: string | null; nombre: string; notas: string | null;
    controladorasFamilias: string[];
  }>>('models.json');

  // Determine niveles based on tipo
  const nivelesForTipo: Record<string, string> = {
    mechanical_unit: '1,2_inferior,2_superior,3',
    external_axis: '1',
  };

  let modelsCreated = 0;
  let compatCreated = 0;

  for (const model of modelsData) {
    const tipo = model.tipo as 'mechanical_unit' | 'external_axis';
    const modelo = await prisma.modeloComponente.upsert({
      where: {
        fabricanteId_tipo_nombre: {
          fabricanteId: abb.id,
          tipo,
          nombre: model.nombre,
        },
      },
      update: {
        familia: model.familia,
        notas: model.notas,
      },
      create: {
        fabricanteId: abb.id,
        tipo,
        familia: model.familia,
        nombre: model.nombre,
        notas: model.notas,
        niveles: nivelesForTipo[tipo] ?? '1',
      },
    });
    modelsCreated++;

    // Create compatibility links
    for (const ctrlFamilia of model.controladorasFamilias) {
      const ctrlIds = controllerIdsByFamilia.get(ctrlFamilia) ?? [];
      for (const controladorId of ctrlIds) {
        await prisma.compatibilidadControlador.upsert({
          where: {
            controladorId_componenteId: {
              controladorId,
              componenteId: modelo.id,
            },
          },
          update: {},
          create: { controladorId, componenteId: modelo.id },
        });
        compatCreated++;
      }
    }

    if (modelsCreated % 100 === 0) {
      console.log(`  Models: ${modelsCreated}/${modelsData.length}...`);
    }
  }
  console.log(`Modelos: ${modelsCreated} OK, Compatibilidad: ${compatCreated} links`);

  // ===== ACEITES =====
  const aceitesData = loadJSON<Array<{ nombre: string; fabricanteRobot: string }>>('aceites.json');

  let aceitesCreated = 0;
  for (const aceite of aceitesData) {
    const existing = await prisma.aceite.findFirst({ where: { nombre: aceite.nombre } });
    if (!existing) {
      await prisma.aceite.create({
        data: {
          nombre: aceite.nombre,
          fabricanteRobot: aceite.fabricanteRobot,
          unidad: 'ml',
        },
      });
      aceitesCreated++;
    }
  }
  console.log(`Aceites: ${aceitesCreated} nuevos (${aceitesData.length} total) OK`);

  // ===== LUBRICACIÓN REDUCTORAS =====
  const lubricacionData = loadJSON<Array<{
    varianteTrm: string; eje: string; tipoLubricante: string;
    cantidad: string; webConfig: string | null;
  }>>('lubricacion.json');

  // Clear existing and bulk insert (idempotent)
  await prisma.lubricacionReductora.deleteMany({ where: { fabricanteId: abb.id } });

  // Batch insert in chunks
  const CHUNK = 100;
  for (let i = 0; i < lubricacionData.length; i += CHUNK) {
    const chunk = lubricacionData.slice(i, i + CHUNK);
    await prisma.lubricacionReductora.createMany({
      data: chunk.map((l) => ({
        fabricanteId: abb.id,
        varianteTrm: l.varianteTrm,
        eje: l.eje,
        tipoLubricante: l.tipoLubricante,
        cantidad: l.cantidad,
        webConfig: l.webConfig,
      })),
    });
  }
  console.log(`Lubricación: ${lubricacionData.length} OK`);

  // ===== ACTIVIDADES MANTENIMIENTO =====
  const mantData = loadJSON<Array<{
    familiaRobot: string; documento: string | null; tipoActividad: string;
    componente: string; intervaloEstandar: string | null;
    intervaloFoundry: string | null; notas: string | null;
  }>>('mantenimiento.json');

  // Clear existing and bulk insert (idempotent)
  await prisma.actividadMantenimiento.deleteMany({ where: { fabricanteId: abb.id } });

  for (let i = 0; i < mantData.length; i += CHUNK) {
    const chunk = mantData.slice(i, i + CHUNK);
    await prisma.actividadMantenimiento.createMany({
      data: chunk.map((m) => ({
        fabricanteId: abb.id,
        familiaRobot: m.familiaRobot,
        documento: m.documento,
        tipoActividad: m.tipoActividad,
        componente: m.componente,
        intervaloEstandar: m.intervaloEstandar,
        intervaloFoundry: m.intervaloFoundry,
        notas: m.notas,
      })),
    });
  }
  console.log(`Mantenimiento: ${mantData.length} OK`);

  console.log('\nSeed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
