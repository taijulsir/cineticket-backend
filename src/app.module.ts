import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './database/prisma/prisma.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { AdsModule } from './modules/ads/ads.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { CitiesModule } from './modules/cities/cities.module';
import { CountriesModule } from './modules/countries/countries.module';
import { CrewsModule } from './modules/crews/crews.module';
import { CustomersModule } from './modules/customers/customers.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { EventsModule } from './modules/events/events.module';
import { HallsModule } from './modules/halls/halls.module';
import { HallSeatsModule } from './modules/hall-seats/hall-seats.module';
import { HealthModule } from './modules/health/health.module';
import { HeroSlidersModule } from './modules/hero-sliders/hero-sliders.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ProducersModule } from './modules/producers/producers.module';
import { PromoCodesModule } from './modules/promo-codes/promo-codes.module';
import { SettingsModule } from './modules/settings/settings.module';
import { SeatsModule } from './modules/seats/seats.module';
import { ShowSeatsModule } from './modules/show-seats/show-seats.module';
import { ShowsModule } from './modules/shows/shows.module';
import { StatesModule } from './modules/states/states.module';
import { TheatersModule } from './modules/theaters/theaters.module';
import { TicketCategoriesModule } from './modules/ticket-categories/ticket-categories.module';
import { ToofanModule } from './modules/toofan/toofan.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 200 }]),
    PrismaModule,
    RedisModule,
    QueueModule,
    StorageModule,
    AuthModule,
    AdminModule,
    CustomersModule,
    EmployeesModule,
    CountriesModule,
    StatesModule,
    CitiesModule,
    TheatersModule,
    HallsModule,
    HallSeatsModule,
    HealthModule,
    EventsModule,
    CrewsModule,
    ProducersModule,
    ShowsModule,
    ShowSeatsModule,
    SeatsModule,
    OrdersModule,
  PaymentsModule,
  PromoCodesModule,
    TicketCategoriesModule,
    HeroSlidersModule,
    AdsModule,
    SettingsModule,
    ToofanModule,
  ],
})
export class AppModule {}
