type UserCreatedDTO = {
  email: string;
  username: string;
}

export interface IExternalService {
  sendToExternal (user: UserCreatedDTO): Promise<any>
}

export class ExternalService implements IExternalService {

  async sendToExternal (user: UserCreatedDTO): Promise<any> {
    console.log('Send to some external service:', user);
  }

}