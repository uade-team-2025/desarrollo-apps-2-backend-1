#!/usr/bin/env node
const amqp = require('amqplib');

const url = 'amqp://admin:admin@cultura-rabbit.diaznicolasandres.com:5672';
const exchange = 'citypass_def';
const routingKey = 'reclamos.ciudad.transparente';

const message = {
  id_reclamo: 123,
  id_subcategoria: 5,
  categoria: 'Ciudad Transparente',
  titulo: 'Contenedor de basura desbordado',
  descripcion:
    'El contenedor en la calle San Martín esquina Belgrano está lleno y lleva días sin vaciarse.',
  prioridad: 'ALTA',
  direccion: 'San Martín y Belgrano, Ciudad',
  lat: -34.591805,
  lng: -58.379299,
  fecha: '2025-09-18T21:15:00Z',
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
