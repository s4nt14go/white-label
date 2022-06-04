import { ValueObject } from "../../../core/domain/ValueObject";
import { Result } from "../../../core/logic/Result";
import { Guard } from "../../../core/logic/Guard";
import * as bcrypt from 'bcrypt-nodejs';
import { CreatePasswordErrors } from './userPasswordErrors';

interface UserPasswordProps {
  value: string;
  hashed: boolean;
}

export class UserPassword extends ValueObject<UserPasswordProps> {
  public static minLength: number = 8;
  
  get value (): string {
    return this.props.value;
  }

  private constructor (props: UserPasswordProps) {
    super(props)
  }

    /**
   * @method comparePassword
   * @desc Compares as plain-text and hashed password.
   */

  public async comparePassword (plainTextPassword: string): Promise<boolean> {
    let hashed: string;
    if (this.isAlreadyHashed()) {
      hashed = this.props.value;
      return this.bcryptCompare(plainTextPassword, hashed);
    } else {
      return this.props.value === plainTextPassword;
    }
  }

  private bcryptCompare (plainText: string, hashed: string): Promise<boolean> {
    return new Promise((resolve, _reject) => {
      bcrypt.compare(plainText, hashed, (err, compareResult) => {
        if (err) return resolve(false);
        return resolve(compareResult);
      })
    })
  }

  public isAlreadyHashed (): boolean {
    return this.props.hashed;
  }
  
  private hashPassword (password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      bcrypt.hash(password, 'secret', null, (err, hash) => {
        if (err) return reject(err);
        resolve(hash)
      })
    })
  }

  public getHashedValue (): Promise<string> {
    return new Promise((resolve) => {
      if (this.isAlreadyHashed()) {
        return resolve(this.props.value);
      } else {
        return resolve(this.hashPassword(this.props.value))
      }
    })
  }

  public static create (props: { value: string; hashed?: boolean; }): Result<UserPassword | null> {
    const guardNulls = Guard.againstNullOrUndefined(props.value, new CreatePasswordErrors.PasswordNotDefined());
    const guardType = Guard.isType(props.value, 'string', new CreatePasswordErrors.PasswordNotString());
    const combined = Guard.combine([guardNulls, guardType]);
    if (combined.isFailure) return Result.fail(combined.error);

    if (!props.hashed) {
      const trimmed = props.value.trim();
      const minLengthResult = Guard.againstAtLeast(this.minLength, trimmed, new CreatePasswordErrors.TooShort(this.minLength));
      if (minLengthResult.isFailure) return Result.fail(minLengthResult.error)
    }

    return Result.ok<UserPassword>(new UserPassword({
      value: props.value,
      hashed: !!props.hashed
    }));
  }
}