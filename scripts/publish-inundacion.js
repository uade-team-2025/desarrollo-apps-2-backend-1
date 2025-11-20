#!/usr/bin/env node
const amqp = require('amqplib');

const url = 'amqp://user_cultura:pass_cultura@3.87.100.222:5672';
const exchange = 'citypass_def';
const routingKey = 'emergencias.inundacion.pendiente';

const message = {
  id: '691d37c12a2a7a5b54bd4b45',
  timestamp: new Date().toISOString(),
  source: 'emergencias',
  topic: 'emergencias.inundacion.pendiente',
  payload: {
    prioridad: 'High',
    estado: 'Pendiente',
    tipo_emergencia: 'Inundacion',
    lat: -34.616844894500375,
    lng: -58.38191860290056,
    contexto: 'prueba7',
    comuna: 1,
    id_reclamo: '691d37c12a2a7a5b54bd4b45',
  },
};

async function send() {
  try {
    console.log('Connecting to RabbitMQ...');
    const conn = await amqp.connect(url);
    const ch = await conn.createChannel();

    // Publicar el mensaje
    ch.publish(
      exchange,
      routingKey,
      Buffer.from(
        '{"id":"691e006529e50cb062f3fa99","timestamp":"2025-11-19T17:37:41.009Z","source":"emergencias","topic":"emergencias.inundacion.pendiente","payload":{"prioridad":"High","estado":"Pendiente","tipo_emergencia":"Inundacion","lat":-34.616844894500375,"lng":-58.38191860290056,"contexto":"prueba11","comuna":1,"id_reclamo":"691e006529e50cb062f3fa99"}}',
      ),
      {
        persistent: true,
      },
    );
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
