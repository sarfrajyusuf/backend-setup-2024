import express, { Router } from 'express';
import * as CM from '../../constant/response';
import * as Helper from '../../helpers/index';
import * as Interface from '../../interfaces/index';
import * as Middlewares from '../../middlewares/index';
import kycMiddleware from './kyc.middleware';
import * as KycValidation from './kyc.validation';
const setResponse = Helper.ResponseHelper;

class KycController implements Interface.Controller {
  path: string;
  router: Router;
  rateLimitPerUser: any;

  constructor(path: string, router: Router) {
    this.path = path;
    this.router = router;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router
      .all('/*')
      .post(
        this.path + '/notifyViaWebhook',
        kycMiddleware.webhook,
        kycMiddleware.updateKycLogs
      )
      .post(
        this.path + '/generateAccessToken',
        Middlewares.userValidationToken,
        kycMiddleware.getUserInfoByUserId,
        kycMiddleware.isKycLogsExist,
        kycMiddleware.createKycLog,
        kycMiddleware.generateAccessToken,
        this.responseHandler
      )
      .post(
        this.path + '/KycProfileByUserId',
        Middlewares.userValidationToken,
        kycMiddleware.getKycLogsDetail,
        this.responseHandler
      )
      .post(
        this.path + '/getAllDocsByUserId',
        Middlewares.userValidationToken,
        kycMiddleware.getKycDocsByUserId,
        this.responseHandler
      )
      .post(
        this.path + '/getKycsWithPagination',
        Middlewares.userValidationToken,
        kycMiddleware.getKycsWithPagination,
        this.responseHandler
      )
      .get(
        this.path + '/getKycStatus',
        Middlewares.userValidationToken,
        kycMiddleware.getKycStatus,
        this.responseHandler
      )
      .post(
        this.path + '/uploadDoc',
        Middlewares.upload.single('file'),
        KycValidation.uploadKycDocumentValidation,
        Middlewares.postValidate,
        kycMiddleware.uploadKycDoc,
        kycMiddleware.saveKycDocs,
        this.responseHandler
      )
      .get(
        this.path + '/collectQuestionnaireData/:userId',
        Middlewares.userValidationToken,
        kycMiddleware.collectQuestionnaireData,
        this.responseHandler
      )
      .post(
        this.path + '/getKycInfoByUserId',
        Middlewares.userValidationToken,
        kycMiddleware.getUserKycInfo,
        this.responseHandler
      );
  }

  private responseHandler = async (
    request: express.Request,
    response: express.Response
  ) => {
    if (typeof request.body.result != 'undefined') {
      return setResponse.success(request, response, request.body.result);
    } else {
      return setResponse.error400(request, response, {
        message: CM.ERROR,
      });
    }
  };
}

export default KycController;
