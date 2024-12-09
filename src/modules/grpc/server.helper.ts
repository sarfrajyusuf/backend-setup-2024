import * as Helpers from '../../helpers';
import {
  GRPC,
  ENUM,
  PAGINATION,
  MIDDLEWARE_RESPONSE,
  USER_ALL_STATUS,
  KAFKA,
  TXN_OTP_EXPIRE_TIME,
  envAlias,
} from '../../constant/response';
import { status } from '@grpc/grpc-js';
import * as SpeakEasy from 'speakeasy';
import * as Model from '../../models';
import * as moment from 'moment';
import { getTokenAuth } from '../../middlewares';
import {
  UPDATE_SUPPORT_TICKET_STATUS_PAYLOAD,
  GRPC_SEARCH_USER_ROW_PAYLOAD,
  GRPC_UPDATE_USER_ROW_PAYLOAD,
  FIND_ALL_USER_ROW_PAYLOAD,
  GET_OTP_ROW_PAYLOAD,
  DESTROY_OTP_PAYLOAD,
  DESTROY_USER_SESSION_PAYLOAD,
  GET_USER_COUNTS_PAYLOAD,
  UPDATE_KYC_STATUS_PAYLOAD,
  BLOCK_UNBLOCK_USER_PAYLOAD,
  GET_FCM_TOKEN_PAYLOAD,
  VERIFY_TRANSACTION_OTP_PAYLOAD,
  UPDATE_USER_KYC_STATUS_PAYLOAD,
} from './grpc.interface';
import userHelper from '../user/user.helper';
import {
  GenericError,
  GetCommonResponse,
} from 'interfaces/responses.interface';
// import kafkaProducer from '../kafka/kafka.producer';
import kycHelper from '../../modules/kyc/kyc.helper';
import * as CM from '../../constant/response';
import clientHelper from './client.helper';
import { Op } from 'sequelize';
import { getTxnDetailFromSumsub } from '../../helpers/sumsub.helper';
import { VERIFICATION_PAYLOAD } from './grpc.interface';
// import { deleteGoogleImage } from '../../helpers/s3Client.helper';

