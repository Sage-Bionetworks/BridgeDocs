---
title: File & Resource Hosting
layout: article
---

<div id="toc"></div>

Bridge provides three sets of APIs for hosting files and JSON data for client apps:

1. The [Hosted files API](/swagger-ui/index.html#/Files) provides public asset hosting for an app. The assets must be added by developers, but the assets themselves are publicly available for download by a client without further authentication;
- The [Participant data API](/swagger-ui/index.html#/Participant%20Data) provides JSON data storage that is private to the participant who stores the data (only that participant can download the data, directly from Bridge);
- The [Participant files API](/swagger-ui/index.html#/Participant%20Files) provides file storage that is private to the participant who uploads the files (only that participant can download the files, through a redirect to S3).

## Hosted Files API

[Hosting a file on the Bridge server](/swagger-ui/index.html#/Files) involves several steps:

1. The developer should create a [FileMetadata](/model-browser.html#FileMetadata) object using the [file metadata API](/swagger-ui/index.html#/Files/createFile);
1. The developer should then create a [FileRevision](/model-browser.html#FileRevision) object for that metadata via the [file revision API](/swagger-ui/index.html#/Files/createFileRevision);
1. The revision will be returned with a pre-signed URL to upload the content of the file to Amazon's S3 file hosting service (the URL expires in 10 minutes);
1. The developer should PUT the file contents to S3;
1. The developer should call [the API to mark the file content upload as completed](/swagger-ui/index.html#/Files/finishFileRevision). (This can also be called to clean up orphaned revision records. If the S3 upload has failed, the revision record will be deleted.)

Once a file revision exists on the server, the app developer can link to it via the [app configurations](/articles/mobile/appconfigs.html). The link to a file revision has a stable URL that can also be used directly by a client app or web app.

Using the [Java REST SDK](/articles/java.html), this can be broken down into two steps. First, developers need to create a metadata object describing your file in all its revisions:

```java
ForDevelopersApi devsApi = developer.getClient(ForDevelopersApi.class);

FileMetadata meta = new FileMetadata();
meta.setName("Name");
meta.setDescription("Description");

final GuidVersionHolder keys = devsApi.createFile(meta).execute().body();
meta.setGuid(keys.getGuid());
meta.setVersion(keys.getVersion());
```

Once this object exists and you have the GUID of the file, the Java SDK contains a utility method to perform the creation of a single revision for that file:

```java
File file = new File("files/my-file.pdf");

FilesApi filesApi = developer.getClient(FilesApi.class);
String downloadURL = RestUtils.uploadHostedFileToS3(filesApi, meta.getGuid(), file);
```

This includes the upload of the file's contents to S3, so the downloadURL that is returned is the URL to retrieve the file via HTTP.

## Participant Data API

Arbitrary JSON data for a participant can be [stored under an identifying key](/swagger-ui/index.html#/Participant%20Data/saveDataForSelf) through the Participant Data APIs. [A list of file identifiers can be retrieved,](/swagger-ui/index.html#/Participant%20Data/getAllDataForSelf) and these can then be used to [retrieve JSON under that key.](/swagger-ui/index.html#/Participant%20Data/getDataByIdentifierForSelf) Participants can also [delete their own files.](/swagger-ui/index.html#/Participant%20Data/deleteDataByIdentifier) 

Unlike the other APIs reviewed here, these uploads and downloads of the JSON is made in one call to the Bridge server (it is not stored or downloaded through a separate call to S3 using a presigned URL).

This API can be contrasted to the [participant reports API](/swagger-ui/index.html#/Participant%20Reports) which also stores arbitrary JSON data, but was designed for storing and receiving time series data (like daily reports).

The data APIs have additional APIs for workers and administrators (not discussed here). The data is not available to researchers or study coordinators. 

## Participant Files API

The Participant File API allows a participant to upload files to S3 that are private to the participant themselves. When uploading a file, a request is made to reserve a `fileId` and the API returns a presigned URL for uploading the file's contents. Similarly, the file can be retrieved or deleted through the API. And a list of the user's own existing files can be retrieved.

### Get a list of files

The [Get Participant Files](/swagger-ui/index.html#/Participant%20Files/getParticipantFiles) API retrieves a list of [Participant Files](/model-browser.html#ParticipantFile) that can be used to find currently stored files' IDs. This includes information about the file, such as MIME type and date uploaded.

The list is in the form of a [ForwardCursorPagedResourceList](/model-browser.html#ForwardCursorPagedResourceList). The amount of results per call is set through the optional `pageSize` parameter. `pageSize` defaults to 50 and can be within 5-100.

```
.../v3/participants/self/files?pageSize=5
```

The response will include a list of [ParticipantFiles](/model-browser.html#ParticipantFile) in the `items` field. If there are more pages of results available to retrieve, the `hasNext` field will return `true` and an `offsetKey` will be included.

 ```json
    {
    "items": [...],
    "nextPageOffsetKey": "sample-offset-key",
    "requestParams": {
        "pageSize": 5,
        "type": "RequestParams"
    },
    "pageSize": 5,
    "offsetKey": "sample-offset-key",
    "total": 5,
    "hasNext": true,
    "type": "ForwardCursorPagedResourceList"
}
 ```

The `offsetKey` can be passed into the query parameters to request the next page of results.

```
.../v3/participants/self/files?pageSize=5&offsetKey=sample-offset-key
```

### Upload a file

The [Create Participant File](/swagger-ui/index.html#/Participant%20Files/createParticipantFile) API is used to reserve a `fileId` and get an S3 presigned URL to complete a file upload. The request must include the MIME type of the file in the body:

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

NOTE: This API updates the [ParticipantFile](/model-browser.html#ParticipantFile) record and offers a presigned URL to update S3. If a file already exists with the requested `fileId`, the previous ParticipantFile and related S3 file will be deleted and replaced without warning.

### Get a file

The [Get Participant File](/swagger-ui/index.html#/Participant%20Files/getParticipantFiles) API is used to get the contents of an existing file using its `fileId`. If successful, it will respond with a 302 redirect to an S3 presigned URL for retrieving the file. The presigned URL will expire after 24 hours.

### Delete a file

The [Delete Participant File](/swagger-ui/index.html#/Participant%20Files/deleteParticipantFile) API deletes both the [ParticipantFile](/model-browser.html#ParticipantFile) record and the S3 storage related to the `fileId` requested.
