import { SlackService } from '../../services/slack';
import { NotifySlackChannel } from './NotifySlackChannel';
import {
  UserCreatedEvent,
} from '../../../users/domain/events/UserCreatedEvent';
import { createUser } from '../../../../shared/utils/test';

test('Slack service is called when notifying on a channel', async () => {
  const slackService = new SlackService();
  const spyOnSendMsg = jest
    .spyOn(slackService, 'sendMessage')
    .mockImplementation(() => new Promise((resolve) => resolve('mocked')));
  const notifySlackChannelUseCase = new NotifySlackChannel(slackService);
  const userOrError = createUser({
    email: 'test@email.com',
    username: 'test_user',
  });
  const event = new UserCreatedEvent(userOrError).toDTO();

  await notifySlackChannelUseCase.execute(event);

  expect(spyOnSendMsg).toHaveBeenCalledWith(
    expect.stringContaining('test@email.com') &&
      expect.stringContaining('test_user'),
    'growth'
  );
});
