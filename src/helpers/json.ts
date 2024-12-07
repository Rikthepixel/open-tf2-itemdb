export function replacer(_key: string, value: any) {
  if (value instanceof Set) return Array.from(value);
  if (value instanceof Map) return Object.fromEntries(value);
  return value;
}
