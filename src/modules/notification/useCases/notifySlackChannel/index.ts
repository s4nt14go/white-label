import { NotifySlackChannel } from "./NotifySlackChannel";
import { slackService } from "../../services";
import { NotifySlackChannelController } from './NotifySlackChannelController';

const useCase = new NotifySlackChannel(slackService);
const controller = new NotifySlackChannelController(
    useCase
)
export const handler = controller.executeImpl.bind(controller);