import { body } from 'express-validator';
import {
  VALIDATION,
  CONSTANT,
  REGEX,
  ENUM,
  SUPPORTED_CURRENCY_LIST,
  SUPPORTED_LANGUAGE_LIST,
} from '../../constant/response';

const isUserAlreadyRegistered = [
  body('email')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_EMAIL)
    .trim()
    .toLowerCase()
    .bail()
    .isEmail()
    .withMessage(VALIDATION.USER.INVALID_EMAIL),
];

const isSocialIdExist = [
  body('socialId')
    .notEmpty()
    .withMessage(VALIDATION.USER.EMPTY_SOCIAL_ID)
    .trim(),
];

const update2faStatus = [
  body('statusType')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_STATUS_TYPE)
    .isIn([
      ENUM.TFA_STATUS_TYPE.EMAIL,
      ENUM.TFA_STATUS_TYPE.MPIN,
      ENUM.TFA_STATUS_TYPE.SMS,
      ENUM.TFA_STATUS_TYPE.TXN_EMAIL,
      ENUM.TFA_STATUS_TYPE.TXN_MPIN,
      ENUM.TFA_STATUS_TYPE.TXN_SMS,
    ])
    .withMessage(VALIDATION.USER.INVALID_STATUS_TYPE)
    .trim(),
  body('type')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_TYPE)
    .isIn([ENUM.TFA_TYPE.LOGIN, ENUM.TFA_TYPE.TRANSACTION])
    .withMessage(VALIDATION.USER.INVALID_TYPE),
  body('status')
    .if((value, { req }) => req.body.type === ENUM.TFA_TYPE.TRANSACTION)
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_TFA_STATUS)
    .isBoolean()
    .withMessage(VALIDATION.USER.INVALID_TFA_STATUS),
  body('otp')
    .if((value, { req }) => req.body.type === ENUM.TFA_TYPE.TRANSACTION)
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_OTP)
    .trim()
    .bail()
    .isLength({ max: CONSTANT.OTP.LENGTH, min: CONSTANT.OTP.LENGTH })
    .withMessage(VALIDATION.USER.INVALID_OTP),
];

const login = [
  body('email')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_EMAIL)
    .trim()
    .toLowerCase()
    .bail()
    .isEmail()
    .withMessage(VALIDATION.USER.INVALID_EMAIL),
  body('password')
    .if(
      (value, { req }) =>
        req.body.socialLoginVia === '' || req.body.socialLoginVia === null
    )
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_PASSWORD)
    .trim()
    .bail()
    .matches(REGEX.PASSWORD)
    .withMessage(VALIDATION.USER.INVALID_PASSWORD),
  body('deviceType')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_DEVICE_TYPE)
    .trim()
    .bail()
    .toUpperCase()
    .isIn([
      ENUM.DEVICE_TYPE.ANDROID,
      ENUM.DEVICE_TYPE.IOS,
      ENUM.DEVICE_TYPE.WEB,
    ])
    .withMessage(VALIDATION.USER.INVALID_DEVICE_TYPE),
  body('deviceId')
    .notEmpty()
    .withMessage(VALIDATION.USER.EMPTY_DEVICE_ID)
    .trim(),
];

const registration = [
  body('email')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_EMAIL)
    .trim()
    .toLowerCase()
    .bail()
    .isEmail()
    .withMessage(VALIDATION.USER.INVALID_EMAIL),
  body('phoneNumber')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_PHONE_NUMBER)
    .trim()
    .bail()
    .matches(REGEX.PHONENUMBER_REGEX)
    .withMessage(VALIDATION.USER.INVALID_PHONE_NUMBER),
  // body('countryCode')
  //   .notEmpty()
  //   .withMessage(VALIDATION.USER.EMPTY_COUNTRY_CODE),
  // body('mobilePin')
  //   .notEmpty()
  //   .withMessage(VALIDATION.USER.INVALID_PIN)
  //   .trim()
  //   .isLength({ min: CONSTANT.MPIN.LENGTH, max: CONSTANT.MPIN.LENGTH })
  //   .withMessage(VALIDATION.USER.INVALID_PIN),
  body('password')
    .if(
      (value, { req }) =>
        req.body.socialRegistrationVia === '' ||
        req.body.socialRegistrationVia === null
    )
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_PASSWORD)
    .trim()
    .bail()
    .matches(REGEX.PASSWORD)
    .withMessage(VALIDATION.USER.INVALID_PASSWORD),
  body('deviceType')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_DEVICE_TYPE)
    .trim()
    .bail()
    .toUpperCase()
    .isIn([
      ENUM.DEVICE_TYPE.ANDROID,
      ENUM.DEVICE_TYPE.IOS,
      ENUM.DEVICE_TYPE.WEB,
    ])
    .withMessage(VALIDATION.USER.INVALID_DEVICE_TYPE),
  body('deviceId')
    .notEmpty()
    .withMessage(VALIDATION.USER.EMPTY_DEVICE_ID)
    .trim(),
];

