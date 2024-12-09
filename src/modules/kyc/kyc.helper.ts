import {
  getDocumentImage,
  getApplicantDocs,
  getApplicantData,
} from '../../helpers/index';
import * as Helper from '../../helpers/index';
import {
  KycDoc,
  KycLogs,
  KytLogs,
  Op,
  sequelize,
  QueryTypes,
  kycAlerts,
} from '../../models/index';
import * as CM from '../../constant/response';
import * as moment from 'moment';
import { CREATE_KYC_LOG } from './kyc.interface';
import { submitTransaction } from '../../helpers/index';
import ClientHelper from '../../modules/grpc/client.helper';
import { Questions } from '../../models/questions.model';
import { Answers } from '../../models/answers.model';
import { Questionnaires } from '../../models/questionnaire.model';
import { Answer } from 'interfaces/models.interfaces';
import {
  getTxnDetailFromSumsub,
  getUserVerificationStatus,
} from '../../helpers/sumsub.helper';
import userHelper from '../../modules/user/user.helper';

class KycHelper {
  manageBusinessKycUsers = async (kycStatus: string, userRow: any) => {
    console.log(`LANDING IN BUSINESS USER::`, kycStatus);
    let result: string = kycStatus;
    try {
      let uboCount: number = 0;
      switch (kycStatus) {
        case CM.ENUM.KYC_STATUS.APPROVED:
          uboCount = await this.countKycLogs({
            parentId: userRow.applicantId,
            sumsubKycStatus: {
              [Op.notIn]: [CM.ENUM.KYC_STATUS.APPROVED],
            },
          });
          await this.updateKycLog(
            { parentProfileFilled: true },
            userRow.userId
          );
          console.log(`LANDING IN BUSINESS USER APPROVED CASE::`, uboCount);
          result =
            uboCount <= 0
              ? CM.ENUM.KYC_STATUS.APPROVED
              : userRow.sumsubKycStatus;
          break;
        case CM.ENUM.KYC_STATUS.PENDING:
          uboCount = await this.countKycLogs({
            parentId: userRow.applicantId,
            sumsubKycStatus: {
              [Op.notIn]: [
                CM.ENUM.KYC_STATUS.PENDING,
                CM.ENUM.KYC_STATUS.APPROVED,
              ],
            },
          });
          await this.updateKycLog(
            { parentProfileFilled: true },
            userRow.userId
          );
          console.log(`LANDING IN BUSINESS USER PENDING CASE::`, uboCount);
          result =
            uboCount <= 0
              ? CM.ENUM.KYC_STATUS.PENDING
              : userRow.sumsubKycStatus;
          break;
        case CM.ENUM.KYC_STATUS.FINAL_REJECTED:
        case CM.ENUM.KYC_STATUS.TEMPORARY_REJECTED:
          result = kycStatus;
          console.log('FOUND REJECTED STATUS');
          this.saveRejecteduserAlert(userRow);
          break;
        default:
          result = CM.ENUM.KYC_STATUS.INITIATED;
          break;
      }
      return result;
    } catch (error) {
      console.log(`ERROR WHILE MANAGE INDIVIDUAL STATUS::`, error);
      return result;
    }
  };
  manageBusinessUboIndividualUsers = async (
    kycStatus: string,
    userRow: any,
    getParentRow: any
  ) => {
    let result: string = kycStatus;
    try {
      let uboCount: number = 0;
      let isParentApproved: number = 0;
      switch (kycStatus) {
        case CM.ENUM.KYC_STATUS.APPROVED:
          isParentApproved = await this.countKycLogs({
            applicantId: userRow.parentId,
            [Op.or]: [
              { sumsubKycStatus: { [Op.in]: [CM.ENUM.KYC_STATUS.PENDING] } },
              { parentProfileFilled: true },
            ],
          });

          uboCount = await this.countKycLogs({
            parentId: userRow.parentId,
            sumsubKycStatus: {
              [Op.notIn]: [CM.ENUM.KYC_STATUS.APPROVED],
            },
          });
          console.log(
            `LANDING IN BUSINESS CHILD APPROVED CASE::`,
            isParentApproved,
            uboCount
          );

          result =
            isParentApproved === 1 && uboCount === 0
              ? CM.ENUM.KYC_STATUS.PENDING
              : getParentRow.sumsubKycStatus;
          break;
        case CM.ENUM.KYC_STATUS.PENDING:
          isParentApproved = await this.countKycLogs({
            applicantId: userRow.parentId,
            [Op.or]: [
              {
                sumsubKycStatus: {
                  [Op.in]: [CM.ENUM.KYC_STATUS.PENDING],
                },
              },
              { parentProfileFilled: true },
            ],
          });

          uboCount = await this.countKycLogs({
            parentId: userRow.parentId,
            sumsubKycStatus: {
              [Op.notIn]: [
                CM.ENUM.KYC_STATUS.PENDING,
                CM.ENUM.KYC_STATUS.APPROVED,
              ],
            },
          });
          console.log(
            `LANDING IN BUSINESS CHILD PENDING CASE:`,
            isParentApproved,
            uboCount
          );

          result =
            isParentApproved === 1 && uboCount === 0
              ? CM.ENUM.KYC_STATUS.PENDING
              : getParentRow.sumsubKycStatus;
          break;
        case CM.ENUM.KYC_STATUS.FINAL_REJECTED:
        case CM.ENUM.KYC_STATUS.TEMPORARY_REJECTED:
          result = kycStatus;
          break;
        default:
          result = CM.ENUM.KYC_STATUS.INITIATED;
          break;
      }
      return result;
    } catch (error) {
      console.log(`ERROR WHILE MANAGE INDIVIDUAL STATUS::`, error);
      return result;
    }
  };

  manageIndividualUsers = async (kycStatus: string, userRow: any) => {
    try {
      if (
        [
          CM.ENUM.KYC_STATUS.FINAL_REJECTED,
          CM.ENUM.KYC_STATUS.TEMPORARY_REJECTED,
        ].includes(kycStatus)
      ) {
        console.log('FOUND INDIVIDUAL REJECTED STATUS');
        this.saveRejecteduserAlert(userRow);
      }
      return kycStatus;
    } catch (error) {
      console.log(`ERROR WHILE MANAGE INDIVIDUAL STATUS::`, error);
      return kycStatus;
    }
  };

  fetchBusinessUserData = async (kyc_status: string, applicantId: any) => {
    let businessDetail = {};
    let businessUserInformation;
    try {
      if (kyc_status === CM.ENUM.KYC_STATUS.PENDING) {
        if (applicantId !== null) {
          businessUserInformation = await getApplicantData(applicantId);
        }
        if (!businessUserInformation) {
          console.log('DID NOT FETCH BUSINESS DATA AT PENDING ');
          return false;
        }
        let questionaireData =
          businessUserInformation?.questionnaires[0]?.sections
            ?.selectCompanyDetails;
        businessDetail = {
          businessName:
            businessUserInformation?.info?.companyInfo?.companyName || '',
          brandName: questionaireData?.items?.brandName?.value || '',
          incorporationDate:
            questionaireData?.items?.incorporationDate?.value || '',
          companyType: questionaireData?.items?.typeOfCompany?.value || '',
        };
        return businessDetail;
      }
    } catch (error: any) {
      return false;
    }
  };

