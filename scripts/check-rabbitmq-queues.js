#!/usr/bin/env node
const amqp = require('amqplib');

const url = 'amqp://admin:admin@cultura-rabbit.diaznicolasandres.com:5672';
const exchange = 'citypass_def';

// Colas que deberían existir
const queuesToCheck = [
  'n8n.residuos.camion.festivalverde',
  'n8n.movilidad.estaciones.festivalverde',
  'residuos.camion.festivalverde',
  'movilidad.estaciones.festivalverde',
  'cultura_def',
];

async function check() {
  try {
    console.log('🔍 Checking RabbitMQ configuration...\n');
    const conn = await amqp.connect(url);
    const ch = await conn.createChannel();

    // Verificar exchange
    try {
      await ch.checkExchange(exchange);
      console.log(`✅ Exchange '${exchange}' exists`);
    } catch (e) {
      console.log(`❌ Exchange '${exchange}' does NOT exist`);
      console.log('   Run: node scripts/setup-rabbitmq-queues.js');
    }

    console.log('\n📋 Checking queues:\n');

    // Verificar cada cola
    for (const queueName of queuesToCheck) {
      try {
        const queueInfo = await ch.checkQueue(queueName);
        console.log(`✅ Queue '${queueName}' exists`);
        console.log(`   Messages: ${queueInfo.messageCount}`);
        console.log(`   Consumers: ${queueInfo.consumerCount}`);

        // Verificar bindings
        try {
          const bindings = await ch.bindings(queueName);
          if (bindings.length > 0) {
            console.log(`   Bindings: ${bindings.length}`);
            bindings.forEach((binding) => {
              console.log(
                `     - Exchange: ${binding.exchange}, Routing Key: ${binding.routingKey}`,
              );
            });
          } else {
            console.log(
              `   ⚠️  No bindings found! Queue may not receive messages.`,
            );
            console.log(
              `   Run: node scripts/setup-rabbitmq-queues.js to fix this`,
            );
          }
        } catch (e) {
          console.log(`   ⚠️  Could not check bindings: ${e.message}`);
        }
      } catch (e) {
        console.log(`❌ Queue '${queueName}' does NOT exist`);
        console.log(
          `   Run: node scripts/setup-rabbitmq-queues.js to create it`,
        );
      }
      console.log('');
    }

    await ch.close();
    await conn.close();

    console.log('\n💡 Next steps:');
    console.log(
      '   1. Run: node scripts/setup-rabbitmq-queues.js (if queues are missing)',
    );
    console.log('   2. Run: node scripts/publish-truck.js (to test)');
    console.log(
      '   3. Check n8n workflow is active and listening to the correct queue',
    );
  } catch (e) {
    console.error('❌ Error:', e.message);
    if (e.message.includes('ECONNREFUSED')) {
      console.error(
        '   Could not connect to RabbitMQ. Check if RabbitMQ is running.',
      );
    }
    process.exit(1);
  }
}

check();
