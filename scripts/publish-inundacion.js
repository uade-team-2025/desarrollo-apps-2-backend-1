#!/usr/bin/env node
const amqp = require('amqplib');

const url = 'amqp://admin:admin@cultura-rabbit.diaznicolasandres.com:5672';
const exchange = 'citypass_def';
const routingKey = 'emergencias.inundacion.creado';

const message = {
  evento: 'inundacion',
  version: '1.0',
  origen_modulo: 'emergencias',
  ocurrio_en: '2025-11-16T18:07:00.344Z',
  emitido_en: '2025-11-16T18:07:00.477Z',
  id_evento: 'evt_691a12c411c011dd216ef760',
  payload: {
    alerta_id: '691a12c411c011dd216ef760',
    usuario_id: '507f1f77bcf86cd799439011',
    lat: -34.6029,
    lng: -58.3816,
    zona_id: '',
    timestamp: '2025-11-16T18:07:00.344Z',
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
