import * as mysql from 'mysql';
import { envAlias } from '../constant/response';
class DbHelper {
  private normalPool: mysql.Pool | undefined;
  private writePool: mysql.Pool | undefined;
  private readPool: mysql.Pool | undefined;
  constructor() {
    this.normalPool = this.initializePool('normal');
  }
  public initializePool(connectionType: string) {
    if (connectionType === 'normal') {
      return mysql.createPool({
        connectionLimit: 1,
        host: envAlias.HOST_NAME,
        database: envAlias.DBNAME,
        user: envAlias.USER_NAME,
        password: envAlias.PASSWORD,
        timezone: 'Z',
      });
    }
    if (connectionType === 'write') {
      return mysql.createPool({
        connectionLimit: 10,
        host: envAlias.WRITE_NAME,
        database: envAlias.WRITE_DBNAME,
        user: envAlias.WRITE_USER_NAME,
        password: envAlias.WRITE_PASSWORD,
        timezone: 'Z',
      });
    }
    if (connectionType === 'read') {
      return mysql.createPool({
        connectionLimit: 10,
        host: envAlias.READ_HOST_NAME,
        database: envAlias.READ_DBNAME,
        user: envAlias.READ_USER_NAME,
        password: envAlias.READ_PASSWORD,
        timezone: 'Z',
      });
    }
  }
  public pdo<T>(
    query: string | mysql.QueryOptions,
    conType = 'normal'
  ): Promise<T | Array<T>> {
    let pdoConnect: mysql.Pool | undefined;
    if (conType === 'read') {
      this.readOpreation();
      pdoConnect = this.readPool;
    } else if (conType === 'write') {
      this.writeOpreation();
      pdoConnect = this.writePool;
    } else {
      pdoConnect = this.normalPool;
    }
    return new Promise((resolve, reject) => {
      pdoConnect?.getConnection(
        (err: mysql.MysqlError, connection: mysql.PoolConnection) => {
          if (err) {
            console.log('==============DBError55==============Here', err);
            return reject(err);
          }
          connection.query(query, (error: string, results: Array<T>) => {
            connection.release();
            if (error) return reject(error);
            const result =
              results.length > 0 ? JSON.parse(JSON.stringify(results[0])) : [];
            resolve(result);
          });
        }
      );
    });
  }

  public readOpreation() {
    this.readPool = this.initializePool('read');
  }
  public writeOpreation() {
    this.writePool = this.initializePool('read');
  }
}
export default new DbHelper();
