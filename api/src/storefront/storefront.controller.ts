import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Storefront')
@Controller('storefront')
export class StorefrontController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get('homepage-sections')
  @ApiOperation({ summary: 'Public read-only homepage section layout for the storefront' })
  async getHomepageSections() {
    const row = await this.prisma.setting.findUnique({
      where: { group_key: { group: 'storefront', key: 'homepage_sections' } },
    });
    return { value: row?.value ?? null };
  }

  @Public()
  @Get('global-styles')
  @ApiOperation({ summary: 'Public read-only brand color/radius overrides for the storefront theme' })
  async getGlobalStyles() {
    const row = await this.prisma.setting.findUnique({
      where: { group_key: { group: 'storefront', key: 'global_styles' } },
    });
    return { value: row?.value ?? null };
  }

  @Public()
  @Get('active-theme')
  @ApiOperation({ summary: 'Public active storefront theme identifier and deployment metadata' })
  async getActiveTheme() {
    const row = await this.prisma.setting.findUnique({
      where: { group_key: { group: 'storefront', key: 'active_theme' } },
    });
    return { value: row?.value ?? { id: 'classic' } };
  }
}
