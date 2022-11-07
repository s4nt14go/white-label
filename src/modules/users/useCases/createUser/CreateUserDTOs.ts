import { Created } from '../../../../shared/core/Created';

export interface Request {
  email: string;
  password: string;
  username: string;
  alias?: string;
}

export type Response = Created;
