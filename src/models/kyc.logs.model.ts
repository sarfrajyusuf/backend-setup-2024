import {
  sequelize,
  DataTypes,
  QueryTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Transaction,
  Op,
} from '../helpers/sqlize.helper';
import * as CM from '../constant/response';
import { ModelsInterfaces } from '../interfaces/index';
import { KycDoc } from './kyc.docs.model';

class KycLogs extends Model<
  InferAttributes<ModelsInterfaces.KYC_LOGS>,
  InferCreationAttributes<
    ModelsInterfaces.KYC_LOGS,
    {
      omit: 'id' | 'createdAt' | 'updatedAt';
    }
  >
> {
  declare id: number;
  declare userId: string;
  declare applicantId: string;
  declare accountType: string;
  declare parentId: string;
  declare sumsubKycStatus: string;
  declare sumsubReason: string;
  declare adminRejectionReason: string;
  declare sumsubPayload: JSON;
  declare questionairePayload: JSON;
  declare adminKycStatus: string;
  declare s3KycStatus: boolean;
  declare isVerifiedAt: string;
  declare isDocSaved: boolean;
  declare inspectionId: any;
  declare businessName: string;
  declare brandName: string;
  declare incorporationDate: string;
  declare companyType: string;
  declare taxVatId: string;
  declare email: string;
  declare nationality: string;
  declare firstName: string;
  declare lastName: string;
  declare phoneNumber: string;
  declare parentProfileFilled: boolean;
  declare dob: string;
  declare address: string;
  declare zipCode: string;
  declare nationalId: string;
  declare city: string;
  declare verificationFullPayload: JSON;
  declare registrationNumber: string;
  declare individualAccountInf: JSON;
  declare completedBy: string;
  declare completedByUserId: string;
  declare adminFullName:string;
}

KycLogs.init(
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
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nationality: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    registrationNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dob: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    zipCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nationalId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    verificationFullPayload: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    businessName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    brandName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    incorporationDate: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    companyType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    taxVatId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sumsubKycStatus: {
      type: DataTypes.ENUM({
        values: [
          CM.ENUM.KYC_STATUS.APPROVED,
          CM.ENUM.KYC_STATUS.FINAL_REJECTED,
          CM.ENUM.KYC_STATUS.TEMPORARY_REJECTED,
          CM.ENUM.KYC_STATUS.PENDING,
          CM.ENUM.KYC_STATUS.INITIATED
        ],
      }),
      defaultValue: CM.ENUM.KYC_STATUS.INITIATED,
    },
    sumsubReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    parentProfileFilled: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    adminRejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sumsubPayload: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    questionairePayload: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    individualAccountInf: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    adminKycStatus: {
      type: DataTypes.ENUM({
        values: [
          CM.ENUM.KYC_STATUS.APPROVED,
          CM.ENUM.KYC_STATUS.REJECTED,
          CM.ENUM.KYC_STATUS.PENDING,
        ],
      }),
      allowNull: false,
      defaultValue: CM.ENUM.KYC_STATUS.PENDING,
    },
    isDocSaved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    s3KycStatus: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    accountType: {
      type: DataTypes.ENUM({
        values: [
          CM.ENUM.ACCOUNT_TYPE.INDIVIDUAL,
          CM.ENUM.ACCOUNT_TYPE.BUSINESS,
        ],
      }),
    },
    parentId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isVerifiedAt: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    completedBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    completedByUserId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    adminFullName : {
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
    tableName: CM.TABLES.KYC_LOG,
    sequelize,
  }
);

KycLogs.hasMany(KycDoc, { foreignKey: 'kycId', as: 'kycDocs' });

export { KycLogs, sequelize, QueryTypes, Transaction, Op };
