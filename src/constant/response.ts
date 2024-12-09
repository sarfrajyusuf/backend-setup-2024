import { EnvironmentVariables } from '../interfaces/interface';

export const API_BASE = '/users/api/v1';
export const envAlias = process.env as any as EnvironmentVariables;
export const ALLOWED_ORIGINS = envAlias.ALLOWED_ORIGINS;
export const NODE_ENV = envAlias.NODE_ENV;
export const SERVICE = 'user';
export const PG_CRED = {
  DBNAME: envAlias.DBNAME,
  USER_NAME: envAlias.USER_NAME,
  PASSWORD: envAlias.PASSWORD,
  HOST_NAME: envAlias.HOST_NAME,
};
export const SUPPORTED_CURRENCY_LIST = envAlias.SUPPORTED_CURRENCY_LIST;
export const SUPPORTED_LANGUAGE_LIST = envAlias.SUPPORTED_LANGUAGE_LIST;
export const OTP_EXPIRE_TIME = envAlias.OTP_EXPIRE_TIME_SECONDS;
export const TXN_OTP_EXPIRE_TIME = envAlias.TXN_OTP_EXPIRE_TIME_SECONDS;
export const REDIS_CRED = {
  REDIS_HOSTNAME: envAlias.REDIS_HOSTNAME,
  REDIS_PORT: envAlias.REDIS_PORT,
  REDIS_AUTH: envAlias.REDIS_AUTH,
  REDIS_USER: envAlias.REDIS_USER,
};

export const GOOGLE_CLOUD = {
  PROJECT_ID: envAlias.GOOGLE_CLOUD_PROJECT_ID,
  BUCKET_NAME: envAlias.GOOGLE_CLOUD_BUCKET_NAME,
  DIRECTORY: {
    QUERIES: envAlias.SUPPORT_TICKET_DIRECTORY_NAME,
  },
};

export const ELASTIC_SEARCH = {
  ES_NODE: envAlias.ES_NODE,
  API_KEY: {
    ID: envAlias.ES_API_KEY_ID,
    KEY: envAlias.ES_API_KEY,
  },
  SERVICE_TYPE: {
    API: 'api',
    GRPC: 'grpc',
  },
  REQUEST_TYPE: {
    JWT: 'jwt',
    ERROR: 'error',
    SUCCESS: 'success',
  },
  SERVICE_NAME: 'users',
  INDEXES: {
    ACTIVITY_LOGS: 'activitylogs',
  },
};

export const AWS_CONFIG = {
  BUCKET_NAME: envAlias.BUCKET_NAME,
  AWS_USER_KEY: envAlias.AWS_USER_KEY,
  AWS_USER_SECRET: envAlias.AWS_USER_SECRET,
  AWS_USER_REGION: envAlias.AWS_USER_REGION,
  AWS_S3_ENDPOINT: envAlias.AWS_S3_ENDPOINT,
  DIRECTORY: {
    SUPPORT_TICKET: 'supportTickets',
    KYC: 'kyc',
    KYT: 'kyt',
  },
  KYC_DOC_PREFIX: 'user_',
};

