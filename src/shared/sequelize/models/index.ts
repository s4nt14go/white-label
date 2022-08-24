// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import config from '../config/config';
import * as Sequelize from 'sequelize';

const sequelize = config.connection;

export default {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  User: require('./user.js')(sequelize),
  sequelize,
  Sequelize,
};
