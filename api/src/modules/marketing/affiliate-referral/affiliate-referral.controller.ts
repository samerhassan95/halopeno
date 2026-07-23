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
import { AffiliateReferralService } from './affiliate-referral.service';
import { CreateAffiliateReferralDto } from './dto/create-affiliate-referral.dto';
import { UpdateAffiliateReferralDto } from './dto/update-affiliate-referral.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Marketing')
@ApiBearerAuth()
@Controller('marketing/affiliate-referrals')
export class AffiliateReferralController {
  constructor(private readonly service: AffiliateReferralService) {}

  @Get()
  @ApiOperation({ summary: 'List affiliate-referrals with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single affiliate-referral by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new affiliate-referral' })
  create(@Body() dto: CreateAffiliateReferralDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing affiliate-referral' })
  update(@Param('id') id: string, @Body() dto: UpdateAffiliateReferralDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a affiliate-referral' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
