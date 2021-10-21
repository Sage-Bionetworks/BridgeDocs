---
title: File & Resource Hosting
layout: article
---

<div id="toc"></div>



## Hosted Files API

The [Hosted files API](/swagger-ui/index.html#/Files) provides public asset hosting for an app. The assets must be added by developers, but the assets themselves are publicly available for download by a client without further authentication;

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

