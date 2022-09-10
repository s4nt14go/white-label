import { v4 as uuidv4 } from 'uuid';
import { Identifier } from './Identifier';

export class EntityID extends Identifier<string | number> {
  public constructor(id?: string | number) {
    super(id ? id : uuidv4());
  }
}
