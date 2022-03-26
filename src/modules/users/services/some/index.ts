import { User } from '../../domain/user';

export interface IExternalService {
  sendToExternal (user: User): Promise<any>
}

export class ExternalService implements IExternalService {

  async sendToExternal (user: User): Promise<any> {
    console.log('Send to some external service:', user);
  }

}