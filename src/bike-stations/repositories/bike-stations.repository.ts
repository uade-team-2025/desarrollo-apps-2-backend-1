import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateBikeStationDto } from '../dto/create-bike-station.dto';
import { UpdateStationDto } from '../dto/update-station.dto';
import {
  BikeStation,
  BikeStationDocument,
} from '../schemas/bike-station.schema';

@Injectable()
export class BikeStationsRepository {
  constructor(
    @InjectModel(BikeStation.name)
    private bikeStationModel: Model<BikeStationDocument>,
  ) {}

  async create(
    createBikeStationDto: CreateBikeStationDto,
  ): Promise<BikeStationDocument> {
    const createdBikeStation = new this.bikeStationModel(createBikeStationDto);
    return createdBikeStation.save();
  }

  async findAll(): Promise<BikeStationDocument[]> {
    return this.bikeStationModel.find().exec();
  }

  async findById(id: string): Promise<BikeStationDocument | null> {
    return this.bikeStationModel.findById(id).exec();
  }

  async findByEventId(eventId: string): Promise<BikeStationDocument[]> {
    return this.bikeStationModel.find({ eventId }).exec();
  }

  async findByStationId(stationId: string): Promise<BikeStationDocument[]> {
    return this.bikeStationModel
      .find({ 'stations.stationId': stationId })
      .exec();
  }

  async updateStationInAllEvents(
    stationId: string,
    updateData: Partial<UpdateStationDto>,
  ): Promise<{ modifiedCount: number }> {
    const updateFields: any = {};

    if (updateData.lat !== undefined) {
      updateFields['stations.$[elem].lat'] = updateData.lat;
    }
    if (updateData.long !== undefined) {
      updateFields['stations.$[elem].long'] = updateData.long;
    }
    if (updateData.count !== undefined) {
      updateFields['stations.$[elem].count'] = updateData.count;
    }

    const result = await this.bikeStationModel
      .updateMany(
        { 'stations.stationId': stationId },
        { $set: updateFields },
        {
          arrayFilters: [{ 'elem.stationId': stationId }],
        },
      )
      .exec();

    return { modifiedCount: result.modifiedCount };
  }
}
