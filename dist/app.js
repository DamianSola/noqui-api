"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = __importDefault(require("./config/database"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Test route
app.get("/", (req, res) => {
    res.send("Backend funcionando 🚀");
});
// Sincronizar DB
database_1.default.sync().then(() => {
    console.log("DB conectada y sincronizada");
});
module.exports = app;
//# sourceMappingURL=app.js.map