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
import { PickupLocationService } from './pickup-location.service';
import { CreatePickupLocationDto } from './dto/create-pickup-location.dto';
import { UpdatePickupLocationDto } from './dto/update-pickup-location.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Shipping')
@ApiBearerAuth()
@Controller('shipping/pickup-locations')
export class PickupLocationController {
  constructor(private readonly service: PickupLocationService) {}

  @Get()
  @ApiOperation({ summary: 'List pickup-locations with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single pickup-location by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new pickup-location' })
  create(@Body() dto: CreatePickupLocationDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing pickup-location' })
  update(@Param('id') id: string, @Body() dto: UpdatePickupLocationDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a pickup-location' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
