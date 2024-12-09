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
import { QuestionnaireComments } from './questionnaire-comments.model';

class Questionnaires extends Model<
  InferAttributes<ModelsInterfaces.Questionnaire>,
  InferCreationAttributes<ModelsInterfaces.Questionnaire>
> {
  declare id: number;
  declare questionId: number;
  declare answerId: number;
  declare userId: string;
}

Questionnaires.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    questionId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    answerId: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    manualScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: CM.TABLES.QUESTIONNAIRE,
  }
);

// Questionnaires.sync({ alter: true });

Questionnaires.hasMany(QuestionnaireComments, {
  foreignKey: 'questionnaireId',
  as: 'comments',
});

export { Questionnaires, sequelize, QueryTypes, WhereOptions };
