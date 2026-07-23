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
import { BidService } from './bid.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { UpdateBidDto } from './dto/update-bid.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Commerce')
@ApiBearerAuth()
@Controller('commerce/bids')
export class BidController {
  constructor(private readonly service: BidService) {}

  @Get()
  @ApiOperation({ summary: 'List bids with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single bid by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new bid' })
  create(@Body() dto: CreateBidDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing bid' })
  update(@Param('id') id: string, @Body() dto: UpdateBidDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bid' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
