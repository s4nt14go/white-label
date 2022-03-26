import { UserCreatedEventMap } from './userCreatedEventMap';
import { UserCreatedEventDTO } from '../domain/events/UserCreatedEventDTO';

test('Recreate User from event data', () => {
  const dto: UserCreatedEventDTO = require('./userCreatedEvent.fixture.json');
  const { user: userDto } = dto;

  const { user: userRecreated } = UserCreatedEventMap.toDomain(dto);

  expect(userRecreated.id).toEqual(userDto._id);
  expect(userRecreated.email.value).toBe(userDto.props.email.props.value);
  expect(userRecreated.username.value).toBe(userDto.props.username.props.name);
  expect(userRecreated.password.value).toBe(userDto.props.password.props.value);
  expect(userRecreated.password.isAlreadyHashed()).toBe(userDto.props.password.props.hashed);
  expect(userRecreated.isDeleted).toBe(userDto.props.isDeleted);
  expect(userRecreated.isEmailVerified).toBe(userDto.props.isEmailVerified);
  expect(userRecreated.isAdminUser).toBe(userDto.props.isAdminUser);
});