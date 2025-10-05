import { db } from '../utils/database.js';
import bcrypt from 'bcryptjs';

/**
 * The User model for interacting with the 'users' table in the database.
 */
export const User = {
  /**
   * Creates a new user in the database.
   * @param {object} userData - The data for the new user.
   * @returns {Promise<object>} The newly created user object, excluding sensitive data.
   */
  async create(userData) {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      // Add other fields from your schema here
    } = userData;

    // Hash the password before storing it
    const passwordHash = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (
        username, email, password_hash, first_name, last_name
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, first_name, last_name, created_at;
    `;

    const params = [username, email, passwordHash, firstName, lastName];
    const { rows } = await db.query(query, params);
    return rows[0];
  },

  /**
   * Finds a user by their email address.
   * @param {string} email - The email of the user to find.
   * @returns {Promise<object|undefined>} The user object if found, otherwise undefined.
   */
  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1;';
    const { rows } = await db.query(query, [email]);
    return rows[0];
  },

  /**
   * Finds a user by their username.
   * @param {string} username - The username of the user to find.
   * @returns {Promise<object|undefined>} The user object if found, otherwise undefined.
   */
  async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1;';
    const { rows } = await db.query(query, [username]);
    return rows[0];
  },

  /**
   * Finds a user by their unique ID.
   * @param {string} id - The UUID of the user to find.
   * @returns {Promise<object|undefined>} The user object (excluding password) if found, otherwise undefined.
   */
  async findById(id) {
    const query = `
      SELECT id, username, email, email_verified_at, phone, phone_verified_at,
             first_name, last_name, display_name, bio, avatar_url, cover_image_url,
             country, city, timezone, language, currency, title, hourly_rate,
             availability_status, total_earnings, total_withdrawn, current_balance,
             total_projects_completed, total_hours_worked, average_rating, total_reviews,
             level, experience_points, achievement_points, account_status, last_online_at,
             subscription_plan, subscription_expires_at, is_verified, is_featured,
             profile_visibility, show_earnings, show_location, created_at, updated_at
      FROM users
      WHERE id = $1;
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  },

  /**
   * Updates a user's profile information.
   * @param {string} id - The ID of the user to update.
   * @param {object} updates - An object containing the fields to update.
   * @returns {Promise<object>} The updated user object.
   */
  async update(id, updates) {
    const_allowedUpdates = [
        'first_name', 'last_name', 'display_name', 'bio', 'avatar_url', 'cover_image_url', 'country', 'city', 'timezone', 'language', 'currency', 'title', 'hourly_rate', 'availability_status', 'profile_visibility', 'show_earnings', 'show_location'
    ];

    const final_updates = {};
    for (const key in updates) {
        if (allowedUpdates.includes(key)) {
            final_updates[key] = updates[key]
        }
    }

    const setClause = Object.keys(final_updates)
      .map((key, index) => `"${key}" = $${index + 2}`)
      .join(', ');

    if (!setClause) {
      throw new Error('No valid fields to update.');
    }

    const query = `
      UPDATE users
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;

    const params = [id, ...Object.values(final_updates)];
    const { rows } = await db.query(query, params);
    return rows[0];
  },
};

export default User;