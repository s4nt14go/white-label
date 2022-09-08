'use strict';
/* eslint-disable @typescript-eslint/no-var-requires,no-undef */
const { DataTypes } = require('sequelize');

module.exports = (connection) => {
  return connection.define(
    'account',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      underscored: true,
    }
  );
};
