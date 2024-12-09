import {
  sequelize,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from '../helpers/sqlize.helper';
import * as CM from '../constant/response';
import { ModelsInterfaces } from '../interfaces/index';

class QuestionnaireComments extends Model<
  InferAttributes<ModelsInterfaces.QuestionnaireComments>,
  InferCreationAttributes<ModelsInterfaces.QuestionnaireComments>
> {
  declare id: number;
  declare text: string;
}

QuestionnaireComments.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    questionnaireId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    adminId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    manualScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: CM.TABLES.QUESTIONNAIRE_COMMENT,
    timestamps: true,
  }
);

// QuestionnaireComments.sync({alter: true});

export { QuestionnaireComments };
