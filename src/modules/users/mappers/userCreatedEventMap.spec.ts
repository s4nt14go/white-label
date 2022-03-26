import { UserCreatedEventMap } from './userCreatedEventMap';
import { UserCreatedEventDTO } from '../domain/events/UserCreatedEventDTO';

test('Recreate UserCreatedEvent from dto', () => {

  const dto: UserCreatedEventDTO = require('./userCreatedEvent.fixture.json');
  const { dateTimeOccurred: dateDto } = dto;

  const { user: userRecreated, dateTimeOccurred: dateRecreated } = UserCreatedEventMap.toDomain(dto);

  expect(dateRecreated).toStrictEqual(new Date(dateDto));
  expect(userRecreated.id).toEqual(dto.user._id);
});