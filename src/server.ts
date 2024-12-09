import * as _cluster from 'cluster';
const cluster = _cluster as any as _cluster.Cluster; // typings fix
import * as os from 'os';
import * as config from './config';
// Loading Config
(async () => {
  await config.initiate();
})();

import App from './app';
import InitControllers from './modules';

const clusterEnable = process.env.CLUSTER === 'false' ? false : true;
console.log(' Cluster Mode' + clusterEnable);

if (cluster.isPrimary && clusterEnable) {
  const numWorkers = os.cpus().length;
  console.log('Master cluster setting up ' + numWorkers + ' workers...');
  for (let i = 0; i < numWorkers; i += 1) {
    cluster.fork();
  }
  cluster.on('online', (worker) => {
    console.log('Worker ' + worker.process.pid + ' is online');
  });

  cluster.on('exit', (worker, code, signal) => {
    console.log(
      'Worker ' +
        worker.process.pid +
        ' died with code: ' +
        code +
        ', and signal: ' +
        signal
    );
    console.log('Starting a new worker');
    cluster.fork();
  });
} else {
  let app: App;
  app = new App(new InitControllers());
  app.listen();
}
