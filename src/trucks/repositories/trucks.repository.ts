import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateTruckDto } from '../dto/create-truck.dto';
import { UpdateTruckDto } from '../dto/update-truck.dto';
import { Truck, TruckDocument } from '../schemas/truck.schema';

@Injectable()
export class TrucksRepository {
  constructor(
    @InjectModel(Truck.name)
    private truckModel: Model<TruckDocument>,
  ) {}

  async create(createTruckDto: CreateTruckDto): Promise<TruckDocument> {
    const createdTruck = new this.truckModel(createTruckDto);
    return createdTruck.save();
  }

  async findAll(): Promise<TruckDocument[]> {
    return this.truckModel.find().exec();
  }

  async findById(id: string): Promise<TruckDocument | null> {
    return this.truckModel.findById(id).exec();
  }

  async findByEventId(eventId: string): Promise<TruckDocument[]> {
    return this.truckModel.find({ eventId }).exec();
  }

  async findByTruckId(truckId: string): Promise<TruckDocument[]> {
    return this.truckModel.find({ truckId }).exec();
  }

  async findByEventAndTruckId(
    eventId: string,
    truckId: string,
  ): Promise<TruckDocument | null> {
    return this.truckModel.findOne({ eventId, truckId }).exec();
  }

  async update(
    id: string,
    updateTruckDto: UpdateTruckDto,
  ): Promise<TruckDocument | null> {
    return this.truckModel
      .findByIdAndUpdate(id, updateTruckDto, { new: true })
      .exec();
  }

  async updateByEventAndTruckId(
    eventId: string,
    truckId: string,
    updateTruckDto: UpdateTruckDto,
  ): Promise<TruckDocument | null> {
    return this.truckModel
      .findOneAndUpdate({ eventId, truckId }, updateTruckDto, { new: true })
      .exec();
  }

  async delete(id: string): Promise<TruckDocument | null> {
    return this.truckModel.findByIdAndDelete(id).exec();
  }

  async deleteByEventAndTruckId(
    eventId: string,
    truckId: string,
  ): Promise<TruckDocument | null> {
    return this.truckModel.findOneAndDelete({ eventId, truckId }).exec();
  }

  async upsert(createTruckDto: CreateTruckDto): Promise<TruckDocument> {
    return this.truckModel
      .findOneAndUpdate(
        {
          eventId: createTruckDto.eventId,
          truckId: createTruckDto.truckId,
        },
        createTruckDto,
        {
          new: true,
          upsert: true,
        },
      )
      .exec();
  }
}
