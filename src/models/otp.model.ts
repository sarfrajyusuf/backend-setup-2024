import {
  sequelize,
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from '../helpers/sqlize.helper';
import * as ModelsInterfaces from '../interfaces/models.interfaces';
import { TABLES, ENUM } from '../constant/response';

class Otp extends Model<
  InferAttributes<ModelsInterfaces.Otp>,
  InferCreationAttributes<
    ModelsInterfaces.Otp,
    {
      omit:
        | 'id'
        | 'userId'
        | 'createdAt'
        | 'updatedAt'
        | 'email'
        | 'phoneNumber';
    }
  >
> {
  declare id: CreationOptional<number>;
  declare userId: string;
  declare otp: string;
  declare email: string;
  declare phoneNumber: string;
  declare method: string;
  declare service: string;
  declare status: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Otp.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    method: {
      type: DataTypes.ENUM({
        values: [
          ENUM.OTP_METHOD.EMAIL,
          ENUM.OTP_METHOD.SMS,
          ENUM.OTP_METHOD.MPIN,
        ],
      }),
      allowNull: false,
    },
    service: {
      type: DataTypes.ENUM({
        values: [
          ENUM.OTP_SERVICE.REGISTRATION,
          ENUM.OTP_SERVICE.FORGOT_PASSWORD,
          ENUM.OTP_SERVICE.FORGOT_MPIN,
          ENUM.OTP_SERVICE.KYC_PHONE_VERIFICATION,
          ENUM.OTP_SERVICE.CRYPTO_INTERNAL_TRANSFER,
          ENUM.OTP_SERVICE.CRYPTO_WITHDRAW,
          ENUM.OTP_SERVICE.FIAT_INTERNAL_TRANSFER,
          ENUM.OTP_SERVICE.FIAT_WITHDRAW,
          ENUM.OTP_SERVICE.TXN_SECURITY_VERIFICATION,
          ENUM.OTP_SERVICE.LOGIN_2FA_VERIFICATION,
        ],
      }),
      allowNull: false,
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    tableName: TABLES.OTP,
    sequelize,
  }
);

export default Otp;
