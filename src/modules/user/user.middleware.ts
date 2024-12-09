import * as express from 'express';
import * as Model from '../../models';
import { Transaction } from '../../models';
import * as UserInterface from './user.interface';
import * as Helpers from '../../helpers';
import * as CM from '../../constant/response';
import userHelper from './user.helper';
import * as SpeakEasy from 'speakeasy';
import { GeneratedSecret } from 'speakeasy';
import * as qrcode from 'qrcode';
import { ResponseHelper } from '../../helpers';
import clientHelper from '../grpc/client.helper';
import {
  GenericError,
  GetCommonResponse,
} from '../../interfaces/responses.interface';
import * as moment from 'moment';
const setResponse = ResponseHelper;

class userMiddleware {
  // user registration

  isSocialRegistration = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      console.log('REQUEST PAYLOAD::', request.body);
      console.log('REQUEST PARAMS::', request.params);
      const requestPayload: UserInterface.REGISTRATION_REQUEST_PAYLOAD =
        request.body;
      request.body.activityTitle = 'New user registered';
      if (requestPayload.socialRegistrationVia && requestPayload.socialId) {
        // if (
        //   ![
        //     CM.ENUM.SOCIAL_ID.APPLE,
        //     CM.ENUM.SOCIAL_ID.FACEBOOK,
        //     CM.ENUM.SOCIAL_ID.GOOGLE,
        //   ].includes(requestPayload.socialRegistrationVia)
        // ) {
        //   throw {
        //     field: CM.API_RESPONSE.ERROR_FIELD.INVALID_SOCIAL_ID,
        //     message: CM.API_RESPONSE.MESSAGE.ERROR.INVALID_SOCIAL_ID_TYPE,
        //   };
        // }
        let socialRegistrationPayload = {};
        switch (requestPayload.socialRegistrationVia) {
          case CM.ENUM.SOCIAL_ID.APPLE:
            socialRegistrationPayload = {
              appleId: requestPayload.socialId,
            };
            break;
          case CM.ENUM.SOCIAL_ID.FACEBOOK:
            socialRegistrationPayload = {
              facebookId: requestPayload.socialId,
            };
            break;
          case CM.ENUM.SOCIAL_ID.GOOGLE:
            socialRegistrationPayload = {
              googleId: requestPayload.socialId,
            };
            break;
        }
        request.body.socialRegistrationPayload = socialRegistrationPayload;
        request.body.isSocialRegistration = true;
      } else {
        request.body.isSocialRegistration = false;
      }
      next();
    } catch (error) {
      console.log('ERROR IN IS SOCIAL REGISTRATION ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  isUserAlreadyExist = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const requestPayload: UserInterface.REGISTRATION_REQUEST_PAYLOAD =
        request.body;

      const userRow = await userHelper.getUserRow({
        email: requestPayload.email,
      });

      request.body.isUserAlreadyRegistered = false;

      if (userRow) {
        await userHelper.verifyUser(userRow.email);
        request.body.isUserAlreadyRegistered = true;
        request.body.accountType = userRow.accountType;
        request.body.nationality = userRow.nationality;
        request.body.userId = userRow.userId;
        request.body.phoneNumber = userRow.phoneNumber;
        request.body.clientId = userRow.clientId;
      }

      if (requestPayload.isSocialRegistration) {
        const isSocialIdExist = await userHelper.getUserRow(
          requestPayload.socialRegistrationPayload
        );

        request.body.isSocialIdAlreadyExist = false;
        if (isSocialIdExist) {
          request.body.isSocialIdAlreadyExist = true;
        } else {
          if (userRow) {
            let isUserBindWithOtherId = false;
            switch (requestPayload.socialRegistrationVia) {
              case CM.ENUM.SOCIAL_ID.GOOGLE:
                if (userRow.googleId) {
                  isUserBindWithOtherId = true;
                }
                break;
              case CM.ENUM.SOCIAL_ID.APPLE:
                if (userRow.appleId) {
                  isUserBindWithOtherId = true;
                }
                break;
              case CM.ENUM.SOCIAL_ID.FACEBOOK:
                if (userRow.facebookId) {
                  isUserBindWithOtherId = true;
                }
                break;
            }

            if (isUserBindWithOtherId) {
              throw {
                field: CM.API_RESPONSE.ERROR_FIELD.ACCOUNT_BIND_WITH_SOCIAL_ID,
                message: CM.API_RESPONSE.MESSAGE.ERROR.BIND_WITH_OTHER_SOCIALID,
              };
            }
          }
        }
      }
      next();
    } catch (error) {
      console.log('ERROR IN IS USER ALREADY EXIST ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  isAlreadySocialRegistered = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction: Transaction = await Model.sequelize.transaction();
    try {
      const requestPayload: UserInterface.REGISTRATION_REQUEST_PAYLOAD =
        request.body;
      request.body.initTransaction = initTransaction;

      if (requestPayload.isSocialRegistration) {
        if (requestPayload.isUserAlreadyRegistered) {
          const socialRegistrationRow = await userHelper.getUserRow({
            ...requestPayload.socialRegistrationPayload,
            email: requestPayload.email,
          });
          if (!socialRegistrationRow) {
            if (requestPayload.isSocialIdAlreadyExist) {
              throw {
                field: CM.API_RESPONSE.ERROR_FIELD.USER_EXIST,
                message: CM.API_RESPONSE.MESSAGE.USER_ALREADY_EXIST,
              };
            }
            const updateUserRowPayload = {
              ...requestPayload.socialRegistrationPayload,
              socialLoginVia: requestPayload.socialRegistrationVia,
            };
            const isUserRowUpdated: boolean = await userHelper.updateUserRow(
              { email: requestPayload.email },
              updateUserRowPayload,
              initTransaction
            );
            if (!isUserRowUpdated) {
              throw {
                field: CM.API_RESPONSE.ERROR_FIELD.REGISTRATION_FAILED,
                message: CM.API_RESPONSE.MESSAGE.ERROR.REGISTRATION_FAILED,
              };
            }
          }
          next();
        } else {
          if (requestPayload.isSocialIdAlreadyExist) {
            throw {
              field: CM.API_RESPONSE.ERROR_FIELD.ACCOUNT_BIND_WITH_SOCIAL_ID,
              message:
                CM.API_RESPONSE.MESSAGE.ERROR.SOCIAL_ID_BIND_WITH_OTHER_ACCOUNT,
            };
          }
          next();
        }
      } else {
        // normal registration
        if (!requestPayload.isUserAlreadyRegistered) {
          next();
        } else {
          throw {
            field: CM.API_RESPONSE.ERROR_FIELD.USER_EXIST,
            message: CM.API_RESPONSE.MESSAGE.USER_ALREADY_EXIST,
          };
        }
      }
    } catch (error) {
      console.log('ERROR IN IS ALREADY SOCIAL REGISTERED ::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  newSocialRegistration = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction: Transaction = request.body.initTransaction;
    try {
      const requestPayload: UserInterface.REGISTRATION_REQUEST_PAYLOAD =
        request.body;
      const referralCode = Helpers.utilitiesHelper
        .generateRandomString(8)
        ?.toLocaleUpperCase();
      request.body.referralUserCode = referralCode;
      let responsePayload: GetCommonResponse;
      if (requestPayload.isSocialRegistration) {
        if (!requestPayload.isUserAlreadyRegistered) {
          console.log('USER FIRST TIME SOCIAL REGISTRATION');
          const randomPassword = Helpers.utilitiesHelper.generateRandomString(
            CM.CONSTANT.RANDOM_PASSWORD.LENGTH
          );
          const passwordHash: string | boolean =
            await Helpers.utilitiesHelper.generateSHA256(randomPassword);
          if (passwordHash) {
            const userRegistrationPayload = {
              password: passwordHash,
              ...requestPayload.socialRegistrationPayload,
              email: requestPayload.email,
              phoneNumber: requestPayload.phoneNumber,
              deviceId: requestPayload.deviceId,
              mobilePin: requestPayload.mobilePin,
              deviceType: requestPayload.deviceType,
              isEmailVerified: true,
              referralCode: referralCode,
              countryCode: requestPayload.countryCode,
            };

            const newUserRow = await userHelper.createUserRow(
              userRegistrationPayload,
              initTransaction
            );
            if (!newUserRow) {
              throw {
                field: CM.API_RESPONSE.ERROR_FIELD.REGISTRATION_FAILED,
                message: CM.API_RESPONSE.MESSAGE.ERROR.REGISTRATION_FAILED,
              };
            }
            request.body.userId = newUserRow.userId;
          }
        }
        console.log('BEFORE TOKEN');
        const { accessJwt, refreshJwt } =
          await Helpers.utilitiesHelper.generateJwt(
            {
              userId: request.body.userId,
              email: requestPayload.email,
              nationality: request.body.nationality
                ? request.body.nationality
                : '',
              accountType: request.body.accountType
                ? request.body.accountType
                : '',
              phoneNumber: request.body.phoneNumber
                ? request.body.phoneNumber
                : '',
              clientId: request.body.clientId ? request.body.clientId : '',
            },
            true
          );

        const loginAt = new Date().toISOString();
        const updateLastLogin = await userHelper.updateUserRow(
          { userId: request.body.userId },
          { lastLoginAt: loginAt },
          initTransaction
        );
        if (!updateLastLogin) {
          console.log('ERROR IN UPDATE LAST LOGIN IN REGISTRATION::');
          throw {
            field: CM.API_RESPONSE.ERROR_FIELD.REGISTRATION_FAILED,
            message: CM.API_RESPONSE.MESSAGE.ERROR.REGISTRATION_FAILED,
          };
        }
        responsePayload = {
          message: CM.API_RESPONSE.MESSAGE.SUCCESS.REGISTRATION_SUCCESS,
          data: { userToken: accessJwt, refreshToken: refreshJwt },
        };
        request.body.accessToken = accessJwt;
        request.body.refreshToken = refreshJwt;
        request.body.result = responsePayload;
        next();
      } else {
        next();
      }
    } catch (error) {
      console.log('ERROR IN NEW SOCIAL REGISTRATION ::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  isUserEmailVerified = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const requestPayload: UserInterface.REGISTRATION_REQUEST_PAYLOAD =
        request.body;
      if (!requestPayload.isSocialRegistration) {
        const searchOtpRowPayload = {
          email: requestPayload.email,
          method: CM.ENUM.OTP_METHOD.EMAIL,
          service: CM.ENUM.OTP_SERVICE.REGISTRATION,
          status: true,
        };
        const isEmailVerificationRow = await userHelper.getOtpRow(
          searchOtpRowPayload
        );
        if (isEmailVerificationRow) {
          next();
        } else {
          throw {
            field: CM.API_RESPONSE.ERROR_FIELD.EMAIL_NOT_VERIFIED,
            message: CM.API_RESPONSE.MESSAGE.EMAIL_NOT_VERIFIED,
          };
        }
      } else {
        next();
      }
    } catch (error) {
      console.log('ERROR IN IS USER EMAIL VERIFIED ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  isUserPhoneVerified = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const requestPayload: UserInterface.REGISTRATION_REQUEST_PAYLOAD =
        request.body;
      console.log('REQUEST PAYLOAD::', requestPayload);
      if (!requestPayload.isSocialRegistration) {
        const searchOtpRowPayload = {
          phoneNumber: requestPayload.phoneNumber,
          method: CM.ENUM.OTP_METHOD.SMS,
          service: CM.ENUM.OTP_SERVICE.REGISTRATION,
          status: true,
        };
        const isPhoneVerificationRow = await userHelper.getOtpRow(
          searchOtpRowPayload
        );
        if (isPhoneVerificationRow) {
          next();
        } else {
          throw {
            field: CM.API_RESPONSE.ERROR_FIELD.PHONE_NOT_VERIFIED,
            message: CM.API_RESPONSE.MESSAGE.PHONE_NOT_VERFIED,
          };
        }
      } else {
        next();
      }
    } catch (error) {
      console.log('ERROR IN IS USER EMAIL VERIFIED ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  registerUser = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction: Transaction = request.body.initTransaction;
    try {
      const requestPayload: UserInterface.REGISTRATION_REQUEST_PAYLOAD =
        request.body;
      let responsePayload: GetCommonResponse;
      if (!requestPayload.isSocialRegistration) {
        const passwordHash: string | boolean =
          await Helpers.utilitiesHelper.generateSHA256(requestPayload.password);

        if (passwordHash) {
          const userRegistrationPayload = {
            email: requestPayload.email,
            phoneNumber: requestPayload.phoneNumber,
            password: passwordHash,
            mobilePin: requestPayload.mobilePin,
            deviceId: requestPayload.deviceId,
            deviceType: requestPayload.deviceType,
            referralCode: requestPayload.referralUserCode,
            countryCode: requestPayload.countryCode,
          };
          const newUserRow = await userHelper.createUserRow(
            userRegistrationPayload,
            initTransaction
          );
          if (newUserRow) {
            const { accessJwt, refreshJwt } =
              await Helpers.utilitiesHelper.generateJwt(
                {
                  userId: newUserRow.userId,
                  email: requestPayload.email,
                  nationality: request.body.nationality
                    ? request.body.nationality
                    : '',
                  accountType: request.body.accountType
                    ? request.body.accountType
                    : '',
                  phoneNumber: request.body.phoneNumber
                    ? request.body.phoneNumber
                    : '',
                  clientId: request.body.clientId ? request.body.clientId : '',
                },
                true
              );
            console.log('JWT::', accessJwt, refreshJwt);
            if (accessJwt && refreshJwt) {
              const destroyOtpPayload = {
                email: requestPayload.email,
                method: CM.ENUM.OTP_METHOD.EMAIL,
                service: CM.ENUM.OTP_SERVICE.REGISTRATION,
              };
              const destroyRegistrationOtp: boolean =
                await userHelper.destroyOtp(destroyOtpPayload, initTransaction);
              if (!destroyRegistrationOtp) {
                throw {
                  field: CM.API_RESPONSE.ERROR_FIELD.REGISTRATION_FAILED,
                  message: CM.API_RESPONSE.MESSAGE.ERROR.REGISTRATION_FAILED,
                };
              }
              const loginAt = new Date().toISOString();
              const lastLoginAt = await userHelper.updateUserRow(
                { userId: newUserRow.userId },
                { lastLoginAt: loginAt, isEmailVerified: true },
                initTransaction
              );
              if (!lastLoginAt) {
                console.log('ERROR LAST LOGIN UPDATE');
                throw {
                  field: CM.API_RESPONSE.ERROR_FIELD.REGISTRATION_FAILED,
                  message: CM.API_RESPONSE.MESSAGE.ERROR.REGISTRATION_FAILED,
                };
              }
              responsePayload = {
                message: CM.API_RESPONSE.MESSAGE.SUCCESS.REGISTRATION_SUCCESS,
                data: { userToken: accessJwt, refreshToken: refreshJwt },
                field: CM.API_RESPONSE.SUCCESS_FIELD.REGISTRATION_SUCCESS,
              };
              request.body.accessToken = accessJwt;
              request.body.refreshToken = refreshJwt;
              request.body.userId = newUserRow.userId;
              request.body.result = responsePayload;
            } else {
              console.log('JWT NOT GENERATED::');
              throw {
                field: CM.API_RESPONSE.ERROR_FIELD.REGISTRATION_FAILED,
                message: CM.API_RESPONSE.MESSAGE.ERROR.REGISTRATION_FAILED,
              };
            }
          } else {
            throw {
              field: CM.API_RESPONSE.ERROR_FIELD.REGISTRATION_FAILED,
              message: CM.API_RESPONSE.MESSAGE.ERROR.REGISTRATION_FAILED,
            };
          }
        } else {
          throw {
            field: CM.API_RESPONSE.ERROR_FIELD.ERROR,
            message: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
          };
        }
      }
      // notify user
      if (!requestPayload.isUserAlreadyRegistered) {
        let notifyUserPayload = {
          subject: CM.NOTIFICATION.EMAIL.WELCOME.SUBJECT,
          title: CM.NOTIFICATION.EMAIL.WELCOME.TITLE,
          body: CM.NOTIFICATION.EMAIL.WELCOME.BODY,
          to: requestPayload.email,
          template: CM.NOTIFICATION.EMAIL.WELCOME.TEMPLATE,
        };
        await userHelper.notifyUser(
          CM.RABBIT_MQ.QUEUE.USER_EMAILS,
          notifyUserPayload
        );
      }
      next();
    } catch (error) {
      console.log('ERROR IN REGISTER USER::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  // user login
  isSocialLogin = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      console.log('REQUEST PAYLOAD::', request.body);
      console.log('REQUEST PARAMS::', request.params);
      const requestPayload: UserInterface.LOGIN_REQUEST_PAYLOAD = request.body;

      if (requestPayload.socialLoginVia && requestPayload.socialId) {
        console.log('SOCIAL LOGIN TRUE');
        // if (
        //   ![
        //     CM.ENUM.SOCIAL_ID.APPLE,
        //     CM.ENUM.SOCIAL_ID.FACEBOOK,
        //     CM.ENUM.SOCIAL_ID.GOOGLE,
        //   ].includes(requestPayload.socialLoginVia)
        // ) {
        //   throw {
        //     field: CM.API_RESPONSE.ERROR_FIELD.INVALID_SOCIAL_ID,
        //     message: CM.API_RESPONSE.MESSAGE.ERROR.INVALID_SOCIAL_ID_TYPE,
        //   };
        // }
        let socialLoginPayload = {};
        switch (requestPayload.socialLoginVia) {
          case CM.ENUM.SOCIAL_ID.APPLE:
            socialLoginPayload = {
              appleId: requestPayload.socialId,
            };
            break;
          case CM.ENUM.SOCIAL_ID.FACEBOOK:
            socialLoginPayload = {
              facebookId: requestPayload.socialId,
            };
            break;
          case CM.ENUM.SOCIAL_ID.GOOGLE:
            socialLoginPayload = {
              googleId: requestPayload.socialId,
            };
            break;
        }
        request.body.socialLoginPayload = socialLoginPayload;
        request.body.isSocialLogin = true;
        next();
      } else {
        console.log('SOCIAL LOGIN FALSE');
        request.body.isSocialLogin = false;
        next();
      }
    } catch (error) {
      console.log('ERROR IN IS SOCIAL LOGIN ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  isUserExist = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction = await Model.sequelize.transaction();
    try {
      const requestPayload: UserInterface.LOGIN_REQUEST_PAYLOAD = request.body;
      request.body.initTransaction = initTransaction;
      const userRow = await userHelper.getUserRow({
        email: requestPayload.email,
      });

      if (userRow) {
        await userHelper.verifyUser(userRow.email);
        if (requestPayload.socialLoginVia && requestPayload.socialId) {
          const isSocialIdExist = await userHelper.getUserRow(
            requestPayload.socialLoginPayload
          );

          if (isSocialIdExist) {
            console.log('SOCIAL ID EXIST');
            const getUserRowPayload = {
              email: requestPayload.email,
              ...requestPayload.socialLoginPayload,
            };
            const isSocialIdBindWithEmail = await userHelper.getUserRow(
              getUserRowPayload
            );
            console.log('SOCIAL ID BIND WITH EMAIL', isSocialIdBindWithEmail);
            if (!isSocialIdBindWithEmail) {
              throw {
                field: CM.API_RESPONSE.ERROR_FIELD.LOGIN_FAILED,
                message: CM.API_RESPONSE.MESSAGE.ERROR.LOGIN_FAILED,
              };
            }
          } else {
            let isUserBindWithOtherId = false;
            switch (requestPayload.socialLoginVia) {
              case CM.ENUM.SOCIAL_ID.GOOGLE:
                if (userRow.googleId) {
                  isUserBindWithOtherId = true;
                }
                break;
              case CM.ENUM.SOCIAL_ID.APPLE:
                if (userRow.appleId) {
                  isUserBindWithOtherId = true;
                }
                break;
              case CM.ENUM.SOCIAL_ID.FACEBOOK:
                if (userRow.facebookId) {
                  isUserBindWithOtherId = true;
                }
                break;
            }

            console.log('IS USER BIND WITH ID', isUserBindWithOtherId);
            if (isUserBindWithOtherId) {
              throw {
                field: CM.API_RESPONSE.ERROR_FIELD.ACCOUNT_BIND_WITH_SOCIAL_ID,
                message: CM.API_RESPONSE.MESSAGE.ERROR.BIND_WITH_OTHER_SOCIALID,
              };
            }
            console.log('SOCIAL ID NOT EXIST');
            const updateUserRowPayload = {
              ...requestPayload.socialLoginPayload,
              socialLoginVia: requestPayload.socialLoginVia,
            };
            const isUserRowUpdated: boolean = await userHelper.updateUserRow(
              { email: requestPayload.email },
              updateUserRowPayload,
              initTransaction
            );
            console.log('IS USER ROW UPDATE::', isUserRowUpdated);
            if (!isUserRowUpdated) {
              throw {
                field: CM.API_RESPONSE.ERROR_FIELD.LOGIN_FAILED,
                message: CM.API_RESPONSE.MESSAGE.ERROR.LOGIN_FAILED,
              };
            }
          }
        }
        request.body.userRow = userRow;
        request.body.userId = userRow.userId;
        next();
      } else {
        throw {
          field: CM.API_RESPONSE.FIELD.EMAIL,
          message: CM.API_RESPONSE.MESSAGE.ERROR.INVALID_CREDENTIAL,
        };
      }
    } catch (error) {
      console.log('ERROR IN IS USER EXIST ::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  login = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    console.log('INSIDE LOGIN');
    const initTransaction: Transaction = request.body.initTransaction;
    try {
      request.body.activityTitle = 'User loggedIn';
      const requestPayload: UserInterface.LOGIN_REQUEST_PAYLOAD = request.body;
      let responsePayload: GetCommonResponse;
      const userRow = request.body.userRow;
      if (!requestPayload.isSocialLogin) {
        console.log('NORMAL LOGIN::');
        const isPasswordMatch: boolean =
          await Helpers.utilitiesHelper.comparePassword(
            requestPayload.password,
            userRow.password
          );
        if (!isPasswordMatch) {
          throw {
            field: CM.API_RESPONSE.ERROR_FIELD.INVALID_CREDENTIAL,
            message: CM.API_RESPONSE.MESSAGE.ERROR.INVALID_CREDENTIAL,
          };
        }
      }

      const { accessJwt, refreshJwt } =
        await Helpers.utilitiesHelper.generateJwt(
          {
            userId: userRow.userId,
            email: requestPayload.email,
            nationality: userRow.nationality ? userRow.nationality : '',
            accountType: userRow.accountType ? userRow.accountType : '',
            phoneNumber: userRow.phoneNumber ? userRow.phoneNumber : '',
            clientId: userRow.clientId ? userRow.clientId : '',
          },
          true
        );

      const loginAt = new Date().toISOString();
      let updateLastLogin = await userHelper.updateUserRow(
        { userId: userRow.userId },
        { lastLoginAt: loginAt },
        initTransaction
      );
      console.log('UPDATE LAST LOGINLL', updateLastLogin);
      if (!updateLastLogin) {
        console.log('ERROR WHILE UPDATE LAST LOGIN::');
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.LOGIN_FAILED,
          message: CM.API_RESPONSE.MESSAGE.ERROR.LOGIN_FAILED,
        };
      }
      responsePayload = {
        message: CM.API_RESPONSE.MESSAGE.SUCCESS.LOGIN_SUCCESS,
        data: {
          userToken: accessJwt,
          refreshToken: refreshJwt,
          mobilePin: userRow.mobilePin,
          google2FaStatus: userRow.google2FaStatus,
          mpinStatus: userRow.mpinStatus,
          smsStatus: userRow.smsStatus,
          emailStatus: userRow.emailStatus,
        },
        field: CM.API_RESPONSE.SUCCESS_FIELD.LOGIN_SUCCESS,
      };
      request.body.accessToken = accessJwt;
      request.body.refreshToken = refreshJwt;
      request.body.result = responsePayload;
      next();
    } catch (error) {
      console.log('ERROR IN USER LOGIN ::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  // send 2FA code

  isEmailLogin = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction: Transaction = request.body.initTransaction;
    try {
      const userRow = request.body.userRow;

      if (userRow.emailStatus) {
        const otp = await Helpers.utilitiesHelper.createOTP();
        if (otp) {
          const otpPayload: UserInterface.SEND_2FA_VERIFICATION_CODE_PAYLOAD = {
            userId: userRow.userId,
            method: CM.ENUM.OTP_METHOD.EMAIL,
            service: CM.ENUM.OTP_SERVICE.LOGIN_2FA_VERIFICATION,
            otp: otp,
            status: false,
            email: userRow.email,
          };

          // const notifyUserPayload = {
          //   topicName: CM.KAFKA.COMMON_TOPICS.USER_EMAILS,
          //   code: CM.KAFKA.NOTIFICATION_CODES[
          //     `${otpPayload.service}_EMAIL` as keyof typeof CM.KAFKA.NOTIFICATION_CODES
          //   ],
          //   data: {
          //     to: userRow.email,
          //     otp: otp,
          //   },
          // };

          let notifyUserPayload = {
            queueName: CM.RABBIT_MQ.QUEUE.USER_EMAILS,
            payload: {
              subject: CM.NOTIFICATION.EMAIL.LOGIN_2FA_VERIFICATION.SUBJECT,
              body: CM.NOTIFICATION.EMAIL.LOGIN_2FA_VERIFICATION.BODY,
              to: userRow.email,
              template: CM.NOTIFICATION.EMAIL.LOGIN_2FA_VERIFICATION.TEMPLATE,
            },
          };

          request.body.otpPayload = otpPayload;
          request.body.notifyUserPayload = notifyUserPayload;
          request.body.otp = otp;
          next();
        } else {
          throw {
            field: CM.API_RESPONSE.ERROR_FIELD.ERROR,
            message: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
          };
        }
      } else {
        next();
      }
    } catch (error) {
      console.log('ERROR IN IS EMAIL OTP ::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  isSmsLogin = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction: Transaction = request.body.initTransaction;
    try {
      const userRow = request.body.userRow;
      if (userRow.smsStatus) {
        const otp = await Helpers.utilitiesHelper.createOTP();
        if (otp) {
          const otpPayload: UserInterface.SEND_2FA_VERIFICATION_CODE_PAYLOAD = {
            userId: userRow.userId,
            method: CM.ENUM.OTP_METHOD.SMS,
            service: CM.ENUM.OTP_SERVICE.LOGIN_2FA_VERIFICATION,
            otp: otp,
            status: false,
            phoneNumber: userRow.phoneNumber,
          };

          // const notifyUserPayload = {
          //   topicName: CM.KAFKA.COMMON_TOPICS.USER_SMS,
          //   code: CM.KAFKA.NOTIFICATION_CODES[
          //     `${otpPayload.service}_SMS` as keyof typeof CM.KAFKA.NOTIFICATION_CODES
          //   ],
          //   data: {
          //     to: userRow.phoneNumber,
          //     otp: otp,
          //   },
          // };

          let notifyUserPayload = {
            queueName: CM.RABBIT_MQ.QUEUE.USER_SMS,
            payload: {
              subject: CM.NOTIFICATION.SMS.LOGIN_2FA_VERIFICATION.SUBJECT,
              body: CM.NOTIFICATION.SMS.LOGIN_2FA_VERIFICATION.BODY,
              to: userRow.phoneNumber,
              template: CM.NOTIFICATION.SMS.LOGIN_2FA_VERIFICATION.TEMPLATE,
            },
          };

          request.body.otpPayload = otpPayload;
          request.body.notifyUserPayload = notifyUserPayload;
          request.body.otp = otp;
          next();
        } else {
          throw {
            field: CM.API_RESPONSE.ERROR_FIELD.ERROR,
            message: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
          };
        }
      } else {
        next();
      }
    } catch (error) {
      console.log('ERROR IN IS EMAIL OTP ::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  sendLoginOtp = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction: Transaction = request.body.initTransaction;
    try {
      const userRow = request.body.userRow;

      const otp = request.body.otp;
      if (otp && (userRow.emailStatus || userRow.smsStatus)) {
        console.log('EMAIL OR SMS LOGIN::');
        const otpPayload: UserInterface.SEND_2FA_VERIFICATION_CODE_PAYLOAD =
          request.body.otpPayload;
        const notifyUserPayload: any = request.body.notifyUserPayload;
        const otpUpdatePayload = {
          userId: userRow.userId,
          service: CM.ENUM.OTP_SERVICE.LOGIN_2FA_VERIFICATION,
        };
        const otpRow = await userHelper.getOtpRow(otpUpdatePayload);
        if (otpRow) {
          console.log('LOGIN OTP ROW FOUND::');
          const destroyOtp: boolean = await userHelper.destroyOtp(
            otpUpdatePayload,
            initTransaction
          );
          if (!destroyOtp) {
            throw {
              field: CM.API_RESPONSE.ERROR_FIELD.ERROR,
              message: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
            };
          }
        }

        const createOtpRow: boolean = await userHelper.createNewOtpRow(
          otpPayload,
          initTransaction
        );
        if (createOtpRow) {
          await userHelper.notifyUser(
            notifyUserPayload.queueName,
            notifyUserPayload.payload
          );
          next();
        } else {
          throw {
            field: CM.API_RESPONSE.ERROR_FIELD.ERROR,
            message: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
          };
        }
      } else {
        next();
      }
    } catch (error) {
      console.log('ERROR IN IS EMAIL OTP ::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  // send otp
  checkUserDetail = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      console.log('REQUEST PAYLOAD::', request.body);
      console.log('REQUEST PARAMS::', request.params);
      const requestPayload: UserInterface.SEND_OTP_REQUEST_PAYLOAD =
        request.body;

      const otp: string | boolean = '123456';
      let userRowPayload = {};
      if (requestPayload.method === CM.ENUM.OTP_METHOD.EMAIL) {
        userRowPayload = { email: requestPayload.email };
      }
      if (requestPayload.method === CM.ENUM.OTP_METHOD.SMS) {
        userRowPayload = { phoneNumber: requestPayload.phoneNumber };
      }
      // await Helpers.utilitiesHelper.createOTP();
      request.body.otp = otp;
      if (requestPayload.service === CM.ENUM.OTP_SERVICE.REGISTRATION) {
        const userRow = await userHelper.getUserRow(userRowPayload);
        if (userRow) {
          throw {
            field: CM.API_RESPONSE.ERROR_FIELD.USER_EXIST,
            message: CM.API_RESPONSE.MESSAGE.USER_ALREADY_EXIST,
          };
        } else {
          next();
        }
      } else if (requestPayload.service === CM.ENUM.OTP_SERVICE.FORGOT_MPIN) {
        console.log('USER ROW PAYLOAD::', userRowPayload);
        const userRow = await userHelper.getUserRow(userRowPayload);
        if (userRow) {
          next();
        } else {
          throw {
            field: CM.API_RESPONSE.ERROR_FIELD.USER_NOT_EXIST,
            message: CM.API_RESPONSE.MESSAGE.ERROR.USER_NOT_FOUND,
          };
        }
      } else {
        next();
      }
    } catch (error) {
      console.log('ERROR IN CHECK USER DETAIL ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  sendEmailOtp = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const requestPayload: UserInterface.SEND_OTP_REQUEST_PAYLOAD =
        request.body;
      if (requestPayload.method === CM.ENUM.OTP_METHOD.EMAIL) {
        request.body.saveOtpPayload = {
          email: requestPayload.email,
          method: requestPayload.method,
          service: requestPayload.service,
        };

        // let notifyUserPayload = {
        //   topicName: CM.KAFKA.COMMON_TOPICS.USER_EMAILS,
        //   code: CM.KAFKA.NOTIFICATION_CODES[
        //     `${requestPayload.service}_EMAIL` as keyof typeof CM.KAFKA.NOTIFICATION_CODES
        //   ],
        //   data: {
        //     to: requestPayload.email,
        //     otp: requestPayload.otp,
        //   },
        // };

        const notification =
          CM.NOTIFICATION.EMAIL[
            requestPayload.service as keyof typeof CM.NOTIFICATION.EMAIL
          ];
        let notifyUserPayload = {
          queueName: CM.RABBIT_MQ.QUEUE.USER_EMAILS,
          payload: {
            subject: notification.SUBJECT,
            body: notification.BODY,
            to: requestPayload.email,
            template: notification.TEMPLATE,
          },
        };
        console.log('NOTIFY USER PAYLOAD::', notifyUserPayload);
        request.body.notifyUserPayload = notifyUserPayload;

        next();
      } else {
        next();
      }
    } catch (error) {
      console.log('ERROR IN IS EMAIL OTP ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  sendPhoneOtp = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const requestPayload: UserInterface.SEND_OTP_REQUEST_PAYLOAD =
        request.body;

      if (requestPayload.method === CM.ENUM.OTP_METHOD.SMS) {
        request.body.saveOtpPayload = {
          phoneNumber: requestPayload.phoneNumber,
          method: requestPayload.method,
          service: requestPayload.service,
        };
        // let notifyUserPayload = {
        //   topicName: CM.KAFKA.COMMON_TOPICS.USER_SMS,
        //   code: CM.KAFKA.NOTIFICATION_CODES[
        //     `${requestPayload.service}_SMS` as keyof typeof CM.KAFKA.NOTIFICATION_CODES
        //   ],
        //   data: {
        //     to: requestPayload.phoneNumber,
        //     otp: requestPayload.otp,
        //   },
        // };

        const notification =
          CM.NOTIFICATION.SMS[
            requestPayload.service as keyof typeof CM.NOTIFICATION.SMS
          ];
        let notifyUserPayload = {
          queueName: CM.RABBIT_MQ.QUEUE.USER_SMS,
          payload: {
            body: notification.BODY,
            to: requestPayload.phoneNumber,
          },
        };
        request.body.notifyUserPayload = notifyUserPayload;

        next();
      } else {
        next();
      }
    } catch (error) {
      console.log('ERROR IN IS PHONE OTP ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  saveOrUpdateOtp = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction: Transaction = await Model.sequelize.transaction();
    try {
      const requestPayload: UserInterface.SEND_OTP_REQUEST_PAYLOAD =
        request.body;
      let responsePayload: GetCommonResponse;

      if (requestPayload.otp) {
        const otpRow = await userHelper.getOtpRow(request.body.saveOtpPayload);
        if (otpRow) {
          // update otp row
          const updateOtp: boolean = await userHelper.updateOtp(
            request.body.saveOtpPayload,
            {
              otp: requestPayload.otp,
              status: false,
            },
            initTransaction
          );
          if (!updateOtp) {
            throw {
              field: CM.API_RESPONSE.ERROR_FIELD.OTP_NOT_SENT,
              message: CM.API_RESPONSE.MESSAGE.ERROR.FAILED_TO_SEND_OTP,
            };
          }
        } else {
          console.log('CREATE NEW OTP::');
          // create new otp row
          const saveOtpPayload = {
            ...request.body.saveOtpPayload,
            otp: requestPayload.otp,
            status: false,
          };
          console.log('SAVE OTP', saveOtpPayload);
          const saveOtp: boolean = await userHelper.createNewOtpRow(
            saveOtpPayload,
            initTransaction
          );
          if (!saveOtp) {
            throw {
              field: CM.API_RESPONSE.ERROR_FIELD.OTP_NOT_SENT,
              message: CM.API_RESPONSE.MESSAGE.ERROR.FAILED_TO_SEND_OTP,
            };
          }
        }
        console.log('NOTIFICATION PAYLOAD::', request.body.notifyUserPayload);

        await userHelper.notifyUser(
          request.body.notifyUserPayload.queueName,
          request.body.notifyUserPayload.payload
        );
        responsePayload = {
          message: CM.API_RESPONSE.MESSAGE.SUCCESS.OTP_SENT_SUCCESS,
          data: {},
          field: CM.API_RESPONSE.SUCCESS_FIELD.OTP_SENT,
        };
        await initTransaction.commit();
        request.body.result = responsePayload;
        next();
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.OTP_NOT_SENT,
          message: CM.API_RESPONSE.MESSAGE.ERROR.FAILED_TO_SEND_OTP,
        };
      }
    } catch (error) {
      console.log('ERROR IN SAVE OR UPDATE OTP ::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  // verify OTP

  verifyUserDetail = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      console.log('REQUEST PAYLOAD::', request.body);
      console.log('REQUEST PARAMS::', request.params);
      const requestPayload: UserInterface.VERIFY_OTP_REQUEST_PAYLOAD =
        request.body;
      if (requestPayload.service === CM.ENUM.OTP_SERVICE.REGISTRATION) {
        const userRow = await userHelper.getUserRow({
          email: requestPayload.email,
        });
        if (userRow) {
          throw {
            field: CM.API_RESPONSE.ERROR_FIELD.USER_EXIST,
            message: CM.API_RESPONSE.MESSAGE.USER_ALREADY_EXIST,
          };
        } else {
          next();
        }
      } else {
        next();
      }
    } catch (error) {
      console.log('ERROR IN CHECK USER DETAIL ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  checkVerificationMethod = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const requestPayload: UserInterface.VERIFY_OTP_REQUEST_PAYLOAD =
        request.body;
      if (requestPayload.method === CM.ENUM.OTP_METHOD.EMAIL) {
        request.body.verifyOtpPayload = {
          email: requestPayload.email,
          method: requestPayload.method,
          service: requestPayload.service,
          otp: requestPayload.otp,
        };
        next();
      } else if (requestPayload.method === CM.ENUM.OTP_METHOD.SMS) {
        request.body.verifyOtpPayload = {
          phoneNumber: requestPayload.phoneNumber,
          method: requestPayload.method,
          service: requestPayload.service,
          otp: requestPayload.otp,
        };
        next();
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.ERROR,
          messgae: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
        };
      }
    } catch (error) {
      console.log('ERROR IN CHECK VERIFICATION METHOD ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  isOtpExpired = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      console.log('VERIFY OTP PAYLOAD::', request.body.verifyOtpPayload);
      const verifyOtpRow = await userHelper.getOtpRow(
        request.body.verifyOtpPayload
      );
      if (verifyOtpRow) {
        const dbOtpCreationTimeUnix =
          moment(verifyOtpRow.updatedAt).utc().unix() +
          Number(CM.OTP_EXPIRE_TIME);

        const currentDate = new Date();
        const expireTimeUnix = moment(currentDate).utc().unix();
        console.log('DMB:', dbOtpCreationTimeUnix, 'CURRENT::', expireTimeUnix);
        if (expireTimeUnix > dbOtpCreationTimeUnix) {
          throw {
            field: CM.API_RESPONSE.ERROR_FIELD.OTP_EXPIRED,
            message: CM.API_RESPONSE.MESSAGE.ERROR.OTP_EXPIRED,
          };
        } else {
          next();
        }
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.INCORRECT_OTP,
          message: CM.API_RESPONSE.MESSAGE.ERROR.INCORRECT_OTP,
        };
      }
    } catch (error) {
      console.log('ERROR IN IS OTP EXPIRED ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  verifyOtp = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction: Transaction = await Model.sequelize.transaction();
    try {
      let responsePayload: GetCommonResponse;

      console.log('VERIFY OTP PAYLOAD::', request.body.verifyOtpPayload);
      const updateOtp: boolean = await userHelper.updateOtp(
        request.body.verifyOtpPayload,
        { status: true },
        initTransaction
      );
      if (!updateOtp) {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.ERROR,
          message: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
        };
      }
      responsePayload = {
        message: CM.API_RESPONSE.MESSAGE.SUCCESS.OTP_VERIFY_SUCCESS,
        data: {},
        field: CM.API_RESPONSE.SUCCESS_FIELD.OTP_VERIFIED,
      };
      await initTransaction.commit();
      request.body.result = responsePayload;

      next();
    } catch (error) {
      console.log('ERROR IN VERIFY OTP ::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  // reset password

  isEmailExist = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      console.log('REQUEST PAYLOAD::', request.body);
      console.log('REQUEST PARAMS::', request.params);
      const requestPayload: UserInterface.RESET_PASSWORD_REQUEST_PAYLOAD =
        request.body;

      const userRow = await userHelper.getUserRow({
        email: requestPayload.email,
      });
      if (userRow) {
        request.body.userRow = userRow;
        next();
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.USER_NOT_EXIST,
          message: CM.API_RESPONSE.MESSAGE.ERROR.USER_NOT_FOUND,
        };
      }
    } catch (error) {
      console.log('ERROR IN IS EMAIL EXIST ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  isForgotPasswordEmailVerified = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const requestPayload: UserInterface.RESET_PASSWORD_REQUEST_PAYLOAD =
        request.body;
      const searchOtpRowPayload = {
        email: requestPayload.email,
        method: CM.ENUM.OTP_METHOD.EMAIL,
        service: CM.ENUM.OTP_SERVICE.FORGOT_PASSWORD,
        status: true,
      };
      const isEmailVerificationRow = await userHelper.getOtpRow(
        searchOtpRowPayload
      );
      if (isEmailVerificationRow) {
        next();
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.OTP_NOT_VERIFIED,
          message: CM.API_RESPONSE.MESSAGE.ERROR.OTP_NOT_VERIFIED,
        };
      }
    } catch (error) {
      console.log('ERROR IN IS USER EMAIL EXIST ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  updatePassword = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction: Transaction = await Model.sequelize.transaction();
    try {
      request.body.activityTitle = 'Reset password attempt';
      const requestPayload: UserInterface.RESET_PASSWORD_REQUEST_PAYLOAD =
        request.body;
      const userRow = request.body.userRow;
      let responsePayload: GetCommonResponse;

      const isPasswordSameAsOldPassword =
        await Helpers.utilitiesHelper.comparePassword(
          requestPayload.newPassword,
          userRow.password
        );
      if (isPasswordSameAsOldPassword) {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.PASSWORD_IN_USE,
          message: CM.API_RESPONSE.MESSAGE.ERROR.PASSWORD_ALREADY_IN_USE,
        };
      }
      const passwordHash: string | boolean =
        await Helpers.utilitiesHelper.generateSHA256(
          requestPayload.newPassword
        );
      if (passwordHash) {
        const updatePassword: boolean = await userHelper.updateUserRow(
          { email: requestPayload.email },
          { password: passwordHash },
          initTransaction
        );
        if (updatePassword) {
          const destroyOtpPayload = {
            email: requestPayload.email,
            method: CM.ENUM.OTP_METHOD.EMAIL,
            service: CM.ENUM.OTP_SERVICE.FORGOT_PASSWORD,
          };
          const destroyOtp: boolean = await userHelper.destroyOtp(
            destroyOtpPayload,
            initTransaction
          );
          if (!destroyOtp) {
            throw {
              field: CM.API_RESPONSE.ERROR_FIELD.ERROR,
              message: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
            };
          }
          responsePayload = {
            message: CM.API_RESPONSE.MESSAGE.SUCCESS.PASSWORD_UPDATED_SUCCESS,
            data: {},
          };
          await initTransaction.commit();
          request.body.result = responsePayload;

          next();
        } else {
          throw {
            field: CM.API_RESPONSE.FIELD.PASSWORD,
            message: CM.API_RESPONSE.MESSAGE.ERROR.FAILER_TO_UPDATE_PASSWORD,
          };
        }
      }
    } catch (error) {
      console.log('ERROR IN IS UPDATE PASSWORD ::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  // forgot password

  forgotPassword = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction: Transaction = await Model.sequelize.transaction();
    try {
      request.body.activityTitle = 'Forget password';
      const requestPayload: UserInterface.FORGOT_PASSWORD_REQUEST_PAYLOAD =
        request.body;
      let responsePayload: GetCommonResponse;
      // const otp = await Helpers.utilitiesHelper.createOTP();
      const otp = '123456';
      if (otp) {
        const otpPayload = {
          email: requestPayload.email,
          method: CM.ENUM.OTP_METHOD.EMAIL,
          service: CM.ENUM.OTP_SERVICE.FORGOT_PASSWORD,
        };
        const otpRow = await userHelper.getOtpRow(otpPayload);
        if (otpRow) {
          // update otp row
          const updateOtp: boolean = await userHelper.updateOtp(
            otpPayload,
            {
              otp: otp,
              status: false,
            },
            initTransaction
          );
          if (!updateOtp) {
            throw {
              field: CM.API_RESPONSE.ERROR_FIELD.OTP_NOT_SENT,
              message: CM.API_RESPONSE.MESSAGE.ERROR.FAILED_TO_SEND_OTP,
            };
          }
        } else {
          // create new otp row
          const saveOtpPayload = {
            ...otpPayload,
            otp: otp,
            status: false,
          };
          const saveOtp: boolean = await userHelper.createNewOtpRow(
            saveOtpPayload,
            initTransaction
          );
          if (!saveOtp) {
            throw {
              field: CM.API_RESPONSE.ERROR_FIELD.OTP_NOT_SENT,
              message: CM.API_RESPONSE.MESSAGE.ERROR.FAILED_TO_SEND_OTP,
            };
          }
        }
        let notifyUserPayload = {
          subject: CM.NOTIFICATION.EMAIL.FORGOT_PASSWORD.SUBJECT,
          body: CM.NOTIFICATION.EMAIL.FORGOT_PASSWORD.BODY,
          to: request.body.email,
          template: CM.NOTIFICATION.EMAIL.FORGOT_PASSWORD.TEMPLATE,
        };
        await userHelper.notifyUser(
          CM.RABBIT_MQ.QUEUE.USER_EMAILS,
          notifyUserPayload
        );

        responsePayload = {
          message: CM.API_RESPONSE.MESSAGE.SUCCESS.OTP_SENT_SUCCESS,
          data: {},
          field: CM.API_RESPONSE.SUCCESS_FIELD.OTP_SENT,
        };
        await initTransaction.commit();
        request.body.result = responsePayload;
        next();
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.OTP_NOT_SENT,
          message: CM.API_RESPONSE.MESSAGE.ERROR.FAILED_TO_SEND_OTP,
        };
      }
    } catch (error) {
      console.log('ERROR IN FORGOT PASSWORD ::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  // change password

  verifyOldMpin = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const requestPayload: UserInterface.CHANGE_MPIN_REQUEST_PAYLOAD =
        request.body;
      if (requestPayload.oldMobilePin === requestPayload.newMobilePin) {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.SAME_MPIN,
          message: CM.API_RESPONSE.MESSAGE.ERROR.MPIN_CANNOT_BE_SAME,
        };
      }

      if (requestPayload.oldMobilePin === request.body.userRow.mobilePin) {
        next();
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.INCORRECT_OLD_PASSWORD,
          message: CM.API_RESPONSE.MESSAGE.ERROR.INCORRECT_OLD_PIN,
        };
      }
    } catch (error) {
      console.log('ERROR IN  OLD PIN ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  changePassword = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction: Transaction = await Model.sequelize.transaction();
    try {
      request.body.activityTitle = 'Password changed successully from mobile';
      const requestPayload: UserInterface.CHANGE_PASSWORD_REQUEST_PAYLOAD =
        request.body;
      let responsePayload: GetCommonResponse;
      const passwordHash: string | boolean =
        await Helpers.utilitiesHelper.generateSHA256(
          requestPayload.newPassword
        );
      if (passwordHash) {
        console.log('EMAIL::', request.body.userRow.email);
        const updatePassword: boolean = await userHelper.updateUserRow(
          { email: request.body.userRow.email },
          { password: passwordHash },
          initTransaction
        );
        if (updatePassword) {
          responsePayload = {
            message: CM.API_RESPONSE.MESSAGE.SUCCESS.PASSWORD_UPDATED_SUCCESS,
            data: {},
            field: CM.API_RESPONSE.SUCCESS_FIELD.PASSWORD_UPDATED,
          };
          await initTransaction.commit();
          request.body.result = responsePayload;
          next();
        } else {
          throw {
            field: CM.API_RESPONSE.ERROR_FIELD.PASSWORD_UPDATE_FAILED,
            message: CM.API_RESPONSE.MESSAGE.ERROR.FAILER_TO_UPDATE_PASSWORD,
          };
        }
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.ERROR,
          message: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
        };
      }
    } catch (error) {
      console.log('ERROR IN CHANGE PASSWORD ::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  // get user profile

  getUserProfile = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      console.log('GET USER PROFILE REQUEST PAYLOAD::');
      const userId = request.userInfo.userId;
      let responsePayload: GetCommonResponse;
      const userRow = await Model.User.findOne({
        where: { userId: userId },
        attributes: {
          exclude: [
            'id',
            'password',
            'socialLoginVia',
            'appleId',
            'googleId',
            'facebookId',
            'isEmailVerified',
            'middleName',
            'gender',
            'city',
            'postalCode',
            'dateOfBirth',
            'isDeleted',
            'google2FaSecret',
            'deviceType',
            'deviceId',
          ],
        },
        raw: true,
      });
      if (userRow) {
        responsePayload = {
          message: CM.API_RESPONSE.MESSAGE.SUCCESS.RECORD_FOUND,
          data: userRow,
        };
        request.body.result = responsePayload;
        next();
      } else {
        throw {
          field: CM.API_RESPONSE.FIELD.PROFILE,
          message: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
        };
      }
    } catch (error) {
      console.log('ERROR IN GET USER PROFILE ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  // get page by slug

  getMarketingContent = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      console.log('GET MARKETING CONTENT REQUEST PAYLOAD::');
      let responsePayload: GetCommonResponse;
      const pages = await clientHelper.getMarketingContent();
      console.log('PAGES::', pages);

      if (pages && pages?.data?.list?.length) {
        responsePayload = {
          message: CM.API_RESPONSE.MESSAGE.SUCCESS.RECORD_FOUND,
          data: pages.data.list,
        };
      } else {
        responsePayload = {
          message: CM.API_RESPONSE.MESSAGE.NO_RECORD_FOUND,
          data: [],
        };
      }
      request.body.result = responsePayload;
      next();
    } catch (error) {
      console.log('ERROR IN GET MARKETING CONTENT ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  getMarketingBanners = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      console.log('GET MARKETING BANNERS REQUEST PAYLOAD::');
      let responsePayload: GetCommonResponse;
      const { limit, offset, type } = request.params;
      if (
        ![CM.ENUM.DEVICE_TYPE.MOBILE, CM.ENUM.DEVICE_TYPE.WEB].includes(
          type.toUpperCase()
        )
      ) {
        throw {
          field: CM.API_RESPONSE.FIELD.ERROR,
          message: CM.API_RESPONSE.MESSAGE.ERROR.INVALID_TYPE,
        };
      }
      const limits = limit ? Number(limit) : Number(CM.PAGINATION.LIMIT_VALUE);
      const offsets = offset
        ? Number(offset)
        : Number(CM.PAGINATION.OFFSET_VALUE);
      let getBannerPayload = {
        page: offsets.toString(),
        limit: limits.toString(),
        type: type.toUpperCase(),
      };
      console.log('PAYLOAD::', getBannerPayload);
      const banners = await clientHelper.getMarketingBanners(getBannerPayload);
      console.log('BANNERS::', banners);

      if (banners && banners?.data?.list?.length) {
        responsePayload = {
          message: CM.API_RESPONSE.MESSAGE.SUCCESS.RECORD_FOUND,
          data: {
            list: banners.data.list,
            totalRowCount: banners.data.totalCounts,
          },
        };
      } else {
        responsePayload = {
          message: CM.API_RESPONSE.MESSAGE.NO_RECORD_FOUND,
          data: { list: [], totalRowCount: 0 },
        };
      }
      request.body.result = responsePayload;
      next();
    } catch (error) {
      console.log('ERROR IN GET MARKETING BANNERS ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };
  //  update profile

  updateUserProfile = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction: Transaction = await Model.sequelize.transaction();
    try {
      request.body.activityTitle = 'Profile update';
      const requestPayload: UserInterface.UPDATE_PROFILE_REQUEST_PAYLOAD =
        request.body;
      const userId: string = request.userInfo.userId;
      let responsePayload: GetCommonResponse;
      const updateUserPayload = {
        nationality: requestPayload.nationality,
        accountType: requestPayload.accountType,
      };

      const isUserProfileUpdated: boolean = await userHelper.updateUserRow(
        { userId: userId },
        updateUserPayload,
        initTransaction
      );

      if (isUserProfileUpdated) {
        responsePayload = {
          message: CM.API_RESPONSE.MESSAGE.SUCCESS.RECORD_UPDATE,
          data: {},
        };
        await initTransaction.commit();
        request.body.result = responsePayload;
        next();
      } else {
        throw {
          field: CM.API_RESPONSE.FIELD.ERROR,
          message: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
        };
      }
    } catch (error) {
      console.log('ERROR IN UPDATE USER PROFILE ::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  // individual user detail
  isIndividualUser = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const requestPayload: UserInterface.INDIVIDUAL_USER_DETAIL_REQUEST_PAYLOAD =
        request.body;
      const userId: string = request.userInfo.userId;
      const userRow = await userHelper.getUserRow({ userId: userId });
      if (userRow) {
        if (userRow.accountType !== CM.ENUM.ACCOUNT_TYPE.INDIVIDUAL) {
          throw {
            field: CM.API_RESPONSE.FIELD.ACCOUNT_TYPE,
            message: CM.API_RESPONSE.MESSAGE.ERROR.INVALID_REQUEST,
          };
        }
        request.body.individualStatus = userRow.individualStatus;
        next();
      } else {
        throw {
          field: CM.API_RESPONSE.FIELD.USER,
          message: CM.API_RESPONSE.MESSAGE.ERROR.USER_NOT_FOUND,
        };
      }
    } catch (error) {
      console.log('ERROR IN IS INDIVIDUAL USER ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  saveIndividualUserDetail = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction: Transaction = await Model.sequelize.transaction();
    try {
      const requestPayload: UserInterface.INDIVIDUAL_USER_DETAIL_REQUEST_PAYLOAD =
        request.body;
      let responsePayload: GetCommonResponse;

      const userId: string = request.userInfo.userId;
      if (request.body.individualStatus) {
        console.log('ALREADY SAVED INDIVIDUAL DETAILS');
        responsePayload = {
          message: CM.API_RESPONSE.MESSAGE.SUCCESS.RECORD_UPDATE,
          data: {},
        };
      } else {
        const individualUserPayload = {
          firstName: requestPayload.firstName,
          lastName: requestPayload.lastName,
          dateOfBirth: requestPayload.dateOfBirth,
          gender: requestPayload.gender,
          address: requestPayload.address,
          city: requestPayload.city,
          postalCode: requestPayload.postalCode,
          individualStatus: true,
        };
        const isIndividualDataUpdated: boolean = await userHelper.updateUserRow(
          { userId: userId },
          individualUserPayload,
          initTransaction
        );

        if (isIndividualDataUpdated) {
          responsePayload = {
            message: CM.API_RESPONSE.MESSAGE.SUCCESS.USER_DETAIL_SAVED,
            data: {},
          };
        } else {
          throw {
            field: CM.API_RESPONSE.FIELD.ERROR,
            message: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
          };
        }
      }
      await initTransaction.commit();
      request.body.result = responsePayload;
      next();
    } catch (error) {
      console.log('ERROR IN SAVE INDIVIDUAL USER PROFILE ::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  // business user detail

  // isBusinessUser = async (
  //   request: express.Request,
  //   response: express.Response,
  //   next: express.NextFunction
  // ) => {
  //   try {
  //     const requestPayload: UserInterface.SAVE_BUSINESS_DETAIL_REQUEST_PAYLOAD =
  //       request.body;
  //     console.log('BUSINESS USER DETAIL REQUEST PAYLOAD::', requestPayload);
  //     const userId: string = request.userInfo.userId;
  //     const userRow = await userHelper.getUserRow({ userId: userId });
  //     if (userRow) {
  //       if (userRow.accountType !== CM.ENUM.ACCOUNT_TYPE.BUSINESS) {
  //         throw {
  //           field: CM.API_RESPONSE.FIELD.ACCOUNT_TYPE,
  //           message: CM.API_RESPONSE.MESSAGE.ERROR.INVALID_REQUEST,
  //         };
  //       }
  //       request.body.businessStatus = userRow.businessStatus;
  //       next();
  //     } else {
  //       throw {
  //         field: CM.API_RESPONSE.FIELD.USER,
  //         message: CM.API_RESPONSE.MESSAGE.ERROR.USER_NOT_FOUND,
  //       };
  //     }
  //   } catch (error) {
  //     console.log('ERROR IN IS  USER ::', error);
  //     return setResponse.error400(request, response, {
  //       error: error as GenericError,
  //     });
  //   }
  // };

  // saveBusinessDetail = async (
  //   request: express.Request,
  //   response: express.Response,
  //   next: express.NextFunction
  // ) => {
  //   const initTransaction: Transaction = await Model.sequelize.transaction();
  //   try {
  //     const requestPayload: UserInterface.SAVE_BUSINESS_DETAIL_REQUEST_PAYLOAD =
  //       request.body;
  //     console.log('BUSINESS USER DETAIL REQUEST PAYLOAD::', requestPayload);
  //     const userId: string = request.userInfo.userId;
  //     let responsePayload: GetCommonResponse;

  //     if (request.body.businessStatus) {
  //       console.log('ALREADY SAVED BUSINESS DETAILS');
  //       responsePayload = {
  //         message: CM.API_RESPONSE.MESSAGE.SUCCESS.RECORD_UPDATE,
  //         data: {},
  //       };
  //     } else {
  //       const businessDetailPayload = {
  //         businessName: requestPayload.businessName,
  //         brandName: requestPayload.brandName ? requestPayload.brandName : '',
  //         incorporationDate: requestPayload.incorporationDate,
  //         companyType: requestPayload.companyType,
  //         // taxVatId: requestPayload.taxOrVatId,
  //         businessStatus: true,
  //       };
  //       const isBusinessDetailUpdated: boolean = await userHelper.updateUserRow(
  //         { userId: userId },
  //         businessDetailPayload,
  //         initTransaction
  //       );
  //       if (isBusinessDetailUpdated) {
  //         responsePayload = {
  //           message: CM.API_RESPONSE.MESSAGE.SUCCESS.RECORD_UPDATE,
  //           data: {},
  //         };
  //       } else {
  //         throw {
  //           field: CM.API_RESPONSE.FIELD.ERROR,
  //           messgae: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
  //         };
  //       }
  //     }
  //     await initTransaction.commit();
  //     request.body.result = responsePayload;
  //     next();
  //   } catch (error) {
  //     console.log('UPDATE BUSINESS USER DETAIL RESPONSE ERROR', response);
  //     await initTransaction.rollback();
  //     return setResponse.error400(request, response, {
  //       error: error as GenericError,
  //     });
  //   }
  // };

  // send phone otp

  isPhoneAlreadyExist = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const requestPayload: UserInterface.SEND_PHONE_OTP_REQUEST_PAYLOAD =
        request.body;
      const userRow = await userHelper.getUserRow({
        phoneNumber: requestPayload.phoneNumber,
      });
      if (userRow) {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.PHONE_ALREADY_EXIST,
          message: CM.API_RESPONSE.MESSAGE.ERROR.PHONE_ALREADY_EXIST,
        };
      } else {
        next();
      }
    } catch (error) {
      console.log('ERROR IN IS PHONE ALREADY EXIST ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  sendKycPhoneOtp = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction: Transaction = await Model.sequelize.transaction();
    try {
      const requestPayload: UserInterface.SEND_PHONE_OTP_REQUEST_PAYLOAD =
        request.body;
      let responsePayload: GetCommonResponse;
      const otp: string | boolean = '123456';
      // await Helpers.utilitiesHelper.createOTP();
      const phoneOtpPayload = {
        phoneNumber: requestPayload.phoneNumber,
        method: CM.ENUM.OTP_METHOD.SMS,
        service: CM.ENUM.OTP_SERVICE.KYC_PHONE_VERIFICATION,
      };
      if (otp) {
        const otpRow = await userHelper.getOtpRow(phoneOtpPayload);
        console.log('EXISTED OTP ROW ::', otpRow);
        if (otpRow) {
          // update otp row
          const updateOtp: boolean = await userHelper.updateOtp(
            phoneOtpPayload,
            {
              otp: otp,
              status: false,
            },
            initTransaction
          );
          if (!updateOtp) {
            throw {
              field: CM.API_RESPONSE.ERROR_FIELD.OTP_NOT_SENT,
              message: CM.API_RESPONSE.MESSAGE.ERROR.FAILED_TO_SEND_OTP,
            };
          }
        } else {
          // create new otp row
          const saveOtpPayload = {
            ...phoneOtpPayload,
            otp: otp,
            status: false,
          };

          const saveOtp: boolean = await userHelper.createNewOtpRow(
            saveOtpPayload,
            initTransaction
          );
          if (!saveOtp) {
            throw {
              field: CM.API_RESPONSE.ERROR_FIELD.OTP_NOT_SENT,
              message: CM.API_RESPONSE.MESSAGE.ERROR.FAILED_TO_SEND_OTP,
            };
          }
        }

        let notifyUserPayload = {
          to: requestPayload.phoneNumber,
          body: CM.NOTIFICATION.SMS.KYC_PHONE_VERIFICATION,
        };
        // uncomment it

        await userHelper.notifyUser(
          CM.RABBIT_MQ.QUEUE.USER_SMS,
          notifyUserPayload
        );

        responsePayload = {
          message: CM.API_RESPONSE.MESSAGE.SUCCESS.OTP_SENT_SUCCESS,
          data: {},
          field: CM.API_RESPONSE.SUCCESS_FIELD.OTP_SENT,
        };
        await initTransaction.commit();
        request.body.result = responsePayload;
        next();
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.OTP_NOT_SENT,
          message: CM.API_RESPONSE.MESSAGE.ERROR.FAILED_TO_SEND_OTP,
        };
      }
    } catch (error) {
      console.log('ERROR IN SEND PHONE OTP ::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  // verify phone otp
  isPhoneOtpExpired = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const requestPayload: UserInterface.VERIFY_OTP_REQUEST_PAYLOAD =
        request.body;
      const phoneOtpPayload = {
        phoneNumber: requestPayload.phoneNumber,
        method: CM.ENUM.OTP_METHOD.SMS,
        service: CM.ENUM.OTP_SERVICE.KYC_PHONE_VERIFICATION,
        otp: requestPayload.otp,
      };
      const verifyOtpRow = await userHelper.getOtpRow(phoneOtpPayload);
      if (verifyOtpRow) {
        const dbOtpCreationTimeUnix =
          moment(verifyOtpRow.updatedAt).utc().unix() +
          Number(CM.OTP_EXPIRE_TIME);

        const currentDate = new Date();
        const expireTimeUnix = moment(currentDate).utc().unix();
        console.log('DMB:', dbOtpCreationTimeUnix, 'CURRENT::', expireTimeUnix);
        if (expireTimeUnix > dbOtpCreationTimeUnix) {
          throw {
            field: CM.API_RESPONSE.ERROR_FIELD.OTP_EXPIRED,
            message: CM.API_RESPONSE.MESSAGE.ERROR.OTP_EXPIRED,
          };
        } else {
          next();
        }
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.INCORRECT_OTP,
          message: CM.API_RESPONSE.MESSAGE.ERROR.INCORRECT_OTP,
        };
      }
    } catch (error) {
      console.log('ERROR IN IS OTP EXPIRED ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  updatePhoneNumber: express.RequestHandler = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction: Transaction = await Model.sequelize.transaction();
    try {
      const userId: string = request.userInfo.userId;
      const isUserRowUpdated: boolean = await userHelper.updateUserRow(
        { userId: userId },
        {
          phoneNumber: request.body.phoneNumber,
          countryCode: request.body.countryCode,
        },
        initTransaction
      );
      if (isUserRowUpdated) {
        request.body.initTransaction = initTransaction;
        next();
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.ERROR,
          message: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
        };
      }
    } catch (error) {
      console.log('ERROR IN UPDATE PHONE NUMBER', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  deleteVerifiedOtp: express.RequestHandler = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction: Transaction = request.body.initTransaction;
    try {
      const requestedPayload: UserInterface.VERIFY_OTP_REQUEST_PAYLOAD =
        request.body;
      let responsePayload: GetCommonResponse;
      let otpPayload = {
        method: CM.ENUM.OTP_METHOD.SMS,
        service: CM.ENUM.OTP_SERVICE.KYC_PHONE_VERIFICATION,
        phoneNumber: requestedPayload.phoneNumber,
      };
      const isPhoneOtpDestroyed: boolean = await userHelper.destroyOtp(
        otpPayload,
        initTransaction
      );

      if (isPhoneOtpDestroyed) {
        responsePayload = {
          message: CM.API_RESPONSE.MESSAGE.SUCCESS.OTP_VERIFIED,
          data: {},
          field: CM.API_RESPONSE.SUCCESS_FIELD.OTP_VERIFIED,
        };
        await initTransaction.commit();
        request.body.result = responsePayload;

        next();
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.OTP_NOT_VERIFIED,
          messgae: CM.API_RESPONSE.MESSAGE.ERROR.OTP_NOT_VERIFIED,
        };
      }
    } catch (error) {
      console.log('ERROR IN DELETE VERIFIED OTP', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };
  // is user already registered
  isUserAlreadyRegistered = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      console.log('REQUEST PAYLOAD::', request.body);
      console.log('REQUEST PARAMS::', request.params);
      const userEmail = request.body.email;
      let responsePayload: GetCommonResponse;
      const userRow = await userHelper.getUserRow({
        email: userEmail,
      });

      if (userRow) {
        responsePayload = {
          message: CM.API_RESPONSE.MESSAGE.USER_ALREADY_REGISTERED,
          data: { isEmailExist: true },
          field: CM.API_RESPONSE.SUCCESS_FIELD.USER_EXIST,
        };
      } else {
        responsePayload = {
          message: CM.API_RESPONSE.MESSAGE.USER_NOT_REGISTERED,
          data: { isEmailExist: false },
          field: CM.API_RESPONSE.SUCCESS_FIELD.USER_NOT_EXIST,
        };
      }
      request.body.result = responsePayload;
      next();
    } catch (error) {
      console.log('ERROR IN IS USER ALREADY REGISTERED::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };
  // is social id exist

  isSocialIdExist = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      console.log('REQUEST PAYLOAD::', request.body);
      console.log('REQUEST PARAMS::', request.params);
      const userSocialId = request.body.socialId;

      let responsePayload: GetCommonResponse;
      const userRow = await Model.User.findOne({
        where: {
          [Model.Op.or]: [
            { googleId: userSocialId },
            { facebookId: userSocialId },
            { appleId: userSocialId },
          ],
        },
        raw: true,
      });

      if (userRow) {
        responsePayload = {
          message: CM.API_RESPONSE.MESSAGE.SUCCESS.SOCIAL_ID_EXIST,
          data: { isEmailExist: true },
          field: CM.API_RESPONSE.SUCCESS_FIELD.SOCIAL_ID_EXIST,
        };
      } else {
        responsePayload = {
          message: CM.API_RESPONSE.MESSAGE.SUCCESS.SOCIAL_ID_NOT_EXIST,
          data: { isEmailExist: false },
          field: CM.API_RESPONSE.SUCCESS_FIELD.SOCIAL_ID_NOT_EXIST,
        };
      }
      request.body.result = responsePayload;
      next();
    } catch (error) {
      console.log('ERROR IN IS SOCIAL ID EXIST ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  // logout

  logout = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction: Transaction = await Model.sequelize.transaction();
    try {
      request.body.activityTitle = 'User logged out';
      const userId: string = request.userInfo.userId;
      // const deviceId: string = request.body.deviceId;
      console.log('LOGOUT USERID::', userId);
      // console.log('LOGOUT USER DEVICEID::', deviceId);
      let responsePayload: GetCommonResponse;
      const deleteUserSession: boolean = await userHelper.destroyUserSession(
        {
          userId: userId,
          // deviceId: deviceId,
        },
        initTransaction
      );
      console.log('IS SESSION DELETED::', deleteUserSession);
      if (deleteUserSession) {
        responsePayload = {
          message: CM.API_RESPONSE.MESSAGE.SUCCESS.LOGOUT_SUCCESS,
          data: {},
          field: CM.API_RESPONSE.SUCCESS_FIELD.LOGOUT_SUCCESS,
        };
        await initTransaction.commit();
        request.body.result = responsePayload;
        next();
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.ERROR,
          message: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
        };
      }
    } catch (error) {
      console.log('ERROR IN LOGOUT ::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  // delete user account

  destroyUserSession = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction: Transaction = await Model.sequelize.transaction();
    try {
      const userId: string = request.userInfo.userId;
      console.log('DELETE USER ACCOUNT::');
      let responsePayload: GetCommonResponse;
      const deleteUserSession: boolean = await userHelper.destroyUserSession(
        {
          userId: userId,
        },
        initTransaction
      );
      if (deleteUserSession) {
        responsePayload = {
          message: CM.API_RESPONSE.MESSAGE.SUCCESS.LOGOUT_SUCCESS,
          data: {},
        };
        request.body.result = responsePayload;
        request.body.initTransaction = initTransaction;
        next();
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.ERROR,
          message: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
        };
      }
    } catch (error) {
      console.log('ERROR IN DESTROY USER SESSION ::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  deleteAccount = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction: Transaction = request.body.initTransaction;
    try {
      request.body.activityTitle = 'Account delete';
      const userRow = request.body.userRow;

      console.log('DELETE USER ACCOUNT::');
      const reandomPassword: string =
        Helpers.utilitiesHelper.generateRandomString(25);
      const passwordHash = await Helpers.utilitiesHelper.generateSHA256(
        reandomPassword
      );
      let responsePayload: GetCommonResponse;
      const updateUserRow: boolean = await userHelper.updateUserRow(
        {
          userId: userRow.userId,
        },
        {
          email: `${CM.envAlias.DLEETE_ACCOUNT_PREFIX}${
            userRow.email
          }_ ${moment().unix()}`,
          password: passwordHash ? passwordHash : reandomPassword,
          isBlocked: true,
          isEmailVerified: false,
          status: CM.ENUM.USER_STATUS.INACTIVE,
          isDeleted: true,
          phoneNumber: `${CM.envAlias.DLEETE_ACCOUNT_PREFIX} 
           ${userRow.phoneNumber}_${moment().unix()}`,
          googleId: `${CM.envAlias.DLEETE_ACCOUNT_PREFIX}${
            userRow.googleId
          }_${moment().unix()}`,
          appleId: `${CM.envAlias.DLEETE_ACCOUNT_PREFIX}${
            userRow.appleId
          }_${moment().unix()}`,
          facebookId: `${CM.envAlias.DLEETE_ACCOUNT_PREFIX}${
            userRow.facebookId
          }_${moment().unix()}`,
        },
        initTransaction
      );
      if (updateUserRow) {
        responsePayload = {
          message: CM.API_RESPONSE.MESSAGE.SUCCESS.ACCOUNT_DELETED,
          data: {},
          field: CM.API_RESPONSE.SUCCESS_FIELD.ACCOUNT_DELETED,
        };
        await initTransaction.commit();
        request.body.result = responsePayload;
        next();
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.ERROR,
          message: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
        };
      }
    } catch (error) {
      console.log('ERROR IN DELETE ACCOUNT ::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  //  refresh token

  isUserRowExist = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const userId: string = request.userInfo.userId;
      console.log('IS USER ROW EXIST::', userId);
      const userRow = await userHelper.getUserRow({
        userId: userId,
      });
      if (userRow) {
        if (userRow.isDeleted) {
          throw {
            field: CM.API_RESPONSE.ERROR_FIELD.ACCOUNT_DELETED,
            message: CM.API_RESPONSE.MESSAGE.ERROR.ACCOUNT_DELETED,
          };
        } else if (
          userRow.isBlocked ||
          userRow.status === CM.ENUM.USER_STATUS.INACTIVE
        ) {
          // const errorMessage = Helpers.utilitiesHelper.replaceStringPlaceholder(
          //   CM.API_RESPONSE.MESSAGE.ERROR.USER_BLOCKED,
          //   'reason',
          //   `${userRow.reasonToBlockUser}`
          // );
          throw {
            field: CM.API_RESPONSE.ERROR_FIELD.USER_BLOCKED,
            message: CM.API_RESPONSE.MESSAGE.ERROR.USER_BLOCKED,
          };
        }
        console.log('USER ROW FOUND');
        request.body.userRow = userRow;
        next();
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.USER_NOT_EXIST,
          message: CM.API_RESPONSE.MESSAGE.ERROR.USER_NOT_FOUND,
        };
      }
    } catch (error) {
      console.log('ERROR IN IS USER ROW EXIST ::', error);
      return setResponse.error401(request, response, {
        error: error as GenericError,
      });
    }
  };

  isUserSessionExist = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const userId: string = request.userInfo.userId;
      console.log('USER ID::', userId);
      const userSessionRow = await userHelper.getUserSessionRow({
        userId: userId,
        deviceId: request.body.deviceId,
        refreshToken: request.body.refreshToken,
      });
      console.log('USER SESSION ROW::', userSessionRow);
      if (userSessionRow) {
        request.body.isUserSessionExist = true;
        request.body.userId = userId;
        next();
      } else {
        console.log('USER SESSION NOT EXIST ::');
        const errorResponse = {
          field: CM.API_RESPONSE.FIELD.ERROR,
          message: CM.API_RESPONSE.MESSAGE.ERROR.LOGIN_AGAIN,
        };
        return setResponse.error401(request, response, {
          error: errorResponse as GenericError,
        });
      }
    } catch (error) {
      console.log('ERROR IN IS USER SESSION EXIST ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  refreshToken = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction: Transaction = await Model.sequelize.transaction();
    try {
      console.log('INSIDE REFRESH TOKEN');
      const userRow = request.body.userRow;

      let responsePayload: GetCommonResponse;
      const { accessJwt, refreshJwt } =
        await Helpers.utilitiesHelper.generateJwt(
          {
            userId: userRow.userId,
            email: userRow.email,
            nationality: userRow.nationality ? userRow.nationality : '',
            accountType: userRow.accountType ? userRow.accountType : '',
            phoneNumber: userRow.phoneNumber ? userRow.phoneNumber : '',
            clientId: userRow.clientId ? userRow.clientId : '',
          },
          true
        );
      if (accessJwt && refreshJwt) {
        if (request.body.isUserSessionExist) {
          const destroySession = await userHelper.destroyUserSession(
            { userId: userRow.userId },
            initTransaction
          );
          if (!destroySession) {
            console.log('ERROR IN DESTROY SESSION::', destroySession);
            throw {
              field: CM.API_RESPONSE.FIELD.ERROR,
              message: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
            };
          }
          const userSessionPayload = {
            userId: userRow.userId,
            accessToken: accessJwt,
            refreshToken: refreshJwt,
            deviceId: request.body.deviceId,
            deviceToken: request.body.deviceToken
              ? request.body.deviceToken
              : '',
            deviceType: request.body.deviceType,
            fcmToken: request.body.deviceToken ? request.body.deviceToken : '',
          };
          // create new user session row
          const createUserSession: boolean =
            await userHelper.createUserSessionRow(
              userSessionPayload,
              initTransaction
            );
          if (!createUserSession) {
            throw {
              field: CM.API_RESPONSE.FIELD.ERROR,
              message: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
            };
          }
          responsePayload = {
            message: CM.API_RESPONSE.MESSAGE.SUCCESS.SUCCESS,
            data: { userToken: accessJwt, refreshToken: refreshJwt },
          };
          await initTransaction.commit();
          request.body.result = responsePayload;
          next();
        } else {
          const errorResponse = {
            field: CM.API_RESPONSE.FIELD.ERROR,
            message: CM.API_RESPONSE.MESSAGE.ERROR.LOGIN_AGAIN,
          };
          console.log('USER SESSION ROW NOT FOUND::');
          return setResponse.error401(request, response, {
            error: errorResponse as GenericError,
          });
        }
      } else {
        throw {
          field: CM.API_RESPONSE.FIELD.ERROR,
          message: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
        };
      }
    } catch (error) {
      console.log('ERROR IN GET REFRESH TOKEN ID EXIST ::', error);
      await initTransaction.rollback();
      return setResponse.error401(request, response, {
        error: error as GenericError,
      });
    }
  };

  // destroy session of same deviceId

  destroyDeviceSession = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction: Transaction = request.body.initTransaction;
    try {
      const userSessionRow = await userHelper.getUserSessionRow({
        [Model.Op.or]: [
          { userId: request.body.userId },
          { deviceId: request.body.deviceId },
        ],
      });

      if (userSessionRow) {
        const destroySession: boolean = await userHelper.destroyUserSession(
          {
            [Model.Op.or]: [
              { userId: request.body.userId },
              { deviceId: request.body.deviceId },
            ],
          },
          initTransaction
        );
        console.log('IS SESSION DESTROYED', destroySession);
        if (!destroySession) {
          throw {
            field: CM.API_RESPONSE.ERROR_FIELD.ERROR,
            message: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
          };
        }
        next();
      } else {
        next();
      }
    } catch (error) {
      console.log('ERROR IN DESTROY DEVICE SESSION ::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  // create user session
  createUserSession = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction: Transaction = request.body.initTransaction;
    try {
      const requestPayload: UserInterface.USER_SESSION_PAYLOAD = request.body;
      const userSessionPayload = {
        userId: requestPayload.userId,
        accessToken: requestPayload.accessToken,
        refreshToken: requestPayload.refreshToken,
        deviceId: requestPayload.deviceId,
        deviceToken: requestPayload.deviceToken
          ? requestPayload.deviceToken
          : '',
        deviceType: requestPayload.deviceType,
        fcmToken: requestPayload.deviceToken ? requestPayload.deviceToken : '',
      };
      // create new user session row
      const createUserSession: boolean = await userHelper.createUserSessionRow(
        userSessionPayload,
        initTransaction
      );
      console.log('CREATE USER SESSION::', createUserSession);
      if (!createUserSession) {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.ERROR,
          message: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
        };
      } else {
        await initTransaction.commit();
        next();
      }
    } catch (error) {
      console.log('ERROR IN IS CREATE USER SESSION ::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  // create referralCode
  createUserReferralCode = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction: Transaction = await Model.sequelize.transaction();
    try {
      const requestPayload = request.body;

      if (
        !requestPayload.isUserAlreadyRegistered &&
        requestPayload.referralCode
      ) {
        console.log(
          'GENERATED USER REFERRAL CODE::',
          requestPayload.referralUserCode,
          'USER REF CODE::',
          requestPayload.referralCode
        );
        const referrerDetail = await userHelper.getUserRow({
          referralCode: requestPayload.referralCode,
        });

        if (referrerDetail) {
          const forwarded: any = request.headers['x-forwarded-for'];
          const referralPayload = {
            refereeUserId: requestPayload.userId,
            referrerUserId: referrerDetail.userId,
            email: requestPayload.email,
            refereeCode: requestPayload.referralUserCode,
            referrerCode: requestPayload.referralCode,
            ipAddress: forwarded
              ? forwarded.split(',')[0]
              : request.socket.remoteAddress,
          };
          await clientHelper.saveReferralCode(referralPayload);
          await userHelper.updateUserRow(
            { userId: request.body.userId },
            { isReferee: true },
            initTransaction
          );
        } else {
          console.log(
            'REFERRER DETAIL NOT FOUND::',
            requestPayload.referralCode
          );
        }
      }
      await initTransaction.commit();
      next();
    } catch (error) {
      console.log('ERROR IN CREATE USER REFERRAL CODE ::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  // send otp auth
  userAuth = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const userId = request.userInfo.userId;
      const userRow = await userHelper.getUserRow({ userId: userId });
      if (userRow) {
        const otp: string | boolean = '123456';
        await Helpers.utilitiesHelper.createOTP();
        request.body.otp = otp;
        request.body.userRow = userRow;
        next();
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.INVALID_REQUEST,
          message: CM.API_RESPONSE.MESSAGE.ERROR.INVALID_REQUEST,
        };
      }
    } catch (error) {
      console.log('ERROR IN USER AUTH ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  sendAuthOtp = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const requestPayload: UserInterface.SEND_OTP_AUTH_REQUEST_PAYLOAD =
        request.body;
      const userId = request.userInfo.userId;
      const userRow = request.body.userRow;
      if (requestPayload.method === CM.ENUM.OTP_METHOD.EMAIL) {
        request.body.saveOtpPayload = {
          email: userRow.email,
          method: requestPayload.method,
          service: requestPayload.service,
          userId: userId,
        };

        // let notifyUserPayload = {
        //   topicName: CM.KAFKA.COMMON_TOPICS.USER_EMAILS,
        //   code: CM.KAFKA.NOTIFICATION_CODES[
        //     `${requestPayload.service}_EMAIL` as keyof typeof CM.KAFKA.NOTIFICATION_CODES
        //   ],
        //   data: {
        //     to: userRow.email,
        //     otp: request.body.otp,
        //   },
        // };

        const notification =
          CM.NOTIFICATION.EMAIL[
            requestPayload.service as keyof typeof CM.NOTIFICATION.EMAIL
          ];

        let notifyUserPayload = {
          queueName: CM.RABBIT_MQ.QUEUE.USER_EMAILS,
          payload: {
            subject: notification.SUBJECT,
            body: notification.BODY,
            to: userRow.email,
            template: notification.TEMPLATE,
          },
        };

        request.body.notifyUserPayload = notifyUserPayload;

        next();
      } else if (requestPayload.method === CM.ENUM.OTP_METHOD.SMS) {
        request.body.saveOtpPayload = {
          phoneNumber: userRow.phoneNumber,
          method: requestPayload.method,
          service: requestPayload.service,
          userId: userId,
        };

        const notification =
          CM.NOTIFICATION.EMAIL[
            requestPayload.service as keyof typeof CM.NOTIFICATION.EMAIL
          ];

        let notifyUserPayload = {
          to: userRow.phoneNumber,
          body: notification.BODY,
        };

        request.body.notifyUserPayload = notifyUserPayload;

        next();
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.INVALID_REQUEST,
          message: CM.API_RESPONSE.MESSAGE.ERROR.INVALID_REQUEST,
        };
      }
    } catch (error) {
      console.log('ERROR IN VERIFY OTP METHOD ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  // update 2fa status
  verifyTxnSecurityOtp = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction: Transaction = await Model.sequelize.transaction();
    try {
      const requestPayload = request.body;
      const userId: string = request.userInfo.userId;

      if (
        requestPayload.type === CM.ENUM.TFA_TYPE.LOGIN &&
        ![
          CM.ENUM.TFA_STATUS_TYPE.SMS,
          CM.ENUM.TFA_STATUS_TYPE.EMAIL,
          CM.ENUM.TFA_STATUS_TYPE.MPIN,
        ].includes(requestPayload.statusType)
      ) {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.INVALID_REQUEST,
          message: CM.API_RESPONSE.MESSAGE.ERROR.INVALID_REQUEST,
        };
      }
      const userRow = await userHelper.getUserRow({ userId: userId });
      if (userRow) {
        request.body.initTransaction = initTransaction;
        if (
          (requestPayload.statusType === CM.ENUM.TFA_STATUS_TYPE.SMS ||
            requestPayload.statusType === CM.ENUM.TFA_STATUS_TYPE.TXN_SMS) &&
          !userRow.phoneNumber
        ) {
          throw {
            field: CM.API_RESPONSE.ERROR_FIELD.INCOMPLETE_KYC,
            message: CM.API_RESPONSE.MESSAGE.ERROR.PHONENUMBER_NOT_EXIST,
          };
        }

        if (requestPayload.type === CM.ENUM.TFA_TYPE.TRANSACTION) {
          if (
            [
              CM.ENUM.TFA_STATUS_TYPE.TXN_EMAIL,
              CM.ENUM.TFA_STATUS_TYPE.TXN_SMS,
            ].includes(requestPayload.statusType)
          ) {
            let getOtpPayload: any = {
              userId: userId,
              method:
                requestPayload.statusType === CM.ENUM.TFA_STATUS_TYPE.TXN_EMAIL
                  ? CM.ENUM.OTP_METHOD.EMAIL
                  : CM.ENUM.OTP_METHOD.SMS,
              service: CM.ENUM.OTP_SERVICE.TXN_SECURITY_VERIFICATION,
              otp: requestPayload.otp,
            };

            if (CM.ENUM.TFA_STATUS_TYPE.TXN_SMS === requestPayload.statusType) {
              getOtpPayload.phoneNumber = userRow.phoneNumber;
            } else {
              getOtpPayload.email = userRow.email;
            }
            console.log('GET OTP PAYLOAD::', getOtpPayload);
            const otpRow = await userHelper.getOtpRow(getOtpPayload);
            if (otpRow) {
              const isOtpExpired = await userHelper.isOtpExpired(
                otpRow.updatedAt
              );
              console.log('IS OTP EXPIRED::', isOtpExpired);
              if (isOtpExpired) {
                throw {
                  field: CM.API_RESPONSE.ERROR_FIELD.OTP_EXPIRED,
                  message: CM.API_RESPONSE.MESSAGE.ERROR.OTP_EXPIRED,
                };
              } else {
                const isOtpDestroyed: boolean = await userHelper.destroyOtp(
                  getOtpPayload,
                  initTransaction
                );
                console.log('IS OTP DESTROYED::', isOtpDestroyed);
                if (!isOtpDestroyed) {
                  throw {
                    field: CM.API_RESPONSE.ERROR_FIELD.ERROR,
                    message:
                      CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
                  };
                }
              }
            } else {
              throw {
                field: CM.API_RESPONSE.ERROR_FIELD.INCORRECT_OTP,
                message: CM.API_RESPONSE.MESSAGE.ERROR.INCORRECT_OTP,
              };
            }
          }

          if (requestPayload.statusType === CM.ENUM.TFA_STATUS_TYPE.TXN_MPIN) {
            if (requestPayload.otp !== userRow.mobilePin) {
              throw {
                field: CM.API_RESPONSE.ERROR_FIELD.INCORRECT_MPIN,
                message: CM.API_RESPONSE.MESSAGE.ERROR.INCORRECT_MPIN,
              };
            }
          }

          next();
        } else next();
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.ERROR,
          message: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
        };
      }
    } catch (error) {
      console.log('ERROR IN VERIFY  TXN SECURITY OTP ::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  updateStatus = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction: Transaction = request.body.initTransaction;
    try {
      request.body.activityTitle = 'User 2FA status update from mobile';
      const requestPayload: UserInterface.UPDATE_2FA_STATUS_REQUEST_PAYLOAD =
        request.body;
      const userId: string = request.userInfo.userId;

      let responsePayload: GetCommonResponse;
      let updateStatusPayload: UserInterface.UPDATE_2FA_STATUS_PAYLOAD = {};
      if (requestPayload.type === CM.ENUM.TFA_TYPE.LOGIN) {
        updateStatusPayload = {
          mpinStatus: false,
          smsStatus: false,
          google2FaStatus: false,
          emailStatus: false,
        };
      }
      switch (requestPayload.statusType) {
        case CM.ENUM.TFA_STATUS_TYPE.MPIN:
          updateStatusPayload.mpinStatus = true;
          break;
        case CM.ENUM.TFA_STATUS_TYPE.EMAIL:
          updateStatusPayload.emailStatus = true;
          break;
        case CM.ENUM.TFA_STATUS_TYPE.SMS:
          updateStatusPayload.smsStatus = true;
          break;
        case CM.ENUM.TFA_STATUS_TYPE.GOOGLE:
          updateStatusPayload.google2FaStatus = true;
          break;
        case CM.ENUM.TFA_STATUS_TYPE.TXN_MPIN:
          updateStatusPayload = { txnMpinStatus: requestPayload.status };
          break;
        case CM.ENUM.TFA_STATUS_TYPE.TXN_EMAIL:
          updateStatusPayload = { txnEmailStatus: requestPayload.status };
          break;
        case CM.ENUM.TFA_STATUS_TYPE.TXN_SMS:
          updateStatusPayload = { txnSmsStatus: requestPayload.status };
          break;
      }
      console.log('UPDATE @FA STATUS PAYLOAD::', updateStatusPayload);
      const isStatusUpdated: boolean = await userHelper.updateUserRow(
        { userId: userId },
        updateStatusPayload,
        initTransaction
      );

      if (isStatusUpdated) {
        responsePayload = {
          message: CM.API_RESPONSE.MESSAGE.SUCCESS.RECORD_UPDATE,
          data: { statusType: requestPayload.statusType },
          field: CM.API_RESPONSE.SUCCESS_FIELD.RECORD_UPDATED,
        };
        await initTransaction.commit();
        request.body.result = responsePayload;
        next();
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.ERROR,
          message: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
        };
      }
    } catch (error) {
      console.log('ERROR IN UPDATE 2FA STATUS ::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  // reset mpin

  verifyUser = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      console.log('REQUEST PAYLOAD::', request.body);
      console.log('REQUEST PARAMS::', request.params);
      const requestPayload: UserInterface.RESET_MPIN_REQUEST_PAYLOAD =
        request.body;

      let userRowPayload = {};
      if (requestPayload.method === CM.ENUM.OTP_METHOD.EMAIL) {
        userRowPayload = { email: requestPayload.email };
      }
      if (requestPayload.method === CM.ENUM.OTP_METHOD.SMS) {
        userRowPayload = { phoneNumber: requestPayload.phoneNumber };
      }
      console.log('MPIN REQUEST PAYLOAD::', requestPayload);
      const userRow = await userHelper.getUserRow(userRowPayload);
      if (userRow) {
        request.body.userRow = userRow;
        request.body.userRowPayload = userRowPayload;
        next();
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.USER_NOT_EXIST,
          message: CM.API_RESPONSE.MESSAGE.ERROR.USER_NOT_FOUND,
        };
      }
    } catch (error) {
      console.log('ERROR IN VERIFY USER ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  isMpinOtpVerified = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const requestPayload: UserInterface.RESET_MPIN_REQUEST_PAYLOAD =
        request.body;
      const searchOtpRowPayload = {
        ...request.body.userRowPayload,
        method: requestPayload.method,
        service: CM.ENUM.OTP_SERVICE.FORGOT_MPIN,
        status: true,
      };

      const isEmailVerificationRow = await userHelper.getOtpRow(
        searchOtpRowPayload
      );
      if (isEmailVerificationRow) {
        next();
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.OTP_NOT_VERIFIED,
          message: CM.API_RESPONSE.MESSAGE.ERROR.OTP_NOT_VERIFIED,
        };
      }
    } catch (error) {
      console.log('ERROR IN IS MPIN OTP VERIFIED  ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  isForgotMpinOtpVerified = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const requestPayload: UserInterface.RESET_MPIN_REQUEST_PAYLOAD =
        request.body;
      const searchOtpRowPayload = {
        ...request.body.userRowPayload,
        method: requestPayload.method,
        service: CM.ENUM.OTP_SERVICE.FORGOT_MPIN,
        otp: requestPayload.otp,
        status: false,
      };

      const isEmailVerificationRow = await userHelper.getOtpRow(
        searchOtpRowPayload
      );
      if (isEmailVerificationRow) {
        next();
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.OTP_NOT_VERIFIED,
          message: CM.API_RESPONSE.MESSAGE.ERROR.OTP_NOT_VERIFIED,
        };
      }
    } catch (error) {
      console.log('ERROR IN IS MPIN OTP VERIFIED  ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  resetMpin = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction = await Model.sequelize.transaction();
    try {
      request.body.activityTitle = '2FA reset';
      const requestPayload: UserInterface.RESET_MPIN_REQUEST_PAYLOAD =
        request.body;
      const userRow = request.body.userRow;
      let responsePayload: GetCommonResponse;

      const resetMpin: boolean = await userHelper.updateUserRow(
        { userId: userRow.userId },
        { mobilePin: requestPayload.mobilePin },
        initTransaction
      );
      if (resetMpin) {
        const destroyOtpPayload = {
          ...request.body.userRowPayload,
          method: requestPayload.method,
          service: CM.ENUM.OTP_SERVICE.FORGOT_MPIN,
        };
        const destroyOtp: boolean = await userHelper.destroyOtp(
          destroyOtpPayload,
          initTransaction
        );
        if (!destroyOtp) {
          throw {
            field: CM.API_RESPONSE.ERROR_FIELD.ERROR,
            message: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
          };
        }
        responsePayload = {
          message: CM.API_RESPONSE.MESSAGE.SUCCESS.MPIN_UPDATED_SUCCESS,
          data: {},
          field: CM.API_RESPONSE.SUCCESS_FIELD.MPIN_UPDATED,
        };
        await initTransaction.commit();
        request.body.result = responsePayload;

        next();
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.MPIN_UPDATE_FAILED,
          message: CM.API_RESPONSE.MESSAGE.ERROR.FAILER_TO_UPDATE_MPIN,
        };
      }
    } catch (error) {
      console.log('ERROR IN RESET MPIN ::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  resetMpinWithoutAuth = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction = await Model.sequelize.transaction();
    try {
      request.body.activityTitle = 'MPIN reset';
      const requestPayload: UserInterface.RESET_MPIN_REQUEST_PAYLOAD =
        request.body;
      const userRow = request.body.userRow;
      let responsePayload: GetCommonResponse;

      const resetMpin: boolean = await userHelper.updateUserRow(
        { userId: userRow.userId },
        { mobilePin: requestPayload.mobilePin },
        initTransaction
      );
      if (resetMpin) {
        const destroyOtpPayload = {
          ...request.body.userRowPayload,
          method: requestPayload.method,
          service: CM.ENUM.OTP_SERVICE.FORGOT_MPIN,
        };
        const destroyOtp: boolean = await userHelper.destroyOtp(
          destroyOtpPayload,
          initTransaction
        );
        if (!destroyOtp) {
          throw {
            field: CM.API_RESPONSE.ERROR_FIELD.ERROR,
            message: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
          };
        }
        responsePayload = {
          message: CM.API_RESPONSE.MESSAGE.SUCCESS.MPIN_UPDATED_SUCCESS,
          data: {},
          field: CM.API_RESPONSE.SUCCESS_FIELD.MPIN_UPDATED,
        };
        await initTransaction.commit();
        request.body.result = responsePayload;

        next();
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.MPIN_UPDATE_FAILED,
          message: CM.API_RESPONSE.MESSAGE.ERROR.FAILER_TO_UPDATE_MPIN,
        };
      }
    } catch (error) {
      console.log('ERROR IN RESET MPIN ::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };
  // change mpin

  verifyOldPassword = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const requestPayload: UserInterface.CHANGE_PASSWORD_REQUEST_PAYLOAD =
        request.body;
      if (requestPayload.oldPassword === requestPayload.newPassword) {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.PASSWORD_IS_SAME,
          message: CM.API_RESPONSE.MESSAGE.ERROR.PASSWORD_CANNOT_BE_SAME,
        };
      }
      const isCorrectOldPassword: boolean =
        await Helpers.utilitiesHelper.comparePassword(
          requestPayload.oldPassword,
          request.body.userRow.password
        );
      if (isCorrectOldPassword) {
        next();
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.INCORRECT_OLD_PASSWORD,
          message: CM.API_RESPONSE.MESSAGE.ERROR.INCORRECT_OLD_PASSWORD,
        };
      }
    } catch (error) {
      console.log('ERROR IN VERIFY OLD PASSWORD ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  changeMobilePin = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction: Transaction = await Model.sequelize.transaction();
    try {
      request.body.activityTitle = 'MPIN reset';
      const requestPayload: UserInterface.CHANGE_MPIN_REQUEST_PAYLOAD =
        request.body;
      let responsePayload: GetCommonResponse;
      const userId: string = request.userInfo.userId;
      const updateMpin: boolean = await userHelper.updateUserRow(
        { userId: userId },
        { mobilePin: requestPayload.newMobilePin },
        initTransaction
      );
      if (updateMpin) {
        responsePayload = {
          message: CM.API_RESPONSE.MESSAGE.SUCCESS.MPIN_UPDATED_SUCCESS,
          data: {},
          field: CM.API_RESPONSE.SUCCESS_FIELD.MPIN_UPDATED,
        };
        await initTransaction.commit();
        request.body.result = responsePayload;
        next();
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.PASSWORD_UPDATE_FAILED,
          message: CM.API_RESPONSE.MESSAGE.ERROR.FAILER_TO_UPDATE_MPIN,
        };
      }
    } catch (error) {
      console.log('ERROR IN CHANGE PASSWORD ::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  // google authentication

  isGoogle2FaAlreadyEnabled = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const requestPayload: UserInterface.RESET_PASSWORD_REQUEST_PAYLOAD =
        request.body;
      const userId: string = request.userInfo.userId;
      console.log('GOOGLE AUTH QR CODE REQUEST PAYLOAD::', requestPayload);
      const userRow = await userHelper.getUserRow({
        userId: userId,
      });
      if (userRow) {
        if (userRow.google2FaStatus || userRow.txnGoogle2FaStatus) {
          throw {
            field: CM.API_RESPONSE.FIELD.ERROR,
            message: CM.API_RESPONSE.MESSAGE.ERROR.INVALID_REQUEST,
          };
        } else {
          request.body.email = userRow.email;
          next();
        }
      } else {
        throw {
          field: CM.API_RESPONSE.FIELD.ERROR,
          message: CM.API_RESPONSE.MESSAGE.ERROR.INVALID_REQUEST,
        };
      }
    } catch (error) {
      console.log('ERROR IN IS GOOGLE 2FA ALREADY ENABLE ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  getGoogleAuthCode = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction: Transaction = await Model.sequelize.transaction();
    try {
      const userId: string = request.userInfo.userId;
      const email: string = request.body.email;
      const secret: GeneratedSecret = SpeakEasy.generateSecret();
      console.log(' GOOGLE AUTH SECRET::', secret);
      const otpAuthUrl: string = SpeakEasy.otpauthURL({
        secret: secret.ascii,
        label: email,
        issuer: CM.envAlias.PROJECT_NAME,
        algorithm: 'sha1',
      });
      qrcode.toDataURL(otpAuthUrl, async function (err, dataUrl) {
        if (err) {
          console.log('ERROR IN GENERATING QRCODE::', err);
          throw {
            field: CM.API_RESPONSE.FIELD.ERROR,
            message: CM.API_RESPONSE.MESSAGE.ERROR,
          };
        } else {
          const save2FaSecret: boolean = await userHelper.updateUserRow(
            { userId: userId },
            { google2FaSecret: secret.base32 },
            initTransaction
          );
          if (!save2FaSecret) {
            throw {
              field: CM.API_RESPONSE.FIELD.ERROR,
              message: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
            };
          }
          const responsePayload = {
            message: CM.API_RESPONSE.MESSAGE.SUCCESS.SUCCESS,
            data: { url: dataUrl, secretKey: secret.base32 },
          };
          await initTransaction.commit();
          request.body.result = responsePayload;
          next();
        }
      });
    } catch (error) {
      console.log('ERROR IN GET GOOGLE AUTH CODE ::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  // enable disable google auth

  verifyGoogleAuthCode = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const requestPayload: UserInterface.ENABLE_DISABLE_2FA_REQUEST_PAYLOAD =
        request.body;
      const userId: string = request.userInfo.userId;
      const userRow = await userHelper.getUserRow({ userId: userId });
      if (userRow) {
        // verify code
        const verified: boolean = SpeakEasy.totp.verify({
          secret: userRow.google2FaSecret,
          encoding: 'base32',
          token: requestPayload.code,
        });
        if (verified) {
          next();
        } else {
          throw {
            field: CM.API_RESPONSE.ERROR_FIELD.CODE_NOT_VERIFIED,
            message: CM.API_RESPONSE.MESSAGE.ERROR.CODE_NOT_VERIFIED,
          };
        }
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.INVALID_REQUEST,
          message: CM.API_RESPONSE.MESSAGE.ERROR.INVALID_REQUEST,
        };
      }
    } catch (error) {
      console.log('ERROR IN ENABLE DISABLE GOOGLE AUTHENTICATION ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  enableDisable2FaAuth = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction: Transaction = await Model.sequelize.transaction();
    try {
      request.body.activityTitle = '2FA enable/disable';
      const requestPayload: UserInterface.ENABLE_DISABLE_2FA_REQUEST_PAYLOAD =
        request.body;
      const userId: string = request.userInfo.userId;

      let updatePayload: UserInterface.UPDATE_2FA_STATUS_PAYLOAD = {};
      if (requestPayload.type === CM.ENUM.TFA_TYPE.LOGIN) {
        updatePayload = {
          google2FaStatus: true,
          mpinStatus: false,
          smsStatus: false,
          emailStatus: false,
        };
      }
      if (requestPayload.type === CM.ENUM.TFA_TYPE.TRANSACTION) {
        updatePayload = {
          txnGoogle2FaStatus: requestPayload.status,
        };
      }

      const updateStatus: boolean = await userHelper.updateUserRow(
        { userId: userId },
        updatePayload,
        initTransaction
      );

      if (!updateStatus) {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.ERROR,
          message: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
        };
      } else {
        const responsePayload = {
          message:
            requestPayload.type === CM.ENUM.TFA_TYPE.TRANSACTION &&
            !requestPayload.status
              ? CM.API_RESPONSE.MESSAGE.SUCCESS.GOOGLE_2FA_DISABLED
              : CM.API_RESPONSE.MESSAGE.SUCCESS.GOOGLE_2FA_ENABLED,
          data: {},
          field:
            requestPayload.type === CM.ENUM.TFA_TYPE.TRANSACTION &&
            !requestPayload.status
              ? CM.API_RESPONSE.SUCCESS_FIELD.GOOGLE_2FA_DISABLED
              : CM.API_RESPONSE.SUCCESS_FIELD.GOOGLE_2FA_ENABLED,
        };
        await initTransaction.commit();
        request.body.result = responsePayload;
        next();
      }
    } catch (error) {
      console.log('ERROR IN ENABLE GOOGLE AUTHENTICATION ::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  verifyGoogle2FaCode = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      console.log('INSIDE VERIFY GOOGLE 2FA CODE::');
      const code: string = request.body.code;
      const userId: string = request.userInfo.userId;
      const userRow = await userHelper.getUserRow({ userId: userId });
      if (userRow) {
        if (!userRow.google2FaStatus && !userRow.txnGoogle2FaStatus) {
          throw {
            field: CM.API_RESPONSE.ERROR_FIELD.GOOGLE_2FA_DISABLED,
            message: CM.API_RESPONSE.MESSAGE.GOOGLE_TFA_IS_DISABLED,
          };
        }
        // verify code
        const verified: boolean = SpeakEasy.totp.verify({
          secret: userRow.google2FaSecret,
          encoding: 'base32',
          token: code,
        });

        if (verified) {
          const responsePayload = {
            message: CM.API_RESPONSE.MESSAGE.SUCCESS.CODE_VERIFIED,
            data: {},
            field: CM.API_RESPONSE.SUCCESS_FIELD.CODE_VERIFIED,
          };
          request.body.result = responsePayload;
          next();
        } else {
          throw {
            field: CM.API_RESPONSE.ERROR_FIELD.CODE_NOT_VERIFIED,
            message: CM.API_RESPONSE.MESSAGE.ERROR.CODE_NOT_VERIFIED,
          };
        }
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.INVALID_REQUEST,
          message: CM.API_RESPONSE.MESSAGE.ERROR.INVALID_REQUEST,
        };
      }
    } catch (error) {
      console.log('ERROR IN VERIFY GOOGLE 2FA CODE ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  // updateDeviceToken

  updateDeviceToken = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction: Transaction = await Model.sequelize.transaction();
    try {
      const requestPayload: UserInterface.UPDATE_DEVICE_TOKEN_REQUEST_PAYLOAD =
        request.body;
      const userId = request.userInfo.userId;

      const updateUserSessionRow = await userHelper.updateUserSessionRow(
        { userId: userId, deviceId: requestPayload.deviceId },
        { fcmToken: requestPayload.deviceToken },
        initTransaction
      );
      if (updateUserSessionRow) {
        const responsePayload = {
          message: CM.API_RESPONSE.MESSAGE.SUCCESS.RECORD_UPDATE,
          data: {},
        };
        await initTransaction.commit();
        request.body.result = responsePayload;
        next();
      } else {
        throw {
          field: CM.API_RESPONSE.FIELD.ERROR,
          message: CM.API_RESPONSE.MESSAGE.ERROR.RECORD_UPDATION_FAILED,
        };
      }
    } catch (error) {
      console.log('ERROR IN UPDATE DEVICE TOKEN ::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  // set default currency and language
  setDefaultCurrency = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTransaction: Transaction = await Model.sequelize.transaction();
    try {
      const requestPayload: UserInterface.SET_DEFAULT_CURRENCY_PAYLOAD =
        request.body;
      const userId = request.userInfo.userId;
      if (!requestPayload.defaultCurrency && !requestPayload.defaultLanguage) {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.INVALID_REQUEST,
          message: CM.API_RESPONSE.MESSAGE.ERROR.INVALID_REQUEST,
        };
      }
      let updatePayload = {};
      if (requestPayload.defaultCurrency) {
        updatePayload = { defaultFiatCurrency: requestPayload.defaultCurrency };
      }
      if (requestPayload.defaultCurrency) {
        updatePayload = {
          ...updatePayload,
          defaultLanguage: requestPayload.defaultLanguage,
        };
      }

      const updateDefaultCurrency = await userHelper.updateUserRow(
        { userId: userId },
        updatePayload,

        initTransaction
      );
      if (!updateDefaultCurrency) {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.ERROR,
          message: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
        };
      }
      await initTransaction.commit();
      const responsePayload = {
        message: CM.API_RESPONSE.MESSAGE.SUCCESS.RECORD_UPDATE,
        data: {},
        field: CM.API_RESPONSE.SUCCESS_FIELD.RECORD_UPDATED,
      };

      request.body.result = responsePayload;
      next();
    } catch (error) {
      console.log('ERROR IN SET DEFAULT CURRENCY ::', error);
      await initTransaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  // verify login 2fa

  check2FaVerificationMethod = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const requestPayload: UserInterface.VERIFY_LOGIN_2FA_REQUEST_PAYLOAD =
        request.body;

      const userRow = request.body.userRow;
      if (requestPayload.method === CM.ENUM.OTP_METHOD.EMAIL) {
        request.body.verifyOtpPayload = {
          userId: userRow.userId,
          email: userRow.email,
          method: requestPayload.method,
          service: CM.ENUM.OTP_SERVICE.LOGIN_2FA_VERIFICATION,
          otp: requestPayload.otp,
        };
        next();
      } else if (requestPayload.method === CM.ENUM.OTP_METHOD.SMS) {
        request.body.verifyOtpPayload = {
          userId: userRow.userId,
          phoneNumber: userRow.phoneNumber,
          method: requestPayload.method,
          service: CM.ENUM.OTP_SERVICE.LOGIN_2FA_VERIFICATION,
          otp: requestPayload.otp,
        };
        next();
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.ERROR,
          messgae: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
        };
      }
    } catch (error) {
      console.log('ERROR IN CHECK VERIFICATION METHOD ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  verify2FaOtp = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    const initTrasaction: Transaction = await Model.sequelize.transaction();
    try {
      console.log('VERIFY OTP PAYLOAD::', request.body.verifyOtpPayload);
      const verifyOtpRow = await userHelper.getOtpRow(
        request.body.verifyOtpPayload
      );
      if (verifyOtpRow) {
        const dbOtpCreationTimeUnix =
          moment(verifyOtpRow.updatedAt).utc().unix() +
          Number(CM.OTP_EXPIRE_TIME);

        const currentDate = new Date();
        const expireTimeUnix = moment(currentDate).utc().unix();
        console.log('DMB:', dbOtpCreationTimeUnix, 'CURRENT::', expireTimeUnix);
        if (expireTimeUnix > dbOtpCreationTimeUnix) {
          throw {
            field: CM.API_RESPONSE.ERROR_FIELD.OTP_EXPIRED,
            message: CM.API_RESPONSE.MESSAGE.ERROR.OTP_EXPIRED,
          };
        } else {
          const isOtpRowDestroyed = await userHelper.destroyOtp(
            request.body.verifyOtpPayload,
            initTrasaction
          );
          if (isOtpRowDestroyed) {
            await initTrasaction.commit();
            const responsePayload: GetCommonResponse = {
              message: CM.API_RESPONSE.MESSAGE.SUCCESS.VERIFICATION_SUCCESS,
              data: {},
            };
            request.body.result = responsePayload;
            next();
          } else {
            throw {
              field: CM.API_RESPONSE.ERROR_FIELD.VERIFICATION_FAILED,
              message: CM.API_RESPONSE.MESSAGE.ERROR.VERIFICATION_FAILED,
            };
          }
        }
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.INCORRECT_OTP,
          message: CM.API_RESPONSE.MESSAGE.ERROR.INCORRECT_OTP,
        };
      }
    } catch (error) {
      console.log('ERROR IN IS OTP EXPIRED ::', error);
      await initTrasaction.rollback();
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  uploadAttachment = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const attachments: any = request.files;
      console.log('ATTACHMENTLL', attachments);
      const ticketId = await Helpers.utilitiesHelper.generateRandomNumber(10);
      console.log('TICKET ID::', ticketId);

      if (attachments && attachments.length) {
        // console.log('ATTACHMENT', attachments);
        if (
          Number(attachments.length) >
          Number(CM.CONSTANT.MAX_SUPPORT_TICKET_ATTACHMENT)
        ) {
          console.log(
            `MORE THAN ${CM.CONSTANT.MAX_SUPPORT_TICKET_ATTACHMENT} ATTACHMENT`
          );
          throw {
            field: CM.API_RESPONSE.FIELD.ERROR,
            message: CM.API_RESPONSE.MESSAGE.ERROR.ATTACHMENT_LIMIT_ACCEED,
          };
        }

        let arrayOfattachments: string[] = [];
        await Promise.all(
          attachments.map(async (attachment: any, index: number) => {
            console.log('ATTACHMENT::', attachment);

            if (
              Number(attachment.size) / 1024 / 1024 >
              Number(CM.CONSTANT.MAX_SUPPORT_TICKET_ATTACHMENT_SIZE)
            ) {
              throw {
                field: CM.API_RESPONSE.FIELD.LARGE_FILE_SIZE,
                message: CM.API_RESPONSE.MESSAGE.ERROR.LARGE_FILE_SIZE,
              };
            }
            const originalNameSplitInArray =
              attachment?.originalname?.split('.');
            const docType =
              originalNameSplitInArray[
                Number(originalNameSplitInArray.length) - 1
              ]?.toLowerCase();
            if (
              CM.MIME_TYPE.includes(attachment.mimetype) &&
              attachment.originalname &&
              CM.DOC_EXTENTION_TYPE.includes(docType)
            ) {
              console.log('CORRECT MIMETYPE');
              const attachmentName = `${ticketId}_attachment_${
                index + 1
              }.${docType}`;
              console.log(
                'ATTACHEMENT NAME::',
                attachmentName,
                attachment.buffer
              );
              const savedAttachment: { error: boolean; data: string } =
                await Helpers.s3ClientHelper.uploadS3(
                  attachment.buffer,
                  CM.AWS_CONFIG.DIRECTORY.SUPPORT_TICKET,
                  attachmentName
                );
              console.log('SAVED ATTACHMENT:::', savedAttachment);
              if (savedAttachment && !savedAttachment.error) {
                arrayOfattachments.push(savedAttachment.data);
              } else {
                throw {
                  field: CM.API_RESPONSE.FIELD.ERROR,
                  message:
                    CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
                };
              }
            } else {
              console.log('NOT MIMITYE');
              throw {
                field: CM.API_RESPONSE.FIELD.MIME_TYPE,
                message: CM.API_RESPONSE.MESSAGE.ERROR.INCOMPATIBLE_DOC_TYPE,
              };
            }
          })
        );
        request.body.ticketId = ticketId;
        request.body.arrayOfattachments = arrayOfattachments;
        next();
      } else {
        request.body.ticketId = ticketId;
        next();
      }
    } catch (error) {
      console.log('ERROR IN UPLOAD ATTACHMENT ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  createSupportTicket = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      request.body.activityTitle = 'Support ticket create';
      const userId: string = request.userInfo.userId;

      const userRow = await userHelper.getUserRow({ userId: userId });
      if (!userRow) {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.INVALID_REQUEST,
          message: CM.API_RESPONSE.MESSAGE.ERROR.INVALID_REQUEST,
        };
      }
      let supportTicketPayload: UserInterface.CREATE_SUPPORT_TICKET_PAYLOAD = {
        subject: request.body.subject,
        description: request.body.description,
        ticketId: request.body.ticketId,
        userId: userId,
        uid: userRow.uidString,
      };

      if (request.body.arrayOfattachments) {
        supportTicketPayload.attachment = request.body.arrayOfattachments;
      }

      const isSupportTicketCreated = await userHelper.createSupportTicket(
        supportTicketPayload
      );
      if (isSupportTicketCreated) {
        const responsePayload: GetCommonResponse = {
          message: CM.API_RESPONSE.MESSAGE.SUCCESS.SUPPORT_TICKET_CREATED,
          data: {},
          field: CM.API_RESPONSE.SUCCESS_FIELD.SUPPORT_TICKET_CREATED,
        };
        request.body.result = responsePayload;
        next();
      } else {
        throw {
          field: CM.API_RESPONSE.ERROR_FIELD.ERROR,
          message: CM.API_RESPONSE.MESSAGE.ERROR_IN_PERFORMING_OPERATION,
        };
      }
    } catch (error) {
      console.log('ERROR IN CREATE SUPPORT TICKET ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };

  getSupportTickets = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const userId: string = request.userInfo.userId;
      let responsePayload: GetCommonResponse;
      const supportTickets = await Model.SupportTickets.findAll({
        where: { userId: userId },
        order: [['createdAt', 'DESC']],
        raw: true,
      });
      if (supportTickets.length) {
        responsePayload = {
          message: CM.API_RESPONSE.MESSAGE.SUCCESS.RECORD_FOUND,
          data: supportTickets,
        };
      } else {
        responsePayload = {
          message: CM.API_RESPONSE.MESSAGE.NO_RECORD_FOUND,
          data: [],
        };
      }
      request.body.result = responsePayload;
      next();
    } catch (error) {
      console.log('ERROR IN GET SUPPORT TICKETS ::', error);
      return setResponse.error400(request, response, {
        error: error as GenericError,
      });
    }
  };
}

export default new userMiddleware();
