
import { sequelize } from '../../models/index';
import { QuestionnaireCommentsCreate } from './dto/questionnaire-comments-create.interface';

export class QuestionnaireCommentsService {
  async createComment(payload: QuestionnaireCommentsCreate) {
    return await sequelize.models.QuestionnaireComments.create({
      text: payload.text,
      questionnaireId: payload.questionnaireId
    });
  }

  async getComments(questionnaireId: number) {
    return await sequelize.models.QuestionnaireComments.findAll({
      where: { questionnaireId }
    });
  }
}
