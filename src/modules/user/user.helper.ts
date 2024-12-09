import * as Model from '../../models';
import { WhereOptions, Transaction } from '../../models';
import * as UserInterface from './user.interface';
import { rabitMqHelper } from '../../helpers';
import * as CM from '../../constant/response';
import * as moment from 'moment';
class UserHelper {
  getOtpRow = async (payload: WhereOptions<UserInterface.OTP_ROW_PAYLOAD>) => {
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

  createNewOtpRow = async (
    payload: UserInterface.CREATE_OTP_PAYLOAD,
    initTransaciton: Transaction
  ) => {
    try {
      console.log('CREATE NEW OTP ROW', payload);
      return await Model.Otp.create(payload, { transaction: initTransaciton })
        .then(() => {
          return true;
        })
        .catch((error) => {
          throw error;
        });
    } catch (error) {
      console.log('ERROR IN CREATE NEW OTP::', error);
      return false;
    }
  };

  updateOtp = async (
    findRowPayload: WhereOptions<UserInterface.OTP_ROW_PAYLOAD>,
    updatedPayload: UserInterface.UPDATE_OTP_PAYLOAD,
    initTransaciton: Transaction
  ) => {
    try {
      return await Model.Otp.update(updatedPayload, {
        where: findRowPayload,
        transaction: initTransaciton,
      })
        .then((result: number[]) => {
          if (result[0] == 0) {
            return false;
          } else {
            return true;
          }
        })
        .catch((error) => {
          throw error;
        });
    } catch (error) {
      console.log('ERROR IN UPDATE OTP::', error);
      return false;
    }
  };

  updateUserRow = async (
    findRowPayload: WhereOptions<UserInterface.UPDATE_USER_ROW_PAYLOAD>,
    updatedPayload: UserInterface.UPDATE_USER_PAYLOAD,
    initTransaciton?: Transaction
  ) => {
    try {
      console.log('INSIDE UPDATE USER ROW::');
      console.log('FINS', findRowPayload, updatedPayload);

      const result = await Model.User.update(updatedPayload, {
        where: findRowPayload,
        transaction: initTransaciton,
      });
      console.log('UPDATE USER ROW RESULT::', result);
      if (result[0] == 0) {
        return false;
      } else {
        return true;
      }
    } catch (error) {
      console.log('ERROR IN UPDATE USER ROW::', error);
      return false;
    }
  };

  destroyOtp = async (
    findRowPayload: WhereOptions<UserInterface.DESTROY_OTP_PAYLOAD>,
    initTransaciton: Transaction
  ) => {
    try {
      return await Model.Otp.destroy({
        where: findRowPayload,
        transaction: initTransaciton,
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

  getUserRow = async (
    payload: WhereOptions<UserInterface.FIND_USER_ROW_PAYLOAD>
  ) => {
    try {
      const userRow = await Model.User.findOne({
        where: payload,
        raw: true,
      });
      return userRow;
    } catch (error) {
      console.log('ERROR IN GET USER ROW::', error);
      return false;
    }
  };

  createUserRow = async (
    payload: UserInterface.CREATE_USER_PAYLOAD,
    initTransaction: Transaction
  ) => {
    try {
      console.log('CREATE NEW USER ROW', payload);
      return await Model.User.create(payload, { transaction: initTransaction })
        .then((res) => {
          const userRow = res.get({ plain: true });
          return userRow;
        })
        .catch((error) => {
          throw error;
        });
    } catch (error) {
      console.log('ERROR IN CREATE USER ROW::', error);
      return false;
    }
  };

  createUserSessionRow = async (
    payload: UserInterface.CREATE_USER_SESSION_ROW_PAYLOAD,
    initTransaction: Transaction
  ) => {
    try {
      return await Model.UserSession.create(payload, {
        transaction: initTransaction,
      })
        .then(() => {
          return true;
        })
        .catch((error) => {
          throw error;
        });
    } catch (error) {
      console.log('ERROR IN CREATE USER SESSION::', error);
      return false;
    }
  };

  getUserSessionRow = async (
    payload: WhereOptions<UserInterface.GET_USER_SESSION_ROW_PAYLOAD>
  ) => {
    try {
      const userRow = await Model.UserSession.findOne({
        where: payload,
        raw: true,
      });
      return userRow;
    } catch (error) {
      console.log('ERROR IN GET USER SESSION ROW::', error);
      return false;
    }
  };

  updateUserSessionRow = async (
    findRowPayload: WhereOptions<UserInterface.SEARCH_USER_SESSION_ROW_PAYLOAD>,
    updatedPayload: UserInterface.UPDATE_USER_SESSION_ROW_PAYLOAD,
    initTransaciton: Transaction
  ) => {
    try {
      return await Model.UserSession.update(updatedPayload, {
        where: findRowPayload,
        transaction: initTransaciton,
      })
        .then((result: number[]) => {
          if (result[0] == 0) {
            return false;
          } else {
            return true;
          }
        })
        .catch((error) => {
          throw error;
        });
    } catch (error) {
      console.log('ERROR IN UPDATE USER SESSION ROW::', error);
      return false;
    }
  };

  destroyUserSession = async (
    findRowPayload: WhereOptions<UserInterface.DESTROY_USER_SESSION_PAYLOAD>,
    initTransaction: Transaction
  ) => {
    try {
      return await Model.UserSession.destroy({
        where: findRowPayload,
        transaction: initTransaction,
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
      console.log('ERROR IN DESTROY USER SESSION::', error);
      return false;
    }
  };

  // send email/sms/notification

  notifyUser = async (queueName: string, payload: any) => {
    try {
      console.log('NOTIFY USER PAYLOAD::', payload);
      await rabitMqHelper.sendToqueue(queueName, payload);
      // await kafkaProducer.connect();
      // await kafkaProducer.send(payload.topicName, [payload]);
      // await kafkaProducer.disconnect();
      return true;
    } catch (error) {
      console.log('ERROR IN NOTIFY USER::', error);
      return false;
    }
  };

  verifyUser = async (email: string) => {
    try {
      console.log('VERIFY USER PAYLOAD::', email);
      await Model.User.findOne({ where: { email: email }, raw: true }).then(
        (row) => {
          if (row) {
            if (row.isDeleted) {
              console.log('USER DELETEDD');
              throw {
                field: CM.API_RESPONSE.ERROR_FIELD.INVALID_REQUEST,
                message: CM.API_RESPONSE.MESSAGE.ERROR.INVALID_REQUEST,
              };
            }
            if (row.isBlocked) {
              console.log('USER BLOCKED');
              // const errorMessage =
              //   Helpers.utilitiesHelper.replaceStringPlaceholder(
              //     CM.API_RESPONSE.MESSAGE.ERROR.USER_BLOCKED,
              //     'reason',
              //     `${row.reasonToBlockUser}`
              //   );
              throw {
                field: CM.API_RESPONSE.ERROR_FIELD.USER_BLOCKED,
                message: CM.API_RESPONSE.MESSAGE.ERROR.USER_BLOCKED,
              };
            }
            if (row.status === CM.ENUM.USER_STATUS.INACTIVE) {
              console.log('USER INACTIVE');
              throw {
                field: CM.API_RESPONSE.ERROR_FIELD.INVALID_REQUEST,
                message: CM.API_RESPONSE.MESSAGE.ERROR.INVALID_REQUEST,
              };
            }
          }
        }
      );
    } catch (error) {
      console.log('ERROR IN VERIFY USER::', error);
      throw error;
    }
  };

  createSupportTicket = async (
    payload: UserInterface.CREATE_SUPPORT_TICKET_PAYLOAD
  ) => {
    try {
      console.log('CREATE NEW USER ROW', payload);
      return await Model.SupportTickets.create(payload)
        .then((res) => {
          const supportTicket = res.get({ plain: true });
          return supportTicket;
        })
        .catch((error) => {
          throw error;
        });
    } catch (error) {
      console.log('ERROR IN CREATE USER ROW::', error);
      return false;
    }
  };

  isOtpExpired = async (updatedAt: Date) => {
    try {
      console.log('CM EXRTA TIME::', CM.OTP_EXPIRE_TIME);
      const dbOtpCreationTimeUnix =
        moment(updatedAt).utc().unix() + Number(CM.OTP_EXPIRE_TIME);
      const currentDate = new Date();
      const expireTimeUnix = moment(currentDate).utc().unix();
      console.log('DMB:', dbOtpCreationTimeUnix, 'CURRENT::', expireTimeUnix);
      if (expireTimeUnix > dbOtpCreationTimeUnix) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.log('ERROR IN IS OTP EXPIRED::', error);
      return true;
    }
  };
}
export default new UserHelper();
