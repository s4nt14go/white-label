# Unit tests for Domain-Driven-Design (DDD)
I took some files from Khalil Stemmler's [white-label](https://github.com/stemmlerjs/white-label) project and made some changes

The project has a nice way to dispatch domain events (`UserCreatedEvent`) after the use case (`CreateUserUseCase`) is executed successfully and pick them up from the same module (`users/subscribers/AfterUserCreated.ts`) and a different one (`notification/subscribers/AfterUserCreated.ts`).

In the original project, dispatching the event (`DomainEvents.dispatchEventsForAggregate(<user id>)`) is done through Sequelize hooks (`afterCreate`, `afterDestroy`, `afterUpdate`, `afterSave`, `afterUpsert`) while I move this to the end of `CreateUserUseCase` to allow choosing a different repository (this dispatching should be repeated in all the cases in which a `User` is changed).

Unit tests added:
* Value Objects: `User`, `UserEmail`, `User Password`
* Domain events subscribers `AfterUserCreated` in modules `user` and `notification`
* Use cases: `CreateUserUseCase` (with faked repo), `NotifySlackChannel`