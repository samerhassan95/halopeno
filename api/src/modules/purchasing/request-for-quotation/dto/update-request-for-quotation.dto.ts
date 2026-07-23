import { PartialType } from '@nestjs/swagger';
import { CreateRequestForQuotationDto } from './create-request-for-quotation.dto';

export class UpdateRequestForQuotationDto extends PartialType(CreateRequestForQuotationDto) {}
