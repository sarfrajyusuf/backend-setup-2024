import { Model } from '../helpers/sqlize.helper';

export interface Otp extends Model {
  id: number;
  userId: string;
  otp: string;
  email: string;
  phoneNumber: string;
  method: string;
  service: string;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportTickets extends Model {
  id: number;
  userId: string;
  uid: string;
  ticketId: string;
  subject: string;
  description: string;
  status: string;
  attachment: string[];
  resolvedAt: string;
  comments: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Users extends Model {
  id: number;
  userId: string;
  uidString: string;
  email: string;
  password: string;
  mobilePin: string;
  socialLoginVia: string;
  appleId: string;
  googleId: string;
  facebookId: string;
  isEmailVerified: boolean;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  address: string;
  city: string;
  postalCode: string;
  accountType: string;
  dateOfBirth: string;
  nationality: string;
  phoneNumber: string;
  countryCode: string;
  businessName: string;
  brandName: string;
  incorporationDate: string;
  companyType: string;
  taxVatId: string;
  clientId: string;
  status: string;
  userKycStatus: string;
  adminKycStatus: string;
  kycRejectionReason: string;
  google2FaSecret: string;
  individualStatus: boolean;
  businessStatus: boolean;
  deviceType: string;
  deviceId: string;
  isBlocked: boolean;
  reasonToBlockUser: string;
  lastLoginAt: string;
  isDeleted: boolean;
  google2FaStatus: boolean;
  mpinStatus: boolean;
  smsStatus: boolean;
  emailStatus: boolean;
  txnGoogle2FaStatus: boolean;
  txnMpinStatus: boolean;
  txnSmsStatus: boolean;
  txnEmailStatus: boolean;
  fiatInternalTxnStatus: boolean;
  fiatWithdrawStatus: boolean;
  cryptoInternalTxnStatus: boolean;
  cryptoWithdrawStatus: boolean;
  auth2FaStatus: boolean;
  swapStatus: boolean;
  defaultFiatCurrency: string;
  defaultLanguage: string;
  referralCode: string;
  isReferee: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSessions extends Model {
  id: number;
  userId: string;
  deviceType: string;
  deviceId: string;
  deviceToken: string;
  accessToken: string;
  refreshToken:string;
  fcmToken: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KYC_LOGS extends Model {
  id: number;
  userId: string;
  applicantId: string;
  inspectionId: string;
  accountType: string;
  parentId: string;
  sumsubKycStatus: string;
  sumsubReason: string;
  adminRejectionReason: string;
  sumsubPayload: JSON;
  questionairePayload: JSON;
  adminKycStatus: string;
  isVerifiedAt: string;
  email: string;
  nationality: string;
  firstName: string;
  lastName: string;
  businessName: string;
  brandName: string;
  incorporationDate: string;
  companyType: string;
  taxVatId: string;
  s3KycStatus: boolean;
  isDocSaved: boolean;
  phoneNumber: string;
  createdAt: Date;
  updatedAt: Date;
  parentProfileFilled: boolean;
  dob: string;
  address: string;
  zipCode: string;
  nationalId: string;
  city: string;
  verificationFullPayload: JSON;
  registrationNumber: string;
  individualAccountInf: JSON;
  completedBy: string;
  completedByUserId: string;
  adminFullName : string ; 
}

export interface KYC_DOC extends Model {
  id: number;
  userId: string;
  applicantId: string;
  kycId: string;
  sumsubDocId: string;
  inspectionId?: string;
  docType: string;
  docName: string;
  docPath: string;
  viewType: string;
  createdAt: Date;
  updatedAt: Date;
  s3Status: boolean;
  txnId: string ;
}

export interface KYT_TRANSACTION extends Model {
  id: number;
  transactionId: string;
  transactionApplicantId: string;
  transactionExternalUserId: string;
  transactionClientId: string;
  transactionScore?: string;
  transactionApprovalStatus: string;
  transactionCreatedAt: string;
  transactionDryScore: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KYT_LOGS extends Model {
  id: number;
  userId: string;
  applicantId: string;
  score: string;
  txnId: string;
  coinName: string;
  coinNetwork:string;
  coinSymbol:string;
  clientId: string;
  txnType: string;
  txnStatus: string;
  kytStatus: string;
  trxPayload: JSON;
  typeId: string;
  type: string;
  wasSuspicious: boolean;
  fromAddress: string;
  toAddress: string;
  createdAt: Date;
  updatedAt: Date;
  amount: string;
  sumsubResponse : JSON ;
  isReapproved : boolean ; 
}


export interface KYT_ALERTS extends Model {
  id: number;
  userId: string;
  applicantId: string;
  alert : JSON ;
  accountType: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Otp extends Model {
  id: number;
  otp: string;
  email: string;
  phoneNumber: string;
  method: string;
  service: string;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Question extends Model {
  id: number;
  title: string;
  key: string;
  type: string; // business, individual
}

export interface Answer extends Model {
  id: number;
  key: string;
  title: string;
  score: number;
  type: string; // business, individual
  questionId: number;
}
export interface Questionnaire extends Model {
  id: number;
  questionId: number;
  answerId: number;
  userId: string;
  manualScore: number;
}

export interface QuestionnaireComments extends Model {
  id: number;
  text: string;
  questionnaireId: number;
  adminId: number;
  manualScore: number;
  createdAt: Date;
  updatedAt: Date;
}