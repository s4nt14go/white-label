'use strict';
/* eslint-disable @typescript-eslint/no-var-requires,no-undef */
const { DataTypes } = require('sequelize');

module.exports = (connection) => {
  return connection.define(
    'user',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING(250),
        allowNull: false,
        unique: true,
      },
      username: {
        type: DataTypes.STRING(250),
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      alias: {
        type: DataTypes.STRING(250),
      },
      is_email_verified: {
        type: DataTypes.BOOLEAN,
      },
      is_admin_user: {
        type: DataTypes.BOOLEAN,
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
      },
    },
    {
      timestamps: true,
      underscored: true,
    }
  );
};
