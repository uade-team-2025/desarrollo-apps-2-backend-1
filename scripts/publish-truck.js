#!/usr/bin/env node
const amqp = require('amqplib');

const url = 'amqp://user_cultura:pass_cultura@3.85.212.112:5672';
const exchange = 'citypass_def';
const routingKey = 'residuos.camion.posicion';

const message = {
  id_ruta: 'ruta_8_1_abc123',
  indice_punto_actual: 3,
  total_puntos: 10,
  punto_actual: {
    latitud: -34.609123,
    longitud: -58.417456,
  },
  porcentaje_progreso: 33.33,
  informacion_adicional: [
    { id_evento: '68d44d2663d135b1b22cb970' },
    { id_evento: '68d44d2663d135b1b22cb971' },
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
