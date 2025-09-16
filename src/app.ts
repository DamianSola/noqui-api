import express from "express";
import sequelize from "./config/database";
import User from "./models/User";

const app = express();
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Backend funcionando 🚀");
});

// Sincronizar DB
sequelize.sync().then(() => {
  console.log("DB conectada y sincronizada");
});

module.exports = app;