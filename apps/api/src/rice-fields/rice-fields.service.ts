import { Injectable } from '@nestjs/common';
import { apiError } from '../common/api-error.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateRiceFieldDto, RiceFieldDto, UpdateRiceFieldDto } from './rice-field.dto.js';

const riceFieldSelect = {
  id: true,
  name: true,
  location: true,
  surfaceM2: true,
  contractType: true,
} satisfies Prisma.RiceFieldSelect;

@Injectable()
export class RiceFieldsService {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateRiceFieldDto): Promise<RiceFieldDto> {
    return this.prisma.riceField.create({ data: input, select: riceFieldSelect });
  }

  findAll(): Promise<RiceFieldDto[]> {
    return this.prisma.riceField.findMany({ select: riceFieldSelect, orderBy: { name: 'asc' } });
  }

  async findOne(id: string): Promise<RiceFieldDto> {
    const field = await this.prisma.riceField.findUnique({
      where: { id },
      select: riceFieldSelect,
    });
    if (!field) throw apiError('rice_field_not_found', `Rice field ${id} not found`);
    return field;
  }

  async update(id: string, input: UpdateRiceFieldDto): Promise<RiceFieldDto> {
    await this.findOne(id);
    return this.prisma.riceField.update({ where: { id }, data: input, select: riceFieldSelect });
  }
}
