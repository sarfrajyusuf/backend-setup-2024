import { NextFunction, Request, Response } from 'express';
import { Secret, verify } from 'jsonwebtoken';
import { MIDDLEWARE_RESPONSE, NODE_ENV } from '../constant/response';
import * as Helpers from '../helpers';
import {
  GenericError,
  GenericRequestPusher,
} from '../interfaces/responses.interface';
import {
  AuthenticationTokenMissingException,
  WrongAuthenticationTokenException,
} from '../exceptions/';
import { DataStoredInToken } from '../interfaces/';
import userHelper from '../modules/user/user.helper';
import { HttpException } from '../exceptions';
import { validationResult } from 'express-validator';
import { RESPONSES } from '../constant/response';
import { Interface } from '../interfaces/index';
import * as CM from '../constant/response';
import * as multer from 'multer';
const setResponse = Helpers.ResponseHelper;

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'public/uploads');
//   },

//   filename: function (req, file, cb) {
//     cb(null, `${file.originalname}`);
//   },
// });

const upload = multer({
  limits: {
    fileSize: 500 * 1024, // 5 KB
  },
  // storage: storage,
  fileFilter: (req: any, file, cb) => {
    const fileSize = parseInt(req.headers['content-length']);
    if (file.size > 500 * 1024) {
      cb(new Error('testinng'));
    }
    if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg' ||
      file.mimetype === 'application/pdf'
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Please upload document in correct format'));
    }
  },
});

function adminValidationToken(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const token = request.headers['api-access-token'] as string;
  if (!token) {
    return setResponse.error401(request, response, {
      error: {
        name: 'Jwt error',
        message: MIDDLEWARE_RESPONSE.JWT_MUST_PROVIDED,
      },
    });
  }
  let secret: Secret = CM.JWT.JWT_ADMIN_SECRET;
  verify(token, secret, (err, decoded) => {
    if (err) {
      console.log(`ERROR::`, err);
      return setResponse.error401(request, response, {
        error: {
          name: 'Jwt error',
          message: MIDDLEWARE_RESPONSE.JWTERROR,
        },
        errorMessage: err.message,
      });
    }
    request.userInfo = decoded as GenericRequestPusher;
    next();
  });
}

async function userValidationToken(
  request: Request,
  response: Response,
  next: NextFunction
) {
  console.log('REQUEST PAYLOAD ::', request.body);
  console.log('REQUEST PARAMS ::', request.params);
  const token = request.headers['api-access-token'] as string;
  if (!token) {
    return setResponse.error401(request, response, {
      error: {
        field: CM.MIDDLEWARE_RESPONSE.FIELDS.JWT_REQUIRED,
        message: MIDDLEWARE_RESPONSE.JWT_MUST_PROVIDED,
      },
    });
  }
  let secret: Secret = CM.JWT.JWT_USER_ACCESS_SECRET;

  verify(token, secret, async (err, decoded) => {
    if (err) {
      console.log(`ERROR::`, err);
      return setResponse.error401(request, response, {
        error: {
          field: CM.MIDDLEWARE_RESPONSE.FIELDS.JWT_ERROR,
          message: MIDDLEWARE_RESPONSE.JWTERROR,
        },
        errorMessage: err.message,
      });
    }
    request.userInfo = decoded as GenericRequestPusher;
    console.log('JWT TOKEN DATA::', request.userInfo);
    const userSessionRow = await userHelper.getUserSessionRow({
      userId: request.userInfo.userId,
      accessToken: token,
    });
    if (!userSessionRow) {
      return setResponse.error401(request, response, {
        error: {
          field: CM.MIDDLEWARE_RESPONSE.FIELDS.SESSION_EXPIRED,
          message: MIDDLEWARE_RESPONSE.SESSION_EXPIRED,
        },
      });
    }
    next();
  });
}

