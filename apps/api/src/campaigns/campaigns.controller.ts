import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { uuidSchema } from '../common/uuid.schema.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import {
  type CampaignDto,
  type CreateCampaignDto,
  createCampaignSchema,
  type UpdateCampaignDto,
  updateCampaignSchema,
} from './campaign.dto.js';
import { CampaignsService } from './campaigns.service.js';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaigns: CampaignsService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(createCampaignSchema)) body: CreateCampaignDto,
  ): Promise<CampaignDto> {
    return this.campaigns.create(body);
  }

  @Get()
  findAll(): Promise<CampaignDto[]> {
    return this.campaigns.findAll();
  }

  @Get(':id')
  findOne(@Param('id', new ZodValidationPipe(uuidSchema)) id: string): Promise<CampaignDto> {
    return this.campaigns.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(updateCampaignSchema)) body: UpdateCampaignDto,
  ): Promise<CampaignDto> {
    return this.campaigns.update(id, body);
  }
}
