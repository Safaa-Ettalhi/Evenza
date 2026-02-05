import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { EventsModule } from '../events/events.module';
import { ReservationsModule } from '../reservations/reservations.module';

@Module({
  imports: [EventsModule, ReservationsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
