"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv/config');
const { Sequelize } = require('sequelize');
const { DB_HOST = 'localhost', DB_PORT = '5432', DB_NAME = 'noqui_db', DB_USER = 'noqui_user', DB_PASS = 'noqui_pass', DB_SSL = 'false' } = process.env;
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    port: Number(DB_PORT),
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: DB_SSL === 'true' ? { ssl: { require: true, rejectUnauthorized: false } } : {}
});
exports.default = sequelize;
//# sourceMappingURL=database.js.map