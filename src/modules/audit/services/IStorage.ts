import { DomainEventBaseDTO } from '../../../shared/domain/events/DomainEventBase';

export type UserCreatedEventStored = DomainEventBaseDTO
  & {
      username: string;
      email: string;
    };
export type TransactionCreatedEventStored = DomainEventBaseDTO
  & {
      id: string;
      balance: number;
      delta: number;
      date: string;
      description: string;
    };

export interface IStorage {
  saveEvent(
    eventStored: UserCreatedEventStored | TransactionCreatedEventStored
  ): void;
}
