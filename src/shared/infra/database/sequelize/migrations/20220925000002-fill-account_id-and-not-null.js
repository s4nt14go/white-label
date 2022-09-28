'use strict';
/* eslint-disable @typescript-eslint/no-var-requires,no-undef */
const { Account } = require('../models/index.ts');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const accounts = await Account.findAll();
      for (const account of accounts) {
        await queryInterface.sequelize.query(
          `UPDATE transactions SET account_id = '${account.id}' where user_id = '${account.userId}';`,
          { transaction }
        );
      }

      const account_id_attributes = {
        type: Sequelize.DataTypes.UUID,
        references: {
          model: {
            tableName: 'accounts',
          },
          key: 'id',
        },
        allowNull: false,
      };

      await queryInterface.changeColumn(
        'transactions',
        'account_id',
        account_id_attributes,
        { transaction }
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const account_id_attributes = {
        type: Sequelize.DataTypes.UUID,
        references: {
          model: {
            tableName: 'accounts',
          },
          key: 'id',
        },
        allowNull: true,
      };

      await queryInterface.changeColumn(
        'transactions',
        'account_id',
        account_id_attributes,
        { transaction }
      );

      const accounts = await Account.findAll();
      for (const account of accounts) {
        await queryInterface.sequelize.query(
          `UPDATE transactions SET user_id = '${account.userId}' where account_id = '${account.id}';`,
          { transaction }
        );
      }

      const user_id_attributes = {
        type: Sequelize.DataTypes.UUID,
        references: {
          model: {
            tableName: 'users',
          },
          key: 'id',
        },
        allowNull: false,
      };

      await queryInterface.changeColumn(
        'transactions',
        'user_id',
        user_id_attributes,
        { transaction }
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
