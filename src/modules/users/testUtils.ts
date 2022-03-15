import { UserEmail } from './domain/userEmail';
import { UserPassword } from './domain/userPassword';
import { UniqueEntityID } from '../../core/domain/UniqueEntityID';
import { User } from './domain/user';

type CreateUserInput = {
    email?: UserEmail;
    password?: UserPassword;
    firstName?: string;
    lastName?: string;
    username?: string;
    isEmailVerified?: boolean;
    id?: UniqueEntityID;
}

export function createUser({
                               email = UserEmail.create('test@email.com').getValue(),
                               password = UserPassword.create({ value: 'test password' }).getValue(),
                               firstName = 'John',
                               lastName = 'Smith',
                               username,
                               isEmailVerified = false,
                               id,
                           }: CreateUserInput) {

    const props = {
        email,
        password,
        firstName,
        lastName,
        isEmailVerified,
    };
    const usernameObj = { username };

    return User.create({ ...props, ...usernameObj }, id);
}