import { Created } from '../../../../shared/core/Created';

export interface Request {
  userId: string;
  description: string;
  delta: number;
}

export type Response = Created;
