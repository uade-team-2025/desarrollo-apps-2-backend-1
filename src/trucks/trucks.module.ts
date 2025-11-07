import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TrucksRepository } from './repositories/trucks.repository';
import { Truck, TruckSchema } from './schemas/truck.schema';
import { TrucksController } from './trucks.controller';
import { TrucksService } from './trucks.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Truck.name, schema: TruckSchema }]),
  ],
  controllers: [TrucksController],
  providers: [TrucksService, TrucksRepository],
  exports: [MongooseModule, TrucksService],
})
export class TrucksModule {}
