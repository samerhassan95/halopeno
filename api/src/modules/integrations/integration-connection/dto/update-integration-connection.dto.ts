import { PartialType } from '@nestjs/swagger';
import { CreateIntegrationConnectionDto } from './create-integration-connection.dto';

export class UpdateIntegrationConnectionDto extends PartialType(CreateIntegrationConnectionDto) {}
