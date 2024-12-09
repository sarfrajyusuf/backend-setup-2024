import {
  sequelize,
  DataTypes,
  QueryTypes,
  Model,
  InferAttributes,
  Transaction,
  InferCreationAttributes,
  CreationOptional,
  WhereOptions,
  Op,
  fn,
  col,
} from '../helpers/sqlize.helper';
import * as ModelsInterfaces from '../interfaces/models.interfaces';
import { TABLES, ENUM } from '../constant/response';

class User extends Model<
  InferAttributes<ModelsInterfaces.Users>,
  InferCreationAttributes<
    ModelsInterfaces.Users,
    {
      omit:
        | 'id'
        | 'userId'
        | 'uidString'
        | 'socialLoginVia'
        | 'appleId'
        | 'googleId'
        | 'facebookId'
        | 'mobilePin'
        | 'isEmailVerified'
        | 'firstName'
        | 'middleName'
        | 'lastName'
        | 'gender'
        | 'address'
        | 'city'
        | 'postalCode'
        | 'accountType'
        | 'dateOfBirth'
        | 'nationality'
        | 'businessName'
        | 'brandName'
        | 'phoneNumber'
        | 'countryCode'
        | 'incorporationDate'
        | 'companyType'
        | 'taxVatId'
        | 'clientId'
        | 'status'
        | 'userKycStatus'
        | 'adminKycStatus'
        | 'kycRejectionReason'
        | 'google2FaSecret'
        | 'individualStatus'
        | 'businessStatus'
        | 'isBlocked'
        | 'reasonToBlockUser'
        | 'lastLoginAt'
        | 'isDeleted'
        | 'google2FaStatus'
        | 'mpinStatus'
        | 'smsStatus'
        | 'emailStatus'
        | 'txnGoogle2FaStatus'
        | 'txnMpinStatus'
        | 'txnSmsStatus'
        | 'txnEmailStatus'
        | 'fiatInternalTxnStatus'
        | 'fiatWithdrawStatus'
        | 'cryptoInternalTxnStatus'
        | 'cryptoWithdrawStatus'
        | 'swapStatus'
        | 'auth2FaStatus'
        | 'defaultFiatCurrency'
        | 'defaultLanguage'
        | 'referralCode'
        | 'isReferee'
        | 'createdAt'
        | 'updatedAt';
    }
  >
> {
  declare id: CreationOptional<number>;
  declare userId: string;
  declare uidString: string;
  declare email: string;
  declare password: string;
  declare mobilePin: string;
  declare socialLoginVia: string;
  declare appleId: string;
  declare googleId: string;
  declare facebookId: string;
  declare isEmailVerified: boolean;
  declare firstName: string;
  declare middleName: string;
  declare lastName: string;
  declare gender: string;
  declare address: string;
  declare city: string;
  declare postalCode: string;
  declare accountType: string;
  declare dateOfBirth: string;
  declare nationality: string;
  declare phoneNumber: string;
  declare countryCode: string;
  declare businessName: string;
  declare brandName: string;
  declare incorporationDate: string;
  declare companyType: string;
  declare taxVatId: string;
  declare clientId: string;
  declare status: string;
  declare individualStatus: string;
  declare businessStatus: string;
  declare userKycStatus: string;
  declare adminKycStatus: string;
  declare kycRejectionReason: string;
  declare google2FaSecret: string;
  declare deviceType: string;
  declare deviceId: string;
  declare isBlocked: boolean;
  declare reasonToBlockUser: string;
  declare lastLoginAt: string;
  declare isDeleted: boolean;
  declare google2FaStatus: boolean;
  declare mpinStatus: boolean;
  declare smsStatus: boolean;
  declare emailStatus: boolean;
  declare txnGoogle2FaStatus: boolean;
  declare txnMpinStatus: boolean;
  declare txnSmsStatus: boolean;
  declare txnEmailStatus: boolean;
  declare fiatInternalTxnStatus: boolean;
  declare fiatWithdrawStatus: boolean;
  declare cryptoInternalTxnStatus: boolean;
  declare cryptoWithdrawStatus: boolean;
  declare swapStatus: boolean;
  declare auth2FaStatus: boolean;
  declare defaultFiatCurrency: string;
  declare defaultLanguage: string;
  declare referralCode: string;
  declare isReferee: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
}

User.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      unique: true,
    },
    userId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    uidString: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mobilePin: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    socialLoginVia: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    appleId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    facebookId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    middleName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM({
        values: [
          ENUM.GENDER.MALE,
          ENUM.GENDER.FEMALE,
          ENUM.GENDER.OTHER,
          ENUM.GENDER.PREFER_NOT_TO_SAY,
        ],
      }),
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    postalCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    accountType: {
      type: DataTypes.ENUM({
        values: [ENUM.ACCOUNT_TYPE.INDIVIDUAL, ENUM.ACCOUNT_TYPE.BUSINESS],
      }),
      allowNull: true,
    },
    dateOfBirth: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nationality: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    countryCode: {
      type: DataTypes.STRING,
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
    clientId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    individualStatus: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    businessStatus: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM({
        values: [ENUM.USER_STATUS.ACTIVE, ENUM.USER_STATUS.INACTIVE],
      }),
      defaultValue: ENUM.USER_STATUS.ACTIVE,
    },
    userKycStatus: {
      type: DataTypes.ENUM({
        values: [
          ENUM.KYC_STATUS.APPROVED,
          ENUM.KYC_STATUS.FINAL_REJECTED,
          ENUM.KYC_STATUS.INITIATED,
          ENUM.KYC_STATUS.ON_HOLD,
          ENUM.KYC_STATUS.PENDING,
          ENUM.KYC_STATUS.REJECTED,
          ENUM.KYC_STATUS.TEMPORARY_REJECTED,
          ENUM.KYC_STATUS.NONE,
        ],
      }),
      defaultValue: ENUM.KYC_STATUS.NONE,
    },
    adminKycStatus: {
      type: DataTypes.ENUM({
        values: [
          ENUM.KYC_STATUS.APPROVED,
          ENUM.KYC_STATUS.PENDING,
          ENUM.KYC_STATUS.REJECTED,
        ],
      }),
      defaultValue: ENUM.KYC_STATUS.PENDING,
    },
    kycRejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    google2FaSecret: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deviceType: {
      type: DataTypes.ENUM({
        values: [
          ENUM.DEVICE_TYPE.ANDROID,
          ENUM.DEVICE_TYPE.IOS,
          ENUM.DEVICE_TYPE.WEB,
        ],
      }),
      allowNull: false,
    },
    isBlocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    reasonToBlockUser: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deviceId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastLoginAt: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    google2FaStatus: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    mpinStatus: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    smsStatus: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    emailStatus: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    txnGoogle2FaStatus: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    txnMpinStatus: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    txnSmsStatus: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    txnEmailStatus: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    fiatInternalTxnStatus: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    fiatWithdrawStatus: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    cryptoInternalTxnStatus: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    cryptoWithdrawStatus: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    swapStatus: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    auth2FaStatus: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    defaultFiatCurrency: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ENUM.DEFAULT.CURRENCY,
    },
    defaultLanguage: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ENUM.DEFAULT.LANGUAGE,
    },
    referralCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isReferee: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    tableName: TABLES.USER,
    sequelize,
  }
);

export { User, sequelize, Transaction, QueryTypes, WhereOptions, Op, fn, col };
