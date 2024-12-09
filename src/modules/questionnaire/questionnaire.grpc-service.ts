import { QuestionnaireService } from './questionnaire.service'
import * as Helpers from '../../helpers';
import { GenericError } from 'interfaces/responses.interface';
import { QUESTIONNAIRE_GRPC_RESPONSE } from '../../constant/response';

export class QuestionnaireGrpcService {
  private questionnaireService: QuestionnaireService
  constructor() {
    this.questionnaireService = new QuestionnaireService()
  }

  getQuestionnaireByUser = async (call: any, callback: any) => {
    try {
      const { userId } = call.request
      const questionnaires = await this.questionnaireService.getByUser(userId);

      callback(null, Helpers.ResponseHelper.grpcSuccess({
        message: QUESTIONNAIRE_GRPC_RESPONSE.QUESTIONNAIRE_LIST,
        data: questionnaires,
      }));
    } catch (error: any) {
      console.log('GET QUESTIONAIRE BY USER ERROR:', error);

      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  }

  updateManualScore = async (call: any, callback: any) => {
    try {
      const { questionnaireId, manualScore, text, adminId } = call.request
      const updated = await this.questionnaireService.updateQuestionnaire(
        questionnaireId, 
        { manualScore, comment: { text }, adminId }
      );

      callback(null, Helpers.ResponseHelper.grpcSuccess({
        message: QUESTIONNAIRE_GRPC_RESPONSE.QUESTIONNAIRE_UPDATED,
        data: updated,
      }));
    } catch (error: any) {
      console.log('UPDATE MANUAL SCORE ERROR:', error);

      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  }
}