async function userAuthToken(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const token = request.headers['api-refresh-token'] as string;
  console.log('TOKEN::', token);
  if (!token) {
    return setResponse.error401(request, response, {
      error: {
        name: 'Jwt error',
        message: MIDDLEWARE_RESPONSE.JWT_MUST_PROVIDED,
      },
    });
  }
  let secret: Secret = CM.JWT.JWT_USER_REFRESH_SECRET;

  verify(token, secret, async (err, decoded) => {
    if (err) {
      console.log(`ERROR::`, err);
      return setResponse.error401(request, response, {
        error: {
          name: 'Jwt error',
          message: MIDDLEWARE_RESPONSE.JWTERROR,
        },
        errorMessage: err.message,
      });
    }
    request.userInfo = decoded as GenericRequestPusher;
    request.body.refreshToken = token;
    next();
  });
}

async function getTokenAuth(token: string) {
  let response = { error: true, userId: '' };
  if (token) {
    let secret: Secret = CM.JWT.JWT_USER_ACCESS_SECRET;

    verify(token, secret, async (err, decoded) => {
      if (err) {
        console.log('INVALID TOKEN::', err);
        response.error = true;
        response.userId = '';
      } else {
        const tokenData = decoded as GenericRequestPusher;
        if (response) {
          response.error = false;
          response.userId = tokenData.userId;
        }
      }
    });
  }

  return response;
}

async function authMiddleware(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const cookies = request.cookies;
  if (cookies && cookies.Authorization) {
    const secret = CM.JWT.JWT_USER_ACCESS_SECRET;
    try {
      verify(cookies.Authorization, secret) as DataStoredInToken;
      next();
    } catch (error) {
      next(new WrongAuthenticationTokenException());
    }
  } else {
    next(new AuthenticationTokenMissingException());
  }
}

function errorMiddleware(
  error: HttpException,
  req: Request,
  response: Response
) {
  const status = error.status || 500;
  const message = error.message || 'Something went wrong';
  return response.status(status).send({
    message,
    status,
  });
}

const postValidate = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const error = validationResult(request);
  const responseError: Array<object> = [];

  if (!error.isEmpty()) {
    for (const errorRow of error.array() as Array<Interface.FIELD_VALIDATION_ERROR>) {
      responseError.push({
        field: CM.SERVICE + '.validation.' + errorRow.path,
        message: errorRow.msg,
      });
    }
    return response.status(RESPONSES.BADREQUEST).send({
      response: {
        status: 400,
        message: 'Error!',
        error: true,
        data: responseError,
      },
    });
  } else {
    next();
  }
};

const saveActivityLog = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    console.log('SAVE ACTIVITY LOG::');
    if (NODE_ENV?.toLowerCase() === 'prod') {
      delete request.body.initTransaction;
      const forwarded: any = request.headers['x-forwarded-for'];
      const payload: Interface.SAVE_ACTIVITY_LOG_PAYLOAD = {
        userId:
          request?.userInfo && request.userInfo.userId
            ? request?.userInfo?.userId
            : '',
        route: request.route.path,
        slug: request.originalUrl,
        serviceName: CM.ELASTIC_SEARCH.SERVICE_NAME,
        ipAddress: forwarded
          ? forwarded.split(',')[0]
          : request.socket.remoteAddress,
        serviceType: CM.ELASTIC_SEARCH.SERVICE_TYPE.API,
        requestType: CM.ELASTIC_SEARCH.SERVICE_TYPE.API,
        requestPayload: JSON.stringify(request.body),
        method: request.method,
        statusCode: RESPONSES.SUCCESS,
        responsePayload: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        title: request?.body?.activityTitle || '',
      };
      console.log('SAVE ACTIVITY LOG PAYLOAD TEST::', payload);
      await Helpers.activityLogsHelper.saveDocument(
        CM.ELASTIC_SEARCH.INDEXES.ACTIVITY_LOGS,
        payload
      );
    }
    next();
  } catch (error) {
    console.log('SAVE ACTIVITY LOG::', error);
    return setResponse.error400(request, response, {
      error: error as GenericError,
    });
  }
};
export {
  saveActivityLog,
  adminValidationToken,
  userValidationToken,
  authMiddleware,
  errorMiddleware,
  postValidate,
  userAuthToken,
  getTokenAuth,
  upload,
};
