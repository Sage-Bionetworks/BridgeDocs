---
title: Notifications For Study Initialization
layout: article
---

<div id="toc"></div>

If you are managing multiple studies within an app, sometimes you might need to be notified when a study within your app is initialized for Exporter 3.0. Common use cases include bootstrapping data processing and Synapse resources for your study's Synapse project. To do so, follow the steps below.

This guide assumes you are familiar with Amazon Simple Notification Service (SNS).

## Special Setup for SQS Queues

In order for your SQS queue to receive messages from SNS, you'll need to apply a policy to your queue to explicitly allow SNS. To do so, attach a policy that looks like

```json
{
  "Statement": [{
    "Sid": "Allow-SNS-SendMessage",
    "Effect": "Allow",
    "Principal": {
      "Service": "sns.amazonaws.com"
    },
    "Action": ["sqs:SendMessage"],
    "Resource": "your SQS queue ARN"
  }]
}
```

## Subscribing to Notifications

To subscribe to notifications, send an HTTP POST request to /v1/apps/self/exporter3/notifications/study/subscribe (or use your platform's SDK).

Example request body

```json
{
  "endpoint":"arn:aws:sqs:us-east-1:111111111111:example-queue",
  "protocol":"sqs",
  "attributes":{
    "attribute-key":"attribute-value"
  }
}
```

For more information about SNS endpoints, protocols, and subscription attributes, see the [Amazon SNS documentation](https://docs.aws.amazon.com/sns/latest/api/API_Subscribe.html).

Of particular note is the attribute "RawMessageDelivery". Set this to "true" (as a string) if you want to receive the raw notification content. Otherwise, AWS will wrap the notification in an envelope, which needs to be parsed.

Note that you must be an app developer or app admin to call this API.

This API will return a result that looks like

```json
{
  "subscriptionArn":"arn:aws:sqs:us-east-1:111111111111:example-queue:example-subscription-guid"
}
```

This is the ARN representing your subscription to an SNS topic. Note that Amazon will send a message to your endpoint to confirm your subscription. This subscription must be confirmed before your endpoint will receive notifications from the SNS topic.

## Notification Format

The notification content will look like

```json
{
  "appId":"your-app-id",
  "studyId":"initialized-study-id",
  "parentProjectId":"syn11111111",
  "rawFolderId":"syn11111112"
}
```

|Attribute Name|Description|
|---|---|
|appId|App ID that contains all of your studies.|
|studyId|Study ID that was initialized.|
|parentProjectId|Synapse project ID that for this study.|
|rawFolderId|Synapse folder ID that the raw data will be exported to.||

See [this doc](submitting_health_data.html#viewing-your-data-in-synapse) for more information about Exporter 3.0 data formats in Synapse.
