import { UserEmail } from './userEmail';
import { CreateEmailErrors } from './userEmailErrors';

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

test('Fails with type different from string', () => {
    const result = UserEmail.create(1 as any);

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(CreateEmailErrors.EmailNotString);
});

test('Fails with invalid email', () => {
    const result = UserEmail.create('john@gmail.b');

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(CreateEmailErrors.EmailNotValid);
});
