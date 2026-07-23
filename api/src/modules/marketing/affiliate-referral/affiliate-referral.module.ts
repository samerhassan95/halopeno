import { Module } from '@nestjs/common';
import { AffiliateReferralController } from './affiliate-referral.controller';
import { AffiliateReferralService } from './affiliate-referral.service';

@Module({
  controllers: [AffiliateReferralController],
  providers: [AffiliateReferralService],
  exports: [AffiliateReferralService],
})
export class AffiliateReferralModule {}
