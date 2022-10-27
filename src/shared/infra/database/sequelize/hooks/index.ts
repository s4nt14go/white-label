// eslint-disable-next-line @typescript-eslint/no-var-requires
const models = require('../models/index.ts');
import { EntityID } from '../../../../domain/EntityID';
import { DomainEvents } from '../../../../domain/events/DomainEvents';

const dispatchEventsCallback = async (
  model: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  options: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  primaryKeyField: string,
  hook: string
) => {
  let id = model[primaryKeyField];
  console.log(`Hooking ${hook} for ${model.constructor.name} ${id}`);
  if (model.constructor.name === 'transaction') {
    console.log(
      'Transaction is an internal entity to Account aggregate, so use account id to check for events'
    );
    id = model['accountId'];
  }
  await DomainEvents.dispatchEventsForAggregate(new EntityID(id));
};

export default function () {
  const { User, Account, Transaction } = models;

  const hooks = [
    'afterCreate',
    'afterDestroy',
    'afterUpdate',
    'afterSave',
    'afterUpsert',
  ];
  hooks.map((h) => {
    User.addHook(h, (m: unknown, options: unknown) =>
      dispatchEventsCallback(m, options, 'id', h)
    );
    Account.addHook(h, (m: unknown, options: unknown) =>
      dispatchEventsCallback(m, options, 'id', h)
    );
    Transaction.addHook(h, (m: unknown, options: unknown) =>
      dispatchEventsCallback(m, options, 'id', h)
    );
  });

  console.log('[Hooks]: Sequelize hooks setup.');
}
