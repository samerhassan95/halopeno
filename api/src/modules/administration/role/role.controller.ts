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
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('Administration')
@ApiBearerAuth()
@Controller('administration/roles')
export class RoleController {
  constructor(private readonly service: RoleService) {}

  @Get()
  @ApiOperation({ summary: 'List roles with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single role by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  create(@Body() dto: CreateRoleDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing role' })
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a role' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get(':id/permissions')
  @ApiOperation({ summary: 'Get the permission ids assigned to a role' })
  getPermissions(@Param('id') id: string) {
    return this.service.getPermissions(id);
  }

  @Patch(':id/permissions')
  @ApiOperation({ summary: 'Replace the permission ids assigned to a role' })
  setPermissions(@Param('id') id: string, @Body('permissionIds') permissionIds: string[]) {
    return this.service.setPermissions(id, permissionIds ?? []);
  }
}
