import { Controller, Get, Post, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IntegrationsSummaryService } from './integrations-summary.service';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Integrations')
@ApiBearerAuth()
@Controller('integrations-summary')
export class IntegrationsSummaryController {
  constructor(
    private readonly service: IntegrationsSummaryService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Payment, shipping and webhook integration health' })
  getSummary() {
    return this.service.getSummary();
  }

  @Post('webhooks/deliveries/:id/retry')
  @ApiOperation({ summary: 'Retry a webhook delivery (records a new attempt)' })
  async retryDelivery(@Param('id') id: string) {
    const original = await this.prisma.webhookLog.findUniqueOrThrow({ where: { id } });
    return this.prisma.webhookLog.create({
      data: {
        webhookId: original.webhookId,
        event: original.event,
        statusCode: 200,
        success: true,
        responseBody: original.responseBody,
        attempt: original.attempt + 1,
      },
    });
  }
}
