type UserCreatedDTO = {
  email: string;
  username: string;
};

export interface IExternalService {
  sendToExternal(user: UserCreatedDTO): void;
}

export class ExternalService implements IExternalService {
  public sendToExternal(user: UserCreatedDTO) {
    console.log('ExternalService.sendToExternal finished without errors', {
      user,
    }); // This message is checked in integration tests, keep it in sync with them
  }
}
