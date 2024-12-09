import { Responses } from '../interfaces';
import { Response, Request } from 'express';
import { RESPONSES, ELASTIC_SEARCH, NODE_ENV } from '../constant/response';
import {
  GenericSuccess,
  GenericError,
} from '../interfaces/responses.interface';
import activityLogsHelper from './activityLogs.helper';
class ResponseHelper {
  public async success(
    request: Request,
    response: Response,
    data: GenericSuccess
  ) {
    const finalSuccess: Responses.Responses = {
      response: {
        status: 200,
        message: data.message,
        field: data.field ? data.field : '',
        error: false,
        data: typeof data.data != 'undefined' ? data.data : {},
      },
    };

    console.log('RESPONSE PAYLOAD ::', finalSuccess);
    if (NODE_ENV?.toLowerCase() === 'prod' && request.method !== 'GET') {
      await activityLogsHelper.saveActivityLog(
        request,
        response,
        RESPONSES.SUCCESS,
        finalSuccess.response,
        ELASTIC_SEARCH.REQUEST_TYPE.SUCCESS,
        request?.body?.activityTitle
      );
    }
    return response.status(200).send(finalSuccess);
  }
  public async error400(
    request: Request,
    response: Response,
    data: GenericError
  ) {
    const errorResponse: Array<object> = [];
    if (typeof data.error === 'object') {
      errorResponse.push(data.error);
    }
    const finalError: Responses.Responses = {
      response: {
        status: 400,
        message: 'Error',
        error: true,
        data: errorResponse,
      },
    };
    console.log('RESPONSE PAYLOAD ::', finalError);
    if (NODE_ENV?.toLowerCase() === 'prod' && request.method !== 'GET') {
      await activityLogsHelper.saveActivityLog(
        request,
        response,
        RESPONSES.BADREQUEST,
        finalError.response,
        ELASTIC_SEARCH.REQUEST_TYPE.ERROR,
        request?.body?.activityTitle
      );
    }
    return response.status(400).send(finalError);
  }

  public async error401(
    request: Request,
    response: Response,
    data: GenericError
  ) {
    const errorResponse: Array<object> = [];
    if (typeof data.error === 'object') {
      errorResponse.push(data.error);
    }
    const finalError: Responses.Responses = {
      response: {
        status: 401,
        message: data.errorMessage ? data.errorMessage : 'Error',
        error: true,
        data: errorResponse,
      },
    };
    console.log('RESPONSE PAYLOAD ::', finalError);
    if (NODE_ENV?.toLowerCase() === 'prod' && request.method !== 'GET') {
      await activityLogsHelper.saveActivityLog(
        request,
        response,
        RESPONSES.UNAUTHORIZED,
        finalError.response,
        ELASTIC_SEARCH.REQUEST_TYPE.ERROR,
        request?.body?.activityTitle
      );
    }
    return response.status(401).send(finalError);
  }

  public async error500(
    request: Request,
    response: Response,
    data: GenericError
  ) {
    const errorResponse: Array<object> = [];
    if (typeof data.error === 'object') {
      errorResponse.push(data.error);
    }
    const finalError: Responses.Responses = {
      response: {
        status: 500,
        message: 'Error',
        error: true,
        data: errorResponse,
      },
    };
    console.log('RESPONSE PAYLOAD ::', finalError);
    if (NODE_ENV?.toLowerCase() === 'prod' && request.method !== 'GET') {
      await activityLogsHelper.saveActivityLog(
        request,
        response,
        RESPONSES.INTERNALSERVER,
        finalError.response,
        ELASTIC_SEARCH.REQUEST_TYPE.ERROR
      );
    }
    return response.status(500).send(finalError);
  }

  public grpcSuccess(data: GenericSuccess) {
    const finalSuccess: Responses.Responses = {
      response: {
        status: '200',
        message: data.message,
        error: false,
        data: typeof data.data != 'undefined' ? data.data : {},
      },
    };
    return finalSuccess.response;
  }

  public grpcError400(data: GenericError) {
    const errorResponse: Array<object> = [];
    if (typeof data.error === 'object') {
      errorResponse.push(data.error);
    }
    const finalError: Responses.GrpcResponses = {
      response: {
        status: '400',
        message: 'Error',
        error: true,
        data: errorResponse,
        errorData: errorResponse,
      },
    };
    return finalError.response;
  }
}
export default new ResponseHelper();
