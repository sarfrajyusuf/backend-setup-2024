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

class SupportTickets extends Model<
  InferAttributes<ModelsInterfaces.SupportTickets>,
  InferCreationAttributes<
    ModelsInterfaces.SupportTickets,
    {
      omit:
        | 'id'
        | 'resolvedAt'
        | 'createdAt'
        | 'updatedAt'
        | 'attachment'
        | 'status'
        | 'comments';
    }
  >
> {
  declare id: CreationOptional<number>;
  declare userId: string;
  declare uid: string;
  declare ticketId: string;
  declare subject: string;
  declare description: string;
  declare status: string;
  declare attachment: string[];
  declare resolvedAt: string;
  declare comments: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

SupportTickets.init(
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
    uid: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ticketId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM({
        values: [
          ENUM.SUPPORT_TICKET_STATUS.PENDIND,
          ENUM.SUPPORT_TICKET_STATUS.IN_REVIEW,
          ENUM.SUPPORT_TICKET_STATUS.RESOLVED,
          ENUM.SUPPORT_TICKET_STATUS.RE_OPEN,
        ],
      }),
      defaultValue: ENUM.SUPPORT_TICKET_STATUS.PENDIND,
    },
    attachment: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },
    resolvedAt: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    comments: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    tableName: TABLES.SUPPORT_TICKETS,
    sequelize,
  }
);

export default SupportTickets;
