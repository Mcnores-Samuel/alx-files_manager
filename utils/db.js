import { promisify } from 'util';
import { createClient } from 'redis';
import mongodb from 'mongodb';
import { existsSync, readFileSync } from 'fs';

/**
 * Loads the appropriate environment variables based on the current lifecycle event.
 */
const envLoader = () => {
  const env = process.env.npm_lifecycle_event || 'dev';
  const path = env.includes('test') || env.includes('cover') ? '.env.test' : '.env';

  if (existsSync(path)) {
    const data = readFileSync(path, 'utf-8').trim().split('\n');

    for (const line of data) {
      const delimPosition = line.indexOf('=');
      const variable = line.substring(0, delimPosition);
      const value = line.substring(delimPosition + 1);
      process.env[variable] = value;
    }
  }
};

/**
 * Class representing a Redis client.
 */
class RedisClient {
  /**
   * Creates an instance of RedisClient and sets up event listeners.
   */
  constructor() {
    this.client = createClient();
    this.isClientConnected = true;

    // Handle connection errors
    this.client.on('error', (err) => {
      console.error('Redis client failed to connect:', err.message || err.toString());
      this.isClientConnected = false;
    });

    // Handle successful connection
    this.client.on('connect', () => {
      this.isClientConnected = true;
    });
  }

  /**
   * Checks if the Redis client is connected.
   * @returns {boolean} - True if the client is connected, otherwise false.
   */
  isAlive() {
    return this.isClientConnected;
  }

  /**
   * Retrieves the value associated with the given key.
   * @param {string} key - The key of the item to retrieve.
   * @returns {Promise<string | null>} - The value of the key, or null if the key does not exist.
   */
  async get(key) {
    return promisify(this.client.GET).bind(this.client)(key);
  }

  /**
   * Stores a key-value pair in Redis with an expiration time.
   * @param {string} key - The key of the item to store.
   * @param {string | number | boolean} value - The value of the item to store.
   * @param {number} duration - The expiration time in seconds.
   * @returns {Promise<void>}
   */
  async set(key, value, duration) {
    await promisify(this.client.SETEX).bind(this.client)(key, duration, value);
  }

  /**
   * Deletes the value associated with the given key.
   * @param {string} key - The key of the item to delete.
   * @returns {Promise<void>}
   */
  async del(key) {
    await promisify(this.client.DEL).bind(this.client)(key);
  }
}

/**
 * Class representing a MongoDB client.
 */
class DBClient {
  /**
   * Creates an instance of DBClient and initializes the connection to the MongoDB server.
   */
  constructor() {
    envLoader();

    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const dbURL = `mongodb://${host}:${port}/${database}`;

    this.client = new mongodb.MongoClient(dbURL, { useUnifiedTopology: true });
    this.client.connect();
  }

  /**
   * Checks if the MongoDB client is connected.
   * @returns {boolean} - True if the client is connected, otherwise false.
   */
  isAlive() {
    return this.client.isConnected();
  }

  /**
   * Retrieves the number of users in the 'users' collection.
   * @returns {Promise<number>} - The number of users.
   */
  async nbUsers() {
    return this.client.db().collection('users').countDocuments();
  }

  /**
   * Retrieves the number of files in the 'files' collection.
   * @returns {Promise<number>} - The number of files.
   */
  async nbFiles() {
    return this.client.db().collection('files').countDocuments();
  }

  /**
   * Retrieves a reference to the 'users' collection.
   * @returns {Promise<Collection>} - The 'users' collection.
   */
  async usersCollection() {
    return this.client.db().collection('users');
  }

  /**
   * Retrieves a reference to the 'files' collection.
   * @returns {Promise<Collection>} - The 'files' collection.
   */
  async filesCollection() {
    return this.client.db().collection('files');
  }
}

export const redisClient = new RedisClient();
export const dbClient = new DBClient();
export default { redisClient, dbClient };
