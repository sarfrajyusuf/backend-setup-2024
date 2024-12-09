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

class KycDoc extends Model<
  InferAttributes<ModelsInterfaces.KYC_DOC>,
  InferCreationAttributes<
    ModelsInterfaces.KYC_DOC,
    {
      omit: 'id' | 'createdAt' | 'updatedAt' | 's3Status' | 'docPath';
    }
  >
> {
  declare id: number;
  declare userId: string;
  declare applicantId: string;
  declare inspectionId: string;
  declare kycId: number;
  declare sumsubDocId: string;
  declare docType: string;
  declare docName: string;
  declare docPath: string;
  declare viewType: string;
  declare s3Status: boolean;
  declare txnId : string ;
}

KycDoc.init(
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
    inspectionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    kycId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    sumsubDocId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    docName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    docType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    docPath: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    viewType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    s3Status: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    txnId: {
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
  },
  {
    tableName: CM.TABLES.KYC_DOC,
    sequelize,
  }
);

export { KycDoc, sequelize, QueryTypes, WhereOptions };
