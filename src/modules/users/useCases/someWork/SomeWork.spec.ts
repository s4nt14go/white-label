import { expect, test, vi } from 'vitest';
import { SomeWork } from './SomeWork';
import { UserCreatedEvent } from '../../domain/events/UserCreatedEvent';
import { externalService } from '../../services';
import { createUser } from '../../utils/testUtils';

test('External service is called for some work', async () => {
    const spy = vi.spyOn(externalService, 'sendToExternal').mockImplementation(() => new Promise(resolve => resolve('mocked')));
    const useCase = new SomeWork(externalService);
    const user = createUser({email: 'test@email.com', username: 'test_user'});
    const event = new UserCreatedEvent(user, new Date());

    await useCase.execute(event);

    expect(spy).toHaveBeenCalledWith({email: 'test@email.com', username: 'test_user'});
})