import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CommunicationService } from './communication.service';

@ApiTags('Communication')
@ApiBearerAuth()
@Controller('communication')
export class CommunicationController {
  constructor(private readonly service: CommunicationService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Communication dashboard: ticket/complaint/message KPIs and breakdowns' })
  getSummary() {
    return this.service.getSummary();
  }
}
