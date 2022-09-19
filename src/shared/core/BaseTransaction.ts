import { Transaction } from 'sequelize/types';

export enum CommitResult {
  SUCCESS = 'SUCCESS',
  RETRY = 'RETRY',
  ERROR = 'ERROR',
  EXHAUSTED = 'EXHAUSTED',
}

export abstract class BaseTransaction {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected getTransaction?: any;
  protected transaction!: Transaction;
  protected commitRetries: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected constructor(getTransaction?: any) {
    this.getTransaction = getTransaction;
    this.commitRetries = 0;
  }

  private static maxCommitRetries = 3;
  protected async commitWithRetry(): Promise<CommitResult> {
    const { SUCCESS, RETRY, ERROR, EXHAUSTED } = CommitResult;
    try {
      await this.transaction.commit();
      this.commitRetries = 0;
      return SUCCESS;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.log('Error when committing', e);

      // Specific of CockroachDB
      if (!e.parent || e.parent.code !== '40001') return ERROR;

      console.log(
        `DB error 40001, will try to rollback and return RETRY or EXHAUSTED`
      );
      try {
        await this.transaction.rollback();
      } catch (e) {
        console.log('Error when rolling back', e);
      }

      if (this.commitRetries < BaseTransaction.maxCommitRetries) {
        this.commitRetries++;
        console.log(`Retry commit #${this.commitRetries}...`);
        await new Promise((r) =>  // wait some before retrying
          setTimeout(r, (this.commitRetries + Math.random()) * 100)
        );
        return RETRY;
      }

      console.log(`Max retries ${BaseTransaction.maxCommitRetries} exhausted`);
      return EXHAUSTED;
    }
  }
}
