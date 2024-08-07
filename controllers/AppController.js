/* eslint-disable import/no-named-as-default */
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

/**
 * Controller for application-level routes.
 */
export default class AppController {
  /**
   * Returns the status of the Redis and MongoDB clients.
   * @param {Request} req - The request object.
   * @param {Response} res - The response object.
   */
  static getStatus(req, res) {
    res.status(200).json({
      redis: redisClient.isAlive(), // Check if Redis client is connected
      db: dbClient.isAlive(), // Check if MongoDB client is connected
    });
  }

  /**
   * Returns the number of users and files in the database.
   * @param {Request} req - The request object.
   * @param {Response} res - The response object.
   */
  static getStats(req, res) {
    Promise.all([dbClient.nbUsers(), dbClient.nbFiles()])
      .then(([usersCount, filesCount]) => {
        res.status(200).json({
          users: usersCount, // Number of users in the database
          files: filesCount, // Number of files in the database
        });
      })
      .catch((error) => {
        res.status(500).json({ error: 'An error occurred while retrieving stats.' }); // Handle any errors
      });
  }
};
