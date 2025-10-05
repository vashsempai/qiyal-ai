const db = require('../utils/database');

const User = {
  /**
   * Creates a new user in the database.
   * @param {object} userData - The user data.
   * @param {string} userData.email - The user's email.
   * @param {string} userData.username - The user's username.
   * @param {string} userData.passwordHash - The hashed password.
   * @param {string} userData.firstName - The user's first name.
   * @param {string} userData.lastName - The user's last name.
   * @param {string} userData.role - The user's role ('freelancer', 'client', 'both').
   * @returns {Promise<object>} The newly created user object.
   */
  async create({ email, username, passwordHash, firstName, lastName, role }) {
    const query = `
      INSERT INTO users (email, username, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, username, first_name, last_name, role, created_at;
    `;
    const params = [email, username, passwordHash, firstName, lastName, role];
    const { rows } = await db.query(query, params);
    return rows[0];
  },

  /**
   * Finds a user by their email.
   * @param {string} email - The email to search for.
   * @returns {Promise<object|undefined>} The user object or undefined if not found.
   */
  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1;';
    const { rows } = await db.query(query, [email]);
    return rows[0];
  },

  /**
   * Finds a user by their username.
   * @param {string} username - The username to search for.
   * @returns {Promise<object|undefined>} The user object or undefined if not found.
   */
  async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1;';
    const { rows } = await db.query(query, [username]);
    return rows[0];
  },

  /**
   * Finds a user by their ID.
   * @param {string} id - The UUID of the user to search for.
   * @returns {Promise<object|undefined>} The user object or undefined if not found.
   */
  async findById(id) {
    const query = 'SELECT id, email, username, first_name, last_name, avatar_url, bio, skills, hourly_rate, total_earned, rating, reviews_count, role, location, timezone, languages, portfolio_urls, social_links, verification_status, subscription_tier, last_seen_at FROM users WHERE id = $1;';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }
};

module.exports = User;