export const MIME_TYPE = [
  'image/png',
  'image/jpg',
  'image/jpeg',
  'image/gif',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const DOC_EXTENTION_TYPE = ['png', 'jpg', 'jpeg', 'gif', 'pdf', 'docx'];
export const GRPC = {
  GRPC_ENABLE_DISABLE: envAlias.GRPC_ENABLE_DISABLE,
  USER: envAlias.GRPC_USER,
  ADMIN: envAlias.GRPC_ADMIN,
  REFERRAL: envAlias.GRPC_REFERRAL,
  OVER_WALLET: envAlias.GRPC_OVER_WALLET,
  BANKING: envAlias.GRPC_BANKING,
  GRPC_USER_KYC_STATUS: [
    'APPROVED',
    'REJECTED',
    'PENDING',
    'FINAL_REJECTED',
    'TEMPORARY_REJECTED',
    'INITIATED',
    'ON_HOLD',
  ],
  GRPC_ADMIN_KYC_STATUS: ['APPROVED', 'REJECTED', 'PENDING'],
  GRPC_USER_TYPE: ['INDIVIDUAL', 'BUSINESS'],
  GRPC_RESPONSE: {
    MESSAGE: {
      SUCCESS: {
        RECORD_FOUND: 'Record found successfully',
        SUCCESS: 'SUCCESS',
        RECORD_UPDATED: 'Record updated successfully',
        OTP_VERIFIED: 'Otp verified',
        VERIFIED_SUCCESS: 'verified',
        USER_DELETED: 'User account deleted successfully',
      },
      ERROR: {
        INACTIVE_USER: 'User not verified',
        NO_RECORD_FOUND: 'No record found',
        RECORD_NOT_UPDATED: 'Record not updated',
        INVALID_REQUEST: 'Invalid request',
        ERROR: 'ERROR',
        CLIENT_ID_NOT_FOUND: 'Client id not found.',
        INVALID_KYC_STATUS: 'Invalid user kyc status',
        ERROR_IN_PERFORMING_OPERATION: 'Error in performing operation',
        INVALID_STATUS: 'Invalid status',
        CLIENT_ID_REQUIRED: 'Client Id is required',
        OTP_NOT_VERIFIED: 'Not verified',
        INCORRECT_CODE: 'Incorrect code',
        INCORRECT_MPIN: 'Incorrect MPIN',
        INVALID_STATUS_TYPE: 'Invalid status type',
        INVALID_REQUEST_TYPE: 'Invalid request type',
        INVALID_REQUEST_METHOD: 'Invalid request',
        OTP_EXPIRED: 'OTP expired',
        RESOLVED_BY_REQUIRED: 'Resolved by is required',
        INVALID_MPIN: 'Invalid MPIN',
        INVALID_OTP: 'Invalid OTP',
      },
    },
    FIELD: {
      USERS: 'USERS',
      ERROR: 'ERROR',
      KYC_STATUS: 'KYC STATUS',
      CLIENT_ID: 'CLIENT ID',
      OTP: 'OTP',
      SUPPORT_TICKET: 'SUPPORT TICKETS',
      INVALID_REQUEST: 'user.invalid_request',
      INVALID_MPIN: 'user.invalid_mpin',
      INVALID_OTP: 'user.invalid_otp',
      USER_NOT_VERIFIED: 'user.not_verified',
    },
  },
};

export const KAFKA = {
  KAFKA_ENABLE_DISABLE: envAlias.KAFKA_ENABLE_DISABLE,
  CREDS: {
    CLIENT_ID: envAlias.CLIENT_ID,
    BROKER: envAlias.BROKER,
    CONSUMER_GROUP_ID_PREFIX: envAlias.KAFKA_GROUP_ID_PREFIX,
  },
  INIT_TOPICS: [
    {
      topic: 'USER_EMAILS',
      numPartitions: 1,
      replicationFactor: 1,
    },
    {
      topic: 'USER_SMS',
      numPartitions: 1,
      replicationFactor: 1,
    },
    {
      topic: 'USER_ALERT_NOTIFICATIONS',
      numPartitions: 1,
      replicationFactor: 1,
    },
  ],
  CONSUMERS_TOPICS: [],
  COMMON_TOPICS: {
    USER_EMAILS: 'USER_EMAILS',
    USER_SMS: 'USER_SMS',
    USER_ALERT_NOTIFICATIONS: 'USER_ALERT_NOTIFICATIONS',
  },
  NOTIFICATION_TYPES: {
    EMAIL: 'EMAIL',
    SMS: 'SMS',
    NOTIFICATION: 'NOTIFICATION',
    NOTIFICATION_TYPES: {
      PUSH: 'PUSH',
      ALERT: 'ALERT',
    },
  },
  NOTIFICATION_CODES: {
    WELCOME: 'E1000',
    REGISTRATION_EMAIL: 'E1001',
    REGISTRATION_SMS: 'E1001',
    FORGOT_PASSWORD: 'E1003',
    FORGOT_MPIN_EMAIL: 'E1010',
    FORGOT_MPIN_SMS: 'S1008',
    KYC_PHONE_VERIFICATION: 'S1001',
    CRYPTO_WITHDRAW_SMS: 'S1004',
    CRYPTO_INTERNAL_TRANSFER_SMS: 'S1005',
    FIAT_WITHDRAW_SMS: 'S1006',
    FIAT_INTERNAL_TRANSFER_SMS: 'S1007',
    LOGIN_2FA_VERIFICATION_SMS: 'S1009',
    TXN_SECURITY_VERIFICATION_SMS: 'S1010',
    TXN_SECURITY_VERIFICATION_EMAIL: 'E1012',
    LOGIN_2FA_VERIFICATION_EMAIL: 'E1011',
    CRYPTO_WITHDRAW_EMAIL: 'E1006',
    CRYPTO_INTERNAL_TRANSFER_EMAIL: 'E1007',
    FIAT_WITHDRAW_EMAIL: 'E1008',
    FIAT_INTERNAL_TRANSFER_EMAIL: 'E1009',
    SUPPORT_TICKET: 'P1011',
    KYC_STATUS_EMAIL: {
      REJECTED: 'E1002',
      APPROVED: 'E1005',
      ADMIN_REJECTED: 'E1004',
    },
    KYC_STATUS_SMS: {
      REJECTED: 'S1003',
      APPROVED: 'S1000',
      ADMIN_REJECTED: 'S1002',
    },
    KYC_PUSH_NOTIFICATION: {
      KYC_STATUS_UPDATE: 'P1019',
    },
  },
};

export const RABBIT_MQ = {
  QUEUE: {
    USER_EMAILS: 'USER_EMAILS',
    USER_SMS: 'USER_SMS',
    USER_ALERT_NOTIFICATIONS: 'USER_ALERT_NOTIFICATIONS',
  },
};
export const JWT = {
  JWT_USER_ACCESS_SECRET: envAlias.JWTACCESSSECRET,
  JWT_USER_REFRESH_SECRET: envAlias.JWTREFRESHSECRET,
  JWT_ADMIN_SECRET: envAlias.JWTADMINSECRET,
  JWT_USER_ACCESS_EXPIRE_TIME: envAlias.JWTUSERACCESSEXPIRETIME,
  JWT_USER_REFRESH_EXPIRE_TIME: envAlias.JWTUSERREFRESHEXPIRETIME,
};

export const TABLES = {
  OTP: 'otps',
  SUPPORT_TICKETS: 'supportTickets',
  SUPPORT_TICKET_SUBJECTS: 'supportTicketSubjects',
  USER: 'user',
  USER_SESSION: 'userSession',
  PAGE: 'page',
  KYC_LOG: 'kycLogs',
  KYC_DOC: 'kycDocs',
  KYC_ALERTS: 'kycAlerts',
  KYT_LOG: 'kytLogs',
  QUESTION: 'questions',
  ANSWER: 'answers',
  QUESTIONNAIRE: 'questionnaires',
  QUESTIONNAIRE_COMMENT: 'questionnaireComments',
};

export const RESPONSES = {
  SUCCESS: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NOCONTENT: 204,
  BADREQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOTFOUND: 404,
  TIMEOUT: 408,
  TOOMANYREQ: 429,
  INTERNALSERVER: 500,
  BADGATEWAYS: 502,
  SERVICEUNAVILABLE: 503,
  GATEWAYTIMEOUT: 504,
};

export const MIDDLEWARE_RESPONSE = {
  JWTERROR: 'Jwt token must be provided',
  PERMISSION_DENIED: 'Permission has been denied for this user',
  JWT_MUST_PROVIDED: 'Jwt token must be provided',
  SESSION_EXPIRED: 'Session has been expired',
  FIELDS: {
    JWT_ERROR: 'user_token_validation.jwt_error',
    SESSION_EXPIRED: 'user_token_validation.session_expired',
    JWT_REQUIRED: 'user_token_validation.token_required',
  },
};

export const PAGINATION = {
  LIMIT_VALUE: 10,
  OFFSET_VALUE: 0,
};

export const ERROR = 'Something went wrong';
export const SUCCESS = 'SUCCESS';

export const REGEX = {
  PASSWORD:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}|;':",.<>?/\\-])(?!.*\s).{8,20}$/,
  PHONENUMBER_REGEX: /^[+]?[0-9\\(]+[0-9\-\s\\)]*[0-9]+$/,
};

