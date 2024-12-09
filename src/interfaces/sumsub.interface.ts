type Maybe<T> = T | null | undefined;
type Nullable<T> = T | null;

export enum IdDocType {
  ID_CARD = 'ID_CARD',
  PASSPORT = 'PASSPORT',
  DRIVERS = 'DRIVERS',
  RESIDENCE_PERMIT = 'RESIDENCE_PERMIT',
  UTILITY_BILL = 'UTILITY_BILL',
  SELFIE = 'SELFIE',
  VIDEO_SELFIE = 'VIDEO_SELFIE',
  PROFILE_IMAGE = 'PROFILE_IMAGE',
  ID_DOC_PHOTO = 'ID_DOC_PHOTO',
  AGREEMENT = 'AGREEMENT',
  CONTRACT = 'CONTRACT',
  DRIVERS_TRANSLATION = 'DRIVERS_TRANSLATION',
  INVESTOR_DOC = 'INVESTOR_DOC',
  VEHICLE_REGISTRATION_CERTIFICATE = 'VEHICLE_REGISTRATION_CERTIFICATE',
  INCOME_SOURCE = 'INCOME_SOURCE',
  PAYMENT_METHOD = 'PAYMENT_METHOD',
  BANK_CARD = 'BANK_CARD',
  COVID_VACCINATION_FORM = 'COVID_VACCINATION_FORM',
  OTHER = 'OTHER',
}

export type IdDocErrors =
  | 'forbiddenDocument'
  | 'differentDocTypeOrCountry'
  | 'missingImportantInfo'
  | 'dataNotReadable'
  | 'expiredDoc'
  | 'documentWayTooMuchOutside'
  | 'grayscale'
  | 'noIdDocFacePhoto'
  | 'screenRecapture'
  | 'screenshot'
  | 'sameSides';
export type IdDocWarnings =
  | 'badSelfie'
  | 'dataReadability'
  | 'inconsistentDocument'
  | 'typeOrCountryChanged'
  | 'maybeExpiredDoc'
  | 'documentTooMuchOutside';

export type ReviewAnswer = 'RED' | 'GREEN';
export interface ReviewResult {
  rejectLabels?: string[];
  reviewAnswer: ReviewAnswer;
  clientComment?: string;
  reviewRejectType?: 'FINAL' | 'RETRY';
  moderationComment?: string;
}

export type ApplicantType = 'individual' | 'company';

export type ReviewStatus =
  | 'pending'
  | 'init'
  | 'prechecked'
  | 'queued'
  | 'completed'
  | 'onHold';

export type WebhookType =
  | 'applicantReviewed'
  | 'applicantPending'
  | 'applicantCreated'
  | 'applicantOnHold'
  | 'applicantPersonalInfoChanged'
  | 'applicantPrechecked'
  | 'applicantDeleted'
  | 'videoIdentStatusChanged'
  | 'applicantReset'
  | 'applicantActionPending'
  | 'applicantActionReviewed'
  | 'applicantActionOnHold';

export interface Auth0Profile {
  name: string;
  preferred_location_code: string;
  country_code: string;
  last_ip: string;
  mobile_phone: string;
}

export interface Agreement {
  createdAt: string;
  source: string;
  targets: string[];
  content?: any;
}

export interface DocSet {
  idDocSetType: string;
  types: string[];
  subTypes: string[];
  videoRequired: string;
}

export interface RequiredIdDocs {
  docSets: DocSet[];
}

export interface Review {
  reviewId: string;
  attemptId: string;
  attemptCnt: number;
  reprocessing: boolean;
  levelName: string;
  createDate: string;
  reviewStatus: string;
  priority: number;
  autoChecked: boolean;
  elapsedSincePendingMs?: number;
  elapsedSinceQueuedMs?: number;
  reviewDate: string;
  reviewResult: ReviewResult;
  reviewReasonCode: string;
  moderationTierType?: any;
  startDate: string;
}

export interface IdDoc {
  idDocType: string;
  country: string;
}

export interface Info {
  country: string;
  idDocs: IdDoc[];
}

export interface Applicant {
  id: string;
  createdAt: string;
  key: string;
  clientId: string;
  inspectionId: string;
  agreement: Agreement;
  requiredIdDocs: RequiredIdDocs;
  review: Review;
  type: string;
  info: Info;
  applicantPlatform: string;
  ipCountry: string;
  deleted?: boolean;
  externalUserId: string;
  /** @description If you want to separate your clients that send applicants, provide this field to distinguish between them. It also shows up at the webhook payloads. */
  sourceKey?: string;
  email?: string;
  phone?: string;
  /** @description	No	The language in which the applicant should see the result of verification in ISO 639-1 format */
  lang?: string;
  metadata?: Array<MetaDataRecord>;
  fixedInfo?: FixedInfo;
}

export interface ApplicantStatus {
  reviewId: string;
  attemptId: string;
  attemptCnt: number;
  reprocessing: boolean;
  levelName: string;
  createDate: string;
  reviewStatus: ReviewStatus;
  priority: number;
  autoChecked: boolean;
  elapsedSincePendingMs?: number;
  elapsedSinceQueuedMs?: number;
  reviewDate: string;
  reviewResult: ReviewResult;
  reviewReasonCode: string;
  moderationTierType?: null | any;
  startDate: string;
}

export type ImageReviewResults = Record<number, ReviewResult>;

