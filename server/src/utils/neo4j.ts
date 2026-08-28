export function toNumber(value: any): number {
  return typeof value?.toNumber === "function" ? value.toNumber() : value;
}
