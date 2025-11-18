import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database, TypedSupabaseClient } from './types/database';

let cachedClient: TypedSupabaseClient | null = null;
let supabaseWarningLogged = false;

const getEnvValue = (...keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
};

const resolveSupabaseUrl = (): string | undefined =>
  getEnvValue(
    'SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SUPABASE_URL',
    'SUPABASE_SUPABASE_NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_POSTGRES_URL_SUPABASE_URL',
  );

const isValidKey = (value?: string): boolean => Boolean(value && !value.includes('...'));

const resolveServiceRoleKey = (): string | undefined => {
  const key = getEnvValue(
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_POSTGRES_URL_SUPABASE_SERVICE_ROLE_KEY',
  );
  return isValidKey(key) ? key : undefined;
};

const resolveAnonKey = (): string | undefined =>
  getEnvValue(
    'SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SUPABASE_ANON_KEY',
    'SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY_ANON_KEY',
    'SUPABASE_POSTGRES_URL_SUPABASE_ANON_KEY',
  );

const resolvedUrl = (): string | undefined => resolveSupabaseUrl();

export const isSupabaseConfigured = (): boolean => {
  const url = resolvedUrl();
  const key = resolveServiceRoleKey() ?? resolveAnonKey();
  return Boolean(url && key);
};

export const supabaseServerClient = (): TypedSupabaseClient => {
  const supabaseUrl = resolvedUrl();
  const supabaseKey = resolveServiceRoleKey() ?? resolveAnonKey();

  if (!supabaseUrl || !supabaseKey) {
    if (!supabaseWarningLogged) {
      console.warn(
        'Supabase no está configurado. Asegurate de definir SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (o SUPABASE_ANON_KEY) en tu entorno.',
      );
      supabaseWarningLogged = true;
    }
    throw new Error(
      'Supabase no está configurado. Asegurate de definir SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (o SUPABASE_ANON_KEY) en tu entorno.',
    );
  }

  if (cachedClient) {
    return cachedClient;
  }

  cachedClient = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  }) as TypedSupabaseClient;

  return cachedClient;
};

export const createSupabaseClient = (): SupabaseClient<Database> => supabaseServerClient();