const sendOtp = [
  body('email')
    .if((value, { req }) => req.body.method === ENUM.OTP_METHOD.EMAIL)
    .toLowerCase()
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_EMAIL)
    .trim()
    .bail()
    .isEmail()
    .withMessage(VALIDATION.USER.INVALID_EMAIL),
  body('phoneNumber')
    .if((value, { req }) => req.body.method === ENUM.OTP_METHOD.SMS)
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_PHONE_NUMBER)
    .trim()
    .bail()
    .matches(REGEX.PHONENUMBER_REGEX)
    .withMessage(VALIDATION.USER.INVALID_PHONE_NUMBER),
  body('method')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALId_METHOD)
    .trim()
    .toUpperCase()
    .isIn([ENUM.OTP_METHOD.EMAIL, ENUM.OTP_METHOD.SMS])
    .withMessage(VALIDATION.USER.INVALId_METHOD),
  body('service')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_SERVICE)
    .trim()
    .toUpperCase()
    .isIn([ENUM.OTP_SERVICE.REGISTRATION, ENUM.OTP_SERVICE.FORGOT_MPIN])
    .withMessage(VALIDATION.USER.INVALID_SERVICE),
];

const sendOtpAuth = [
  body('method')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALId_METHOD)
    .trim()
    .toUpperCase()
    .isIn([ENUM.OTP_METHOD.EMAIL, ENUM.OTP_METHOD.SMS])
    .withMessage(VALIDATION.USER.INVALId_METHOD),
  body('service')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_SERVICE)
    .trim()
    .toUpperCase()
    .isIn([
      ENUM.OTP_SERVICE.CRYPTO_WITHDRAW,
      ENUM.OTP_SERVICE.FIAT_WITHDRAW,
      ENUM.OTP_SERVICE.CRYPTO_INTERNAL_TRANSFER,
      ENUM.OTP_SERVICE.FIAT_INTERNAL_TRANSFER,
      ENUM.OTP_SERVICE.TXN_SECURITY_VERIFICATION,
    ])
    .withMessage(VALIDATION.USER.INVALID_SERVICE),
];

const verifyOtp = [
  body('email')
    .if((value, { req }) => req.body.method === ENUM.OTP_METHOD.EMAIL)
    .toLowerCase()
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_EMAIL)
    .trim()
    .bail()
    .isEmail()
    .withMessage(VALIDATION.USER.INVALID_EMAIL),
  body('phoneNumber')
    .if((value, { req }) => req.body.method === ENUM.OTP_METHOD.SMS)
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_PHONE_NUMBER)
    .trim()
    .bail()
    .matches(REGEX.PHONENUMBER_REGEX)
    .withMessage(VALIDATION.USER.INVALID_PHONE_NUMBER),
  body('otp')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_OTP)
    .trim()
    .bail()
    .isLength({ max: CONSTANT.OTP.LENGTH, min: CONSTANT.OTP.LENGTH })
    .withMessage(VALIDATION.USER.INVALID_OTP),
  body('method')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALId_METHOD)
    .trim()
    .toUpperCase()
    .isIn([ENUM.OTP_METHOD.EMAIL, ENUM.OTP_METHOD.SMS])
    .withMessage(VALIDATION.USER.INVALId_METHOD),
  body('service')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_SERVICE)
    .trim()
    .toUpperCase()
    .isIn([
      ENUM.OTP_SERVICE.REGISTRATION,
      ENUM.OTP_SERVICE.FORGOT_PASSWORD,
      ENUM.OTP_SERVICE.FORGOT_MPIN,
    ])
    .withMessage(VALIDATION.USER.INVALID_SERVICE),
];

