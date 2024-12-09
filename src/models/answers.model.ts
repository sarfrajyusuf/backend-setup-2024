import {
  sequelize,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from '../helpers/sqlize.helper';
import * as CM from '../constant/response';
import { ModelsInterfaces } from '../interfaces/index';
import { Questionnaires } from './questionnaire.model';

class Answers extends Model<
  InferAttributes<ModelsInterfaces.Answer>,
  InferCreationAttributes<ModelsInterfaces.Answer>
> {
  declare id: number;
  declare key: string;
  declare title: string;
  declare score: number;
  declare questionId: number;
}

Answers.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    questionId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: CM.TABLES.ANSWER,
    timestamps: false,
  }
);

// Answers.sync({ alter: true });

Answers.hasMany(Questionnaires, {
  foreignKey: 'answerId',
  as: 'questionnaires',
});
Questionnaires.belongsTo(Answers, { foreignKey: 'id', as: 'answer' });

export { Answers };
