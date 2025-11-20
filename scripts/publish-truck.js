#!/usr/bin/env node
const amqp = require('amqplib');

const url = 'amqp://user_cultura:pass_cultura@52.202.19.205:5672';
const exchange = 'citypass_def';
const routingKey = 'residuos.camion.posicion';

const message = {
  payload: {
    id_ruta: 'ruta_que_pushea_cultura',
    indice_punto_actual: 3,
    total_puntos: 10,
    punto_actual: {
      latitud: -34.614693,
      longitud: -58.381672,
    },
    porcentaje_progreso: 33.33,
    informacion_adicional: [
      { id_evento: '691f63bc6fab2549f2251b83' },
      { id_evento: '691f67bb6fab2549f2252d3d' },
    ],
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
