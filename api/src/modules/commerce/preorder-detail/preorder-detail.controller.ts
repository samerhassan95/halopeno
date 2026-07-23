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
import { PreorderDetailService } from './preorder-detail.service';
import { CreatePreorderDetailDto } from './dto/create-preorder-detail.dto';
import { UpdatePreorderDetailDto } from './dto/update-preorder-detail.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Commerce')
@ApiBearerAuth()
@Controller('commerce/preorder-details')
export class PreorderDetailController {
  constructor(private readonly service: PreorderDetailService) {}

  @Get()
  @ApiOperation({ summary: 'List preorder-details with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single preorder-detail by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new preorder-detail' })
  create(@Body() dto: CreatePreorderDetailDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing preorder-detail' })
  update(@Param('id') id: string, @Body() dto: UpdatePreorderDetailDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a preorder-detail' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
