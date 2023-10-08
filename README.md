# 🌥️ The Stack: Everything to build a modern cloud infrastructure

Read the accompanying article [here](https://codetalk.io/posts/2023-10-07-the-stack-part-2.html) for detailed information on how this repository is structured, and how to prepare your AWS and GitHub Actions environments.

This covers:

- A workflow for bootstrapping our AWS Accounts for CDK ([see here](https://github.com/codetalkio/the-stack/blob/part-2-automatic-deployments/.github/workflows/cd-bootstrap.yml)).
- A workflow for deploying our CDK stacks, including synthesizing and testing before ([see here](https://github.com/codetalkio/the-stack/blob/part-2-automatic-deployments/.github/workflows/cd-deploy.yml)).
- Set up automatic staggered deployments when changes are merged to our `main` branch.
- And fallback to manual deployments if we need to.
