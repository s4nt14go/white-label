type UserCreatedDTO = {
  email: string;
  username: string;
};

export interface IExternalService {
  sendToExternal(user: UserCreatedDTO): void;
}

export class ExternalService implements IExternalService {
  sendToExternal(user: UserCreatedDTO) {
    console.log('Send to some external service:', user);
  }
}
