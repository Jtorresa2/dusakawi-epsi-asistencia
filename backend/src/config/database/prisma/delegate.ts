export interface PrismaCrudDelegate<
  TModel,
  TWhereInput,
  TWhereUniqueInput,
  TCreateInput,
  TUpdateInput,
  TInclude,
> {
  create(args: { data: TCreateInput; include?: TInclude }): Promise<TModel>;

  update(args: {
    where: TWhereUniqueInput;
    data: TUpdateInput;
    include?: TInclude;
  }): Promise<TModel>;

  delete(args: { where: TWhereUniqueInput }): Promise<TModel>;

  findUnique(args: {
    where: TWhereUniqueInput;
    include?: TInclude;
  }): Promise<TModel | null>;

  findMany(args: {
    where?: TWhereInput;
    include?: TInclude;
    take?: number;
    skip?: number;
    orderBy?: unknown;
  }): Promise<TModel[]>;

  count(args: { where?: TWhereInput }): Promise<number>;
}

export function asCrudDelegate<
  TModel,
  TWhereInput,
  TWhereUniqueInput,
  TCreateInput,
  TUpdateInput,
  TInclude,
>(
  delegate: unknown,
): PrismaCrudDelegate<
  TModel,
  TWhereInput,
  TWhereUniqueInput,
  TCreateInput,
  TUpdateInput,
  TInclude
> {
  return delegate as PrismaCrudDelegate<
    TModel,
    TWhereInput,
    TWhereUniqueInput,
    TCreateInput,
    TUpdateInput,
    TInclude
  >;
}
