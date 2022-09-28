import fetch from 'node-fetch';

const { appsyncUrl, appsyncKey } = process.env;

export class AppSyncClient {
  private readonly url: string;
  private readonly key: string;

  public constructor() {
    if (!appsyncUrl || !appsyncKey) {
      console.log('process.env', process.env);
      throw new Error(`Undefined env var!`);
    }
    this.url = appsyncUrl;
    this.key = appsyncKey;
  }

  public send({ query, variables }: { query: string; variables: unknown }) {
    return fetch(this.url, {
      method: 'post',
      headers: {
        'x-api-key': this.key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });
  }
}