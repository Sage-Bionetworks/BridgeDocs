---
title: Participant Data Storage
layout: article
---

<div id="toc"></div>

Bridge provides four separate methods for storing information that is specific to a participant account. **These APIs are not separated by study; any administrator in any organization with access rights to the account has specific permissions that are granted through the APIs.** They are intended for state management by an app. These APIs include:

1. The `StudyParticipant` object can be customized per app to store additional account information;
2. The [Participant data API](/swagger-ui/index.html#/Participant%20Data) provides JSON data storage under an identifier key;
1. The [Participant reports API](/swagger-ui/index.html#/Participant%20Reports) provides JSON data storage as time series data under an identifier key; and
1. The [Participant files API](/swagger-ui/index.html#/Participant%20Files) provides binary file storage.

<div class="ui warning message">
    <div class="ui header">Note</div>
    <p>These APIs all have very different access permissions for app and study administrators. These will be normalized as part of the Bridge v2 API rework.</p>
</div>

## Customizing the study participant record

The `StudyParticipant` record contains a field named `clientData` which can be used to store any arbitrary JSON that a client app wishes to store about a participant (up to 16mb, though using all this storage space may have significant performance impacts for your app). This information is not indexed or searchable, nor is it exported in the participant roster.

The `StudyParticipant` record also includes a map of user attributes:

```json
  {
    "attributes": {
      "key1": "value1",
      "key2": "value2"
    }
    "type": "StudyParticipant"
  }
```
The allowable keys for this mapping are defined per app by an app administrator, and are enumerated in the app’s `userProfileAttributes` array. Attributes are searchable through the Bridge APIs, and the attributes are included in participant roster exports. 

## Participant Data API

Arbitrary JSON data for a participant can be [stored under an identifying key](/swagger-ui/index.html#/Participant%20Data/saveDataForSelf) through the Participant Data APIs. [A list of file identifiers can be retrieved,](/swagger-ui/index.html#/Participant%20Data/getAllDataForSelf) and these can then be used to [retrieve JSON under that key.](/swagger-ui/index.html#/Participant%20Data/getDataByIdentifierForSelf) Participants can also [delete their own files.](/swagger-ui/index.html#/Participant%20Data/deleteDataByIdentifier) 

This API can be contrasted to the [participant reports API](/swagger-ui/index.html#/Participant%20Reports) which also stores arbitrary JSON data, but was designed for storing and receiving time series data (like daily reports).

The data APIs have additional APIs for workers and administrators, but the data is not available to researchers or study coordinators. 

## Participant File API

The Participant File API allows a participant to upload files to S3 that are private to the participant with no administrative access through our APIs. When uploading a file, a request is made to reserve a `fileId` and the API returns a presigned URL for uploading the file's contents. Similarly, the file can be retrieved or deleted through the API. And a list of the user's own existing files can be retrieved.

The [get participant files API](/swagger-ui/index.html#/Participant%20Files/getParticipantFiles) retrieves a list of [participant files](/model-browser.html#ParticipantFile) that can be used to find currently stored files’ IDs. This includes information about the file, such as MIME type and the date of upload. The [get participant file API](/swagger-ui/index.html#/Participant%20Files/getParticipantFiles) will retrieve the contents of an existing file using its `fileId`. If successful, it will respond with a 302 redirect with an S3 presigned URL for retrieving the file. The presigned URL will expire after 24 hours.

The [create participant file API](/swagger-ui/index.html#/Participant%20Files/createParticipantFile) is used to reserve a `fileId` and get an S3 presigned URL to complete a file upload. The request must include the MIME type of the file in the body:

```json
{
    "mimeType":"text/plain"
}
```

The response includes the presigned URL in the `uploadUrl` field. This URL can subsequently be used to send the file contents to S3 through a PUT request. The presigned URL can be used until the timestamp returned in the `expiresOn` field is reached, 24 hours after the initial request.

```json
{
    "fileId": "sample_file_id",
    "userId": "sample_user_id",
    "createdOn": "2021-06-18T13:39:58.965Z",
    "mimeType": "text/plain",
    "appId": "sample_app_id",
    "uploadUrl": "https...",
    "expiresOn": "2021-06-19T13:39:59.422Z",
    "type": "ParticipantFile"
}
```

This API updates the [ParticipantFile](/model-browser.html#ParticipantFile) record and offers a presigned URL to update S3. If a file already exists with the requested `fileId`, the previous `ParticipantFile` and related S3 file will be deleted and replaced without warning.

Finally, the [delete participant file API](/swagger-ui/index.html#/Participant%20Files/deleteParticipantFile) can be used to delete the [ParticipantFile](/model-browser.html#ParticipantFile) record and binary data associated with that record that has been stored on S3.

## Participant reports API

For time series data, Bridge offers [a participant reports API](/swagger-ui/index.html#/Participant%20Reports) where a report is saved under a specific identifier (called here an “index”), with either a date or full timestamp value for that report entry. These entries can then be retrieved through paginated APIs that take either [a date (v3)](/swagger-ui/index.html#/Participant%20Reports/getUsersParticipantReportRecords) or a [timestamp (v4)](/swagger-ui/index.html#/Participant%20Reports/getUsersParticipantReportRecordsV4) range for the results that are returned. 

These report indices and the reports themselves can be viewed, stored, and deleted by participants for their own accounts, but they are also accessible to study coordinators, software developers, and worker processes (with rights to access that account). Thus this is the most accessible of the various APIs, since it was intended for reporting.