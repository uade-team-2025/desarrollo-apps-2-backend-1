#!/usr/bin/env node
const amqp = require('amqplib');

const url = 'amqp://user_cultura:pass_cultura@3.87.100.222:5672';
const exchange = 'citypass_def';
const routingKey = 'cultura.evento.crear';

// Mock de un evento creado (basado en el log del backend)
const message = {
  eventType: 'INSERT',
  collection: 'events',
  documentId: '691a25b3c953e68977ad9354',
  timestamp: new Date().toISOString(),
  data: {
    _id: '691a25b3c953e68977ad9354',
    culturalPlaceId: {
      _id: '68d44759b05e86754239e756',
      name: ' MOCKEADO NO DAR BOLA',
      description: '',
      category: 'Teatro',
      characteristics: [
        'Teatro',
        'Escuela de clown',
        'Talleres',
        'Espacio no convencional',
      ],
      contact: {
        coordinates: {
          type: 'Point',
          coordinates: [-58.442096, -34.590792],
        },
        address: 'Aguirre 1270, Palermo',
        phone: '48541905',
        website: 'http://www.espacioaguirre.com.ar',
        email: 'produccion@espacioaguirre.com.ar',
        _id: '68d449a55141427b671373db',
        id: '68d449a55141427b671373db',
      },
      image:
        'https://agendacultural15.com/wp-content/uploads/2022/07/Espacio-Aguirre.jpg',
      rating: 4,
      id: '68d44759b05e86754239e756',
    },
    name: 'Evento de Prueba',
    description: 'Descripción del evento de prueba para testing',
    date: new Date('2025-11-22T04:00:00.000Z'),
    time: '18:29',
    ticketTypes: [
      {
        type: 'general',
        price: 1000,
        initialQuantity: 100,
        soldQuantity: 0,
        isActive: true,
        _id: '691a25b3c953e68977ad9355',
        id: '691a25b3c953e68977ad9355',
      },
    ],
    isActive: true,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    __v: 0,
    availableQuantity: 100,
    id: '691a25b3c953e68977ad9354',
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
    const queueName = 'cultura.events.crear';
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
    console.log(`  Event ID: ${message.documentId}`);
    console.log(`  Event Name: ${message.data.name}`);
    console.log(`  Cultural Place: ${message.data.culturalPlaceId.name}`);
    console.log(JSON.stringify(message, null, 2));
    await ch.close();
    await conn.close();
  } catch (e) {
    console.error('✗ Error:', e.message);
    process.exit(1);
  }
}

send();
