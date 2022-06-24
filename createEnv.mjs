// Creates .env.<stage> for integration tests
// Run it with stack name: STACK=MyStack zx createEnv.mjs
const stack = process.env.STACK;
if (!stack) throw new Error(`STACK env var should exist`);
const sst = require(`./.build/sst-merged.json`)
const { stage, name: project, region } = sst;

await $`aws cloudformation describe-stack-resources \
    --stack-name ${stage}-${project}-${stack} > deployed.json`

const resources = require('./deployed.json').StackResources;

const deployedLambdas = resources.filter(r => r.ResourceType === 'AWS::Lambda::Function');

const localConstructs = require(`./.build/cdk.out/${stage}-${project}-${stack}.template.json`).Resources.SSTMetadata.Metadata['sst:constructs'];
const localLambdas = localConstructs.filter(c => c.type === 'Function').map(f => f.id);

const envFile = `.env.${stage}`;
await $`rm -f ${envFile}`;
await $`echo AWS_REGION=${region} >> ${envFile}`

localLambdas.map(async l => {
    const deployed = deployedLambdas.filter(d => {
        return d.PhysicalResourceId.includes(l);
    })[0]
    await $`echo ${l}=${deployed.PhysicalResourceId} >> ${envFile}`
});

const idTables = localConstructs.filter(c => c.type === 'Table').map(t => `${t.id}`);
idTables.map(async id => {
    await $`echo ${id}Table=${stage}-${project}-${id} >> ${envFile}`    // Expects to name tables like <id>Table
});
