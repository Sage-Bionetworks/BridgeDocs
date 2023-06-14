---
title: Participant study adherence 
layout: article
---

{% include v2.html %}

<div id="toc"></div>

## Adherence Records

The third and final part of the Bridge scheduling system are [`AdherenceRecords`](/model-browser.html#AdherenceRecord). These records support schedule state management on mobile clients, and they are the basis for adherence reporting to study administrators. 

This collection of records is *sparse;* if the participant does not do a scheduled session or assessment, there will not be a record for that session or assessment in the set of records. Furthermore, these records are persisted by the client, so they will only exist if the client updates the server on the current state of timeline performance. 

### Updating adherence records and persistent time windows

Clients are expected to update the *assessment* adherence records. The server will create and/or update *session* adherence records based on the state of the assessments in each occurrence of a session. The server manages the `startedOn`, `finishedOn`, and `declined` fields:

- The `startedOn` timestamp will be set to the earliest `startedOn` timestamp of any assessment in that session instance once any assessment is started; 
- The `finishedOn` timestamp will be set to the latest `finishedOn` timestamp of any assessment in that session instance, when all the assessments are finished (unless any assessment in the session instance is declined, see below); 
- The `declined` boolean will be set to true if all the assessments in the session instance have been declined;
- Sessions with any number of `declined` or unstarted assessments will be left in the started but not finished state (and thus be out of compliance).

Clients can also submit *session* adherence records in order to update fields like `clientData` and `clientTimeZone`. For example, there may be state that is more accurately related to an entire session rather than individual sessions, that would most logically stored as `clientData` on a session instance adherence record.

An assessment adherence record would look like the following:

```json
{
  "instanceGuid":"7PVMTOm6ga4w3mGYudQFCg",
  "startedOn":"2020-05-10T10:32:12.937Z",
  "finishedOn":"2020-05-10T10:38:39.192Z",
  "eventTimestamp":"2020-05-09T16:43:33.431Z",
  "clientData": {
    "testResult": 100.23
  },
  "assessmentGuid": "D2DKsx9NOuZ8vGrT-yidhA",
  "type":"AdherenceRecord"
}
```

| Field | Req? | Description |
|-------|------|-------------|
| instanceGuid | Y | The `instanceGuid` of either a session or an assessment |
| eventTimestamp | Y | The timestamp of the event that triggered the timestream of this session or assessment. If the event is mutable, this timestamp will group separate performances of this portion of the timeline. |
| startedOn | Y | The timestamp reported from the client when the assessment or session was started. |
| finishedOn | N | The timestamp reported from the client when the assessment or session was ended by the user. _Do not set this value if the assessment or session eventually expires without being finished by the user._ |
| clientData | N | An arbitrary JSON object that the client can use to store further information about the assessment or session, its state, display information, etc. |
| clientTimeZone | N | The time zone in which the assessment was performed (behavior is not specified if the time zone changes between the start and end of an assessment, but the field can be updated after it is set). |
| declined | N | If this is an assessment record, whether or not the user declined to perform the assessment when prompted, or during the assessment itself. If this is a session record, whether or not all assessments in the session were declined. |
| assessmentGuid | N | The assessment GUID (*not* the assessment instance GUID...that will be in the `instanceGuid` field) if this record represents an assessment. This is filled out by the Bridge server so that clients can use it look up information about the session in the `Timeline` object. |
| sessionGuid | N | The session GUID (*not* the session instance GUID...that will be in the `instanceGuid` field) if this record represents a session. This is filled out by the Bridge server so that clients can use it look up information about the session in the `Timeline` object. |
<div style="display:none">
| uploadedOn | N | The timestamp (from the server) when we record an associated upload has been finished for this assessment or session. |
</div>

Adherence records are specific to a participant in a given study. However, persistent time windows (where a user is allowed to perform a set of assessments as many times as they want within the time window) change the behavior of adherence records in some subtle ways.

The primary key for assessments scheduled through non-persistent time windows includes the `instanceGuid`  and the `eventTimestamp`. For a scheduled assessment in a given event time stream, there can be only one adherence record. The primary key for assessments scheduled through persistent time windows includes the `instanceGuid`, `eventTimestamp`, and `startedOn` value of the record, so such a scheduled assessment can produce more than one adherence record.

So while all state fields in a non-persistent time window adherence record can be updated by resubmitting the record with different values, the `startedOn` field in a persistent time window adherence record, when it is changed in this manner, will simply create a new adherence record. Because changing timestamps in adherence records is mostly needed when developing and testing mobile clients, we recommend in this situation that you delete an adherence record before recreating it.

Once assessment records start to be added or updated for a session, the server will update the session record’s `startedOn`, `finishedOn`, or `declined` values in the following manner:

1. When any assessment in a session is started, and the session has not been started, the session will be started with the earliest `startedOn` assessment value in the session;
1. When all assessments in a session are finished, and the session has not been finished, the session will be finished with the latest `finishedOn` assessment value in the session;
1. If all assessments in a session are declined, and the session has not been declined, the session will be marked as declined.

If a session adherence record does not exist, one will be created to record this information.

To prevent overwriting user-submitted values, **once these session fields are set, the server will not update them again.** For example, if an assessment updated with an earlier `startedOn` timestamp, the session will not reflect it, or if a `finishedOn` timestamp is updated after all assessments in a session have been finished, this will not be reflected in the session. To change the session record, update the session record directly. For example, you might always submit the session record with null `startedOn`, `finishedOn` and `declined` fields if you want the server to check and update these values with every state change.

### Querying for adherence records

The [adherence record query API](/swagger-ui/index.html#/Study%20Adherence/searchForStudyParticipantAdherenceRecords) and [adherence record query for participants API](/swagger-ui/index.html#/Study%20Adherence/searchForAdherenceRecords) allows for a wide variety of filters to be applied when searching for the adherence records a participant (records are always scoped to a participant in a particular study). The [study-scoped adherence record query API](/swagger-ui/index.html#/Study%20Adherence/searchForAdherenceRecordsForStudy) allows study administrators to search across all the adherence records for all participants in a study.

Here is an example of the search object:

```json
{
  "instanceGuids":["dAGKM4nN39cDbyADic_bDNXs"],
  "assessmentIds":[],
  "sessionGuids":[],
  "timeWindowGuids":[],
  "adherenceRecordType":"session",
  "includeRepeats":true,
  "currentTimestampsOnly":true,
  "eventTimestamps":{
    "clinic_visit":"2015-01-26T23:38:32.486Z"
  },
  "startTime":"2015-01-26T23:38:32.486Z",
  "endTime":"2015-01-27T01:38:32.486Z",
  "offsetBy":0,
  "pageSize":100,
  "sortOrder":"asc",
  "type":"AdherenceRecordsSearch"
}
```

###### AdherenceRecordSearch
| Field | Req? | Description |
|-------|------|-------------|
| instanceGuids | N | Session or assessment instance GUIDs. Any records that exist with these GUIDs will be returned (scoped to a specific participant in a specific study). If the assessment is a persistent assessment, all adherence records for that assessment will be returned unless includeRepeats is false. This array cannot contain more than 500 items. |
| assessmentIds | N | Return adherence records for assessments with these IDs (the assessment ID is used to define a type of assessment). This array cannot contain more than 500 items. |
| sessionGuids | N | Return adherence records for sessions with these GUIDs (this is the session’s GUID in a schedule and not an instance GUID, and is used to define a type of session). This array cannot contain more than 500 items. |
| timeWindowGuids | N | Return adherence records for assessments in these time windows (using the time window’s GUID in a schedule to define a type of time window). This array cannot contain more than 500 items. |
| adherenceRecordType | N | The `AdherenceRecordType` can be used to limit search results for adherence records to either `assessment` or `session` records. If not present, both records will be returned according to the criteria of the search. |
| includeRepeats | N | Where an assessment can be performed multiple times under an instance GUID, all records will be returned unless this flag is set to true. In this case, the first or last record only will be returned (depending on sort order). |
| currentTimestampsOnly | N | Where a time series can be performed multiple times because a session’s trigger event is mutable, all records will be returned, unless this flag is set to true. When true, only records with recent event timestamp values will be returned. This is equivalent to sending back the user’s entire map of current event ID timestamp values via the `eventTimestamps` map in this search object. If values are also provided in the `eventTimestamps` map, each of those event IDs will override its associated event ID timestamp value, as it is provided by setting this flag to true. |
| eventTimestamps | N | A mapping of event IDs to timestamp values to use when retrieving adherence records that are from sessions triggered by that ID. Only records with that exact timestamp value in their `eventTimestamp` field will be returned. In general, mobile clients will only want to retrieve records for current timestamp values when calculating schedules, so the `currentTimestampsOnly` flag provides an easy way to request that all current timestamps be used to limit search results. This map cannot contain more than 50 entries. |
| eventTimestampStart | N | Return records where the `eventTimestamp` value of the record is on or after the timestamp provided. This is an ISO8601 formatted date time. If eventTimestampStart is specified, so must eventTimestampEnd. |
| eventTimestampEnd | N | Return records where the `eventTimestamp` value of the record is before the timestamp provided, but not on. This is an ISO8601 formatted date time. If eventTimestampEnd is specified, so must eventTimestampStart. |
| startTime | N | Limit search results to records with `startedOn` values that are equal to or later than this start time (no earlier than January 1st, 2020). |
| endTime | N | Limit search results to records with `startedOn` values that are equal to or earlier than this end time (no later than January 1st, 2120). |
| declined | N | Return only assessments and/or sessions that have been declined (`true`), return only assessments and/or sessions that have not been declined (`false`) or ignore the `declined` flag on records if no value is set.
| offsetBy | N | The next page start offset for pagination.  |
| pageSize | N | The maximum number of records in each returned page. Range can be from 1-500 records. |
| sortOrder | N | Either `asc` (sort so that the earliest startedOn time is the first record in the returned list) orLimit search results to records with `startedOn` values that are equal to or earlier than this end time (no later than January 1st, 2120).  `desc` (sort so that the most recent startedOn time is the first record in the returned list). |
| uploadId | N | Search for a specific upload ID. |
| hasMultipleUploadIds | N | Boolean value. If true, then return only adherence records associated with multiple upload IDs. If set to true, both eventTimestampStart and eventTimestampEnd must be specified. Defaults to false. |
| hasNoUploadIds | N | Boolean value. If true, then return only adherence records associated with no upload IDs. If set to true, both eventTimestampStart and eventTimestampEnd must be specified. Defaults to false. |

If none of these search values are set, all records will be returned.

To see how these search options can be used to retrieve different useful subsets of the adherence data, it helps to look at a concrete example of some data as it could be collected from a sample schedule. In the following examples, we will work with data that was collected as a result of the following [example-timeline.json](./example-timeline.json):

{% include image.html url="/images/adherence-examples/01-timeline.svg" 
  description="An example timeline" %}

**Session 1** starts with enrollment, and has two time windows which create two session instances every 3 days (after a 2 day delay). Both sessions include only Assessment A, but the afternoon session is *persistent,* so the user can perform the assessment as many times as they want in the session’s window.

**Session 2** is triggered by an event (the client or some other API consumer creates or updates the `custom:trigger` event). Each time this event timestamp is added or updated on the server, the app will ask for Assessment A and then Assessment B on a weekly schedule. This time series can occur more than once, because `custom:trigger` is a mutable event, and will then go for the duration of the study, which is four weeks. So these timelines can extend beyond the end of the earliest timestamp (such as enrollment). Each sequence can be differentiated from the others because the instances will be grouped by the same `eventTimestamp` value.

**Session 3** creates one time window that never expires, with an assessment that is persistent. In effect, the participant can do Assessment B whenever they like.

Given this timeline, here is one potential set of data that could be collected for a user who was very diligent in completing their scheduled sessions:

{% include image.html url="/images/adherence-examples/02-adherence-data.svg" 
  description="Adherence data from the the demonstration timeline" %}

There are a few things of note in this data set:

1. On May 18th and May 27th, the participant did their afternoon Session #1 assessment more than once;
2. On May 18th, the `trigger` event started Session #2 and a sequence of four sessions. Then on September 3rd, the event timestamp was updated, and the participant was prompted to complete the four sessions of Session #2 again, under a different event timestamp;
3. The participant did Assessment B as part of Session #3 a total of five times. These differ only in their `createdOn` timestamps.

<div class="ui compact warning icon message">
  <i class="exclamation triangle icon"></i>
  <p style="margin:0">Note that Session #2 is started on September 3rd, which is well after 21 days after the <code>enrollment</code> timestamp. Because Bridge has no notion of a definitive end date for a study for a given participant, the system does not currently prevent this. If the participant’s event timestamps are updated, this will trigger scheduling behavior. The example above is also useful for illustrating the search and filtering API for adherence records.</p>
</div>

Given this data set, let’s look at the options for how to retrieve these records through the adherence APIs.

#### By instance GUIDs

Querying by instance GUID is possible, but not as useful as it might appear since instance GUIDs can be repeated in some circumstances.

```json
{
  "instanceGuids":[
    "pKUAWjp3Lt6MSQCotkHaeg",
    "PFLNzqgiSLiM1pVQLihG5A",
    "JX0ClGqZ-_KVz10x3LLFbA",
    "KUt0q5qvK5zfl1SwMBe-cA",
    "F-kbi5VXYqKIw7BdrQGRgQ",
    "Ca353c2ZH7d4Dlrs4LvLBw",
    "tZNpSCQhD18wy0UricUOBA"
  ],
  "type": "AdherenceRecordsSearch"
}
```

Would retrieve the following records:

{% include image.html url="/images/adherence-examples/03-query-for-sessions-and-assessments-by-instance-ids.svg" %}

These results might not be entirely satisfactory since the consumer may have wished to address specific records in specific time streams, or specific records in a stream of persistent assessments. In this case, search criteria can be refined, or the client can use a more specific format for addressing record instances that incorporates the `startedOn` value of the record into the instance GUIDs:

```json
{
  "instanceGuids":[
    "pKUAWjp3Lt6MSQCotkHaeg@2020-05-12T10:13:38.345Z",
    "PFLNzqgiSLiM1pVQLihG5A@2020-05-18T18:45:02.569Z",
    "JX0ClGqZ-_KVz10x3LLFbA@2020-05-27T08:10:32.931Z",
    "KUt0q5qvK5zfl1SwMBe-cA@2020-05-25T13:01:23.456Z",
    "F-kbi5VXYqKIw7BdrQGRgQ@2020-06-01T13:16:28.982Z",
    "Ca353c2ZH7d4Dlrs4LvLBw@2020-09-24T20:34:12.673Z",
    "tZNpSCQhD18wy0UricUOBA@2020-05-20T18:12:03.915Z"
  ],
  "type": "AdherenceRecordsSearch"
}
```

This pulls up more specific records, but at the cost of needing to know the `startedOn` values of these records:

{% include image.html url="/images/adherence-examples/03a-targeting-instances-by-startedOn.svg" %}

<div style="display:none">
Finally, instance identifiers can be created by the client that the Bridge system will recognize and instance GUIDs.

For session instances, the format is:

“*scheduleGuid*`:`*sessionGuid*`:`*startDay*`:`*windowGuid*”

For assessment instances, the format is:

“*scheduleGuid*`:`*sessionGuid*`:`*startDay*`:`*windowGuid*`:`*assessmentGuid*`:`*assessmentPositionNumber*”

Because an assessment could be included more than once in a session time window, the “assessmentPositionNumber” is the number of the occurrence of an assessment in the window, beginning at 1 (outside of the edge case of repeating a specific assessment, this is just “1”).
</div>

#### By assessment IDs

A query can retrieve records for an assessment type, as indicated by its ID, regardless of where those assessments were prompted for in the timeline. The identifier will apply to both shared and local assessments in a schedule. If you wish to differentiate between these assessments, you will need to change the assessment ID of the local (app-specific) assessment.

```json
{
  "assessmentIds": [
    "assessment-a"
  ],
  "adherenceRecordType":"assessment",
  "type": "AdherenceRecordsSearch"
}
```

Retrieves the following records:

{% include image.html url="/images/adherence-examples/04-query-for-assessments-by-id.svg" %}

#### By session GUIDs

A query can retrieve all session instances of the same type by searching for the GUID of the session they were created from:

```json
{
  "sessionGuids": [
    "oGO1ojQte74bEm_Ph8XZEA3z"
  ],
  "type": "AdherenceRecordsSearch"
}
```

Retrieves the following records:

{% include image.html url="/images/adherence-examples/06-query-for-session-guids-with-assessments.svg" %}

By changing the `adherenceRecordType` flag you can limit these results to just the session or assessment records:

```json
{
  "sessionGuids": [
    "oGO1ojQte74bEm_Ph8XZEA3z"
  ],
  "adherenceRecordType":"session",
  "type": "AdherenceRecordsSearch"
}
```

Retrieves the following records:

{% include image.html url="/images/adherence-examples/05-query-for-session-guids.svg" %}

#### Get latest records only

Sessions with mutable events present a challenge for mobile clients. Once the time series has been performed by a participant, the timestamp can be updated, but the client will still receive the adherence records for the older time series, making it appear that the participant has completed the session. To prevent this, the client can send the current event timestamps to the server, and only records that were tied to that event timestamp will be returned:

```json
{
  "sessionGuids": [
    "oGO1ojQte74bEm_Ph8XZEA3z"
  ],
  "eventTimestamps": {
    "trigger": "2020-09-03T14:23:32.452Z"
  },
  "type": "AdherenceRecordsSearch"
}
```

This returns only the most recent set of records. If there are no records returned for the given timestamp, the client knows the session series should be performed again.

{% include image.html url="/images/adherence-examples/07-query-for-sessions-and-assessments-most-recent-timestream-only.svg" %}

**To make this query simpler, the client can also set the `currentTimestampsOnly` flag to true,** which will use all the current event timestamp values that are known to the server to filter this query. The only issue with using this flag over the explicit timestamps would be a case where the client and the server are not in sync with one another.

#### By time window

To find the performance of one time window in a session, you can refere to the time window’s GUID (note: this is not currently in the `Timeline`, only the `Schedule`, but it will be added):

```json
{
  "timeWindows": [
    "Z39tJejSi_P70vjjcBVuWk36"
  ],
  "adherenceRecordType": "assessment",
  "type": "AdherenceRecordsSearch"
}
```
Retrieves the following records:

{% include image.html url="/images/adherence-examples/08-query-for-assessments-by-timewindow.svg" %}

Repeat assessments can be removed with the `includeRepeats` flag:

```json
{
  "timeWindows": [
    "Z39tJejSi_P70vjjcBVuWk36"
  ],
  "includeRepeats": false,
  "adherenceRecordType": "assessment",
  "type": "AdherenceRecordsSearch"
}
```

Retrieves the following records:

{% include image.html url="/images/adherence-examples/09-query-for-assessments-by-timewindow-no-repeats.svg" %}

#### By time range

Queries can ask for records within a given time range (the values returned are based on the `startedOn` value of the records):

```json
{
  "startTime": "2020-05-10T01:14:38.451Z",
  "endTime": "2020-05-17T16:57:01.196Z",
  "adherenceRecordType": "assessment",
  "type": "AdherenceRecordsSearch"
}
```

{% include image.html url="/images/adherence-examples/10-query-for-assessments-by-time-may-10-17.svg" %}

#### By Upload IDs

To get all adherence records associated with an upload, you can use the `uploadId` field:

```json
{
  "uploadId": "FRV1VReEy_HzeF7RdFZImqTq",
  "type": "AdherenceRecordsSearch"
}
```

If you want to get all adherence records that are associated with multiple upload IDs, you can use the `hasMultipleUploadIds` flag. If you use this flag, you will need to specify both `eventTimestampStart` and `eventTimestampEnd`:

```json
{
  "eventTimestampStart": "2020-05-10T01:14:38.451Z",
  "eventTimestampEnd": "2020-05-17T16:57:01.196Z",
  "hasMultipleUploadIds": true,
  "type": "AdherenceRecordsSearch"
}
```

Similarly, if you want to get all adherence records that are associated with _no_ upload IDs, you can use the `hasNoUploadIds` flag. This flag also requires both `eventTimestampStart` and `eventTimestampEnd`:

```json
{
  "eventTimestampStart": "2020-05-10T01:14:38.451Z",
  "eventTimestampEnd": "2020-05-17T16:57:01.196Z",
  "hasNoUploadIds": true,
  "type": "AdherenceRecordsSearch"
}
```

### Post-Processing Attributes

If your study has a post-processing pipeline, you may want to record post-processing status and other information on adherence records. To do so, you will need

* Bridge account with the developer, researcher, study coordinator, or study designer role with access to the study
* study ID
* participant's health code
* instance Guid
* event timestamp
* assessment startedOn

The last 4 items on that list can be found as annotations in exported Synapse files, or object metadata in exported S3 files, under the names healthCode, instanceGuid, eventTimestamp, and startedOn respectively.

Bridge provides a special API to write only these post-processing attributes to the adherence record and nothers. This way, your post-processing pipeline doesn't have to worry about any attributes outside of post-processing.

To call this API, send an HTTP POST to `/v5/studies/{studyId}/participants/healthcode:{healthCode}/adherence/{instanceGuid}/{eventTimestamp}/postprocessing` (or use your platform's SDK). Example request body:

```json
{
  "postProcessingAttributes":{
    "arbitrary-key":"arbitrary value"
  },
  "postProcessingCompletedOn":"2023-06-08T12:34:56.789Z",
  "postProcessingStatus":"in_progress",
  "startedOn":"2023-06-06T22:59:27.308Z"
}
```

|Attribute Name|Description|
|---|---|
|postProcessingAttributes|Any arbitrary key-value pairs, specific to your post-processing pipeline. Maximum size 65k.|
|postProcessingCompletedOn|ISO 8601 for when the post-processing step was completed. Exact semantics depend on your post-processing pipeline.|
|postProcessingStatus|Short string that represents the current status of the upload in the post-processing pipeline. This may be specific to your pipeline. Examples include: "Pending", "SchemaVerified", "SchemaVerificationFailed", "DataInParquet", "DataScored". Must be 255 characters or less.|
|startedOn|When the adherence was started by the participant, used to disambiguate for persistent tasks. This is optional, and if not specified, one will be generated.|

Attributes written this way will appear on Adherence records through any other Adherence API.

## Adherence Reports

Bridge provides APIs for a few reports summarizing the adherence of study participants. These reports only report on the state of session instances in the schedules of one or more participants. There are no reports of assessment-level adherence data.

<div class="ui icon message">
  <i class="circle info icon"></i>
  <p style="margin:0">Adherence is defined as the number of sessions that are <code>completed</code>, divided by the number of sessions that are <code>unstarted</code>, <code>started</code>, <code>completed</code>, <code>abandoned</code>, <code>expired</code> or <code>declined</code>. The states <code>not_applicable</code> and <code>not_yet_available</code> are not counted against study participant adherence. Different reports measure adherence for different time periods of the study.</p>
</div>

Because adherence reports contain a lot of information copied from the study schedule, we refer you to the [object browser](/model-browser.html) for full documentation; here we only describe fields in the reports that are unique to these reports.

### Participant adherence reports

These reports are for a specific participant in the study.

#### Event Stream Adherence Report

The [EventStreamAdherenceReport](/model-browser.html#EventStreamAdherenceReport) is an intermediate data structure that is calculated for use in other reports. It is available through both [client-facing APIs](/swagger-ui/index.html#/Study%20Adherence/getUsersStudyParticipantEventStreamAdherenceReport) and [study coordinator APIs](/swagger-ui/index.html#/Study%20Adherence/getStudyParticipantEventStreamAdherenceReport) should it prove useful for creating other kinds of adherence reports.

###### [EventStreamAdherenceReport](/model-browser.html#EventStreamAdherenceReport)
| Field | Req? | Description |
|-------|------|-------------|
| adherencePercent | Y | The percentage of all actionable sessions for the entire study that have been successfully completed by the participant, not including sessions that are available but not yet finished. |
| dayRangeOfAllStreams | Y | The earliest date and the latest date across all streams in the report. |
| progression | Y | An enumeration indicating whether the schedule is `unstarted`, `in_progress` or `done` for this participant. |
| streams | Y | An array of `EventStream` objects |

The [`EventStream`](/model-browser.html#EventStream) objects map a set of activities to a particular “day since event N,” measuring the duration from the timestamp of the `startEventId` of the stream to the current day when the report is being generated (this date can be modified via the API call, though if it is not provided, the server uses the current time).

###### [EventStream](/model-browser.html#EventStream)
| Field | Req? | Description |
|-------|------|-------------|
| startEventId & eventTimestamp | Y | As with adherence records, each stream is defined by a `startEventId` *and* the timestamp of that event. The latest timestamp (the last sent to the server for the event, not necessary the latest timestamp chronologically) is always used for the event stream adherence report. |
| daysSinceEvent | Y | The number of days from the event (the `eventTimestamp`) to “today” (in the local time zone of the participant, or the time zone of the study, or UTC, depending on what is known to Bridge). |
| studyBurstId & studyBurstNum | N | If the start event ID is a study burst event (e.g. `study_burst:an-identifier:01`), this will be the ID of the study burst (“an-identifier”) and the number of the study burst in the full series of scheduled bursts (“01”). |
| byDayEntries | Y | This is a map from a day since the `eventTimestamp` to a list of sessions that will start on that day. |

The map of of `byDayEntries` maps a day since the event of the stream to an array of sessions that will start on that day. Each session is represented by a separate [`EventStreamDay`](/model-browser.html#EventStreamDay) object with these properties (the name of this object is unfortunate because there can be more than one of these objects in a day, but often enough there will only be one in the array). 

###### [EventStreamDay](/model-browser.html#EventStreamDay)
| Field | Req? | Description |
|-------|------|-------------|
| week | Y | *This field is always null in the event stream report.* |
| startDay | Y | The start day of this session (it should always be identical to the value of the day key of the `byDayEntries` mapping). |
| startDate | Y | The actual date for this participant on which this day falls. |
| timeWindows | Y | An array of [`EventStreamWindow`](/model-browser.html#EventStreamWindow) objects |

The event stream window objects describe *when the session ends* and *what the state of the session is for this participant.*  That is because different windows define discrete session instances with different scheduling:

###### [EventStreamWindow](/model-browser.html#EventStreamWindow)
| Field | Req? | Description |
|-------|------|-------------|
| state | Y | The [`SessionCompletionState`](/model-browser.html#SessionCompletionState) of this session. |
| endDay | Y | The day in the event stream when this window ends. |
| endDate | Y | The actual date for this participant on which this window will end. Because this is an adherence report, specific time-of-day information is not included. |

#### Study Adherence Report

This is the main adherence report for a participant, which shows overview of a participant’s adherence to the entire protocol of a study. (The event stream report is normalized into one stream of activities, based on the study’s `studyStartEventId`. Then those activities are broken down into weeks in the study.) It can be retrieved via the [study adherence report API](/swagger-ui/index.html#/Study%20Adherence/getStudyParticipantAdherenceReport). Study coordinators can view adherence in terms of what day in the study the participant is currently at. 

If events occur before the study’s `studyStartEventId,` the study adherence report will not break, but the participant will have sessions that occur before “Week 1” (that is, in “Week 0” or in negative weeks like “Week -2”). This indicates the study design is flawed insofar as the `studyStartEventId` is not the true start of the study for the participant.

###### StudyAdherenceReport
| Field | Req? | Description |
|-------|------|-------------|
| participant | Y | The participant this record is about (as an [`AccountRef`](/model-browser.html#AccountRef) object). |
| testAccount | Y | Is this participant a test account? |
| clientTimeZone | Y | The time zone that was used to generate this report (typically the participant’s `clientTimeZone`, but if this is not available the `studyTimeZone` of the study, or UTC). |
| dateRange | Y | The earliest date and the most recent date of the study adherence report, however, this range will always be extended (on either side) if needed so that the study start date for this participant is included in the range. |
| adherencePercent | Y | The percentage adherence achieves during the entire course of the study so far, by this participant. |
| progression | Y | The progression of the participant in the study (`unstarted`, `in_progress` or `done` with the study). |
| unsetEventIds | Y | If there are event IDs referenced in the study schedule that this participant does not have, they will be listed here. |
| unscheduledSessions | Y | If there are sessions that are scheduled by unset eventIds, they will be listed here by name. |
| eventTimestamps | Y | All timestamps that are referenced by the schedule and used to produce the adherence report are given here in a map from eventId, to the timestamp that is being used. |
| weeks | Y | The report is broken down into weeks from the start of the study for this participant. |

###### [StudyReportWeek](/model-browser.html#StudyReportWeek)
| Field | Req? | Description |
|-------|------|-------------|
| weekInStudy | Y | The week in the study. If this value is less than one, negative, some of the participant’s events started before the event marking the start of the study. This indicates a design flaw in the study, but it will not break adherence reporting. |
| startDate | Y | The date of the first day of this week. |
| adherencePercent | Y | The participant’s adherence to the protocol for this week (only). |
| rows | Y | These are objects describing labeling information for the Nth item in the lists of `EventStreamDays` for this week. Described further below. |
| byDayEntries | Y | This is a map from a day of the week (0-6) to a list of sessions that will start on that day. |

The row entries are [`WeeklyAdherenceReportRow`](/model-browser.html#WeeklyAdherenceReportRow) objects with information to display the `EventStreamDay` arrays in the `byDayEntries` map. The row object at index 0 describes the `EventStreamDay` at index 0 of the array, on every day of the week (where needed, empty day objects pad the arrays to maintain the correct index).

The `searchableLabel` field provides a string that can be used to filter the [weekly adherence reports API](/swagger-ui/index.html#/Study%20Adherence/getWeeklyAdherenceReports) to return only those participants who are in particular stages of the study. It is possibly to provide substrings of this `searchableLabel` to widen this search.

For example, the `searchableLabel` “:Session #2:Week 1:” will find all participants in week 1 of their session #2 work. You could also submit “:Session #2:” to find participants in any week where they are being asked to perform session #2 assessments. The colons are important to ensure correct substring matches (e.g. so you don’t get “Session #22” in your results).

#### Weekly Adherence Report

The [`WeeklyAdherenceReport`](/model-browser.html#WeeklyAdherenceReport) can be retrieved through the [weekly adherence report API](/swagger-ui/index.html#/Study%20Adherence/getWeeklyAdherenceReport) (only available to study administrators). It is similar to the [`StudyReportWeek`](/model-browser.html#StudyReportWeek) objects in the full study adherence report, but only the *current* week of that report is returned through this API. The `WeeklyAdherenceReport` also has some small differences. For example, it can be present for weeks that don't appear in the full adherence report at all, which can be sparse (it does not have weeks where the participant is not being asked to perform any assessments). In that case, the report may include information like the participant’s [`NextActivity`](/model-browser.html#NextActivity). As well, if the participant has sessions from prior weeks that are still available and unfinished, these will be present on Day 0 of the weekly adherence report.

###### [WeeklyAdherenceReport](/model-browser.html#WeeklyAdherenceReport)
| Field | Req? | Description |
|-------|------|-------------|
| participant | Y | The participant this record is about (as an [`AccountRef`](/model-browser.html#AccountRef) object). |
| testAccount | Y | Is this participant a test account? |
| clientTimeZone | Y | The time zone that was used to generate this report (typically the participant’s `clientTimeZone`, but if this is not available the `studyTimeZone` of the study, or UTC). |
| progression | Y | The progression of the participant in the study (`unstarted`, `in_progress` or `done` with the study). |
| weeklyAdherencePercent | Y | The percentage adherence achieves during this week of the study (in isolation). |
| weekInStudy | Y | The week of the study. |
| startDate | Y | The date of the first day in this week (day 0). |
| nextActivity | N | If the current week for the participant is a “fallow” week with no activities, the participant’s next activity will be indicated with a [`NextActivity`](/model-browser.html#NextActivity) record.
| rows | Y | These are objects describing labeling information for the Nth item in the lists of `EventStreamDays` for this week. Described further below. |
| byDayEntries | Y | This is a map from a day of the week (0-6) to a list of sessions that will start on that day. |

The row entries are [`WeeklyAdherenceReportRow`](/model-browser.html#WeeklyAdherenceReportRow) objects with information to display the `EventStreamDay` arrays in the `byDayEntries` map. The row object at index 0 describes the `EventStreamDay` at index 0 of the array, on every day of the week (where needed, empty day objects pad the arrays to maintain the correct index).

### Study-level reports

#### Weekly Adherence Reports

The weekly adherence reports can be retrieved for all participants via the paginated [weekly adherence reports API](/swagger-ui/index.html#/Study%20Adherence/getWeeklyAdherenceReports). This API returns a weekly adherence report for all active users in a study, and it has a number of search parameters in the API to adjust the results that are returned (most importantly, to find participants that are out of compliance with the study protocol).

The weekly adherence reports are generated one of three ways:

1. When a user calls for a participant’s entire study adherence report, their weekly adherence report is also calculated and persisted;
2. When a study administrator calls for a participant’s weekly adherence report, it is also calculated and persisted before being returned;
2. Bridge updates this record for every participant in a study at 4am and 11am in the local time zone set for that study (if no time zone is set for a study, the time zone used is Central Time in the United States), **if** the following conditions apply:
  - The study has a schedule and is in the `design`, `recruitment` or `in_flight` phase;
  - The participant has signed in at least once to the Bridge server.

The paged list of adherence for all users in their current week should be up-to-date as of the morning of the current day. It is important to not move your study to `completed` until you are certain all the participants are finished with the study, or you will lose adherence information.

#### Stats

Finally the [study adherence stats API](/swagger-ui/index.html#/Study%20Adherence/getAdherenceStatistics) provides summary information about study adherence for all participants in a study. Participants who have not started the study are not included in these reports. The `adherenceThresholdPercentage` will be set to the Study.`adherenceThresholdPercentage` value unless a different value is provided as a query parameter to the API. The number of participants at or above the threshold, and under it, will be returned in the `compliant` and `noncompliant` counts (these should equal the `totalActive` count).

The [`AdherenceStatisticsEntry`](/model-browser.html#AdherenceStatisticsEntry) array includes a count of participants at every unique moment in the study (e.g., Week 3 of a particular session). Because participants can be in more than one part of the schedule on a given week, these counts will likely be greater than the sum of the `totalActive` value.
