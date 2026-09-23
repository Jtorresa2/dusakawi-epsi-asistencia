import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client.js';
import { Environment } from '../../environment.js';

const connectionString = `${Environment.DB_URL}`;

const adapter = new PrismaPg({
  connectionString,
  options: '-c search_path=asistencia',
}, { schema: 'asistencia' });
const prisma = new PrismaClient({ adapter });

export { prisma };