  manageMethodsByType = async (kycStatus: string, userRow: any) => {
    let result = kycStatus;
    try {
      if (userRow.accountType === CM.ENUM.ACCOUNT_TYPE.BUSINESS) {
        console.log('MANAGE BUSINESS USER STATUS', kycStatus);
        result = await this.manageBusinessKycUsers(kycStatus, userRow);
        const businessDetail = await this.fetchBusinessUserData(
          result,
          userRow.applicantId
        );
        await this.updateKycLog({ sumsubKycStatus: result }, userRow.userId);
        await userHelper.updateUserRow({ userId : userRow.userId },{ userKycStatus : result });
      } else if (
        userRow.accountType === CM.ENUM.ACCOUNT_TYPE.INDIVIDUAL &&
        userRow.parentId != null
      ) {
        console.log('MANAGE UBO USER STATUS', kycStatus);
        const getParentRow: any = await this.findKycLog({
          applicantId: userRow.parentId,
        });
        result = await this.manageBusinessUboIndividualUsers(
          kycStatus,
          userRow,
          getParentRow
        );

        if (getParentRow?.userId) {
          await this.updateKycLog(
            { sumsubKycStatus: result },
            getParentRow.userId
          );
        }
        const businessDetail = await this.fetchBusinessUserData(
          result,
          userRow.parentId
        );
        await userHelper.updateUserRow({ userId : userRow.userId },{ userKycStatus : result });
      } else if (
        userRow.accountType === CM.ENUM.ACCOUNT_TYPE.INDIVIDUAL &&
        userRow.parentId == null
      ) {
        console.log('MANAGE METHOD BY TYPE INDIVIDUAL CASE:', kycStatus);
        result = await this.manageIndividualUsers(kycStatus, userRow);
        await this.updateKycLog({ sumsubKycStatus: result }, userRow.userId);
        await userHelper.updateUserRow({ userId : userRow.userId },{ userKycStatus : result });
      }
      return result;
    } catch (error) {
      console.log(`MANAGE METHOD BY TYPE::`, error);
      return result;
    }
  };
  manageKycStatus = async (kycStatus: string, userRow: any) => {
    try {
      console.log(`LANDING IN MANAGE STATUS::`, kycStatus);
      let result = kycStatus;
      if (userRow.applicantId) {
        result = await this.manageMethodsByType(kycStatus, userRow);
      } else {
        console.log(`APPLICANT ID NOT FOUND::`);
        if (!userRow.parentId) {
          await userHelper.updateUserRow({ userId : userRow.userId },{ userKycStatus : result });
        }
        return kycStatus;
      }
      return result;
    } catch (error) {
      console.log(`ERROR WHILE MANAGE STATUS FUNCTION::`, error);
      return kycStatus;
    }
  };

  findKycLog = async (payload: any): Promise<any> => {
    try {
      const kycLogRow = await KycLogs.findOne({
        where: payload,
        raw: true,
        attributes: { exclude: ['sumsubReason', 'taxVatId', 'companyType'] },
      });
      return kycLogRow;
    } catch (error) {
      console.log('ERROR IN FIND KYC LOG:', error);
      return false;
    }
  };

  findKycStatus = async (payload: any): Promise<any> => {
    try {
      const kycLogRow = await KycLogs.findOne({
        where: payload,
        raw: true,
        attributes: ['sumsubKycStatus', 'sumsubReason'],
      });
      return kycLogRow;
    } catch (error) {
      return false;
    }
  };

  findUserKycAndDocuments = async (payload: any) => {
    try {
      const userRow = await KycDoc.findAll({
        raw: true,
        where: payload,
      });
      return userRow;
    } catch (error) {
      return false;
    }
  };

  createKycLog = async (payload: CREATE_KYC_LOG) => {
    try {
      return await KycLogs.create(payload as any, { raw: true });
    } catch (error) {
      console.log('CREATE KYC LOG ERROR:', error);
      return false;
    }
  };

  updateKycLog = async (payload: object, userId: string): Promise<boolean> => {
    try {
      return await KycLogs.update(payload, {
        where: { userId: userId },
      })
        .then((result: number[]) => {
          if (result[0] == 1) {
            return true;
          } else {
            return false;
          }
        })
        .catch((error) => {
          console.log('ERRRO IN UPDATING LOG', error);

          throw error;
        });
    } catch (error) {
      return false;
    }
  };

  updateBusinessDetail = async (
    payload: object,
    applicantId: string
  ): Promise<boolean> => {
    try {
      return await KycLogs.update(payload, {
        where: { applicantId: applicantId },
      })
        .then((result: number[]) => {
          if (result[0] == 1) {
            return true;
          } else {
            return false;
          }
        })
        .catch((error) => {
          throw error;
        });
    } catch (error) {
      console.log('ERROR TO UPDATE BUSINESS:', error);
      return false;
    }
  };

  findAllKycLogs = async (
    payload: any = {},
    limit: number = 20,
    offset: number = 0,
    order: any = [['createdAt', 'ASC']]
  ) => {
    try {
      const response = await KycLogs.findAll({
        where: payload,
        limit: limit,
        offset: offset,
        order: order,
        raw: true,
      });
      return response;
    } catch (error) {
      return false;
    }
  };

  findAllKycs = async (payload: any) => {
    try {
      const response = await KycLogs.findAll({
        where: payload,
        order: [['createdAt', 'ASC']],
        raw: true,
      });
      return response;
    } catch (error) {
      return false;
    }
  };

  countKycLogs = async (payload: any) => {
    try {
      return await KycLogs.count({
        where: payload,
      });
    } catch (error) {
      return 0;
    }
  };

  findAndCountAllKycs = async (
    limit: number = 10,
    offset: number = 0,
    filterOption: any = {}
  ) => {
    let whereOptions: any = {
      adminKycStatus: CM.ENUM.KYC_STATUS.PENDING,
      parentId: {
        [Op.is]: null,
      },
      sumsubKycStatus: {
        [Op.notIn]: [
          CM.ENUM.KYC_STATUS.TEMPORARY_REJECTED,
          CM.ENUM.KYC_STATUS.FINAL_REJECTED,
        ],
      },
    };
    let count = 0;
    try {
      if (filterOption.nationality) {
        whereOptions.nationality = { [Op.iLike]: filterOption.nationality };
      }
      if (filterOption.search) {
        whereOptions = {
          ...whereOptions,
          [Op.or]: [
            { firstName: { [Op.iLike]: `%${filterOption.search}%` } },
            { lastName: { [Op.iLike]: `%${filterOption.search}%` } },
            { email: { [Op.iLike]: `%${filterOption.search}%` } },
            { userId: { [Op.iLike]: `%${filterOption.search}%` } },
            { brandName: { [Op.iLike]: `%${filterOption.search}%` } },
            { businessName: { [Op.iLike]: `%${filterOption.search}%` } },
          ],
        };
      }
      if (
        filterOption.accountType &&
        filterOption.accountType !== CM.FILTER_TYPE_ALL
      ) {
        whereOptions.accountType = filterOption.accountType;
      }
      if (filterOption.endDate && filterOption.startDate) {
        whereOptions[Op.and] = [
          {
            createdAt: {
              [Op.gte]: moment(filterOption.startDate, 'YYYY/MM/DD').toDate(),
            },
          },
          {
            createdAt: {
              [Op.lte]: moment(filterOption.endDate, 'YYYY/MM/DD')
                .add(1, 'day')
                .toDate(),
            },
          },
        ];
      }
      if (filterOption.startDate && !filterOption.endDate) {
        whereOptions.createdAt = {
          [Op.gte]: moment(filterOption.startDate, 'YYYY/MM/DD').toDate(),
        };
      }
      if (filterOption.endDate && !filterOption.startDate) {
        whereOptions.createdAt = {
          [Op.lte]: moment(filterOption.endDate, 'YYYY/MM/DD')
            .add(1, 'day')
            .toDate(),
        };
      }

      const count = await KycLogs.count({
        where: whereOptions,
      });

      const response = await KycLogs.findAll({
        limit: limit,
        offset: offset,
        where: whereOptions,
        order: [['createdAt', 'DESC']],
        raw: true,
      });
      if (response !== null) {
        return { count: count, rows: response };
      } else {
        return { count: count, rows: [] };
      }
    } catch (error) {
      console.log('ERROR WHILE FETCHING KYT DATA:', error);
      return { count: count, rows: [] };
    }
  };

