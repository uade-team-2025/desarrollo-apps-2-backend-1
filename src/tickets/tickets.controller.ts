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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LdapAuthGuard } from '../auth/guards/ldap-auth.guard';
import { PurchaseMultipleTicketsDto } from './dto/purchase-multiple-tickets.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketsService } from './tickets.service';

@ApiTags('tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Purchase multiple tickets for different events and types',
    description:
      'Purchase multiple tickets of different types in a single transaction. Supports general, vip, jubilados, and niños ticket types. Maximum 10 tickets per transaction.',
  })
  @ApiResponse({
    status: 201,
    description: 'Tickets purchased successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '68cf25ed3435733e4a34db91' },
          eventId: { type: 'string', example: '68cb3f47a7999cce8e8e8079' },
          userId: { type: 'string', example: '68c2dd60fb172823da61eb92' },
          ticketType: { type: 'string', example: 'general' },
          price: { type: 'number', example: 1500 },
          status: { type: 'string', example: 'active' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          validationURL: {
            type: 'string',
            example:
              'https://desarrollo-apps-2-frontend.vercel.app/ticket_id/68cf25ed3435733e4a34db91/use',
          },
          qrCode: {
            type: 'string',
            example:
              'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6e...',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or insufficient tickets',
  })
  @ApiResponse({ status: 404, description: 'Event or user not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async purchaseMultipleTickets(
    @Body() purchaseMultipleTicketsDto: PurchaseMultipleTicketsDto,
  ) {
    return this.ticketsService.purchaseMultipleTickets(
      purchaseMultipleTicketsDto,
    );
  }

  @Get()
  @UseGuards(LdapAuthGuard)
  @ApiOperation({ summary: 'Get all tickets with optional filtering' })
  @ApiQuery({
    name: 'eventId',
    required: false,
    description: 'Filter by event ID',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'Filter by user ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by ticket status',
  })
  @ApiQuery({
    name: 'ticketType',
    required: false,
    description: 'Filter by ticket type',
  })
  @ApiResponse({
    status: 200,
    description: 'List of tickets retrieved successfully',
  })
  async findAll(@Query() query: any) {
    return this.ticketsService.findAll(query);
  }

  @Get('active')
  @UseGuards(LdapAuthGuard)
  @ApiOperation({ summary: 'Get all active tickets' })
  @ApiResponse({
    status: 200,
    description: 'List of active tickets retrieved successfully',
  })
  async findActiveTickets() {
    return this.ticketsService.findActiveTickets();
  }

  @Get(':id')
  @UseGuards(LdapAuthGuard)
  @ApiOperation({ summary: 'Get a ticket by ID' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ status: 200, description: 'Ticket retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Get('event/:eventId')
  @UseGuards(LdapAuthGuard)
  @ApiOperation({ summary: 'Get tickets by event ID' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'List of tickets for event retrieved successfully',
  })
  async findByEvent(@Param('eventId') eventId: string) {
    return this.ticketsService.findByEvent(eventId);
  }

  @Get('user/:userId')
  @UseGuards(LdapAuthGuard)
  @ApiOperation({
    summary: 'Get tickets by user ID with event details',
    description:
      'Retrieves all tickets for a specific user with complete event information including cultural place details',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description:
      'List of tickets for user retrieved successfully with event and cultural place details',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '68cf34f28cfcf2b57f2b377a' },
          eventId: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '68cb3f47a7999cce8e8e8079' },
              name: { type: 'string', example: 'Concierto de Jazz' },
              description: {
                type: 'string',
                example: 'Descripción del evento...',
              },
              date: { type: 'string', format: 'date', example: '2024-02-15' },
              time: { type: 'string', example: '20:00' },
              image: {
                type: 'string',
                example:
                  'https://mi-backend.com/uploads/events/concierto-jazz.jpg',
              },
              culturalPlaceId: {
                type: 'object',
                properties: {
                  _id: { type: 'string', example: 'place_id_789' },
                  name: { type: 'string', example: 'Teatro Colón' },
                  address: {
                    type: 'string',
                    example: 'Cerrito 628, C1010 CABA',
                  },
                  image: {
                    type: 'string',
                    example:
                      'https://mi-backend.com/uploads/places/teatro-colon.jpg',
                  },
                },
              },
            },
          },
          userId: { type: 'string', example: 'user_id_123' },
          ticketType: { type: 'string', example: 'general' },
          price: { type: 'number', example: 2500 },
          status: { type: 'string', example: 'active' },
          purchaseDate: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00Z',
          },
          qrCode: { type: 'string', example: 'QR_CODE_STRING' },
          isActive: { type: 'boolean', example: true },
        },
      },
    },
  })
  async findByUser(@Param('userId') userId: string) {
    return this.ticketsService.findByUserWithEventDetails(userId);
  }

  @Get('event/:eventId/user/:userId')
  @UseGuards(LdapAuthGuard)
  @ApiOperation({ summary: 'Get tickets by event and user ID' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'List of tickets for event and user retrieved successfully',
  })
  async findByEventAndUser(
    @Param('eventId') eventId: string,
    @Param('userId') userId: string,
  ) {
    return this.ticketsService.findByEventAndUser(eventId, userId);
  }

  @Get('status/:status')
  @UseGuards(LdapAuthGuard)
  @ApiOperation({ summary: 'Get tickets by status' })
  @ApiParam({
    name: 'status',
    description: 'Ticket status (active, used, cancelled)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of tickets by status retrieved successfully',
  })
  async findByStatus(@Param('status') status: string) {
    return this.ticketsService.findByStatus(status);
  }

  @Get('event/:eventId/stats')
  @UseGuards(LdapAuthGuard)
  @ApiOperation({ summary: 'Get ticket statistics for an event' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'Ticket statistics retrieved successfully',
  })
  async getTicketStats(@Param('eventId') eventId: string) {
    return this.ticketsService.getTicketStats(eventId);
  }

  @Patch(':id')
  @UseGuards(LdapAuthGuard)
  @ApiOperation({ summary: 'Update a ticket' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ status: 200, description: 'Ticket updated successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return this.ticketsService.update(id, updateTicketDto);
  }

  @Patch(':id/use')
  @UseGuards(LdapAuthGuard)
  @ApiOperation({ summary: 'Mark a ticket as used' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({
    status: 200,
    description: 'Ticket marked as used successfully',
  })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - ticket is not active',
  })
  async markAsUsed(@Param('id') id: string) {
    return this.ticketsService.markAsUsed(id);
  }

  @Patch(':id/cancel')
  @UseGuards(LdapAuthGuard)
  @ApiOperation({ summary: 'Cancel a ticket' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ status: 200, description: 'Ticket cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - ticket is not active',
  })
  async cancelTicket(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.ticketsService.cancelTicket(id, body.reason);
  }

  @Delete(':id')
  @UseGuards(LdapAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a ticket by ID' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ status: 204, description: 'Ticket deleted successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async remove(@Param('id') id: string) {
    await this.ticketsService.remove(id);
  }
}
