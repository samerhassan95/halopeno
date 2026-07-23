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
import { PushCampaignService } from './push-campaign.service';
import { CreatePushCampaignDto } from './dto/create-push-campaign.dto';
import { UpdatePushCampaignDto } from './dto/update-push-campaign.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Marketing')
@ApiBearerAuth()
@Controller('marketing/push-campaigns')
export class PushCampaignController {
  constructor(private readonly service: PushCampaignService) {}

  @Get()
  @ApiOperation({ summary: 'List push-campaigns with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single push-campaign by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new push-campaign' })
  create(@Body() dto: CreatePushCampaignDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing push-campaign' })
  update(@Param('id') id: string, @Body() dto: UpdatePushCampaignDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a push-campaign' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
