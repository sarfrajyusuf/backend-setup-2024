import express from 'express';
import {
  GenericError,
  GetCommonResponse,
} from 'interfaces/responses.interface';
import * as CM from '../../constant/response';
import * as Helper from '../../helpers/index';
import {
  createAccessToken,
  getApplicantData,
  getExternalLink,
} from '../../helpers/index';
import { sequelize } from '../../models/index';
import kycHelper from './kyc.helper';
import * as KycInterface from './kyc.interface';
import userHelper from '../../modules/user/user.helper';

const setResponse = Helper.ResponseHelper;

class KycMiddleware {
  initTransaction = async () => {
    return await sequelize.transaction();
  };

  generateAccessToken: express.RequestHandler = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    let responsePayload: GetCommonResponse;
    let externalLink: string = '';
    let accessToken: { token: string } = { token: '' };
    try {
      const { userId } = request.userInfo;
      const { accountType }: KycInterface.GENERATE_ACCESS_TOKEN =
        request.body.userData;
      let levelName =
        accountType === CM.ENUM.ACCOUNT_TYPE.BUSINESS
          ? CM.SUMSUB.SUMSUB_LEVEL.BUSINESS
          : CM.SUMSUB.SUMSUB_LEVEL.INDIVIDUAL;

      if (!levelName) {
        throw {
          field: CM.ERROR_IN_PERFORMING_OPERATION.field,
          message: CM.ERROR_IN_PERFORMING_OPERATION.message,
        };
      }

      externalLink = await getExternalLink(levelName, 20000, userId);
      accessToken = await createAccessToken(userId, levelName);

      if (!externalLink || !accessToken) {
        throw {
          field: CM.ERROR_IN_PERFORMING_OPERATION.field,
          message: CM.ERROR_IN_PERFORMING_OPERATION.message,
        };
      }

      responsePayload = {
        message: CM.KYC_RESPONSE.SUCCESS.TOKEN_GENERATED,
        field: CM.KYC_RESPONSE.FIELD.TOKEN,
        data: { url: externalLink, token: accessToken.token },
      };

      request.body.result = responsePayload;
      request.body.activityTitle = 'Sumsub Kyc Verification';
      next();
    } catch (error: any) {
      console.log('GENERATE ACCESS TOKEN ERROR :', error);
      return setResponse.error400(request, response, {
        error: error,
      });
    }
  };

  webhook: express.RequestHandler = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const {
        externalUserId,
        applicantId,
        inspectionId,
        reviewResult,
        reviewStatus,
        createdAt,
      }: KycInterface.WEBHOOK = request.body;
      console.log(`SUMSUB WEBHOOK RESPONSE`, request.body);
      if (!request?.body?.kytTxnType) {
        const sumsubKycStatus: any =
          reviewResult?.reviewAnswer === 'GREEN' && reviewStatus === 'completed'
            ? CM.ENUM.KYC_STATUS.APPROVED
            : reviewResult?.reviewRejectType === 'RETRY'
              ? CM.ENUM.KYC_STATUS.TEMPORARY_REJECTED
              : reviewResult?.reviewRejectType === 'FINAL'
                ? CM.ENUM.KYC_STATUS.FINAL_REJECTED
                : reviewStatus === 'pending' || reviewStatus === 'onHold'
                  ? CM.ENUM.KYC_STATUS.PENDING
                  : CM.ENUM.KYC_STATUS.INITIATED;

        request.body = {
          userId: externalUserId,
          applicantId,
          inspectionId,
          sumsubKycStatus,
          sumsubPayload: JSON.stringify(request.body),
          sumsubReason:
            reviewResult?.reviewAnswer !== 'GREEN'
              ? reviewResult?.moderationComment || ''
              : '',
          isKycApproved: reviewResult?.reviewAnswer === 'GREEN',
          isDocSaved: false,
          isVerifiedAt:
            reviewResult?.reviewAnswer === 'GREEN' ? createdAt : null,
          parentId:
            Array.isArray(request?.body?.applicantMemberOf) &&
              request?.body?.applicantMemberOf.length
              ? request?.body?.applicantMemberOf[0].applicantId
              : null,
          applicantMemberOf: request.body.applicantMemberOf,
        };
        response.send({ success: true });
        next();
      }
    } catch (error: any) {
      console.error('SUMSUB WEBHOOK ERROR :', error);
      return setResponse.error400(request, response, { error });
    }
  };

  isKycLogsExist: express.RequestHandler = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const { userId }: KycInterface.IUserId = request.userInfo;
      const isKycLogExist = await kycHelper.findKycLog({
        userId: userId,
      });

      request.body.isUserExist = isKycLogExist ? true : false;

      next();
    } catch (error: any) {
      console.log('ERROR IS KYC LOG EXIST :', error);
      return setResponse.error400(request, response, {
        error: error,
      });
    }
  };

  buildCreateKycRequestPayload = (request: any) => {
    const { userId } = request.userInfo;
    const { userData } = request.body;
    console.log('USER DATA:',userData);
    
    return {
      userId,
      firstName: userData?.firstName,
      email: userData?.email,
      lastName: userData?.lastName,
      nationality: userData?.nationality,
      accountType: userData?.accountType,
      phoneNumber: userData?.phoneNumber,
      businessName: userData?.businessName,
      brandName: userData?.brandName,
      incorporationDate: userData?.incorporationDate,
      companyType: userData?.companyType,
      taxVatId: userData?.taxVatId,
    };
  };

  createKycLog: express.RequestHandler = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      console.log('REQUEST IN CREATE KYC LOG:',request.body);
      if (!request.body.isUserExist) {
        const requestPayload = this.buildCreateKycRequestPayload(request);
        const profileResponse = await kycHelper.createKycLog(requestPayload);
        if (!profileResponse) {
          throw {
            field: CM.ERROR_IN_PERFORMING_OPERATION.field,
            message: CM.ERROR_IN_PERFORMING_OPERATION.message,
          };
        }
      }
      next();
    } catch (error: any) {
      console.error('CREATE KYC LOG ERROR:', error);
      return setResponse.error400(request, response, { error });
    }
  };

  updateKycLogs: express.RequestHandler = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      let { userId, sumsubKycStatus, applicantMemberOf } = request.body;

      await kycHelper.findKycLog({ userId: userId }).then(async (row) => {
        console.log(`FOUND USER ROW`);
        if (row) {
          let profileResponse: any;
          if (
            [
              CM.ENUM.ACCOUNT_TYPE.BUSINESS,
              CM.ENUM.ACCOUNT_TYPE.INDIVIDUAL,
            ].includes(row.accountType)
          ) {
            if (row.applicantId) {
              console.log('APPLICANT ID OF KYC LOG EXIST');
              profileResponse = await kycHelper.updateKycLog(
                {
                  sumsubKycStatus: sumsubKycStatus,
                  parentProfileFilled: false,
                },
                userId
              );
            } else {
              console.log('APPLICANT ID OF KYC LOG NOT EXIST');
              profileResponse = await kycHelper.updateKycLog(
                request.body,
                userId
              );
            }
            console.log(`BEFORE KYC STATUS::`, sumsubKycStatus);
            const kycStatus: string = await kycHelper.manageKycStatus(
              sumsubKycStatus,
              row
            );
            console.log(`AFTER KYC STATUS::`, kycStatus);
          }

          if (profileResponse) {
            request.body.result = {
              message: CM.KYC_RESPONSE.SUCCESS.KYC_UPDATED,
              data: profileResponse,
            };
            next();
          }
        } else {
          const isParentExist = await kycHelper.findKycLog({
            applicantId:
              applicantMemberOf !== undefined
                ? applicantMemberOf[0].applicantId
                : '',
          });

          if (!isParentExist) {
            console.log('PARENT ID DOES NOT EXIST:');
          } else {
            const beneficiaryDetails = await Helper.getBeneficiaryDetail(
              request.body.applicantId
            );
            if (beneficiaryDetails) {
              request.body = {
                ...request.body,
                accountType: CM.ENUM.ACCOUNT_TYPE.INDIVIDUAL,
                firstName: beneficiaryDetails.data.fixedInfo.firstName,
                lastName: beneficiaryDetails.data.fixedInfo.lastName,
                phoneNumber: beneficiaryDetails.data.fixedInfo.phone,
                email: beneficiaryDetails.data.email,
                dob: beneficiaryDetails.data.fixedInfo.dob,
              };
            } else {
              request.body = {
                ...request.body,
                accountType: CM.ENUM.ACCOUNT_TYPE.INDIVIDUAL,
              };
            }
            const createdKycLog = await kycHelper.createKycLog(request.body);
            if (!createdKycLog) {
              console.log('KYC LOG NOT CREATED');
            }
          }
        }
      });

      await kycHelper.collectQuestionnaireData(userId);
    } catch (error: any) {
      console.error('UPDATE LOG DETAIL ERROR :', error);
    }
  };

  destroyKycDoc: express.RequestHandler = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
    } catch (error) {
      console.log('DESTORY KYC DOC ERROR :', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  getKycLogsDetail: express.RequestHandler = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    let commonResponse: GetCommonResponse;
    try {
      const requestPayload = {
        userId: request.body.userId,
      };
      const kycLogResponse = await kycHelper.findKycLog(requestPayload);
      console.log('KYC LOG DETAIL FOUND');
      if (kycLogResponse) {
        commonResponse = {
          message: CM.KYC_RESPONSE.SUCCESS.KYC_FOUND,
          data: kycLogResponse,
        };
        request.body.result = commonResponse;
        next();
      } else {
        throw {
          message: CM.KYC_RESPONSE.ERROR.KYC_NOT_FOUND,
          field: CM.KYC_RESPONSE.FIELD.KYC,
        };
      }
    } catch (error) {
      console.log('GET KYC  LOG DETAIL ERROR :', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  getAllKycLogs: express.RequestHandler = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    let commonResponse: GetCommonResponse;
    try {
      const profilePayload = {};
      let limit = request.body.limit;
      let offset = request.body.offset;
      let order = [['createdAt', 'ASC']];
      const allKycLogs = await kycHelper.findAllKycLogs(
        profilePayload,
        limit,
        offset,
        order
      );
      if (Array.isArray(allKycLogs) && allKycLogs.length) {
        commonResponse = {
          message: CM.KYC_RESPONSE.SUCCESS.KYC_FOUND,
          data: allKycLogs,
        };
        request.body.result = commonResponse;
        next();
      } else {
        throw {
          message: CM.KYC_RESPONSE.ERROR.KYC_NOT_FOUND,
          field: CM.KYC_RESPONSE.FIELD.KYC,
        };
      }
    } catch (error) {
      console.log('GET KYC LOGS ERROR :', response);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  getKycDocsByUserId: express.RequestHandler = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    let commonResponse: GetCommonResponse;
    try {
      const profilePayload = {
        userId: request.body.userId,
      };
      const response = await kycHelper.findAllKycDocument(profilePayload);
      if (response) {
        commonResponse = {
          message: CM.KYC_RESPONSE.SUCCESS.KYC_FOUND,
          data: response,
        };
        request.body.result = commonResponse;
        next();
      } else {
        throw {
          message: CM.KYC_RESPONSE.ERROR.KYC_NOT_FOUND,
          field: CM.KYC_RESPONSE.FIELD.KYC,
        };
      }
    } catch (error) {
      console.log('GET KYC DOCS ERROR :', response);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  getUserInfoByUserId: express.RequestHandler = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const { userId } = request.userInfo;
      const userRow: any = await userHelper.getUserRow({ userId: userId });
      console.log('USER ROW:', userRow.userId, userRow.accountType);

      if (!userRow || userRow.accountType === null) {
        throw {
          field: CM.KYC_RESPONSE.FIELD.USER,
          message: CM.KYC_RESPONSE.ERROR.ACCOUNT_TYPE_MISSING,
        };
      }
      request.body.userData = userRow;
      next();
    } catch (error) {
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  getKycsWithPagination: express.RequestHandler = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    let commonResponse;
    try {
      commonResponse = await kycHelper.getAllUserKycs(request.body);
      if (commonResponse) {
        request.body.result = {
          message: '',
          data: commonResponse,
        };
        next();
      } else {
        throw {
          field: CM.KYC_RESPONSE.FIELD.USER,
          message: CM.KYC_RESPONSE.ERROR.USER_NOT_FOUND,
        };
      }
    } catch (error) {
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  getKycStatus: express.RequestHandler = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      let { userId } = request.userInfo;
      let commonResponse;
      let kycStatusResponse = await kycHelper.findKycStatus({ userId: userId });
      if (kycStatusResponse) {
        commonResponse = {
          message: CM.KYC_RESPONSE.SUCCESS.KYC_STATUS_FOUND,
          data: kycStatusResponse,
        };
        request.body.result = commonResponse;
        next();
      } else {
        throw {
          message: CM.KYC_RESPONSE.ERROR.KYC_NOT_FOUND,
          field: CM.KYC_RESPONSE.FIELD.KYC,
        };
      }
    } catch (error) {
      console.log('ERROR GET USER KYC STATUS', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  uploadKycDoc: express.RequestHandler = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    console.log('REQUEST HEADER:',request.headers);
    
    request.body.activityTitle = 'Upload Document';
    const { file } = request;
    let { userId, docType, viewType, docName } = request.body;
    try {
      console.log('UPLOAD DOCUMENT REQUEST BODY :', request.body);

      const timestamp = Date.now();
      const rawImageName = `${CM.AWS_CONFIG.KYC_DOC_PREFIX + userId}/${docName + timestamp.toString()
        }.png`;

      const uploadedDoc = await Helper.s3ClientHelper.uploadS3(
        file?.buffer,
        CM.AWS_CONFIG.DIRECTORY.KYC,
        rawImageName
      );
      console.log('UPLOADED DOC RESPONSE:', uploadedDoc);
      if (!uploadedDoc || uploadedDoc.error) {
        console.log('KYC DOCUMENT NOT UPLOADED');
        throw {
          field: CM.KYC_RESPONSE.FIELD.KYC_DOC,
          message: CM.KYC_RESPONSE.ERROR.KYC_DOC_UPLOAD_FAILURE,
        };
      }
      const kycDoc = await kycHelper.findKycLog({ userId: userId });
      if (!kycDoc) {
        throw {
          message: CM.KYC_RESPONSE.ERROR.KYC_NOT_FOUND,
          field: CM.KYC_RESPONSE.FIELD.KYC,
        };
      } else {
        request.body.file = {
          docPath : uploadedDoc.data,
          docName: docName,
          docType: docType,
          userId: userId,
          viewType: viewType,
          kycId: kycDoc.id,
          s3Status: true,
        };
      }
      console.log('DOC PAYLOAD TO SAVE:', request.body.file);

      next();
    } catch (error) {
      console.log('ERROR WHILE UPLOADING KYC DOCUMENT:', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  saveKycDocs: express.RequestHandler = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const { file } = request.body;
      const isDocSaved = await kycHelper.createKycDoc(file);

      if (!isDocSaved) {
        throw {
          field: CM.KYC_RESPONSE.FIELD.KYC_DOC,
          message: CM.KYC_RESPONSE.ERROR.KYC_DOC_UPLOAD_FAILURE,
        };
      }

      request.body.result = {
        message: CM.KYC_RESPONSE.SUCCESS.KYC_DOC_UPLOAD_SUCCESS,
        data: {},
      };
      next();
    } catch (error) {
      console.log('ERROR WHILE SAVING KYC DOCUMENT:', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  collectQuestionnaireData: express.RequestHandler = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const { userId } = request.params;
      const questionnaireData = await kycHelper.collectQuestionnaireData(
        userId
      );

      request.body.result = {
        message: CM.QUESTIONNAIRE_GRPC_RESPONSE.QUESTIONNAIRE_COLLECTED,
        data: questionnaireData,
      };

      next();
    } catch (error) {
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  getApplicant: express.RequestHandler = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const { applicantId } = request.params;
      const applicantData = await getApplicantData(applicantId);
      request.body.result = {
        message: CM.QUESTIONNAIRE_GRPC_RESPONSE.APPLICANT_NOT_FOUND,
        data: applicantData,
      };
      response.send(request.body.result);
    } catch (error) {
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  getUserKycInfo: express.RequestHandler = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      let commonResponse = {};
      const { userId } = request.body;

      const result = await kycHelper.getKycInfoObject(userId);

      if (!result) {
        throw {
          field: CM.KYC_RESPONSE.FIELD.USER,
          message: CM.KYC_RESPONSE.ERROR.USER_NOT_FOUND,
        };
      }

      commonResponse = {
        message: CM.KYC_RESPONSE.SUCCESS.USER_FOUND,
        field: CM.KYC_RESPONSE.FIELD.USER,
        data: result,
      };
      request.body.result = commonResponse;
      request.body.activityTitle = 'Api Request';
      next();
    } catch (error) {
      console.log('ERROR FIND KYC PROFILE:', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };
}

export default new KycMiddleware();
