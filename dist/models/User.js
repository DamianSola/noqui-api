"use strict";
// import { DataTypes, Model } from "sequelize";
// import sequelize from "../config/database";
Object.defineProperty(exports, "__esModule", { value: true });
const { DataTypes, Model } = require("sequelize");
const sequelize = require('../config/database');
class User extends Model {
}
User.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
}, {
    sequelize,
    modelName: "User",
    tableName: "users",
});
exports.default = User;
//# sourceMappingURL=User.js.map