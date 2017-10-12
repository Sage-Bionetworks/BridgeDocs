---
title: Health Data Metadata
layout: article
---

<div id="toc"></div>

You can configure metadata fields on a study, which will be automatically applied to all schemas. This is useful for fields that should be global to all schemas, such as start- and endTimes or taskRunGuids.

This doc covers the configuring metadata and how metadata is exported to Synapse. For more details on how to submit metadat with your uploads, see the corresponding sections in the [Bundled Zip File Upload docs](bundled_zip_file_uploads.html#submitting-metadata) and the [Synchronous Health Data Submission docs](synchronous_health_data_submission.html#submitting-health-data).

## Configuring Metadata

Studies will have a new attribute called uploadMetadataFieldDefinitions, which are defined the same way as [schema field definitios](schemas.html#field-definitions). This can be edited either through the REST API or through the Bridge Study Manager. (Note: All metadata field definitions are implicitly optional. The "required" field in metadata field definitions is ignored.)

**IMPORTANT NOTE:** Once created, metadata fields cannot be deleted or modified except by an Bridge admin.

Example:

```json
{
  "name":"mPower",
  "identifier":"parkinson",
  ...stuff...
  "uploadMetadataFieldDefinitions":[
    {
      "name":"startDateTime",
      "type":"timestamp"
    },
    {
      "name":"endDateTime",
      "type":"timestamp"
    },
    {
      "name":"taskRunGuid",
      "type":"string",
      "maxLength":36
    }
  ]
}
```

## Metadata in Synapse

The Bridge Exporter will automatically create new columns in Synapse tables for each metadata field. The column will be named "metadata.[fieldName]". This name was chosen to (a) conform with Synapse column naming restrictions (b) to minimize potential conflicts with existing field names and (c) to be equally valid names for both the upload API and the synchronous API.

Our above example would be converted to the following example table fragment:

|metadata.startDateTime|metadata.endDateTime|metadata.taskRunGuid|
|---|---|---|
|2017-09-13T15:58:52.704-0700|2017-09-13T15:59:36.265-0700|d097a0cf-689d-4459-90f5-792b910229da|

(Note: Our example serializes the timestamp as an ISO8601 string for simplicity of the example. In actuality, Bridge exports timestamps as epoch milliseconds and timezone offset string as two separate columns.)

### Conflicts in Field Names

If for whatever reason, there is already a schema field named "metadata.[fieldName]", the field defined in the schema takes precedence over the metadata field. (This applies to both type and value.) A good way to remember this is "specific beats general".
