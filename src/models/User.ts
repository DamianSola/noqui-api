import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Company from "./Company"

class User extends Model {
  public id!: number;
  public name!: string;
  public email!: string;
  
}

User.init(
  {
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
    role:{
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'admin'
    }
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
  }
);

User.hasMany(Company)
Company.belongsTo(User, {foreignKey: "owner"})

export default User;
