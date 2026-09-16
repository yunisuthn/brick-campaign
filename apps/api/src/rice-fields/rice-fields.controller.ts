import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { uuidSchema } from '../common/uuid.schema.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import {
  type CreateRiceFieldDto,
  createRiceFieldSchema,
  type RiceFieldDto,
  type UpdateRiceFieldDto,
  updateRiceFieldSchema,
} from './rice-field.dto.js';
import { RiceFieldsService } from './rice-fields.service.js';

@Controller('rice-fields')
export class RiceFieldsController {
  constructor(private readonly riceFields: RiceFieldsService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(createRiceFieldSchema)) body: CreateRiceFieldDto,
  ): Promise<RiceFieldDto> {
    return this.riceFields.create(body);
  }

  @Get()
  findAll(): Promise<RiceFieldDto[]> {
    return this.riceFields.findAll();
  }

  @Get(':id')
  findOne(@Param('id', new ZodValidationPipe(uuidSchema)) id: string): Promise<RiceFieldDto> {
    return this.riceFields.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(updateRiceFieldSchema)) body: UpdateRiceFieldDto,
  ): Promise<RiceFieldDto> {
    return this.riceFields.update(id, body);
  }
}
