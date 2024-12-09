import {
  sequelize,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from '../helpers/sqlize.helper';
import * as CM from '../constant/response';
import { ModelsInterfaces } from '../interfaces/index';
import { Answers } from './answers.model';
import { Questionnaires } from './questionnaire.model';

class Questions extends Model<
  InferAttributes<ModelsInterfaces.Question>,
  InferCreationAttributes<ModelsInterfaces.Question>
> {
  declare id: number;
  declare title: string;
  declare key: string;
  declare type: string;
}

Questions.init(
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
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: CM.TABLES.QUESTION,
    timestamps: false,
  }
);

// Questions.sync({alter: true});

Questions.hasMany(Answers, { foreignKey: 'questionId', as: 'answers' });

Questions.hasMany(Questionnaires, {
  foreignKey: 'questionId',
  as: 'questionnaires',
});
Questionnaires.belongsTo(Questions, { foreignKey: 'id', as: 'question' });

export { Questions };