const verifyLogin2Fa = [
  body('otp')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_OTP)
    .trim()
    .bail()
    .isLength({ max: CONSTANT.OTP.LENGTH, min: CONSTANT.OTP.LENGTH })
    .withMessage(VALIDATION.USER.INVALID_OTP),
  body('method')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALId_METHOD)
    .trim()
    .toUpperCase()
    .isIn([ENUM.OTP_METHOD.EMAIL, ENUM.OTP_METHOD.SMS])
    .withMessage(VALIDATION.USER.INVALId_METHOD),
];

const sendPhoneOtp = [
  body('phoneNumber')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_PHONE_NUMBER)
    .trim()
    .bail()
    .matches(REGEX.PHONENUMBER_REGEX)
    .withMessage(VALIDATION.USER.INVALID_PHONE_NUMBER),
];

const verifyPhoneOtp = [
  body('phoneNumber')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_PHONE_NUMBER)
    .trim()
    .bail()
    .matches(REGEX.PHONENUMBER_REGEX)
    .withMessage(VALIDATION.USER.INVALID_PHONE_NUMBER),
  body('countryCode')
    .notEmpty()
    .withMessage(VALIDATION.USER.EMPTY_COUNTRY_CODE),
  body('otp')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_OTP)
    .trim()
    .bail()
    .isLength({ max: CONSTANT.OTP.LENGTH, min: CONSTANT.OTP.LENGTH })
    .withMessage(VALIDATION.USER.INVALID_OTP),
];

const forgotPassword = [
  body('email')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_EMAIL)
    .trim()
    .toLowerCase()
    .bail()
    .isEmail()
    .withMessage(VALIDATION.USER.INVALID_EMAIL),
];

const resetPassword = [
  body('email')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_EMAIL)
    .trim()
    .toLowerCase()
    .bail()
    .isEmail()
    .withMessage(VALIDATION.USER.INVALID_EMAIL),
  body('newPassword')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_PASSWORD)
    .trim()
    .bail()
    .matches(REGEX.PASSWORD)
    .withMessage(VALIDATION.USER.INVALID_PASSWORD),
];

const enableDisableGoogleAuth = [
  body('code')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_CODE)
    .trim()
    .isLength({ min: CONSTANT.MPIN.LENGTH, max: CONSTANT.MPIN.LENGTH })
    .withMessage(VALIDATION.USER.INVALID_CODE),
  body('type')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_TYPE)
    .isIn([ENUM.TFA_TYPE.LOGIN, ENUM.TFA_TYPE.TRANSACTION])
    .withMessage(VALIDATION.USER.INVALID_TYPE),
  body('status')
    .if((value, { req }) => req.body.type === ENUM.TFA_TYPE.TRANSACTION)
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_TFA_STATUS)
    .isBoolean()
    .withMessage(VALIDATION.USER.INVALID_TFA_STATUS),
];

const verifyGoogle2FaCode = [
  body('code')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_CODE)
    .trim()
    .isLength({ min: CONSTANT.MPIN.LENGTH, max: CONSTANT.MPIN.LENGTH })
    .withMessage(VALIDATION.USER.INVALID_CODE),
];

const updateDeviceToken = [
  body('deviceToken')
    .notEmpty()
    .withMessage(VALIDATION.USER.EMPTY_DEVICE_TOKEN)
    .trim(),
  body('deviceId')
    .notEmpty()
    .withMessage(VALIDATION.USER.EMPTY_DEVICE_ID)
    .trim(),
];

const setDefaultCurrency = [
  body('defaultCurrency')
    .optional()
    .toUpperCase()
    .isIn(SUPPORTED_CURRENCY_LIST)
    .withMessage(VALIDATION.USER.INVALID_DEFAULT_CURRENCY)
    .trim(),
  body('defaultLanguage')
    .optional()
    .toLowerCase()
    .isIn(SUPPORTED_LANGUAGE_LIST)
    .withMessage(VALIDATION.USER.INVALID_DEFAULT_LANGUAGE)
    .trim(),
];

