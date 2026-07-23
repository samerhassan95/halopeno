import { PartialType } from '@nestjs/swagger';
import { CreateStockCountDto } from './create-stock-count.dto';

export class UpdateStockCountDto extends PartialType(CreateStockCountDto) {}
