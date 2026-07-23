import * as fs from 'fs';
import * as path from 'path';
import { Prisma } from '@prisma/client';
import { resourceManifest } from './resource-manifest';

const SRC = path.join(__dirname, '..', 'src', 'modules');

function toKebab(name: string) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function toCamel(name: string) {
  return name.charAt(0).toLowerCase() + name.slice(1);
}

function pluralize(kebab: string) {
  if (kebab.endsWith('y') && !/[aeiou]y$/.test(kebab)) return kebab.slice(0, -1) + 'ies';
  if (/(s|x|ch|sh)$/.test(kebab)) return kebab + 'es';
  return kebab + 's';
}

function pascal(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

type DmmfField = (typeof models)[number]['fields'][number];

const models = Prisma.dmmf.datamodel.models;
const enums = Prisma.dmmf.datamodel.enums;

function enumValues(enumName: string): string[] {
  const e = enums.find((en) => en.name === enumName);
  return e ? e.values.map((v) => v.name) : [];
}

interface FieldSpec {
  name: string;
  tsType: string;
  decorators: string[];
  optional: boolean;
  isEnum?: string;
}

function buildFieldSpecs(fields: DmmfField[]): FieldSpec[] {
  const specs: FieldSpec[] = [];
  for (const f of fields) {
    if (f.kind === 'object') continue; // skip relation fields, keep scalar FK ids
    if (['id', 'createdAt', 'updatedAt'].includes(f.name)) continue;

    const optional = Boolean(f.hasDefaultValue) || !f.isRequired || f.isList;
    let tsType = 'string';
    const decorators: string[] = [];
    let isEnumName: string | undefined;

    if (f.kind === 'enum') {
      isEnumName = f.type;
      tsType = f.type;
      decorators.push(`@IsIn(${JSON.stringify(enumValues(f.type))})`);
    } else {
      switch (f.type) {
        case 'String':
          tsType = 'string';
          decorators.push('@IsString()');
          break;
        case 'Int':
          tsType = 'number';
          decorators.push('@IsInt()');
          break;
        case 'Float':
        case 'Decimal':
          tsType = 'number';
          decorators.push('@IsNumber()');
          break;
        case 'Boolean':
          tsType = 'boolean';
          decorators.push('@IsBoolean()');
          break;
        case 'DateTime':
          tsType = 'string';
          decorators.push('@IsDateString()');
          break;
        case 'Json':
          tsType = 'any';
          // Json has no shape to validate, but a required Json field still needs at least
          // one decorator or NestJS's global `whitelist: true` ValidationPipe silently
          // strips it from the request body before it reaches Prisma.
          if (!optional) decorators.push('@IsDefined()');
          break;
        default:
          tsType = 'string';
          decorators.push('@IsString()');
      }
    }

    if (f.isList) {
      tsType = `${tsType}[]`;
      decorators.length = 0;
      decorators.push('@IsArray()');
      if (f.type === 'String') decorators.push('@IsString({ each: true })');
    }

    if (optional) decorators.unshift('@IsOptional()');

    specs.push({ name: f.name, tsType, decorators, optional, isEnum: isEnumName });
  }
  return specs;
}

function searchableFields(fields: DmmfField[]): string[] {
  const candidates = fields
    .filter((f) => f.kind === 'scalar' && f.type === 'String' && !f.isList)
    .map((f) => f.name)
    .filter((n) => !['id', 'passwordHash', 'tokenHash', 'keyHash'].includes(n))
    .filter((n) => !/Id$/.test(n));
  const preferred = ['name', 'title', 'email', 'code', 'sku', 'subject', 'orderNumber', 'slug'];
  const ordered = [...preferred.filter((p) => candidates.includes(p)), ...candidates.filter((c) => !preferred.includes(c))];
  return ordered.slice(0, 3);
}

function orderField(fields: DmmfField[]): string {
  if (fields.some((f) => f.name === 'createdAt')) return 'createdAt';
  return 'id';
}

const generatedImports: { className: string; importPath: string }[] = [];

for (const def of resourceManifest) {
  const model = models.find((m) => m.name === def.model);
  if (!model) {
    // eslint-disable-next-line no-console
    console.warn(`Model ${def.model} not found in DMMF, skipping`);
    continue;
  }

  const kebab = toKebab(def.model);
  const kebabPlural = pluralize(kebab);
  const camel = toCamel(def.model);
  const dir = path.join(SRC, def.group, kebab);
  const dtoDir = path.join(dir, 'dto');
  fs.mkdirSync(dtoDir, { recursive: true });

  const specs = buildFieldSpecs(model.fields as unknown as DmmfField[]);
  const enumImports = [...new Set(specs.filter((s) => s.isEnum).map((s) => s.isEnum!))];
  const search = searchableFields(model.fields as unknown as DmmfField[]);
  const orderBy = orderField(model.fields as unknown as DmmfField[]);

  const validatorSet = new Set<string>();
  specs.forEach((s) => s.decorators.forEach((d) => {
    const match = d.match(/@(\w+)\(/);
    if (match) validatorSet.add(match[1]);
  }));

  // --- Create DTO ---
  const createDto = `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ${[...validatorSet].sort().join(', ')} } from 'class-validator';
${enumImports.length ? `import { ${enumImports.join(', ')} } from '@prisma/client';\n` : ''}
export class Create${def.model}Dto {
${specs
  .map((s) => {
    const apiDecorator = s.optional ? 'ApiPropertyOptional' : 'ApiProperty';
    const q = s.optional ? '?' : '!';
    return `  @${apiDecorator}()\n  ${s.decorators.join('\n  ')}\n  ${s.name}${q}: ${s.tsType};`;
  })
  .join('\n\n')}
}
`;
  fs.writeFileSync(path.join(dtoDir, `create-${kebab}.dto.ts`), createDto);

  // --- Update DTO ---
  const updateDto = `import { PartialType } from '@nestjs/swagger';
import { Create${def.model}Dto } from './create-${kebab}.dto';

export class Update${def.model}Dto extends PartialType(Create${def.model}Dto) {}
`;
  fs.writeFileSync(path.join(dtoDir, `update-${kebab}.dto.ts`), updateDto);

  // --- Service ---
  const searchWhere = search.length
    ? `search ? { OR: [${search.map((f) => `{ ${f}: { contains: search, mode: 'insensitive' as const } }`).join(', ')}] } : {}`
    : '{}';

  const service = `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { paginate } from '../../../common/dto/paginated-result';
import { Create${def.model}Dto } from './dto/create-${kebab}.dto';
import { Update${def.model}Dto } from './dto/update-${kebab}.dto';

@Injectable()
export class ${def.model}Service {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const where = ${searchWhere};
    const [data, total] = await Promise.all([
      this.prisma.${camel}.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { ${orderBy}: 'desc' },
      }),
      this.prisma.${camel}.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  findOne(id: string) {
    return this.prisma.${camel}.findUniqueOrThrow({ where: { id } });
  }

  create(dto: Create${def.model}Dto) {
    return this.prisma.${camel}.create({ data: dto as any });
  }

  update(id: string, dto: Update${def.model}Dto) {
    return this.prisma.${camel}.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.${camel}.delete({ where: { id } });
  }
}
`;
  fs.writeFileSync(path.join(dir, `${kebab}.service.ts`), service);

  // --- Controller ---
  const controller = `import {
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
import { ${def.model}Service } from './${kebab}.service';
import { Create${def.model}Dto } from './dto/create-${kebab}.dto';
import { Update${def.model}Dto } from './dto/update-${kebab}.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('${def.tag}')
@ApiBearerAuth()
@Controller('${def.group}/${kebabPlural}')
export class ${def.model}Controller {
  constructor(private readonly service: ${def.model}Service) {}

  @Get()
  @ApiOperation({ summary: 'List ${kebabPlural} with pagination, search and sorting' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single ${kebab} by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new ${kebab}' })
  create(@Body() dto: Create${def.model}Dto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing ${kebab}' })
  update(@Param('id') id: string, @Body() dto: Update${def.model}Dto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a ${kebab}' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
`;
  fs.writeFileSync(path.join(dir, `${kebab}.controller.ts`), controller);

  // --- Module ---
  const moduleFile = `import { Module } from '@nestjs/common';
import { ${def.model}Controller } from './${kebab}.controller';
import { ${def.model}Service } from './${kebab}.service';

@Module({
  controllers: [${def.model}Controller],
  providers: [${def.model}Service],
  exports: [${def.model}Service],
})
export class ${def.model}Module {}
`;
  fs.writeFileSync(path.join(dir, `${kebab}.module.ts`), moduleFile);

  generatedImports.push({
    className: `${def.model}Module`,
    importPath: `./${def.group}/${kebab}/${kebab}.module`,
  });
}

// --- Barrel file ---
const barrel = `// This file is generated by scripts/generate-modules.ts — do not edit by hand.
${generatedImports.map((i) => `import { ${i.className} } from '${i.importPath}';`).join('\n')}

export const ResourceModules = [
${generatedImports.map((i) => `  ${i.className},`).join('\n')}
];
`;
fs.writeFileSync(path.join(SRC, 'index.ts'), barrel);

// eslint-disable-next-line no-console
console.log(`Generated ${generatedImports.length} resource modules.`);
