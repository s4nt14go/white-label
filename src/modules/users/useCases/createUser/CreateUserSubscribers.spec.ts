import { CreateUserUseCase } from './CreateUserUseCase';
import { UserRepoFake } from '../../repos/implementations/fake';
import { DispatcherFake } from '../../../../core/infra/DispatcherFake';
import { UniqueEntityID } from '../../../../core/domain/UniqueEntityID';

test('Domain event dispatcher calls notifySlackChannel & someWork with user data for UserCreatedEvent', async () => {
    const dispatcherFake = new DispatcherFake();
    const spy = jest.spyOn(dispatcherFake, 'dispatch');
    const createUserUseCase = new CreateUserUseCase(new UserRepoFake(), dispatcherFake);

    const dto = {
        username: 'test_username',
        email: 'test@email.com',
        password: 'passwordd',
    }

    await createUserUseCase.execute(dto);

    const dispatcherIntake = expect.objectContaining({
        user: expect.objectContaining({
            _id: expect.any(UniqueEntityID),
            props: expect.objectContaining({
                email: {props: {value: 'test@email.com'}},
                password: {props: {hashed: false, value: 'passwordd'}},
                username: {props: {name: 'test_username'}},
            }),
        })
    });
    expect(spy).toHaveBeenCalledWith(dispatcherIntake, expect.stringContaining('notifySlackChannel'));
    expect(spy).toHaveBeenCalledWith(dispatcherIntake, expect.stringContaining('someWork'));
    expect(spy).toBeCalledTimes(2);
});