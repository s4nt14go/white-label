import { BaseTransaction, CommitResult } from './BaseTransaction';
import { ControllerResultAsync } from './BaseController';
import { ConnectionAcquireTimeoutError } from 'sequelize';

export abstract class BaseSubscriber<Request, Response> extends BaseTransaction {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly renewConn?: any;
  protected abstract executeImpl(
    dto: unknown | Request
  ): ControllerResultAsync<Response>;
  protected event!: Request;
  private dbConnTimeoutErrors = 0;
  private maxDbConnTimeoutErrors = 3;

  protected constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renewConn?: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getTransaction?: any
  ) {
    super(getTransaction);
    this.renewConn = renewConn;
  }

  public async execute(event: Request): Promise<void> {
    this.event = event;

    try {
      if (this.getTransaction) this.transaction = await this.getTransaction();
      const implResult = await this.executeImpl(event);
      if (implResult.status === 200 || implResult.status === 201) {
        if (this.transaction) return this.handleCommit();
        return;
      } else {
        console.log('implResult', implResult);
        throw Error('No success??');
      }
    } catch (err) {
      await this.handleUnexpectedError(err);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async handleUnexpectedError(err: any) {
    this.commitRetries = 0;
    console.log(`An unexpected error occurred: ${typeof err}`, err);
    console.log(`Event`, this.event);
    if (err instanceof ConnectionAcquireTimeoutError && this.renewConn) {
      console.log(`ConnectionAcquireTimeoutError, will try to rollback and retry`);
      try {
        await this.transaction.rollback();
      } catch (e) {
        console.log('Error when rolling back', e);
      }

      if (this.dbConnTimeoutErrors < this.maxDbConnTimeoutErrors) {
        this.dbConnTimeoutErrors++;
        console.log(`Retry connection #${this.dbConnTimeoutErrors}...`);
        await this.renewConn();
        await new Promise(
          (
            r // wait some before retrying
          ) => setTimeout(r, (this.dbConnTimeoutErrors + Math.random()) * 100)
        );
        return this.execute(this.event);
      }

      console.log(
        `Max connection retries ${this.maxDbConnTimeoutErrors} exhausted`
      );
    } else {
      this.dbConnTimeoutErrors = 0;
    }

    if (this.transaction)
      try {
        // guard against the error being because of the rollback itself
        await this.transaction.rollback();
      } catch (e) {
        console.log('Error when rolling back inside serverError', e);
      }
  }

  private async handleCommit() {
    const r = await this.commitWithRetry();
    const { SUCCESS, RETRY, ERROR, EXHAUSTED } = CommitResult;
    switch (r) {
      case SUCCESS:
        return;
      case RETRY:
        await this.execute(this.event);
      // eslint-disable-next-line no-fallthrough
      case ERROR:
      case EXHAUSTED:
      default:
        await this.handleUnexpectedError(`Error when committing: ${r}`);
    }
  }
}