export interface IdDocStatus {
  reviewResult: ReviewResult;
  country: string;
  idDocType: string;
  imageIds: number[];
  imageReviewResults: ImageReviewResults;
  forbidden: boolean;
  doubleSided: boolean;
  stepStatuses?: null | any;
}

export type RequiredIdDocsStatus = Record<string, IdDocStatus>;

export interface GraphSumsubApplicantResponse {
  applicant: Applicant;
  applicantId: string;
  userId: string;
  applicantStatus: ApplicantStatus;
  requiredIdDocsStatus: RequiredIdDocsStatus;
}

export interface ApplicantLevelItem {
  id: string;
  name: string;
  requiredIdDocs: RequiredIdDocs;
  websdkFlowId: string;
  msdkFlowId: string;
  createdAt: string;
  createdBy: string;
  modifiedAt: string;
}
export interface ApplicantLevels {
  list: {
    items: ApplicantLevelItem[];
    totalItems: number;
  };
}

export interface SumsubTokenResponse {
  token: Maybe<string>;
  levelName: Maybe<string>;
  userId: Maybe<string>;
  externalActionId: Maybe<string>;
}

export interface GetApplicantByIdResponse extends Applicant {
  id: string;
  createdAt: string;
  clientId: string;
  inspectionId: string;
  externalUserId: string;
  [key: string]: any;
}

export interface GetAccessTokenResponse {
  token: string;
  userId: string;
}

export interface GetShareTokenResponse {
  token: string;
  forClientId: string;
}

export type GetApplicantLevelsResponse = ApplicantLevels;

export interface FixedInfoAddress {
  /** @description Alpha-3 country code (e.g. DEU or RUS) (Wikipedia) */
  country?: string;
  postCode?: string;
  town?: string;
  street?: string;
  subStreet?: string;
  state?: string;
  buildingName?: string;
  flatNumber?: string;
  buildingNumber?: string;
  /** @description format YYYY-mm-dd, e.g. 2001-09-25 */
  startDate?: string;
  /** @description format YYYY-mm-dd, e.g. 2001-09-25 */
  endDate?: string;
}

export interface FixedInfo {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  firstNameEn?: string;
  lastNameEn?: string;
  middleNameEn?: string;
  legalName?: string;
  gender?: 'M' | 'F';
  /** @description No	Date of birth (format YYYY-mm-dd, e.g. 2001-09-25) */
  dob?: string;
  placeOfBirth?: string;
  /** @description Alpha-3 country code (e.g. DEU or RUS) (Wikipedia) */
  countryOfBirth?: string;
  stateOfBirth?: string;
  /** @description Alpha-3 country code (e.g. DEU or RUS) (Wikipedia) */
  country?: string;
  /** @description Alpha-3 country code (e.g. DEU or RUS) (Wikipedia) */
  nationality?: string;
  addresses?: FixedInfoAddress[];
}

export interface MetaDataRecord {
  key: string;
  value: any;
}

export interface CreateApplicantBody {
  externalUserId: string;
  /** @description If you want to separate your clients that send applicants, provide this field to distinguish between them. It also shows up at the webhook payloads. */
  sourceKey?: string;
  email?: string;
  phone?: string;
  /** @description	No	The language in which the applicant should see the result of verification in ISO 639-1 format */
  lang?: string;
  metadata?: Array<MetaDataRecord>;
  fixedInfo?: FixedInfo;
}

export interface IdDocMetaData {
  idDocType: IdDocType;
  idDocSubType?: 'FRONT_SIDE' | 'BACK_SIDE' | null;
  /** @description Yes	3-letter country code (Wikipedia) */
  country: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  /** @description format YYYY-mm-dd, e.g. 2001-09-25 */
  issuedDate?: string;
  /** @description format YYYY-mm-dd, e.g. 2001-09-25 */
  validUntil?: string;
  number?: string;
  /** @description format YYYY-mm-dd, e.g. 2001-09-25 */
  dob?: string;
  placeOfBirth?: string;
}

export interface IdDocMetaDataWithErrors extends IdDocMetaData {
  errors?: IdDocErrors[];
  warnings?: IdDocWarnings[];
}

export interface IdDocMetaDataResponse {
  data: IdDocMetaDataWithErrors;
  imageId?: string;
  correlationId?: string;
}
export interface ReviewStatusResponse {
  reviewId: string;
  attemptId: string;
  createDate: string;
  reprocessing: boolean;
  levelName: string;
  priority: number;
  autoChecked: boolean;
  reviewDate: string;
  startDate?: string;
  moderationComment?: string;
  clientComment?: string;
  reviewStatus?: ReviewStatus;
  attemptCnt: number;
  elapsedSincePendingMs?: number;
  elapsedSinceQueuedMs?: number;
  reviewResult: ReviewResult;
  reviewReasonCode: string;
  moderationTierType?: null | any;
}

export interface ModerationStates {
  list: {
    items: Array<{
      id: string;
      applicantId: string;
      key: string;
      imagesStates?: Record<
        string,
        {
          state: Record<string, { value: boolean }>;
        }
      >;
      applicantState?: Record<string, { value: boolean }>;
    }>;
    totalItems: number;
  };
}

export type RiskLevelType = 'unknown' | 'low' | 'medium' | 'high';

export interface RiskLevel {
  riskLevel: RiskLevelType;
  entries: Array<{
    id: string;
    createdAt: string;
    comment: string;
    riskLevel: RiskLevelType;
  }>;
}
