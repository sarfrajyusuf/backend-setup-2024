
import { sequelize, Questions, Answers, Questionnaires } from '../../models/index';
import { QuestionnaireComments } from '../../models/questionnaire-comments.model';
import { QuestionnaireUpdate } from './dto/questionnaire-update.interfaces';

export class QuestionnaireService {
  async updateQuestionnaire(id: string, payload: QuestionnaireUpdate) {
    const { manualScore, comment, adminId } = payload;

      if(!comment?.text) {
        throw new Error("Comment is required");
      }

      const questionnaire = await Questionnaires.findOne({
        where: { id },
      });

      if (!questionnaire) {
        throw new Error("Questionnaire not found");
      }

      await sequelize.models.QuestionnaireComments.create({ 
        text: comment.text,
        questionnaireId: id,
        adminId,
        manualScore,
      }); 

      await questionnaire.update({ manualScore });

      return questionnaire;
  }

  async getByUser(userId: string) {
    const questions = await Questions.findAll();
    const answers = await Answers.findAll();

    const questionsMap = new Map<number, Questions>(questions.map((q) => [q.id, q]));
    const answersMap = new Map<number, Answers>(answers.map((a) => [a.id, a]));

    const find =  await Questionnaires.findAll({
      where: { userId },
      include: [
        { model: QuestionnaireComments, as: 'comments'},
      ],
      nest: true,
    });

    const res = find.map((q) => {
      const _q = q.dataValues || q;
      Object.assign(_q, { question: questionsMap.get(q.questionId) });
      Object.assign(_q, { answer: answersMap.get(q.answerId) });
      return _q;
    });

    return res;
  }
}
