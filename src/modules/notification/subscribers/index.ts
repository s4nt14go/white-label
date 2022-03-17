
import { AfterUserCreated } from "./AfterUserCreated";
import { notifySlackChannel } from "../useCases/notifySlackChannel";

// Subscribers
new AfterUserCreated(notifySlackChannel);