const tableHasColumn = async (sequelize, tableName, columnName) => {
  const [rows] = await sequelize.query(
    `
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = :tableName
      AND COLUMN_NAME = :columnName
    LIMIT 1
    `,
    { replacements: { tableName, columnName } }
  );
  return Array.isArray(rows) && rows.length > 0;
};

const addColumnIfMissing = async (sequelize, tableName, columnName, definition) => {
  const exists = await tableHasColumn(sequelize, tableName, columnName);
  if (exists) return false;

  await sequelize.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`);
  return true;
};

const applyLegacySchemaFixes = async (sequelize) => {
  const changes = [];

  if (await addColumnIfMissing(sequelize, 'bookings', 'teamId', 'INT NULL')) {
    changes.push('bookings.teamId');
  }
  if (await addColumnIfMissing(sequelize, 'bookings', 'opponentTeamId', 'INT NULL')) {
    changes.push('bookings.opponentTeamId');
  }
  if (await addColumnIfMissing(sequelize, 'bookings', 'specialRequests', 'TEXT NULL')) {
    changes.push('bookings.specialRequests');
  }
  if (await addColumnIfMissing(sequelize, 'bookings', 'isMatchmaking', 'TINYINT(1) NOT NULL DEFAULT 0')) {
    changes.push('bookings.isMatchmaking');
  }

  if (await addColumnIfMissing(sequelize, 'notifications', 'readAt', 'DATETIME NULL')) {
    changes.push('notifications.readAt');
  }
  if (await addColumnIfMissing(sequelize, 'notifications', 'metadata', 'JSON NULL')) {
    changes.push('notifications.metadata');
  }

  if (await addColumnIfMissing(sequelize, 'users', 'avatarUrl', 'VARCHAR(255) NULL')) {
    changes.push('users.avatarUrl');
  }
  if (await addColumnIfMissing(sequelize, 'users', 'dateOfBirth', 'DATE NULL')) {
    changes.push('users.dateOfBirth');
  }
  if (await addColumnIfMissing(sequelize, 'users', 'gender', "ENUM('male','female','other') NULL")) {
    changes.push('users.gender');
  }
  if (await addColumnIfMissing(sequelize, 'users', 'address', 'TEXT NULL')) {
    changes.push('users.address');
  }
  if (await addColumnIfMissing(sequelize, 'users', 'lastLogin', 'DATETIME NULL')) {
    changes.push('users.lastLogin');
  }

  if (changes.length > 0) {
    console.log(`Applied legacy schema fixes: ${changes.join(', ')}`);
  }
};

module.exports = {
  applyLegacySchemaFixes
};
