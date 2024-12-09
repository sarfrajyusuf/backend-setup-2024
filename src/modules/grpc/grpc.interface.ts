interface GRPC_UPDATE_USER_ROW_PAYLOAD {
  email?: string;
  password?: string;
  userKycStatus?: string;
  isEmailVerified?: boolean;
  isDeleted?: boolean;
  phoneNumber?: string;
  googleId?: string;
  appleId?: string;
  facebookId?: string;
  adminKycStatus?: string;
  status?: string;
  isBlocked?: boolean;
  clientId?: string;
  kycRejectionReason?: string;
  reasonToBlockUser?: string;
  auth2FaStatus?: boolean;
  swapStatus?: boolean;
  cryptoWithdrawStatus?: boolean;
  uidString?: string;
  cryptoDepositStatus?: boolean;
  fiatWithdrawStatus?: boolean;
  fiatInternalTxnStatus?: boolean;
}

interface UPDATE_SUPPORT_TICKET_STATUS_PAYLOAD {
  status: string;
  comments: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

interface UPDATE_USER_KYC_STATUS_PAYLOAD {
  userKycStatus: string;
  uidString?: string;
  businessName?: string;
  brandName?: string;
  incorporationDate?: string;
  companyType?: string;
  taxVatId?: string;
}

interface DESTROY_USER_SESSION_PAYLOAD {
  userId: string;
}

interface UPDATE_USER_SESSION_PAYLOAD {
  accessToken?: string;
}

interface DESTROY_OTP_PAYLOAD {
  userId: string;
  email: string;
  method: string;
  service: string;
}

interface VERIFY_OTP_ROW_PAYLOAD {
  otp: string;
  userId: string;
  email?: string;
  phoneNumber?: string;
  method: string;
  service: string;
  status: boolean;
}

interface GRPC_SEARCH_USER_ROW_PAYLOAD {
  userId: string;
  email: string;
  userKycStatus: string;
  adminKycStatus: string;
  clientId: string;
  status: string;
  isDeleted: boolean;
  isEmailVerified: boolean;
  isBlocked: boolean;
}

interface FIND_ALL_USER_ROW_PAYLOAD {
  userId: string;
}

interface ACTIVITY_LOGS_PAYLOAD {
  name: string;
  type: string;
  body: string;
  slug: string;
}

interface BLOCK_UNBLOCK_USER_PAYLOAD {
  isBlocked: boolean;
  reasonToBlockUser?: string;
  status: string;
}

interface UPDATE_KYC_STATUS_PAYLOAD {
  adminKycStatus: string;
  kycRejectionReason?: string;
  userKycStatus?: string;
}

interface GET_USER_COUNTS_PAYLOAD {
  totalusercount: string;
  lastsevendayusercount: string;
  lastthirtydayusercount: string;
  individualusercount: string;
  businessusercount: string;
  totalverifiedusercount: string;
}

interface GET_FCM_TOKEN_PAYLOAD {
  userId: string;
  fcmtoken: string[];
  defaultLanguage: string;
  defaultFiatCurrency: string;
}

interface VERIFY_TRANSACTION_OTP_PAYLOAD {
  userId: string;
  service: string;
  otp: string;
  method: string;
  status: boolean;
  email: string;
  phoneNumber: string;
}

interface GET_OTP_ROW_PAYLOAD {
  otp: string;
  email: string;
  phoneNumber: string;
  method: string;
  service: string;
  userId: string;
  status: boolean;
}

interface SAVE_REFERRAL_CODE_REQUEST_PAYLOAD {
  refereeUserId: string;
  referrerUserId: string;
  email: string;
  refereeCode: string;
  referrerCode: string;
  ipAddress: string;
}

interface VERIFICATION_PAYLOAD {
  clientVerified?: {
    totalCount: string;
    lastSevenDayCount: string;
    lastThirtyDayCount: string;
  };
  doucmentsVerified?: {
    totalCount: string;
    lastSevenDayCount: string;
    lastThirtyDayCount: string;
  } | any ;
  alertRaised?: {
    totalCount: string;
    lastSevenDayCount: string;
    lastThirtyDayCount: string;
  };
  rejectedRequest?: {
    totalCount: string;
    lastSevenDayCount: string;
    lastThirtyDayCount: string;
  };
  verificationChartData?: {
    alertGenerated : string ;
    approved : string ; 
    approvedManually : string ;
  };
  allAlerts? : {
    count: string;
    rows: Array<Object>;
  }
}

export {
  VERIFICATION_PAYLOAD,
  GRPC_UPDATE_USER_ROW_PAYLOAD,
  GRPC_SEARCH_USER_ROW_PAYLOAD,
  FIND_ALL_USER_ROW_PAYLOAD,
  ACTIVITY_LOGS_PAYLOAD,
  GET_OTP_ROW_PAYLOAD,
  VERIFY_OTP_ROW_PAYLOAD,
  DESTROY_OTP_PAYLOAD,
  DESTROY_USER_SESSION_PAYLOAD,
  UPDATE_USER_SESSION_PAYLOAD,
  GET_USER_COUNTS_PAYLOAD,
  UPDATE_KYC_STATUS_PAYLOAD,
  BLOCK_UNBLOCK_USER_PAYLOAD,
  GET_FCM_TOKEN_PAYLOAD,
  VERIFY_TRANSACTION_OTP_PAYLOAD,
  UPDATE_USER_KYC_STATUS_PAYLOAD,
  UPDATE_SUPPORT_TICKET_STATUS_PAYLOAD,
  SAVE_REFERRAL_CODE_REQUEST_PAYLOAD,
};
