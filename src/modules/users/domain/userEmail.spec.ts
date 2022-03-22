import { UserEmail } from './userEmail';

test('Creation', () => {
    const result = UserEmail.create('some@email.com');

    expect(result.isSuccess).toBe(true);
    const userEmail = result.getValue() as UserEmail;
    expect(userEmail.value).toBe('some@email.com');
});

test('Fails with null', () => {
    const result = UserEmail.create(null as any);

    expect(result.isFailure).toBe(true);
});

