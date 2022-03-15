import { UserEmail } from './userEmail';

test('Creation', () => {
    const result = UserEmail.create('some@email.com');

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().value).toBe('some@email.com');
});

test('Fails with null', () => {
    const result = UserEmail.create(null);

    expect(result.isFailure).toBe(true);
});

