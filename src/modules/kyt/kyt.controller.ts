import { Router } from 'express';
import * as Interface from '../../interfaces/index';
import kytMiddleware from './kyt.middleware';


class KytController implements Interface.Controller {
    path: string;
    router: Router;

    constructor(path: string, router: Router) {
        this.path = path;
        this.router = router;
        this.initializeRouter()
    }
    initializeRouter() {
        this.router
            .all('/*')
            .post(this.path + '/transactionWebhook',
                kytMiddleware.sumsubTransactionWebhook
            )
    }
}


export {
    KytController
}