export const ENUM = {
  OTP_METHOD: {
    EMAIL: 'EMAIL',
    SMS: 'SMS',
    MPIN: 'MPIN',
  },
  DEFAULT: { CURRENCY: 'USD', LANGUAGE: 'english' },
  SUPPORT_TICKET_STATUS: {
    RESOLVED: 'RESOLVED',
    PENDIND: 'PENDING',
    IN_REVIEW: 'IN_REVIEW',
    RE_OPEN: 'REOPEN',
  },
  ACCOUNT_TYPE: {
    INDIVIDUAL: 'INDIVIDUAL',
    BUSINESS: 'BUSINESS',
  },
  OTP_SERVICE: {
    REGISTRATION: 'REGISTRATION',
    FORGOT_PASSWORD: 'FORGOT_PASSWORD',
    FORGOT_MPIN: 'FORGOT_MPIN',
    KYC_PHONE_VERIFICATION: 'KYC_PHONE_VERIFICATION',
    LOGIN: 'LOGIN',
    LOGIN_2FA_VERIFICATION: 'LOGIN_2FA_VERIFICATION',
    CRYPTO_WITHDRAW: 'CRYPTO_WITHDRAW',
    FIAT_WITHDRAW: 'FIAT_WITHDRAW',
    CRYPTO_INTERNAL_TRANSFER: 'CRYPTO_INTERNAL_TRANSFER',
    FIAT_INTERNAL_TRANSFER: 'FIAT_INTERNAL_TRANSFER',
    TXN_SECURITY_VERIFICATION: 'TXN_SECURITY_VERIFICATION',
  },
  USER_STATUS: {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
  },
  GENDER: {
    MALE: 'MALE',
    FEMALE: 'FEMALE',
    OTHER: 'OTHER',
    PREFER_NOT_TO_SAY: 'PREFER_NOT_TO_SAY',
  },
  SOCIAL_ID: {
    APPLE: 'APPLE',
    GOOGLE: 'GOOGLE',
    FACEBOOK: 'FACEBOOK',
  },
  DEVICE_TYPE: {
    IOS: 'IOS',
    ANDROID: 'ANDROID',
    WEB: 'WEB',
    MOBILE: 'MOBILE',
  },
  JWT_TOKEN_STATUS: {
    BLOCKED: 'BLOCKED',
  },
  TRANSACTION_OTP_TYPE: [
    'CRYPTO_WITHDRAW',
    'FIAT_WITHDRAW',
    'CRYPTO_INTERNAL_TRANSFER',
    'FIAT_INTERNAL_TRANSFER',
  ],
  TFA_STATUS: {
    ENABLE: 'ENABLE',
    DISABLE: 'DISABLE',
  },
  USER_TXN_STATUS: {
    FIAT_INTERNAL_TRANSFER: 'FIAT_INTERNAL_TRANSFER',
    FIAT_WITHDRAW: 'FIAT_WITHDRAW',
    CRYPTO_INTERNAL_TRANSFER: 'CRYPTO_INTERNAL_TRANSFER',
    CRYPTO_WITHDRAW: 'CRYPTO_WITHDRAW',
    SWAP: 'SWAP',
    AUTH_2FA: 'AUTH_2FA_STATUS',
  },
  TFA_STATUS_TYPE: {
    MPIN: 'MPIN',
    SMS: 'SMS',
    EMAIL: 'EMAIL',
    GOOGLE: 'GOOGLE',
    TXN_MPIN: 'TXN_MPIN_STATUS',
    TXN_SMS: 'TXN_SMS_STATUS',
    TXN_EMAIL: 'TXN_EMAIL_STATUS',
    TXN_GOOGLE: 'TXN_GOOGLE',
    TXN_GOOGLE_2FA_STATUS: 'txnGoogle2FaStatus',
    TXN_SMS_STATUS: 'txnSmsStatus',
    TXN_EMAIL_STATUS: 'txnEmailStatus',
    TXN_MPIN_STATUS: 'txnMpinStatus',
  },
  TFA_TYPE: {
    LOGIN: 'LOGIN',
    TRANSACTION: 'TRANSACTION',
  },
  TRANSACTION_STATUS: {
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    PENDING: 'PENDING',
    IN_REVIEW: 'IN_REVIEW',
    ADMIN_REJECTED: 'ADMIN_REJECTED',
    FAILED: 'FAILED',
  },
  TRANSACTION_TYPE: {
    FIAT: 'FIAT',
    CRYPTO: 'CRYPTO',
  },
  STATUS_TYPE: {
    COMPLETED: 'COMPLETED',
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
  },
  KYC_STATUS: {
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    INITIATED: 'INITIATED',
    TEMPORARY_REJECTED: 'TEMPORARY_REJECTED',
    FINAL_REJECTED: 'FINAL_REJECTED',
    ON_HOLD: 'ON_HOLD',
    QUEUED: 'QUEUED',
    NONE: 'NONE',
    PENDING: 'PENDING',
    NOT_SUBMITTED: 'NOT_SUBMITTED',
    APPROVED_BY_COMPLIANCE: 'APPROVED_BY_COMPLIANCE',
  },
  TRANSACTION_WEBHOOK_TYPES: {
    APPROVED: 'applicantKytTxnApproved',
    REJECTED: 'applicantKytTxnRejected',
  },
  DOC_TYPE: {
    ADDITIONAL: 'ADDITIONAL',
  },
};

