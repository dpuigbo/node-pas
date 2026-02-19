import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Fabricantes
  const fabricantes = await Promise.all([
    prisma.fabricante.upsert({
      where: { nombre: 'ABB' },
      update: {},
      create: { nombre: 'ABB', orden: 1 },
    }),
    prisma.fabricante.upsert({
      where: { nombre: 'KUKA' },
      update: {},
      create: { nombre: 'KUKA', orden: 2 },
    }),
    prisma.fabricante.upsert({
      where: { nombre: 'FANUC' },
      update: {},
      create: { nombre: 'FANUC', orden: 3 },
    }),
    prisma.fabricante.upsert({
      where: { nombre: 'Yaskawa' },
      update: {},
      create: { nombre: 'Yaskawa', orden: 4 },
    }),
    prisma.fabricante.upsert({
      where: { nombre: 'Universal Robots' },
      update: {},
      create: { nombre: 'Universal Robots', orden: 5 },
    }),
  ]);

  console.log(`Created ${fabricantes.length} fabricantes`);

  // Configuracion de la app
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

  console.log('App configuration created');
  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
