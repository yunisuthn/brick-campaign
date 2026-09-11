import { Injectable } from '@nestjs/common';
import { apiError } from '../common/api-error.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ClientDto, CreateClientDto, UpdateClientDto } from './client.dto.js';

const clientSelect = {
  id: true,
  name: true,
  phone: true,
  locality: true,
} satisfies Prisma.ClientSelect;

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateClientDto): Promise<ClientDto> {
    return this.prisma.client.create({ data: input, select: clientSelect });
  }

  findAll(): Promise<ClientDto[]> {
    return this.prisma.client.findMany({ select: clientSelect, orderBy: { name: 'asc' } });
  }

  async findOne(id: string): Promise<ClientDto> {
    const client = await this.prisma.client.findUnique({ where: { id }, select: clientSelect });
    if (!client) throw apiError('client_not_found', `Client ${id} not found`);
    return client;
  }

  async update(id: string, input: UpdateClientDto): Promise<ClientDto> {
    await this.findOne(id);
    return this.prisma.client.update({ where: { id }, data: input, select: clientSelect });
  }
}
