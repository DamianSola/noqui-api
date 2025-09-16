require('dotenv/config');
const { Sequelize } = require('sequelize');

const {
  DB_HOST ,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASS ,
  DB_SSL
} = process.env;

  const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: DB_SSL === 'true' ? { ssl: { require: true, rejectUnauthorized: false } } : {}
});

export default sequelize;