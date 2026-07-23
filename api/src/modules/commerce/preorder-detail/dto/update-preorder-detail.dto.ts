import { PartialType } from '@nestjs/swagger';
import { CreatePreorderDetailDto } from './create-preorder-detail.dto';

export class UpdatePreorderDetailDto extends PartialType(CreatePreorderDetailDto) {}
