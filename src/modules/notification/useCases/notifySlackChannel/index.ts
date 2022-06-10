import { NotifySlackChannel } from './NotifySlackChannel';
import { slackService } from '../../services';

const useCase = new NotifySlackChannel(slackService);
export const handler = useCase.execute.bind(useCase);
