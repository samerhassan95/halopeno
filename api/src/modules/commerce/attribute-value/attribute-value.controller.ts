import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AttributeValueService } from './attribute-value.service';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { UpdateAttributeValueDto } from './dto/update-attribute-value.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Commerce')
@ApiBearerAuth()
@Controller('commerce/attribute-values')
export class AttributeValueController {
  constructor(private readonly service: AttributeValueService) {}

  @Get()
  @ApiOperation({ summary: 'List attribute-values with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single attribute-value by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new attribute-value' })
  create(@Body() dto: CreateAttributeValueDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing attribute-value' })
  update(@Param('id') id: string, @Body() dto: UpdateAttributeValueDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a attribute-value' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
