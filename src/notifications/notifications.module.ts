import { Module, forwardRef } from '@nestjs/common';
import { EventNotificationService } from './event-notification.service';
import { EmailModule } from '../email/email.module';
import { TicketsModule } from '../tickets/tickets.module';
 
 @Module({
   imports: [
     EmailModule,
     forwardRef(() => TicketsModule),
   ],
   providers: [EventNotificationService],
   exports: [EventNotificationService],
 })
 export class NotificationsModule {}
