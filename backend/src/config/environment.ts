export class Environment {
  static readonly PORT = Number(process.env.PORT) ?? 0;
  static readonly DB_HOST = process.env.DB_HOST ?? '';
  static readonly DB_PORT = Number(process.env.DB_PORT) ?? 0;
  static readonly DB_USER = process.env.DB_USER ?? '';
  static readonly DB_PASSWORD = process.env.DB_PASSWORD ?? '';
  static readonly DB_NAME = process.env.DB_NAME ?? '';
  static readonly DB_URL = process.env.DB_URL ?? '';
  static readonly JWT_SECRET = process.env.JWT_SECRET ?? '';
  static readonly FRONTEND_URL = process.env.FRONTEND_URL ?? '';
}
