---
title: File & Resource Hosting
layout: article
---

<div id="toc"></div>

Bridge provides three sets of APIs for hosting files and JSON data for client apps:

1. The [Hosted files API](/swagger-ui/index.html#/Files) provides public asset hosting for an app. The assets must be added by developers, but the assets themselves are publicly available for download by a client without further authentication;
- The [Participant data API](/swagger-ui/index.html#/Participant%20Data) privates JSON data storage that is private to the participant who stores the data (only that participant can download the data, directly from Bridge);
- The [Participant files API](/swagger-ui/index.html#/Participant%20Files) provides file storage that is parivate to the participant who uploads the files (only that participant can download the files, through a redirect to S3).

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

[Storing data files for a participant](/swagger-ui/index.html#/Participant%20Files) involves the following steps:

1. Caller creates a [ParticipantFile](/model-browser.html#ParticipantFile) record through the [create participant file API.](/swagger-ui/index.html#/Participant%20Files/createParticipantFile) Please note that the mime/type for the file is required, although Bridge will currently allow you to create a file record without it;
1. The returned ParticipantFile that is returned will have an `uploadURL` field with a presigned URL that can be used to `PUT` the file to S3 (**note** that currently a file cannot be replaced, so this call will fail if the file already exists; this will be changed to allow overwrites of files in a future update);
1. Client uploads the file to S3;
1. The caller can retrieve a [list of created file identifiers](/swagger-ui/index.html#/Participant%20Files/getParticipantFiles);
1. The caller can retrieve a file by calling the [retrieve file API](/swagger-ui/index.html#/Participant%20Files/getParticipantFile) which returns a 302 redirecting the client with a presigned URL to retrieve the file data from S3.

Participant files can also be [deleted.](/swagger-ui/index.html#/Participant%20Files/deleteParticipantFile) They are not currently available to researchers or study coordinators. 
