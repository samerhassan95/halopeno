import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@ApiQuery({ name: 'range', required: false, enum: ['7d', '30d', '90d', '365d'] })
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('sales')
  @ApiOperation({ summary: 'Sales overview: KPIs, trend, breakdowns by product/category/seller/channel/payment/country' })
  getSales(@Query('range') range?: string) {
    return this.service.getSalesReport(range);
  }

  @Get('products')
  @ApiOperation({ summary: 'Product performance: best-selling, low-performing, profitability, returns' })
  getProducts(@Query('range') range?: string) {
    return this.service.getProductsReport(range);
  }

  @Get('sellers')
  @ApiOperation({ summary: 'Seller performance: sales, commission, refund/cancellation rate, ratings' })
  getSellers(@Query('range') range?: string) {
    return this.service.getSellersReport(range);
  }

  @Get('customers')
  @ApiOperation({ summary: 'Customer overview: acquisition, retention, LTV, segments, locations' })
  getCustomers(@Query('range') range?: string) {
    return this.service.getCustomersReport(range);
  }

  @Get('tax')
  @ApiOperation({ summary: 'Tax summary: collected/refunded/net liability, by class/country/seller, transactions' })
  getTax(@Query('range') range?: string) {
    return this.service.getTaxReport(range);
  }

  @Get('marketing')
  @ApiOperation({ summary: 'Marketing analytics: campaign ROI/ROAS, revenue by channel, attribution, funnel' })
  getMarketing(@Query('range') range?: string) {
    return this.service.getMarketingAnalytics(range);
  }
}
