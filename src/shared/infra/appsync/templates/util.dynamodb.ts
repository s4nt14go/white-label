// "import { util } from '@aws-appsync/utils';" only has types, it doesn't contain the function definitions. As the definitions are needed for tests I reversed engineered them here.
// https://docs.aws.amazon.com/appsync/latest/devguide/dynamodb-helpers-in-util-dynamodb-js.html

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDynamoDB(value: unknown): any {
  if (value === null) return {NULL: null};
  if (value instanceof Date) value = value.toJSON();
  const type = typeof value;
  switch (type) {
    case 'string':
      return { S: value};
    case 'number':
      return { N: value};
    case 'boolean':
      return { BOOL: value};
  }

  if (Array.isArray(value)) {
    return {
      L: toDynamoDB(value),
    }
  }

  return value;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toMapValues(value: any) {
  const Map = Object();
  for (const k in value) {
    const toDDB = toDynamoDB(value[k]);
    Map[k] = {
      M: {
        [Object.keys(toDDB)[0]]: toDDB,
      },
    }
  }
  return Map;
}

export {
    toDynamoDB,
    toMapValues,
};
