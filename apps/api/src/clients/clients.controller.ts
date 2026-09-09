import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { uuidSchema } from '../common/uuid.schema.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import {
  type ClientDto,
  type CreateClientDto,
  createClientSchema,
  type UpdateClientDto,
  updateClientSchema,
} from './client.dto.js';
import { ClientsService } from './clients.service.js';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(createClientSchema)) body: CreateClientDto,
  ): Promise<ClientDto> {
    return this.clients.create(body);
  }

  @Get()
  findAll(): Promise<ClientDto[]> {
    return this.clients.findAll();
  }

  @Get(':id')
  findOne(@Param('id', new ZodValidationPipe(uuidSchema)) id: string): Promise<ClientDto> {
    return this.clients.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(updateClientSchema)) body: UpdateClientDto,
  ): Promise<ClientDto> {
    return this.clients.update(id, body);
  }
}
