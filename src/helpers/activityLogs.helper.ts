import { Client } from '@elastic/elasticsearch';
import { Request, Response } from 'express';
import * as Interface from '../interfaces/interface';
import { ELASTIC_SEARCH } from '../constant/response';
import * as CM from '../constant/response';
class ActivityLogsHelper {
  private node: string = ELASTIC_SEARCH.ES_NODE;
  public client: any;
  constructor() {
    // this.connect();
  }

  async connect() {
    try {
      console.log('Elastic Search Connection');
      this.client = new Client({
        node: this.node,
        auth: {
          apiKey: {
            id: ELASTIC_SEARCH.API_KEY.ID, // Replace with your API key ID
            api_key: ELASTIC_SEARCH.API_KEY.KEY, // Replace with your API key
          },
        },
      });
      console.log('CONNECTED TO ELASTIC SEARCH::');
    } catch (error) {
      console.log('ERROR IN ELASTIC SEARCH CONNECTION::', error);
    }
  }

  //

  saveActivityLog = async (
    request: Request,
    response: Response,
    statusCode: number,
    responsePayload = {},
    requestType: string,
    title: string = ''
  ) => {
    try {
      console.log(
        'SAVE ACTIVITY LOG==================================================================================::',
        title
      );
      delete request.body.initTransaction;
      const forwarded: any = request.headers['x-forwarded-for'];
      const payload: Interface.SAVE_ACTIVITY_LOG_PAYLOAD = {
        userId:
          request?.userInfo && request.userInfo.userId
            ? request?.userInfo?.userId
            : '',
        route: request.route.path,
        slug: this.getSlugName(request.originalUrl),
        serviceName: ELASTIC_SEARCH.SERVICE_NAME,
        ipAddress: forwarded
          ? forwarded.split(',')[0]
          : request.socket.remoteAddress,
        serviceType: ELASTIC_SEARCH.SERVICE_TYPE.API,
        requestType: requestType,
        requestPayload: JSON.stringify(request.body),
        method: request.method,
        statusCode: statusCode,
        responsePayload: JSON.stringify(responsePayload),
        createdAt: new Date(),
        updatedAt: new Date(),
        title: title,
      };
      console.log('SAVE ACTIVITY LOG PAYLOAD::', payload);
      await this.saveDocument(ELASTIC_SEARCH.INDEXES.ACTIVITY_LOGS, payload);
    } catch (error) {
      console.log('SAVE ACTIVITY LOG::', error);
      return false;
    }
  };

  getSlugName = (url: string) => {
    if (url !== undefined) {
      const splitted = url.split('/');
      const nthValue = splitted[splitted.length - 1];
      return this.formatSlugName(nthValue);
    }

    return '_';
  };

  formatSlugName(text: string) {
    let regularCaseText = text
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before each uppercase letter
      .replace(/^[a-z]/, function (match) {
        return match.toUpperCase();
      }); // Capitalize the first letter

    return regularCaseText;
  }

  formatIpAddress(ip: string) {
    if (ip !== undefined) {
      const splittedForm = ip.split(':');
      console.log('splittedForm', splittedForm);
      const lastValue = splittedForm[splittedForm.length - 1];
      return lastValue;
    }
  }

  // create new document of a index
  async saveDocument(indexName: string, document: any) {
    try {
      console.log('SAVE DOCUMENT::', indexName);
      const response = await this.client.index({
        index: indexName.toLowerCase(),
        body: document,
      });
      console.log('DOCUMENT SAVED ::', response);
      return response;
    } catch (error) {
      console.log('ERROR IN SAVING DOCUMENT::', error);
    }
  }

  async deleteDocument(indexName: string, documentId: string) {
    try {
      console.log('DELETE DOCUMENT::', indexName, documentId);
      await this.client.delete({
        index: indexName,
        id: documentId,
      });
      return true;
    } catch (error) {
      console.log('ERROR IN DELETE DOCUMENT::', error);
      return false;
    }
  }

  // update document by document ID
  async updateDocument(indexName: string, documentId: string, document: any) {
    try {
      console.log('UPDATE DOCUMENT::', indexName, documentId);
      const result = await this.client.update({
        index: indexName.toLowerCase(),
        id: documentId,
        doc: document,
      });
      console.log('UPDATE DOCUMENT RESULT::', result);

      return true;
    } catch (error) {
      console.log('ERROR IN UPDATE DOCUMENT::', error);
      return false;
    }
  }

  //  get single document by document ID
  async getDocument(indexName: string, documentId: string) {
    try {
      const document = await this.client.get({
        index: indexName.toLowerCase(),
        id: documentId,
      });
      console.log('GET DOCUMENT RESULT:', document);
      if (document && document.found) {
        console.log('DOCUMENT SOURCE::', document._source);
        return document._source;
      }
    } catch (error) {
      console.log('ERROR IN GET DOCUMENT::', error);
      return false;
    }
  }

  // get all documents fo index
  async getAllDocuments(indexName: string, limit: number, offset: number) {
    try {
      const records = await this.client.search({
        index: indexName.toLowerCase(),
        size: limit,
        from: offset,
      });
      const totalRecords = records.hits.total.value;
      // const documents = records.hits.hits.map((hit: any) => hit._source);
      const documents = records.hits.hits;
      console.log(`Total documents in index: ${totalRecords}`);
      console.log('DOCUMENTS::', documents);
      if (documents.length) {
        return { data: documents, totalRowCount: totalRecords };
      } else {
        return { data: [], totalRowCount: totalRecords };
      }
    } catch (error) {
      console.log('ERROR IN GET ALL DOCS::', error);
      return false;
    }
  }

  //  search document
  async searchDocument(indexName: string, query: any) {
    try {
      const document = await this.client.search({
        index: indexName.toLowerCase(),
        query: query,
      });
      console.log('SEARCH DOCUMENT RESULT:', document);
      if (document && document.hits.hits.length) {
        console.log('SEARCHED DOCUMENT SOURCE::', document.hits);
        return document._source;
      }
    } catch (error) {
      console.log('ERROR IN SEARCH DOCUMENT::', error);
      return false;
    }
  }
}
export default new ActivityLogsHelper();
