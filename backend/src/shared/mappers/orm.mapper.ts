export interface OrmMapper<Entity, T, U, V> {
  toDomain(likeEntity: T): Entity;
  toCreate(entity: Entity): U;
  toUpdate(entity: Entity): V;
}
