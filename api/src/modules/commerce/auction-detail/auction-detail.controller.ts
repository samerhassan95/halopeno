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
import { AuctionDetailService } from './auction-detail.service';
import { CreateAuctionDetailDto } from './dto/create-auction-detail.dto';
import { UpdateAuctionDetailDto } from './dto/update-auction-detail.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Commerce')
@ApiBearerAuth()
@Controller('commerce/auction-details')
export class AuctionDetailController {
  constructor(private readonly service: AuctionDetailService) {}

  @Get()
  @ApiOperation({ summary: 'List auction-details with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single auction-detail by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new auction-detail' })
  create(@Body() dto: CreateAuctionDetailDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing auction-detail' })
  update(@Param('id') id: string, @Body() dto: UpdateAuctionDetailDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a auction-detail' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
