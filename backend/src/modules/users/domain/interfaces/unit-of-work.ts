export interface UnitOfWork {
  save(): Promise<void>;
}
