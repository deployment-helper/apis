import { DataSource }  from "typeorm";
import {config} from 'dotenv';

config();

exports.AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    synchronize: false,
    logging: true,
    entities: [__dirname + '/dist/**/*.entity{.ts,.js}'],
    subscribers: [],
    migrations: [`${__dirname}/migrations/**`],
})