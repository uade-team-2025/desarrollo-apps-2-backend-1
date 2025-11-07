import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { CulturalPlacesModule } from './cultural-places/cultural-places.module';
import { EventsModule } from './events/events.module';
import { TicketsModule } from './tickets/tickets.module';
import { MetricsModule } from './metrics/metrics.module';
import { AuthModule } from './auth/auth.module';
import { CdcModule } from './cdc/cdc.module';
import { getDatabaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/cultural-places',
        ...getDatabaseConfig(),
      }),
      inject: [ConfigService],
    }),
    MetricsModule,
    AuthModule,
    UsersModule,
    CulturalPlacesModule,
    EventsModule,
    TicketsModule,
    CdcModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
