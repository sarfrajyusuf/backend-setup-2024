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

class KytLogs extends Model<
  InferAttributes<ModelsInterfaces.KYT_LOGS>,
  InferCreationAttributes<
    ModelsInterfaces.KYT_LOGS,
    {
      omit: 'id' | 'createdAt' | 'updatedAt';
    }
  >
> {
  declare id: number;
  declare userId: string;
  declare applicantId: string;
  declare score: string;
  declare txnId: string;
  declare txnType: string;
  declare txnStatus: string;
  declare kytStatus: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare trxPayload: JSON;
  declare typeId: string;
  declare type: string;
  declare coinName: string;
  declare coinNetwork: string;
  declare coinSymbol: string;
  declare clientId: string;
  declare fromAddress: string;
  declare toAddress: string;
  declare amount: string;
  declare wasSuspicious: boolean;
  declare sumsubResponse: JSON;
  declare isReapproved: boolean;
}

KytLogs.init(
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
    score: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    txnId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    coinName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    coinNetwork: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    coinSymbol: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    clientId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    trxPayload: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    sumsubResponse: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    txnType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    amount: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    typeId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM({
        values: [
          CM.ENUM.TRANSACTION_TYPE.CRYPTO,
          CM.ENUM.TRANSACTION_TYPE.FIAT,
        ],
      }),
      allowNull: false,
    },
    txnStatus: {
      type: DataTypes.ENUM({
        values: [
          CM.ENUM.TRANSACTION_STATUS.APPROVED,
          CM.ENUM.TRANSACTION_STATUS.REJECTED,
          CM.ENUM.TRANSACTION_STATUS.PENDING,
          CM.ENUM.TRANSACTION_STATUS.FAILED,
          CM.ENUM.TRANSACTION_STATUS.IN_REVIEW,
        ],
      }),
      allowNull: false,
      defaultValue: CM.ENUM.TRANSACTION_STATUS.PENDING,
    },
    kytStatus: {
      type: DataTypes.ENUM({
        values: [
          CM.ENUM.TRANSACTION_STATUS.APPROVED,
          CM.ENUM.TRANSACTION_STATUS.REJECTED,
          CM.ENUM.TRANSACTION_STATUS.PENDING,
          CM.ENUM.TRANSACTION_STATUS.IN_REVIEW,
        ],
      }),
      allowNull: false,
      defaultValue: CM.ENUM.TRANSACTION_STATUS.PENDING,
    },
    wasSuspicious: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    fromAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    toAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isReapproved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: CM.TABLES.KYT_LOG,
    sequelize,
  }
);

// KytLogs.sync();

export { KytLogs, sequelize, QueryTypes, WhereOptions };
