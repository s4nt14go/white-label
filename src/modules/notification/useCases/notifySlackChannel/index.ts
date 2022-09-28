import { NotifySlackChannel } from './NotifySlackChannel';
import { slackService } from '../../services/slack';

const useCase = new NotifySlackChannel(slackService);
export const handler = useCase.execute.bind(useCase);
