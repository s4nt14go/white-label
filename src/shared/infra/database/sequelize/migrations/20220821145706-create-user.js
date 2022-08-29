'use strict';
/* eslint-disable @typescript-eslint/no-var-requires,no-undef */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      email: {
        type: Sequelize.STRING(250),
        allowNull: false,
        unique: true,
      },
      username: {
        type: Sequelize.STRING(250),
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      alias: {
        type: Sequelize.STRING(250),
      },
      is_email_verified: {
        type: Sequelize.BOOLEAN,
      },
      is_admin_user: {
        type: Sequelize.BOOLEAN,
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
