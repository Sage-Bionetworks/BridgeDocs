---
title: Bundled Zip File Uploads
layout: article
---

<div id="toc"></div>

Bundled Zip File Uploads work best if you have large amounts of data (like accelerometer data), non-JSON data (like audio files or CSVs), or if your data is split across multiple files.

**IMPORTANT NOTE:** Each bundle is a single health data record (tasks, activities, surveys, etc). We do not support bundling multiple health data records in a single ZIP file.

## Building Your Bundle

Each upload is a bundle with a series of files. Each file bundle is then zipped using the ZIP format, consistent with a [ZipInputStream](http://docs.oracle.com/javase/7/docs/api/java/util/zip/ZipInputStream.html). The ZIP archive is then encrypted using the public encryption key installed in each app. The structure essentially looks like

```
Encrypted file
* ZIP file
  * info.json
  * foo.json
  * audio_audio.m4a
```

Bundles must include a JSON file called info.json, which looks like:

```json
{
  "files" : [ {
    "filename" : "foo.json",
    "timestamp" : "2015-03-02T03:27:12-08:00"
  }, {
    "filename" : "audio_audio.m4a",
    "timestamp" : "2015-03-02T03:27:09-08:00"
  } ],
  "createdOn":"2015-03-02T03:27:12-08:00",
  "dataFilename":"foo.json",
  "format":"v1_legacy",
  "item" : "Voice Activity",
  "schemaRevision" : 1,
  "appVersion" : "version 1.0.2, build 8",
  "phoneInfo" : "iPhone 6"
}
```

|Attribute Name|Description|
|---|---|
|files|(V1 Legacy only) List of files in this bundle (excluding info.json). Each entry contains a filename and a timestamp. The timestamp is a string in ISO8601 format and corresponds to when the health data measurement was recorded. If the data was measured over a long period of time, the timestamp should represent when the data was last measured and written. This information is used to generate the createdOn field in the health data record.<br /><br />Similar to timestamp data as described in [Schemas](schemas.html), apps should refrain from "canonicalizing" to a default timezone such as UTC, as this is a loss of data.|
|createdOn|(V2 Generic only) Timestamp string in ISO8601 format, corresponding to when the health data measurement was recorded, similar to the timestamp in V1 Legacy "files" attribute.|
|dataFilename|(V2 Generic only) Name of file in the bundle that Bridge should treat as the primary data file for JSON attributes. For more information, see [V2 Generic Bundles](#v2-generic-bundles).|
|format|Either "v1\_legacy" or "v2\_generic". If not specified, defaults to "v1\_legacy"|
|item|This should be filled in with the schema ID corresponding to the data in this bundle.|
|schemaRevision|This is an integer and should be filled in with the schema revision.|
|appVersion|App version, as reported by the app. Generally in the form "version 1.0.0, build 2". Must be 48 chars or less.|
|phoneInfo|Phone info, for example "iPhone9,3" or "iPhone 5c (GSM)". Should also include OS version if available. Must be 48 chars or less.|

(Note: This example info.json uses attributes from both V1 Legacy and V2 Generic. In actuality, the info.json should only include attributes relevant to its format. Any extraneous fields are generally ignored.)

## Formats

### <a name="v1-legacy-bundles">V1 Legacy Bundles</a>

For simple data bundles (as opposed to surveys), in your schema, you need to specify schemaType "ios\_data".

For field names, there are two ways for determining them.

The first is to use the filename itself as the field name. This works best if you're using attachments (large JSON files like accelerometer data or non-JSON files like audio or CSVs).

Alternatively, if you have a bunch of key-value pairs in a JSON object that you'd like to inline into the Synapse table, you can append the filename with the top-level key and use that as the field name.

For example, if your data looks like:

**foo.json**

```json
{
  "xyz":"sample field xyz",
  "persistence":"up",
  "color":"chartreuse"
}
```

**bar.json**

```json
{
  "speed":88,
  "speed_unit":"mph",
  "color":"tope"
}
```

**audio_audio.m4a**

`[binary file not shown]`

You would specify the following fields, and Bridge would parse the following values.

|Field Name|Field Value|
|---|---|
|foo.json.xyz|"sample field xyz"|
|foo.json.persistence|"up"|
|foo.json.color|"chartreuse"|
|bar.json.speed|88|
|bar.json.speed_unit|"mph"|
|bar.json.color|"tope"|
|audio_audio.m4a|(attachment reference to audio_audio.m4a)|

Alternatively, you can specify the filenames as field names and have them all stored as attachments (or inline JSON blobs for smaller files).

|Field Name|Field Value|
|---|---|
|foo.json|`{"xyz":"sample field xyz","persistence":"up","color":"chartreuse"}`|
|bar.json|`{"speed":88,"speed_unit":"mph","color":"tope"}`|
|audio_audio.m4a|(attachment reference to audio_audio.m4a)|

**IMPORTANT NOTE:** "json" is not any sort of special identifier. It's just part of the filename. If your filename were foo\_data, your field name would be foo\_data.xyz, NOT foo\_data.json.xyz.

**IMPORTANT NOTE:** Similarly, if you have a filename accelerometer\_data and your schema has a field name called accelerometer\_data.items, the "items" is not any sort of special identifier either. In this case, you're simply grabbing the file accelerometer\_data, parsing into it, and grabbing the data for the top-level key "items". For example:

**accelerometer\_data**

```json
{
  "items":[
    ...stuff here...
  ]
}
```

This is important, because if you specify your field name as simply accelerometer\_data, Bridge would know to simply use the whole file as an attachment instead of having to parse the (potentially large) file as JSON.

**IMPORTANT NOTE:** Using keys as part of the field name only works for top-level keys, not for multi-level keys. If for example, you had the file

**foo.json**

```json
{
  "timing":{
    "startTime":"2017-09-08T17:09:48.277-0700",
    "endTime":"2017-09-08T17:10:53.473-0700"
  }
}
```

You wouldn't be able to use foo.json.timing.startTime as a field name. You'd either have to use foo.json.timing as an inline JSON blob, or you'd have to restructure your data so that start- and endTime are top-level keys.

### V1 Legacy Surveys

Bundles for survey responses have additional format restrictions.

First, info.json should include surveyGuid and surveyCreatedOn instead of item and schemaRevision. This surveyGuid and surveyCreatedOn correspond to the survey (in Bridge server) that the bundle should be submitted against. For example:

```json
{
  "files" : [ {
    "filename" : "sports.json",
    "timestamp" : "2015-03-02T03:27:12-08:00"
  }, {
    "filename" : "sleep.json",
    "timestamp" : "2015-03-02T03:27:09-08:00"
  } ],
  "surveyGuid":"983326c1-6391-4a10-9b06-82c3a3c090b4",
  "surveyCreatedOn":"2015-08-27T21:55:57.964Z",
  "appVersion" : "version 1.0.2, build 8",
  "phoneInfo" : "iPhone 6"
}
```

**IMPORTANT NOTE:** surveyCreatedOn corresponds to the survey's createdOn timestamp, NOT when the survey response was created. Using the wrong timestamp for surveyCreatedOn will result in a "schema not found" error.

**IMPORTANT NOTE:** If the survey exists in the app but doesn't have a corresponding survey in Bridge server, use item and schemaRevision instead.

The answer to each survey question is in its own file. See for example:

**sports.json**

```json
{
  "item":"sports",
  "questionTypeName":"MultipleChoice",
  "choiceAnswers":["fencing", "running"]
}
```

**sleep.json**

```json
{
  "item":"sleep",
  "questionTypeName":"Integer",
  "numericAnswer": 7,
  "unit": "hour"
}
```

|Attribute Name|Description|
|---|---|
|item|Survey question identifier. If you're using a server-side survey, this corresponds with the survey question identifier in the survey JSON respresentation.<br /><br />This also corresponds with the field name in schemas.|
|questionTypeName|This tells Bridge what type the survey answer is. This is used primarily to determine what key to get the answer from. See below for a list of all known questionTypeNames and the corresponding answer keys.|
|unit|For numeric answers, this is the unit of the answer, if specified.|

|QuestionTypeName|answer key|
|---|---|
|Boolean|booleanAnswer|
|Date|dateAnswer|
|DateAndTime|dateAnswer|
|Decimal|numericAnswer|
|Integer|numericAnswer|
|MultipleChoice|choiceAnswers|
|None|scaleAnswer|
|Scale|scaleAnswer|
|SingleChoice|choiceAnswers|
|Text|textAnswer|
|TimeInterval|IntervalAnswer|
|TimeOfDay|dateComponentsAnswer|

**NOTE:** choiceAnswers is plural. None of the other keys are.

**NOTE:** Yes, there is actually a Question Type Name called "None", and it really does get its answer from scaleAnswer.

Usually, surveys will automatically create schemas when you publish them. However, sometimes you'll need to create schemas manually. Either way, reading this section is useful, as knowing how to map survey data in a bundle to a schema is helpful for diagnosing issues.

For survey schemas, you need to specify schemaType "ios\_survey".

Schema field names for survey types are much simpler than data types. The field name is exactly the same as the survey question identifier (if you're using surveys that live in Bridge server). It's also exactly the same as the "item" field in the survey answer file.

Our previous example will end up with the following field names and values:

|Field Name|Field Value|
|---|---|
|sports|`[ "fencing", "running" ]`|
|sleep|7|

In addition, for numeric types, if you want the unit to be part of your schema (which they are for auto-generated schemas), simply define a string field (with size at least 19 characters) whose name is the survey question identifier with the "\_unit" suffix.

For example, our survey question identifier is "sleep", so our unit field is called "sleep\_unit".

### <a name="v2-generic-bundles">V2 Generic Bundles</a>

V2 Generic Bundles look very similar to [V1 Legacy Bundles](#v1-legacy-bundles) with a few key differences:

* The [schema's schemaType attribute](schemas.html) is ignored, since in V2 Generic, non-survey bundles and [survey bundles](#v2-generic-surveys) look the same. (Note that the schemaType attribute is still required and you should still set it to something reasonable. If this schema is also used for V1 Legacy, it should consistent with what V1 Legacy would expect.)
* The dataFilename attribute in info.json can be used to specify a file whose keys can be used as schema fields without prefixing the file name.

For example, if your upload bundle contains the files:

**info.json**

```json
{
  "appVersion" : "version 1.0.2, build 8",
  "createdOn":"2017-08-25T15:34:13.084+0900",
  "dataFilename":"foo.json",
  "format":"v2_generic",
  "item":"lifestyle-activity",
  "phoneInfo" : "iPhone 6",
  "schemaRevision":1
}
```

**foo.json**

```json
{
  "xyz":"sample field xyz",
  "persistence":"up",
  "color":"chartreuse"
}
```

**bar.json**

```json
{
  "speed":88,
  "speed_unit":"mph",
  "color":"tope"
}
```

**audio_audio.m4a**

`[binary file not shown]`

In V2 Generic, if you specify foo.json as your dataFilename, you can specify the following fields in your schema with the following values:

|Field Name|Field Value|
|---|---|
|xyz|"sample field xyz"|
|persistence|"up"|
|color|"chartreuse"|
|bar.json.speed|88|
|bar.json.speed_unit|"mph"|
|bar.json.color|"tope"|
|audio_audio.m4a|(attachment reference to audio_audio.m4a)|

Note that you still have the option of specifying filenames in your schema ("foo.json.xyz") as well as referring to files in their entirety.

### <a name="v2-generic-surveys">V2 Generic Surveys</a>

In V2 Generic, surveys look the same as non-surveys. Since most survey schemas don't include filenames, you should put the survey answers in the file specified by dataFilename.

For example, if your survey bundle had the following files:

**info.json**

```json
{
  "createdOn":"2017-09-25T15:34:13.084+0900",
  "dataFilename":"answers.json",
  "format":"v2_generic",
  "surveyGuid":"983326c1-6391-4a10-9b06-82c3a3c090b4",
  "surveyCreatedOn":"2015-08-27T21:55:57.964Z",
  "appVersion" : "version 1.0.2, build 8",
  "phoneInfo" : "iPhone 6"
}
```

**answers.json**

```json
{
  "sports":["fencing", "running"],
  "sleep":7,
  "sleep_unit":"hour"
}
```

You could specify the following fields in your schema (or create a survey which generates these fields), which would result in the following values:

|Field Name|Field Value|
|---|---|
|sports|`["fencing", "running"]`|
|sleep|7|
|sleep_unit|"hour"|

In addition, you can have supplemental files in your schema that you reference by filename, as well as attachments. (Note that survey schemas generated by the server don't have these by default.)

## <a name="submitting-metadata">Submitting Metadata</a>

To submit metadata in the upload API, simply create a file called metadata.json in your ZIP file and write your metadata as key-value pairs.

In our example above, our metadata.json file contents would look like:

```json
{
  "startDateTime":"2017-09-13T15:58:52.704-0700",
  "endDateTime":"2017-09-13T15:59:36.265-0700",
  "taskRunGuid":"d097a0cf-689d-4459-90f5-792b910229da"
}
```

See [Health Data Metadata](health_data_metadata.html) for more details.

NOTE: For backwards-compatibility, metadata.json will continue to be parsed for normal schema fields. This is in contrast with info.json, which currently can never be used for normal schema fields.

## Uploading Your Bundle

To upload your bundle, you need to follow 3 basic steps:

1. Call the upload request API to get a URL to upload to.
2. Upload your bundle to that URL.
3. Call the upload complete API to kick off asynchronous processing of the upload.

### Call the Upload Request API

Send an HTTP POST to /v3/uploads (or use your platform's SDK). Example request body:

```json
{
  "name":"json-data-encrypted",
  "contentLength":1245,
  "contentType":"application/zip",
  "contentMd5":"Z1nJ4MVKEcHnLyD16vBEFA=="
}
```

|Attribute Name|Description|
|---|---|
|name|Name of the file to be uploaded.|
|contentLength|Length (in bytes) of the file to be uploaded.|
|contentType|MIME type of the file to be uploaded. This is usually either "application/zip" or "application/octet-stream".|
|contentMd5|Base64 encoded string of the MD5 hash of uploaded file. Note that this should be MD5 hash of the encrypted zip file, NOT the unencrypted zip file, and NOT the individual files inside the zip.<br /><br />Also note that this is the MD5 of the WHOLE file, not a concatenation of blockwise MD5 hashes of file chunks.<br /><br />You can generate the contentMD5 in your unix command line using the command:<br />`cat file | openssl dgst -md5 -binary | base64`|

You will get a response in the form

```json
{
  "id": "ade77863-109a-475e-8813-5d218aad3105",
  "url": "https://example.com/ade77863-109a-475e-8813-5d218aad3105",
  "expires": "2017-09-02T00:22:06.893Z",
  "type": "UploadSession"
}
```

|Attribute Name|Description|
|---|---|
|id|Upload ID that uniquely identifies this upload bundle. Remember this ID.|
|url|URL that you will need to upload to in the next step.|
|expires|ISO8601 timestamp representing when the URL will expire. URLs generally expire in 24 hours.|
|type|Always "UploadSession". Identifies the response type.|

### Upload Your Bundle

Upload your file to the URL you received in the previous step. This will need to be an HTTP PUT request. In addition, you'll need to set Content-Length, Content-Type, and Content-MD5 headers that match the values you passed into the Upload Request API. If these values don't match, the upload will be rejected. In addition, if the Content-Length and Content-MD5 don't match those of the file you're uploading, the upload will also be rejected.

Example of an HTTP request

```http
PUT /ade77863-109a-475e-8813-5d218aad3105 HTTPS/1.1
Host: example.com
Content-Length: 1245
Content-Type: application/zip
Content-MD5: Z1nJ4MVKEcHnLyD16vBEFA==

[binary file not shown]
```

### Call the Upload Complete API

Send an HTTP POST request to /v3/uploads/{uploadId}/complete. The request body doesn't matter. The response is simply "200 Upload complete".

This will kick off an asynchronous job that decrypts, unzips, validates, and processes your uploaded bundle against the schema as specified in info.json.

### Validating Your Bundle

After 5 to 30 seconds (depending on the size of the bundle), your bundle should finish processing. To get the status of the upload, send an HTTP GET request to /v3/uploadstatuses/{uploadId}. You should get a response that looks like

```json
{
  "id": "157749af-b166-4b8e-b77b-fc155141a849",
  "messageList": [],
  "status": "succeeded",
  "record": {
    "data": {
      "string.json.string": "This is a string",
      "blob.json.blob": "b72c3894-d544-4449-bcaf-d88063f123ec"
    },
    "userMetadata":{
      "startDateTime":"2017-09-13T15:58:52.704-0700",
      "endDateTime":"2017-09-13T15:59:36.265-0700",
      "taskRunGuid":"d097a0cf-689d-4459-90f5-792b910229da"
    },
    "id": "4f1d0d7e-0487-49c6-bc53-c5a84dacdc2d",
    "schemaId": "upload-test-json-data",
    "schemaRevision": 1,
    "type": "HealthData"
  },
  "type": "UploadValidationStatus"
}
```

|Attribute Name|Description|
|---|---|
|id|The same upload ID.|
|messageList|List of validation messages (strings). May be empty if there are no validation warnings or errors.|
|status|Upload validation status. Possible values are:<ul><li>requested - Upload was requested but never uploaded.</li><li>validation\_in\_progress - Bundle is still being validated.</li><li>validation\_failed - Bundle failed validation.</li><li>succeeded - Bundle successfully validated and processed.</li></ul>|
|record|Health data record created from the uploaded bundle. Only the most pertinent fields are listed in this example. It may have additional fields not listed here.|
|record.data|Data parsed from the uploaded bundle into the health data record. For non-attachment fields, the data is inlined in this JSON object. For attachment fields, an attachment ID is used as the value in the key-value pairs.<br /><br />**IMPORTANT NOTE:** If this JSON object is empty, or if it doesn't contain the data you expect from your bundle, there is probably something wrong with your schema or with your bundle.|
|record.userMetadata|Health data metadata, as submitted in the bundle.<br /><br />**NOTE:** There is a field called "metadata" in the response, which is different from "userMetadata". The "metadata" field refers to an old legacy feature and has no relation to health data metadata.|
|record.id|Record ID. Very useful if you want to track your bundle's progress through Bridge Server all the way to Synapse. Be sure to remember this as part of your QA process.|
|record.schemaId|Schema ID used to process your bundle.|
|record.schemaRevision|Schema revision of the schema used to process your bundle.|
|record.type|Always "HealthData". Identifies the response type.|
|type|Always "UploadValidationStatus". Identifies the response type.|
