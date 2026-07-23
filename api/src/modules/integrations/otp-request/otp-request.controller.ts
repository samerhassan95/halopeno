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
import { OtpRequestService } from './otp-request.service';
import { CreateOtpRequestDto } from './dto/create-otp-request.dto';
import { UpdateOtpRequestDto } from './dto/update-otp-request.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Integrations')
@ApiBearerAuth()
@Controller('integrations/otp-requests')
export class OtpRequestController {
  constructor(private readonly service: OtpRequestService) {}

  @Get()
  @ApiOperation({ summary: 'List otp-requests with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single otp-request by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new otp-request' })
  create(@Body() dto: CreateOtpRequestDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing otp-request' })
  update(@Param('id') id: string, @Body() dto: UpdateOtpRequestDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a otp-request' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
