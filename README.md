# 🌥️ The Stack: Everything to build a modern cloud infrastructure

In this part we will set up everything that's necessary for us to easily deploy to all our AWS accounts.

This will include:
- Workflow for bootstrapping our AWS Accounts for CDK ([see here](/.github/workflows/cd-bootstrap.yml))
- Workflow for deploying our CDK stacks, including synthesizing and testing before ([see here](/.github/workflows/cd-deploy.yml))

For now, each of these are triggered manually by either [running the bootstrap workflow here](https://github.com/codetalkio/the-stack/actions/workflows/cd-bootstrap.yml) or [running the deploy workflow here](https://github.com/codetalkio/the-stack/actions/workflows/cd-deploy.yml). Before running the deploy workflow, check out the details in [Manual alternative: Deployments](#manual-alternative-deployments).

Overview:
- [Setting up GitHub Actions](#setting-up-github-actions)
- [Manual alternative: Bootstrapping our Accounts](#manual-alternative-bootstrapping-our-accounts)
- [Manual alternative: Deployments](#manual-alternative-deployments)


## Setting up GitHub Actions
For our GitHub Actions workflows to work, we need to set up our `Environment`s configure a couple of `Environment` variables and secrets.

1. Go to your repository Settings -> Environments
2. Create your environments e.g. `Integration Test`
3. [Recommended] Restrict deployments to the `main` branch
4. Set up the secrets for
   1. `AWS_ACCESS_KEY_ID`
   2. `AWS_SECRET_ACCESS_KEY`
5. Set up the variables for
   1. `AWS_ACCOUNT_ID`
   2. `AWS_REGION`
   3. `DOMAIN`

Repeat those steps with the relevant values for each of the environments `Integration Test`, `Production Single`, `Production Multi`.

Your `Environment` overview will look like this:

![Overview of Environments](https://github.com/codetalkio/the-stack/assets/1189998/310a97f1-7071-454c-88c9-0b682af281c5)


And each environment will roughly look like this:

![Configuration, secrets, and variables of an environment](https://github.com/codetalkio/the-stack/assets/1189998/4adcf9e7-27f9-4e5a-bf70-7f46f88bf054)


## Manual alternative: Bootstrapping our Accounts

We’ll be setting up CDK on each of our accounts, so that we can start using it for deployments.

We’ll use bun:

```bash
$ curl -fsSL https://bun.sh/install | bash
```

Then we can install all of our dependencies for our CDK stack:

```bash
$ cd deployment
$ bun install
```

And now we can bootstrap our environment. We'll assume that you have already switched your CLI environment to point to the AWS account that you want to bootstrap:

```bash
# Assuming we are still in the deployment folder
$ bun run cdk bootstrap
```

This is essentially what the [cd-bootstrap](/.github/workflows/cd-bootstrap.yml) workflow does for you, across all the environments you've specified (you can adjust the list in the build matrix).

## Manual alternative: Deployments

Now that we have bootstrapped our accounts, we can deploy our CDK stacks. We'll assume that you are still in the deployment folder and that you have switched your CLI environment to point to the AWS account that you want to deploy to.

Before we initiate the deployment, it's recommended to be logged into your Domain Registrar that controls the DNS of your domain, so that you can quickly update your name servers to point to the Hosted Zone that we will be creating. This is necessary to DNS validate our ACM certificates.

Our process will go:
1. Open the DNS settings of your domain registrar
2. Log into the target AWS Account and go to Route 53 -> Hosted Zones
3. Start the deployment
4. Wait for the Hosted Zone to be created, refresh the list, go into the Hosted Zone and copy the name servers
5. Update the name servers in your domain registrar to point your chosen domain to the Name Servers

Assuming you are ready for step 3., we can start the deployment:

```bash
$ DOMAIN="your-domain.example.com" bun run cdk deploy 'Base'
```

The `DOMAIN` environment variable is required here, since we need to know what domain we should use for the Hosted Zone.
