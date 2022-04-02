import { CreateUserUseCase } from './CreateUserUseCase';
import { UserRepoFake } from '../../repos/implementations/fake';
import { DispatcherFake } from '../../../../core/infra/DispatcherFake';

test('Domain event dispatcher calls distributeDomainEvents with user data for UserCreatedEvent', async () => {
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