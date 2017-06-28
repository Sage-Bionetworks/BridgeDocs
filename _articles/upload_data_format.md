---
title: Bridge Upload Data Format
layout: article
---

<div id="toc"></div>

## Overview

Each upload is a bundle with a series of files. Each file bundle is then zipped using the ZIP format, consistent with a [ZipInputStream](http://docs.oracle.com/javase/7/docs/api/java/util/zip/ZipInputStream.html). Each ZIP archive is then encrypted using the public encryption key installed in each app.

    Encrypted file
        * ZIP file
            * info.json
            * foo.json
            * bar.json
            * baz.json

## iOS ResearchKit Uploads

## info.json

Upload bundles from iOS ResearchKit apps must include a file called info.json. This file is in JSON format and looks like:

```json
  {
    "files" : [ {
      "filename" : "audio_countdown.m4a",
      "timestamp" : "2015-03-02T03:26:59-08:00"
    }, {
      "filename" : "audio_audio.m4a",
      "timestamp" : "2015-03-02T03:27:09-08:00"
    } ],
    "item" : "Voice Activity",
    "schemaRevision" : 1,
    "appVersion" : "version 1.0.2, build 8",
    "phoneInfo" : "iPhone 6"
 }
 ```

 info.json must contain a list of files. Each file in the bundle must have a corresponding entry in info.json's file list, and vice versa. Each file entry must have a filename and a timestamp representing when the file's data was measured and written. If the data was measured over a long period of time, the timestamp should represent when the data was last measured and written. The timestamp must be in [ISO 8601 format](http://en.wikipedia.org/wiki/ISO_8601).

 info.json must also include item, which is a human-readable String describing the activity that this data is measured from. The item name must uniquely distinguish the activity from all other activities within the app, and each activity in the app must have the same item name.

 info.json should also include the "schemaRevision" field, to tell the Bridge server which revision of the schema Bridge should use. If this is omitted, Bridge will assume schemaRevision 1.

info.json must also include the appVersion and phoneInfo fields, which describe app version and phone hardware (and optionally software) respectively. **NOTE:** appVersion and phoneInfo have a max length of 48 characters. Submitting appVersion or phoneInfo longer than 48 characters will be truncated.

If you have the surveyGuid and surveyCreatedOn, you can use those instead of item and schemaRevision. Example:

```json
{
   "files" : [ {
     "filename" : "foo.json",
     "timestamp" : "2015-03-02T03:26:59-08:00"
   }, {
     "filename" : "bar.json",
     "timestamp" : "2015-03-02T03:27:09-08:00"
   } ],
   "surveyGuid":"983326c1-6391-4a10-9b06-82c3a3c090b4",
   "surveyCreatedOn":"2015-08-27T21:55:57.964Z",
   "appVersion" : "version 1.0.2, build 8",
   "phoneInfo" : "iPhone 6"
}
```

## Surveys

Surveys consist of metadata in the info.json file as well as individual files for each survey answer.

Each answer to each individual survey question is stored in its own file. That file is in JSON format and looks like:

```json
{
  "questionType" : 6,
  "booleanAnswer" : true,
  "startDate" : "2015-02-15T19:35:10+0000",
  "questionTypeName" : "Boolean",
  "item" : "limitations",
  "endDate" : "2015-02-15T19:35:12+0000"
}
```

Each survey answer file must include the following keys: item, startDate, endDate, questionType, questionTypeName.

The item field is a unique identifier that uniquely identifies the survey question in the survey.

startDate and endDate are metadata representing when the user started and finished answering the question. The app may use the same value for both startDate and endDate. Both of these fields are timestamps in ISO 8601 format.

The questionType and questionTypeName fields represent the data type of the answer. questionTypeName is a string representation of the answer field type. Possible questionTypeName values include: Boolean, Date, Decimal, Integer, MultipleChoice, None, Scale, SingleChoice, Text, TimeInterval. questionType is the numeric representation that maps to the string representation of the question type. For documentation on the valid question types and their string and numeric type representations, please consult the ResearchKit documentation.

Each survey file must also have a field representing the survey answer. The name of this field varies with each question type. Possible answer field names include: booleanAnswer, dateAnswer, intervalAnswer, numericAnswer, scaleAnswer, textAnswer. The value type of this field depends on the question type. There may also be additional fields required for the question type, such as unit. For more information, please consult the ResearchKit documentation.

The survey must also have a corresponding schema (see Schemas). The "item" field in info.json must match the schema ID. There must be a field definition in the schema for every "item" field in every possible survey file in the upload bundle. For example, if your survey info.json declares "item":"DailySurvey", and it has files foo.json, bar.json, baz.json with "item":"foo", "item":"bar", and "item":"baz", then you must have a schema with ID "DailySurvey" with fields "foo", "bar", and "baz".

## Non-Survey Data

For non-survey data, the Bridge server will use the "item" field in info.json to determine the schema. The schema fields should match one-to-one with the fields in the upload bundle. Since different files can have fields with the same name, it will use filenames to prefix the file's field names to generate the bundle's field names. For example, if your data looks like

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
  "speedUnit":"mph",
  "color":"tope"
}
```

Then your schema should have field names "foo.json.xyz", "foo.json.persistence", "foo.json.color", "bar.json.speed", "bar.json.speedUnit", "bar.json.color". (Alternatively, if the entire bar.json should be a single field with the entire JSON file as an attachment, you could declare a field called bar.json.)

## Schemas

A schema is defined as follows:

```json
{
  "name": "Sample Schema",
  "schemaId": "sample-schema",
  "schemaType": "ios_data",
  "revision": 1,
  "fieldDefinitions": [
    {
      "name": "foo",
      "required": true,
      "type": "STRING"
    },
    {
      "name": "bar",
      "required": true,
      "type": "INT"
    },
    {
      "name": "baz",
      "required": false,
      "type": "BOOLEAN"
    }
  ],
  "type": "UploadSchema"
}
```

The name field is human-readable display name for your schema. This is also used to match non-JSON bundles.

schemaId is the machine-readable unique identifier for your schema.

schemaType represents the type of schema. For iOS uploads, valid values are ios_survey for surveys and ios_data for non-surveys.

revision is the revision number of your schema. Schemas are immutable. Once registered, they cannot be modified. However, researchers can upload a new revision of a schema.

fieldDefinitions is a list of fieldDefinition entries. Each entry specifies the field name, field type, and whether the field is required or optional. A schema cannot contain fields with the same name.

Valid field types include:

|Type|Description|
|---|---|
|ATTACHMENT\_BLOB|Used for non-JSON data uploads. Represents any kind of non-JSON attachment that should be uploaded separately from structured data. Generally used for things like audio files.|
|ATTACHMENT\_CSV|Used for non-JSON data uploads. Represents a file in CSV format. Bridge server will attempt to perform further post-processing on this CSV file.|
|ATTACHMENT\_JSON\_BLOB|Large blobs of JSON data that should be stored separately from structured data. This is treated the same as ATTACHMENT_BLOB, but is tagged as JSON data for researcher convenience.|
|ATTACHMENT\_JSON\_TABLE|A blob of JSON data in a structured tabular form, which can be used for additional post-processing on the server. See the example below.|
|BOOLEAN|true or false|
|CALENDAR_DATE|String in YYYY-MM-DD format.|
|FLOAT|floating point number, including floats, doubles, and decimals.|
|INLINE\_JSON\_BLOB|JSON blob that's small enough to fit inside the health data. Generally something that's less than a hundred characters. This is used for things like small lists: [ "apples", "bananas", "cranberries" ].|
|INT|integers, including longs and big integers.|
|STRING|any non-empty string. NOTE: Strings can't exceed 100 characters in length, or they won't fit into Synapse tables. If this is freeform text from the user, make sure this is limited to 100 characters, or specify the schema as ATTACHMENT_BLOB.|
|TIMESTAMP|timestamps, can either be a string in ISO 8601 format or a long that's milliseconds since the beginning of the epoch (1970-01-01).|

Example of a ATTACHMENT\_JSON\_TABLE value:

```json
[
  {
    "accelerometer":{
      "x":0.23,
      "y":-0.92,
      "z":0.0
    },
    "speed":2.78,
    "feeling":"hungry"
  },
  {
    "accelerometer":{
      "x":0.88,
      "y":-2.7,
      "z":-9.8,
    },
    "speed":0.12,
    "feeling":"excited"
  }
]
```

For how to create new schemas or new revisions, see the Bridge REST API documentation.
