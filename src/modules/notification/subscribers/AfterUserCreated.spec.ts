import '../subscribers';
import { createUser } from '../../users/testUtils';
import { DomainEvents } from '../../../core/domain/events/DomainEvents';
import { NotifySlackChannel } from '../useCases/notifySlackChannel/NotifySlackChannel';
import { User } from '../../users/domain/user';

test('When user is created, slack notification is triggered with user data', () => {
    const spy = jest.spyOn(NotifySlackChannel.prototype, 'execute').mockImplementation(() => new Promise(resolve => resolve()));

    const user = createUser({}).getValue() as User;
    DomainEvents.dispatchEventsForAggregate(user.id);

    expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
            channel: 'growth',
            message: expect.stringContaining(user.username.value) &&
                expect.stringContaining(user.email.value)
        }));
})