export const USER_ALL_STATUS = [
  'google2FaStatus',
  'mpinStatus',
  'smsStatus',
  'emailStatus',
  'txnGoogle2FaStatus',
  'txnSmsStatus',
  'txnMpinStatus',
  'txnEmailStatus',
  'fiatInternalTxnStatus',
  'fiatWithdrawStatus',
  'cryptoInternalTxnStatus',
  'cryptoWithdrawStatus',
  'swapStatus',
  'auth2FaStatus',
];
export const CONSTANT = {
  OTP: {
    LENGTH: 6,
  },
  MPIN: {
    LENGTH: 6,
  },
  RANDOM_PASSWORD: {
    LENGTH: 10,
  },
  MAX_SUPPORT_TICKET_ATTACHMENT: envAlias.MAX_SUPPORT_TICKET_ATTACHMENT,
  MAX_SUPPORT_TICKET_ATTACHMENT_SIZE:
    envAlias.MAX_SUPPORT_TICKET_ATTACHMENT_SIZE,
};

export const API_RESPONSE = {
  FIELD: {
    EMAIL_VERIFICATION: 'EMAIL',
    MPIN: 'MPIN',
    LARGE_FILE_SIZE: 'LARGE FILE SIZE',
    PHONE_NUMBER: 'PHONE NUMBER',
    PHONE_VERIFICATION: 'PHONE VERIFICATION',
    REGISTRATION: 'REGISTRATION',
    SUPPORT_TICKET: 'SUPPORT TICKET',
    USER: 'USER',
    VERIFY_OTP: 'VERIFY_OTP',
    PASSWORD: 'PASSWORD',
    EMAIL: 'EMAIL',
    OTP: 'OTP',
    LOGIN: 'LOGIN',
    ERROR: 'ERROR',
    MIME_TYPE: 'MIME TYPE',
    PROFILE: 'USER PROFILE',
    SOCIAL_ID: 'SOCIAL ID',
    SESSIOM: 'SESSION',
    ACCOUNT_TYPE: 'ACCOUNT TYPE',
  },
  ERROR_FIELD: {
    INVALID_REQUEST: 'user.sendOtpAuth.invalid_request',
    OTP_NOT_SENT: 'user.sendOtpAuth.otp_not_sent',
    USER_EXIST: 'user.sendOtp.user_already_exist',
    USER_NOT_EXIST: 'user.sendOtp.user_not_found',
    ERROR: 'user.error_in_performing_operation',
    OTP_EXPIRED: 'user.otp.expired',
    INCORRECT_OTP: 'user.otp.incorrect',
    INVALID_SOCIAL_ID: 'user.invalid_social_id',
    ACCOUNT_BIND_WITH_SOCIAL_ID: 'user.account_bind_with_social_id',
    REGISTRATION_FAILED: 'user.registration.failed',
    EMAIL_NOT_VERIFIED: 'user.email_not_verified',
    PHONE_NOT_VERIFIED: 'user.phone_not_verified',
    LOGIN_FAILED: 'user.login.failed',
    INVALID_CREDENTIAL: 'user.login.invalid_credential',
    OTP_NOT_VERIFIED: 'user.otp.not_verified',
    PASSWORD_IN_USE: 'user.password.already_in_use',
    PASSWORD_UPDATE_FAILED: 'user.password.update_failed',
    MPIN_UPDATE_FAILED: 'user.mpin_update_failed',
    ACCOUNT_DELETED: 'user.account_deleted',
    SAME_MPIN: 'user.same_mpin',
    INCORRECT_OLD_PASSWORD: 'user.password.incorrect_old_password',
    VERIFICATION_FAILED: 'user.verification_failed',
    GOOGLE_2FA_DISABLED: 'user.google_2fa_disabled',
    CODE_NOT_VERIFIED: 'user.code_not_verified',
    USER_BLOCKED: 'user.blocked',
    PASSWORD_IS_SAME: 'user.password.same_password',
    INCOMPLETE_KYC: 'user.kyc_not_completed',
    INCORRECT_MPIN: 'user.incorrect_mpin',
    PHONE_ALREADY_EXIST: 'user.phone_aleady_exist',
  },
  SUCCESS_FIELD: {
    REGISTRATION_SUCCESS: 'user.registration.success',
    OTP_SENT: 'user.sendOtp.otp_sent',
    OTP_VERIFIED: 'user.otp_verified',
    LOGIN_SUCCESS: 'user.login.success',
    PASSWORD_UPDATED: 'user.password_update_success',
    MPIN_UPDATED: 'user.mpin_updated_success',
    VERIFICATION_SUCCESS: 'user.verification_success',
    CODE_VERIFIED: 'user.code_verified',
    GOOGLE_2FA_ENABLED: 'user.google_2fa_enabled_success',
    GOOGLE_2FA_DISABLED: 'user.google_2fa_disabled_success',
    USER_EXIST: 'user.already_registrered',
    USER_NOT_EXIST: 'user.not_registered',
    SOCIAL_ID_EXIST: 'user.social_id_exist',
    SOCIAL_ID_NOT_EXIST: 'user.social_id_not_exist',
    ACCOUNT_DELETED: 'user.account_deleted',
    LOGOUT_SUCCESS: 'user.logout_success',
    RECORD_UPDATED: 'user.record_updated',
    SUPPORT_TICKET_CREATED: 'user.support.ticket_created',
  },
  MESSAGE: {
    EMAIL_NOT_VERIFIED: 'User email is not verified',
    PHONE_NOT_VERFIED: 'User phone is not verified',
    USER_ALREADY_REGISTERED: 'User already registered',
    USER_NOT_REGISTERED: 'User not registered',
    PHONE_NOT_VERIFIED: 'User phone is not verified',
    USER_ALREADY_EXIST: 'User already registered',
    NO_RECORD_FOUND: 'No record found',
    GOOGLE_TFA_IS_DISABLED: 'Please enable google 2FA first',
    ERROR_IN_PERFORMING_OPERATION: 'Error in performing operation',

    ERROR: {
      ACCOUNT_DELETED:
        'We’re sorry to inform you that your account has been deleted by the administoratr. If you believe this was a mistake or if you’d like to rejoin, please feel free to register again. If you need assistance, our support team is here to help.',
      INCOMPATIBLE_DOC_TYPE: 'Only jpg,jpeg,png,gif,pdf and doc is accepted',
      LARGE_FILE_SIZE: `file size must be less than ${
        Number(CONSTANT.MAX_SUPPORT_TICKET_ATTACHMENT_SIZE) + 1
      }MB`,
      INVALID_TYPE: 'Please provide a valid type',
      ATTACHMENT_LIMIT_ACCEED: `maximum ${CONSTANT.MAX_SUPPORT_TICKET_ATTACHMENT} docs can be uploaded`,
      REGISTRATION_FAILED: `Opp's there is some technical reason your request has been failed .Please try after some time`,
      INCORRECT_PASSWORD: 'Incorrect password',
      BIND_WITH_OTHER_SOCIALID: 'This account is bind with other social id',
      GOOGLE_2FA_ALREADY_ENABLED: 'google 2FA is already enabled',
      SOCIAL_ID_BIND_WITH_OTHER_ACCOUNT:
        'This social id is bind with other account',
      RECORD_UPDATION_FAILED: 'No record updated',
      CODE_NOT_VERIFIED: 'Code not verified',
      INCORRECT_OLD_PASSWORD: 'Incorrect old password',
      PHONENUMBER_NOT_EXIST:
        'You are not authorized to perform this action. please complete your kyc first.',
      INCORRECT_OLD_PIN: 'Incorrect old pin',
      USER_NOT_FOUND: 'User not found',
      INCORRECT_MPIN: 'Incorrect MPIN',
      INCORRECT_OTP: 'Incorrect OTP',
      INCORRECT_EMAIL: 'Incorrect email',
      OTP_NOT_VERIFIED: 'Otp not verified',
      VERIFICATION_FAILED: 'Verification failed',
      FAILED_TO_SEND_OTP: 'OTP not sent',
      FAILER_TO_UPDATE_PASSWORD: 'Failed to update password',
      FAILER_TO_UPDATE_MPIN: 'Failed to update MPIN',
      LOGIN_FAILED: 'Login failed',
      OTP_EXPIRED: 'OTP expired',
      INVALID_SOCIAL_ID_TYPE: 'Invalid social id type',
      SOCIAL_LOGIN_FAILED:
        'User does not exist. Please try using registraion process',
      PHONE_ALREADY_EXIST:
        'Phone already exist. please try using another phone number',
      INVALID_REQUEST: 'Invalid request',
      INVALID_CREDENTIAL: 'Invalid credentails',
      PASSWORD_CANNOT_BE_SAME: 'Old password and new password cannot be same',
      PASSWORD_ALREADY_IN_USE: 'Password already in use',
      MPIN_CANNOT_BE_SAME: 'Pin cannot be same',
      USER_BLOCKED: 'We’re sorry to inform that your account has been blocked',
      LOGIN_AGAIN: 'Please login again.',
    },
    SUCCESS: {
      REGISTRATION_SUCCESS: 'User registered successfully',
      VERIFICATION_SUCCESS: 'Verified successfully',
      SUCCESS: 'Success',
      LOGOUT_SUCCESS: 'User logout successfully',
      CODE_VERIFIED: 'Code verified',
      SUPPORT_TICKET_CREATED: 'Support ticket created successfully',
      ACCOUNT_DELETED: 'Account deleted successfully',
      LOGIN_SUCCESS: 'Login successfully',
      OTP_VERIFIED: 'OTP verified',
      OTP_SENT_SUCCESS: 'OTP sent successfully',
      OTP_VERIFY_SUCCESS: 'OTP verified successfully',
      PASSWORD_UPDATED_SUCCESS:
        'Your password is updated successfully.Please login again.',
      MPIN_UPDATED_SUCCESS: 'Your MPIN is updated successfully',
      RECORD_FOUND: 'Record found successfully',
      SOCIAL_ID_EXIST: 'Social Id exist',
      SOCIAL_ID_NOT_EXIST: 'Social Id does not exist',
      RECORD_UPDATE: 'Record updated successfully',
      USER_DETAIL_SAVED: 'User detail saved successfully',
      GOOGLE_2FA_ENABLED: 'Google 2FA enabled successfully',
      GOOGLE_2FA_DISABLED: 'Google 2FA disabled successfully',
    },
  },
};

