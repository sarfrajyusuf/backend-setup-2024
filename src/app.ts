import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import * as path from 'path';
import { Controller } from './interfaces';
import * as CM from './constant/response';
const apiBase = CM.API_BASE;
import CronService from './cron/cron';
import * as swaggerUi from 'swagger-ui-express';
import * as swaggerDocument from './swagger.json';
import { GenericRequestPusher } from 'interfaces/responses.interface';
import helmet from 'helmet';
declare global {
  namespace Express {
    interface Request {
      userInfo: GenericRequestPusher; // Define the new property and its type
    }
  }
}

class App {
  public app: express.Application;
  constructor(controllers: Controller) {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeControllers(controllers);

    // this.initializeErrorHandling();
  }

  public listen() {
    this.app.listen(process.env.PORT ? process.env.PORT : 8082, () => {
      new CronService();
      console.log(
        `App listening on the port ${
          process.env.PORT ? process.env.PORT : 8082
        }`
      );
    });
  }
  public getServer() {
    return this.app;
  }

  private initializeMiddlewares() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ limit: '50mb', extended: true }));
    this.app.use(cookieParser());
    // this.app.use(
    //   cors({
    //     origin: function (origin: any, callback) {
    //       if (origin && CM.ALLOWED_ORIGINS.indexOf(origin) !== -1) {
    //         callback(null, true);
    //       } else {
    //         callback(new Error('Request not allowed'));
    //       }
    //     },
    //   })
    // );
    this.app.set('views', path.join(__dirname, 'views'));
    this.app.set('view engine', 'ejs');
    this.app.use(
      `${apiBase}/api-docs`,
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocument)
    );
    this.app.get(`${apiBase}/status`, (req, res) => {
      console.log('Status Route called');
      return res.json({ status: 'success' });
    });
    this.securityHooks();
  }

  private initializeControllers(controller: Controller) {
    this.app.use(`${apiBase}`, controller.router);
  }

  // private initializeErrorHandling() {
  //   this.app.use(errorMiddleware);
  // }

  private securityHooks() {
    this.app.use(helmet());
    this.app.use(
      helmet.contentSecurityPolicy({
        useDefaults: true,
        directives: {
          'frame-ancestors': "'none'",
        },
      })
    );
    this.app.use(helmet.dnsPrefetchControl());
    this.app.use(
      helmet.frameguard({
        action: 'deny',
      })
    );
    this.app.use(helmet.hidePoweredBy());
    this.app.use(helmet.hsts());
    this.app.use(helmet.ieNoOpen());
    this.app.use(helmet.noSniff());
    this.app.use(helmet.permittedCrossDomainPolicies());
    this.app.use(helmet.referrerPolicy());
    this.app.use(helmet.xssFilter());

    this.app.use(
      (
        err: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        if (err) {
          res.status(404).json({ error: err.message });
        } else {
          res.setHeader(
            'Content-Security-Policy',
            "default-src 'none'; script-src 'none'; style-src 'none'; img-src 'none'; frame-src 'none'; font-src 'none'; object-src 'none'; media-src 'none'; connect-src 'none'; form-action 'none'; frame-ancestors 'none';"
          );
          res.setHeader('X-XSS-Protection', '1; mode=block');
          res.setHeader(
            'Strict-Transport-Security',
            ' max-age=31536000; includeSubDomains'
          );
          next();
        }
      }
    );
  }
}

export default App;
