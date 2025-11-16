import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LdapAuthGuard } from '../../auth/guards/ldap-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { LoginDto } from '../dto/login.dto';
import { User } from '../user.schema';
import { UserService } from './user.service';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseGuards(LdapAuthGuard)
  async create(@Body() user: User) {
    return this.userService.create(user);
  }

  @Post('login-without-password')
  @Public()
  @ApiOperation({
    summary: 'Login or create user with email only',
    description:
      'Authenticate user with email only (no password required). If user exists, returns user data. If not, creates new user automatically with default role "user".',
  })
  @ApiBody({
    type: LoginDto,
    description: 'User email for authentication',
    examples: {
      university_email: {
        summary: 'University email example',
        description: 'Example with university email',
        value: {
          email: 'estudiante@universidad.edu',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully (existing user)',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        name: 'juan.perez',
        email: 'juan.perez@universidad.edu',
        password: '',
        role: 'user',
        isGoogleUser: false,
        createdAt: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User created and logged in successfully (new user)',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439012',
        name: 'maria.garcia',
        email: 'maria.garcia@universidad.edu',
        password: '',
        role: 'user',
        isGoogleUser: false,
        createdAt: '2024-01-15T14:45:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid email format',
    schema: {
      example: {
        statusCode: 400,
        message: ['El email debe tener un formato válido'],
        error: 'Bad Request',
      },
    },
  })
  async loginWithoutPassword(@Body() loginDto: LoginDto) {
    return this.userService.loginOrCreate(loginDto);
  }

  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Put(':id')
  @UseGuards(LdapAuthGuard)
  async update(@Param('id') id: string, @Body() user: Partial<User>) {
    return this.userService.update(id, user);
  }

  @Delete(':id')
  @UseGuards(LdapAuthGuard)
  async remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
