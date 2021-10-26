---
title: Hosted Files
layout: article
---

The [Hosted files API](/swagger-ui/index.html#/Files) provides public asset hosting for an app (for example, it is the basis for storing a custom logo for each study). The assets must be added by developers, but the assets themselves are publicly available for download by a client without further authentication.

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

<div hidden>
TODO
## Hosted Files

Developers can upload [hosted files](/articles/mobile/hosted_files.html) to Bridge that can be referenced in your app config files. Once a file revision has been uploaded through the Bridge Study Manager, the app config JSON includes a "files" property that can include an array of [FileReference](/model-browser.html#FileReference) objects. These include an "href" property with an URL that can be used to download the file. 

Referencing key files (even other configuration files) in your app config file will allow you to issue updates or fixes to your installed app base, as long as your apps periodically retrieve and check the app config file. This will need to be balanced with the performance cost of downloading files, using the phone's network and your user's cellular data plan.
</div>