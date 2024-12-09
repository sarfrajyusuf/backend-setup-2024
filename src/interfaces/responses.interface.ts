interface Responses {
  response: {
    status: number | string;
    message: string;
    error: boolean;
    data: object;
    field?: string;
  };
}

interface GrpcResponses {
  response: {
    status: number | string;
    message: string;
    error: boolean;
    data: object;
    errorData: object;
  };
}

interface GenericGenerateJwt {
  accessJwt: string;
  refreshJwt: string;
}

interface GenerateJwtPayload {
  userId: string;
  email?: string;
  accountType?: string;
  nationality?: string;
  phoneNumber?: string;
  clientId?: string;
}
interface GenericSuccess {
  status?: number;
  error?: boolean;
  message: string;
  data: object;
  field?: string;
}
interface GenericError {
  message?: string;
  error?: Array<object> | object | string;
  field?: string;
  errorMessage?: string;
}

interface GenericRequestPusher {
  jwtData?: string;
  userId: string;
  adminRole?: string;
  email?: string;
  phoneNumber?: string;
}

interface GetCommonResponse {
  message: string;
  data: object | Array<object>;
  field?: string;
}



export {
  Responses,
  GenericSuccess,
  GenericError,
  GenericRequestPusher,
  GetCommonResponse,
  GenericGenerateJwt,
  GenerateJwtPayload,
  GrpcResponses,
};