const resetMpin = [
  body('email')
    .if((value, { req }) => req.body.method === ENUM.OTP_METHOD.EMAIL)
    .toLowerCase()
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_EMAIL)
    .trim()
    .bail()
    .isEmail()
    .withMessage(VALIDATION.USER.INVALID_EMAIL),
  body('phoneNumber')
    .if((value, { req }) => req.body.method === ENUM.OTP_METHOD.SMS)
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_PHONE_NUMBER)
    .trim()
    .bail()
    .matches(REGEX.PHONENUMBER_REGEX)
    .withMessage(VALIDATION.USER.INVALID_PHONE_NUMBER),
  body('method')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALId_METHOD)
    .trim()
    .toUpperCase()
    .isIn([ENUM.OTP_METHOD.EMAIL, ENUM.OTP_METHOD.SMS])
    .withMessage(VALIDATION.USER.INVALId_METHOD),
  body('mobilePin')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_PIN)
    .trim()
    .isLength({ min: CONSTANT.MPIN.LENGTH, max: CONSTANT.MPIN.LENGTH })
    .withMessage(VALIDATION.USER.INVALID_PIN),
];

const resetMpinWithoutAuth = [
  body('email')
    .if((value, { req }) => req.body.method === ENUM.OTP_METHOD.EMAIL)
    .toLowerCase()
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_EMAIL)
    .trim()
    .bail()
    .isEmail()
    .withMessage(VALIDATION.USER.INVALID_EMAIL),
  body('phoneNumber')
    .if((value, { req }) => req.body.method === ENUM.OTP_METHOD.SMS)
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_PHONE_NUMBER)
    .trim()
    .bail()
    .matches(REGEX.PHONENUMBER_REGEX)
    .withMessage(VALIDATION.USER.INVALID_PHONE_NUMBER),
  body('method')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALId_METHOD)
    .trim()
    .toUpperCase()
    .isIn([ENUM.OTP_METHOD.EMAIL, ENUM.OTP_METHOD.SMS])
    .withMessage(VALIDATION.USER.INVALId_METHOD),
  body('otp')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_OTP)
    .trim()
    .bail()
    .isLength({ max: CONSTANT.OTP.LENGTH, min: CONSTANT.OTP.LENGTH })
    .withMessage(VALIDATION.USER.INVALID_OTP),
  body('mobilePin')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_PIN)
    .trim()
    .isLength({ min: CONSTANT.MPIN.LENGTH, max: CONSTANT.MPIN.LENGTH })
    .withMessage(VALIDATION.USER.INVALID_PIN),
];

const changeMpin = [
  body('oldMobilePin')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_PIN)
    .trim()
    .bail()
    .isLength({ min: CONSTANT.MPIN.LENGTH, max: CONSTANT.MPIN.LENGTH })
    .withMessage(VALIDATION.USER.INVALID_PIN),
  body('newMobilePin')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_PIN)
    .trim()
    .bail()
    .isLength({ min: CONSTANT.MPIN.LENGTH, max: CONSTANT.MPIN.LENGTH })
    .withMessage(VALIDATION.USER.INVALID_PIN),
];

const changePassword = [
  body('email')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_EMAIL)
    .trim()
    .toLowerCase()
    .bail()
    .isEmail()
    .withMessage(VALIDATION.USER.INVALID_EMAIL),
  body('oldPassword')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_PASSWORD)
    .trim()
    .bail()
    .matches(REGEX.PASSWORD)
    .withMessage(VALIDATION.USER.INVALID_PASSWORD),
  body('newPassword')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_PASSWORD)
    .trim()
    .bail()
    .matches(REGEX.PASSWORD)
    .withMessage(VALIDATION.USER.INVALID_PASSWORD),
];

