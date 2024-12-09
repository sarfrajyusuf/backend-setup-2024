import express, { NextFunction } from "express"
import KytHelper from "./kyt.helper"
import kytHelper from "./kyt.helper";



class KytMiddleware {

    sumsubTransactionWebhook: express.RequestHandler = async (
        req: express.Request,
        res: express.Response,
        next: NextFunction
    ) => {
        let trxStatus = '';
        let webhookResponse = false;

        console.log('REQUEST HEADER TRANSACTION WEBHOOK:', req.headers, 'REQUEST BODY:', req.body);
        // console.log('REQUEST BODY:', req.body);
        trxStatus = KytHelper.handleSumsubKYTStatus(req?.body?.type,req?.body?.reviewStatus, req?.body?.reviewResult?.reviewAnswer);
        console.log('KYT STATUS UPDATED BY HANDLE SUMSUB KYT STATUS:', trxStatus);
        webhookResponse = await kytHelper.manageKytStatuses(trxStatus, req?.body?.kytDataTxnId);
        console.log('RESPONSE SENT TO SUMSUB:', webhookResponse);
        if (webhookResponse) {
            res.status(200).send({ success: webhookResponse });
        } else {
            res.status(400).send({ success: webhookResponse });
        }

    }
}

export default new KytMiddleware();