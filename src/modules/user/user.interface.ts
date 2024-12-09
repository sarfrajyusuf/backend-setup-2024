interface REGISTRATION_REQUEST_PAYLOAD {
  email: string;
  password: string;
  phoneNumber: string;
  deviceId: string;
  mobilePin: string;
  deviceToken: string;
  deviceType: string;
  countryCode: string;
  socialRegistrationVia: string;
  socialId: string;
  isSocialRegistration: boolean;
  isUserAlreadyRegistered: boolean;
  isSocialIdAlreadyExist: boolean;
  socialRegistrationPayload: {
    email: string;
    socialLoginVia: string;
    appleId: string;
    googleId: string;
    facebookId: string;
  };
  referredBy?: string;
  referralUserCode?: string;
}
interface LOGIN_REQUEST_PAYLOAD {
  email: string;
  password: string;
  deviceId: string;
  deviceToken: string;
  deviceType: string;
  socialLoginVia: string;
  socialId: string;
  isSocialLogin: boolean;
  socialLoginPayload: {
    socialLoginVia: string;
    appleId: string;
    googleId: string;
    facebookId: string;
  };
}

interface USER_SESSION_PAYLOAD {
  accessToken: string;
  refreshToken: string;
  userId: string;
  deviceId: string;
  deviceToken: string;
  deviceType: string;
}

interface UPDATE_USER_ROW_PAYLOAD {
  userId: string;
  email: string;
}
interface OTP_ROW_PAYLOAD {
  otp: string;
  email: string;
  phoneNumber: string;
  method: string;
  service: string;
}

interface FIND_OTP_ROW_PAYLOAD {
  email: string;
  phoneNumber: string;
  method: string;
  service: string;
}

interface UPDATE_OTP_PAYLOAD {
  otp?: string;
  status?: boolean;
}

interface UPDATE_DEVICE_TOKEN_REQUEST_PAYLOAD {
  deviceId: string;
  deviceToken: string;
}

interface SET_DEFAULT_CURRENCY_PAYLOAD {
  defaultCurrency?: string;
  defaultLanguage?: string;
}

interface UPDATE_USER_SESSION_ROW_PAYLOAD {
  accessToken?: string;
  deviceId?: string;
  deviceToken?: string;
  deviceType?: string;
  fcmToken?: string;
}

interface ENABLE_DISABLE_2FA_REQUEST_PAYLOAD {
  code: string;
  status: boolean;
  secret: string;
  type: string;
}

interface SEARCH_USER_SESSION_ROW_PAYLOAD {
  userId: string;
  deviceId: string;
}

interface UPDATE_USER_PAYLOAD {
  phoneNumber?: string;
  businessName?: string;
  brandName?: string;
  incorporationDate?: string;
  companyType?: string;
  txnGoogle2FaStatus?: boolean;
  taxVatId?: string;
  socialLoginVia?: string;
  appleId?: string;
  googleId?: string;
  facebookId?: string;
  status?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  lastLoginAt?: string;
  deviceToken?: string;
  mobilePin?: string;
  nationality?: string;
  accountType?: string;
  isEmailVerified?: boolean;
  countryCode?: string;
  email?: string;
  google2FaSecret?: string;
  google2FaStatus?: boolean;
  isBlocked?: boolean;
  isDeleted?: boolean;
  isReferee?: boolean;
  userKycStatus?:string;
  adminKycStatus?:string;
}

interface CREATE_OTP_PAYLOAD {
  otp: string;
  email?: string;
  phoneNumber?: string;
  method: string;
  service: string;
  status: boolean;
}

interface SEND_2FA_VERIFICATION_CODE_PAYLOAD {
  userId: string;
  method: string;
  service: string;
  otp: string;
  status: boolean;
  phoneNumber?: string;
  email?: string;
}
interface SAVE_BUSINESS_DETAIL_REQUEST_PAYLOAD {
  businessName: string;
  brandName: string;
  incorporationDate: string;
  companyType: string;
  // taxOrVatId: string;
}

interface CREATE_USER_PAYLOAD {
  email: string;
  password: string;
  socialLoginVia?: string;
  appleId?: string;
  googleId?: string;
  facebookId?: string;
  deviceId: string;
  deviceType: string;
}

interface CREATE_USER_SESSION_ROW_PAYLOAD {
  userId: string;
  accessToken: string;
  refreshToken: string;
  deviceId: string;
  deviceType: string;
  deviceToken: string;
  fcmToken: string;
}

interface GET_USER_SESSION_ROW_PAYLOAD {
  userId: string;
  accessToken: string;
  deviceId: string;
  refreshToken: string;
}
interface SEND_OTP_REQUEST_PAYLOAD {
  email: string;
  phoneNumber: string;
  method: string;
  service: string;
  saveOtpPayload: SAVE_OTP_PAYLOAD;
  otp: string;
}

interface SEND_PHONE_OTP_REQUEST_PAYLOAD {
  phoneNumber: string;
}

interface SAVE_OTP_PAYLOAD {
  email: string;
  phoneNumber: string;
  method: string;
  service: string;
}

interface DESTROY_OTP_PAYLOAD {
  email: string;
  method: string;
  service: string;
  userId: string;
  phoneNumber: string;
}

interface DESTROY_USER_SESSION_PAYLOAD {
  userId: string;
  deviceId: string;
}

interface VERIFY_OTP_REQUEST_PAYLOAD {
  email: string;
  phoneNumber: string;
  method: string;
  service: string;
  otp: string;
  verifyOtpPayload: VERIFY_OTP_PAYLOAD;
}

