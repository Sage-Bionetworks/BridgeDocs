---
title: Schemas
layout: article
---

<div id="toc"></div>

## Basics

Schemas are a mapping from unstructured or semi-structured data to the column model that we see in Synapse.

**IMPORTANT:** Schemas are required for Bridge to process the data and export it to Synapse. Without a valid schema, the data will be thrown out by Bridge.

**NOTE:** For server-side surveys, schemas are automatically created when the survey is published. For all other data types, schemas must be manually created, either through the REST API or through the Bridge Study Manager.

A schema's JSON representation looks like:

```json
{
  "name": "Sample Schema",
  "schemaId": "sample-schema",
  "schemaType": "ios_data",
  "revision": 1,
  "version": 2,
  "fieldDefinitions": [
    {
      "name": "foo",
      "required": true,
      "type": "string"
    },
    {
      "name": "bar",
      "required": true,
      "type": "int"
    },
    {
      "name": "baz",
      "required": false,
      "type": "boolean"
    }
  ],
  "type": "UploadSchema"
}
```

|Attribute Name|Description|
|---|---|
|name|Human-readable display name for your schema.|
|schemaId|Unique identifier for your schema. This is used to generate Synapse table names (which must be unique per project), so you should make this ID meaningful. The name can only include alphanumeric characters, dashes, underscores, periods, or spaces.|
|schemaType|This is only used for the Bundled Zip File Uploads. Valid values are: <ul><li>ios\_survey - Parse the data using ResearchKit/AppCore survey response format.</li><li>ios\_data - Parse the data using file names and simple key-value pairs.</li></ul>|
|revision|Revision number of your schema. Schema revisions correspond one-to-one with Synapse tables. A schema can be updated in-place as long as the changes are backwards compatible. See [Updating Schemas](#updating-schemas) for more information.|
|version|Version number of the schema revision. Used for optimistic version control and detection of concurrent modification. Leave this blank when creating a new schema revision. When updating a schema revision, get the schema revision from the server, and submit the same version when you update to the server.|
|fieldDefinitions|List of field definitions. For more info, see [Field Definitions](#field-definitions).|

## Field Definitions

A field definition looks like

```json
{
  "name": "foo",
  "required": true,
  "type": "string"
}
```

It generally corresponds one-to-one with columns in the Synapse table, although some types generate more than one column. (See details below.)

Every field has 3 basic properties:

* name - The field's unique name/identifier. Cannot be more than 256 characters. Must start and end with an alphanumeric character. Can only contain alphanumeric characters, spaces, dashes, underscores, and periods. Can't contain two or more non-alphanumeric characters in a row. For more information on how to set the correct field name, see the corresponding sections in [Bundled Zip File Uploads](bundled_zip_file_uploads.html) and [Synchronous Health Data Submission](synchronous_health_data_submission.html).
* required - If the field is required and strict validation is turned on for the study, Bridge will validate that the field value exists and is of the correct type (eg, no strings for ints). If not specified, this defaults to true.
* type - Field type. See details below.

## Field Types

|Field Type|Description|
|---|---|
|attachment\_v2|Used for attachments rather than inline data, such as audio files, CSVs, images, and large JSON blobs. In general, if your field is &gt; 10kb, you should use an attachment.|
|boolean|Boolean value. If the app submits a number (ints only), we treat 0 as false and non-zero as true. If the app submits a string, we accept "true" and "false" (ignoring case). (We don't accept other strings like "Yes" or "No".)|
|calendar\_date|A ISO8601 date string in YYYY-MM-DD format. If the date string includes a time portion, the time portion will be truncated. This does not accept epoch time.|
|float|Floating point numbers (floats, doubles, and decimals). Integers are trivially converted to floating point numbers. If the app submits an string, we use [Java's BigDecimal](https://docs.oracle.com/javase/8/docs/api/java/math/BigDecimal.html#BigDecimal-java.lang.String-) to parse it.|
|inline\_json\_blob|Writes a small JSON blob inline into the health data table. Should only be used for data that is &lt; 10kb.|
|int|Integer type. If the app submits a float, we truncate using Java's double to int semantics. If the app submits a string, we use [Java's BigDecimal](https://docs.oracle.com/javase/8/docs/api/java/math/BigDecimal.html#BigDecimal-java.lang.String-) to parse it, then truncate to an int. Supports up to 64-bit ints (longs in Java).|
|large\_text\_attachment|Text or JSON that should be rendered inline in the Synapse column. Should only be used for data between 10kb and 2mb. For smaller text, use inline\_json\_blob or string. For larger text, use attachment\_v2.|
|multi\_choice|A JSON array of strings, representing answers to a multiple choice question that allows multiple selections. For example `[ "fencing", "swimming" ]`|
|single\_choice|A string representing the answer to a multiple choice question that allows only a single selection. For backwards compatibility, the answer may be submitted as a JSON array with a single element. If the array doesn't have exactly 1 element, that is an error.|
|string|A string. If the app submits a value that's not a string, it is trivially converted into a string.|
|time\_v2|An ISO8601 time string in hh:mm:ss.sss format. If a date portion or timezone are provided, those portions are ignored. This does not accept epoch time.|
|timestamp|An ISO8601 date-time string or an epoch time (milliseconds since 1970-01-01T0:00Z). An ISO8601 string is strongly preferred, as time zone information could be invaluable. Refrain from "canonicalizing" to a default timezone such as UTC, as this is a loss of data.|

### Attachments

Attachment fields have the following additional attributes in their field definitions:

* fileExtension - File name extension, such as ".json" or ".png". This includes the period.
* mimeType - MIME type, such as "application/json" or "image/png".

Example:

```json
{
  "name": "audio_audio.m4a",
  "fileExtension": ".m4a",
  "mimeType": "audio/m4a",
  "required": true,
  "type": "attachment_v2"
}
```

While MIME type and file extension don't affect the researcher's ability to download the data, having the correct MIME type and file extension provide "quality of life" improvements for apps that expect it.

The file extension is used to help ensure the resulting file has a reasonable file extension. For example, the uploaded file and field name is audio\_audio.m4a, but the file uploaded to Synapse will have the unique name audio\_audio-\[attachmentId\].m4a, where attachmentId is a server-generated unique identifier.

### Multiple Choice

For ease of parsing, multi\_choice fields (multiple choice questions that allow multiple selections), are exported to Synapse as a series of booleans, one for each possible answer. If the multiple choice question allows "other" as a freeform text answer, this "other" answer is written as a string in a separate field.

For example: Let's suppose you have a multiple choice question with ID "sports" that asks "What sports do you play?" and the pre-defined answers are "fencing", "football", and "swimming". The user submits answers [ "fencing", "swimming", "ballet" ]. This would render in Synapse as

|sports.fencing|sports.football|sports.swimming|sports.other|
|---|---|---|---
|true|false|true|ballet|

To configure this in your schema, you would need to specify the following fields:

* multiChoiceAnswerList - A list of pre-defined expected answers for this multiple choice question.
* allowOtherChoices - True if the "other" field should be generated. False otherwise.

In our specific example, this looks like

```json
{
  "name": "sports",
  "multiChoiceAnswerList": [ "fencing", "football", "swimming" ],
  "allowOtherChoices": true,
  "required": true,
  "type": "multi_choice"
}
```

### Strings

By default, strings have a max length of 100 characters. Values longer than this are truncated. (Note: This applies not just to strings, but also to inline\_json\_blob and single\_choice.)

To configure this, you can use the "maxLength" attribute, which can be set as low as 1 character or as high as 1000 characters. (Note: SQL limits rows to 65,535 bytes, so you should avoid having too many large string.)

If you need strings larger than 1000 characters, or you need lots of them, use the "unboundedText" field. If set to true, this exports the string using Synapse's LargeText type instead of String and allows strings much larger than 1000 characters. (Note: LargeText fields in Synapse cannot be queried.) (Note: Due to DynamoDB's 400kb row size limitation, it is not recommended to use unboundedText for fields larger than 10kb. If you regularly need strings larger than 10kb, consider using attachment\_v2 instead.)

Examples

```json
{
  "name": "foo",
  "maxLength": 640,
  "required": true,
  "type": "string"
}

{
  "name": "bar",
  "unboundedText": true,
  "required": true,
  "type": "string"
}
```

## Reserved Keywords

Schema fields cannot use the following names (case-insensitive):

* row_etag
* row_id
* row_version

## Updating Schemas

A schema revision can only be updated if the changes are backwards compatible. Changes that are considered backwards compatible include:

* Schema name change.
* min/maxAppVersion changes (see below).
* Adding or re-ordering fields.
* Upgrading a field from a legacy attachment field (blob, csv, json\_blob, or json\_table) to attachment\_v2 (but not vice versa).
* Converting an int to a float (but not vice versa).
* Converting a numeric type (int or float) to an inline\_json\_blob.
* Converting a constrained string type (calendar\_date, float, inline\_json\_blob, int, time\_v2) to an unconstrained string (single\_choice, string), but not vice versa.
* Converting between unconstrained string types (single\_choice or string).
* Converting an int into a timestamp (but not vice versa).
* Increasing the max length of a string (but not beyond 1000 characters).
* Flipping required from true to false and vice versa.
* Attachment metadata, such as fileExtension and mimeType.
* Adding fields to multiChoiceAnswerList.
* Flipping allowOtherChoices from false to true (but not vice versa).

All other field changes are not compatible and require cutting a new schema revision. Common updates that are not compatible are (this is not an exhaustive list):

* Changing the schema type (from ios\_survey to ios\_data or vice versa).
* Deleting a field.
* Any other field type change.
* Decreasing the max length of a string.
* Flipping unboundedText from false to true or vice versa.

## Choosing Schema Fields

Because schemas have a field limit (see [Limits](#limits) below), you may need to be selective what fields go into a top-level schema field. We recommend that you define schema fields only in the following cases:

1. The field is important metadata, such as task run IDs.
2. The field is commonly used for queries or dashboards, such as demographic information.

For all other data in the participant's health data upload, you should define entire files as schema fields (eg for key-value pairs or sensor data), or be consumed from the rawData column.

**NOTE:** Currently, all schemas must have at least one field.

## Limits

Schemas cannot create more than 100 columns or a row larger than 50000 bytes. Note that the row size is calculated by how much space has to be allocated to store the row, not how much space is actually being used by individual rows. Also note that this includes only fields defined by schema field definitions. Bridge will automatically create other columns as specified in [Exporting to Synapse](exporting_to_synapse.html) that don't count against this limit.

See the table below to determine the number of columns and bytes for each schema field type.

|Field Type|Columns|Bytes|
|---|---|---|
|attachment\_v2|1|20|
|boolean|1|5|
|calendar\_date|1|30|
|float|1|23|
|inline\_json\_blob|1|3 bytes per character, 3000 for unbounded|
|int|1|20|
|large\_text\_attachment|1|3000|
|multi\_choice|1 for each possible answer, plus 1 if allowOtherChoices is true|5 for each possible answer, plus 3000 if allowOtherChoices is true|
|single\_choice|1|3 bytes per character, 3000 for unbounded|
|string|1|3 bytes per character, 3000 for unbounded|
|time\_v2|1|36|
|timestamp|2|35|

## Advanced Schema Attributes

### min/maxAppVersion

You can configure min- and maxAppVersions per OS for a given schema. This allows the scheduler to auto-specify which schema revision to vend to the user. The OS is a string (generally "Android" or "iPhone OS") and the app version is an integer (which should be monotonically increasing with each release). For example

```json
{
  "Android": 4,
  "iPhone OS": 27
}
```

### moduleId/Version

Schemas can be linked to [Shared Modules](shared_modules.html). You generally don't need to specify these yourself. Rather, Bridge will automatically populate these when you import a Shared Module into your study. moduleId is the unique string identifier of the module. moduleVersion is an integer and refers to the module's version.

### surveyGuid/CreatedOn

Schemas can be linked to a Survey. You generally don't need to specify these yourself. Rather, Bridge will automatically create a schema from a survey when you publish the survey, and will fill in the surveyGuid (string) and surveyCreatedOn (ISO8601 timestamp) automatically.
