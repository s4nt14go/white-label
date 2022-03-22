
import { NotifySlackChannel } from "./NotifySlackChannel";
import { slackService } from "../../services";
import './../../../loadSubscribers';

const notifySlackChannel = new NotifySlackChannel(slackService);

export {
  notifySlackChannel
}