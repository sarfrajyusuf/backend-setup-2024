interface FIELD_VALIDATION_ERROR {
  type: string;
  location: string;
  path: string;
  value: string;
  msg: string;
}

interface EnvironmentVariables {
  PORT: string;
  DBNAME: string;
  USER_NAME: string;
  PASSWORD: string;
  HOST_NAME: string;
  CLUSTER: boolean;
  JWTADMINSECRET: string;
  JWTACCESSSECRET: string;
  JWTREFRESHSECRET: string;
  JWTUSERACCESSEXPIRETIME: string;
  JWTUSERREFRESHEXPIRETIME: string;
  REDIS_HOSTNAME: string;
  REDIS_PORT: string;
  REDIS_AUTH: string;
  REDIS_USER: string;
  RABITMQ_CON_URL: string;
  WRITE_NAME: string;
  WRITE_DBNAME: string;
  WRITE_USER_NAME: string;
  WRITE_PASSWORD: string;
  READ_HOST_NAME: string;
  READ_DBNAME: string;
  READ_USER_NAME: string;
  READ_PASSWORD: string;
  JWT_SECRET: string;
  OTP_EXPIRE_TIME_SECONDS: number;
  CLIENT_ID: string;
  BROKER: string;
  KAFKA_GROUP_ID_PREFIX: string;
  GRPC_USER: string;
  GRPC_ADMIN: string;
  GRPC_ENABLE_DISABLE: number;
  KAFKA_ENABLE_DISABLE: number;
  TXN_OTP_EXPIRE_TIME_SECONDS: number;
  DLEETE_ACCOUNT_PREFIX: string;
  PROJECT_NAME: string;
  GOOGLE_CLOUD_PROJECT_ID: string;
  GOOGLE_CLOUD_BUCKET_NAME: string;
  MAX_SUPPORT_TICKET_ATTACHMENT: number;
  MAX_SUPPORT_TICKET_ATTACHMENT_SIZE: number;
  SUPPORT_TICKET_DIRECTORY_NAME: string;
  ES_NODE: string;
  ES_API_KEY_ID: string;
  ES_API_KEY: string;
  ALLOWED_ORIGINS: Array<string>;
  NODE_ENV: string;
  GRPC_REFERRAL: string;
  SUPPORTED_CURRENCY_LIST: Array<string>;
  SUPPORTED_LANGUAGE_LIST: Array<string>;
  SUMSUB_APP_TOKEN: string;
  SUMSUB_SECRET_KEY: string;
  SUMSUB_BASE_URL: string;
  GRPC_OVER_WALLET: string;
  GRPC_BANKING: string;
  BUCKET_NAME: string;
  AWS_USER_KEY: string;
  AWS_USER_SECRET: string;
  AWS_USER_REGION: string;
  AWS_S3_ENDPOINT: string;
}

interface SAVE_ACTIVITY_LOG_PAYLOAD {
  userId?: string;
  route: string;
  slug: string;
  serviceName: string;
  ipAddress: string | any;
  serviceType: string;
  requestType: string;
  requestPayload: string;
  method: string;
  statusCode: number;
  responsePayload: string;
  createdAt: Date;
  updatedAt: Date;
  title?: string;
}

export {
  FIELD_VALIDATION_ERROR,
  EnvironmentVariables,
  SAVE_ACTIVITY_LOG_PAYLOAD,
};
