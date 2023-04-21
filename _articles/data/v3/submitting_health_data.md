---
title: Submitting Health Data to Bridge (v3)
layout: article
---

<div id="toc"></div>

## Configuring Your Study

To determine if your study is configured, go to the [Bridge Study Manager](https://research.sagebridge.org/), select your study from the Studies menu, and navigate to the Export tab. If all fields are filled in, then your study is configured for Exporter 3.0.

If not, click the Create Synapse Project button on the upper right. This should automatically generate a Synapse project for you and enable your study for Exporter 3.0.

**IMPORTANT NOTE:** This API does not currently assign permissions automatically. To gain permissions to access your newly created Synapse project, please contact us and let us know the name of your study and the Synapse account that will be managing this Synapse project. For more information, see [Jira BRIDGE-3154](https://sagebionetworks.jira.com/browse/BRIDGE-3154).

## Submitting Health Data

Apps can submit data for Exporter 3.0 using the same upload API as Exporter 2.0. Simply follow the steps described in [Uploading Your Bundle](/articles/data/bundled_zip_file_uploads.html#uploading-your-bundle).

Note the following differences:

* You no longer have to pre-define a schema before uploading data to Bridge. All data in Exporter 3.0 is considered schemaless.
* You no longer have to worry about info.json or file formats.
* The file no longer needs to be a zip file, and the "zipped" flag in the Upload Request API is ignored. (A zip file is still recommended if the assessment generates multiple files that is meant to be processed as a single unit.)
* Metadata is no longer submitted metadata.json. Instead, all metadata is submitted using the "metadata" field in the Upload Request API.
* Metadata no longer needs to be pre-defined. Instead, all metadata fields are free-form and ad-hoc. All metadata fields will be treated as strings.

**IMPORTANT NOTE:** We do not currently support [synchronous direct health data submissions](/articles/data/synchronous_health_data_submission.html). For more information, see [Jira BRIDGE-3148](https://sagebionetworks.jira.com/browse/BRIDGE-3148).

### Linking Health Data To Assessments

Linking health data to assessments will allow Bridge to add additional metadata to the exported data, which will provide context for the exported health data.

To do so, when you call the Upload Request API, in the metadata field, include the following fields:

* **instanceGuid (string)** - This comes from the participant's Timeline, specifically the ScheduledSessions. If the upload is for a specific assessment, you would send the instanceGuid in the ScheduledAssessment instead the ScheduledSession. If it's for the session in general, you would send the instanceGuid of the ScheduledSession. For more information, see [Scheduled Sessions](/articles/v2/scheduling.html#scheduled-sessions).
* **eventTimestamp (string in ISO8601 format)** - The timestamp of the event that triggered the session or assessment. This should match the eventTimestamp used to create AdherenceRecords.

When Bridge exports this data to Synapse, the file entity will include additional attributes as annotations corresponding to the scheduling information. For more details on these attributes, see [Scheduling](/articles/v2/scheduling.html).

## Viewing Your Data in the Bridge API

You may need to view the data you have submitted as well as all associated scheduling information and adherence records. This could be used, for example, to diagnose issues in the data pipeline.

To do so, send an HTTP GET request to `/v3/uploads/{uploadId}/exporter3` for app-scoped requests or `/v5/studies/{studyId}/uploads/{uploadId}/exporter3` for study-scoped requests. You may also pass in the query parameters `fetchTimeline=true` and `fetchAdherence=true` to fetch timeline metadata and adherence records respectively. (Note: Fetching adherence is only available in the study-scoped version of this API.)

Examples:

* `GET /v3/uploads/FRV1VReEy_HzeF7RdFZImqTq/exporter3?fetchTimeline=true&fetchAdherence=false`
* `GET /v5/studies/my-mobile-toolbox-study/uploads/FRV1VReEy_HzeF7RdFZImqTq/exporter3?fetchTimeline=true&fetchAdherence=true`

You should get a response that looks like:

```json
{
  "id": "FRV1VReEy_HzeF7RdFZImqTq",
  "healthCode": "TBUWcFMLqGIfSFInb-Exxwlc",
  "userId": "6XoISwN3wPBGoMJ2GJ28-6AM",
  "adherenceRecordsForSchedule": [
    // removed for brevity
  ],
  "adherenceRecordsForUpload": [
    // removed for brevity
  ],
  "record": {
    // removed for brevity
  },
  "timelineMetadata": {
    // removed for brevity
  },
  "upload": {
    // removed for brevity
  },
  "type": "UploadViewEx3"
}
```

|Field|Description|
|---|---|
|id|Upload ID. This is the same as Record ID. Provided here for convenience, since the upload or record might not always exist.|
|healthCode|Health code of the user that submitted the upload or record.|
|userId|ID of the user that submitted the upload or record.|
|adherenceRecordsForSchedule|Adherence records associated with this upload via the associated instanceGuid.|
|adherenceRecordsForUpload|Adherence records associated with this upload via the upload ID.|
|record|Health data record corresponding to this upload, if it exists.|
|timelineMetadata|Timeline metadata associated with this upload.|
|upload|Upload corresponding to the health data record, if it exists.|
|type|Always "UploadViewEx3". Identifies the response type.|

## Viewing Your Data in Synapse

Unlike Exporter 2.0, Exporter 3.0 automatically exports health data as it is submitted to Bridge. Your data should be available in Synapse within minutes.

To access your data, go to the [Bridge Study Manager](https://research.sagebridge.org/), select your study from the Studies menu, and navigate to the Export tab. Click on View Project on Synapse, and you will be taken to your Synapse project.

The two main pieces of data are Bridge Raw Data (under Files) and Participant Versions (under Tables).

### Bridge Raw Data

Under Bridge Raw Data, you will find the raw data uploads, as submitted by the apps. (If the app submitted an encrypted upload, the uploads will be decrypted before uploading to Synapse.) The uploads are folderized by date, based on when the upload was submitted to Bridge Server. (This uses Bridge Server's local time zone, which is PST/PDT.)

Files have annotations. In addition to the free-form metadata submitted by the apps, Bridge also writes the following annotation fields:

|Field|Description|
|---|---|
|recordId|Unique ID for this health data record.|
|clientInfo|Information about the app, device, and OS. This is derived from the User-Agent submitted by the app.|
|exportedOn|When the health data was exported from Bridge to Synapse, in ISO8601 format. This will usually be very close to uploadedOn.|
|healthCode|De-identified code, which uniquely represents an individual participant in this study.|
|participantVersion|Version of the participant that submitted this health data. See the [Participant Versions](#participant-versions) section below.|
|uploadedOn|When the health data was uploaded from the app to Bridge, in ISO8601 format.|
|userAgent|Raw value of the participant's User-Agent header.|

There will also be annotations corresponding to the participant's [scheduling information](/articles/v2/scheduling.html), if the schedule's instanceGuid and eventTimestamp are specified, [as described above](#linking-health-data-to-assessments).

### Participant Versions

Participant information is now exported into a single normalized table. When a participant is created, a de-identified subset of that participant's information is exported to Synapse. When the participant is updated, if the update affects any fields that are visible, a new version of that participant will be exported to Synapse. The new version is appended to the table, so the new and the old version co-exist in the same table.

To query health data with participant information, you can create a File View of the Bridge Raw Data, then join it with the Participant Versions table. If you want to query based on the participant version at the time the data was submitted, join on healthCode and participantVersion. If you want the most up-to-date participant version, join on healthCode and max participantVersion.

The Participant Versions table includes the following fields:

|Field|Description|
|---|---|
|healthCode|De-identified code, which uniquely represents an individual participant in this study.|
|participantVersion|Version of the participant.|
|createdOn|When the participant's account was first created in Bridge, ie when the original participant version was created. This is displayed in the Synapse Web UI in your local time zone, but is stored externally as epoch milliseconds and does not contain any inherent time zone information.|
|modifiedOn|When the participant was last updated, ie when this participant version was created.|
|dataGroups|Comma-separated list of data groups. Can be used for tagging test users or study subpopulations.|
|languages|Comma-separated list of languages, in 2-character ISO639-1 format (eg, "en", "es", "zh").|
|sharingScope|Participant's sharing scope, representing what level of sharing they have consented to. The two possible values are:<ul><li>**ALL\_QUALIFIED\_RESEARCHERS** - Participant has consented to sharing their data with any researcher who qualifies given the governance qualifications of this data set.</li><li>**SPONSORS\_AND\_PARTNERS** - Participant has consented only to sharing their data with the original study researchers and their affiliated research partners. This data should not be shared with anyone else.</li></ul>|
|studyMemberships|A mapping from study ID to the participant's external ID. If the participant is not in that study, there will be no entry for that particular study. A user might be in a study without an external ID. The data is in the format "&#124;[substudyId1]=[externalId1]&#124;[substudyId2]=[externalId2]&#124;". (Note: You will not be able to see entries for studies not visible to you. In most cases, this mapping will contain only a single entry.)|
|clientTimeZone|Participant's time zone name, as reported by the app. This is in tz database format (eg, "Africa/Johannesburg", "America/Los_Angeles", "Europe/London".)|

### Compute Directly on Data in Synapse or S3

Using AWS Security Token Service (STS), Synapse can securely grant you temporary AWS credentials to access data directly in S3. This can be useful if you want to:

* Download data in bulk
* Allow your compute cluster to read S3 objects using the S3 APIs

All of which you can now do with minimal overhead from Synapse.

Bridge automatically enables STS on its storage locations when it firsts creates your Synapse project. To obtain temporary S3 credentials to access this data, see the [Synapse docs](https://help.synapse.org/docs/Compute-Directly-on-Data-in-Synapse-or-S3.2048426057.html#ComputeDirectlyonDatainSynapseorS3-ObtainingTemporaryS3Credentials).

For convenience, the annotations on the Synapse file entities are also made available as metadata on the S3 files.
