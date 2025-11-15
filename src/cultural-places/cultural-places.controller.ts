import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CulturalPlacesService } from './cultural-places.service';
import { CreateCulturalPlaceDto } from './dto/create-cultural-place.dto';
import { UpdateCulturalPlaceDto } from './dto/update-cultural-place.dto';
import type { CulturalPlaceQueryDto } from './interfaces/cultural-place.interface';
import { CancelCulturalPlaceByLocationDto } from './dto/cancel-cultural-place-by-location.dto';
import { ActivateCulturalPlaceByLocationDto } from './dto/activate-cultural-place-by-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('cultural-places')
@Controller('cultural-places')
export class CulturalPlacesController {
  constructor(private readonly culturalPlacesService: CulturalPlacesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new cultural place' })
  @ApiResponse({ status: 201, description: 'Cultural place created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 409, description: 'Conflict - place with same name already exists' })
  async create(@Body() createCulturalPlaceDto: CreateCulturalPlaceDto) {
    try {
      console.log('Controller received data:', JSON.stringify(createCulturalPlaceDto, null, 2));
      return await this.culturalPlacesService.create(createCulturalPlaceDto);
    } catch (error) {
      console.error('Controller error:', error);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all cultural places with optional filtering' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status' })
  @ApiQuery({ name: 'minRating', required: false, description: 'Minimum rating filter' })
  @ApiQuery({ name: 'maxRating', required: false, description: 'Maximum rating filter' })
  @ApiResponse({ status: 200, description: 'List of cultural places retrieved successfully' })
  async findAll(@Query() query: CulturalPlaceQueryDto) {
    return this.culturalPlacesService.findAll(query);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find cultural places nearby a location' })
  @ApiQuery({ name: 'lat', required: true, description: 'Latitude' })
  @ApiQuery({ name: 'lng', required: true, description: 'Longitude' })
  @ApiQuery({ name: 'radius', required: true, description: 'Radius in kilometers' })
  @ApiResponse({ status: 200, description: 'Nearby cultural places found successfully' })
  async findNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius: string,
  ) {
    const query: CulturalPlaceQueryDto = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radius: parseFloat(radius),
    };
    
    return this.culturalPlacesService.findAll(query);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get cultural places by category' })
  @ApiParam({ name: 'category', description: 'Cultural place category' })
  @ApiResponse({ status: 200, description: 'Cultural places by category retrieved successfully' })
  async findByCategory(@Param('category') category: string) {
    return this.culturalPlacesService.findByCategory(category);
  }

  @Get('open/:day')
  @ApiOperation({ summary: 'Get cultural places open on specific day' })
  @ApiParam({ name: 'day', description: 'Day of the week' })
  @ApiResponse({ status: 200, description: 'Cultural places open on specific day retrieved successfully' })
  async findOpenPlaces(@Param('day') day: string) {
    return this.culturalPlacesService.findOpenPlaces(day);
  }

  @Get('top-rated')
  @ApiOperation({ summary: 'Get top rated cultural places' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of places to return' })
  @ApiResponse({ status: 200, description: 'Top rated cultural places retrieved successfully' })
  async findTopRated(@Query('limit') limit?: string) {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return this.culturalPlacesService.findTopRated(limitNumber);
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get a cultural place by ID' })
  @ApiParam({ name: 'id', description: 'Cultural place ID' })
  @ApiResponse({ status: 200, description: 'Cultural place retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Cultural place not found' })
  async findOne(@Param('id') id: string) {
    return this.culturalPlacesService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a cultural place' })
  @ApiParam({ name: 'id', description: 'Cultural place ID' })
  @ApiResponse({ status: 200, description: 'Cultural place updated successfully' })
  @ApiResponse({ status: 404, description: 'Cultural place not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async update(
    @Param('id') id: string,
    @Body() updateCulturalPlaceDto: UpdateCulturalPlaceDto,
  ) {
    return this.culturalPlacesService.update(id, updateCulturalPlaceDto);
  }

  @Patch(':id/toggle-active')
  @UseGuards(JwtAuthGuard)
  async toggleActive(@Param('id') id: string) {
    return this.culturalPlacesService.toggleActive(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.culturalPlacesService.remove(id);
  }

  @Post('cancel-by-location')
  @ApiOperation({ summary: 'Cancel a cultural place using coordinates' })
  @ApiResponse({ status: 200, description: 'Cultural place cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Cultural place not found' })
  async cancelByLocation(@Body() payload: CancelCulturalPlaceByLocationDto) {
    return this.culturalPlacesService.cancelByLocation(payload);
  }

  @Post('activate-by-location')
  @ApiOperation({ summary: 'Activate a cultural place using coordinates' })
  @ApiResponse({ status: 200, description: 'Cultural place activated successfully' })
  @ApiResponse({ status: 404, description: 'Cultural place not found' })
  async activateByLocation(@Body() payload: ActivateCulturalPlaceByLocationDto) {
    return this.culturalPlacesService.activateByLocation(payload);
  }
}
