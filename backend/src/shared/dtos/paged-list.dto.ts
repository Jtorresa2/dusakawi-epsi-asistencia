export class PagedListDto<T> {
  readonly totalPages: number;
  readonly items: T[];

  private constructor(
    public readonly total: number,
    public readonly page: number,
    public readonly limit: number,
    items: T[],
  ) {
    this.totalPages = Math.ceil(total / limit);
    this.items = items;
  }

  static create<T>(
    total: number,
    page: number,
    limit: number,
    items: T[],
  ): PagedListDto<T> {
    return new PagedListDto<T>(total, page, limit, items);
  }

  equals(other: PagedListDto<T>): boolean {
    return (
      this.total === other.total &&
      this.page === other.page &&
      this.limit === other.limit &&
      this.totalPages === other.totalPages &&
      this.items === other.items
    );
  }
}
