import { Transaction } from 'sequelize/types';
import { Context } from 'aws-lambda';
import { EnvelopUnexpectedT } from './BaseController';

enum CommitResult {
  SUCCESS = 'SUCCESS',
  RETRY = 'RETRY',
  ERROR = 'ERROR',
  EXHAUSTED = 'EXHAUSTED',
}

export abstract class BaseTransaction<Request, ExeResponse> {
  protected abstract execute(event: Request, context: Context): ExeResponse;
  protected abstract handleUnexpectedError(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    err: any
  ): Promise<ExeResponse | { error: EnvelopUnexpectedT }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected getTransaction?: any;
  protected transaction!: Transaction;
  protected commitRetries: number;
  protected abstract event: Request;
  protected abstract context: Context;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected constructor(getTransaction?: any) {
    this.getTransaction = getTransaction;
    this.commitRetries = 0;
  }

  protected async handleCommit() {
    const r = await this.commitWithRetry();
    const { SUCCESS, RETRY, ERROR, EXHAUSTED } = CommitResult;
    switch (r) {
      case SUCCESS:
        return;
      case RETRY: {
        const e = await this.execute(this.event, this.context);
        return e;
      }
      case ERROR:
      case EXHAUSTED:
      default:
        return this.handleUnexpectedError(`Error when committing: ${r}`);
    }
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
        await new Promise(
          (
            r // wait some before retrying
          ) => setTimeout(r, (this.commitRetries + Math.random()) * 100)
        );
        return RETRY;
      }

      console.log(`Max retries ${BaseTransaction.maxCommitRetries} exhausted`);
      return EXHAUSTED;
    }
  }
}
