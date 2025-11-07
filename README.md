# Cultural Places API

[![Node.js CI](https://github.com/diaznicolasandres1/desarrollo-apps-2-backend-1/actions/workflows/node.js.yml/badge.svg)](https://github.com/diaznicolasandres1/desarrollo-apps-2-backend-1/actions/workflows/node.js.yml)
[![codecov](https://codecov.io/gh/diaznicolasandres1/desarrollo-apps-2-backend-1/graph/badge.svg?token=8KBQJ1R5UZ)](https://codecov.io/gh/diaznicolasandres1/desarrollo-apps-2-backend-1)

API para gestionar lugares culturales de Buenos Aires (museos, centros culturales, teatros, cines, etc.)

## 🚀 Live Demo

- **API:** [https://cultural-places-api.onrender.com](https://cultural-places-api.onrender.com)
- **Documentación:** [https://cultural-places-api.onrender.com/docs](https://cultural-places-api.onrender.com/docs)

## 🛠 Tech Stack

- **Framework:** NestJS
- **Database:** MongoDB with Mongoose
- **Language:** TypeScript
- **Documentation:** Swagger/OpenAPI
- **Testing:** Jest
- **Validation:** Class-validator
- **Architecture:** Clean Architecture with Repository Pattern
- **Messaging:** RabbitMQ
- **Caching:** N/A
- **Email Service:** Nodemailer
- **QR Code Generation:** QRCode

## 📋 Features

### ✅ Implemented
- **CRUD Operations** for Cultural Places
- **Events Management** system with ticket types
- **Ticket Management** system (purchase, validation, history)
- **User Management** system (authentication, registration, profiles)
- **Advanced Filtering** (by category, rating, location)
- **Geospatial Queries** (nearby places)
- **Schedule Management** (open/closed days)
- **Email Notifications** system for ticket confirmations
- **Event-driven Notifications** over RabbitMQ topics
- **QR Code Generation** for tickets
- **Real-time Notifications** for event updates
- **API Documentation** with Swagger
- **Unit Tests** with high coverage
- **Clean Architecture** implementation

### 🆕 Recent Updates (v1.1)
- **📝 Cultural Place Descriptions**: Added detailed descriptions to all cultural places
- **🎭 Enhanced Event Responses**: Events now include complete cultural place information
- **🚀 Improved Frontend Experience**: Reduced API calls with populated data
- **📚 Updated Documentation**: Complete API examples and guides

### 🆕 Latest Features (v2.0)
- **📧 Email System**: Automated ticket confirmations and event notifications
- **⚡ Queue Processing**: Background job processing for notifications
- **🔔 Real-time Notifications**: Event updates and ticket status changes
- **📱 QR Code Tickets**: Digital tickets with QR code generation
- **👥 User Management**: Complete user authentication and profile system
- **🗄 Messaging-First Notifications**: Event changes broadcast via RabbitMQ

## 🏗 Architecture

```
src/
├── cultural-places/          # Cultural Places module
│   ├── dto/                 # Data Transfer Objects
│   ├── interfaces/          # Repository interfaces
│   ├── repositories/        # Data access layer
│   ├── schemas/            # MongoDB schemas
│   ├── __tests__/          # Unit tests
│   ├── cultural-places.controller.ts
│   ├── cultural-places.service.ts
│   └── cultural-places.module.ts
├── events/                  # Events module
│   ├── dto/                 # Data Transfer Objects
│   ├── interfaces/          # Repository interfaces
│   ├── repositories/        # Data access layer
│   ├── schemas/            # MongoDB schemas
│   ├── __tests__/          # Unit tests
│   ├── event-inventory.service.ts
│   ├── events.controller.ts
│   ├── events.service.ts
│   └── events.module.ts
├── tickets/                 # Tickets module
│   ├── dto/                 # Data Transfer Objects
│   ├── interfaces/          # Repository interfaces
│   ├── repositories/        # Data access layer
│   ├── schemas/            # MongoDB schemas
│   ├── __tests__/          # Unit tests
│   ├── tickets.controller.ts
│   ├── tickets.service.ts
│   └── tickets.module.ts
├── users/                   # Users module
│   ├── dto/                 # Data Transfer Objects
│   ├── interfaces/          # Repository interfaces
│   ├── repositories/        # Data access layer
│   ├── user/               # User sub-module
│   ├── user.schema.ts      # User MongoDB schema
│   └── users.module.ts
├── notifications/           # Notifications module
│   ├── __tests__/          # Unit tests
│   ├── event-notification.processor.ts
│   ├── event-notification.service.ts
│   └── notifications.module.ts
├── email/                   # Email service module
│   ├── __tests__/          # Unit tests
│   ├── email.service.ts
│   └── email.module.ts
├── common/                  # Common utilities
│   └── exceptions/         # Custom exceptions
├── config/                  # Configuration files
└── main.ts                  # Application entry point
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Redis (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd desarrollo-apps-2-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup**
```bash
# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
MONGODB_URI=mongodb://localhost:27017/cultural-places
PORT=3000
NODE_ENV=development

# Email Configuration (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@cultural-places.com

# Redis Configuration (for caching and queues)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

4. **Run the application**
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

5. **Access the API**
- **API:** http://localhost:3000/api/v1
- **Documentation:** http://localhost:3000/docs

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📚 API Endpoints

### Cultural Places

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/cultural-places` | Get all places with filtering |
| `POST` | `/api/v1/cultural-places` | Create new place |
| `GET` | `/api/v1/cultural-places/:id` | Get place by ID |
| `PUT` | `/api/v1/cultural-places/:id` | Update place |
| `DELETE` | `/api/v1/cultural-places/:id` | Delete place |
| `GET` | `/api/v1/cultural-places/category/:category` | Filter by category |
| `GET` | `/api/v1/cultural-places/open/:day` | Get open places by day |
| `GET` | `/api/v1/cultural-places/top-rated` | Get top rated places |
| `GET` | `/api/v1/cultural-places/nearby` | Get nearby places |
| `PATCH` | `/api/v1/cultural-places/:id/toggle-active` | Toggle active status |

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/events` | Create new event |
| `GET` | `/api/v1/events` | Get all events with filtering |
| `GET` | `/api/v1/events/active` | Get active events only |
| `GET` | `/api/v1/events/:id` | Get event by ID |
| `PATCH` | `/api/v1/events/:id` | Update event |
| `DELETE` | `/api/v1/events/:id` | Delete event |
| `GET` | `/api/v1/events/cultural-place/:culturalPlaceId` | Get events by place |
| `GET` | `/api/v1/events/date-range/:startDate/:endDate` | Get events by date range |
| `PATCH` | `/api/v1/events/:id/toggle-active` | Toggle event status |

### Tickets

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/tickets/purchase` | Purchase tickets for an event |
| `GET` | `/api/v1/tickets` | Get all tickets with filtering |
| `GET` | `/api/v1/tickets/active` | Get active tickets only |
| `GET` | `/api/v1/tickets/:id` | Get ticket by ID |
| `GET` | `/api/v1/tickets/event/:eventId` | Get tickets by event |
| `GET` | `/api/v1/tickets/user/:userId` | Get tickets by user |
| `GET` | `/api/v1/tickets/event/:eventId/user/:userId` | Get tickets by event and user |
| `GET` | `/api/v1/tickets/status/:status` | Get tickets by status |
| `GET` | `/api/v1/tickets/event/:eventId/stats` | Get ticket statistics for event |
| `PATCH` | `/api/v1/tickets/:id` | Update ticket |
| `PATCH` | `/api/v1/tickets/:id/use` | Mark ticket as used |
| `PATCH` | `/api/v1/tickets/:id/cancel` | Cancel ticket |
| `DELETE` | `/api/v1/tickets/:id` | Delete ticket |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/users/register` | Register new user |
| `POST` | `/api/v1/users/login` | User login |
| `GET` | `/api/v1/users` | Get all users |
| `GET` | `/api/v1/users/:id` | Get user by ID |
| `PUT` | `/api/v1/users/:id` | Update user |
| `DELETE` | `/api/v1/users/:id` | Delete user |

### Query Parameters

- `category`: Filter by category (Museo, Cine, Centro Cultural, etc.)
- `isActive`: Filter by active status (true/false)
- `minRating`: Minimum rating filter (0-5)
- `maxRating`: Maximum rating filter (0-5)
- `lat`, `lng`, `radius`: For nearby places search

## 🗄 Database Schema

### Cultural Place
```typescript
{
  _id: ObjectId;            // MongoDB ObjectId
  name: string;              // Place name
  category: string;          // Museo, Cine, Centro Cultural, Teatro, etc.
  characteristics: string[]; // Features list
  schedules: {              // Weekly schedules
    monday: { open: string, close: string, closed: boolean };
    tuesday: { open: string, close: string, closed: boolean };
    wednesday: { open: string, close: string, closed: boolean };
    thursday: { open: string, close: string, closed: boolean };
    friday: { open: string, close: string, closed: boolean };
    saturday: { open: string, close: string, closed: boolean };
    sunday: { open: string, close: string, closed: boolean };
  };
  contact: {                // Contact information
    address: string;
    coordinates: { lat: number, lng: number };
    phone: string;
    website: string;
    email: string;
  };
  image: string;            // Image URL
  rating: number;           // Rating (0-5)
  isActive: boolean;        // Active status
  createdAt: Date;          // Creation timestamp
  updatedAt: Date;          // Last update timestamp
}
```

### Event
```typescript
{
  _id: ObjectId;            // MongoDB ObjectId
  culturalPlaceId: {         // Populated Cultural Place object
    _id: ObjectId;           // Cultural Place ID
    name: string;            // Cultural Place name
    description: string;     // Cultural Place description
    category: string;        // Cultural Place category
    characteristics: string[]; // Cultural Place features
    contact: {               // Cultural Place contact info
      address: string;
      coordinates: { lat: number, lng: number };
      phone: string;
      website: string;
      email: string;
    };
    image: string;           // Cultural Place image
    rating: number;          // Cultural Place rating
  };
  name: string;              // Event name
  description: string;       // Event description
  date: Date;               // Event date
  time: string;              // Event time (HH:MM format)
  ticketTypes: [             // Available ticket types
    {
      type: string;          // 'general', 'vip', 'jubilados', 'niños'
      price: number;         // Ticket price
      initialQuantity: number; // Initial available quantity
      soldQuantity: number;   // Sold quantity
      isActive: boolean;      // Ticket type active status
    }
  ];
  isActive: boolean;         // Event active status
  createdAt: Date;           // Creation timestamp
  updatedAt: Date;          // Last update timestamp
  availableQuantity: number; // Virtual field: calculated available tickets
}
```

### Ticket
```typescript
{
  _id: ObjectId;            // MongoDB ObjectId
  eventId: ObjectId;         // Reference to Event
  userId: ObjectId;          // Reference to User
  ticketType: string;        // 'general', 'vip', 'jubilados', 'niños'
  price: number;             // Ticket price
  status: string;            // 'active', 'used', 'cancelled'
  usedAt?: Date;             // When ticket was used
  cancelledAt?: Date;        // When ticket was cancelled
  cancellationReason?: string; // Reason for cancellation
  isActive: boolean;         // Active status
  createdAt: Date;           // Creation timestamp
  updatedAt: Date;          // Last update timestamp
}
```

### User
```typescript
{
  _id: ObjectId;            // MongoDB ObjectId
  email: string;             // User email (unique)
  password: string;          // Hashed password
  firstName: string;         // User first name
  lastName: string;          // User last name
  phone?: string;            // Optional phone number
  dateOfBirth?: Date;        // Optional date of birth
  isActive: boolean;         // User active status
  createdAt: Date;           // Creation timestamp
  updatedAt: Date;          // Last update timestamp
}
```

## 🚀 Deployment

### Render (Recommended)

1. **Connect your GitHub repository** to Render
2. **Create a new Web Service**
3. **Configure environment variables:**
   - `NODE_ENV`: production
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `PORT`: 10000 (Render default)
4. **Build Command:** `npm install && npm run build`
5. **Start Command:** `npm run start:prod`

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | development |
| `PORT` | Server port | 3000 |
| `MONGODB_URI` | MongoDB connection string | localhost |
| `EMAIL_HOST` | SMTP server host | smtp.gmail.com |
| `EMAIL_PORT` | SMTP server port | 587 |
| `EMAIL_USER` | SMTP username | - |
| `EMAIL_PASS` | SMTP password | - |
| `EMAIL_FROM` | From email address | noreply@cultural-places.com |
| `REDIS_URL` | Redis connection string | redis://localhost:6379 |
| `REDIS_HOST` | Redis host | localhost |
| `REDIS_PORT` | Redis port | 6379 |
| `REDIS_PASSWORD` | Redis password | - |
| `REDIS_DB` | Redis database number | 0 |

## 📊 Project Status

- **✅ Phase 1:** CRUD Operations (Complete)
- **✅ Phase 2:** Advanced Features (Complete)
- **✅ Phase 3:** Events Management (Complete)
- **✅ Phase 4:** Ticket Management (Complete)
- **✅ Phase 5:** User Management (Complete)
- **✅ Phase 6:** Notifications & Email System (Complete)
- **✅ Phase 7:** RabbitMQ-based Event Notifications (Complete)
- **✅ Phase 8:** QR Code Generation (Complete)

## 📝 License

This project is licensed under the MIT License.

## 🚀 Key Features

### 🎫 Complete Ticket Management System
- **Digital Tickets**: QR code generation for each ticket
- **Email Notifications**: Automatic confirmation emails with ticket details
- **Real-time Updates**: Queue-based processing for instant notifications
- **Ticket Validation**: Secure ticket validation and usage tracking

### 👥 User Management
- **User Registration & Authentication**: Complete user lifecycle management
- **Profile Management**: User profiles with personal information
- **Ticket History**: Users can view their complete ticket purchase history

### 📧 Communication System
- **Email Service**: Automated email notifications using Nodemailer
- **Event Notifications**: RabbitMQ topics + handlers (no additional queue broker)

### 🏗 Scalable Architecture
- **Clean Architecture**: Repository pattern with dependency injection
- **Microservices Ready**: Modular design for easy scaling
- **High Test Coverage**: Comprehensive unit and integration tests
- **Production Ready**: Docker support and cloud deployment configuration

## 📞 Support

- **API Documentation**: [https://cultural-places-api.onrender.com/docs](https://cultural-places-api.onrender.com/docs)
- **Live API**: [https://cultural-places-api.onrender.com](https://cultural-places-api.onrender.com)
- **GitHub Repository**: [https://github.com/diaznicolasandres1/desarrollo-apps-2-backend-1](https://github.com/diaznicolasandres1/desarrollo-apps-2-backend-1)