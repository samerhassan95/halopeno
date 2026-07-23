import { PartialType } from '@nestjs/swagger';
import { CreateAccountingEntryDto } from './create-accounting-entry.dto';

export class UpdateAccountingEntryDto extends PartialType(CreateAccountingEntryDto) {}
