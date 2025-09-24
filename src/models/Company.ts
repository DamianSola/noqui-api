

import sequelize from "../config/database";
import { DataTypes, Model } from "sequelize";

class Company extends Model{
    public id!: string;
    public name!: string;
    public owner!: number;

}

Company.init (
    {
        id:{
            type: DataTypes.UUID,
            primaryKey: true,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        }
    },
    {
        sequelize,
        modelName: "Company",
        tableName: "companies"

    }
)

export default Company