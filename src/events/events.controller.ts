import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LdapAuthGuard } from '../auth/guards/ldap-auth.guard';
import { CreateEventDto } from './dto/create-event.dto';
import { PutEventDto } from './dto/put-event.dto';
import { EventsService } from './events.service';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(LdapAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all events with optional filtering' })
  @ApiQuery({
    name: 'culturalPlaceId',
    required: false,
    description: 'Filter by cultural place ID',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for range filter',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for range filter',
  })
  @ApiResponse({
    status: 200,
    description: 'List of events retrieved successfully',
  })
  async findAll(@Query() query: any) {
    return this.eventsService.findAll(query);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active events' })
  @ApiResponse({
    status: 200,
    description: 'List of active events retrieved successfully',
  })
  async findActiveEvents() {
    return this.eventsService.findActiveEvents();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an event by ID' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Get('cultural-place/:culturalPlaceId')
  @ApiOperation({ summary: 'Get events by cultural place ID' })
  @ApiParam({ name: 'culturalPlaceId', description: 'Cultural place ID' })
  @ApiResponse({
    status: 200,
    description: 'List of events for cultural place retrieved successfully',
  })
  async findByCulturalPlace(@Param('culturalPlaceId') culturalPlaceId: string) {
    return this.eventsService.findByCulturalPlace(culturalPlaceId);
  }

  @Get('date-range/:startDate/:endDate')
  @ApiOperation({ summary: 'Get events within a date range' })
  @ApiParam({ name: 'startDate', description: 'Start date (YYYY-MM-DD)' })
  @ApiParam({ name: 'endDate', description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({
    status: 200,
    description: 'List of events in date range retrieved successfully',
  })
  async findByDateRange(
    @Param('startDate') startDate: string,
    @Param('endDate') endDate: string,
  ) {
    return this.eventsService.findByDateRange(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Put(':id')
  @UseGuards(LdapAuthGuard)
  @ApiOperation({ summary: 'Update an event completely' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async update(@Param('id') id: string, @Body() putEventDto: PutEventDto) {
    return this.eventsService.update(id, putEventDto);
  }

  @Patch(':id/toggle-active')
  @UseGuards(LdapAuthGuard)
  @ApiOperation({ summary: 'Toggle the active status of an event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'Event active status toggled successfully',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async toggleActive(@Param('id') id: string) {
    return this.eventsService.toggleActive(id);
  }

  @Delete(':id')
  @UseGuards(LdapAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an event by ID' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 204, description: 'Event deleted successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async remove(@Param('id') id: string) {
    await this.eventsService.remove(id);
  }
}
