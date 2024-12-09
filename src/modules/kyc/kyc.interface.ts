export interface KYC_LOG {
  userId?: string;
}

export interface IUserId {
  userId?: string;
}

export interface S3_RESPONSE {
  error: boolean | any  ;
  data: string | any ;
}

export interface GENERATE_ACCESS_TOKEN {
  accountType: string;
}

export interface DOCUMENT_RESPONSE {
  token: string;
  userId: string;
}

export interface WEBHOOK {
  applicantId?: string;
  inspectionId?: string;
  applicantType?: string;
  correlationId?: string;
  levelName?: string;
  sandboxMode?: boolean;
  externalUserId?: string;
  type?: string;
  reviewResult?: object | any ;
  reviewStatus?: string;
  createdAt?: string;
  createdAtMs?: string;
  clientId?: string;
}

interface SAVE_OTP_PAYLOAD {
  email: string;
  phoneNumber: string;
  method: string;
  service: string;
}

export interface SEND_OTP_REQUEST_PAYLOAD {
  email: string;
  phoneNumber: string;
  method: string;
  service: string;
  saveOtpPayload: SAVE_OTP_PAYLOAD;
}


export interface OTP_ROW_PAYLOAD {
  otp: string;
  email: string;
  phoneNumber: string;
  method: string;
  service: string;
}


export interface CREATE_OTP_PAYLOAD {
  otp: string;
  email?: string;
  phoneNumber?: string;
  method: string;
  service: string;
  status: boolean;
}

export interface UPDATE_OTP_PAYLOAD {
  otp?: string;
  status?: boolean;
}

interface VERIFY_OTP_PAYLOAD {
  email: string;
  phoneNumber: string;
  method: string;
  service: string;
  otp: string;
}
export interface VERIFY_OTP_REQUEST_PAYLOAD {
  email: string;
  phoneNumber: string;
  method: string;
  service: string;
  otp: string;
  verifyOtpPayload: VERIFY_OTP_PAYLOAD;
}

export interface VERIFY_OTP_REQUEST_PAYLOAD {
  email: string;
  phoneNumber: string;
  method: string;
  service: string;
  otp: string;
  verifyOtpPayload: VERIFY_OTP_PAYLOAD;
}

export interface INDIVIDUAL {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  address: string;
  city: string;
  postalCode: string;
}

export interface BUSINESS {
  businessName: string,
  brandName: string,
  incorporationDate: string,
  companyType: string,
  taxVatId: string,
}

export interface CREATE_KYC_LOG {
  userId : string ;
  firstName: string;
  email: string ;
  lastName: string ;
  nationality: string ;
  accountType: string;
  phoneNumber: string ;
}