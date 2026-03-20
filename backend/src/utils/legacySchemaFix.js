// Support table has column for this module.
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

// Support add column if missing for this module.
const addColumnIfMissing = async (sequelize, tableName, columnName, definition) => {
  const exists = await tableHasColumn(sequelize, tableName, columnName);
  if (exists) return false;

  await sequelize.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`);
  return true;
};

// Normalize team member statuses into a consistent shape.
const normalizeTeamMemberStatuses = async (sequelize) => {
  const [rows] = await sequelize.query(
    `
    SELECT COLUMN_TYPE AS columnType
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'team_members'
      AND COLUMN_NAME = 'status'
    LIMIT 1
    `
  );

  const columnType = rows?.[0]?.columnType || '';
  if (!columnType) return false;

  const usesLegacyStatuses = columnType.includes("'accepted'") || columnType.includes("'declined'");
  const usesCurrentStatuses = columnType.includes("'active'") && columnType.includes("'inactive'");

  if (!usesLegacyStatuses && usesCurrentStatuses) {
    return false;
  }

  await sequelize.query(`
    UPDATE \`team_members\`
    SET \`status\` = CASE
      WHEN \`status\` = 'accepted' THEN 'pending'
      WHEN \`status\` = 'declined' THEN 'pending'
      ELSE \`status\`
    END
    WHERE \`status\` IN ('accepted', 'declined')
  `);

  await sequelize.query(`
    ALTER TABLE \`team_members\`
    MODIFY COLUMN \`status\` ENUM('pending','active','inactive') NOT NULL DEFAULT 'pending'
  `);

  await sequelize.query(`
    UPDATE \`team_members\`
    SET \`status\` = CASE
      WHEN \`isActive\` = 1 AND \`status\` = 'pending' THEN 'active'
      WHEN \`isActive\` = 0 AND \`status\` = 'pending' THEN 'inactive'
      ELSE \`status\`
    END
  `);

  return true;
};

// Support ensure team member joined at nullable for this module.
const ensureTeamMemberJoinedAtNullable = async (sequelize) => {
  const [rows] = await sequelize.query(
    `
    SELECT IS_NULLABLE AS isNullable
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'team_members'
      AND COLUMN_NAME = 'joinedAt'
    LIMIT 1
    `
  );

  const isNullable = rows?.[0]?.isNullable || '';
  if (!isNullable || isNullable === 'YES') {
    return false;
  }

  await sequelize.query(`
    UPDATE \`team_members\`
    SET \`joinedAt\` = COALESCE(\`joinedAt\`, \`createdAt\`, NOW())
    WHERE \`joinedAt\` IS NULL
  `);

  await sequelize.query(`
    ALTER TABLE \`team_members\`
    MODIFY COLUMN \`joinedAt\` DATETIME NULL DEFAULT NULL
  `);

  return true;
};

// Apply legacy schema fixes to the current data.
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
  if (await addColumnIfMissing(sequelize, 'users', 'status', "ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active'")) {
    changes.push('users.status');
  }

  if (await addColumnIfMissing(sequelize, 'fields', 'discountPercent', 'DECIMAL(5,2) NOT NULL DEFAULT 0')) {
    changes.push('fields.discountPercent');
  }
  if (await addColumnIfMissing(sequelize, 'fields', 'status', "ENUM('available','unavailable','maintenance') NOT NULL DEFAULT 'available'")) {
    changes.push('fields.status');
  }
  if (await addColumnIfMissing(sequelize, 'fields', 'isArchived', 'TINYINT(1) NOT NULL DEFAULT 0')) {
    changes.push('fields.isArchived');
  }

  if (await normalizeTeamMemberStatuses(sequelize)) {
    changes.push('team_members.status');
  }
  if (await ensureTeamMemberJoinedAtNullable(sequelize)) {
    changes.push('team_members.joinedAt');
  }

  if (changes.length > 0) {
    console.log(`Applied legacy schema fixes: ${changes.join(', ')}`);
  }
};

module.exports = {
  applyLegacySchemaFixes
};