const updateProfile = [
  body('nationality')
    .notEmpty()
    .withMessage(VALIDATION.USER.EMPTY_NATIONALITY)
    .trim(),
  body('accountType')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_ACCOUNT_TYPE)
    .trim()
    .toUpperCase()
    .bail()
    .isIn([ENUM.ACCOUNT_TYPE.BUSINESS, ENUM.ACCOUNT_TYPE.INDIVIDUAL])
    .withMessage(VALIDATION.USER.INVALID_ACCOUNT_TYPE),
];

const individualUserDetail = [
  body('firstName')
    .notEmpty()
    .withMessage(VALIDATION.USER.EMPTY_FIRST_NAME)
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage(VALIDATION.USER.INVALID_FIRST_NAME),
  body('lastName')
    .notEmpty()
    .withMessage(VALIDATION.USER.EMPTY_LAST_NAME)
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage(VALIDATION.USER.INVALID_LAST_NAME),
  body('dateOfBirth').notEmpty().withMessage(VALIDATION.USER.EMPTY_DOB).trim(),
  body('gender')
    .notEmpty()
    .withMessage(VALIDATION.USER.EMPTY_GENDER)
    .trim()
    .toUpperCase()
    .isIn([
      ENUM.GENDER.MALE,
      ENUM.GENDER.FEMALE,
      ENUM.GENDER.OTHER,
      ENUM.GENDER.PREFER_NOT_TO_SAY,
    ])
    .withMessage(VALIDATION.USER.INVALID_GENDER),
  body('address').notEmpty().withMessage(VALIDATION.USER.EMPTY_ADDRESS).trim(),
  body('city').notEmpty().withMessage(VALIDATION.USER.EMPTY_CITY).trim(),
  body('postalCode')
    .notEmpty()
    .withMessage(VALIDATION.USER.EMPTY_POSTAL_CODE)
    .trim(),
];

const businessDetail = [
  body('businessName')
    .notEmpty()
    .withMessage(VALIDATION.USER.EMPTY_BUSINESS_NAME)
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage(VALIDATION.USER.INVALID_BUSINESS_NAME),
  body('incorporationDate')
    .notEmpty()
    .withMessage(VALIDATION.USER.EMPTY_INCORPOTATION_DATE)
    .trim(),
  body('companyType')
    .notEmpty()
    .withMessage(VALIDATION.USER.EMPTY_COMPANY_TYPE)
    .trim(),
  // body('taxOrVatId')
  //   .notEmpty()
  //   .withMessage(VALIDATION.USER.EMPTY_TAX_OR_VAT_ID)
  //   .trim(),
];

const logout = [
  body('deviceId')
    .notEmpty()
    .withMessage(VALIDATION.USER.EMPTY_DEVICE_ID)
    .trim(),
];

const refreshToken = [
  body('deviceType')
    .notEmpty()
    .withMessage(VALIDATION.USER.INVALID_DEVICE_TYPE)
    .trim()
    .bail()
    .toUpperCase()
    .isIn([
      ENUM.DEVICE_TYPE.ANDROID,
      ENUM.DEVICE_TYPE.IOS,
      ENUM.DEVICE_TYPE.WEB,
    ])
    .withMessage(VALIDATION.USER.INVALID_DEVICE_TYPE),
  body('deviceId')
    .notEmpty()
    .withMessage(VALIDATION.USER.EMPTY_DEVICE_ID)
    .trim(),
];

const supportTicket = [
  body('subject')
    .notEmpty()
    .withMessage(VALIDATION.USER.EMPTY_SUPPORT_TICKET_SUBJECT),
  body('description')
    .notEmpty()
    .withMessage(VALIDATION.USER.EMPTY_SUPPORT_TICKET_DESCRIPTION),
];

export {
  login,
  registration,
  sendOtp,
  forgotPassword,
  verifyOtp,
  resetPassword,
  changePassword,
  updateProfile,
  individualUserDetail,
  businessDetail,
  verifyPhoneOtp,
  sendPhoneOtp,
  isUserAlreadyRegistered,
  isSocialIdExist,
  sendOtpAuth,
  update2faStatus,
  resetMpin,
  changeMpin,
  enableDisableGoogleAuth,
  verifyGoogle2FaCode,
  updateDeviceToken,
  logout,
  verifyLogin2Fa,
  refreshToken,
  supportTicket,
  setDefaultCurrency,
};
