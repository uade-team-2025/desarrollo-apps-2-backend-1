import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CulturalPlace, CulturalPlaceDocument } from '../schemas/cultural-place.schema';
import { ICulturalPlaceRepository } from '../interfaces/cultural-place.repository.interface';
import { CreateCulturalPlaceDto } from '../dto/create-cultural-place.dto';
import { UpdateCulturalPlaceDto } from '../dto/update-cultural-place.dto';
import { CulturalPlaceQueryDto } from '../interfaces/cultural-place.interface';

@Injectable()
export class MongoDBCulturalPlaceRepository implements ICulturalPlaceRepository {
  constructor(
    @InjectModel(CulturalPlace.name) private culturalPlaceModel: Model<CulturalPlaceDocument>,
  ) {}

  async create(data: CreateCulturalPlaceDto): Promise<CulturalPlace> {
    const createdPlace = new this.culturalPlaceModel({
      ...data,
      rating: data.rating || 0,
      isActive: data.isActive !== undefined ? data.isActive : true,
    });
    return await createdPlace.save();
  }

  async findAll(query: CulturalPlaceQueryDto = {}): Promise<CulturalPlace[]> {
    const { category, isActive, search, lat, lng, radius, limit, page = 1 } = query;
    
    const filter: any = {};

    if (category) {
      filter.category = category;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    if (lat && lng && radius) {
      filter['contact.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: radius * 1000,
        },
      };
    }

    let mongoQuery = this.culturalPlaceModel.find(filter).sort({ createdAt: -1 });

    if (limit) {
      const skip = (page - 1) * limit;
      mongoQuery = mongoQuery.limit(limit).skip(skip);
    }

    return await mongoQuery.exec();
  }

  async findById(id: string): Promise<CulturalPlace | null> {
    return await this.culturalPlaceModel.findById(id).exec();
  }

  async findByName(name: string): Promise<CulturalPlace | null> {
    return await this.culturalPlaceModel.findOne({ name }).exec();
  }

  async findByCoordinates(
    latitude: number,
    longitude: number,
    radiusInMeters: number = 5,
  ): Promise<CulturalPlace | null> {
    return await this.culturalPlaceModel
      .findOne({
        'contact.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: radiusInMeters,
          },
        },
      })
      .exec();
  }

  async update(id: string, data: UpdateCulturalPlaceDto): Promise<CulturalPlace | null> {
    return await this.culturalPlaceModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.culturalPlaceModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async findByCategory(category: string): Promise<CulturalPlace[]> {
    return await this.culturalPlaceModel
      .find({ category, isActive: true })
      .sort({ name: 1 })
      .exec();
  }

  async findTopRated(limit: number): Promise<CulturalPlace[]> {
    return await this.culturalPlaceModel
      .find({ isActive: true })
      .sort({ rating: -1 })
      .limit(limit)
      .exec();
  }

  async findOpenPlaces(dayOfWeek: string): Promise<CulturalPlace[]> {
    const daySchedule = `schedules.${dayOfWeek.toLowerCase()}`;
    
    return await this.culturalPlaceModel
      .find({
        isActive: true,
        [`${daySchedule}.closed`]: false,
      })
      .sort({ name: 1 })
      .exec();
  }
}
