# Serverless Domain-Driven Design (DDD) with unit tests
I took some files from Khalil Stemmler's [white-label](https://github.com/stemmlerjs/white-label) project and made some changes

His project has a nice way to dispatch domain events (`UserCreatedEvent`) after the aggregates changes are persisted and pick them up from the same module (`users/subscribers/AfterUserCreated.ts`) or a different one (`notification/subscribers/AfterUserCreated.ts`).

In the original project, dispatching the event (`DomainEvents.dispatchEventsForAggregate(<user id>)`) is done through Sequelize hooks (`afterCreate`, `afterDestroy`, `afterUpdate`, `afterSave`, `afterUpsert`) while I moved this to the repository, in the case Sequelize isn't being used.

I've made some changes to use Lambdas with Serverless Framework. Including `serverless-webpack` plugin to get small lambdas:
  | Lambda                  | Size \[kB]    |
  | ----------------------- | -------------:|
  | createUser              |           100 |
  | distributeDomainEvents  |           85  |
  | notifySlackChannel      |            2  |
  | someWork                |            2  |

Unit tests added:
* Value Objects: `User`, `UserEmail`, `User Password`
* Use cases: `CreateUser` (with faked repo), `NotifySlackChannel`
* Domain event registration and dispatching `CreateUserEvents.spec.ts`

## Instructions
```
npm i
npm test 
```
