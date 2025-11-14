#!/usr/bin/env node
const amqp = require('amqplib');

const url = 'amqp://admin:admin@cultura-rabbit.diaznicolasandres.com:5672';
const exchange = 'citypass_def';
const routingKey = 'movilidad.estaciones.festivalverde';

const message = {
  eventId: '68d44d2663d135b1b22cb970',
  stations: [
    { stationId: 'station-1', lt: -34.6095, lg: -58.379, count: 8 },
    { stationId: 'station-2', lt: -34.611, lg: -58.3815, count: 15 },
    { stationId: 'station-3', lt: -34.608, lg: -58.382, count: 4 },
    { stationId: 'station-4', lt: -34.612, lg: -58.3785, count: 7 },
    { stationId: 'station-5', lt: -34.6105, lg: -58.3795, count: 10 },
    { stationId: 'station-6', lt: -34.6078, lg: -58.3805, count: 12 },
    { stationId: 'station-7', lt: -34.613, lg: -58.3825, count: 6 },
    { stationId: 'station-8', lt: -34.609, lg: -58.383, count: 9 },
  ],
  metadata: {
    mode: 'bulk',
    sentAt: new Date().toISOString(),
    totalStations: 2,
  },
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
