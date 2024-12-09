import {
  sequelize,
  DataTypes,
  QueryTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  WhereOptions,
} from '../helpers/sqlize.helper';
import * as CM from '../constant/response';
import { ModelsInterfaces } from '../interfaces/index';

class kycAlerts extends Model<
  InferAttributes<ModelsInterfaces.KYT_ALERTS>,
  InferCreationAttributes<
    ModelsInterfaces.KYT_ALERTS,
    {
      omit: 'id' | 'createdAt' | 'updatedAt';
    }
  >
> {
  declare id: number;
  declare userId: string;
  declare applicantId: string;
  declare createdAt: Date;
  declare alert: JSON;
  declare accountType: string;
  declare updatedAt: Date;
}

kycAlerts.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    applicantId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    alert: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    accountType: {
      type: DataTypes.ENUM({
        values: [
          CM.ENUM.ACCOUNT_TYPE.INDIVIDUAL,
          CM.ENUM.ACCOUNT_TYPE.BUSINESS,
        ],
      }),
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: CM.TABLES.KYC_ALERTS,
    sequelize,
  }
);

// kycAlerts.sync();

export { kycAlerts, sequelize, QueryTypes, WhereOptions };
