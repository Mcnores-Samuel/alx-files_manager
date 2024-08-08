import express from 'express';
import startServer from './libs/boot';
import injectRoutes from './routes/index';
import injectMiddlewares from './libs/middlewares';

const server = express();

injectMiddlewares(server);
injectRoutes(server);
startServer(server);

export default server;