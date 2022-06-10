import { AggregateRoot } from '../../../core/domain/AggregateRoot';
import { UniqueEntityID } from '../../../core/domain/UniqueEntityID';
import { UserId } from './userId';
import { UserEmail } from './userEmail';
import { UserCreatedEvent } from './events/UserCreatedEvent';
import { UserPassword } from './userPassword';
import { UserName } from './userName';

interface UserProps {
  email: UserEmail;
  username: UserName;
  password: UserPassword;
  isEmailVerified?: boolean;
  isAdminUser?: boolean;
  isDeleted?: boolean;
  lastLogin?: Date;
}

export class User extends AggregateRoot<UserProps> {
  get id(): UniqueEntityID {
    return this._id;
  }

  get userId(): UserId {
    return UserId.caller(this.id);
  }

  get email(): UserEmail {
    return this.props.email;
  }

  get password(): UserPassword {
    return this.props.password;
  }

  get isEmailVerified(): boolean | undefined {
    return this.props.isEmailVerified;
  }

  get username(): UserName {
    return this.props.username;
  }

  get isDeleted(): boolean | undefined {
    return this.props.isDeleted;
  }

  get isAdminUser(): boolean | undefined {
    return this.props.isAdminUser;
  }

  private constructor(props: UserProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(props: UserProps, id?: UniqueEntityID): User {
    const user = new User(
      {
        ...props,
        isDeleted: props.isDeleted ? props.isDeleted : false,
        isEmailVerified: props.isEmailVerified ? props.isEmailVerified : false,
        isAdminUser: props.isAdminUser ? props.isAdminUser : false,
      },
      id
    );

    const idWasProvided = !!id;

    if (!idWasProvided) {
      user.addDomainEvent(new UserCreatedEvent(user));
    }

    return user;
  }

  public delete(): void {
    if (!this.props.isDeleted) {
      // this.addDomainEvent(new UserDeleted(this)); TBI
      this.props.isDeleted = true;
    }
  }
}
