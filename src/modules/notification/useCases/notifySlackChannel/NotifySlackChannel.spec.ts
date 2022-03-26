import { SlackService } from "../../services/slack";
import { NotifySlackChannel } from './NotifySlackChannel';
import { UserCreatedEvent } from '../../../users/domain/events/UserCreatedEvent';
import { User } from '../../../users/domain/user';
import { createUser } from '../../../users/utils/testUtils';

test('Slack service is called when notifying on a channel', async () => {
    const slackService = new SlackService();
    const spy = jest.spyOn(slackService, 'sendMessage').mockImplementation(() => new Promise(resolve => resolve('mocked')));
    const notifySlackChannelUseCase = new NotifySlackChannel(slackService);
    const userOrError = createUser({email: 'test@email.com', username: 'test_user'}).getValue();
    const event = new UserCreatedEvent(userOrError as User, new Date());

    await notifySlackChannelUseCase.execute(event);

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('test@email.com') &&
        expect.stringContaining('test_user'), 'growth');
})