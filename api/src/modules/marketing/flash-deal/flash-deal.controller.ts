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
import { FlashDealService } from './flash-deal.service';
import { CreateFlashDealDto } from './dto/create-flash-deal.dto';
import { UpdateFlashDealDto } from './dto/update-flash-deal.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Marketing')
@ApiBearerAuth()
@Controller('marketing/flash-deals')
export class FlashDealController {
  constructor(private readonly service: FlashDealService) {}

  @Get()
  @ApiOperation({ summary: 'List flash-deals with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single flash-deal by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new flash-deal' })
  create(@Body() dto: CreateFlashDealDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing flash-deal' })
  update(@Param('id') id: string, @Body() dto: UpdateFlashDealDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a flash-deal' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