export const VALIDATION = {
  USER: {
    EMPTY_DEVICE_TYPE: 'Empty device type',
    EMPTY_COUNTRY_CODE: 'Country code is required',
    EMPTY_STATUS_TYPE: 'Empty statys type',
    EMPTY_SOCIAL_ID: 'Social id required',
    INVALID_TYPE: 'Invalid type',
    EMPTY_DEVICE_ID: 'Device Id is required',
    EMPTY_DEVICE_TOKEN: 'Empty device token',
    EMPTY_SUPPORT_TICKET_SUBJECT: 'Please provide subject of support ticket',
    EMPTY_SUPPORT_TICKET_DESCRIPTION:
      'Please provide description about support ticket',
    EMPTY_FCM_TOKEN: 'Empty fcm token',
    EMPTY_EMAIL: 'Please provide email',
    EMPTY_SECRET: 'Pleasee provide secret key',
    EMPTY_CODE: 'Pleasee provide code',
    EMPTY_STATUS: 'Status is required',
    EMPTY_FIRST_NAME: 'Please provide first name',
    EMPTY_BUSINESS_NAME: 'Please provide business name',
    EMPTY_BRAND_NAME: 'Please provide brand name',
    EMPTY_INCORPOTATION_DATE: 'Please provide incorporation date',
    EMPTY_COMPANY_TYPE: 'Please provide company name',
    EMPTY_BANNER_TYPE: 'Please provide banner type',
    EMPTY_TAX_OR_VAT_ID: 'Please provide TAX/VAT id',
    EMPTY_LAST_NAME: 'Please provide last name',
    EMPTY_DOB: 'Please provide date of birth',
    EMPTY_GENDER: 'Please provide gender',
    EMPTY_ADDRESS: 'Please provide address',
    EMPTY_CITY: 'Please provide city',
    EMPTY_POSTAL_CODE: 'Please provide postal code',
    EMPTY_NATIONALITY: 'Please provide nationality',
    EMPTY_ACCOUNT_TYPE: 'Please provide account type',
    EMPTY_PHONE_NUMBER: 'Please provide phone number',
    EMPTY_MOBILE_PIN: 'Please provide MPIN',
    EMPTY_TFA_TYPE: 'Type should not be empty',
    EMPTY_TFA_STATUS: 'Status should not be empty',
    INVALID_EMAIL: 'Invalid email',
    INVALID_PHONE_NUMBER: 'Invalid phone number',
    EMPTY_PASSWORD: 'Password is required',
    EMPTY_OLD_PIN: 'Old pin is required',
    EMPTY_NEW_PIN: 'New pin is required',
    INVALID_PASSWORD: 'Invalid password',
    INVALID_ACCOUNT_TYPE: 'Invalid account type',
    INVALID_BANNER_TYPE: 'Invalid banner type',
    EMPTY_OTP: 'Please provide OTP',
    EMPTY_METHOD: 'Method is required',
    EMPTY_SERVICE: 'Service is required',
    INVALId_METHOD: 'Invalid method',
    INVALID_SERVICE: 'Invalid service',
    INVALID_OTP: 'Invalid OTP',
    INVALID_FIRST_NAME: 'Invalid first name',
    INVALID_LAST_NAME: 'Invalid last name',
    INVALID_DOB: 'Invalid date of birth',
    INVALID_GENDER: 'Invalid gender',
    INVALID_PIN: 'Invalid pin',
    INVALID_CODE: 'Invalid code',
    INVALID_DEVICE_TYPE: 'Invalid device type',
    INVALID_BUSINESS_NAME: 'Invalid business name',
    INVALID_BRAND_NAME: 'Invalid brand name',
    INVALID_TFA_STATUS: 'Invalid status',
    INVALID_STATUS_TYPE: 'Invalid status type',
    INVALID_DEFAULT_CURRENCY: 'Invalid default currency',
    INVALID_DEFAULT_LANGUAGE: 'Invalid default language',
  },
  ERROR_FIELDS: {
    INVALID_EMAIL: '',
  },
};

