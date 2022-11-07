import { SomeWork } from './SomeWork';
import { UserCreatedEvent } from '../../domain/events/UserCreatedEvent';
import { externalService } from '../../services';
import { createUser } from '../../../../shared/utils/test';

test('External service is called for some work', async () => {
  const spy = jest
    .spyOn(externalService, 'sendToExternal')
    .mockImplementation(() => new Promise((resolve) => resolve('mocked')));
  const useCase = new SomeWork(externalService);
  const user = createUser({ email: 'test@email.com', username: 'test_user' });
  const event = new UserCreatedEvent(user).toDTO();

  await useCase.execute(event);

  expect(spy).toHaveBeenCalledWith({
    email: 'test@email.com',
    username: 'test_user',
  });
});
