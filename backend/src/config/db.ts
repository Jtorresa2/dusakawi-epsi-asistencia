import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// If DATABASE_URL is present, it is the single source of truth for the
// connection (postgresql://user:password@host:port/database). Individual
// DB_* variables are only a fallback for setups that cannot use a URL.
const poolConfig: PoolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '5432'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    };

const pool = new Pool({
  ...poolConfig,
  // Force every connection of this app to use ONLY the "asistencia"
  // schema and Colombia's timezone (UTC-5). Without a session TimeZone,
  // TIMESTAMPTZ values render in the server's zone (e.g. UTC), so a 07:00
  // Colombian entry would display as 12:00. This app must never touch or
  // read from other schemas.
  options: '-c search_path=asistencia -c TimeZone=America/Bogota',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
  console.log('Conectado a PostgreSQL (esquema: asistencia)');
});

pool.on('error', (err: Error) => {
  console.error('Error en PostgreSQL:', err);
});

export default pool;
