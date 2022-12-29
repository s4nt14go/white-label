import { DomainEventBase } from './DomainEventBase';
import { AggregateRoot } from '../AggregateRoot';
import { EntityID } from '../EntityID';
import { IInvoker } from '../../infra/invocation/LambdaInvoker';

export class DomainEvents {
  private static handlersMap: Record<string, string[]> = {};
  private static markedAggregates: AggregateRoot<unknown>[] = [];
  private static invoker: IInvoker;

  public static setInvoker(invoker: IInvoker) {
    DomainEvents.invoker = invoker;
  }

  /**
   * @method markAggregateForDispatch
   * @static
   * @desc Called by aggregate root objects that have created domain
   * events to eventually be dispatched when the infrastructure commits
   * the unit of work.
   */
  public static markAggregateForDispatch(aggregate: AggregateRoot<unknown>): void {
    const aggregateFound = !!this.findMarkedAggregateByID(aggregate.id);

    if (!aggregateFound) {
      this.markedAggregates.push(aggregate);
    }
  }

  private static async dispatchAggregateEvents(
    aggregate: AggregateRoot<unknown>
  ): Promise<void> {
    await Promise.all(
      aggregate.domainEvents.map((event) => {
        return this.dispatch(event);
      })
    );
  }

  private static removeAggregateFromMarkedDispatchList(
    aggregate: AggregateRoot<unknown>
  ): void {
    const index = this.markedAggregates.findIndex((a) => a.equals(aggregate));
    this.markedAggregates.splice(index, 1);
  }

  private static findMarkedAggregateByID(
    id: EntityID
  ): AggregateRoot<unknown> | null {
    let found: AggregateRoot<unknown> | null = null;
    for (const aggregate of this.markedAggregates) {
      if (aggregate.id.equals(id)) {
        found = aggregate;
      }
    }

    return found;
  }

  public static async dispatchEventsForAggregate(id: EntityID): Promise<void> {
    const aggregate = this.findMarkedAggregateByID(id);

    if (aggregate) {
      await this.dispatchAggregateEvents(aggregate);
      aggregate.clearEvents();
      this.removeAggregateFromMarkedDispatchList(aggregate);
    }
  }

  public static register(handler: string, eventClassName: string): void {
    if (!handler) throw Error(`Handler isn't defined for ${eventClassName}`);
    if (!Object.prototype.hasOwnProperty.call(this.handlersMap, eventClassName)) {
      this.handlersMap[eventClassName] = [];
    }
    if (!this.handlersMap[eventClassName].includes(handler)) {
      console.log(`Register handler ${handler} for ${eventClassName}`);
      this.handlersMap[eventClassName].push(handler);
    }
  }

  public static clearHandlers(): void {
    this.handlersMap = {};
  }

  public static clearMarkedAggregates(): void {
    this.markedAggregates = [];
  }

  private static async dispatch(event: DomainEventBase): Promise<void> {
    const eventClassName: string = event.constructor.name;

    if (Object.prototype.hasOwnProperty.call(this.handlersMap, eventClassName)) {
      const handlers: string[] = this.handlersMap[eventClassName];
      for (const handler of handlers) {
        await DomainEvents.invoker.invoke(event, handler);
      }
    }
  }
}
