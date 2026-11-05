import 'server-only';

// Read an env var at request time. Missing vars return null so the UI can show
// "not configured" for one vendor without breaking the other two.
export function env(name: string): string | null {
  const value = process.env[name];
  return value && value.trim() !== '' ? value.trim() : null;
}

export function requireEnv(name: string): string {
  const value = env(name);
  if (!value) {
    throw new MissingConfigError(name);
  }
  return value;
}

export class MissingConfigError extends Error {
  constructor(public readonly variable: string) {
    super(`Missing environment variable: ${variable}`);
  }
}
