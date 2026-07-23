import { PartialType } from '@nestjs/swagger';
import { CreateLoyaltyTransactionDto } from './create-loyalty-transaction.dto';

export class UpdateLoyaltyTransactionDto extends PartialType(CreateLoyaltyTransactionDto) {}
