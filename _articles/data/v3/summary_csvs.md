---
title: Summary CSVs
layout: article
---

<div id="toc"></div>

You can get a summary of your data in CSV format from Bridge for apps with Exporter 3.0 enabled.

## Pre-requisites

The following are required to enable summary CSVs in your study.

1. Your app and study need to be enabled for Exporter 3.0, with export of RAW data to Synapse. See [Submitting Health Data to Bridge (v3)#Configuring Your Study](/articles/data/v3/submitting_health_data.html#configuring-your-study) for more information.
2. You must specify the instanceGuid and eventTimestamp in the upload metadata, so that Bridge can link your upload to an assessment. For information on how to do this, see [Submitting Health Data to Bridge (v3)#Linking Health Data To Assessments](/articles/data/v3/submitting_health_data.html#linking-health-data-to-assessments)

In addition, the following assessments will provide additional summary information in their CSVs:

1. Surveys created through our survey editor. These will generally have assessment framework identifier "health.bridgedigital.assessment".

Additional assessments may be added to this list in the future.

## Requesting Summary CSVs

Generating summary CSVs may take time, so you will need to request summary CSVs through an asynchronous request. The general flow for these requests is:

1. Request summary CSVs for a study from Bridge Server.
2. Poll Bridge Server on the status of your request.
3. When the request is ready, the result will include a URL from which to download your CSVs.

These APIs are available to developers, researchers, study designers, and study coordinators.

### Making A Request

Make an HTTP POST request to `/v5/studies/{studyId}/uploadtable/requests`. This API returns the following output:

```
{
  "jobGuid":"-x-XGZSoum2_2ucBSSHk6w",
  "type":"UploadTableJobGuidHolder"
}
```

jobGuid is a machine-generated identifier in Base64 format uniquely representing this job. You will need this job GUID to poll for the status of your request.

NOTE: For performance reasons, you can only request summary CSVs for any given study once per 5 minutes. If you request summary CSVs for the same study within that 5 minute window, you will receive the previous job GUID instead.

NOTE: In some cases, Bridge Server can detect that there are no new uploads for a study. When that happens, instead of a new job GUID, you will receive the most recent job GUID instead.

### Polling Bridge Server

Make an HTTP GET request to `/v5/studies/{studyId}/uploadtable/requests/{jobGuid}`. This API returns the following output:

```
{
  "jobGuid":"-x-XGZSoum2_2ucBSSHk6w",
  "studyId":"my-open-bridge-study",
  "requestedOn":"2024-02-13T06:17:38.659Z",
  "status":"succeeded",
  "url":"http://example.com/my-open-bridge-study-StudyName-1707805058659.zip",
  "expiresOn":"2024-02-20T06:17:38.659Z",
  "type":"UploadTableJobResult"
}
```

|Field|Description|
|---|---|
|jobGuid|Unique identifier for this job.|
|studyId|Study ID that this job is part of.|
|requestedOn|Date and time when this job was requested, in ISO8601 format.|
|status|Current status of this job. Can be in_progress, succeeded, or failed.|
|url|S3 pre-signed URL to download the results of this job. Will only be present if the job status is succeeded.|
|expiresOn|Date and time when this job will expire, in ISO8601 format. Generally 7 days from now.|
|type|Always "UploadTableJobResult". Identifies the response type.|

To ensure that download URLs are always fresh, Bridge Server may generate a new download URL when you poll the job status.

The requested summary CSVs will come as a zip file with a CSV file for each assessment. For more information about CSV format, see [CSV Format](#csv-format).

### Listing Requests

All developers, researchers, study designers, and study coordinators with access to your study can view previously requested CSVs. To do so, make a HTTP GET request to `/v5/studies/{studyId}/uploadtable/requests?start=0&pageSize=50`. start and pageSize are optional and default to 0 and 50 respectively. This API returns the following output:

```
{
  "items":[{
    "jobGuid":"-x-XGZSoum2_2ucBSSHk6w",
    "appId":"open-bridge",
    "studyId":"my-open-bridge-study",
    "requestedOn":"2024-02-13T06:17:38.659Z",
    "status":"succeeded",
    "s3Key":"my-open-bridge-study-StudyName-1707805058659.zip",
    "type":"UploadTableJob"
  }],
  "total":1,
  "type":"PagedResourceList"
}
```

NOTE: This example only shows one result, but the output may have multiple results.

|Field|Description|
|---|---|
|jobGuid|Unique identifier for this job.|
|appId|App ID that this job is part of.|
|studyId|Study ID that this job is part of.|
|requestedOn|Date and time when this job was requested, in ISO8601 format.|
|status|Current status of this job. Can be in_progress, succeeded, or failed.|
|s3Key|S3 key where the zip file with CSVs for this job is stored. Will only be present if the job status is succeeded.|
|type|Always "UploadTableJob". Identifies the response type.|

NOTE: For performance reasons, calling this API will not generate a download URL.

## CSV Format

The downloaded zip file will have a file name in the form `{studyId}-{studyName}-{suffix}.zip`, where suffix is a unique token to disambiguate different CSV requests for the same study. Note that study name may have characters other than alphanumeric characters, dashes, and underscores removed, to adhere to common filename conventions.

The zip file will contain a CSV file for each assessment in the study, with file names in the form `{studyId}-{studyName}-{assessmentGuid}-{assessmentTitle}.csv`. Similarly, the assessment title may have characters other than alphanumeric characters, dashes, and underscores removed.

The CSV will have the following columns:

|Column|Description|
|---|---|
|recordId|Unique record ID for this row.|
|studyId|Study ID that this record is part of.|
|studyName|Study name that this record is part of.|
|assessmentGuid|Assessment GUID that this record is for.|
|assessmentId|Assessment identifier that this record is for.|
|assessmentRevision|Assessment revision number that this record is for.|
|assessmentTitle|Assessment title that this record is for.|
|createdOn|ISO8601 timestamp when this record was created.|
|isTestData|True if this record is test data.|
|healthCode|Participant's unique health code.|
|participantVersion|Participant's participant version, at the time the record was submitted.|
|clientInfo|Information about the app, device, and OS, at the time the record was submitted, in JSON format. This is derived from the User-Agent submitted by the app.|
|dataGroups|Participant's data groups, as a comma-delimited list, at the time the record was submitted.|
|sessionGuid|Scheduling information.|
|sessionName|Scheduling information.|
|sessionStartEventId|Scheduling information.|
|userAgent|Raw value of the participant's User-Agent header, at the time the record was submitted.|

The CSV will also include data generated from summarization, as [described above](#pre-requisites).
