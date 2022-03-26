# Serverless Domain-Driven-Design (DDD) with unit tests
I took some files from Khalil Stemmler's [white-label](https://github.com/stemmlerjs/white-label) project and made some changes

His project has a nice way to dispatch domain events (`UserCreatedEvent`) after the aggregates changes are persisted and pick them up from the same module (`users/subscribers/AfterUserCreated.ts`) or a different one (`notification/subscribers/AfterUserCreated.ts`).

In the original project, dispatching the event (`DomainEvents.dispatchEventsForAggregate(<user id>)`) is done through Sequelize hooks (`afterCreate`, `afterDestroy`, `afterUpdate`, `afterSave`, `afterUpsert`) while I moved this to the repository, in the case Sequelize isn't being used.

I've refactored the code to use Lambdas with Serverless Framework

Unit tests added:
* Value Objects: `User`, `UserEmail`, `User Password`
* Domain event subscriber `src/modules/notification/subscribers/AfterUserCreated.ts`
* Use cases: `CreateUserUseCase` (with faked repo), `NotifySlackChannel`
* Mappers for UserCreatedEventMap.toDomain

## Instructions
```
npm i
npm test 
```
