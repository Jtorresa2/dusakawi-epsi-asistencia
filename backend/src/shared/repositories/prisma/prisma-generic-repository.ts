import type { GenericEntity } from '@shared/entities/generic-entity';
import type { FindAllOptions, GenericRepository } from '../generic-repository';
import type { PagedListResponse } from '@shared/types/paged-list-response';
import type { Uuid } from '@shared/types/uuid';
import type { PrismaCrudDelegate } from '@config/database/prisma/delegate';

export interface EntityMapper<TEntity, TModel, TCreateInput, TUpdateInput> {
  toDomain(model: TModel): TEntity;
  toCreate(entity: TEntity): TCreateInput;
  toUpdate(entity: TEntity): TUpdateInput;
}

export abstract class PrismaGenericRepository<
  TEntity extends GenericEntity,
  TModel,
  TWhereInput,
  TWhereUniqueInput,
  TCreateInput,
  TUpdateInput,
  TInclude = undefined,
> implements GenericRepository<TEntity> {
  protected constructor(
    protected readonly delegate: PrismaCrudDelegate<
      TModel,
      TWhereInput,
      TWhereUniqueInput,
      TCreateInput,
      TUpdateInput,
      TInclude
    >,
    protected readonly mapper: EntityMapper<
      TEntity,
      TModel,
      TCreateInput,
      TUpdateInput
    >,
    protected readonly include?: TInclude,
  ) {}

  protected abstract buildSearchWhere(query: string): TWhereInput;

  protected getBaseWhere(): TWhereInput {
    return {} as TWhereInput;
  }

  protected toWhereUnique(id: Uuid): TWhereUniqueInput {
    return { id } as unknown as TWhereUniqueInput;
  }

  async create(entity: TEntity): Promise<void> {
    await this.delegate.create({
      data: this.mapper.toCreate(entity),
      include: this.include,
    });
  }

  async update(id: Uuid, entity: TEntity): Promise<void> {
    await this.delegate.update({
      where: this.toWhereUnique(id),
      data: this.mapper.toUpdate(entity),
      include: this.include,
    });
  }

  async delete(id: Uuid): Promise<void> {
    await this.delegate.delete({ where: this.toWhereUnique(id) });
  }

  async findById(id: Uuid): Promise<TEntity | null> {
    const found = await this.delegate.findUnique({
      where: this.toWhereUnique(id),
      include: this.include,
    });
    return found ? this.mapper.toDomain(found) : null;
  }

  async findAll(options?: FindAllOptions): Promise<PagedListResponse<TEntity>> {
    const { page = 1, limit = 10, query } = options ?? {};
    const where = query ? this.buildSearchWhere(query) : this.getBaseWhere();

    const [total, models] = await Promise.all([
      this.delegate.count({ where }),
      this.delegate.findMany({
        where,
        include: this.include,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { created_at: 'desc' },
      }),
    ]);

    return { total, items: models.map((model) => this.mapper.toDomain(model)) };
  }
}
