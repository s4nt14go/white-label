'use strict';
/* eslint-disable @typescript-eslint/no-var-requires,no-undef */

module.exports = {
  async up(queryInterface, Sequelize) {
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
        allowNull: true, // set to false in next migration
      };

      await queryInterface.addColumn(
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
  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('transactions', 'account_id', {
        transaction,
      });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
