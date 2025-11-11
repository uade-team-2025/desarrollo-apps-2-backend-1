#!/usr/bin/env node
const amqp = require('amqplib');

const url = 'amqp://admin:admin@cultura-rabbit.diaznicolasandres.com:5672';
const exchange = 'citypass_def';
const routingKey = 'residuos.camion.festivalverde';

const message = {
  eventId: '68d44d2663d135b1b22cb970',
  truckId: 'truck-001',
  position: {
    lat: -34.6037,
    long: -58.3816,
  },
};

async function send() {
  try {
    console.log('Connecting to RabbitMQ...');
    const conn = await amqp.connect(url);
    const ch = await conn.createChannel();

    // Declarar exchange
    await ch.assertExchange(exchange, 'topic', { durable: true });

    // Declarar la cola
    const queueName = 'residuos.camion.festivalverde';
    await ch.assertQueue(queueName, { durable: true });

    // Hacer binding entre queue y exchange
    await ch.bindQueue(queueName, exchange, routingKey);

    // Publicar el mensaje
    ch.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });
    console.log(
      `✓ Message sent to exchange '${exchange}' with routing key '${routingKey}'`,
    );
    console.log(JSON.stringify(message, null, 2));
    await ch.close();
    await conn.close();
  } catch (e) {
    console.error('✗ Error:', e.message);
    process.exit(1);
  }
}

send();
