/* eslint-disable @typescript-eslint/no-var-requires,@typescript-eslint/ban-ts-comment,no-undef */ // @ts-ignore
const config = require('../config/config');
const Sequelize = require('sequelize');

const sequelize = config.connection;
const getTransaction = () => {
  return sequelize.transaction({
    isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
  });
};

const User = require('./user.js')(sequelize);
const Account = require('./account.js')(sequelize);
const Transaction = require('./transaction.js')(sequelize);

User.hasOne(Account);
Account.belongsTo(User);
Account.hasMany(Transaction);
Transaction.belongsTo(Account);

module.exports = {
  User,
  Transaction,
  Account,
  sequelize,
  Sequelize,
  getTransaction,
  renewConn: config.renewConn,
};
