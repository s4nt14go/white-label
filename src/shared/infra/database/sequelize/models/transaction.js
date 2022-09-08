'use strict';
/* eslint-disable @typescript-eslint/no-var-requires,no-undef */
const { DataTypes } = require('sequelize');

module.exports = (connection) => {
  return connection.define(
    'transaction',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      balance: {
        type: DataTypes.DECIMAL,
        allowNull: false,
      },
      delta: {
        type: DataTypes.DECIMAL,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      underscored: true,
    }
  );
};
