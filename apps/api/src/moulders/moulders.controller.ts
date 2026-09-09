import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { uuidSchema } from '../common/uuid.schema.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import {
  type CreateMoulderDto,
  createMoulderSchema,
  type ListMouldersQuery,
  listMouldersQuerySchema,
  type MoulderDto,
  type UpdateMoulderDto,
  updateMoulderSchema,
} from './moulder.dto.js';
import { MouldersService } from './moulders.service.js';

@Controller('moulders')
export class MouldersController {
  constructor(private readonly moulders: MouldersService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(createMoulderSchema)) body: CreateMoulderDto,
  ): Promise<MoulderDto> {
    return this.moulders.create(body);
  }

  @Get()
  findAll(
    @Query(new ZodValidationPipe(listMouldersQuerySchema)) query: ListMouldersQuery,
  ): Promise<MoulderDto[]> {
    return this.moulders.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', new ZodValidationPipe(uuidSchema)) id: string): Promise<MoulderDto> {
    return this.moulders.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(updateMoulderSchema)) body: UpdateMoulderDto,
  ): Promise<MoulderDto> {
    return this.moulders.update(id, body);
  }
}
