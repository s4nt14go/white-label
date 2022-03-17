import { SlackService } from "../../services/slack";
import { NotifySlackChannel } from './NotifySlackChannel';
import { SlackChannel } from "../../domain/slackChannel";

test('Slack service is called when notify slack channel is executed', async () => {
    const slackService = new SlackService();
    const spy = jest.spyOn(slackService, 'sendMessage').mockImplementation(() => new Promise(resolve => resolve('mocked')));
    const notifySlackChannelUseCase = new NotifySlackChannel(slackService);

    const req = {
        message: 'Welcome new user',
        channel: 'growth' as SlackChannel
    }
    await notifySlackChannelUseCase.execute(req);

    expect(spy).toHaveBeenCalledWith('Welcome new user', 'growth');
})