// eslint-disable-next-line no-unused-vars
import { Express } from 'express';
import AppController from '../controllers/AppController';
import AuthController from '../controllers/AuthController';
import UsersController from '../controllers/UsersController';
import FilesController from '../controllers/FilesController';
import { Request, Response, NextFunction } from 'express';
import { getUserFromXToken, getUserFromAuthorization } from '../utils/auth';

/**
 * Represents an error in this API.
 */
class APIError extends Error {
  constructor(code, message) {
    super();
    this.code = code || 500;
    this.message = message;
  }
};

/**
 * Applies Basic authentication to a route.
 * @param {Error} err The error object.
 * @param {Request} req The Express request object.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The Express next function.
 */
const errorResponse = (err, req, res, next) => {
  const defaultMsg = `Failed to process ${req.url}`;

  if (err instanceof APIError) {
    res.status(err.code).json({ error: err.message || defaultMsg });
    return;
  }
  res.status(500).json({
    error: err ? err.message || err.toString() : defaultMsg,
  });
};

/**
 * Applies Basic authentication to a route.
 * @param {Request} req The Express request object.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The Express next function.
 */
const basicAuthenticate = async (req, res, next) => {
  const user = await getUserFromAuthorization(req);

  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  req.user = user;
  next();
};

/**
 * Applies X-Token authentication to a route.
 * @param {Request} req The Express request object.
 * @param {Response} res The Express response object.
 * @param {NextFunction} next The Express next function.
 */
const xTokenAuthenticate = async (req, res, next) => {
  const user = await getUserFromXToken(req);

  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  req.user = user;
  next();
};

/**
 * Injects routes with their handlers into the given Express application.
 * @param {Express} api - The Express application instance.
 */
const injectRoutes = (api) => {
  // App status routes
  api.get('/status', AppController.getStatus); // Retrieves the status of the application
  api.get('/stats', AppController.getStats); // Retrieves statistical information about the application

  // Authentication routes
  api.get('/connect', basicAuthenticate, AuthController.getConnect); // Authenticates user with basic auth
  api.get('/disconnect', xTokenAuthenticate, AuthController.getDisconnect); // Disconnects an authenticated user

  // User routes
  api.post('/users', UsersController.postNew); // Creates a new user
  api.get('/users/me', xTokenAuthenticate, UsersController.getMe); // Retrieves information about the authenticated user

  // File routes
  api.post('/files', xTokenAuthenticate, FilesController.postUpload); // Uploads a new file
  api.get('/files/:id', xTokenAuthenticate, FilesController.getShow); // Retrieves a file by ID
  api.get('/files', xTokenAuthenticate, FilesController.getIndex); // Retrieves a list of files
  api.put('/files/:id/publish', xTokenAuthenticate, FilesController.putPublish); // Publishes a file by ID
  api.put('/files/:id/unpublish', xTokenAuthenticate, FilesController.putUnpublish); // Unpublishes a file by ID
  api.get('/files/:id/data', FilesController.getFile); // Retrieves the data of a file by ID

  // Fallback for undefined routes
  api.all('*', (req, res, next) => {
    errorResponse(new APIError(404, `Cannot ${req.method} ${req.url}`), req, res, next);
  });

  // Error handling middleware
  api.use(errorResponse);
};

export default injectRoutes;