// kyc

export const REQUEST = 'Request';
export const INVALID_REQUEST = 'Invalid Request';
export const SOMETHING_WENT_WRONG = 'Something went wrong';
export const ERROR_IN_PERFORMING_OPERATION = {
  field: 'Operation Failed',
  message: 'Error in performing operation',
};
export const TOO_MANY_REQUEST_ERROR =
  'Too many requests from this IP, please try again later';
export const NO_RECORD_FOUND = 'No record found';

export const SUMSUB = {
  CRED: {
    SUMSUB_APP_TOKEN: envAlias.SUMSUB_APP_TOKEN,
    SUMSUB_SECRET_KEY: envAlias.SUMSUB_SECRET_KEY,
    SUMSUB_BASE_URL: envAlias.SUMSUB_BASE_URL,
  },
  DOC_VIEW_TYPE: {
    FRONT: 'FRONT',
    BACK: 'BACK',
    SUFFIX_FRONT: '_Front',
    SUFFIX_BACK: '_Back',
  },
  DOC_TYPES: [
    'ID_CARD',
    'PASSPORT',
    'DRIVERS',
    'RESIDENCE_PERMIT',
    'UTILITY_BILL',
    'PROFILE_IMAGE',
    'ID_DOC_PHOTO',
    'AGREEMENT',
    'CONTRACT',
    'DRIVERS_TRANSLATION',
    'INVESTOR_DOC',
    'VEHICLE_REGISTRATION_CERTIFICATE',
    'INCOME_SOURCE',
    'PAYMENT_METHOD',
    'BANK_CARD',
    'COVID_VACCINATION_FORM',
  ],
  SUMSUB_LEVEL: {
    BUSINESS: 'Corporates',
    INDIVIDUAL: 'Individual Onboarding Level',
    INTRACTIVE_TIME: 20000,
  },
  DOC_EXTENSION_TYPES: ['png', 'jpg', 'svg', 'jpeg', 'gif', 'pdf'],
  TRANSACTION_TYPE: {
    CRYPTO_DEPOSIT: 'CRYPTO_DEPOSIT',
    CRYPTO_WITHDRAW: 'CRYPTO_WITHDRAW',
    FIAT_WITHDRAW: 'FIAT_WITHDRAW',
    FIAT_DEPOSIT: 'FIAT_DEPOSIT',
  },
  TRANSACTION_DIRECTION: {
    IN: 'in',
    OUT: 'out',
  },
  USER_TYPE: {
    INDIVIDUAL: 'individual',
    COMPANY: 'company',
  },
};

