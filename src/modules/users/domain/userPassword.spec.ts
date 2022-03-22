import { UserPassword } from './userPassword';

test('Create with plain text', async () => {
    const passwordOrError = UserPassword.create({ value: 'super_secret'});

    expect(passwordOrError.isSuccess).toBe(true);
    const password = passwordOrError.getValue() as UserPassword;
    expect(password.value).toBe('super_secret');

    expect(UserPassword.isAppropriateLength('super_secret')).toBe(true);
    const passwordValid = await password.comparePassword('super_secret');
    expect(passwordValid).toBe(true);
    expect(password.isAlreadyHashed()).toBe(false);
})

test('Create with hashed text', async () => {
    const passwordOrError = UserPassword.create({ value: '$2a$10$QMdHMmcWVZGrYxIPyHeMfOynZyb9Go8yjvdJLNU8AQ5M0YhLRJLIO', hashed: true});
    // Hash for password 'super_secret' with salt bcrypt.hashSync("bacon"): $2a$10$QMdHMmcWVZGrYxIPyHeMfOynZyb9Go8yjvdJLNU8AQ5M0YhLRJLIO

    expect(passwordOrError.isSuccess).toBe(true);
    const password = passwordOrError.getValue() as UserPassword;
    const passwordValid = await password.comparePassword('super_secret');
    expect(passwordValid).toBe(true);
    expect(password.isAlreadyHashed()).toBe(true);
    const hash = await password.getHashedValue();
    expect(hash).toBe('$2a$10$QMdHMmcWVZGrYxIPyHeMfOynZyb9Go8yjvdJLNU8AQ5M0YhLRJLIO');

})