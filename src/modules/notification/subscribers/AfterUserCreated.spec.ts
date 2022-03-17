import '../subscribers';
import { createUser } from '../../users/testUtils';
import { DomainEvents } from '../../../core/domain/events/DomainEvents';
import { NotifySlackChannel } from '../useCases/notifySlackChannel/NotifySlackChannel';

test('When user is created, slack notification is triggered with user data', () => {
    const spy = jest.spyOn(NotifySlackChannel.prototype, 'execute').mockImplementation(() => new Promise(resolve => resolve()));

    const user = createUser({});
    DomainEvents.dispatchEventsForAggregate(user.getValue().id);

    expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
            channel: 'growth',
            message: expect.stringContaining(user.getValue().firstName) &&
                expect.stringContaining(user.getValue().lastName) &&
                expect.stringContaining(user.getValue().email.value)
        }));
})