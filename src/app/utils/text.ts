export function truncateText(value: string, maxCharacters: number) {
  if (value.length <= maxCharacters) return value;
  return `${value.slice(0, maxCharacters)}...`;
}
