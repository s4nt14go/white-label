// Create .env for integration and e2e tests
// Run it with stack name: PROJECT=white-label STACK=MyStack zx createEnv.mjs
const stack = process.env.STACK;
const project = process.env.PROJECT;
const region = process.env.AWS_REGION;
if (!stack || !project || !region) {
  console.log(process.env)
  throw new Error(`Mandatory env var is missing`);
}

const stage = fs.readFileSync('./.sst/stage');

await $`ls -a`
await $`ls .sst`
await $`printenv`

await $`aws cloudformation describe-stack-resources \
    --stack-name ${stage}-${project}-${stack} > deployed.json`

const resources = require('./deployed.json').StackResources;
await $`rm deployed.json`

const deployedLambdas = resources.filter(r => r.ResourceType === 'AWS::Lambda::Function');

const functionsJsonl = fs.readFileSync('./.sst/functions.jsonl', 'utf-8');
const array = functionsJsonl.split("}\n{");
const lambdas = []
for (let i = 0; i < array.length; i++) {
  if (i !== 0) array[i] = '{' + array[i]
  if (i !== array.length - 1) array[i] = array[i] + '}';
  array[i] = JSON.parse(array[i])
  lambdas.push(array[i].id)
}

const envFile = `.env`;
await $`rm -f ${envFile}`;
await $`echo AWS_REGION=${region} >> ${envFile}`

lambdas.map(async l => {
    const deployed = deployedLambdas.filter(d => {
        return d.PhysicalResourceId.includes(l);
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