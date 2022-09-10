import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { EntityID } from '../../../shared/domain/EntityID';
import { UserEmail } from './UserEmail';
import { UserCreatedEvent } from './events/UserCreatedEvent';
import { UserPassword } from './UserPassword';
import { UserName } from './UserName';
import { Alias } from './Alias';

interface UserProps {
  email: UserEmail;
  username: UserName;
  password: UserPassword;
  alias: Alias;
  isEmailVerified?: boolean;
  isAdminUser?: boolean;
  isDeleted?: boolean;
}

export class User extends AggregateRoot<UserProps> {
  get id(): EntityID {
    return this._id;
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

  get alias(): Alias {
    return this.props.alias;
  }

  get isDeleted(): boolean | undefined {
    return this.props.isDeleted;
  }

  get isAdminUser(): boolean | undefined {
    return this.props.isAdminUser;
  }

  private constructor(props: UserProps, id?: EntityID) {
    super(props, id);
  }

  public static create(props: UserProps, id?: EntityID): User {
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
