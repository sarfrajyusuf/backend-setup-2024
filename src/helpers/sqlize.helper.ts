import {
  Sequelize,
  DataTypes,
  QueryTypes,
  Op,
  Model,
  Transaction,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  WhereOptions,
  fn,
  col,
} from 'sequelize';
import { PG_CRED } from '../constant/response';
const sequelize = new Sequelize(
  PG_CRED.DBNAME,
  PG_CRED.USER_NAME,
  PG_CRED.PASSWORD,
  {
    dialect: 'postgres',
    host: PG_CRED.HOST_NAME,
    pool: {
      max: 70,
      min: 0,
      acquire: 6000000,
      idle: 10000,
    },
    logging: false,
    define: {
      // underscored:true,
      timestamps: true,
      freezeTableName: true,
    },
    dialectOptions: {
      // useUTC: false, //for reading from database
      dateStrings: true,
      typeCast: true,
    },
    timezone: '+05:30',
  }
);
sequelize.sync();

export {
  sequelize,
  DataTypes,
  QueryTypes,
  Op,
  Model,
  Transaction,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  WhereOptions,
  fn,
  col,
};
