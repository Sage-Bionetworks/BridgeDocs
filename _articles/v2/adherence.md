---
title: Participant study adherence 
layout: article
---

{% include v2.html %}

<div id="toc"></div>

The third and final part of the Bridge scheduling system, [the adherence APIs,](/swagger-ui/index.html#/Adherence%20Records) support both schedule state management for mobile clients and adherence reporting for study administrators. Once a participant’s client has a timeline, it is able to interpret the set of [AdherenceRecord](/model-browser.html#AdherenceRecord) objects available for a participant.

This collection of records is *sparse;* if the participant did not do a scheduled session or assessment, there will not be a record for that session or assessment in the set of records. Furthermore, these records are persisted by the client, so they will only exist if the client updates the server on the current state of timeline performance. 

Clients are expected to update the assessment adherence records. The server will create and/or update session adherence records accordingly. The server manages the `startedOn`, `finishedOn`, and `declined` fields:

- The `startedOn` timestamp will be set to the earliest `startedOn` timestamp of any assessment in that session instance once any assessment is started; 
- The `finishedOn` timestamp will be set to the latest `finishedOn` timestamp of any assessment in that session instance, when all the assessments are finished (declining assessments will not cause the session to be reported as finished); 
- The `declined` boolean will be set to true if all the assessments in the session instance have been declined;
- Sessions with any number of `declined` or unstarted assessments will be left in the started but not finished state (and thus be out of compliance).

Clients can also submit session adherence records in order to update fields like `clientData` and `clientTimeZone`.

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
<div style="display:none">
| uploadedOn | N | The timestamp (from the server) when we record an associated upload has been finished for this assessment or session. |
</div>

## Updating adherence records

Adherence records are specific to a participant in a given study. However, persistent time windows (where a user is allowed to perform a set of assessments as many times as they want within the time window) change the behavior of adherence records in some subtle ways.

The primary key for assessments scheduled through non-persistent time windows includes the `instanceGuid`  and the `eventTimestamp`. For a scheduled assessment in a given event time stream, there can be only one adherence record. The primary key for assessments scheduled through persistent time windows includes the `instanceGuid`, `eventTimestamp`, and `startedOn` value of the record, so such a scheduled assessment can produce more than one adherence record.

So while all state fields in a non-persistent time window adherence record can be updated by resubmitting the record with different values, the `startedOn` field in a persistent time window adherence record, when it is changed in this manner, will simply create a new adherence record. Because changing timestamps in adherence records is mostly needed when developing and testing mobile clients, we recommend in this situation that you delete an adherence record before recreating it.

Once assessment records start to be added or updated for a session, the server will update the session record’s `startedOn`, `finishedOn`, or `declined` values in the following manner:

1. When any assessment in a session is started, and the session has not been started, the session will be started with the earliest `startedOn` assessment value in the session;
1. When all assessments in a session are finished, and the session has not been finished, the session will be finished with the latest `finishedOn` assessment value in the session;
1. If all assessments in a session are declined, and the session has not been declined, the session will be marked as declined.

If a session adherence record does not exist, one will be created to record this information.

To prevent overwriting user-submitted values, **once these session fields are set, the server will not update them again.** For example, if an assessment updated with an earlier `startedOn` timestamp, the session will not reflect it, or if a `finishedOn` timestamp is updated after all assessments in a session have been finished, this will not be reflected in the session. To change the session record, update the session record directly. For example, you might always submit the session record with null `startedOn`, `finishedOn` and `declined` fields if you want the server to check and update these values with every state change.

## Querying for adherence records

The adherence record API allows for a wide variety of filters to be applied to the adherence records for a participant (records are always scoped to a participant in a particular study). Here is an example of the search object:

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
| startTime | N | Limit search results to records with `startedOn` values that are equal to or later than this start time (no earlier than January 1st, 2020). |
| endTime | N | Limit search results to records with `startedOn` values that are equal to or earlier than this end time (no later than January 1st, 2120). |
| offsetBy | N | The next page start offset for pagination.  |
| pageSize | N | The maximum number of records in each returned page. Range can be from 1-500 records. |
| sortOrder | N | Either `asc` (sort so that the earliest startedOn time is the first record in the returned list) orLimit search results to records with `startedOn` values that are equal to or earlier than this end time (no later than January 1st, 2120).  `desc` (sort so that the most recent startedOn time is the first record in the returned list). |

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

### By instance GUIDs

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

### By assessment IDs

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

### By session GUIDs

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

### Get latest records only

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

### By time window

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

### By time range

Finally, queries can ask for records within a given time range (the values returned are based on the `startedOn` value of the records):

```json
{
  "startTime": "2020-05-10T01:14:38.451Z",
  "endTime": "2020-05-17T16:57:01.196Z",
  "adherenceRecordType": "assessment",
  "type": "AdherenceRecordsSearch"
}
```

{% include image.html url="/images/adherence-examples/10-query-for-assessments-by-time-may-10-17.svg" %}

## Transformations of the adherence data

Bridge provides some APIs to return adherence data in formats that may be more useful for dashboards. This data is not intended to be used to show summaries of compliance across participants—APIs or reports based on these views of the adherence data are forthcoming.