interface VERIFY_LOGIN_2FA_REQUEST_PAYLOAD {
  method: string;
  service: string;
  otp: string;
  verifyOtpPayload: VERIFY_OTP_PAYLOAD;
}

interface VERIFY_OTP_PAYLOAD {
  email: string;
  phoneNumber: string;
  method: string;
  service: string;
  otp: string;
}

interface FIND_USER_ROW_PAYLOAD {
  userId: string;
  email: string;
  phoneNumber: string;
  socialLoginVia: string;
  socialId: string;
  referralCode: string;
}

interface RESET_PASSWORD_REQUEST_PAYLOAD {
  email: string;
  newPassword: string;
}

interface FORGOT_MPIN_REQUEST_PAYLOAD {
  method: string;
}

interface RESET_MPIN_REQUEST_PAYLOAD {
  method: string;
  email?: string;
  phoneNumber?: string;
  otp?: string;
  mobilePin: string;
}

interface CHANGE_PASSWORD_REQUEST_PAYLOAD {
  email: string;
  oldPassword: string;
  newPassword: string;
}

interface CHANGE_MPIN_REQUEST_PAYLOAD {
  method: string;
  oldMobilePin: string;
  newMobilePin: string;
}

interface FORGOT_PASSWORD_REQUEST_PAYLOAD {
  email: string;
}

interface UPDATE_PROFILE_REQUEST_PAYLOAD {
  nationality: string;
  accountType: string;
}

interface INDIVIDUAL_USER_DETAIL_REQUEST_PAYLOAD {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  city: string;
  postalCode: string;
}

interface UPDATE_2FA_STATUS_REQUEST_PAYLOAD {
  statusType: string;
  type: string;
  status: boolean;
}
interface UPDATE_2FA_STATUS_PAYLOAD {
  mpinStatus?: boolean;
  smsStatus?: boolean;
  google2FaStatus?: boolean;
  emailStatus?: boolean;
  txnMpinStatus?: boolean;
  txnSmsStatus?: boolean;
  txnGoogle2FaStatus?: boolean;
  txnEmailStatus?: boolean;
}

interface SEND_OTP_AUTH_REQUEST_PAYLOAD {
  method: string;
  service: string;
}

interface CREATE_SUPPORT_TICKET_PAYLOAD {
  subject: string;
  description: string;
  ticketId: string;
  userId: string;
  attachment?: string[];
  uid: string;
}
interface PUSH_NOTIFICATION_PAYLOAD {
  title?: string;
  body: string;
  userId: string;
  requestType: string;
  extraData?: Array<string>;
}
interface EMAIL_PAYLOAD {
  subject: string;
  title: string;
  body: string;
  to: string;
  template: string;
}

interface SMS_PAYLOAD {
  message: string;
  to: string;
}
export {
  REGISTRATION_REQUEST_PAYLOAD,
  LOGIN_REQUEST_PAYLOAD,
  OTP_ROW_PAYLOAD,
  FIND_USER_ROW_PAYLOAD,
  VERIFY_OTP_REQUEST_PAYLOAD,
  SEND_OTP_REQUEST_PAYLOAD,
  CREATE_OTP_PAYLOAD,
  UPDATE_OTP_PAYLOAD,
  DESTROY_OTP_PAYLOAD,
  RESET_PASSWORD_REQUEST_PAYLOAD,
  FORGOT_PASSWORD_REQUEST_PAYLOAD,
  CHANGE_PASSWORD_REQUEST_PAYLOAD,
  CREATE_USER_PAYLOAD,
  UPDATE_USER_ROW_PAYLOAD,
  UPDATE_USER_PAYLOAD,
  SAVE_OTP_PAYLOAD,
  FIND_OTP_ROW_PAYLOAD,
  UPDATE_PROFILE_REQUEST_PAYLOAD,
  INDIVIDUAL_USER_DETAIL_REQUEST_PAYLOAD,
  SEND_PHONE_OTP_REQUEST_PAYLOAD,
  SAVE_BUSINESS_DETAIL_REQUEST_PAYLOAD,
  CREATE_USER_SESSION_ROW_PAYLOAD,
  USER_SESSION_PAYLOAD,
  GET_USER_SESSION_ROW_PAYLOAD,
  SEARCH_USER_SESSION_ROW_PAYLOAD,
  UPDATE_USER_SESSION_ROW_PAYLOAD,
  DESTROY_USER_SESSION_PAYLOAD,
  RESET_MPIN_REQUEST_PAYLOAD,
  FORGOT_MPIN_REQUEST_PAYLOAD,
  CHANGE_MPIN_REQUEST_PAYLOAD,
  ENABLE_DISABLE_2FA_REQUEST_PAYLOAD,
  UPDATE_DEVICE_TOKEN_REQUEST_PAYLOAD,
  VERIFY_LOGIN_2FA_REQUEST_PAYLOAD,
  SEND_2FA_VERIFICATION_CODE_PAYLOAD,
  UPDATE_2FA_STATUS_PAYLOAD,
  UPDATE_2FA_STATUS_REQUEST_PAYLOAD,
  SEND_OTP_AUTH_REQUEST_PAYLOAD,
  CREATE_SUPPORT_TICKET_PAYLOAD,
  SET_DEFAULT_CURRENCY_PAYLOAD,
  PUSH_NOTIFICATION_PAYLOAD,
  EMAIL_PAYLOAD,
  SMS_PAYLOAD,
};
