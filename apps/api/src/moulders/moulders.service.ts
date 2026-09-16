import { Injectable } from '@nestjs/common';
import { apiError } from '../common/api-error.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateMoulderDto,
  ListMouldersQuery,
  MoulderDto,
  UpdateMoulderDto,
} from './moulder.dto.js';

const moulderSelect = {
  id: true,
  name: true,
  memberCount: true,
  active: true,
} satisfies Prisma.MoulderSelect;

@Injectable()
export class MouldersService {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateMoulderDto): Promise<MoulderDto> {
    return this.prisma.moulder.create({ data: input, select: moulderSelect });
  }

  /** Active moulders only by default: the day-to-day lists (production entry) must not show retired ones. */
  findAll(query: ListMouldersQuery): Promise<MoulderDto[]> {
    return this.prisma.moulder.findMany({
      where: query.includeInactive ? {} : { active: true },
      select: moulderSelect,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string): Promise<MoulderDto> {
    const moulder = await this.prisma.moulder.findUnique({ where: { id }, select: moulderSelect });
    if (!moulder) throw apiError('moulder_not_found', `Moulder ${id} not found`);
    return moulder;
  }

  async update(id: string, input: UpdateMoulderDto): Promise<MoulderDto> {
    await this.findOne(id);
    return this.prisma.moulder.update({ where: { id }, data: input, select: moulderSelect });
  }
}
