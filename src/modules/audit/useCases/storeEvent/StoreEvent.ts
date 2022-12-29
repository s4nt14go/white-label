import { SubscriberController } from '../../../../shared/core/SubscriberController';
import { Request, Response } from './StoreEventDTOs';
import { ControllerResult } from '../../../../shared/core/ControllerResult';
import { DomainEventTypes } from '../../../../shared/domain/events/DomainEventTypes';
import { StoreService } from '../../services/StoreService';
import { IStorage } from '../../services/IStorage';
import { UserCreatedEventDTO } from '../../../users/domain/events/UserCreatedEvent';
import { TransactionCreatedEventDTO } from '../../../accounts/domain/events/TransactionCreatedEvent';

export class StoreEvent extends SubscriberController<Request, Response> {
  private storeService: StoreService;

  public constructor(storage: IStorage) {
    super();
    this.storeService = new StoreService(storage);
  }

  protected async executeImpl(event: Request): ControllerResult<Response> {

    switch (event.type) {
      case DomainEventTypes.UserCreatedEvent:
        await this.storeService.saveUserCreated(event as UserCreatedEventDTO);
        break;
      case DomainEventTypes.TransactionCreatedEvent:
        await this.storeService.saveTransactionCreated(event as TransactionCreatedEventDTO);
        break;
      default:
        console.log('event', event);
        throw Error(`Unknown event ${event.type}`);
    }

    return { status: 200 };
  }
}
