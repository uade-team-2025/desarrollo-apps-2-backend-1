#!/usr/bin/env node
const amqp = require('amqplib');

const url = 'amqp://admin:admin@cultura-rabbit.diaznicolasandres.com:5672';
const exchange = 'citypass_def';

// Definir la cola y su routing key
const queuesAndRoutingKeys = [
  {
    queue: 'movilidad.estaciones.lista',
    routingKey: 'movilidad.estaciones.lista',
  },
  {
    queue: 'residuos.camion.posicion',
    routingKey: 'residuos.camion.posicion',
  },
  {
    queue: 'reclamos.plazaviva',
    routingKey: 'reclamos.plazaviva',
  },
  {
    queue: 'reclamos.ciudad.transparente',
    routingKey: 'reclamos.ciudad.transparente',
  },
  {
    queue: 'emergencias.inundacion.creado',
    routingKey: 'emergencias.inundacion.creado',
  },
];

async function setupQueues() {
  let conn;
  let ch;

  try {
    console.log('🔌 Conectando a RabbitMQ...');
    conn = await amqp.connect(url);
    ch = await conn.createChannel();

    // Asegurar que el exchange existe
    console.log(`📡 Verificando exchange '${exchange}'...`);
    await ch.assertExchange(exchange, 'topic', { durable: true });
    console.log(`✓ Exchange '${exchange}' verificado/creado\n`);

    // Crear todas las colas y hacer binding
    console.log('📦 Creando colas y bindings...\n');
    let createdCount = 0;
    let existingCount = 0;

    for (const { queue, routingKey } of queuesAndRoutingKeys) {
      try {
        // Crear la cola (durable: true para que persista)
        await ch.assertQueue(queue, { durable: true });

        // Hacer binding entre la cola y el exchange con el routing key
        await ch.bindQueue(queue, exchange, routingKey);

        console.log(`✓ Cola creada: '${queue}' → routing key: '${routingKey}'`);
        createdCount++;
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠ Cola ya existe: '${queue}' (binding actualizado)`);
          existingCount++;
        } else {
          console.error(`✗ Error creando cola '${queue}':`, error.message);
        }
      }
    }

    console.log('\n📊 Resumen:');
    console.log(`  ✓ Colas creadas/actualizadas: ${createdCount}`);
    console.log(`  ⚠ Colas que ya existían: ${existingCount}`);
    console.log(`  📋 Total: ${queuesAndRoutingKeys.length} colas\n`);

    await ch.close();
    await conn.close();
    console.log('✅ Setup completado exitosamente');
  } catch (error) {
    console.error('✗ Error:', error.message);
    if (ch) await ch.close();
    if (conn) await conn.close();
    process.exit(1);
  }
}

setupQueues();
