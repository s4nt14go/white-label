// Create .env for integration and e2e tests
// Run it with stack name: PROJECT=white-label STACK=MyStack zx createEnv.mjs
const stack = process.env.STACK;
const project = process.env.PROJECT;
const region = process.env.AWS_REGION;
const stage = process.env.STAGE;
if (!stack || !project || !region || !stage) {
  console.log(process.env)
  throw new Error(`Mandatory env var is missing`);
}

await $`aws cloudformation describe-stack-resources \
    --stack-name ${stage}-${project}-${stack} > deployed.json`

const resources = require('./deployed.json').StackResources;
await $`rm deployed.json`

const deployedLambdas = resources.filter(r => r.ResourceType === 'AWS::Lambda::Function');

// The name of deployed lambda distributeDomainEvents is needed in design code while the others in integration tests
const lambdas = ['distributeDomainEvents', 'getAccountByUserId', 'transfer', 'createUser', 'notifySlackChannel', 'someWork', 'createTransaction'];

const envFile = `.env`;
await $`rm -f ${envFile}`;
await $`echo AWS_REGION=${region} >> ${envFile}`

lambdas.map(async l => {
    const deployed = deployedLambdas.filter(d => {
        return d.PhysicalResourceId.startsWith(`${stage}-${project}-${stack}-${l}`);
    })[0]
    await $`echo ${l}=${deployed.PhysicalResourceId} >> ${envFile}`
});

const tables = resources.filter(r => r.ResourceType === 'AWS::DynamoDB::Table');
tables.map(async t => {
  const physicalResourceId = t.PhysicalResourceId;
  const logicalName = physicalResourceId.split('-').pop() + 'Table';
  await $`echo ${logicalName}=${physicalResourceId} >> ${envFile}`
});

$.verbose = false // Don't log sensitive data

await $`aws appsync list-graphql-apis > appsync.json`
const graphqlApis = require(`./appsync.json`).graphqlApis;
await $`rm appsync.json`;
const appsyncName = 'AppSyncApi';
const appsync = graphqlApis.filter(g => g.name === `${stage}-${project}-${appsyncName}`)[0];
let appsyncId = appsync.apiId;
let appsyncUrl = appsync.uris.GRAPHQL;
await $`echo appsyncUrl=${appsyncUrl} >> ${envFile}`
await $`aws appsync list-api-keys --api-id ${appsyncId} > appsyncKeys.json`
let appsyncKey = require('./appsyncKeys.json').apiKeys[0].id;
await $`rm appsyncKeys.json`
await $`echo appsyncKey=${appsyncKey} >> ${envFile}`

await $`aws ssm get-parameter --name /${project}/${stage}/cockroach > cockroach.json`
let cockroach = require('./cockroach.json').Parameter.Value;
await $`rm cockroach.json`
const [ username, password, database, host, dialect, port, cluster ] = cockroach.split(',');
await $`echo COCKROACH_username=${username} >> ${envFile}`
await $`echo COCKROACH_password=${password} >> ${envFile}`
await $`echo COCKROACH_database=${database} >> ${envFile}`
await $`echo COCKROACH_host=${host} >> ${envFile}`
await $`echo COCKROACH_dialect=${dialect} >> ${envFile}`
await $`echo COCKROACH_port=${port} >> ${envFile}`
await $`echo COCKROACH_cluster=${cluster} >> ${envFile}`