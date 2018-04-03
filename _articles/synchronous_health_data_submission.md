---
title: Synchronous Health Data Submission
layout: article
---

<div id="toc"></div>

Synchronous Health Data Submission works best if you have a small amount of data, and that data can be expressed as key-value pairs in a JSON blob. Survey responses are a good example use case.

## Setting Up Your Schema

For Health Data Submission, the schemaType doesn't matter. However, the field is still required and you should still set it to something reasonable. If for whatever reason you're also using this schema for Bundle Zip File Uploads, you should set this value to be consistent with what a Bundle Zip File Upload would expect.

The schema field names should match the keys in your submitted health data. For example, if your health data looks like

```json
{
  "sports":["fencing", "running"],
  "sleep":7,
  "sleep_unit":"hour"
}
```

Then your schema field names should be "sports", "sleep", and "sleep_unit".

## Submitting Health Data

To submit health data, send an HTTP POST request to /v3/healthdata (or use your platform's SDK). Example request body:

```json
{
  "appVersion" : "version 1.0.2, build 8",
  "createdOn":"2017-08-25T15:34:13.084+0900",
  "phoneInfo" : "iPhone 6",
  "schemaId":"lifestyle-survey",
  "schemaRevision":1,
  "data":{
    "sports":["fencing", "running"],
    "sleep":7,
    "sleep_unit":"hour"
  },
  "metadata":{
    "startDateTime":"2017-09-13T15:58:52.704-0700",
    "endDateTime":"2017-09-13T15:59:36.265-0700",
    "taskRunGuid":"d097a0cf-689d-4459-90f5-792b910229da"
  }
}
```

|Attribute Name|Description|
|---|---|
|appVersion|App version, as reported by the app. Generally in the form "version 1.0.0, build 2". Must be 48 chars or less.|
|createdOn|ISO8601 timestamp of when this data measurement was recorded. If the data was measured over a long period of time, the timestamp should represent when the data was last measured and written.<br /><br />Similar to timestamp data as described in [Schemas](schemas.html), apps should refrain from "canonicalizing" to a default timezone such as UTC, as this is a loss of data.|
|phoneInfo|Phone info, for example "iPhone9,3" or "iPhone 5c (GSM)". Must be 48 chars or less.|
|schemaId|Schema ID used to process your health data.|
|schemaRevision|Schema revision of the schema used to process your health data.|
|data|Health data to submit, as key-value pairs in a JSON object.|
|metadata|Health data metadata, as key-value pairs in a JSON object. See [Health Data Metadata](health_data_metadata.html) for more details.|

You will get a response in the form

```json
{
  "data": {
    "string.json.string": "This is a string",
    "blob.json.blob": "b72c3894-d544-4449-bcaf-d88063f123ec"
  },
  "id": "4f1d0d7e-0487-49c6-bc53-c5a84dacdc2d",
  "schemaId": "upload-test-json-data",
  "schemaRevision": 1,
  "type": "HealthData",
  "userMetadata":{
    "startDateTime":"2017-09-13T15:58:52.704-0700",
    "endDateTime":"2017-09-13T15:59:36.265-0700",
    "taskRunGuid":"d097a0cf-689d-4459-90f5-792b910229da"
  }
}
```

|Attribute Name|Description|
|---|---|
|data|The submitted health data. This is usually the same as the "data" field in the posted HTTP request. Some fields may be canonicalized according to the field types in the schema. If you have attachment fields, the value will be replaced with the attachment ID, which is a reference to the attachment.<br /><br />**IMPORTANT NOTE:** If there are fields missing, or if data is empty, there is probably something wrong with your schema or with your health data submission.|
|id|Record ID. Very useful if you want to track your submission's progress through Bridge Server all the way to Synapse. Be sure to remember this as part of your QA process.|
|schemaId|Schema ID used to process your health data.|
|schemaRevision|Schema revision of the schema used to process your health data.|
|type|Always "HealthData". Identifies the response type.|
|userMetadata|Health data metadata, as submitted in the request.<br /><br />**NOTE:** There is a field called "metadata" in the response, which is different from "userMetadata". The "metadata" field refers to an old legacy feature and has no relation to health data metadata.|

## For Surveys

Submitting health data for surveys is exactly the same as submitting health data for schemas, except instead of using the schemaId and schemaRevision attributes, you use the surveyGuid and surveyCreatedOn attributes. This surveyGuid and surveyCreatedOn correspond to the survey (in Bridge server) that the bundle should be submitted against.

In this case, your request body would look like:

```json
{
  "appVersion" : "version 1.0.2, build 8",
  "createdOn":"2017-08-25T15:34:13.084+0900",
  "phoneInfo" : "iPhone 6",
  "surveyGuid":"983326c1-6391-4a10-9b06-82c3a3c090b4",
  "surveyCreatedOn":"2015-08-27T21:55:57.964Z",
  "data":{
    "sports":["fencing", "running"],
    "sleep":7,
    "sleep_unit":"hour"
  }
}
```

**IMPORTANT NOTE:** surveyCreatedOn corresponds to the survey's createdOn timestamp, NOT when the survey response was created. Using the wrong timestamp for surveyCreatedOn will result in a "schema not found" error.

**IMPORTANT NOTE:** If the survey exists in the app but doesn't have a corresponding survey in Bridge server, use schemaId and schemaRevision instead.
