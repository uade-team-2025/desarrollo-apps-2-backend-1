#!/usr/bin/env node
const amqp = require('amqplib');

const url = 'amqp://admin:admin@cultura-rabbit.diaznicolasandres.com:5672';
const exchange = 'citypass_def';
const routingKey = 'reclamos.cultura.centros';
const queueName = 'reclamos.cultura.centros';

const message = {
  id_reclamo: 123,
  categoria: 'Ciudad Transparente',
  titulo: 'Venta de alcohol a menores',
  descripcion: 'Se esta vendiendo alcohol a menores',
  lat: '-58.3816',
  lng: '-34.6038',
  fecha: '2025-09-18T21:15:00Z',
};

async function send() {
  try {
    console.log('Connecting to RabbitMQ...');
    const connection = await amqp.connect(url);
    const channel = await connection.createChannel();

    await channel.assertExchange(exchange, 'topic', { durable: true });
    await channel.assertQueue(queueName, { durable: true });
    await channel.bindQueue(queueName, exchange, routingKey);

    const payload = Buffer.from(JSON.stringify(message));
    channel.publish(exchange, routingKey, payload, { persistent: true });

    console.log(`✓ Complaint sent to '${routingKey}'`);
    console.log(JSON.stringify(message, null, 2));

    await channel.close();
    await connection.close();
  } catch (error) {
    console.error('✗ Error sending complaint:', error.message);
    process.exit(1);
  }
}

send();
