import { CreateUserController } from './CreateUserController';
import { UserRepoFake } from '../../repos/implementations/fake';
import { DispatcherFake } from '../../../../core/infra/DispatcherFake';

let userRepoFake, createUserController: CreateUserController, dispatcherFake, spyOnDispatch: any;
beforeEach(() => {
    userRepoFake = new UserRepoFake();
    dispatcherFake = new DispatcherFake();
    spyOnDispatch = jest.spyOn(dispatcherFake, 'dispatch');
    createUserController = new CreateUserController(new UserRepoFake(), dispatcherFake);
})

test('Domain event dispatcher calls distributeDomainEvents with user data for UserCreatedEvent', async () => {

    const dto = {
        username: 'test_username',
        email: 'test@email.com',
        password: 'passwordd',
    }

    await createUserController.executeImpl(dto);

    const dispatcherIntake = expect.objectContaining({
        aggregateId: expect.any(String),
        dateTimeOccurred: expect.any(Date),
        user: {
            username: 'test_username',
            email: 'test@email.com',
        }
    })
    expect(spyOnDispatch).toHaveBeenCalledWith(dispatcherIntake, expect.stringContaining('distributeDomainEvents'));
    expect(spyOnDispatch).toBeCalledTimes(1);
});

test(`distributeDomainEvents isn't called when saving to DB fails`, async () => {

    const dto = {
        username: 'FAIL WHEN SAVE',
        email: 'test@email.com',
        password: 'passwordd',
    }

    await createUserController.executeImpl(dto);

    expect(spyOnDispatch).toBeCalledTimes(0);
});