import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { StorefrontModule } from './storefront/storefront.module';
import { CommunicationModule } from './communication/communication.module';
import { IntegrationsSummaryModule } from './integrations-summary/integrations-summary.module';
import { ResourceModules } from './modules';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    DashboardModule,
    ReportsModule,
    StorefrontModule,
    CommunicationModule,
    IntegrationsSummaryModule,
    ...ResourceModules,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
