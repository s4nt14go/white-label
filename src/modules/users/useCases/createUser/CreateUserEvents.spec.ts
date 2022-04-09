import { CreateUser } from './CreateUser';
import { UserRepoFake } from '../../repos/implementations/fake';
import { DispatcherFake } from '../../../../core/infra/DispatcherFake';

let userRepoFake, createUser: CreateUser, dispatcherFake, spy: any;
beforeEach(() => {
    userRepoFake = new UserRepoFake();
    dispatcherFake = new DispatcherFake();
    spy = jest.spyOn(dispatcherFake, 'dispatch');
    createUser = new CreateUser(new UserRepoFake(), dispatcherFake);
})

test('Domain event dispatcher calls distributeDomainEvents with user data for UserCreatedEvent', async () => {

    const dto = {
        username: 'test_username',
        email: 'test@email.com',
        password: 'passwordd',
    }

    await createUser.execute(dto);

    const dispatcherIntake = expect.objectContaining({
        aggregateId: expect.any(String),
        dateTimeOccurred: expect.any(Date),
        user: {
            username: 'test_username',
            email: 'test@email.com',
        }
    })
    expect(spy).toHaveBeenCalledWith(dispatcherIntake, expect.stringContaining('distributeDomainEvents'));
    expect(spy).toBeCalledTimes(1);
});

test(`distributeDomainEvents isn't called when saving to DB fails`, async () => {

    const dto = {
        username: 'FAIL WHEN SAVE',
        email: 'test@email.com',
        password: 'passwordd',
    }

    await createUser.execute(dto);

    expect(spy).toBeCalledTimes(0);
});