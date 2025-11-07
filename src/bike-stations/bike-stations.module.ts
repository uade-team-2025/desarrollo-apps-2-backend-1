import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BikeStationsController } from './bike-stations.controller';
import { BikeStationsService } from './bike-stations.service';
import { BikeStationsRepository } from './repositories/bike-stations.repository';
import { BikeStation, BikeStationSchema } from './schemas/bike-station.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BikeStation.name, schema: BikeStationSchema },
    ]),
  ],
  controllers: [BikeStationsController],
  providers: [BikeStationsService, BikeStationsRepository],
  exports: [MongooseModule, BikeStationsService],
})
export class BikeStationsModule {}
