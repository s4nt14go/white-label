/* eslint-disable @typescript-eslint/no-var-requires,@typescript-eslint/ban-ts-comment */ // @ts-ignore
import config from '../config/config';
import * as Sequelize from 'sequelize';

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
User.hasMany(Transaction);
Transaction.belongsTo(User);
Account.belongsTo(User);

export default {
  User,
  Transaction,
  Account,
  sequelize,
  Sequelize,
  getTransaction,
};
