import { Controller } from '../../interfaces';
import * as express from 'express';
import { ResponseHelper } from '../../helpers';
import * as CM from '../../constant/response';
import * as Middlewares from '../../middlewares';
import * as Validation from './user.validation';
import userMiddleware from './user.middleware';
const setResponse = ResponseHelper;

class UserController implements Controller {
  path: string;
  router: express.Router;
  constructor(path: string, router: express.Router) {
    this.path = path;
    this.router = router;
    this.initializeRoutes();
  }

  initializeRoutes = () => {
    this.router
      .all('/*')
      .post(
        this.path + '/registration',
        Validation.registration,
        Middlewares.postValidate,
        userMiddleware.isSocialRegistration,
        userMiddleware.isUserAlreadyExist,
        userMiddleware.isAlreadySocialRegistered,
        userMiddleware.newSocialRegistration,
        userMiddleware.isUserEmailVerified,
        userMiddleware.isUserPhoneVerified,
        userMiddleware.registerUser,
        userMiddleware.destroyDeviceSession,
        userMiddleware.createUserSession,
        userMiddleware.createUserReferralCode,
        this.responseHandler
      )
      .post(
        this.path + '/login',
        Validation.login,
        Middlewares.postValidate,
        userMiddleware.isSocialLogin,
        userMiddleware.isUserExist,
        userMiddleware.login,
        userMiddleware.isSmsLogin,
        userMiddleware.isEmailLogin,
        userMiddleware.sendLoginOtp,
        userMiddleware.destroyDeviceSession,
        userMiddleware.createUserSession,
        this.responseHandler
      )
      .post(
        this.path + '/sendOtp',
        Validation.sendOtp,
        Middlewares.postValidate,
        userMiddleware.checkUserDetail,
        userMiddleware.sendEmailOtp,
        userMiddleware.sendPhoneOtp,
        userMiddleware.saveOrUpdateOtp,
        this.responseHandler
      )
      .post(
        this.path + '/verifyOtp',
        Validation.verifyOtp,
        Middlewares.postValidate,
        userMiddleware.verifyUserDetail,
        userMiddleware.checkVerificationMethod,
        userMiddleware.isOtpExpired,
        userMiddleware.verifyOtp,
        this.responseHandler
      )
      .post(
        this.path + '/verifyLoginOtp',
        Validation.verifyLogin2Fa,
        Middlewares.postValidate,
        Middlewares.userValidationToken,
        userMiddleware.isUserRowExist,
        userMiddleware.check2FaVerificationMethod,
        userMiddleware.verify2FaOtp,
        this.responseHandler
      )
      .post(
        this.path + '/forgotPassword',
        Validation.forgotPassword,
        Middlewares.postValidate,
        userMiddleware.isEmailExist,
        userMiddleware.forgotPassword,
        this.responseHandler
      )
      .post(
        this.path + '/resetPassword',
        Validation.resetPassword,
        Middlewares.postValidate,
        userMiddleware.isEmailExist,
        userMiddleware.isForgotPasswordEmailVerified,
        userMiddleware.updatePassword,
        this.responseHandler
      )
      .post(
        this.path + '/changePassword',
        Validation.changePassword,
        Middlewares.postValidate,
        Middlewares.userValidationToken,
        userMiddleware.isUserRowExist,
        userMiddleware.verifyOldPassword,
        userMiddleware.changePassword,
        this.responseHandler
      )
      .post(
        this.path + '/changeMobilepin',
        Validation.changeMpin,
        Middlewares.postValidate,
        Middlewares.userValidationToken,
        userMiddleware.isUserRowExist,
        userMiddleware.verifyOldMpin,
        userMiddleware.changeMobilePin,
        this.responseHandler
      )
      .post(
        this.path + '/sendPhoneOtp',
        Validation.sendPhoneOtp,
        Middlewares.postValidate,
        Middlewares.userValidationToken,
        userMiddleware.isPhoneAlreadyExist,
        userMiddleware.sendKycPhoneOtp,
        this.responseHandler
      )
      .post(
        this.path + '/verifyPhoneNumber',
        Validation.verifyPhoneOtp,
        Middlewares.postValidate,
        Middlewares.userValidationToken,
        userMiddleware.isPhoneAlreadyExist,
        userMiddleware.isPhoneOtpExpired,
        userMiddleware.updatePhoneNumber,
        userMiddleware.deleteVerifiedOtp,
        this.responseHandler
      )
      .post(
        this.path + '/updateProfile',
        Validation.updateProfile,
        Middlewares.postValidate,
        Middlewares.userValidationToken,
        userMiddleware.updateUserProfile,
        this.responseHandler
      )
      .post(
        this.path + '/createMpin',
        Validation.updateProfile,
        Middlewares.postValidate,
        Middlewares.userValidationToken,
        userMiddleware.updateUserProfile,
        this.responseHandler
      )
      .post(
        this.path + '/individualDetail',
        Validation.individualUserDetail,
        Middlewares.postValidate,
        Middlewares.userValidationToken,
        userMiddleware.isIndividualUser,
        userMiddleware.saveIndividualUserDetail,
        this.responseHandler
      )

      .post(
        this.path + '/isUserAlreadyRegistered',
        Validation.isUserAlreadyRegistered,
        Middlewares.postValidate,
        userMiddleware.isUserAlreadyRegistered,
        this.responseHandler
      )
      .post(
        this.path + '/isSocialIdExist',
        Validation.isSocialIdExist,
        Middlewares.postValidate,
        userMiddleware.isSocialIdExist,
        this.responseHandler
      )
      .post(
        this.path + '/logout',
        Validation.logout,
        Middlewares.userValidationToken,
        userMiddleware.logout,
        this.responseHandler
      )
      .post(
        this.path + '/deleteAccount',
        Middlewares.userValidationToken,
        userMiddleware.isUserRowExist,
        userMiddleware.destroyUserSession,
        userMiddleware.deleteAccount,
        this.responseHandler
      )
      .post(
        this.path + '/refreshToken',
        Validation.refreshToken,
        Middlewares.postValidate,
        Middlewares.userAuthToken,
        userMiddleware.isUserSessionExist,
        userMiddleware.isUserRowExist,
        userMiddleware.refreshToken,
        this.responseHandler
      )
      .get(
        this.path + '/getProfile',
        Middlewares.userValidationToken,
        userMiddleware.getUserProfile,
        this.responseHandler
      )
      .get(
        this.path + '/getMarketingContent',
        userMiddleware.getMarketingContent,
        this.responseHandler
      )
      .get(
        this.path + '/getMarketingBanners/:limit/:offset/:type',
        Middlewares.userValidationToken,
        userMiddleware.getMarketingBanners,
        this.responseHandler
      )
      .post(
        this.path + '/sendOtpAuth',
        Validation.sendOtpAuth,
        Middlewares.postValidate,
        Middlewares.userValidationToken,
        userMiddleware.userAuth,
        userMiddleware.sendAuthOtp,
        userMiddleware.saveOrUpdateOtp,
        this.responseHandler
      )
      .post(
        this.path + '/update2faStatus',
        Validation.update2faStatus,
        Middlewares.postValidate,
        Middlewares.userValidationToken,
        userMiddleware.verifyTxnSecurityOtp,
        userMiddleware.updateStatus,
        this.responseHandler
      )
      .post(
        this.path + '/resetMpin',
        Validation.resetMpin,
        Middlewares.postValidate,
        userMiddleware.verifyUser,
        userMiddleware.isMpinOtpVerified,
        userMiddleware.resetMpin,
        this.responseHandler
      )
      .post(
        this.path + '/resetMpinWithoutAuth',
        Validation.resetMpin,
        Middlewares.postValidate,
        userMiddleware.verifyUser,
        userMiddleware.isForgotMpinOtpVerified,
        userMiddleware.resetMpinWithoutAuth,
        this.responseHandler
      )
      .get(
        this.path + '/googleAuthQrCode',
        Middlewares.userValidationToken,
        userMiddleware.isGoogle2FaAlreadyEnabled,
        userMiddleware.getGoogleAuthCode,
        this.responseHandler
      )
      .post(
        this.path + '/enableDisableGoogleAuth',
        Validation.enableDisableGoogleAuth,
        Middlewares.postValidate,
        Middlewares.userValidationToken,
        userMiddleware.verifyGoogleAuthCode,
        userMiddleware.enableDisable2FaAuth,
        this.responseHandler
      )
      .post(
        this.path + '/verifyGoogleAuthCode',
        Validation.verifyGoogle2FaCode,
        Middlewares.postValidate,
        Middlewares.userValidationToken,
        userMiddleware.verifyGoogle2FaCode,
        this.responseHandler
      )
      .post(
        this.path + '/updateDeviceToken',
        Validation.updateDeviceToken,
        Middlewares.postValidate,
        Middlewares.userValidationToken,
        userMiddleware.updateDeviceToken,
        this.responseHandler
      )
      .post(
        this.path + '/setDefaultCurrency',
        Validation.setDefaultCurrency,
        Middlewares.postValidate,
        Middlewares.userValidationToken,
        userMiddleware.setDefaultCurrency,
        this.responseHandler
      )
      .post(
        this.path + '/createSupportTicket',
        Middlewares.upload.array('attachment'),
        Validation.supportTicket,
        Middlewares.postValidate,
        Middlewares.userValidationToken,
        userMiddleware.uploadAttachment,
        userMiddleware.createSupportTicket,
        this.responseHandler
      )
      .get(
        this.path + '/getSupportTickets',
        Middlewares.userValidationToken,
        userMiddleware.getSupportTickets,
        this.responseHandler
      );
  };

  private responseHandler = async (
    request: express.Request,
    response: express.Response
  ) => {
    if (typeof request.body.result != 'undefined') {
      return setResponse.success(request, response, request.body.result);
    } else {
      return setResponse.error400(request, response, { message: CM.ERROR });
    }
  };
}

export default UserController;
