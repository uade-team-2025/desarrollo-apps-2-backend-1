import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RabbitMqPublisherService } from './rabbitmq-publisher.service';
import { ChangeStreamsListenerService } from './change-streams-listener.service';

@Module({
  imports: [ConfigModule],
  providers: [RabbitMqPublisherService, ChangeStreamsListenerService],
})
export class CdcModule {}

