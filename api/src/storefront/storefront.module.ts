import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { StorefrontController } from './storefront.controller';
import { StorefrontExtraController } from './storefront-extra.controller';
import { StorefrontService } from './storefront.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [StorefrontController, StorefrontExtraController],
  providers: [StorefrontService],
  exports: [StorefrontService],
})
export class StorefrontModule {}
