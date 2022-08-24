// Create .env for integration and e2e tests
// Run it with stack name: STACK=MyStack zx createEnv.mjs
const stack = process.env.STACK;
if (!stack) throw new Error(`STACK env var should exist`);
const sst = require(`./.build/sst-merged.json`)
const { stage, name: project, region } = sst;

await $`aws cloudformation describe-stack-resources \
    --stack-name ${stage}-${project}-${stack} > deployed.json`

const resources = require('./deployed.json').StackResources;
await $`rm deployed.json`

const deployedLambdas = resources.filter(r => r.ResourceType === 'AWS::Lambda::Function');

const localConstructs = require(`./.build/cdk.out/${stage}-${project}-${stack}.template.json`).Resources.SSTMetadata.Metadata['sst:constructs'];
const localLambdas = localConstructs.filter(c => c.type === 'Function').map(f => f.id);

const envFile = `.env`;
await $`rm -f ${envFile}`;
await $`echo AWS_REGION=${region} >> ${envFile}`

localLambdas.map(async l => {
    const deployed = deployedLambdas.filter(d => {
        return d.PhysicalResourceId.includes(l);
    })[0]
    await $`echo ${l}=${deployed.PhysicalResourceId} >> ${envFile}`
});

await $`aws apigatewayv2 get-apis > apis.json`

let apis = require('./apis.json').Items;
await $`rm apis.json`
apis = apis.filter(api => !api.Name.includes('debug'));
const apiUrls = apis.map(api => api.ApiEndpoint);
await $`echo apiUrl=${apiUrls[0]} >> ${envFile}`

$.verbose = false // Don't log sensitive database data
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