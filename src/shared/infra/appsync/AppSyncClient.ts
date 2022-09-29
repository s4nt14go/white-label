import fetch from 'node-fetch';
import { DocumentNode } from 'graphql';
import { print } from 'graphql';
import { IFeClient } from '../../../modules/notification/services/fe/IFeClient';

const { appsyncUrl, appsyncKey } = process.env;

export class AppSyncClient implements IFeClient {
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

  public send({ query, variables }: { query: DocumentNode; variables: unknown }) {
    console.log('query', query);
    return fetch(this.url, {
      method: 'post',
      headers: {
        'x-api-key': this.key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: print(query),
        variables,
      }),
    });
  }
}
