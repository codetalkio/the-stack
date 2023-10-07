# 🌥️ The Stack: Everything to build a modern cloud infrastructure

This repository accompanies the blog series ["The Stack": Everything you'll need](https://codetalk.io/posts/2023-01-29-the-stack.html). We structure each part of the article into a branch so that you can follow along with a minimal amount of changes.

Jump to branches:
- [Part 0: The introduction and goals (blog post only)](https://codetalk.io/posts/2023-01-29-the-stack.html)
  - The goals of “The Stack” and architecture overview
- Part 1: Setting up your AWS Account Structure (blog post only)
  - Setting up Control Tower and all of our AWS Accounts
- [Part 2: Automating Deployments via CI](https://github.com/codetalkio/the-stack/tree/part-2-automatic-deployments)
  - Bootstrapping CDK and deploying to all accounts via CI
- Part 3: Creating our Frontend
  - Creating an SPA and deploying it to S3 + CloudFront
- Part 4: A Federated GraphQL API
  - Federated GraphQL in Lambda with two subgraphs talking to DynamoDB
- Part 5: Asynchronous work and processing
  - Queuing up work with SQS and decoupling services via Pub/Sub using EventBridge
- Part 6: Video transcoding and image resizing
  - Transcode video files with MediaConvert and resize images on-the-fly
- Part 7: Notifications and emails
  - Sending emails and Push Notifications
- Part 8: Monitoring, traces, and debugging
  - XRay traces and CloudWatch Dashboards
- Part 9 (Bonus): Preview Environments in CI
  - Spin up environments in Pull Requests using GitHub Actions
- Part 10 (Bonus): Websocket support for GraphQL
  - Support GraphQL subscriptions via API Gateway’s websocket support
- Part 11 (Bonus): Mobile App
  - Package the Frontend as a Mobile App
- Part 12 (Bonus): Billing breakdown
  - Forming an overview of service costs via Billing Tags and the Cost Explorer
