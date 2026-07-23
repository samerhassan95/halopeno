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
import { LoyaltyTransactionService } from './loyalty-transaction.service';
import { CreateLoyaltyTransactionDto } from './dto/create-loyalty-transaction.dto';
import { UpdateLoyaltyTransactionDto } from './dto/update-loyalty-transaction.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers/loyalty-transactions')
export class LoyaltyTransactionController {
  constructor(private readonly service: LoyaltyTransactionService) {}

  @Get()
  @ApiOperation({ summary: 'List loyalty-transactions with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single loyalty-transaction by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new loyalty-transaction' })
  create(@Body() dto: CreateLoyaltyTransactionDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing loyalty-transaction' })
  update(@Param('id') id: string, @Body() dto: UpdateLoyaltyTransactionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a loyalty-transaction' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
