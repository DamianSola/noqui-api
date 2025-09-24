import express from "express";
import sequelize from "./config/database";
import cors from 'cors';


// Importamos rutas aqui
import userRoute from './routes/userRoute'

const corsConfig = cors({
  origin: ["http://localhost:3000", "https://tudominio.com"],
  credentials: true,
});

const app = express();
app.use(corsConfig);
app.use(express.json());
app.use('/users', userRoute);

// Test route
app.get("/", (req, res) => {
  res.send("Backend funcionando 🚀");
});

// Sincronizar DB
sequelize.sync().then(async() => {
  try {
  await sequelize.authenticate();
  console.log('Connection has been established successfully.');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}
  // console.log("DB conectada y sincronizada");
});

module.exports = app;