export const KYC_RESPONSE = {
  FIELD: {
    APPLICANT_ID: 'Applicant ID',
    TOKEN: 'Access Token',
    KYC: 'KYC',
    USER: 'User',
    KYC_DOC: 'KYC_DOC',
  },
  SUCCESS: {
    TOKEN_GENERATED: 'Token generated successfully',
    KYC_UPDATED: 'KYC updated successfully',
    KYC_FOUND: 'KYC found successfully',
    KYC_STATUS_FOUND: 'KYC status found successfully',
    KYC_DOC_UPLOAD_SUCCESS: 'KYC document uploaded successfully',
    USER_FOUND: 'User found successfully',
  },
  ERROR: {
    APPLICANT_NOT_FOUND: 'Applicant not found',
    KYC_NOT_FOUND: 'KYC not found',
    USER_NOT_FOUND: 'User does not exist',
    ACCOUNT_TYPE_MISSING: 'Account Type is missing',
    KYC_DOC_UPLOAD_FAILURE: 'Error in uploading the file. Please try again.',
  },
};

export const FILTER_TYPE_ALL = 'ALL';

export const QUESTIONNAIRE_GRPC_RESPONSE = {
  QUESTIONNAIRE_LIST: 'Questionnaire list',
  QUESTIONNAIRE_UPDATED: 'Questionnaire updated successfully',
  QUESTIONNAIRE_COLLECTED: 'Questionnaire data collected successfully',
  APPLICANT_NOT_FOUND: 'Applicant data found',
};

export const KYC_PROFILE = {
  VALIDATIONS: {
    KYC_DOCS: 'KYC_DOCS',
    KYC_DOC: 'KYC_DOC',
    TOKEN_SUCCESS: 'Token generated successfully',
    ADDITIONAL_DOC: 'ADDITIONAL_DOC',
    KYC_PROFILE_NOT_FOUND_FIELD: 'KYC_PROFILE_NOT_FOUND',
    TOKEN_FIELD: 'kyc.token_generated',
    KYC_PROFILE_UPDATED: 'KYC profile updated successfully',
    KYC_STATUS_UPDATE: 'KYC status update',
    KYC_STATUS_UPDATE_SUCCESS: 'KYC status updated successfully',
    KYC_ALREADY_APPROVED: 'KYC is already approved',
    KYC_ALREADY_REJECTED: 'KYC is already rejected',
    KYT_STATUS_UPDATE_SUCCESS: 'KYT status updated successfully',
    KYT_CREATED_SUCCESS: 'KYT created successfully',
    KYC_STATUS_FOUND: 'KYC status found successfully',
    EMAIL: 'EMAIL',
    VERIFICATION_DETAIL_FOUND: 'Verification details found successfully',
    KYC_PROFILE_FOUND: 'KYC profile found successfully',
    INCOMPLETE_KYC: 'Please complete your KYC',
    KYC_PROFILE_NOT_FOUND: 'KYC profile not found',
    KYC_PROFILE: 'KYC_PROFILE',
    KYC_DOCS_FOUND: 'KYC documents found successfully',
    KYC_DOCS_NOT_FOUND: 'KYC documents not found',
    ADDITIONAL_DOCS_NOT_FOUND: 'Additional documents not found',
    KYC_DOC_UPLOAD_SUCCESS: 'KYC document uploaded successfully',
    KYC_DOC_UPLOAD_FAILURE: 'Error in uploading the file. Please try again.',
    KYC_DOCS_SAVE_FAILED: 'Error while saving documents',
    ADDITIONAL_DOC_UPDATE: 'Updated additional document',
    ADDITIONAL_DOC_DELETED: 'Deleted additional document successfully',
    ADDITIONAL_DOC_UPDATE_FAILURE: 'Error while updating additional document',
    TRANSACTION_SAVE_FAILURE: 'Error while saving transaction',
    TRANSACTION: 'TRANSACTION',
    USER_NOT_FOUND: 'User does not exist',
    USER_FOUND: 'User found successfully',
    USER_KEY: 'kyc.user_not_found',
    USER_FOUND_KEY: 'kyc.user_found',
    USER_FIELD: 'User',
    APPLICANT_ID: 'APPLICANT_ID',
    APPLICANT_NOT_FOUND: 'ApplicantId not found',
    TRANSACTION_FOUND_SUCCESS: 'Transactions found successfully',
    TRANSACTION_NOT_SUBMITTED: 'Transaction not submitted',
    TRANSACTION_SUBMITTED: 'Transaction submitted successfully',
    TRANSACTION_UPDATED: 'Transaction updated successfully',
    TRANSACTION_UPDATED_FAILURE: 'Error updating transaction status',
    TRANSACTION_ALREADY_SUBMITTED: 'Transaction already submitted',
    KYC_STATUS: {
      APPROVED: {
        title: 'Your KYC has been Approved',
        content: 'Your KYC status is being updated to Approved',
      },
      PENDING: {
        title: 'Your KYC has been Pending',
        content: 'Your KYC status is being updated to Pending',
      },
      REJECTED: {
        title: 'Your KYC has been Rejected',
        content: 'Your KYC status is being updated to Rejected',
      },
    },
  },
};

