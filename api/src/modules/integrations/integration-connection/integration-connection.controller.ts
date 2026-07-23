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
import { IntegrationConnectionService } from './integration-connection.service';
import { CreateIntegrationConnectionDto } from './dto/create-integration-connection.dto';
import { UpdateIntegrationConnectionDto } from './dto/update-integration-connection.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Integrations')
@ApiBearerAuth()
@Controller('integrations/integration-connections')
export class IntegrationConnectionController {
  constructor(private readonly service: IntegrationConnectionService) {}

  @Get()
  @ApiOperation({ summary: 'List integration-connections with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single integration-connection by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new integration-connection' })
  create(@Body() dto: CreateIntegrationConnectionDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing integration-connection' })
  update(@Param('id') id: string, @Body() dto: UpdateIntegrationConnectionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a integration-connection' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
