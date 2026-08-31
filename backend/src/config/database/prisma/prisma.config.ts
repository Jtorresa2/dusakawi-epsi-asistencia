import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { Environment } from '../../environment.js';

export default defineConfig({
  schema: './schema.prisma',
  migrations: {
    path: './migrations',
  },
  datasource: {
    url: Environment.DB_URL,
  },
});
