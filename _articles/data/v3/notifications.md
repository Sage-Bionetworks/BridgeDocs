---
title: Notifications
layout: article
---

<div id="toc"></div>

Exporter 3.0 supports 2 different types of notifications:

1. notifications for study initialization
2. notifications when health data is exported to Synapse

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

Each type of subscription has a different endpoint. However, each endpoint takes in the same input format.

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

This API will return a result that looks like

```json
{
  "subscriptionArn":"arn:aws:sqs:us-east-1:111111111111:example-queue:example-subscription-guid"
}
```

This is the ARN representing your subscription to an SNS topic. Note that Amazon will send a message to your endpoint to confirm your subscription. This subscription must be confirmed before your endpoint will receive notifications from the SNS topic.

## Notifications For Study Initialization

If you are managing multiple studies within an app, sometimes you might need to be notified when a study within your app is initialized for Exporter 3.0. Common use cases include bootstrapping data processing and Synapse resources for your study's Synapse project.

To subscribe to notifications, send an HTTP POST request to `/v1/apps/self/exporter3/notifications/study/subscribe` (or use your platform's SDK), as described above. Note that you must be an app developer or app admin to call this API.

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
|rawFolderId|Synapse folder ID that the raw data will be exported to.|

See [this doc](submitting_health_data.html#viewing-your-data-in-synapse) for more information about Exporter 3.0 data formats in Synapse.

## Notifications For Exports to Synapse

You can subscribe to be notified when data is exported to Synapse, either the app-wide Synapse project, or a study-specific Synapse project. A common use case is for automated validation and post-processing jobs.

To subscribe to export notifications for the app-wide Synapse project, send an HTTP POST request to `/v1/apps/self/exporter3/notifications/export/subscribe` (or use your platform's SDK), as described above. Note that you must be an app developer or app admin to call this API.

To subscribe to export notifications for a study-specific Synapse project, send an HTTP POST request to `/v5/studies/{studyId}/exporter3/notifications/export/subscribe`. Study designers, study coordinators, app developers, and app admins can call this API.

The format for notifications is different for app-wide notifications and study-specific notifications. See below for more details. See [this doc](submitting_health_data.html#viewing-your-data-in-synapse) for more information about Exporter 3.0 data formats in Synapse.

### App-Wide Export Notification Format

App-Wide Export Notifications have the following format:

```json
{
  "appId":"mobile-toolbox",
  "recordId":"-4I2GOqDSdjaXsbuw8oYXBKK",
  "record":{
    "parentProjectId":"syn26253339",
    "rawFolderId":"syn26253349",
    "fileEntityId":"syn26861165",
    "s3Bucket":"org-sagebridge-rawhealthdata-prod",
    "s3Key":"mobile-toolbox/2022-01-20/-4I2GOqDSdjaXsbuw8oYXBKK-MTB_Picture_Sequence_Memory"
  },
  "studyRecords":{
    "studyA":{
      "parentProjectId":"syn26253351",
      "rawFolderId":"syn26253352",
      "fileEntityId":"syn26861168",
      "s3Bucket":"org-sagebridge-rawhealthdata-prod",
      "s3Key":"mobile-toolbox/studyA/2022-01-20/-4I2GOqDSdjaXsbuw8oYXBKK-MTB_Picture_Sequence_Memory"
    },
    "studyB":{
      "parentProjectId":"syn26253353",
      "rawFolderId":"syn26253355",
      "fileEntityId":"syn26861173",
      "s3Bucket":"org-sagebridge-rawhealthdata-prod",
      "s3Key":"mobile-toolbox/studyB/2022-01-20/-4I2GOqDSdjaXsbuw8oYXBKK-MTB_Picture_Sequence_Memory"
    }
  }
}
```

|Attribute Name|Description|
|---|---|
|appId|App that the health data is exported for.|
|recordId|Record ID of the health data that is exported.|
|record|Record that is exported to the app-wide Synapse project. May not be present if there is no app-wide Synapse project configured.|
|studyRecords|Records that are exported to the study-specific Synapse project, keyed by study ID. May be empty if there are no study-specific Synapse projects configured.|
|parentProjectId|Synapse project that the health data is exported to.|
|rawFolderId|Synapse folder that the health data is exported to.|
|fileEntityId|Synapse file entity of the health data that is exported.|
|s3Bucket|S3 bucket that contains the exported health data.|
|s3Key|S3 key that of the exported health data.|

### Study-Specific Export Notification Format

Study-Specific Export Notifications have the following format:

```json
{
  "appId": "mobile-toolbox",
  "studyId": "test-study",
  "recordId": "-4I2GOqDSdjaXsbuw8oYXBKK",
  "parentProjectId": "syn26253351",
  "rawFolderId": "syn26253352",
  "fileEntityId": "syn26861168",
  "s3Bucket": "org-sagebridge-rawhealthdata-prod",
  "s3Key": "mobile-toolbox/test-study/2022-01-20/-4I2GOqDSdjaXsbuw8oYXBKK-MTB_Picture_Sequence_Memory"
}
```

|Attribute Name|Description|
|---|---|
|appId|App that the health data is exported for.|
|studyId|Study that the health data is exported for.|
|recordId|Record ID of the health data that is exported.|
|parentProjectId|Synapse project that the health data is exported to.|
|rawFolderId|Synapse folder that the health data is exported to.|
|fileEntityId|Synapse file entity of the health data that is exported.|
|s3Bucket|S3 bucket that contains the exported health data.|
|s3Key|S3 key that of the exported health data.|
