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
import { DeliveryAgentService } from './delivery-agent.service';
import { CreateDeliveryAgentDto } from './dto/create-delivery-agent.dto';
import { UpdateDeliveryAgentDto } from './dto/update-delivery-agent.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Shipping')
@ApiBearerAuth()
@Controller('shipping/delivery-agents')
export class DeliveryAgentController {
  constructor(private readonly service: DeliveryAgentService) {}

  @Get()
  @ApiOperation({ summary: 'List delivery-agents with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single delivery-agent by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new delivery-agent' })
  create(@Body() dto: CreateDeliveryAgentDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing delivery-agent' })
  update(@Param('id') id: string, @Body() dto: UpdateDeliveryAgentDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a delivery-agent' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
