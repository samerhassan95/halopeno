import { PartialType } from '@nestjs/swagger';
import { CreateProductQuestionDto } from './create-product-question.dto';

export class UpdateProductQuestionDto extends PartialType(CreateProductQuestionDto) {}
