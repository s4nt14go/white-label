# Serverless Domain-Driven Design (DDD) with unit tests
I took some files from Khalil Stemmler's [white-label](https://github.com/stemmlerjs/white-label) project and made some changes

His project has a nice way to dispatch domain events (`UserCreatedEvent`) after the aggregates changes are persisted and pick them up from the same module (`users/subscribers/AfterUserCreated.ts`) or a different one (`notification/subscribers/AfterUserCreated.ts`).

In the original project, dispatching the event (`DomainEvents.dispatchEventsForAggregate(<user id>)`) is done through Sequelize hooks (`afterCreate`, `afterDestroy`, `afterUpdate`, `afterSave`, `afterUpsert`) while I moved this to the repository, in the case Sequelize isn't being used.

Unit tests added:
* Value Objects: `User`, `UserEmail`, `User Password`
* Use cases/controllers: `CreateUserController` (with faked repo), `NotifySlackChannel`, `SomeWork`
* Domain event registration and dispatching `CreateUserEvents.spec.ts`
* Aggregate `User`

I've used [Serverless Stack](https://serverless-stack.com) as it allows debugging lambda code locally while being invoked remotely by resources in AWS.

## Instructions
```
npm i
npm test 
```