class UserServiceHelper {
  getCountryList = async (call: any, callback: any) => {
    try {
      console.log('GRPC GET COUNTRY LIST ');
      let commonResponse: GetCommonResponse;
      let responsePayload;
      const userRow: any = await Model.User.findAll({
        where: { nationality: { [Model.Op.not]: 'null' } },
        attributes: [
          [
            Model.sequelize.fn(
              'DISTINCT',
              Model.sequelize.fn('LOWER', Model.sequelize.col('nationality'))
            ),
            'nationality',
          ],
        ],
        order: [['nationality', 'ASC']],
        raw: true,
      });

      if (userRow && userRow.length) {
        const coutryList = userRow.map((item: any) => item.nationality);
        commonResponse = {
          message: GRPC.GRPC_RESPONSE.MESSAGE.SUCCESS.SUCCESS,
          data: { list: coutryList },
        };
      } else {
        commonResponse = {
          message: GRPC.GRPC_RESPONSE.MESSAGE.SUCCESS.SUCCESS,
          data: { list: [] },
        };
      }
      responsePayload = Helpers.ResponseHelper.grpcSuccess(commonResponse);
      console.log('GRPC GET COUNTRY LIST RESPONSE PAYLOAD::', responsePayload);
      callback(null, responsePayload);
    } catch (error) {
      console.log('ERROR IN GRPC GET COUNTRY LIST ::', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  getUsers = async (call: any, callback: any) => {
    try {
      console.log('GRPC GET ALL USER REQUEST PAYLOAD::', call.request);
      let commonResponse: GetCommonResponse;
      const { limit, offset, filter } = call.request;
      const andConditions = [];
      if (filter) {
        if (filter.nationality) {
          andConditions.push({
            nationality: { [Model.Op.iLike]: filter.nationality },
          });
        }
        if (filter.userType) {
          const userType = GRPC.GRPC_USER_TYPE[filter.userType - 1];
          andConditions.push({ accountType: userType });
        }

        if (
          filter.verification &&
          [
            ENUM.KYC_STATUS.APPROVED,
            ENUM.KYC_STATUS.REJECTED,
            ENUM.KYC_STATUS.PENDING,
          ].includes(filter.verification)
        ) {
          andConditions.push({ adminKycStatus: filter.verification });
        }

        if (filter.status) {
          const statusCondition = {};

          if (filter.status === 'INACTIVE' || filter.status === 'ACTIVE') {
            Object.assign(statusCondition, { status: filter.status });
          }

          if (filter.status === 'BLOCKED') {
            Object.assign(statusCondition, {
              isBlocked: true,
              isDeleted: false,
            });
          }

          if (filter.status === 'DELETED') {
            Object.assign(statusCondition, { isDeleted: true });
          }

          andConditions.push(statusCondition);
        }

        if (filter.search) {
          const searchFields = [
            'firstName',
            'lastName',
            'email',
            'uidString',
            'brandName',
            'businessName',
          ];

          const searchConditionString = {
            [Model.Op.iLike]: `%${filter.search}%`,
          };
          const searchConditions: any = searchFields.map((f) => ({
            [f]: searchConditionString,
          }));

          searchConditions.push(
            Model.sequelize.literal(
              `"userId"::varchar ILIKE '%${filter.search}%'`
            )
          );
          const idValue = Number(filter.search);
          if (idValue) {
            // @ts-ignore
            searchConditions.push({ id: idValue });
          }
          andConditions.push({ [Model.Op.or]: searchConditions });
        }

        if (filter.startDate && filter.endDate) {
          andConditions.push({
            [Model.Op.and]: [
              {
                createdAt: {
                  [Model.Op.gte]: moment(
                    filter.startDate,
                    'YYYY/MM/DD'
                  ).toDate(),
                },
              },
              {
                createdAt: {
                  [Model.Op.lte]: moment(filter.endDate, 'YYYY/MM/DD')
                    .add(1, 'day')
                    .toDate(),
                },
              },
            ],
          });
        } else {
          if (filter.startDate) {
            andConditions.push({
              createdAt: {
                [Model.Op.gte]: moment(filter.startDate, 'YYYY/MM/DD').toDate(),
              },
            });
          }
          if (filter.endDate) {
            andConditions.push({
              createdAt: {
                [Model.Op.lte]: moment(filter.endDate, 'YYYY/MM/DD')
                  .add(1, 'day')
                  .toDate(),
              },
            });
          }
        }
      }

      const userRow = await this.getAllUserRow(
        { [Model.Op.and]: andConditions },
        limit,
        offset
      );
      let responsePayload;
      if (userRow && userRow.list.length) {
        commonResponse = {
          message: GRPC.GRPC_RESPONSE.MESSAGE.SUCCESS.SUCCESS,
          data: { list: userRow.list, totalCount: `${userRow.userRowCount}` },
        };
      } else {
        commonResponse = {
          message: GRPC.GRPC_RESPONSE.MESSAGE.SUCCESS.SUCCESS,
          data: { list: [], totalCount: '0' },
        };
      }
      responsePayload = Helpers.ResponseHelper.grpcSuccess(commonResponse);
      console.log('GRPC GET ALL USER RESPONSE PAYLOAD::', responsePayload);
      callback(null, responsePayload);
    } catch (error) {
      console.log('ERROR IN GRPC GET ALL USER ::', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  getUserDetails = async (call: any, callback: any) => {
    try {
      console.log('GRPC GET USER DETAILS REQUEST PAYLOAD::', call.request);
      const { userId } = call.request;
      let response: GetCommonResponse;
      const attributes = [
        'id',
        'userId',
        'email',
        'firstName',
        'lastName',
        'nationality',
        'accountType',
        'address',
        'city',
        'postalCode',
        'phoneNumber',
        'dateOfBirth',
        'businessName',
        'brandName',
        'incorporationDate',
        'companyType',
        'taxVatId',
        'clientId',
        'status',
        'isEmailVerified',
        'isBlocked',
        'reasonToBlockUser',
        'fiatInternalTxnStatus',
        'fiatWithdrawStatus',
        'cryptoInternalTxnStatus',
        'cryptoWithdrawStatus',
        'swapStatus',
        'auth2FaStatus',
        'uidString',
        'userKycStatus',
        'adminKycStatus',
        'isDeleted',
        'isReferee',
        'createdAt',
        'updatedAt',
      ];
      const userRow = await this.getUserRow({ userId: userId }, attributes);

      let responsePayload;
      if (userRow) {
        const userDetail = {
          id: userRow.id,
          userId: userRow.userId,
          email: userRow.email,
          firstName: userRow.firstName ? userRow.firstName : '',
          lastName: userRow.lastName ? userRow.lastName : '',
          nationality: userRow.nationality ? userRow.nationality : '',
          accountType: userRow.accountType ? userRow.accountType : '',
          address: userRow.address ? userRow.address : '',
          city: userRow.city ? userRow.city : '',
          postalCode: userRow.postalCode ? userRow.postalCode : '',
          phoneNumber: userRow.phoneNumber ? userRow.phoneNumber : '',
          dateOfBirth: userRow.dateOfBirth ? userRow.dateOfBirth : '',
          businessName: userRow.businessName ? userRow.businessName : '',
          brandName: userRow.brandName ? userRow.brandName : '',
          incorporationDate: userRow.incorporationDate
            ? userRow.incorporationDate
            : '',
          companyType: userRow.companyType ? userRow.companyType : '',
          taxVatId: userRow.taxVatId ? userRow.taxVatId : '',
          clientId: userRow.clientId ? userRow.clientId : '',
          status: userRow.status,
          isEmailVerified: userRow.isEmailVerified,
          isBlocked: userRow.isBlocked,
          reasonToBlockUser: userRow.reasonToBlockUser
            ? userRow.reasonToBlockUser
            : '',
          fiatInternalTxnStatus: userRow.fiatInternalTxnStatus,
          fiatWithdrawStatus: userRow.fiatWithdrawStatus,
          cryptoInternalTxnStatus: userRow.cryptoInternalTxnStatus,
          cryptoWithdrawStatus: userRow.cryptoWithdrawStatus,
          swapStatus: userRow.swapStatus,
          auth2FaStatus: userRow.auth2FaStatus,
          uidString: userRow.uidString ? userRow.uidString : '',
          userKycStatus: userRow.userKycStatus,
          adminKycStatus: userRow.adminKycStatus,
          isDeleted: userRow.isDeleted,
          isReferee: userRow.isReferee,
          createdAt: userRow.createdAt,
          updatedAt: userRow.updatedAt,
        };
        response = {
          message: GRPC.GRPC_RESPONSE.MESSAGE.SUCCESS.SUCCESS,
          data: userDetail,
        };
      } else {
        response = {
          message: GRPC.GRPC_RESPONSE.MESSAGE.SUCCESS.SUCCESS,
          data: {},
        };
      }
      responsePayload = Helpers.ResponseHelper.grpcSuccess(response);
      console.log('GRPC GET USER DETAILS RESPONSE PAYLOAD::', responsePayload);
      callback(null, responsePayload);
    } catch (error) {
      console.log('ERROR IN GRPC GET USER DETAILS ::', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  getUserDetailByClientId = async (call: any, callback: any) => {
    try {
      console.log(
        'GRPC GET USER DETAIL BY CLIENT ID REQUEST PAYLOAD::',
        call.request
      );
      const { clientId } = call.request;
      let response: GetCommonResponse;
      let responsePayload;
      if (clientId) {
        const attributes = ['userId', 'email'];
        const userRow = await this.getUserRow(
          {
            clientId: clientId,
            status: ENUM.USER_STATUS.ACTIVE,
            isDeleted: false,
            isEmailVerified: true,
            isBlocked: false,
          },
          attributes
        );
        console.log('USER ROW::', userRow);
        if (userRow) {
          response = {
            message: GRPC.GRPC_RESPONSE.MESSAGE.SUCCESS.SUCCESS,
            data: { userId: userRow.userId, email: userRow.email },
          };
        } else {
          throw {
            field: GRPC.GRPC_RESPONSE.FIELD.ERROR,
            message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.INVALID_REQUEST,
          };
        }
      } else {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.ERROR,
          message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.INVALID_REQUEST,
        };
      }
      responsePayload = Helpers.ResponseHelper.grpcSuccess(response);
      console.log(
        'GRPC USER DETAIL BY CLIENT ID RESPONSE PAYLOAD::',
        responsePayload
      );
      callback(null, responsePayload);
    } catch (error) {
      console.log('ERROR IN GRPC USER DETAIL BY CLIENT ID::', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  getUserByClientId = async (call: any, callback: any) => {
    try {
      console.log('GRPC GET USER BY CLIENT ID REQUEST PAYLOAD::', call.request);
      const { clientId } = call.request;
      let response: GetCommonResponse;
      let responsePayload;
      if (clientId) {
        const attributes = [
          'id',
          'userId',
          'email',
          'firstName',
          'lastName',
          'nationality',
          'accountType',
          'address',
          'city',
          'postalCode',
          'phoneNumber',
          'dateOfBirth',
          'businessName',
          'brandName',
          'incorporationDate',
          'companyType',
          'taxVatId',
          'clientId',
          'status',
          'isEmailVerified',
          'isBlocked',
          'reasonToBlockUser',
          'fiatInternalTxnStatus',
          'fiatWithdrawStatus',
          'cryptoInternalTxnStatus',
          'cryptoWithdrawStatus',
          'swapStatus',
          'auth2FaStatus',
          'uidString',
          'userKycStatus',
          'adminKycStatus',
          'isDeleted',
          'createdAt',
          'updatedAt',
        ];
        const userRow = await this.getUserRow(
          {
            clientId: clientId,
          },
          attributes
        );
        console.log('USER ROW::', userRow);
        if (userRow) {
          response = {
            message: GRPC.GRPC_RESPONSE.MESSAGE.SUCCESS.SUCCESS,
            data: { userId: userRow.userId, email: userRow.email },
          };
        } else {
          throw {
            field: GRPC.GRPC_RESPONSE.FIELD.ERROR,
            message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.INVALID_REQUEST,
          };
        }
      } else {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.ERROR,
          message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.INVALID_REQUEST,
        };
      }
      responsePayload = Helpers.ResponseHelper.grpcSuccess(response);
      console.log('GRPC USER BY CLIENT ID RESPONSE PAYLOAD::', responsePayload);
      callback(null, responsePayload);
    } catch (error) {
      console.log('ERROR IN GRPC USER BY CLIENT ID::', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  isUserSessionExist = async (call: any, callback: any) => {
    try {
      console.log('GRPC IS USER SESSION EXIST REQUEST PAYLOAD::', call.request);

      let response: GetCommonResponse;
      let responsePayload;
      const token = call.metadata.getMap().token;
      if (!token) {
        throw {
          field: MIDDLEWARE_RESPONSE.JWT_MUST_PROVIDED,
          message: MIDDLEWARE_RESPONSE.JWT_MUST_PROVIDED,
        };
      }
      const tokenData: { error: boolean; userId: string } = await getTokenAuth(
        token
      );
      if (tokenData.error) {
        throw {
          field: MIDDLEWARE_RESPONSE.JWT_MUST_PROVIDED,
          message: MIDDLEWARE_RESPONSE.JWTERROR,
        };
      }
      const userId: string = tokenData.userId;
      const userDetail = await Model.User.findOne({
        where: {
          userId: userId,
          isDeleted: false,
          isBlocked: false,
          isEmailVerified: true,
          status: ENUM.USER_STATUS.ACTIVE,
          userKycStatus: ENUM.KYC_STATUS.APPROVED,
          adminKycStatus: ENUM.KYC_STATUS.APPROVED,
        },
        raw: true,
      });

      if (!userDetail) {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.USER_NOT_VERIFIED,
          message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.INACTIVE_USER,
        };
      }
      const userSessionRowCount: number = await Model.UserSession.count({
        where: { accessToken: token, userId: userId },
      });
      console.log('USER SESSION ROW COUNT::', userSessionRowCount);
      if (userSessionRowCount > 0) {
        response = {
          message: GRPC.GRPC_RESPONSE.MESSAGE.SUCCESS.SUCCESS,
          data: { isUserSessionExist: true },
        };
      } else {
        response = {
          message: GRPC.GRPC_RESPONSE.MESSAGE.SUCCESS.SUCCESS,
          data: { isUserSessionExist: false },
        };
      }
      responsePayload = Helpers.ResponseHelper.grpcSuccess(response);
      console.log(
        'GRPC IS USER SESSION EXIST RESPONSE PAYLOAD::',
        responsePayload
      );
      callback(null, responsePayload);
    } catch (error) {
      console.log('ERROR IN IS USER SESSION EXIST::', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  getSupportTickets = async (call: any, callback: any) => {
    try {
      console.log('GRPC SUPPORT TICKETS REQUEST PAYLOAD::', call.request);
      const { limit, offset, status } = call.request;
      let response: GetCommonResponse;
      let responsePayload;
      const limits = limit ? Number(limit) : Number(PAGINATION.LIMIT_VALUE);
      const offsets = offset ? Number(offset) : Number(PAGINATION.OFFSET_VALUE);
      let wheres = {};
      if (status) {
        wheres = {
          status: {
            [Model.Op.in]:
              status == ENUM.SUPPORT_TICKET_STATUS.PENDIND
                ? [
                    ENUM.SUPPORT_TICKET_STATUS.PENDIND,
                    ENUM.SUPPORT_TICKET_STATUS.RE_OPEN,
                  ]
                : [status.toUpperCase()],
          },
        };
      }
      const supportTickets = await Model.SupportTickets.findAll({
        where: wheres,
        limit: limits,
        offset: offsets,
        raw: true,
        order: [['updatedAt', 'DESC']],
      });

      console.log('SUPPORT TICKETS::', supportTickets);
      if (supportTickets.length > 0) {
        const totalSupporTicketsCount: number =
          await Model.SupportTickets.count({ where: wheres });
        response = {
          message: GRPC.GRPC_RESPONSE.MESSAGE.SUCCESS.SUCCESS,
          data: { list: supportTickets, totalCount: totalSupporTicketsCount },
        };
      } else {
        response = {
          message: GRPC.GRPC_RESPONSE.MESSAGE.SUCCESS.SUCCESS,
          data: { list: [], totalCount: 0 },
        };
      }
      responsePayload = Helpers.ResponseHelper.grpcSuccess(response);
      console.log('GRPC SUPPORT TICKETS RESPONSE PAYLOAD::', responsePayload);
      callback(null, responsePayload);
    } catch (error) {
      console.log('ERROR IN GET SUPPORT TICKETS::', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  updateSupportTicketStatus = async (call: any, callback: any) => {
    try {
      console.log('GRPC SUPPORT TICKETS REQUEST PAYLOAD::', call.request);
      const { ticketId, status, comment } = call.request;
      let response: GetCommonResponse;
      let responsePayload;

      if (
        !ticketId ||
        ![
          ENUM.SUPPORT_TICKET_STATUS.RESOLVED,
          ENUM.SUPPORT_TICKET_STATUS.PENDIND,
          ENUM.SUPPORT_TICKET_STATUS.IN_REVIEW,
          ENUM.SUPPORT_TICKET_STATUS.RE_OPEN,
        ].includes(status.toUpperCase())
      ) {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.ERROR,
          message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.INVALID_REQUEST,
        };
      }
      const supportTicketRow = await Model.SupportTickets.findOne({
        where: { ticketId: ticketId },
        raw: true,
      });
      if (!supportTicketRow) {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.ERROR,
          message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.NO_RECORD_FOUND,
        };
      }
      let updateSupportTicketStatusPayload: UPDATE_SUPPORT_TICKET_STATUS_PAYLOAD =
        {
          status: status.toUpperCase(),
          comments: comment ? comment : supportTicketRow.comments,
        };
      if (status === ENUM.SUPPORT_TICKET_STATUS.RESOLVED) {
        updateSupportTicketStatusPayload.resolvedAt = new Date().toISOString();
        console.log('RESOLVED AT::', updateSupportTicketStatusPayload);
      }
      const isRecordUpdated = await Model.SupportTickets.update(
        {
          status: status.toUpperCase(),
          comments: comment ? comment : supportTicketRow.comments,
          resolvedAt:
            status === ENUM.SUPPORT_TICKET_STATUS.RESOLVED
              ? updateSupportTicketStatusPayload.resolvedAt
              : '',
        },
        { where: { ticketId: ticketId } }
      );

      console.log('IS SUPPORT TICKET STATUS UPDATED::', isRecordUpdated);
      if (isRecordUpdated[0] == 1) {
        response = {
          message: GRPC.GRPC_RESPONSE.MESSAGE.SUCCESS.SUCCESS,
          data: {},
        };

        if (status === ENUM.SUPPORT_TICKET_STATUS.RESOLVED) {
          const pushNotificationPayload = {
            topicName: KAFKA.COMMON_TOPICS.USER_ALERT_NOTIFICATIONS,
            code: KAFKA.NOTIFICATION_CODES.SUPPORT_TICKET,
            type: KAFKA.NOTIFICATION_TYPES.NOTIFICATION,
            data: {
              userId: supportTicketRow.userId,
              ticketId: supportTicketRow.ticketId,
            },
          };
          // uncomment it
          // await this.sendPushNotification(pushNotificationPayload);
        }
        responsePayload = Helpers.ResponseHelper.grpcSuccess(response);
        console.log(
          'GRPC UPDATE SUPPORT TICKETS STATUS RESPONSE PAYLOAD::',
          responsePayload
        );
        callback(null, responsePayload);
      } else {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.SUPPORT_TICKET,
          message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.RECORD_NOT_UPDATED,
        };
      }
    } catch (error) {
      console.log('ERROR IN UPDATE SUPPORT TICKETS::', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  getTxnStatusByKey = async (call: any, callback: any) => {
    try {
      console.log('GRPC GET USER DETAILS REQUEST PAYLOAD::', call.request);
      const { keyName } = call.request;
      console.log('KEY NAME::', keyName);
      const token = call.metadata.getMap().token;
      console.log('TOKENNN', call.metadata);
      const tokenData: { error: boolean; userId: string } = await getTokenAuth(
        token
      );
      if (tokenData.error) {
        throw {
          field: MIDDLEWARE_RESPONSE.FIELDS.JWT_REQUIRED,
          message: MIDDLEWARE_RESPONSE.JWT_MUST_PROVIDED,
        };
      }

      const userId: string = tokenData.userId;

      let response: GetCommonResponse;
      const attributes = [keyName];

      if (!USER_ALL_STATUS.includes(keyName)) {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.INVALID_REQUEST,
          message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.INVALID_REQUEST,
        };
      }
      const userRow: any = await this.getUserRow(
        {
          userId: userId,
          status: ENUM.USER_STATUS.ACTIVE,
          isDeleted: false,
          isEmailVerified: true,
          isBlocked: false,
        },
        attributes
      );
      let responsePayload;
      if (userRow) {
        response = {
          message: GRPC.GRPC_RESPONSE.MESSAGE.SUCCESS.SUCCESS,
          data: { status: userRow[keyName] },
        };
      } else {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.INVALID_REQUEST,
          message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.INVALID_REQUEST,
        };
      }
      responsePayload = Helpers.ResponseHelper.grpcSuccess(response);
      console.log(
        'GRPC GET KEY VALUE BY KEY NAME RESPONSE PAYLOAD::',
        responsePayload
      );
      callback(null, responsePayload);
    } catch (error) {
      console.log('ERROR IN GRPC GET KEY VALUE ::', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  getUserInfo = async (call: any, callback: any) => {
    try {
      console.log('GRPC GET USER INFO REQUEST PAYLOAD::', call.request);
      const { userId } = call.request;
      const attributes = [
        'userId',
        'accountType',
        'email',
        'nationality',
        'firstName',
        'lastName',
        'phoneNumber',
        'businessName',
        'brandName',
        'incorporationDate',
        'companyType',
        'taxVatId',
      ];

      const userRow = await this.getUserRow({ userId: userId }, attributes);
      let responsePayload;
      if (userRow) {
        const userDetail = {
          userId: userRow.userId == null ? '' : userRow.userId,
          accountType: userRow.accountType == null ? '' : userRow.accountType,
          email: userRow.email == null ? '' : userRow.email,
          nationality: userRow.nationality == null ? '' : userRow.nationality,
          firstName: userRow.firstName == null ? '' : userRow.firstName,
          lastName: userRow.lastName == null ? '' : userRow.lastName,
          phoneNumber: userRow.phoneNumber == null ? '' : userRow.phoneNumber,
          businessName:
            userRow.businessName == null ? '' : userRow.businessName,
          brandName: userRow.brandName == null ? '' : userRow.brandName,
          incorporationDate:
            userRow.incorporationDate == null ? '' : userRow.incorporationDate,
          companyType: userRow.companyType == null ? '' : userRow.companyType,
          taxVatId: userRow.taxVatId == null ? '' : userRow.taxVatId,
        };
        const response = {
          message: GRPC.GRPC_RESPONSE.MESSAGE.SUCCESS.SUCCESS,
          data: userDetail,
        };
        responsePayload = Helpers.ResponseHelper.grpcSuccess(response);
        console.log('GRPC GET USER INFO RESPONSE PAYLOAD::', responsePayload);
        callback(null, responsePayload);
      } else {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.USERS,
          message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.ERROR,
        };
      }
    } catch (error) {
      console.log('ERROR IN GRPC GET USER INFO ::', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  getUserCounts = async (call: any, callback: any) => {
    try {
      console.log('GRPC GET USER INFO REQUEST PAYLOAD::', call.request);
      const query = `SELECT COUNT(*) AS totalUserCount,
(SELECT COUNT(*) FROM "user" WHERE "createdAt" >= CURRENT_DATE - INTERVAL '7 days') as lastSevenDayUserCount,
(SELECT COUNT(*) FROM "user" WHERE "createdAt" >= CURRENT_DATE - INTERVAL '30 days') as lastThirtyDayUserCount,
(SELECT COUNT(*) FROM "user" WHERE "accountType" = 'INDIVIDUAL') as individualUserCount,
(SELECT COUNT(*) FROM "user" WHERE "accountType" = 'BUSINESS') as businessUserCount,
(SELECT COUNT(*) FROM "user" WHERE "adminKycStatus" = 'APPROVED' AND "userKycStatus" = 'APPROVED') as totalVerifiedUserCount
FROM "user";`;
      const result: Array<GET_USER_COUNTS_PAYLOAD> =
        await Model.sequelize.query(query, {
          type: Model.QueryTypes.SELECT,
        });
      console.log('USER COUNTS QUERY RESULT::', result);
      let responsePayload;
      if (result.length) {
        const userCount: GET_USER_COUNTS_PAYLOAD = result[0];

        console.log('USER COUNT::', userCount);
        const userCountsPayload = {
          totalUserCount: `${userCount?.totalusercount}`,
          totalIndividualUserCount: `${userCount?.individualusercount}`,
          totalBusinessUserCount: `${userCount?.businessusercount}`,
          lastSevenDaysUserCount: `${userCount?.lastsevendayusercount}`,
          lastThirtyDaysUserCount: `${userCount?.lastthirtydayusercount}`,
          totalVerifiedUserCount: `${userCount?.totalverifiedusercount}`,
        };
        console.log('USER COUNTS PAYLOADD:::', userCountsPayload);
        const response = {
          message: GRPC.GRPC_RESPONSE.MESSAGE.SUCCESS.SUCCESS,
          data: userCountsPayload,
        };
        responsePayload = Helpers.ResponseHelper.grpcSuccess(response);
        console.log('GRPC GET USER COUNTS RESPONSE PAYLOAD::', responsePayload);
        callback(null, responsePayload);
      } else {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.USERS,
          message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.ERROR,
        };
      }
    } catch (error) {
      console.log('ERROR IN GRPC GET USER COUNTS ::', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  blockUnblockUser = async (call: any, callback: any) => {
    try {
      console.log('GRPC BLOCK UNBLOCK USER REQUEST PAYLOAD::', call.request);
      const { userId, status, reason } = call.request;

      if (!status) {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.USERS,
          message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.INVALID_STATUS,
        };
      }

      let updateUserPayload: BLOCK_UNBLOCK_USER_PAYLOAD;
      if (status === 2) {
        updateUserPayload = {
          isBlocked: true,
          status: ENUM.USER_STATUS.INACTIVE,
        };
      } else {
        updateUserPayload = {
          isBlocked: false,
          status: ENUM.USER_STATUS.ACTIVE,
        };
      }
      if (reason) {
        updateUserPayload.reasonToBlockUser = reason;
      }
      const isUserStatusUpdated: boolean = await this.updateUserRow(
        { userId: userId },
        updateUserPayload
      );
      let responsePayload: GetCommonResponse;
      if (isUserStatusUpdated) {
        if (updateUserPayload.isBlocked) {
          await this.destroyUserSession({ userId: userId });
        }
        const response = {
          message: GRPC.GRPC_RESPONSE.MESSAGE.SUCCESS.RECORD_UPDATED,
          data: {
            currentStatus: updateUserPayload.isBlocked
              ? ENUM.USER_STATUS.INACTIVE
              : ENUM.USER_STATUS.ACTIVE,
          },
        };
        responsePayload = Helpers.ResponseHelper.grpcSuccess(response);
        console.log(
          'GRPC BLOCK UNBLOCK USER RESPONSE PAYLOAD::',
          responsePayload
        );
        callback(null, responsePayload);
      } else {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.USERS,
          message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.RECORD_NOT_UPDATED,
        };
      }
    } catch (error) {
      console.log('ERROR IN GRPC BLOCK UNBLOCK ::', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  updateUserKycStatus = async (call: any, callback: any) => {
    try {
      console.log(
        'GRPC UPDATE USER KYC STATUS REQUEST PAYLOAD::',
        call.request
      );

      const { userId, userKycStatus } = call.request;
      let responsePayload: GetCommonResponse;
      if (!userKycStatus) {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.KYC_STATUS,
          message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.INVALID_KYC_STATUS,
        };
      }

      const kycStatus: string = GRPC.GRPC_USER_KYC_STATUS[userKycStatus - 1];
      console.log('KYC STATUS::', kycStatus);
      let updateUserPayload: UPDATE_USER_KYC_STATUS_PAYLOAD = {
        userKycStatus: kycStatus,
      };

      const userRow = await this.getUserRow({ userId: userId }, []);
      console.log('USER ROW::', userRow);
      if (!userRow) {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.ERROR,
          message:
            GRPC.GRPC_RESPONSE.MESSAGE.ERROR.ERROR_IN_PERFORMING_OPERATION,
        };
      }
      if (kycStatus === ENUM.KYC_STATUS.APPROVED) {
        const uidString = await this.getUidString(userId, userRow);
        console.log('UID STRING::', uidString);
        if (uidString) {
          updateUserPayload.uidString = uidString;
        } else {
          throw {
            field: GRPC.GRPC_RESPONSE.FIELD.ERROR,
            message:
              GRPC.GRPC_RESPONSE.MESSAGE.ERROR.ERROR_IN_PERFORMING_OPERATION,
          };
        }
      }
      if (
        userRow.accountType === ENUM.ACCOUNT_TYPE.BUSINESS &&
        kycStatus === ENUM.KYC_STATUS.PENDING &&
        call.request.businessDetail
      ) {
        console.log('INSIDE BUSINESS DETAIL::');
        const businessDetail = call.request.businessDetail;
        updateUserPayload.businessName = businessDetail.businessName
          ? businessDetail.businessName
          : '';
        updateUserPayload.brandName = businessDetail.brandName
          ? businessDetail.brandName
          : '';
        updateUserPayload.incorporationDate = businessDetail.incorporationDate
          ? businessDetail.incorporationDate
          : '';
        updateUserPayload.companyType = businessDetail.companyType
          ? businessDetail.companyType
          : '';
        updateUserPayload.taxVatId = businessDetail.taxVatId
          ? businessDetail.taxVatId
          : '';
      }
      console.log(
        'USER KYC STATUS::',
        kycStatus,
        'UPDATE USER PAYLOAD::',
        updateUserPayload
      );
      const isUserRowUpdated: boolean = await this.updateUserRow(
        { userId: userId },
        updateUserPayload
      );
      if (isUserRowUpdated) {
        const response = {
          message: GRPC.GRPC_RESPONSE.MESSAGE.SUCCESS.SUCCESS,
          data: {},
        };
        responsePayload = Helpers.ResponseHelper.grpcSuccess(response);
        console.log(
          'GRPC UPDATE USER KYC STATUS RESPONSE PAYLOAD::',
          responsePayload
        );
        callback(null, responsePayload);
      } else {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.ERROR,
          message:
            GRPC.GRPC_RESPONSE.MESSAGE.ERROR.ERROR_IN_PERFORMING_OPERATION,
        };
      }
    } catch (error) {
      console.log('ERROR IN GRPC UPDATE USER KYC STATUS ::', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  getUidString = async (userId: string, userRow: any) => {
    try {
      if (userRow && userRow.phoneNumber) {
        let uidString = '';
        const phoneNumberSubString = userRow.phoneNumber.substring(
          userRow.phoneNumber.length - 5,
          userRow.phoneNumber.length
        );
        const randomString: string = await Helpers.utilitiesHelper
          .generateRandomString(12)
          .toUpperCase();
        if (userRow.accountType === ENUM.ACCOUNT_TYPE.BUSINESS) {
          let businessNameSubString =
            await Helpers.utilitiesHelper.generateRandomString(3);
          if (userRow.businessName) {
            businessNameSubString = userRow.businessName.substring(0, 3);
          }
          uidString =
            businessNameSubString.toUpperCase() +
            phoneNumberSubString +
            randomString;
        } else if (
          userRow.accountType === ENUM.ACCOUNT_TYPE.INDIVIDUAL &&
          userRow.firstName
        ) {
          uidString =
            userRow.firstName.substring(0, 3).toUpperCase() +
            phoneNumberSubString +
            randomString;
        }
        return uidString;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  updateUserTxnStatus = async (call: any, callback: any) => {
    try {
      console.log(
        'GRPC UPDATE USER TRANSACTION STATUS REQUEST PAYLOAD::',
        call.request
      );

      const { userId, statusType, status } = call.request;

      let responsePayload: GetCommonResponse;
      if (![ENUM.TFA_STATUS.ENABLE, ENUM.TFA_STATUS.DISABLE].includes(status)) {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.KYC_STATUS,
          message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.INVALID_STATUS,
        };
      }

      if (
        ![
          ENUM.USER_TXN_STATUS.AUTH_2FA,
          ENUM.USER_TXN_STATUS.CRYPTO_INTERNAL_TRANSFER,
          ENUM.USER_TXN_STATUS.CRYPTO_WITHDRAW,
          ENUM.USER_TXN_STATUS.FIAT_INTERNAL_TRANSFER,
          ENUM.USER_TXN_STATUS.FIAT_WITHDRAW,
          ENUM.USER_TXN_STATUS.SWAP,
        ].includes(statusType)
      ) {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.KYC_STATUS,
          message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.INVALID_STATUS_TYPE,
        };
      }

      let txnStatus = false;
      if (status === ENUM.TFA_STATUS.ENABLE) {
        txnStatus = true;
      }

      let updateStatusPayload = {};
      switch (statusType) {
        case ENUM.USER_TXN_STATUS.AUTH_2FA:
          updateStatusPayload = { auth2FaStatus: txnStatus };
          break;
        case ENUM.USER_TXN_STATUS.CRYPTO_INTERNAL_TRANSFER:
          updateStatusPayload = { cryptoInternalTxnStatus: txnStatus };
          break;
        case ENUM.USER_TXN_STATUS.CRYPTO_WITHDRAW:
          updateStatusPayload = { cryptoWithdrawStatus: txnStatus };
          break;
        case ENUM.USER_TXN_STATUS.FIAT_INTERNAL_TRANSFER:
          updateStatusPayload = { fiatInternalTxnStatus: txnStatus };
          break;
        case ENUM.USER_TXN_STATUS.FIAT_WITHDRAW:
          updateStatusPayload = { fiatWithdrawStatus: txnStatus };
          break;
        case ENUM.USER_TXN_STATUS.SWAP:
          updateStatusPayload = { swapStatus: txnStatus };
          break;
      }

      console.log('UPDATE STATUS PAYLOAD::', updateStatusPayload);

      const isUserRowUpdated: boolean = await this.updateUserRow(
        { userId: userId },
        updateStatusPayload
      );

      console.log('IS USER ROW UPDATED::', isUserRowUpdated);
      if (isUserRowUpdated) {
        const response = {
          message: GRPC.GRPC_RESPONSE.MESSAGE.SUCCESS.SUCCESS,
          data: {},
        };
        responsePayload = Helpers.ResponseHelper.grpcSuccess(response);
        console.log(
          'GRPC UPDATE USER KYC STATUS RESPONSE PAYLOAD::',
          responsePayload
        );
        callback(null, responsePayload);
      } else {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.ERROR,
          message:
            GRPC.GRPC_RESPONSE.MESSAGE.ERROR.ERROR_IN_PERFORMING_OPERATION,
        };
      }
    } catch (error) {
      console.log('ERROR IN GRPC UPDATE USER KYC STATUS ::', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  updateAdminKycStatus = async (call: any, callback: any) => {
    try {
      console.log(
        'GRPC UPDATE ADMIN KYC STATUS REQUEST PAYLOAD::',
        call.request
      );

      const { userId, adminKycStatus } = call.request;
      let responsePayload: GetCommonResponse;
      if (!adminKycStatus) {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.KYC_STATUS,
          message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.INVALID_KYC_STATUS,
        };
      }

      const kycStatus: string = GRPC.GRPC_ADMIN_KYC_STATUS[adminKycStatus - 1];
      console.log('ADMIN KYC STATUS::', kycStatus);
      let updateUserRowPayload: UPDATE_KYC_STATUS_PAYLOAD = {
        adminKycStatus: kycStatus,
      };

      if (kycStatus === ENUM.KYC_STATUS.APPROVED) {
        updateUserRowPayload = {
          ...updateUserRowPayload,
          userKycStatus: kycStatus,
        };
      }
      if (kycStatus === ENUM.KYC_STATUS.REJECTED) {
        updateUserRowPayload = {
          ...updateUserRowPayload,
          userKycStatus: ENUM.KYC_STATUS.TEMPORARY_REJECTED,
        };
      }
      console.log('PAYLOAD::', updateUserRowPayload);
      if (call.request.rejectionReason) {
        updateUserRowPayload = {
          ...updateUserRowPayload,
          kycRejectionReason: call.request.rejectionReason,
        };
      }
      const userRow: boolean = await this.updateUserRow(
        { userId: userId },
        updateUserRowPayload
      );
      if (userRow) {
        if (kycStatus === ENUM.KYC_STATUS.APPROVED) {
          const isSessionUpdated = await this.updateUserSession(userId);

          if (!isSessionUpdated) {
            throw {
              field: GRPC.GRPC_RESPONSE.FIELD.ERROR,
              message:
                GRPC.GRPC_RESPONSE.MESSAGE.ERROR.ERROR_IN_PERFORMING_OPERATION,
            };
          }
        }
        const response = {
          message: GRPC.GRPC_RESPONSE.MESSAGE.SUCCESS.SUCCESS,
          data: {},
        };
        responsePayload = Helpers.ResponseHelper.grpcSuccess(response);
        console.log(
          'GRPC UPDATE ADMIN KYC STATUS RESPONSE PAYLOAD::',
          responsePayload
        );
        callback(null, responsePayload);
      } else {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.ERROR,
          message:
            GRPC.GRPC_RESPONSE.MESSAGE.ERROR.ERROR_IN_PERFORMING_OPERATION,
        };
      }
    } catch (error) {
      console.log('ERROR IN GRPC UPDATE ADMIN KYC STATUS ::', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  updateUserClientId = async (call: any, callback: any) => {
    try {
      console.log('GRPC UPDATE USER CLIENT ID REQUEST PAYLOAD::', call.request);

      const { clientId, userId } = call.request;
      let responsePayload: GetCommonResponse;
      if (!clientId || !userId) {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.CLIENT_ID,
          message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.CLIENT_ID_REQUIRED,
        };
      }

      const isClientIdUpdated: boolean = await this.updateUserRow(
        { userId: userId },
        { clientId: clientId }
      );

      if (isClientIdUpdated) {
        const response = {
          message: GRPC.GRPC_RESPONSE.MESSAGE.SUCCESS.SUCCESS,
          data: {},
        };
        responsePayload = Helpers.ResponseHelper.grpcSuccess(response);
        console.log(
          'GRPC UPDATE ADMIN KYC STATUS RESPONSE PAYLOAD::',
          responsePayload
        );
        callback(null, responsePayload);
      } else {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.ERROR,
          message:
            GRPC.GRPC_RESPONSE.MESSAGE.ERROR.ERROR_IN_PERFORMING_OPERATION,
        };
      }
    } catch (error) {
      console.log('ERROR IN GRPC UPDATE USER CLIENT ID ::', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  updateUserSession = async (userId: string) => {
    try {
      const userSessionRow = await userHelper.getUserSessionRow({
        userId: userId,
      });
      if (userSessionRow) {
        const userRow = await userHelper.getUserRow({ userId: userId });
        if (userRow) {
          const { accessJwt } = await Helpers.utilitiesHelper.generateJwt(
            {
              userId: userRow.userId,
              email: userRow.email,
              nationality: userRow.nationality ? userRow.nationality : '',
              accountType: userRow.accountType ? userRow.accountType : '',
              phoneNumber: userRow.phoneNumber ? userRow.phoneNumber : '',
              clientId: userRow.clientId ? userRow.clientId : '',
            },
            false
          );
          if (accessJwt) {
            const updateUserSession = (
              await Model.UserSession.update(
                { accessToken: accessJwt },
                { where: { userId: userId } }
              )
            )[0];
            if (Number(updateUserSession) === 0) {
              return false;
            } else {
              return true;
            }
          } else {
            return false;
          }
        } else {
          return false;
        }
      } else {
        return true;
      }
    } catch (error) {
      console.log('ERROR IN UPDATE USER SESSION::', error);
      return false;
    }
  };

  verifyTransactionOtp = async (call: any, callback: any) => {
    try {
      console.log('GRPC VERIFY TRANSACTION OTP::', call.request);
      let responsePayload: GetCommonResponse;
      const token = call.metadata.getMap().token;
      const { verificationPayload, requestType } = call.request;
      const tokenData: { error: boolean; userId: string } = await getTokenAuth(
        token
      );
      if (tokenData.error) {
        throw {
          field: MIDDLEWARE_RESPONSE.FIELDS.JWT_REQUIRED,
          message: MIDDLEWARE_RESPONSE.JWT_MUST_PROVIDED,
        };
      }

      const userId: string = tokenData.userId;
      await this.validateTransactionOtpRequest(call.request, userId);

      const userRow: any = await this.getUserRow(
        {
          userId: userId,
          status: ENUM.USER_STATUS.ACTIVE,
          isDeleted: false,
          isEmailVerified: true,
          isBlocked: false,
        },
        []
      );

      if (userRow) {
        let isVerified = true;
        let errorResponse;
        const payload = verificationPayload[0];
        // for (let payload of verificationPayload) {
        console.log('START OF FOR EACH::');
        if (
          ![
            ENUM.TFA_STATUS_TYPE.TXN_GOOGLE_2FA_STATUS,
            ENUM.TFA_STATUS_TYPE.TXN_EMAIL_STATUS,
            ENUM.TFA_STATUS_TYPE.TXN_MPIN_STATUS,
            ENUM.TFA_STATUS_TYPE.TXN_SMS_STATUS,
          ].includes(payload.otpType)
        ) {
          console.log('INVALID REQUEST TYPE:');
          isVerified = false;
          errorResponse = {
            field: GRPC.GRPC_RESPONSE.FIELD.INVALID_REQUEST,
            message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.INVALID_REQUEST_METHOD,
          };
          // break;
        }
        console.log('IS TRANSACTION 2FA ENALBLED', userRow[payload.otpType]);

        if (!userRow[payload.otpType]) {
          console.log('SECURITY NOT ENABLED::');
          isVerified = false;
          errorResponse = {
            field: GRPC.GRPC_RESPONSE.FIELD.INVALID_REQUEST,
            message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.INVALID_REQUEST_METHOD,
          };
          // break;
        }

        if (
          payload.otpType === ENUM.TFA_STATUS_TYPE.TXN_MPIN_STATUS &&
          payload.otp !== userRow.mobilePin
        ) {
          console.log('INCORRECT MPIN');
          isVerified = false;
          errorResponse = {
            field: GRPC.GRPC_RESPONSE.FIELD.INVALID_MPIN,
            message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.INVALID_MPIN,
          };
          // break;
        }

        // if google 2fa verification
        if (payload.otpType === ENUM.TFA_STATUS_TYPE.TXN_GOOGLE_2FA_STATUS) {
          const verified: boolean = SpeakEasy.totp.verify({
            secret: userRow.google2FaSecret,
            encoding: 'base32',
            token: payload.otp,
          });
          if (!verified) {
            console.log('INCORRECT 2FA CODE::');
            isVerified = false;
            errorResponse = {
              field: GRPC.GRPC_RESPONSE.FIELD.INVALID_OTP,
              message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.INVALID_OTP,
            };
            // break;
          }
        }

        // if sms or email verification
        if (
          payload.otpType === ENUM.TFA_STATUS_TYPE.TXN_EMAIL_STATUS ||
          payload.otpType === ENUM.TFA_STATUS_TYPE.TXN_SMS_STATUS
        ) {
          let otpRowPayload: Model.WhereOptions<VERIFY_TRANSACTION_OTP_PAYLOAD> =
            {
              userId: userId,
              service: requestType,
              otp: payload.otp,
              method: payload.otpType,
              status: false,
            };

          if (payload.otpType === ENUM.TFA_STATUS_TYPE.TXN_EMAIL_STATUS) {
            otpRowPayload = {
              ...otpRowPayload,
              email: userRow.email,
              method: ENUM.OTP_METHOD.EMAIL,
            };
          }

          if (payload.otpType === ENUM.TFA_STATUS_TYPE.TXN_SMS_STATUS) {
            otpRowPayload = {
              ...otpRowPayload,
              phoneNumber: userRow.phoneNumber,
              method: ENUM.OTP_METHOD.SMS,
            };
          }
          console.log('OTP PAYLAOD::', otpRowPayload);
          const verifyOtp = await this.verifyOtp(otpRowPayload);
          console.log('VERIFY OTP RESPONSE::', verifyOtp);

          if (verifyOtp.error) {
            isVerified = false;
            errorResponse = {
              field: GRPC.GRPC_RESPONSE.FIELD.INVALID_OTP,
              message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.INVALID_OTP,
            };
            // break;
          }
        }
        // }
        // if mpin verification
        if (isVerified) {
          const response = {
            message: GRPC.GRPC_RESPONSE.MESSAGE.SUCCESS.VERIFIED_SUCCESS,
            data: {},
          };
          responsePayload = Helpers.ResponseHelper.grpcSuccess(response);
          console.log('GRPC VERIFY OTP RESPONSE PAYLOAD::', responsePayload);
          callback(null, responsePayload);
        } else {
          throw errorResponse;
        }
      } else {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.INVALID_REQUEST,
          message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.INVALID_REQUEST,
        };
      }
    } catch (error) {
      console.log('ERROR IN VERIFY TRANSACTION OTP ::', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  verifyOtp = async (
    payload: Model.WhereOptions<VERIFY_TRANSACTION_OTP_PAYLOAD>
  ) => {
    try {
      const otpRow = await this.getOtpRow(payload);

      if (otpRow) {
        console.log('OTP ROW FOUND::');
        const isOtpExpired: boolean = await this.isOtpExpired(otpRow.updatedAt);
        if (isOtpExpired) {
          console.log('TRANSACTION OTP EXPIRES::');
          throw {
            field:
              otpRow.method === ENUM.OTP_METHOD.SMS
                ? ENUM.TFA_STATUS_TYPE.TXN_SMS_STATUS
                : ENUM.TFA_STATUS_TYPE.TXN_EMAIL_STATUS,
            message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.OTP_EXPIRED,
          };
        }
        const isOtpDestroyed: boolean = await this.destroyOtp(payload);
        if (!isOtpDestroyed) {
          console.log('TRANSACTION OTP NOT DESTROYED EXPIRES::');
          throw {
            field: GRPC.GRPC_RESPONSE.FIELD.ERROR,
            message:
              GRPC.GRPC_RESPONSE.MESSAGE.ERROR.ERROR_IN_PERFORMING_OPERATION,
          };
        }

        return { error: false, response: {} };
      } else {
        console.log('OTP ROW NOT FOUND::');
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.OTP,
          message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.INVALID_OTP,
        };
      }
    } catch (error) {
      console.log('GRPC ERROR IN VERIFY OTP', error);
      return { error: true, response: error };
    }
  };

  getClientId = async (call: any, callback: any) => {
    try {
      console.log('GRPC GET USER CLIENT ID::', call.request);
      console.log('META DATA::', call.metadata);
      let responsePayload: GetCommonResponse;
      const token = call.metadata.getMap().token;
      console.log('TOKENS::', token);
      const tokenData: { error: boolean; userId: string } = await getTokenAuth(
        token
      );
      if (tokenData.error) {
        throw {
          field: 'Jwt error',
          message: MIDDLEWARE_RESPONSE.JWT_MUST_PROVIDED,
        };
      }
      const userId: string = tokenData.userId;
      const email: string = call.request.email;
      const userRow = await this.getUserRow(
        {
          userId: userId,
          status: ENUM.USER_STATUS.ACTIVE,
          isDeleted: false,
          isEmailVerified: true,
          isBlocked: false,
        },
        []
      );
      console.log('USER ROW::', userRow);
      if (userRow) {
        const wheres = {
          [Model.Op.or]: [{ email: email.toLowerCase() }, { uidString: email }],
          status: ENUM.USER_STATUS.ACTIVE,
          isDeleted: false,
          isEmailVerified: true,
          isBlocked: false,
        };
        const toUserRow = await this.getUserRow(wheres, []);
        console.log('TO USER ROW::', toUserRow);
        if (!toUserRow) {
          throw {
            field: GRPC.GRPC_RESPONSE.FIELD.ERROR,
            message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.NO_RECORD_FOUND,
          };
        }

        if (!toUserRow.clientId) {
          throw {
            field: GRPC.GRPC_RESPONSE.FIELD.ERROR,
            message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.CLIENT_ID_NOT_FOUND,
          };
        }

        if (toUserRow.email === userRow.email) {
          throw {
            field: GRPC.GRPC_RESPONSE.FIELD.ERROR,
            message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.INVALID_REQUEST,
          };
        }

        const response = {
          message: GRPC.GRPC_RESPONSE.MESSAGE.SUCCESS.SUCCESS,
          data: { clientId: toUserRow.clientId, userId: toUserRow.userId },
        };
        responsePayload = Helpers.ResponseHelper.grpcSuccess(response);
        console.log('GRPC GET OTP RESPONSE PAYLOAD::', responsePayload);
        callback(null, responsePayload);
      } else {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.CLIENT_ID,
          message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.ERROR,
        };
      }
    } catch (error) {
      console.log('ERROR IN GRPC GET USER CLIENT ID ::', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  getUserInfoByUid = async (call: any, callback: any) => {
    try {
      console.log('GRPC GET USER CLIENT ID::', call.request);
      const { uniqueId } = call.request;
      if (!uniqueId) {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.ERROR,
          message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.INVALID_REQUEST,
        };
      }
      let responsePayload: GetCommonResponse;

      const wheres = {
        [Model.Op.or]: [
          { email: uniqueId.toLowerCase() },
          { uidString: uniqueId },
        ],
        status: ENUM.USER_STATUS.ACTIVE,
        isDeleted: false,
        isEmailVerified: true,
        isBlocked: false,
      };
      const toUserRow = await this.getUserRow(wheres, []);
      if (!toUserRow) {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.ERROR,
          message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.NO_RECORD_FOUND,
        };
      }

      const response = {
        message: GRPC.GRPC_RESPONSE.MESSAGE.SUCCESS.SUCCESS,
        data: { userId: toUserRow.userId },
      };
      responsePayload = Helpers.ResponseHelper.grpcSuccess(response);
      console.log('GRPC GET USERINFO BY UNIQUE ID PAYLOAD::', responsePayload);
      callback(null, responsePayload);
    } catch (error) {
      console.log('ERROR IN GRPC USERINFO BY UNIQUE ID ::', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  getAllOtps = async (call: any, callback: any) => {
    try {
      console.log('CALL:::', call?.path, call?.handler?.path);
      const { limit, offset } = call.request;
      console.log('GRPC GET ALL OTPS REQUEST PAYLOAD::', call.request);
      let response: GetCommonResponse;

      const limits = limit ? Number(limit) : Number(PAGINATION.LIMIT_VALUE);
      const offsets = offset ? Number(offset) : Number(PAGINATION.OFFSET_VALUE);

      const otps = await Model.Otp.findAll({
        where: { status: false },
        order: [['createdAt', 'DESC']],
        limit: limits,
        offset: offsets,
        raw: true,
      });
      if (otps && otps.length) {
        response = {
          message: GRPC.GRPC_RESPONSE.MESSAGE.SUCCESS.SUCCESS,
          data: otps,
        };
      } else {
        response = {
          message: GRPC.GRPC_RESPONSE.MESSAGE.SUCCESS.SUCCESS,
          data: [],
        };
      }

      const responsePayload = Helpers.ResponseHelper.grpcSuccess(response);
      callback(null, responsePayload);
    } catch (error) {
      console.log('ERROR IN GRPC GET ALL OTPS ::', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  deleteUserAccount = async (call: any, callback: any) => {
    try {
      console.log('GRPC GET DELETE USER REQUEST PAYLOAD::', call.request);
      const { userId } = call.request;
      if (!userId) {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.ERROR,
          message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.INVALID_REQUEST,
        };
      }
      const userRow = await this.getUserRow({ userId: userId }, []);
      if (userRow && !userRow.isDeleted) {
        const userSessionRow = await userHelper.getUserSessionRow({
          userId: userId,
        });
        if (userSessionRow) {
          const isUserSessionDistroyed = await this.destroyUserSession({
            userId: userId,
          });
          if (!isUserSessionDistroyed) {
            throw {
              field: GRPC.GRPC_RESPONSE.FIELD.ERROR,
              message:
                GRPC.GRPC_RESPONSE.MESSAGE.ERROR.ERROR_IN_PERFORMING_OPERATION,
            };
          }
        }

        await this.deleteUser(userRow);
      } else {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.ERROR,
          message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.INVALID_REQUEST,
        };
      }

      const response = {
        message: GRPC.GRPC_RESPONSE.MESSAGE.SUCCESS.USER_DELETED,
        data: {},
      };
      const responsePayload = Helpers.ResponseHelper.grpcSuccess(response);
      callback(null, responsePayload);
    } catch (error) {
      console.log('ERROR IN GRPC DELETE USER ::', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  // notifications

  deleteUser = async (userRow: Model.User) => {
    try {
      const reandomPassword: string =
        Helpers.utilitiesHelper.generateRandomString(25);
      const passwordHash = await Helpers.utilitiesHelper.generateSHA256(
        reandomPassword
      );
      const updateUserRow: boolean = await this.updateUserRow(
        {
          userId: userRow.userId,
        },
        {
          email: `${envAlias.DLEETE_ACCOUNT_PREFIX}${
            userRow.email
          }_ ${moment().unix()}`,
          password: passwordHash ? passwordHash : reandomPassword,
          isBlocked: true,
          isEmailVerified: false,
          status: ENUM.USER_STATUS.INACTIVE,
          isDeleted: true,
          phoneNumber: `${envAlias.DLEETE_ACCOUNT_PREFIX} 
       ${userRow.phoneNumber}_${moment().unix()}`,
          googleId: `${envAlias.DLEETE_ACCOUNT_PREFIX}${
            userRow.googleId
          }_${moment().unix()}`,
          appleId: `${envAlias.DLEETE_ACCOUNT_PREFIX}${
            userRow.appleId
          }_${moment().unix()}`,
          facebookId: `${envAlias.DLEETE_ACCOUNT_PREFIX}${
            userRow.facebookId
          }_${moment().unix()}`,
        }
      );
      if (!updateUserRow) {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.ERROR,
          message:
            GRPC.GRPC_RESPONSE.MESSAGE.ERROR.ERROR_IN_PERFORMING_OPERATION,
        };
      }
    } catch (error) {
      console.log('ERROR IN DELETE USER :', error);
      throw error;
    }
  };
  getUserDataByEmail = async (call: any, callback: any) => {
    try {
      console.log(
        'GRPC GET USER DETAILS BY EMAIL REQUEST PAYLOAD::',
        call.request
      );
      const email: string = call.request.email.toLowerCase();
      let response: GetCommonResponse;
      const attributes = ['firstName', 'lastName'];
      const userRow = await this.getUserRow(
        {
          email: email,
          userKycStatus: ENUM.KYC_STATUS.APPROVED,
          adminKycStatus: ENUM.KYC_STATUS.APPROVED,
          status: ENUM.USER_STATUS.ACTIVE,
          isDeleted: false,
          isEmailVerified: true,
          isBlocked: false,
        },
        attributes
      );
      let responsePayload;
      console.log('USER ROW::', userRow);
      if (userRow) {
        response = {
          message: GRPC.GRPC_RESPONSE.MESSAGE.SUCCESS.SUCCESS,
          data: userRow,
        };
        responsePayload = Helpers.ResponseHelper.grpcSuccess(response);
        console.log(
          'GRPC GET USER DETAILS BY EMAIL RESPONSE PAYLOAD::',
          responsePayload
        );
        callback(null, responsePayload);
      } else {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.ERROR,
          message:
            GRPC.GRPC_RESPONSE.MESSAGE.ERROR.ERROR_IN_PERFORMING_OPERATION,
        };
      }
    } catch (error) {
      console.log('ERROR IN GRPC GET USER DETAILS BY EMAIL::', error);
      callback({ code: status.NOT_FOUND, message: 'RECORD NOT FOUND' });
    }
  };

  getUserFcmTokens = async (call: any, callback: any) => {
    try {
      console.log('GRPC GET FCM TOKEN REQUEST PAYLOAD::', call.request);
      const { email, userId } = call.request;

      let query = `SELECT u."userId",u."defaultLanguage",u."defaultFiatCurrency",COALESCE((SELECT json_agg(us."fcmToken") FROM "userSession" as us WHERE us."userId"=u."userId" group by us."userId"),'[]') as fcmToken FROM "user" as u WHERE `;

      // `SELECT us."userId",json_agg(us."fcmToken") as fcmtoken from "user" as u JOIN "userSession" us
      //  ON u."userId"=us."userId" WHERE `;
      if (userId) {
        query += `u."userId"= :userId `;
      } else if (email) {
        query += `u."email"= :email `;
      }
      console.log('PAYLOAD::', email, userId);
      console.log('QUERY ', query);
      const fcmTokenData: Array<GET_FCM_TOKEN_PAYLOAD> =
        await Model.sequelize.query(query, {
          type: Model.QueryTypes.SELECT,
          replacements: {
            email: email,
            userId: userId,
          },
        });

      console.log('FCM TOKENN', fcmTokenData);
      let response: GetCommonResponse;

      let responsePayload;
      if (fcmTokenData.length) {
        const tokenData: GET_FCM_TOKEN_PAYLOAD = fcmTokenData[0];
        response = {
          message: GRPC.GRPC_RESPONSE.MESSAGE.SUCCESS.SUCCESS,
          data: {
            userId: tokenData?.userId,
            fcmTokens: tokenData.fcmtoken,
            defaultLanguage: tokenData.defaultLanguage,
            defaultFiatCurrency: tokenData.defaultFiatCurrency,
          },
        };
        responsePayload = Helpers.ResponseHelper.grpcSuccess(response);
        console.log('GRPC GET FCM TOKEN RESPONSE PAYLOAD::', responsePayload);
        callback(null, responsePayload);
      } else {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.ERROR,
          message:
            GRPC.GRPC_RESPONSE.MESSAGE.ERROR.ERROR_IN_PERFORMING_OPERATION,
        };
      }
    } catch (error) {
      console.log('ERROR IN GRPC GET FCM TOKEN ::', error);
      callback({ code: status.NOT_FOUND, message: 'RECORD NOT FOUND' });
    }
  };
  // end notification
  updateUserRow = async (
    searchPayload: Model.WhereOptions<GRPC_SEARCH_USER_ROW_PAYLOAD>,
    updatePayload: GRPC_UPDATE_USER_ROW_PAYLOAD
  ) => {
    try {
      return await Model.User.update(updatePayload, {
        where: searchPayload,
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
      console.log('ERROR IN UPDATE USER ROW::', error);
      return false;
    }
  };

  getUserRow = async (
    payload: Model.WhereOptions<GRPC_SEARCH_USER_ROW_PAYLOAD>,
    attributes: string[]
  ) => {
    try {
      console.log('PAYLOAD::', payload, attributes);
      let userRow;
      if (attributes.length) {
        userRow = await Model.User.findOne({
          where: payload,
          raw: true,
          attributes: attributes.length ? attributes : [],
        });
      } else {
        userRow = await Model.User.findOne({
          where: payload,
          raw: true,
        });
      }
      return userRow;
    } catch (error) {
      console.log('ERROR IN GET USER ROW::', error);
      return false;
    }
  };

  getAllUserRow = async (
    payload: Model.WhereOptions<FIND_ALL_USER_ROW_PAYLOAD>,
    limit: number,
    offset: number
  ) => {
    try {
      const limits = limit ? Number(limit) : Number(PAGINATION.LIMIT_VALUE);
      const offsets = offset ? Number(offset) : Number(PAGINATION.OFFSET_VALUE);
      console.log('LIMIT AND OFFSET', limits, offsets);
      const userRow = await Model.User.findAll({
        where: payload,
        limit: limits,
        offset: offsets,
        attributes: [
          'id',
          'userId',
          'email',
          [Model.fn('COALESCE', Model.col('firstName'), ''), 'firstName'],
          [Model.fn('COALESCE', Model.col('lastName'), ''), 'lastName'],
          [Model.fn('COALESCE', Model.col('nationality'), ''), 'nationality'],
          'accountType',
          [Model.fn('COALESCE', Model.col('address'), ''), 'address'],
          [Model.fn('COALESCE', Model.col('city'), ''), 'city'],
          [Model.fn('COALESCE', Model.col('postalCode'), ''), 'postalCode'],
          [Model.fn('COALESCE', Model.col('phoneNumber'), ''), 'phoneNumber'],
          [Model.fn('COALESCE', Model.col('dateOfBirth'), ''), 'dateOfBirth'],
          [Model.fn('COALESCE', Model.col('businessName'), ''), 'businessName'],
          [Model.fn('COALESCE', Model.col('brandName'), ''), 'brandName'],
          [
            Model.fn('COALESCE', Model.col('incorporationDate'), ''),
            'incorporationDate',
          ],
          [Model.fn('COALESCE', Model.col('companyType'), ''), 'companyType'],
          [Model.fn('COALESCE', Model.col('taxVatId'), ''), 'taxVatId'],
          'isEmailVerified',
          'isBlocked',
          [
            Model.fn('COALESCE', Model.col('reasonToBlockUser'), ''),
            'reasonToBlockUser',
          ],
          'status',
          [Model.fn('COALESCE', Model.col('uidString'), ''), 'uidString'],
          'userKycStatus',
          'adminKycStatus',
          'isDeleted',
          'createdAt',
          'updatedAt',
        ],
        raw: true,
        order: [['createdAt', 'DESC']],
      });
      const userRowCount = await Model.User.count({ where: payload });
      console.log('USER ROW COUNT', userRowCount);
      return { list: userRow, userRowCount: Number(userRowCount) };
    } catch (error) {
      console.log('ERROR IN GET ALL USER ROW::', error);
      return { list: [], userRowCount: 0 };
    }
  };

  getOtpRow = async (payload: Model.WhereOptions<GET_OTP_ROW_PAYLOAD>) => {
    try {
      const otpRow = await Model.Otp.findOne({
        where: payload,
        raw: true,
      });
      console.log(otpRow, 'OTP ROW::');
      if (!otpRow || otpRow === null) {
        return false;
      }
      return otpRow;
    } catch (error) {
      console.log('ERROR IN GET OTP ROW::', error);
      return false;
    }
  };

  validateTransactionOtpRequest = async (grpcRequest: any, userId: string) => {
    try {
      if (!ENUM.TRANSACTION_OTP_TYPE.includes(grpcRequest.requestType)) {
        throw {
          field: GRPC.GRPC_RESPONSE.FIELD.OTP,
          message: GRPC.GRPC_RESPONSE.MESSAGE.ERROR.INVALID_REQUEST_TYPE,
        };
      }
    } catch (error) {
      console.log('ERROR IN VALIDATE TRANSACTION::', error);
      throw error;
    }
  };

  destroyOtp = async (
    findRowPayload: Model.WhereOptions<DESTROY_OTP_PAYLOAD>
  ) => {
    try {
      return await Model.Otp.destroy({
        where: findRowPayload,
      })
        .then((result: number) => {
          if (result === 0) {
            return false;
          } else {
            return true;
          }
        })
        .catch((error) => {
          throw error;
        });
    } catch (error) {
      console.log('ERROR IN DESTROY OTP::', error);
      return false;
    }
  };

  isOtpExpired = async (updatedAt: Date) => {
    try {
      const dbOtpCreationTimeUnix: number =
        moment(updatedAt).utc().unix() + Number(TXN_OTP_EXPIRE_TIME);

      const currentDate = new Date();
      const expireTimeUnix: number = moment(currentDate).utc().unix();
      console.log('DMB:', dbOtpCreationTimeUnix, 'CURRENT::', expireTimeUnix);
      let isOtpExpired = false;
      if (expireTimeUnix > dbOtpCreationTimeUnix) {
        isOtpExpired = true;
      }
      return isOtpExpired;
    } catch (error) {
      console.log('ERROR IN IS OTP EXPIRED::', error);
      return false;
    }
  };

  destroyUserSession = async (
    findRowPayload: Model.WhereOptions<DESTROY_USER_SESSION_PAYLOAD>
  ) => {
    try {
      return await Model.UserSession.destroy({ where: findRowPayload })
        .then((result: number) => {
          if (result === 0) {
            return false;
          } else {
            return true;
          }
        })
        .catch((error) => {
          throw error;
        });
    } catch (error) {
      console.log('ERROR IN DESTROY USER SESSION::', error);
      return false;
    }
  };

  sendPushNotification = async (payload: any) => {
    try {
      console.log('SEND PUSH NOTIFICATION PAYLOAD::', payload);
      // await kafkaProducer.connect();
      // await kafkaProducer.send(payload.topicName, [payload]);
      // await kafkaProducer.disconnect();
      return true;
    } catch (error) {
      console.log('ERROR IN SEND PUSH NOTIFICATION::', error);
      return false;
    }
  };
  // generateUserUids = async () => {
  //   try {
  //     console.log('INSIDE GRPC GENERATE ALL USER UIDS::');
  //     await Model.User.findAll().then(async (rows) => {
  //       if (rows.length) {
  //         rows.forEach(async (row) => {
  //           const uid = await this.getUidString(row.userId, row, {});
  //           if (uid) {
  //             await Model.User.update(
  //               { uidString: uid },
  //               { where: { userId: row.userId } }
  //             );
  //           }
  //         });
  //       }
  //     });
  //   } catch (error) {
  //     console.log('ERROR IN GRPC GENERATE UIDS ALL USER ::', error);
  //     return false;
  //   }
  // };

  getUserKycDocs = async (call: any, callback: any) => {
    let ubos: Array<Object> = [];
    let moderationcomment: any = [];
    let commonResponse: any;
    let businessResponse: {
      businessName: string;
      brandName: string;
      incorporationDate: string;
      companyType: string;
      taxVatId: string;
      ubos: any;
      businessDocs: any;
    };
    let individualResponse: {
      firstName: string;
      individualDocs: any;
    };
    try {
      const { userId } = call.request;

      await kycHelper.findKycLog({ userId: userId }).then(async (row: any) => {
        if (row) {
          if (row?.accountType === CM.ENUM.ACCOUNT_TYPE.BUSINESS) {
            const businessDocs = await kycHelper.findAllKycDocument({
              userId: userId,
              txnId: null,
            });

            if (row?.applicantId !== null) {
              ubos = await kycHelper.findBeneficiariesByParentId(
                row.applicantId
              );
              moderationcomment = await kycHelper.getUserModerationComments(
                row.applicantId,
                row?.accountType
              );
            }

            businessResponse = {
              ...row,
              businessDocs: businessDocs || [],
              ubos: ubos || [],
            };

            commonResponse = {
              message: CM.KYC_PROFILE.VALIDATIONS.KYC_DOCS_FOUND,
              data: {
                businessProfile: businessResponse || {},
                moderationComments: moderationcomment || [],
              },
            };
          } else if (row.accountType === CM.ENUM.ACCOUNT_TYPE.INDIVIDUAL) {
            const individualDocs = await kycHelper.findAllKycDocument({
              userId: userId,
              txnId: null,
            });

            moderationcomment = await kycHelper.getUserModerationComments(
              row.applicantId,
              row?.accountType
            );

            individualResponse = {
              ...row,
              individualDocs: individualDocs || [],
            };

            commonResponse = {
              message: CM.KYC_PROFILE.VALIDATIONS.KYC_DOCS_FOUND,
              data: {
                individualProfile: individualResponse || {},
                moderationComments: moderationcomment || [],
              },
            };
          } else {
            throw {
              field: CM.KYC_PROFILE.VALIDATIONS.APPLICANT_ID,
              message: CM.KYC_PROFILE.VALIDATIONS.APPLICANT_NOT_FOUND,
            };
          }
        } else {
          commonResponse = {
            message: CM.KYC_PROFILE.VALIDATIONS.KYC_DOCS_FOUND,
            data: {},
          };
        }
      });
      callback(null, Helpers.ResponseHelper.grpcSuccess(commonResponse));
    } catch (error) {
      console.log('GRPC USER KYC PROFILE AND DOCS ERROR :', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  getAllKycs = async (call: any, callback: any) => {
    try {
      console.log('GET ALL KYCS REQUEST PAYLOAD:', call.request);

      let commonResponse;
      const kycDocs: any = await kycHelper.getAllUserKycs(call.request);
      if (kycDocs) {
        let totalCount = kycDocs?.count;
        commonResponse = {
          message: CM.KYC_PROFILE.VALIDATIONS.KYC_DOCS_FOUND,
          data: {
            list: kycDocs.rows,
            totalCount: totalCount.toString(),
          },
        };
      } else {
        commonResponse = {
          message: CM.NO_RECORD_FOUND,
          data: {
            list: [],
            totalCount: '0',
          },
        };
      }
      callback(null, Helpers.ResponseHelper.grpcSuccess(commonResponse));
    } catch (error) {
      console.log('GRPC GET ALL KYCS ERROR :', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  getComplianceKycs = async (call: any, callback: any) => {
    try {
      let commonResponse;
      const complianceKycs: any = await kycHelper.getAllComplianceKycs(
        call.request
      );
      if (complianceKycs) {
        let totalCount = complianceKycs?.count;
        commonResponse = {
          message: CM.KYC_PROFILE.VALIDATIONS.KYC_DOCS_FOUND,
          data: {
            list: complianceKycs.rows,
            totalCount: totalCount.toString(),
          },
        };
      } else {
        commonResponse = {
          message: CM.NO_RECORD_FOUND,
          data: {
            list: [],
            totalCount: '0',
          },
        };
      }
      callback(null, Helpers.ResponseHelper.grpcSuccess(commonResponse));
    } catch (error) {
      console.log('GRPC ERROR ALL COMPLIANCE KYCS:', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  uploadKycDoc = async (call: any, callback: any) => {
    try {
      let isValidData = false;
      let commonResponse;
      let kycDocPayload = {};

      const { userId, docFile, fileType, docName, txnId } = call.request;

      if (txnId !== undefined) {
        console.log('UPLOADING FOR KYT');

        isValidData = this.handleUploadKytDocValidation(call.request);
      }

      isValidData = this.handleUploadKycDocValidation(call.request);

      if (!isValidData) {
        throw {
          field: CM.KYC_PROFILE.VALIDATIONS.KYC_DOC,
          message: CM.INVALID_REQUEST,
        };
      }

      let documentName = docName;
      const kycDoc = await kycHelper.findKycLog({
        userId: userId,
      });

      if (!kycDoc) {
        throw {
          field: CM.KYC_PROFILE.VALIDATIONS.KYC_PROFILE,
          message: CM.KYC_PROFILE.VALIDATIONS.KYC_PROFILE_NOT_FOUND,
        };
      }

      const timestamp = Date.now();
      const rawImageName = `${CM.AWS_CONFIG.KYC_DOC_PREFIX + userId}/${
        documentName + timestamp.toString()
      }.png`;

      const uploadedDoc = await Helpers.s3ClientHelper.uploadS3(
        docFile,
        CM.AWS_CONFIG.DIRECTORY.KYT,
        rawImageName
      );

      // const uploadedDoc = await Helpers.uploadToGoogleStorage2(
      //   docFile,
      //   userId,
      //   documentName,
      //   fileType,
      //   CM.GOOGLE_CLOUD_CONFIG.DIRECTORY.KYT
      // );

      if (!uploadedDoc) {
        console.log('ERROR WHILE UPLOADING ');
        throw {
          field: CM.KYC_PROFILE.VALIDATIONS.KYC_DOC,
          message: CM.KYC_PROFILE.VALIDATIONS.KYC_DOC_UPLOAD_FAILURE,
        };
      }

      kycDocPayload = {
        ...uploadedDoc,
        docName: documentName,
        docType: CM.ENUM.DOC_TYPE.ADDITIONAL,
        userId: userId,
        viewType: CM.SUMSUB.DOC_VIEW_TYPE.FRONT,
        kycId: kycDoc.id,
        s3Status: true,
      };

      if (txnId !== undefined) {
        kycDocPayload = {
          ...kycDocPayload,
          txnId: txnId,
        };

        await clientHelper.saveTransactionDocs({
          service: 'KYC',
          keyName: 'ADDITIONAL_TRANSACTION_PROOF',
          mediaId: txnId,
          userId: userId,
          type: 'SAVE',
          ...uploadedDoc,
        });
      }

      const isDocSaved: any = await kycHelper.createKycDoc(kycDocPayload);

      if (!isDocSaved) {
        throw {
          field: CM.KYC_PROFILE.VALIDATIONS.KYC_DOC,
          message: CM.KYC_PROFILE.VALIDATIONS.KYC_DOC_UPLOAD_FAILURE,
        };
      }

      commonResponse = {
        message: CM.KYC_PROFILE.VALIDATIONS.KYC_DOC_UPLOAD_SUCCESS,
        data: {
          imageId: isDocSaved.id,
          isTransactionDoc:
            txnId !== undefined && txnId !== '' ? 'true' : 'false',
        },
      };

      callback(null, Helpers.ResponseHelper.grpcSuccess(commonResponse));
    } catch (error) {
      console.log('GRPC UPLOAD KYC DOC ERROR::', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  updateKycStatus = async (call: any, callback: any) => {
    try {
      let commonResponse: any = {};
      let response: any = {};
      const {
        userId,
        adminKycStatus,
        rejectionReason,
        completedBy,
        completedByUserId,
        adminFullName,
      } = call.request;
      await kycHelper.findKycLog({ userId: userId }).then(async (row) => {
        if (row !== null) {
          if (
            adminKycStatus === CM.ENUM.KYC_STATUS.APPROVED &&
            adminKycStatus === row.adminKycStatus
          ) {
            response = {
              message: CM.KYC_PROFILE.VALIDATIONS.KYC_ALREADY_APPROVED,
              data: {},
            };
          } else if (
            adminKycStatus === CM.ENUM.KYC_STATUS.REJECTED &&
            adminKycStatus === row.adminKycStatus
          ) {
            response = {
              message: CM.KYC_PROFILE.VALIDATIONS.KYC_ALREADY_REJECTED,
              data: {},
            };
          } else {
            if (
              ![
                CM.ENUM.KYC_STATUS.APPROVED,
                CM.ENUM.KYC_STATUS.REJECTED,
              ].includes(adminKycStatus)
            ) {
              throw {
                field: CM.KYC_PROFILE.VALIDATIONS.KYC_DOC,
                message: CM.INVALID_REQUEST,
              };
            }

            let emailKycStatusCode =
              adminKycStatus == CM.ENUM.KYC_STATUS.APPROVED
                ? CM.KAFKA.NOTIFICATION_CODES.KYC_STATUS_EMAIL.APPROVED
                : CM.KAFKA.NOTIFICATION_CODES.KYC_STATUS_EMAIL.ADMIN_REJECTED;

            // await kafkaHelper.sendEmailNotification(
            //   row?.email,
            //   emailKycStatusCode
            // );

            // await kafkaHelper.sendPushNotification({
            //   topicName: CM.KAFKA.COMMON_TOPICS.USER_ALERT_NOTIFICATIONS,
            //   code: CM.KAFKA.NOTIFICATION_CODES.KYC_PUSH_NOTIFICATION
            //     .KYC_STATUS_UPDATE,
            //   type: CM.KAFKA.NOTIFICATION_TYPES.NOTIFICATION,
            //   data: {
            //     userId: userId,
            //     status: adminKycStatus,
            //   },
            // });

            if (completedByUserId && completedBy) {
              console.log('UPDATING USER KYC STATUS');
              await clientHelper.UpdateUserKycStatus(userId, adminKycStatus);
            }

            const isUserKycStatusUpdated =
              await clientHelper.updateAdminKycStatus(
                userId,
                adminKycStatus,
                rejectionReason
              );

            let kycPayload: any = {
              adminKycStatus: adminKycStatus,
              adminRejectionReason: rejectionReason || '',
            };

            if (completedByUserId && completedBy) {
              kycPayload.completedByUserId = completedByUserId;
              kycPayload.completedBy = completedBy;
              kycPayload.sumsubKycStatus = CM.ENUM.KYC_STATUS.APPROVED;
              kycPayload.adminFullName = adminFullName;
            }

            const isKycStatusUpdated = await kycHelper.updateKycLog(
              kycPayload,
              userId
            );

            if (isUserKycStatusUpdated && isKycStatusUpdated) {
              response = {
                message: CM.KYC_PROFILE.VALIDATIONS.KYC_STATUS_UPDATE_SUCCESS,
                data: {},
              };
            }
          }
        } else {
          throw {
            field: CM.KYC_PROFILE.VALIDATIONS.KYC_PROFILE_NOT_FOUND_FIELD,
            message: CM.KYC_PROFILE.VALIDATIONS.KYC_PROFILE_NOT_FOUND,
          };
        }
      });
      commonResponse = Helpers.ResponseHelper.grpcSuccess(response);
      callback(null, commonResponse);
    } catch (error) {
      console.log('GRPC UPDATE KYC STATUS ERROR :', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  getAllKyts = async (call: any, callback: any) => {
    console.log('REQUEST OBJECT :', call.request);
    try {
      let commonResponse;
      const kyt: any = await kycHelper.getAllKytLogs(call.request);
      if (kyt) {
        let totalCount = kyt?.count;
        commonResponse = {
          message: CM.KYC_PROFILE.VALIDATIONS.TRANSACTION_FOUND_SUCCESS,
          data: {
            list: kyt.rows,
            totalCount: totalCount.toString(),
          },
        };
      } else {
        commonResponse = {
          message: CM.NO_RECORD_FOUND,
          data: {
            list: [],
            totalCount: '0',
          },
        };
      }
      callback(null, Helpers.ResponseHelper.grpcSuccess(commonResponse));
    } catch (error) {
      console.log('GRPC GET ALL KYT ERROR :', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  getAllKytsByUser = async (call: any, callback: any) => {
    try {
      let commonResponse;
      if (!call.request.userId) {
        throw {
          field: 'User',
          message: 'User not found',
        };
      }
      const kyt: any = await kycHelper.getAllKytLogsByUserId(call.request);
      if (kyt) {
        let totalCount = kyt?.count;
        commonResponse = {
          message: CM.KYC_PROFILE.VALIDATIONS.TRANSACTION_FOUND_SUCCESS,
          data: {
            list: kyt.rows,
            totalCount: totalCount.toString(),
          },
        };
      } else {
        commonResponse = {
          message: CM.NO_RECORD_FOUND,
          data: {
            list: [],
            totalCount: '0',
          },
        };
      }
      callback(null, Helpers.ResponseHelper.grpcSuccess(commonResponse));
    } catch (error) {
      console.log('GRPC GET ALL KYT ERROR :', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  handleUploadKycDocValidation = (body: any) => {
    if (!body.userId || !body.docFile || !body.fileType) {
      return false;
    } else if (
      !CM.SUMSUB.DOC_EXTENSION_TYPES.includes(body.fileType.toLowerCase())
    ) {
      return false;
    } else {
      return true;
    }
  };

  handleUploadKytDocValidation = (body: any) => {
    if (!body.userId || !body.docFile || !body.fileType) {
      return false;
    } else if (
      !CM.SUMSUB.DOC_EXTENSION_TYPES.includes(body.fileType.toLowerCase())
    ) {
      return false;
    } else {
      return true;
    }
  };

  updateKycStatusByCompliance = async (call: any, callback: any) => {
    let commonResponse;
    try {
      const { userId, sumsubKycStatus, completedBy, completedByUserId } =
        call.request;

      let searchPayload = {
        userId: userId,
        sumsubKycStatus: {
          [Op.in]: [
            CM.ENUM.KYC_STATUS.TEMPORARY_REJECTED,
            CM.ENUM.KYC_STATUS.FINAL_REJECTED,
          ],
        },
      };
      await kycHelper.findKycLog(searchPayload).then(async (data) => {
        if (data !== null) {
          let payloadToUpdate = {
            userId: userId,
            sumsubKycStatus: sumsubKycStatus,
            completedBy: completedBy,
            adminKycStatus: sumsubKycStatus,
            completedByUserId: completedByUserId,
          };

          const isUserKycStatusUpdated =
            await clientHelper.updateAdminKycStatus(
              userId,
              CM.ENUM.KYC_STATUS.APPROVED,
              ''
            );

          const isUserKycUpdated = await clientHelper.UpdateUserKycStatus(
            userId,
            CM.ENUM.KYC_STATUS.APPROVED,
            {}
          );

          if (isUserKycStatusUpdated && isUserKycUpdated) {
            const isKycApproved = await kycHelper.updateKycLog(
              payloadToUpdate,
              userId
            );

            const response = {
              message: CM.KYC_PROFILE.VALIDATIONS.KYC_STATUS_UPDATE_SUCCESS,
              data: {},
            };
            let commonResponse = Helpers.ResponseHelper.grpcSuccess(response);
            callback(null, commonResponse);
          }
        } else {
          throw {
            field: 'KYC',
            message: 'No record found',
          };
        }
      });
    } catch (error) {
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  getTxnDetailByTxnId = async (call: any, callback: any) => {
    try {
      let txnDetail = {};
      const { txnId, typeId } = call.request;

      if (typeId !== undefined && txnId == undefined) {
        const txnRow: any = await kycHelper.findKytLog({ typeId: typeId });
        txnDetail = await getTxnDetailFromSumsub(txnRow?.txnId);
      } else {
        txnDetail = await getTxnDetailFromSumsub(txnId);
      }
      console.dir(txnDetail, { depth: null });

      let commonResponse: any = {
        message: 'Successfully found transaction',
        data: JSON.stringify(txnDetail),
      };

      callback(null, Helpers.ResponseHelper.grpcSuccess(commonResponse));
    } catch (error) {
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  getVerificationScreeningDetail = async (call: any, callback: any) => {
    let verificationResponse: VERIFICATION_PAYLOAD = {};
    try {
      const { userType, offset, limit } = call.request;
      console.log('GRPC REQUEST PARAMS:', userType);
      if (
        ![
          CM.ENUM.ACCOUNT_TYPE.BUSINESS,
          CM.ENUM.ACCOUNT_TYPE.INDIVIDUAL,
        ].includes(userType)
      ) {
        throw {
          field: CM.ERROR,
          message: CM.INVALID_REQUEST,
        };
      }

      const verifiedUser = await kycHelper.getUserVerification(userType);
      verificationResponse.clientVerified = verifiedUser;

      const rejectedUser = await kycHelper.getRejectedVerification(userType);
      verificationResponse.rejectedRequest = rejectedUser;

      const manuallyApprovedUser =
        await kycHelper.getComplianceApprovedVerification(userType);

      const alertList = await kycHelper.findAllAlerts({
        accountType: userType,
      });

      const allAlerts = await kycHelper.getAllAlertsWithFilter(
        userType,
        offset,
        limit
      );

      const verifiedDocuments = await kycHelper.getVerifiedDocumentDetail(
        userType
      );

      verificationResponse = {
        ...verificationResponse,
        alertRaised: alertList,
        doucmentsVerified: verifiedDocuments,
        verificationChartData: {
          approved: verifiedUser.totalCount,
          approvedManually: manuallyApprovedUser,
          alertGenerated: alertList.totalCount,
        },
        allAlerts: allAlerts,
      };

      let commonResponse: any = {
        message: CM.KYC_PROFILE.VALIDATIONS.VERIFICATION_DETAIL_FOUND,
        data: verificationResponse,
      };

      callback(null, Helpers.ResponseHelper.grpcSuccess(commonResponse));
    } catch (error) {
      console.log('GRPC FETCHING VERIFICATION DETAIL ERROR:', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  getKytDocList = async (call: any, callback: any) => {
    const { limit, offset, userId, txnId, docType } = call.request;

    try {
      const docList = await kycHelper.findAllKytDocument(
        { userId: userId, docType: docType, txnId: txnId },
        limit,
        offset
      );
      console.log('DOC LIST FOR PERTICULAR TXN:', docList);
      if (!docList) {
        let commonResponse: any = {
          message: CM.KYC_PROFILE.VALIDATIONS.KYC_DOCS_FOUND,
          data: [],
        };

        callback(null, Helpers.ResponseHelper.grpcSuccess(commonResponse));
      }

      let commonResponse: any = {
        message: CM.KYC_PROFILE.VALIDATIONS.KYC_DOCS_FOUND,
        data: JSON.stringify(docList),
      };

      callback(null, Helpers.ResponseHelper.grpcSuccess(commonResponse));
    } catch (error) {
      console.log('GRPC FETCHING DOCS DETAIL ERROR:', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  updateAdditionalDocument = async (call: any, callback: any) => {
    const { userId, txnId, id, newTitle } = call.request;
    let searchPayload = {};

    console.log('PAYLOAD REQUEST IN UPLOAD REQUEST : ', call.request);

    try {
      searchPayload = {
        docType: CM.ENUM.DOC_TYPE.ADDITIONAL,
        userId: userId,
        id: id,
      };

      if (txnId !== undefined) {
        searchPayload = {
          ...searchPayload,
          txnId: txnId,
        };
      }

      const isDocumentFound = await kycHelper.findKycDocument(searchPayload);

      if (!isDocumentFound) {
        throw {
          field: CM.KYC_PROFILE.VALIDATIONS.ADDITIONAL_DOC,
          message: CM.KYC_PROFILE.VALIDATIONS.ADDITIONAL_DOCS_NOT_FOUND,
        };
      }

      const isNameRenamed = await kycHelper.updateAdditionalDocument(
        { docName: newTitle },
        id
      );

      if (!isNameRenamed) {
        throw {
          field: CM.KYC_PROFILE.VALIDATIONS.ADDITIONAL_DOC,
          message: CM.KYC_PROFILE.VALIDATIONS.ADDITIONAL_DOC_UPDATE_FAILURE,
        };
      }

      let commonResponse: any = {
        message: CM.KYC_PROFILE.VALIDATIONS.ADDITIONAL_DOC_UPDATE,
        data: {},
      };

      callback(null, Helpers.ResponseHelper.grpcSuccess(commonResponse));
    } catch (error) {
      console.log('GRPC RENAMING KYC DOCUMENT', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  removeAdditionalDocument = async (
    call: {
      request: {
        docId: string;
        userId?: string;
        txnId?: string;
        imagePath: string;
      };
    },
    callback: Function
  ) => {
    const { docId, userId, txnId, imagePath } = call.request;
    let searchPayload = {};

    try {
      if (txnId !== undefined) {
        searchPayload = {
          id: Number(docId),
          txnId: txnId,
        };
      }

      searchPayload = {
        id: Number(docId),
        userId: userId,
      };

      const isDocFound = await kycHelper.findKycDocument(searchPayload);

      if (!isDocFound) {
        throw {
          field: CM.KYC_PROFILE.VALIDATIONS.ADDITIONAL_DOC,
          message: CM.KYC_PROFILE.VALIDATIONS.ADDITIONAL_DOCS_NOT_FOUND,
        };
      }

      const isDocDeleted = await kycHelper.destroyKycDoc(searchPayload);

      // await deleteGoogleImage(imagePath);

      if (Number(isDocDeleted) !== 1) {
        throw {
          field: CM.KYC_PROFILE.VALIDATIONS.ADDITIONAL_DOC,
          message: CM.ERROR_IN_PERFORMING_OPERATION,
        };
      }

      let commonResponse: any = {
        message: CM.KYC_PROFILE.VALIDATIONS.ADDITIONAL_DOC_DELETED,
        data: {},
      };

      callback(null, Helpers.ResponseHelper.grpcSuccess(commonResponse));
    } catch (error) {
      console.log('GRPC DELETING KYC DOCUMENT', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  generateTxnId() {
    const characters = CM.RANDOM_STRING;
    let txnId = '';
    for (let i = 0; i < 10; i++) {
      txnId += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return txnId;
  }

  buildSubmitTransactionResponse = (responseObject: any, status: string) => {
    if (responseObject !== null || responseObject !== undefined) {
      return {
        transactionScore: responseObject.score.toString(),
        transactionApprovalStatus: status,
        transactionCreatedAt: responseObject.createdAt,
        sumsubData: JSON.stringify(responseObject),
        txnId: responseObject?.data?.txnId?.toString(),
      };
    }
  };

  getTransactionDirection = (type: string) => {
    if (type) {
      if (
        [
          CM.SUMSUB.TRANSACTION_TYPE.CRYPTO_WITHDRAW,
          CM.SUMSUB.TRANSACTION_TYPE.FIAT_WITHDRAW,
        ].includes(type)
      ) {
        return CM.SUMSUB.TRANSACTION_DIRECTION.OUT;
      } else {
        return CM.SUMSUB.TRANSACTION_DIRECTION.IN;
      }
    }
  };

  getTransactionType = (type: string) => {
    if (type) {
      if (
        [
          CM.SUMSUB.TRANSACTION_TYPE.FIAT_DEPOSIT,
          CM.SUMSUB.TRANSACTION_TYPE.FIAT_WITHDRAW,
        ].includes(type)
      ) {
        return CM.ENUM.TRANSACTION_TYPE.FIAT.toLowerCase();
      } else {
        return CM.ENUM.TRANSACTION_TYPE.CRYPTO.toLowerCase();
      }
    }
  };

  getTransactionTypeDB = (type: string) => {
    if (type) {
      if (
        [
          CM.SUMSUB.TRANSACTION_TYPE.FIAT_DEPOSIT,
          CM.SUMSUB.TRANSACTION_TYPE.FIAT_WITHDRAW,
        ].includes(type)
      ) {
        return CM.ENUM.TRANSACTION_TYPE.FIAT;
      } else {
        return CM.ENUM.TRANSACTION_TYPE.CRYPTO;
      }
    }
  };

  findLevelName = (type: string) => {
    return type === 'company'
      ? CM.SUMSUB.SUMSUB_LEVEL.BUSINESS
      : type === 'individual'
      ? CM.SUMSUB.SUMSUB_LEVEL.INDIVIDUAL
      : CM.SUMSUB.SUMSUB_LEVEL.INDIVIDUAL;
  };

  buildTransactionRequestObj = async (requestPayload: any) => {
    if (requestPayload) {
      const {
        type,
        applicant,
        counterParty,
        info,
        txnId,
        coin,
        toAddress,
        fromAddress,
      } = requestPayload;

      const applicantDetail = await kycHelper.findKycLog({
        userId: applicant?.externalUserId,
      });

      applicant.type =
        applicantDetail?.accountType === 'BUSINESS'
          ? 'company'
          : CM.SUMSUB.USER_TYPE.INDIVIDUAL.toLowerCase();

      applicant.fullName = applicant.fullName
        ? applicant.fullName
        : applicantDetail?.accountType === 'BUSINESS'
        ? applicantDetail?.businessName
        : applicantDetail?.accountType === 'INDIVIDUAL'
        ? applicantDetail?.firstName + ' ' + applicantDetail?.lastName
        : applicant?.externalUserId;

      const endPayload = {
        levelName: this.findLevelName(applicant.type),
        txnId: txnId !== undefined ? txnId : this.generateTxnId(),
        type: 'finance',
        applicant: {
          ...applicant,
          paymentMethod: {
            type: this.getTransactionType(type),
            accountId: fromAddress,
          },
        },
        counterparty: {
          ...counterParty,
          type: CM.SUMSUB.USER_TYPE.INDIVIDUAL,
          paymentMethod: {
            type: this.getTransactionType(type),
            accountId: toAddress,
          },
        },
        info: {
          ...info,
          direction: this.getTransactionDirection(type),
          currencyType: this.getTransactionType(type),
        },
      };
      console.log(`END PAYLOAD::`, endPayload);
      return endPayload;
    }
  };

  buildFiatRequestPayload = async (requestPayload: any) => {
    if (requestPayload) {
      const { type, applicant, counterParty, info, txnId } = requestPayload;

      const applicantDetail = await kycHelper.findKycLog({
        userId: applicant?.externalUserId,
      });

      applicant.type =
        applicantDetail?.accountType === 'BUSINESS'
          ? 'company'
          : CM.SUMSUB.USER_TYPE.INDIVIDUAL.toLowerCase();

      applicant.fullName = applicant?.fullName
        ? applicant.fullName
        : applicantDetail?.accountType === 'BUSINESS'
        ? applicantDetail?.businessName
        : applicantDetail?.accountType === 'INDIVIDUAL'
        ? applicantDetail?.firstName + ' ' + applicantDetail?.lastName
        : applicant?.externalUserId;

      const endPayload = {
        levelName: this.findLevelName(applicant.type),
        txnId: txnId ? txnId : this.generateTxnId(),
        type: 'finance',
        applicant: {
          ...applicant,
          paymentMethod: {
            type: this.getTransactionType(type),
            accountId: applicant.externalUserId,
          },
        },
        counterparty: {
          ...counterParty,
          type: CM.SUMSUB.USER_TYPE.INDIVIDUAL,
          paymentMethod: {
            type: this.getTransactionType(type),
            accountId: counterParty.externalUserId,
          },
        },
        info: {
          ...info,
          direction: this.getTransactionDirection(type),
          currencyType: this.getTransactionType(type),
        },
      };

      console.log('END PAYLOAD:', endPayload);

      return endPayload;
    }
  };

  handleCryptoDepositValidate = (body: any) => {
    if (
      !body.type ||
      !body?.applicant?.externalUserId ||
      !body?.counterParty?.externalUserId ||
      !body?.info?.amount ||
      !body?.info?.currencyCode ||
      !body?.typeId
    ) {
      return false;
    } else {
      return true;
    }
  };

  submitDepositTransationForApproval = async (
    call: any,
    callback: Function
  ) => {
    let commonResponse: any = {};
    let { currencyCode, amount } = call.request.info;
    let trxStatus: string = CM.ENUM.TRANSACTION_STATUS.PENDING;

    try {
      const isTypeIdExist = await kycHelper.findKytLog({
        typeId: call.request.typeId,
      });

      if (isTypeIdExist) {
        commonResponse = {
          message: CM.KYC_PROFILE.VALIDATIONS.TRANSACTION_ALREADY_SUBMITTED,
          data: {},
        };
      }

      const isValid = this.handleCryptoDepositValidate(call.request);

      if (!isValid) {
        throw {
          field: CM.REQUEST,
          message: CM.INVALID_REQUEST,
        };
      } else {
        const payload = await this.buildTransactionRequestObj(call.request);

        let logPayload: any = {
          score: 0,
          txnStatus: CM.ENUM.TRANSACTION_STATUS.PENDING,
          userId: call?.request?.applicant?.externalUserId,
          txnId: payload?.txnId,
          txnType: call.request?.type,
          trxPayload: call?.request?.trxPayload || '',
          typeId: call?.request?.typeId || null,
          type: this.getTransactionTypeDB(call?.request?.type),
          coinName: currencyCode.toLowerCase() || null,
          coinNetwork: call?.request?.network.toLowerCase() || null,
          amount: amount || null,
          clientId: call?.request?.clientId || null,
          wasSuspicious: false,
          fromAddress: call?.request?.fromAddress || null,
          toAddress: call?.request?.toAddress || null,
          coinSymbol: call?.request?.coin.toLowerCase() || null,
        };

        await kycHelper.createKytLog(logPayload);

        const response = await kycHelper.submitTransaction(payload);

        if (response && typeof response.review !== 'undefined') {
          let { reviewStatus } = response.review;

          trxStatus = this.handleSumsubKYTStatus(
            reviewStatus,
            response?.review?.reviewResult?.reviewAnswer
          );

          let transaction = this.buildSubmitTransactionResponse(
            response,
            trxStatus
          );

          let findKytPayload = {
            typeId: call?.request?.typeId,
            txnId: payload?.txnId,
          };

          await kycHelper.findKytLog(findKytPayload).then(async (kytData) => {
            if (kytData) {
              logPayload = {
                ...logPayload,
                score: response?.score,
                txnStatus: trxStatus,
                applicantId: response?.applicantId,
                sumsubResponse: JSON.stringify(response),
                wasSuspicious:
                  trxStatus !== CM.ENUM.TRANSACTION_STATUS.APPROVED
                    ? true
                    : false,
                kytStatus: trxStatus,
              };

              const isUpdated = await kycHelper.updateKytLog(
                logPayload,
                kytData?.txnId
              );

              if (!isUpdated) {
                throw {
                  field: CM.KYC_PROFILE.VALIDATIONS.TRANSACTION,
                  message: CM.KYC_PROFILE.VALIDATIONS.TRANSACTION_SAVE_FAILURE,
                };
              }

              commonResponse = {
                message: CM.KYC_PROFILE.VALIDATIONS.TRANSACTION_SUBMITTED,
                data: { transaction },
              };

              callback(
                null,
                Helpers.ResponseHelper.grpcSuccess(commonResponse)
              );
            }
          });
        }
      }
    } catch (error: any) {
      console.log('SUBMIT DEPOSIT TRANSACTION ERROR:', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({
          error: {
            field: error.code ? error.code.toString() : error.field,
            message: error.description ? error.description : error.message,
          } as GenericError,
        })
      );
    }
  };

  handleWithdrawValidate = (body: any) => {
    if (
      !body.type ||
      !body?.applicant?.externalUserId ||
      !body?.counterParty?.externalUserId ||
      !body?.info?.amount ||
      !body?.info?.currencyCode ||
      !body?.clientId
    ) {
      return false;
    } else {
      return true;
    }
  };

  handleWithdrawTransactionCreateValidation = (body: any) => {
    if (
      !body.type ||
      !body?.applicant?.externalUserId ||
      !body?.counterParty?.externalUserId ||
      !body?.info?.amount ||
      !body?.info?.currencyCode ||
      !body?.score ||
      !body.sumsubData ||
      !body?.coin ||
      !body?.clientId
    ) {
      return false;
    } else {
      return true;
    }
  };

  handleSumsubKYTStatus = (reviewStatus: string, reviewAnswer: string) => {
    let status = CM.ENUM.TRANSACTION_STATUS.PENDING;
    let sumsubInReviewStatusArr = [
      'onHold',
      'awaitingUser',
      'init',
      'pending',
      'queued',
    ];

    if (reviewStatus === 'completed' && reviewAnswer === 'GREEN') {
      status = CM.ENUM.TRANSACTION_STATUS.APPROVED;
    } else if (reviewStatus === 'completed' && reviewAnswer === 'RED') {
      status = CM.ENUM.TRANSACTION_STATUS.REJECTED;
    } else if (sumsubInReviewStatusArr.includes(reviewStatus)) {
      status = CM.ENUM.TRANSACTION_STATUS.IN_REVIEW;
    }
    return status;
  };

  submitWithdrawTransationForApproval = async (
    call: any,
    callback: Function
  ) => {
    try {
      let commonResponse: any = {};
      let logPayload: any = {};
      let trxStatus: string = '';
      let { txnId } = call.request;
      const typeId = call?.request?.typeId;

      console.log('REQUEST OBJECT WITHDRAW:', call.request, 'TYPE ID:', typeId);

      if (typeof typeId !== 'undefined' && typeId !== '') {
        console.log('CASE WHEN TYPEID IS NOT EMPTY');

        const { sumsubData } = call.request;
        let sumsubParsedData = JSON.parse(sumsubData);
        let { reviewStatus } = sumsubParsedData.review;

        trxStatus = this.handleSumsubKYTStatus(
          reviewStatus,
          sumsubParsedData?.review?.reviewResult?.reviewAnswer
        );

        console.log('FINAL KYT STATUS:', trxStatus);

        logPayload = {
          typeId: typeId,
          txnStatus: trxStatus,
        };

        const isUpdated = await kycHelper.updateKytLog(logPayload, txnId);

        if (!isUpdated) {
          throw {
            field: CM.ERROR,
            message: CM.KYC_PROFILE.VALIDATIONS.TRANSACTION_UPDATED_FAILURE,
          };
        }

        commonResponse = {
          message: CM.KYC_PROFILE.VALIDATIONS.TRANSACTION_UPDATED,
          data: {},
        };

        callback(null, Helpers.ResponseHelper.grpcSuccess(commonResponse));
      } else {
        console.log('WHEN TYPEID IS EMPTY');

        let { currencyCode } = call.request.info;
        let { network, coin } = call.request;

        const isValid = this.handleWithdrawValidate(call.request);

        if (!isValid) {
          throw {
            field: CM.REQUEST,
            message: CM.INVALID_REQUEST,
          };
        }

        const payload = await this.buildTransactionRequestObj(call.request);

        const response = await kycHelper.submitTransaction(payload);

        if (response && typeof response.review !== 'undefined') {
          let { reviewStatus } = response.review;

          trxStatus = this.handleSumsubKYTStatus(
            reviewStatus,
            response?.review?.reviewResult?.reviewAnswer
          );

          console.log('FINAL KYT STATUS:', trxStatus);

          logPayload = {
            score: response?.score,
            txnStatus: CM.ENUM.TRANSACTION_STATUS.FAILED,
            userId: call?.request?.applicant?.externalUserId,
            txnId: payload?.txnId,
            txnType: call.request?.type,
            type: this.getTransactionTypeDB(call?.request?.type),
            applicantId: response?.applicantId,
            sumsubResponse: JSON.stringify(response),
            coinName: currencyCode.toLowerCase() || null,
            coinNetwork: network.toLowerCase() || null,
            amount: call?.request?.info?.amount || null,
            clientId: call?.request?.clientId,
            wasSuspicious:
              trxStatus === CM.ENUM.TRANSACTION_STATUS.APPROVED ? false : true,
            fromAddress: call?.request?.fromAddress || '',
            toAddress: call?.request?.toAddress || '',
            coinSymbol: coin.toLowerCase(),
            kytStatus: trxStatus,
          };

          const isCreated = await kycHelper.createKytLog(logPayload);

          if (!isCreated) {
            throw {
              field: CM.ERROR,
              message: CM.KYC_PROFILE.VALIDATIONS.TRANSACTION_SAVE_FAILURE,
            };
          }

          commonResponse = {
            message: CM.KYC_PROFILE.VALIDATIONS.TRANSACTION_SUBMITTED,
            data: {
              transaction: {
                transactionScore: response.score.toString(),
                transactionApprovalStatus: trxStatus,
                transactionCreatedAt: response.createdAt,
                sumsubData: JSON.stringify(response),
                txnId: response?.data?.txnId?.toString(),
              },
            },
          };

          callback(null, Helpers.ResponseHelper.grpcSuccess(commonResponse));
        }
      }
    } catch (error: any) {
      console.log('GRPC SUBMIT WITHDRAW TRANSACTION ERROR:', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({
          error: {
            field: error.code ? error.code.toString() : error.field,
            message: error.description ? error.description : error.message,
          } as GenericError,
        })
      );
    }
  };

  validateKytPayload = (body: any) => {
    if (!body?.status || !body.typeId) {
      return false;
    } else {
      return true;
    }
  };

  updateKytLogStatus = async (call: any, callback: Function) => {
    let commonResponse;
    let requestedPayload;
    try {
      const { typeId, status } = call.request;
      const isValidData = this.validateKytPayload(call.request);

      if (!isValidData) {
        throw {
          field: CM.REQUEST,
          message: CM.INVALID_REQUEST,
        };
      } else {
        requestedPayload = {
          typeId: typeId,
        };

        const kytLog = await kycHelper.findKytLog(requestedPayload);

        if (kytLog && kytLog.txnStatus === status) {
          commonResponse = {
            message: CM.KYC_PROFILE.VALIDATIONS.KYT_STATUS_UPDATE_SUCCESS,
            data: {},
          };
          callback(null, Helpers.ResponseHelper.grpcSuccess(commonResponse));
        } else {
          const isKytLogUpdated = await kycHelper.updateKytLogByTypeId(
            { txnStatus: status },
            typeId
          );
          if (!isKytLogUpdated) {
            console.log('ERROR IN UPDATING TXN STATUS ON ADMIN REQUEST');
            throw {
              field: CM.SOMETHING_WENT_WRONG,
              message: CM.ERROR_IN_PERFORMING_OPERATION,
            };
          } else {
            commonResponse = {
              message: CM.KYC_PROFILE.VALIDATIONS.KYT_STATUS_UPDATE_SUCCESS,
              data: {},
            };
            callback(null, Helpers.ResponseHelper.grpcSuccess(commonResponse));
          }
        }
      }
    } catch (error: any) {
      console.log('GRPC SUBMIT TRANSACTION ERROR:', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  checkKytTrxStatus = async (call: any, callback: Function) => {
    let commonResponse;
    let requestedPayload;
    try {
      const { typeId } = call.request;

      if (!typeId) {
        throw {
          field: CM.REQUEST,
          message: CM.INVALID_REQUEST,
        };
      } else {
        requestedPayload = {
          typeId: typeId,
        };
        const kytLog = await kycHelper.findKytLog(requestedPayload);

        if (kytLog) {
          const commonResponse = {
            message: CM.KYC_PROFILE.VALIDATIONS.KYT_STATUS_UPDATE_SUCCESS,
            data: { status: kytLog.txnStatus },
          };
          callback(null, Helpers.ResponseHelper.grpcSuccess(commonResponse));
        } else {
          throw {
            field: CM.REQUEST,
            message: CM.SOMETHING_WENT_WRONG,
          };
        }
      }
    } catch (error: any) {
      console.log('GRPC CHECK KYT TRANSACTION STATUS ERROR:', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  fiatTransactionValidate = (body: any) => {
    if (
      !body.type ||
      !body?.applicant?.externalUserId ||
      !body?.counterParty?.externalUserId ||
      !body?.info?.amount ||
      !body?.info?.currencyCode
    ) {
      return false;
    } else {
      return true;
    }
  };

  submitFiatTransaction = async (call: any, callback: Function) => {
    try {
      let commonResponse: any = {};
      const transactionRequest = call.request;
      let trxStatus: string = CM.ENUM.TRANSACTION_STATUS.PENDING;

      const isValid = this.fiatTransactionValidate(transactionRequest);

      if (!isValid) {
        throw {
          field: CM.REQUEST,
          message: CM.INVALID_REQUEST,
        };
      }

      const payload = await this.buildFiatRequestPayload(transactionRequest);

      const response = await kycHelper.submitTransaction(payload);

      if (!response && typeof response?.review === 'undefined') {
        throw {
          field: CM.KYC_PROFILE.VALIDATIONS.TRANSACTION,
          message: CM.KYC_PROFILE.VALIDATIONS.TRANSACTION_NOT_SUBMITTED,
        };
      }

      let { reviewStatus } = response?.review;

      trxStatus = this.handleSumsubKYTStatus(
        reviewStatus,
        response?.review?.reviewResult?.reviewAnswer
      );

      console.log('FINAL KYT STATUS:', trxStatus);

      const createTransactionPayload = {
        score: response?.score,
        txnStatus: trxStatus,
        userId: call?.request?.applicant?.externalUserId,
        txnId: response?.data?.txnId,
        applicantId: response?.applicantId,
        txnType: call.request?.type,
        type: this.getTransactionTypeDB(call?.request?.type),
        sumsubResponse: JSON.stringify(response),
        coinName: call?.request?.info?.currencyCode.toLowerCase() || null,
        coinSymbol: call?.request?.info?.currencyCode.toLowerCase() || null,
        amount: call?.request?.info?.amount || null,
        wasSuspicious:
          trxStatus !== CM.ENUM.TRANSACTION_STATUS.APPROVED ? true : false,
        fromAddress: call?.request?.applicant?.externalUserId || null,
        toAddress: call?.request?.counterParty?.externalUserId || null,
        kytStatus: trxStatus,
      };

      const isCreated = await kycHelper.createKytLog(createTransactionPayload);

      if (!isCreated) {
        throw {
          field: CM.ERROR,
          message: CM.KYC_PROFILE.VALIDATIONS.TRANSACTION_SAVE_FAILURE,
        };
      }

      commonResponse = {
        message: CM.KYC_PROFILE.VALIDATIONS.TRANSACTION_SUBMITTED,
        data: {
          transaction: {
            transactionScore: createTransactionPayload.score,
            transactionApprovalStatus: createTransactionPayload.txnStatus,
            txnId: createTransactionPayload.txnId,
          },
        },
      };
      callback(null, Helpers.ResponseHelper.grpcSuccess(commonResponse));
    } catch (error) {
      console.log('FIAT TRANSACTION ERROR:', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };

  validateFiatTxn = (payload: any) => {
    if (!payload.txnId || !payload.status) {
      return false;
    } else {
      return true;
    }
  };

  updatefiatTxn = async (call: any, callback: Function) => {
    let updatePayload = {};
    const transactionRequest = call.request;

    try {
      const isValid = this.validateFiatTxn(transactionRequest);

      if (!isValid) {
        throw {
          field: CM.REQUEST,
          message: CM.INVALID_REQUEST,
        };
      }

      const txnDetail: any = await kycHelper.findKytLog({
        txnId: transactionRequest.txnId,
      });

      let isLogUpdated = false;
      let commonResponse: any = {};

      if (txnDetail && txnDetail.txnStatus !== transactionRequest?.status) {
        updatePayload = {
          txnStatus: transactionRequest?.status,
        };
        isLogUpdated = await kycHelper.updateKytLog(
          updatePayload,
          transactionRequest.txnId
        );
        commonResponse = {
          message: CM.KYC_PROFILE.VALIDATIONS.TRANSACTION_UPDATED,
          data: {},
        };
      } else {
        throw {
          field: CM.ERROR,
          message: CM.INVALID_REQUEST,
        };
      }

      callback(null, Helpers.ResponseHelper.grpcSuccess(commonResponse));
    } catch (error) {
      console.log('GRPC UPDATE FIAT TRANSACTION ERROR : ', error);
      callback(
        null,
        Helpers.ResponseHelper.grpcError400({ error: error as GenericError })
      );
    }
  };
}

export { UserServiceHelper };
