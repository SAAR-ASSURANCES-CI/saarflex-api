import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from './src/users/entities/user.entity';
import { Session } from './src/users/entities/session.entity';
import { Notification } from './src/users/entities/notification.entity';

dotenv.config(); // charge les variables de .env

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '3306', 10),
  username: process.env.DB_USERNAME ?? '',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? '',
  entities: [User, Session, Notification],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: true,
});