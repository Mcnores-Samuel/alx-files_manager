import { promisify } from 'util';
import { createClient } from 'redis';

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

export const redisClient = new RedisClient();
export default redisClient;
