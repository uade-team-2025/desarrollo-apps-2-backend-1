#!/usr/bin/env node
const amqp = require('amqplib');

const url = 'amqp://admin:admin@cultura-rabbit.diaznicolasandres.com:5672';
const inputExchange = 'cultura_def';
const inputRoutingKey = 'reclamos.cultura.centros';
const inputQueueName = inputExchange;

const outputExchange = 'citypass_def';
const outputTopic = 'un.topico.salida';
const outputQueueName = 'un.topico.salida';


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

    await channel.assertExchange(inputExchange, 'topic', { durable: true });
    await channel.assertQueue(inputQueueName, { durable: true });
    await channel.bindQueue(inputQueueName, inputExchange, inputRoutingKey);

    await channel.assertExchange(outputExchange, 'topic', { durable: true });
    await channel.assertQueue(outputQueueName, { durable: true });
    await channel.bindQueue(outputQueueName, outputExchange, outputTopic);

    const payload = Buffer.from(JSON.stringify(message));
    channel.publish(inputExchange, inputRoutingKey, payload, { persistent: true });
    channel.publish(outputExchange, outputTopic, payload, { persistent: true });

    console.log(`✓ Complaint sent to '${inputRoutingKey}' and '${outputTopic}'`);
    console.log(JSON.stringify(message, null, 2));

    await channel.close();
    await connection.close();
  } catch (error) {
    console.error('✗ Error sending complaint:', error.message);
    process.exit(1);
  }
}

send();


