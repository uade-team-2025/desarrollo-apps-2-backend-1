#!/usr/bin/env node
const amqp = require('amqplib');

const url = 'amqp://admin:admin@cultura-rabbit.diaznicolasandres.com:5672';
const exchange = 'citypass_def';
const routingKey = 'movilidad.estaciones.festivalverde';

const message = {
  eventId: '68d44d2663d135b1b22cb970',
  stations: [
    {
      _id: '507f1f77bcf86cd799439011',
      name: 'Estación Central',
      location: {
        type: 'Point',
        coordinates: [-58.3816, -34.6037],
      },
      capacity: 20,
      bikesCount: 15,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      name: 'Estación Norte',
      location: {
        type: 'Point',
        coordinates: [-58.3916, -34.5937],
      },
      capacity: 15,
      bikesCount: 10,
      status: 'active',
    },
    {
      name: 'Estación Sur',
      location: {
        type: 'Point',
        coordinates: [-58.3716, -34.6137],
      },
      capacity: 18,
      bikesCount: 12,
      status: 'active',
    },
  ],
  metadata: {
    mode: 'bulk',
    sentAt: new Date().toISOString(),
    totalStations: 3,
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
    const queueName = 'movilidad.estaciones.festivalverde';
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
