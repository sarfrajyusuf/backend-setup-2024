import * as redis from 'redis';
import { REDIS_CRED } from '../constant/response';
class RedisHelper {
  public client: any;

  private host: string = REDIS_CRED.REDIS_HOSTNAME;

  private port: string = REDIS_CRED.REDIS_PORT;

  private auth: string = REDIS_CRED.REDIS_AUTH;

  private user: string = REDIS_CRED.REDIS_USER;

  constructor() {
    this.connect();
  }

  async connect() {
    console.log('Redis client');
    this.client = redis.createClient({
      url: `redis://${this.user}:${this.auth}@${this.host}:${this.port}`,
    });
    await this.client.connect();
    console.log('Redis Connected');
  }

  // Set String value for given key
  // Note expires time secounds
  public setString(key: string, value: string, expires = 0, database = '') {
    if (database !== '') {
      this.client.select(database);
    }
    return new Promise((resolve, reject) => {
      this.client.set(key, value, (err: Error, reply: string) => {
        if (err) {
          console.log('err :: ', err);
          return reject(err);
        }
        // Add Expire Time if provided
        if (expires !== 0) {
          this.client.expire(key, expires * 60);
        }
        resolve(reply);
      });
    });
  }

  // Get String value for given key
  public getString(key: string, database = '') {
    if (database !== '') {
      this.client.select(database);
    }
    return new Promise((resolve, reject) => {
      this.client.get(key, (err: Error, reply: string) => {
        if (err) {
          return reject(err);
        }
        resolve(reply);
      });
    });
  }

  public destroyDb(dbKey: string) {
    return new Promise((resolve) => {
      this.client.del(dbKey, (err: Error, response: number) => {
        if (response === 1) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }
}
export default new RedisHelper();