export const NOTIFICATION = {
  EMAIL: {
    WELCOME: {
      SUBJECT: 'Welcome',
      TITLE: 'Welcome to the world of Risely.',
      BODY: 'You have successfully registered on Risely. You can start KYC process to avail the banking services.',
      TEMPLATE: 'common',
    },
    REGISTRATION: {
      SUBJECT: 'Registration OTP',
      BODY: 'Your One Time Password is {otp}. Do not share OTP with anyone.',
      TEMPLATE: 'common',
    },
    FORGOT_PASSWORD: {
      SUBJECT: 'Forgot password',
      BODY: 'Your forgot password otp is:',
      TEMPLATE: 'common_otp',
    },

    FORGOT_MPIN: {
      SUBJECT: 'MPIN Reset OTP',
      BODY: 'Your One Time Password is {otp}. Do not share OTP with anyone.',
      TEMPLATE: 'common',
    },
    TXN_SECURITY_VERIFICATION: {
      SUBJECT: 'Transaction security verificationn OTP',
      BODY: 'Your One Time Password is {otp}. Do not share OTP with anyone.',
      TEMPLATE: 'common',
    },
    LOGIN_2FA_VERIFICATION: {
      SUBJECT: 'Login OTP',
      BODY: 'Your One Time Password is {otp}. Do not share OTP with anyone.',
      TEMPLATE: 'common',
    },
    FIAT_INTERNAL_TRANSFER: {
      SUBJECT: 'Fiat internal transfer OTP',
      BODY: 'Your One Time Password is {otp}. Do not share OTP with anyone.',
      TEMPLATE: 'common',
    },
    FIAT_WITHDRAW: {
      SUBJECT: 'Fiat withdrawal OTP',
      BODY: 'Your One Time Password is {otp}. Do not share OTP with anyone.',
      TEMPLATE: 'common',
    },
  },
  SMS: {
    WELCOME: {
      SUBJECT: 'Welcome',
      TITLE: 'Welcome to the world of Risely.',
      BODY: 'You have successfully registered on Risely. You can start KYC process to avail the banking services.',
      TEMPLATE: 'common',
    },
    REGISTRATION: {
      SUBJECT: 'Registration OTP',
      BODY: 'Your One Time Password is {otp}. Do not share OTP with anyone.',
      TEMPLATE: 'common',
    },
    FORGOT_PASSWORD: {
      SUBJECT: 'Forgot password',
      BODY: 'Your forgot password otp is:',
      TEMPLATE: 'common_otp',
    },

    FORGOT_MPIN: {
      SUBJECT: 'MPIN Reset OTP',
      BODY: 'Your One Time Password is {otp}. Do not share OTP with anyone.',
      TEMPLATE: 'common',
    },
    TXN_SECURITY_VERIFICATION: {
      SUBJECT: 'Transaction security verificationn OTP',
      BODY: 'Your One Time Password is {otp}. Do not share OTP with anyone.',
      TEMPLATE: 'common',
    },
    LOGIN_2FA_VERIFICATION: {
      SUBJECT: 'Login OTP',
      BODY: 'Your One Time Password is {otp}. Do not share OTP with anyone.',
      TEMPLATE: 'common',
    },
    FIAT_INTERNAL_TRANSFER: {
      SUBJECT: 'Fiat internal transfer OTP',
      BODY: 'Your One Time Password is {otp}. Do not share OTP with anyone.',
      TEMPLATE: 'common',
    },
    FIAT_WITHDRAW: {
      SUBJECT: 'Fiat withdrawal OTP',
      BODY: 'Your One Time Password is {otp}. Do not share OTP with anyone.',
      TEMPLATE: 'common',
    },
    KYC_PHONE_VERIFICATION: {
      BODY: 'Your one time password for Risely {otp}',
    },
  },
};

export const RANDOM_STRING =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
