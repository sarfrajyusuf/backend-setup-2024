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

class UserSession extends Model<
  InferAttributes<ModelsInterfaces.UserSessions>,
  InferCreationAttributes<
    ModelsInterfaces.UserSessions,
    {
      omit: 'id' | 'createdAt' | 'updatedAt';
    }
  >
> {
  declare id: CreationOptional<number>;
  declare userId: string;
  declare accessToken: string;
  declare refreshToken: string;
  declare deviceType: string;
  declare deviceToken: string;
  declare deviceId: string;
  declare fcmToken: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

UserSession.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
    },
    accessToken: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: false,
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
    deviceId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    deviceToken: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fcmToken: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    tableName: TABLES.USER_SESSION,
    sequelize,
  }
);

export default UserSession;
