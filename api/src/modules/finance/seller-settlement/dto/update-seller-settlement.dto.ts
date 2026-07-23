import { PartialType } from '@nestjs/swagger';
import { CreateSellerSettlementDto } from './create-seller-settlement.dto';

export class UpdateSellerSettlementDto extends PartialType(CreateSellerSettlementDto) {}
