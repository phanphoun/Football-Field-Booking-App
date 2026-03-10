// User Model
// Roles: 'admin', 'player', 'field_owner'

const userModel = {
  // Find user by email
  findByEmail: async (email) => {
    try {
      const dbPool = global.dbPool();
      const [rows] = await dbPool.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Database error in findByEmail:', error);
      throw error;
    }
  },

  // Find user by id
  findById: async (id) => {
    try {
      const dbPool = global.dbPool();
      const [rows] = await dbPool.execute(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Database error in findById:', error);
      throw error;
    }
  },

  // Create new user
  create: async (userData) => {
    try {
      const dbPool = global.dbPool();
      const { name, email, password, role } = userData;
      
      const [result] = await dbPool.execute(
        'INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
        [name, email, password, role, 'active']
      );
      
      return {
        id: result.insertId,
        ...userData
      };
    } catch (error) {
      console.error('Database error in create:', error);
      throw error;
    }
  },

  // Get all users
  getAll: async () => {
    try {
      const dbPool = global.dbPool();
      const [rows] = await dbPool.execute('SELECT * FROM users');
      return rows;
    } catch (error) {
      console.error('Database error in getAll:', error);
      throw error;
    }
  }
};

module.exports = userModel;

