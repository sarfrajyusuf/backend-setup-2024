import * as express from 'express';
import UserController from './user/user.controller';
import { GrpcClients } from './grpc/clients/client.init';
import { GrpcServer } from './grpc/server/server.init';
import { GRPC } from '../constant/response';
import KycController from './kyc/kyc.controller';
import { KytController } from './kyt/kyt.controller';

class InitControllers {
  public path = '';
  public router = express.Router();
  constructor() {
    if (Number(GRPC.GRPC_ENABLE_DISABLE) === 1) {
      new GrpcServer();
      new GrpcClients();
    }

    new UserController('/user', this.router);
    new KycController('/kyc', this.router);
    new KytController('/kyt', this.router);
  }
}

export default InitControllers;