  findAndcountComplianceKycs = async (
    limit: number = 10,
    offset: number = 0,
    completedByUserId: string,
    type: any,
    filterOption: any
  ) => {
    let count = 0;
    let whereOptions: any = {
      adminKycStatus: type === 'REJECTED' ? CM.ENUM.KYC_STATUS.PENDING : type,
      parentId: null,
      sumsubKycStatus:
        type === 'REJECTED'
          ? {
              [Op.in]: [
                CM.ENUM.KYC_STATUS.TEMPORARY_REJECTED,
                CM.ENUM.KYC_STATUS.FINAL_REJECTED,
              ],
            }
          : type,
      ...(type !== 'REJECTED' && { completedByUserId: { [Op.not]: null } }),
    };

    if (filterOption.kycStatus) {
      whereOptions.adminKycStatus = filterOption.kycStatus;
    }

    if (filterOption.endDate && filterOption.startDate) {
      whereOptions[Op.and] = [
        {
          createdAt: {
            [Op.gte]: moment(filterOption.startDate, 'YYYY/MM/DD').toDate(),
          },
        },
        {
          createdAt: {
            [Op.lte]: moment(filterOption.endDate, 'YYYY/MM/DD')
              .add(1, 'day')
              .toDate(),
          },
        },
      ];
    }
    if (filterOption.startDate && !filterOption.endDate) {
      whereOptions.createdAt = {
        [Op.gte]: moment(filterOption.startDate, 'YYYY/MM/DD').toDate(),
      };
    }
    if (filterOption.endDate && !filterOption.startDate) {
      whereOptions.createdAt = {
        [Op.lte]: moment(filterOption.endDate, 'YYYY/MM/DD')
          .add(1, 'day')
          .toDate(),
      };
    }

    if (filterOption.nationality) {
      whereOptions.nationality = { [Op.iLike]: filterOption.nationality };
    }

    if (filterOption.searchBy) {
      whereOptions = {
        ...whereOptions,
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${filterOption.searchBy}%` } },
          { lastName: { [Op.iLike]: `%${filterOption.searchBy}%` } },
          { email: { [Op.iLike]: `%${filterOption.searchBy}%` } },
          { userId: { [Op.iLike]: `%${filterOption.searchBy}%` } },
          { brandName: { [Op.iLike]: `%${filterOption.searchBy}%` } },
          { businessName: { [Op.iLike]: `%${filterOption.searchBy}%` } },
        ],
      };
    }

    if (filterOption.accountType) {
      whereOptions.accountType = filterOption.accountType;
    }

    console.log('WHERE CONDITION IN COMPLIANCE KYC:', whereOptions);

    try {
      const count = await KycLogs.count({
        where: whereOptions,
      });

      const response = await KycLogs.findAll({
        limit: limit,
        offset: offset,
        where: whereOptions,
        order: [['updatedAt', 'DESC']],
        raw: true,
      });
      if (response !== null) {
        return { count: count, rows: response };
      } else {
        return { count: count, rows: [] };
      }
    } catch (error) {
      console.log('ERROR WHILE FETCHING REJECTED USERS LIST:', error);
      return { count: count, rows: [] };
    }
  };

  findAllKycDocument = async (payload: any): Promise<any> => {
    try {
      const response = await KycDoc.findAll({
        where: payload,
        raw: true,
      });
      return response;
    } catch (error) {
      return false;
    }
  };

  findAllKytDocument = async (
    payload: any,
    limit: number,
    offset: number
  ): Promise<any> => {
    try {
      const response = await KycDoc.findAndCountAll({
        limit: limit,
        offset: offset,
        where: payload,
        order: [['createdAt', 'ASC']],
      });
      console.log('FIND KYT DOCS:', response);
      return response;
    } catch (error) {
      console.log('ERROR FINDING KYT DOCS:', error);

      return false;
    }
  };

  findKycDocument = async (payload: any) => {
    try {
      const response = await KycDoc.findOne({
        where: payload,
        order: [['createdAt', 'ASC']],
        raw: true,
      });
      return response;
    } catch (error) {
      console.log('ERROR FIND KYC DOC', error);
      return false;
    }
  };

  createKycDoc = async (payload: any) => {
    try {
      const response = await KycDoc.create(payload, {
        raw: true,
      });
      return response;
    } catch (error) {
      console.log('ERROR WHILE SAVING DOUCMENT:', error);
      return false;
    }
  };

  destroyKycDoc = async (payload: any) => {
    try {
      const response = await KycDoc.destroy({
        where: payload,
      });
      console.log('DELETING KYC DOCUMENT', response);
      return response;
    } catch (error) {
      console.log('ERROR WHILE DESTROYING DOUCMENT:', error);
      return false;
    }
  };

  updateKycDocument = async (payload: object, docId: string) => {
    try {
      return await KycDoc.update(payload, {
        where: { sumsubDocId: docId },
      })
        .then((result: number[]) => {
          if (result[0] == 1) {
            return true;
          } else {
            return false;
          }
        })
        .catch((error) => {
          throw error;
        });
    } catch (error) {
      return false;
    }
  };

  updateAdditionalDocument = async (payload: object, id: string) => {
    try {
      return await KycDoc.update(payload, {
        where: { id: id },
      })
        .then((result: number[]) => {
          if (result[0] == 1) {
            return true;
          } else {
            return false;
          }
        })
        .catch((error) => {
          throw error;
        });
    } catch (error) {
      return false;
    }
  };

  findBeneficiariesByParentId = async (parentId: any) => {
    let beneficiaries: any = [];
    let beneficiary;
    try {
      const profile: any = await KycLogs.findAll({
        where: { parentId: parentId },
        order: [['createdAt', 'ASC']],
        raw: true,
      });
      for (let kycProfile of profile) {
        let moderationComment: any = [];
        const kycDocs = await KycDoc.findAll({
          where: { kycId: kycProfile.id, userId: kycProfile.userId },
        });
        if (
          [
            CM.ENUM.KYC_STATUS.FINAL_REJECTED,
            CM.ENUM.KYC_STATUS.TEMPORARY_REJECTED,
          ].includes(kycProfile.sumsubKycStatus)
        ) {
          moderationComment = await this.getUserModerationComments(
            kycProfile.applicantId,
            kycProfile.accountType
          );
        }
        beneficiary = {
          ...kycProfile,
          individualDocs: kycDocs || [],
          moderationComment: moderationComment || '',
        };
        beneficiaries.push(beneficiary);
      }
      return beneficiaries;
    } catch (error) {
      return false;
    }
  };

  saveKycDocs = async () => {
    let applicantDocs;
    let tempDocArr: any = [];
    let applicantQuestionaireData = {};
    let applicantData: any = {};
    let currentUserId = '';
    let requiredIdDocuments;
    let isKycLogUpdated = false;
    let toUpdateKycLogPayload: any = {};
    let companyName = '';
    let registrationNumber = '';
    let individualAccountInformation = {};
    let applicantDocumentResponse: any;
    try {
      const kycLogFound = await this.findAllKycs({
        isDocSaved: false,
        sumsubKycStatus: {
          [Op.notIn]: [CM.ENUM.KYC_STATUS.INITIATED],
        },
      });

      if (kycLogFound) {
        for (let kycLog of kycLogFound) {
          if (kycLog.accountType === CM.ENUM.ACCOUNT_TYPE.BUSINESS) {
            applicantData = {};
            toUpdateKycLogPayload = {};
            individualAccountInformation = {};
            currentUserId = kycLog.userId;
            tempDocArr = [];

            const businessApplicantData = await getApplicantData(
              kycLog.applicantId
            );
            console.log(
              'BUSINESS USER SUMSUB RESPONSE :',
              businessApplicantData
            );

            applicantData = businessApplicantData;

            requiredIdDocuments = businessApplicantData?.questionnaires
              ? businessApplicantData?.questionnaires[0]?.sections
                  ?.requiredDocuments?.items
              : undefined;

            if (
              requiredIdDocuments !== undefined &&
              Object.keys(requiredIdDocuments).length
            ) {
              for (let element in requiredIdDocuments) {
                if (
                  element &&
                  requiredIdDocuments[element].value !== undefined
                ) {
                  let saveDocPayload = {
                    userId: kycLog?.userId,
                    applicantId: kycLog?.applicantId,
                    kycId: kycLog?.id.toString(),
                    sumsubDocId: requiredIdDocuments[element].value,
                    docType: element,
                    docName: element,
                    viewType: CM.SUMSUB.DOC_VIEW_TYPE.FRONT,
                    inspectionId: kycLog?.inspectionId,
                  };
                  tempDocArr.push(saveDocPayload);
                }
              }
            }

            if (kycLog.applicantId !== null) {
              applicantDocumentResponse = await getApplicantDocs(
                kycLog.applicantId
              );
            }

            if (applicantDocumentResponse) {
              applicantDocs =
                applicantDocumentResponse?.data?.COMPANY?.stepStatuses[0]
                  ?.images;
              if (Array.isArray(applicantDocs) && applicantDocs.length) {
                for (const element of applicantDocs) {
                  let docName = element?.idDocSubType;

                  let saveDocPayload = {
                    userId: kycLog?.userId,
                    applicantId: kycLog?.applicantId,
                    kycId: kycLog?.id.toString(),
                    sumsubDocId: element?.imageId.toString(),
                    docType: docName,
                    docName: docName,
                    viewType: CM.SUMSUB.DOC_VIEW_TYPE.FRONT,
                    inspectionId: kycLog?.inspectionId,
                  };
                  tempDocArr.push(saveDocPayload);
                }
              }
            } else {
              console.log(
                kycLog?.userId + ':' + CM.KYC_RESPONSE.ERROR.APPLICANT_NOT_FOUND
              );
            }

            applicantQuestionaireData =
              businessApplicantData && businessApplicantData?.questionnaires
                ? {
                    ...businessApplicantData?.questionnaires[0]?.sections
                      ?.selectCompanyDetails?.items,
                    ...businessApplicantData?.questionnaires[0]?.sections
                      ?.financialInformation?.items,
                  }
                : {};

            companyName =
              businessApplicantData && businessApplicantData?.info
                ? businessApplicantData?.info?.companyInfo?.companyName
                : null;

            registrationNumber =
              businessApplicantData && businessApplicantData?.info
                ? businessApplicantData?.info?.companyInfo?.registrationNumber
                : null;

            individualAccountInformation =
              businessApplicantData && businessApplicantData?.info
                ? businessApplicantData?.info?.companyInfo
                : {};
          } else {
            applicantData = {};
            toUpdateKycLogPayload = {};
            individualAccountInformation = {};
            currentUserId = kycLog.userId;
            tempDocArr = [];

            if (kycLog.applicantId !== null) {
              const individualApplicantData = await getApplicantData(
                kycLog.applicantId
              );
              console.dir(individualApplicantData , { depth : true })
              applicantQuestionaireData =
                individualApplicantData?.questionnaires &&
                kycLog.parentId == null
                  ? individualApplicantData?.questionnaires[0]?.sections
                      ?.individualAccountQue?.items
                  : individualApplicantData?.questionnaires &&
                    kycLog.parentId !== null
                  ? individualApplicantData?.questionnaires[0]?.sections
                      ?.individualAccountInf?.items
                  : {};

              individualAccountInformation =
                individualApplicantData?.questionnaires
                  ? individualApplicantData?.questionnaires[0]?.sections
                      ?.individualAccountInf?.items
                  : {};

              applicantData = individualApplicantData;
            }

            if (kycLog.applicantId !== null) {
              const { data }: any = await getApplicantDocs(kycLog.applicantId);
              applicantDocs = data;
            }

            if (applicantDocs) {
              if (Object.keys(applicantDocs).length) {
                for (let doc in applicantDocs) {
                  if (
                    applicantDocs[doc] !== null &&
                    applicantDocs[doc] !== undefined &&
                    Array.isArray(applicantDocs[doc]?.imageIds) &&
                    applicantDocs[doc].imageIds.length
                  ) {
                    for (const element of applicantDocs[doc].imageIds) {
                      let docName = !CM.SUMSUB.DOC_TYPES.includes(
                        applicantDocs[doc]?.idDocType
                      )
                        ? applicantDocs[doc].idDocType
                        : CM.SUMSUB.DOC_TYPES.includes(
                            applicantDocs[doc].idDocType
                          ) && applicantDocs[doc].imageIds.indexOf(element) == 0
                        ? applicantDocs[doc].idDocType +
                          CM.SUMSUB.DOC_VIEW_TYPE.SUFFIX_FRONT
                        : applicantDocs[doc].idDocType +
                          CM.SUMSUB.DOC_VIEW_TYPE.SUFFIX_BACK;

                      let viewType = !CM.SUMSUB.DOC_TYPES.includes(
                        applicantDocs[doc].idDocType
                      )
                        ? CM.SUMSUB.DOC_VIEW_TYPE.FRONT
                        : CM.SUMSUB.DOC_TYPES.includes(
                            applicantDocs[doc].idDocType
                          ) && applicantDocs[doc].imageIds.indexOf(element) == 0
                        ? CM.SUMSUB.DOC_VIEW_TYPE.FRONT
                        : CM.SUMSUB.DOC_VIEW_TYPE.BACK;

                      let saveDocPayload = {
                        userId: kycLog?.userId,
                        applicantId: kycLog?.applicantId,
                        kycId: `${kycLog?.id}`,
                        sumsubDocId: element.toString(),
                        docType: applicantDocs[doc]?.idDocType,
                        docName: docName,
                        viewType: viewType,
                        inspectionId: kycLog.inspectionId,
                      };
                      tempDocArr.push(saveDocPayload);
                    }
                  }
                }
              } else {
                console.log(
                  kycLog?.userId +
                    ':' +
                    CM.KYC_RESPONSE.ERROR.APPLICANT_NOT_FOUND
                );
              }
            }
          }

          await KycDoc.destroy({
            where: { userId: currentUserId },
          });

          const numRowCreated = await KycDoc.bulkCreate(tempDocArr);

          if (!numRowCreated) {
            console.log('KYC DOCUMENT NOT SAVED');
          } 
          else {
            if (kycLog.accountType === CM.ENUM.ACCOUNT_TYPE.INDIVIDUAL) {
              console.log('UPDATING INDIVIDUAL KYC DETAILS');
              
              toUpdateKycLogPayload = {
                isDocSaved: true,
                questionairePayload: applicantQuestionaireData
                  ? JSON.stringify(applicantQuestionaireData)
                  : null,
                verificationFullPayload: applicantData
                  ? JSON.stringify(applicantData)
                  : null,
                individualAccountInf: individualAccountInformation
                  ? JSON.stringify(individualAccountInformation)
                  : null,
                address: applicantData?.questionnaires
                  ? applicantData?.questionnaires[0]?.sections
                      ?.individualAccountInf?.items?.addressStreet?.value
                  : null,
                zipCode: applicantData?.questionnaires
                  ? applicantData?.questionnaires[0]?.sections
                      ?.individualAccountInf?.items?.zipCode?.value
                  : null,
                city: applicantData?.questionnaires
                  ? applicantData?.questionnaires[0]?.sections
                      ?.individualAccountInf?.items?.cityTown?.value
                  : null,
                dob: applicantData?.fixedInfo?.dob ? applicantData?.fixedInfo?.dob : null,
                firstName: applicantData?.fixedInfo?.firstName ? applicantData?.fixedInfo?.firstName : null,
                lastName: applicantData?.fixedInfo?.lastName ? applicantData?.fixedInfo?.lastName : null
              };
            } else {
              console.log('UPDATING BUSINESS KYC DETAILS');

              toUpdateKycLogPayload = {
                isDocSaved: true,
                verificationFullPayload: applicantData
                  ? JSON.stringify(applicantData)
                  : null,
                individualAccountInf: individualAccountInformation
                  ? JSON.stringify(individualAccountInformation)
                  : null,
                questionairePayload: applicantQuestionaireData
                  ? JSON.stringify(applicantQuestionaireData)
                  : null,
                businessName: companyName,
                registrationNumber: registrationNumber,
              };
            }

            isKycLogUpdated = await this.updateKycLog(
              toUpdateKycLogPayload,
              currentUserId
            );
          }
        }
      }
    } catch (error: any) {
      console.log('ERROR IN SAVING APPLICANT DOCUMENTS', error);
    }
  };

  updateKycDocs = async () => {
    try {
      const requestPayload: { s3Status: boolean } = {
        s3Status: false,
      };
      const kycDocument: any = await this.findKycDocument(requestPayload);
      if (
        kycDocument !== null &&
        kycDocument.inspectionId !== null &&
        kycDocument.sumsubDocId !== null
      ) {
        await getDocumentImage(
          kycDocument.inspectionId,
          kycDocument.sumsubDocId
        ).then(async (data) => {
          const timestamp = Date.now();
          const rawImageName = `${
            CM.AWS_CONFIG.KYC_DOC_PREFIX + kycDocument.userId
          }/${kycDocument.docName + timestamp.toString()}.png`;

          const isDocumentUploaded = await Helper.s3ClientHelper.uploadS3(
            data,
            CM.AWS_CONFIG.DIRECTORY.KYC,
            rawImageName
          );

          if (isDocumentUploaded && !isDocumentUploaded.error) {
            let documentPayload = {
              docPath: isDocumentUploaded.data,
              s3Status: true,
            };
            const isDocumentStatusUpdated = await this.updateKycDocument(
              documentPayload,
              kycDocument.sumsubDocId
            );

            if (!isDocumentStatusUpdated) {
              console.log(
                'ERROR IN UPDATE DOCUMENT STATUS',
                isDocumentStatusUpdated
              );
            }
          }
        });
      } else {
        console.log('NO DOCS FOUND');
      }
    } catch (error: any) {
      console.log(
        'ERROR WHILE UPDATING DOCS AND UPLOADING GOOGLE STORAGE',
        error
      );
    }
  };

  getAllUserKycs = async (requestdata: any) => {
    try {
      let { limit, offset, filterOption } = requestdata;
      const limits = limit ? Number(limit) : Number(CM.PAGINATION.LIMIT_VALUE);
      const offsets = offset
        ? Number(offset)
        : Number(CM.PAGINATION.OFFSET_VALUE);
      let response = await this.findAndCountAllKycs(
        Number(limits),
        Number(offsets),
        filterOption
      );
      if (response) {
        return response;
      } else {
        return response;
      }
    } catch (error) {
      return error;
    }
  };

  getAllComplianceKycs = async (requestdata: any) => {
    try {
      let { limit, offset, completedByUserId, type, filter } = requestdata;
      const limits = limit ? Number(limit) : Number(CM.PAGINATION.LIMIT_VALUE);
      const offsets = offset
        ? Number(offset)
        : Number(CM.PAGINATION.OFFSET_VALUE);
      let response = await this.findAndcountComplianceKycs(
        Number(limits),
        Number(offsets),
        completedByUserId,
        type,
        filter
      );
      if (response) {
        return response;
      } else {
        return response;
      }
    } catch (error) {
      return error;
    }
  };

  submitTransaction = async (transactionPayload: any) => {
    try {
      const submittedTransaction = await submitTransaction(transactionPayload);
      return submittedTransaction;
    } catch (error) {
      throw error;
    }
  };

  createKytLog = async (payload: any) => {
    try {
      const response = await KytLogs.create(payload);
      return response;
    } catch (error) {
      console.log('CREATE KYT LOG ERROR:', error);
      return false;
    }
  };

  findKytLog = async (payload: any) => {
    try {
      const kytLog = await KytLogs.findOne({ where: payload, raw: true });
      if (!kytLog) {
        return false;
      } else {
        return kytLog;
      }
    } catch (error) {
      console.log('FIND KYT LOG ERROR:', error);
      return false;
    }
  };

  updateKytLog = async (payload: object, txnId: string) => {
    try {
      return await KytLogs.update(payload, {
        where: { txnId: txnId },
      })
        .then((result: number[]) => {
          if (result[0] == 1) {
            return true;
          } else {
            return false;
          }
        })
        .catch((error) => {
          console.log('UPDATE KYT LOG ERROR:', error);
          throw error;
        });
    } catch (error) {
      return false;
    }
  };

  updateKytLogByTypeId = async (payload: object, typeId: string) => {
    try {
      const result = await KytLogs.update(payload, {
        where: { typeId: typeId },
      })
        .then((result: number[]) => {
          if (result[0] == 1) {
            return true;
          } else {
            return false;
          }
        })
        .catch((error) => {
          console.log('ERROR UPDATE KYT LOG', error);
          throw error;
        });
      return result;
    } catch (error) {
      console.log('UPDATE KYT LOG ERROR:', error);
      return false;
    }
  };

  getAllKytLogs = async (requestdata: any) => {
    try {
      let { limit, offset, filter } = requestdata;
      const limits = limit ? Number(limit) : Number(CM.PAGINATION.LIMIT_VALUE);
      const offsets = offset
        ? Number(offset)
        : Number(CM.PAGINATION.OFFSET_VALUE);
      let response = await this.findAndCountKytLogs(
        Number(limits),
        Number(offsets),
        filter,
        ''
      );
      if (response) {
        return response;
      } else {
        return response;
      }
    } catch (error) {
      return error;
    }
  };

  getAllKytLogsByUserId = async (requestdata: any) => {
    try {
      let { limit, offset, filter, userId } = requestdata;
      const limits = limit ? Number(limit) : Number(CM.PAGINATION.LIMIT_VALUE);
      const offsets = offset
        ? Number(offset)
        : Number(CM.PAGINATION.OFFSET_VALUE);
      let response = await this.findAndCountKytLogs(
        Number(limits),
        Number(offsets),
        filter,
        userId
      );
      if (response) {
        return response;
      } else {
        return response;
      }
    } catch (error) {
      return error;
    }
  };

  findAndCountKytLogs = async (
    limit: number = CM.PAGINATION.LIMIT_VALUE,
    offset: number = CM.PAGINATION.LIMIT_VALUE,
    filterOption: any = {},
    userId: string
  ) => {
    let count = 0;
    let whereOptions: any = {
      wasSuspicious: true,
      txnStatus: {
        [Op.notIn]: [CM.ENUM.TRANSACTION_STATUS.FAILED],
      },
    };
    try {
      if (
        filterOption.txnStatus &&
        filterOption.txnStatus !== CM.FILTER_TYPE_ALL
      ) {
        if (filterOption.txnStatus == CM.ENUM.STATUS_TYPE.PENDING) {
          whereOptions = {
            ...whereOptions,
            wasSuspicious: true,
            txnStatus: {
              [Op.in]: [CM.ENUM.TRANSACTION_STATUS.PENDING],
            },
          };
        } else if (filterOption.txnStatus == CM.ENUM.STATUS_TYPE.APPROVED) {
          whereOptions = {
            ...whereOptions,
            txnStatus: {
              [Op.in]: [CM.ENUM.TRANSACTION_STATUS.APPROVED],
            },
          };
        } else if (filterOption.txnStatus == CM.ENUM.STATUS_TYPE.REJECTED) {
          whereOptions = {
            ...whereOptions,
            txnStatus: {
              [Op.in]: [CM.ENUM.TRANSACTION_STATUS.REJECTED],
            },
          };
        }
      }
      if (filterOption.searchBy) {
        whereOptions = {
          ...whereOptions,
          [Op.or]: [
            sequelize.literal(
              `"type"::varchar ILIKE '%${filterOption.searchBy}%' OR "txnId" iLIKE '%${filterOption.searchBy}%' OR "coinName" iLIKE '%${filterOption.searchBy}%'  OR "clientId" iLIKE '%${filterOption.searchBy}%'`
            ),
          ],
        };
      }

      if (filterOption.type) {
        whereOptions = {
          ...whereOptions,
          type: filterOption.type,
        };
      }

      if (filterOption.endDate && filterOption.startDate) {
        whereOptions[Op.and] = [
          {
            createdAt: {
              [Op.gte]: moment(filterOption.startDate, 'YYYY/MM/DD').toDate(),
            },
          },
          {
            createdAt: {
              [Op.lte]: moment(filterOption.endDate, 'YYYY/MM/DD')
                .add(1, 'day')
                .toDate(),
            },
          },
        ];
      }
      if (filterOption.startDate && !filterOption.endDate) {
        whereOptions.createdAt = {
          [Op.gte]: moment(filterOption.startDate, 'YYYY/MM/DD').toDate(),
        };
      }
      if (filterOption.endDate && !filterOption.startDate) {
        whereOptions.createdAt = {
          [Op.lte]: moment(filterOption.endDate, 'YYYY/MM/DD')
            .add(1, 'day')
            .toDate(),
        };
      }

      const count = await KytLogs.count({
        where: whereOptions,
      });

      const response = await KytLogs.findAll({
        limit: limit,
        offset: offset,
        where: whereOptions,
        order: [['createdAt', 'DESC']],
        raw: true,
      });
      if (response !== null) {
        return { count: count, rows: response };
      } else {
        return { count: count, rows: [] };
      }
    } catch (error) {
      return { count: count, rows: [] };
    }
  };

  createIndividualAlertPayload(data1: any) {
    let moderationComments: Array<String> = [];

    for (const key in data1) {
      if (data1[key]?.reviewResult?.moderationComment) {
        moderationComments.push(data1[key].reviewResult.moderationComment);
      }
      if (data1[key]?.imageReviewResults) {
        Object.values(data1[key].imageReviewResults).forEach(
          (imageResult: any) => {
            if (imageResult?.moderationComment) {
              moderationComments.push(imageResult.moderationComment);
            }
          }
        );
      }
    }

    const newData = new Set(moderationComments);
    return newData;
  }

  createBusinessAlertPayload(data: any) {
    let moderationComments = [];
    const commentData = data?.COMPANY?.stepStatuses;
    if (commentData !== undefined) {
      for (let element of commentData) {
        const message = element?.reviewResult?.moderationComment;
        if (message !== undefined) {
          moderationComments.push(message);
        }
      }
    }
    return moderationComments;
  }

  getUserModerationComments = async (
    applicantId: string,
    accountType: string
  ) => {
    let morerationComments: any;
    if (applicantId == null) {
      return false;
    }
    try {
      const userResult = await getUserVerificationStatus(applicantId);

      if (!userResult) {
        return false;
      } else {
        if (accountType === CM.ENUM.ACCOUNT_TYPE.BUSINESS) {
          morerationComments = this.createBusinessAlertPayload(userResult.data);
        } else {
          morerationComments = this.createIndividualAlertPayload(
            userResult.data
          );
        }
        let uniqueModerationComment = [...new Set(morerationComments)];
        return uniqueModerationComment;
      }
    } catch (error) {
      return false;
    }
  };

  getTxnDetailByTxnId = async (txnId: string) => {
    try {
      const txn = await getTxnDetailFromSumsub(txnId);
      console.dir(txn, { depth: null });
      return txn;
    } catch (error) {
      return false;
    }
  };

  collectQuestionnaireData = async (userId: string) => {
    try {
      const log = await KycLogs.findOne({ where: { userId } });

      if (!log) {
        console.log(`NO KYC LOG FOUND FOR USER ${userId}`);
        return;
      }

      const parsedQuestionnairePayload: any =
        log.dataValues.questionairePayload;

      if (
        !parsedQuestionnairePayload ||
        !Object.keys(parsedQuestionnairePayload).length
      ) {
        console.log(`NO QUESTIONNAIRE FOUND FOR USER ${userId}`);
        return;
      }

      const existQuestionnaire = await Questionnaires.findAll({
        where: { userId },
      });

      if (existQuestionnaire.length) {
        return;
      }

      // @ts-ignore
      const parsedQuestionnaire =
        parsedQuestionnairePayload.items || parsedQuestionnairePayload;

      const questions = await Questions.findAll({
        // @ts-ignore
        where: parsedQuestionnairePayload.items
          ? { type: 'business' }
          : { type: 'individual' },
        include: [{ model: Answers, as: 'answers' }],
      });

      const questionsMap = new Map();
      const answersMap = new Map();

      questions.forEach((q) => {
        questionsMap.set(q.dataValues.key, q);
        // @ts-ignore
        q.dataValues.answers.forEach((a: Answer) => {
          answersMap.set(
            `${q.dataValues.key}_${a.dataValues.key}`,
            a.dataValues
          );
        });
      });

      for (const key in parsedQuestionnaire) {
        const question = questionsMap.get(key);
        const answer = answersMap.get(
          `${key}_${parsedQuestionnaire[key].value}`
        );

        if (!question || !answer) {
          console.log(`QUESTION OR ANSWER NOT FOUND FOR USER ${userId}`);
          continue;
        }

        // @ts-ignore
        await Questionnaires.create({
          userId,
          questionId: question.id,
          answerId: answer.id,
        });
        questionsMap.delete(key);
      }

      if (questionsMap.size) {
        questionsMap.forEach(async (q) => {
          // @ts-ignore
          await Questionnaires.create({
            userId,
            questionId: q.id,
            answerId: q.dataValues.answers[0].id,
          });
        });
      }

      // await Questionnaires.create({
      //   userId,
      //   questionId: 777, // country
      //   manualScore: 1 // country
      // });

      return true;
    } catch (error) {
      return false;
    }
  };

  getUserVerification = async (accountType: string): Promise<any> => {
    const sqlQuery = `SELECT COUNT(*) AS totalCount,(SELECT COUNT(*) FROM "kyc_log" WHERE "createdAt" >= CURRENT_DATE - INTERVAL '7 days' AND "sumsubKycStatus"='APPROVED' AND "accountType"=:accountType AND "parentId" IS NULL) as lastSevenDayCount
    ,(SELECT COUNT(*) FROM "kyc_log" WHERE "createdAt" >= CURRENT_DATE - INTERVAL '30 days' AND "sumsubKycStatus"='APPROVED' AND "accountType"=:accountType AND "parentId" IS NULL) as lastThirtyDayCount FROM "kyc_log" WHERE "sumsubKycStatus"='APPROVED' AND "accountType"=:accountType AND "parentId" IS NULL;`;
    try {
      const verifiedUserData: any = await sequelize.query(sqlQuery, {
        type: QueryTypes.SELECT,
        replacements: { accountType: accountType },
      });
      return {
        totalCount: verifiedUserData[0].totalcount,
        lastSevenDayCount: verifiedUserData[0].lastsevendaycount,
        lastThirtyDayCount: verifiedUserData[0].lastthirtydaycount,
      };
    } catch (error) {
      console.log('VERIFICATION USER ERROR', error);
      return false;
    }
  };

  getRejectedVerification = async (accountType: string): Promise<any> => {
    const sqlQuery = `SELECT COUNT(*) AS totalCount,(SELECT COUNT(*) FROM "kyc_log" WHERE "createdAt" >= CURRENT_DATE - INTERVAL '7 days' AND "sumsubKycStatus" IN ('FINAL_REJECTED','TEMPORARY_REJECTED') AND "accountType"=:accountType AND "parentId" IS NULL) as lastSevenDayCount
    ,(SELECT COUNT(*) FROM "kyc_log" WHERE "createdAt" >= CURRENT_DATE - INTERVAL '30 days' AND "sumsubKycStatus" IN ('FINAL_REJECTED','TEMPORARY_REJECTED') AND "accountType"=:accountType AND "parentId" IS NULL) as lastThirtyDayCount FROM "kyc_log" WHERE "sumsubKycStatus" IN ('FINAL_REJECTED','TEMPORARY_REJECTED') AND "accountType"=:accountType AND "parentId" IS NULL;`;
    try {
      const verifiedUserData: any = await sequelize.query(sqlQuery, {
        type: QueryTypes.SELECT,
        replacements: { accountType: accountType },
      });
      return {
        totalCount: verifiedUserData[0].totalcount,
        lastSevenDayCount: verifiedUserData[0].lastsevendaycount,
        lastThirtyDayCount: verifiedUserData[0].lastthirtydaycount,
      };
    } catch (error) {
      console.log('REJECTED VERIFICATION ERROR', error);
      return false;
    }
  };

  getComplianceApprovedVerification = async (
    accountType: string
  ): Promise<any> => {
    try {
      const searchPayload = {
        sumsubKycStatus: CM.ENUM.KYC_STATUS.APPROVED,
        adminKycStatus: CM.ENUM.KYC_STATUS.APPROVED,
        completedBy: {
          [Op.not]: null,
        },
        accountType: accountType,
      };
      const userApprovedByComplianceCount: any = await KycLogs.count({
        where: searchPayload,
      });
      return userApprovedByComplianceCount;
    } catch (error) {
      console.log('REJECTED VERIFICATION ERROR', error);
      return false;
    }
  };

  findAlert = async (payload: any) => {
    try {
      const kycLogRow = await kycAlerts.findOne({
        where: payload,
        raw: true,
      });
      return kycLogRow;
    } catch (error) {
      console.log('ERROR IN FINDING KYC LOG:', error);
      return false;
    }
  };

  findAllAlerts = async (payload: any): Promise<any> => {
    try {
      const sqlQuery = `SELECT COUNT(*) AS totalCount,(SELECT COUNT(*) FROM "kyc_alerts" WHERE "createdAt" >= CURRENT_DATE - INTERVAL '7 days' AND "accountType"=:accountType) as lastSevenDayCount
    ,(SELECT COUNT(*) FROM "kyc_alerts" WHERE "createdAt" >= CURRENT_DATE - INTERVAL '30 days' AND "accountType"=:accountType) as lastThirtyDayCount FROM "kyc_alerts" WHERE "accountType"=:accountType;`;
      const alertList: any = await sequelize.query(sqlQuery, {
        type: QueryTypes.SELECT,
        replacements: { accountType: payload.accountType },
      });
      return {
        totalCount: alertList[0].totalcount,
        lastSevenDayCount: alertList[0].lastsevendaycount,
        lastThirtyDayCount: alertList[0].lastthirtydaycount,
      };
    } catch (error) {
      console.log('ERROR IN FINDING KYC LOG:', error);
      return false;
    }
  };

  saveRejecteduserAlert = async (kyc_data: any) => {
    try {
      const alertArray = await this.getUserModerationComments(
        kyc_data.applicantId,
        kyc_data.accountType
      );

      if (alertArray) {
        const saveAlertPayload: any = {
          userId: kyc_data.userId,
          alert: alertArray,
          applicantId: kyc_data.applicantId,
          accountType: kyc_data.accountType,
        };
        const searchPayload = {
          userId: kyc_data.userId,
          applicantId: kyc_data.applicantId,
        };
        const isAlertRowExist = await this.findAlert(searchPayload);
        if (isAlertRowExist) {
          await kycAlerts.update(saveAlertPayload, {
            where: searchPayload,
          });
        } else {
          await kycAlerts.create(saveAlertPayload);
        }
      } else {
        console.log('NO REJECTED LOG FOUND');
      }
    } catch (error) {
      console.log('ERROR IN FETCHING REJECTED LOG');
    }
  };

  getVerifiedDocumentDetail = async (userType: string) => {
    try {
      const sqlQuery = `SELECT COUNT(*) as totalApprovedDocuments FROM "kyc_log" as klg 
    LEFT JOIN "kyc_doc" as kdo ON "kdo"."userId" = "klg"."userId" 
    WHERE "klg"."sumsubKycStatus" = 'APPROVED' AND "klg"."accountType" = :accountType ${
      userType === 'BUSINESS' ? '' : 'AND "klg"."parentId" IS NULL'
    }`;

      const lastsevendaysQuery = `SELECT COUNT(*) as lastSevenDayCount FROM "kyc_log" as klg 
    LEFT JOIN "kyc_doc" as kdo ON "kdo"."userId" = "klg"."userId" 
    WHERE "klg"."createdAt" >= CURRENT_DATE - INTERVAL '7 days' AND "klg"."accountType" = :accountType ${
      userType === 'BUSINESS' ? '' : 'AND "klg"."parentId" IS NULL'
    }`;

      const lastThirtyDaysQuery = `SELECT COUNT(*) as lastThirtyDayCount FROM "kyc_log" as klg 
    LEFT JOIN "kyc_doc" as kdo ON "kdo"."userId" = "klg"."userId" 
    WHERE "klg"."createdAt" >= CURRENT_DATE - INTERVAL '30 days' AND "klg"."accountType" = :accountType ${
      userType === 'BUSINESS' ? '' : 'AND "klg"."parentId" IS NULL'
    }`;

      const documentDetail: Array<{
        totalapproveddocuments: string;
      }> = await sequelize.query(sqlQuery, {
        type: QueryTypes.SELECT,
        replacements: { accountType: userType },
      });

      const lastsevenDaysCount: Array<{
        lastsevendaycount: string;
      }> = await sequelize.query(lastsevendaysQuery, {
        type: QueryTypes.SELECT,
        replacements: { accountType: userType },
      });

      const lastThirtyDaysCount: Array<{
        lastthirtydaycount: string;
      }> = await sequelize.query(lastThirtyDaysQuery, {
        type: QueryTypes.SELECT,
        replacements: { accountType: userType },
      });

      return {
        totalCount: documentDetail[0].totalapproveddocuments,
        lastSevenDayCount: lastsevenDaysCount[0].lastsevendaycount,
        lastThirtyDayCount: lastThirtyDaysCount[0].lastthirtydaycount,
      };
    } catch (error) {
      return false;
    }
  };

  getAllAlertsWithFilter = async (
    userType: any,
    offset: number,
    limit: number = 5
  ) => {
    let whereOptions: any = {};
    let count = 0;
    try {
      if (userType) {
        whereOptions.accountType = userType;
      }
      const count = await kycAlerts.count({
        where: whereOptions,
      });

      const response = await kycAlerts.findAll({
        limit: limit,
        offset: offset,
        where: whereOptions,
        order: [['createdAt', 'DESC']],
        raw: true,
      });
      if (response !== null) {
        return { count: count.toString(), rows: response };
      } else {
        return { count: count.toString(), rows: [] };
      }
    } catch (error) {
      console.log('ERROR WHILE FETCHING KYC ALERTS DATA:', error);
      return { count: count.toString(), rows: [] };
    }
  };

  findUserKycLog = async (payload: any): Promise<any> => {
    try {
      const kycLogRow = await KycLogs.findOne({
        where: payload,
        raw: true,
        attributes: [
          'id',
          'userId',
          'applicantId',
          'sumsubKycStatus',
          'nationality',
          'firstName',
          'lastName',
          'phoneNumber',
          'accountType',
          'businessName',
          'brandName',
          'dob',
          'address',
          'registrationNumber',
          'questionairePayload',
          'city',
        ],
      });
      return kycLogRow;
    } catch (error) {
      console.log('ERROR IN FINDING KYC LOG:', error);
      return false;
    }
  };

  findUserUbos = async (parentId: string) => {
    let beneficiaries: Array<Object> = [];
    let beneficiary: Object = {};
    try {
      const ubos = await KycLogs.findAll({
        where: {
          parentId: parentId,
        },
        raw: true,
        order: [['createdAt', 'ASC']],
        attributes: [
          'id',
          'userId',
          'applicantId',
          'sumsubKycStatus',
          'nationality',
          'firstName',
          'lastName',
          'phoneNumber',
          'accountType',
          'businessName',
          'brandName',
          'dob',
          'address',
          'registrationNumber',
          'questionairePayload',
          'city',
        ],
      });

      for (let kycProfile of ubos) {
        let moderationComment: any = [];
        const kycDocs = await KycDoc.findAll({
          where: { kycId: kycProfile.id, userId: kycProfile.userId },
        });
        if (
          [
            CM.ENUM.KYC_STATUS.FINAL_REJECTED,
            CM.ENUM.KYC_STATUS.TEMPORARY_REJECTED,
          ].includes(kycProfile.sumsubKycStatus)
        ) {
          moderationComment = await this.getUserModerationComments(
            kycProfile.applicantId,
            kycProfile.accountType
          );
        }
        beneficiary = {
          ...kycProfile,
          individualDocs: kycDocs || [],
          moderationComment: moderationComment || '',
        };
        beneficiaries.push(beneficiary);
      }
      return beneficiaries;
    } catch (error) {
      console.log('ERROR FETCHING UBOS', error);
      return false;
    }
  };

  getKycInfoObject = async (userId: string) => {
    try {
      let moderationcomment: any = [];
      const kycInfo = await this.findUserKycLog({ userId: userId });

      if (kycInfo) {
        const kycDocs = await this.findAllKycDocument({
          userId: userId,
          txnId: null,
        });
        const ubos = await this.findUserUbos(kycInfo.applicantId);

        if (
          [
            CM.ENUM.KYC_STATUS.FINAL_REJECTED,
            CM.ENUM.KYC_STATUS.TEMPORARY_REJECTED,
          ].includes(kycInfo.sumsubKycStatus)
        ) {
          moderationcomment = await this.getUserModerationComments(
            kycInfo.applicantId,
            kycInfo?.accountType
          );
        }

        kycInfo.moderationcomment = moderationcomment;

        return {
          kycProfile: kycInfo,
          docs: kycDocs,
          ubos: ubos,
        };
      } else {
        console.log('KYC NOT FOUND ', userId);
        return false;
      }
    } catch (error) {
      console.error('ERROR IN KYC LOG FETCH ', error);
      throw error;
    }
  };
}

export default new KycHelper();
