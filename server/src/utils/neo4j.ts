/**
 * Neo4j's driver returns integer-valued properties as a Neo4j `Integer`
 * object (with a `.toNumber()` method) rather than a plain JS number, to
 * avoid silent precision loss for values outside the safe integer range.
 * Every numeric property this app reads (yearsExperience, experienceRequired)
 * fits comfortably in a JS number, so we unwrap it immediately at the query
 * boundary - this was previously duplicated identically across
 * `database/queries/{candidates,jobs,recommendations}.ts`.
 */
export function toNumber(value: any): number {
  return typeof value?.toNumber === "function" ? value.toNumber() : value;
}
