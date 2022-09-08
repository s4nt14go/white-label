import { Transaction } from 'sequelize/types';

export abstract class BaseController {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected getTransaction?: any;
  protected transaction?: Transaction;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected constructor(getTransaction?: any) {
    this.getTransaction = getTransaction;
  }
}
