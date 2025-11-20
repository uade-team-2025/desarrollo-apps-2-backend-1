#!/usr/bin/env node
const amqp = require('amqplib');

const url = 'amqp://user_cultura:pass_cultura@52.202.19.205:5672';
const exchange = 'citypass_def';
const routingKey = 'movilidad.estaciones.lista';

const message = {
  eventId: '691f63bc6fab2549f2251b83',
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
      _id: '507f1f77bcf86cd799439012',
      name: 'Estación Norte',
      location: {
        type: 'Point',
        coordinates: [-58.3916, -34.5937],
      },
      capacity: 20,
      bikesCount: 15,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: '507f1f77bcf86cd799439013',
      name: 'Estación Central',
      location: {
        type: 'Point',
        coordinates: [-58.3716, -34.6137],
      },
      capacity: 20,
      bikesCount: 15,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

async function send() {
  try {
    console.log('Connecting to RabbitMQ...');
    const conn = await amqp.connect(url);
    const ch = await conn.createChannel();

    // Publicar el mensaje
    ch.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });
    console.log(JSON.stringify(message, null, 2));

    console.log(
      `✓ Message sent to exchange '${exchange}' with routing key '${routingKey}'`,
    );
    await ch.close();
    await conn.close();
  } catch (e) {
    console.error('✗ Error:', e.message);
    process.exit(1);
  }
}

send();
