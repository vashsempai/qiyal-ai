// Утилита для объединения классов (аналог clsx)
export function cn(...args: (string | undefined | false | null)[]): string {
  return args.filter(Boolean).join(' ');
}
