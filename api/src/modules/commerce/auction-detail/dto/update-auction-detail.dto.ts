import { PartialType } from '@nestjs/swagger';
import { CreateAuctionDetailDto } from './create-auction-detail.dto';

export class UpdateAuctionDetailDto extends PartialType(CreateAuctionDetailDto) {}
