import { DocumentNode } from 'graphql';

export interface IFeClient {
  send(args: { query: DocumentNode; variables: unknown }): void;
}
