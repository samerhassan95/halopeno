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
import { SmsCampaignService } from './sms-campaign.service';
import { CreateSmsCampaignDto } from './dto/create-sms-campaign.dto';
import { UpdateSmsCampaignDto } from './dto/update-sms-campaign.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Marketing')
@ApiBearerAuth()
@Controller('marketing/sms-campaigns')
export class SmsCampaignController {
  constructor(private readonly service: SmsCampaignService) {}

  @Get()
  @ApiOperation({ summary: 'List sms-campaigns with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single sms-campaign by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new sms-campaign' })
  create(@Body() dto: CreateSmsCampaignDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing sms-campaign' })
  update(@Param('id') id: string, @Body() dto: UpdateSmsCampaignDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a sms-campaign' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
