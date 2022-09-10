/* eslint-disable @typescript-eslint/no-explicit-any */
import models from '../models';
import { EntityID } from '../../../../domain/EntityID';
import { DomainEvents } from '../../../../domain/events/DomainEvents';

const dispatchEventsCallback = async (
  model: any,
  options: any,
  primaryKeyField: string,
  hook: string
) => {
  const id = model[primaryKeyField];
  const aggregateId = new EntityID(id);
  console.log(`Hooking ${hook} for ${model.constructor.name} ${id}`);
  await DomainEvents.dispatchEventsForAggregate(aggregateId);
};

export default function () {
  const { User } = models;

  const hooks = [
    'afterCreate',
    'afterDestroy',
    'afterUpdate',
    'afterSave',
    'afterUpsert',
  ];
  hooks.map((h) =>
    User.addHook(h, (m: any, options: any) =>
      dispatchEventsCallback(m, options, 'id', h)
    )
  );

  console.log('[Hooks]: Sequelize hooks setup.');
}
