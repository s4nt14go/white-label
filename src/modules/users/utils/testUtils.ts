import { UniqueEntityID } from '../../../core/domain/UniqueEntityID';
import { User } from '../domain/user';
import { UserName } from '../domain/userName';
import { UserPassword } from '../domain/userPassword';
import { UserEmail } from '../domain/userEmail';

type CreateUserInput = {
    email?: string;
    password?: string;
    username?: string;
    isEmailVerified?: boolean;
    id?: UniqueEntityID;
}

export function createUser({
                               email = 'default@email.com',
                               password = 'default_pass',
                               username = 'default_uname',
                               isEmailVerified = false,
                               id,
                           }: CreateUserInput): User {

    const props = {
        email: UserEmail.create(email).value as UserEmail,
        password: UserPassword.create({ value: password }).value as UserPassword,
        username: UserName.create({ name: username }).value as UserName,
        isEmailVerified,
    };

    return User.create(props, id);
}