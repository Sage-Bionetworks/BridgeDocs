---
title: Scheduling
layout: article
---

*This is a v2 science API. These APIs are not yet complete or ready for production.*

<div id="toc"></div>

A `Schedule` can be defined by a study designer which describes what each participant in a study should be prompted to do over the entire course of that study. That schedule is converted into a `Timeline` for client apps, which provides detailed information on how to execute the schedule, as well as the information needed to properly annotate uploaded participant data so its context is preserved. Since each participant can start a study at a different time, this schedule is not described relative to calendrical dates, but instead relative to a set of *activity events* for a given user. 

## Activity Events

It is best to start with an example of what an activity event is. If a user enrolls on March 14th, 2021, and the study wishes to have the user take a test on a weekly basis, then over the course of the study, that individual will be prompted to do the test on March 14th, March 21st, March 8th, and so forth until the end of the study. If another user joins on May 1st, their activities would fall on May 1st, May 8th, May 15th, again until the end of the study. The *schedule* remains the same for both users, but it is calculated against a different date and time for each user’s `enrollment` event.

The server provides a number of fixed events that study designers can work with when building schedules. **Immutable** events cannot be updated once a value is written to the server. **Future update only** events can only be changed if the new timestamp being submitted is after the timestamp that is persisted on the server. And **mutable** events (which we will see below) have no restrictions and can be updated with any value.

| Event Name | Description | Behavior
|------------|----------------------|----------|----------|
| created_on | The timestamp of the moment an account is created. All accounts will have this event. | Immutable |
| enrollment  | The timestamp of a user’s consent signature, which marks the moment the participant has joined the study by self-enrolling. This event will only be available if the study uses Bridge’s electronic consent support. | Immutable |
| timeline_retrieved  | The timestamp of the first time the client requests the scheduled activities or timeline for a study. This event will only be available if the study uses Bridge’s scheduling support (either v1 or v2 when a timeline is requested). | Immutable |
| study\_start\_date | This event is the `activities_retrieved` event for the user if it exists, or else it is the `enrollment` event if it exists for the user, or else it is the `created_on` event for the user’s account. `study_start_date` is mutable in the sense that it may change if the events it is calculated from change, but otherwise it cannot be changed. All accounts will have this event. | Immutable |
|session:**guid**:finished| This event records the most recent time that a session instance derived from this session was marked as finished by the client. A participant will only have this value after they complete the first instance of this session, recording a `finishedOn` timestamp for the session instance.| Future update only |
|assessment:**identifier**:finished| This event records the most recent time that an assessment instance of this type was marked as finished by the client. It doesn’t matter in which session the assessment is found, so this timestamp can be updated by performing the same assessment as scheduled by different sessions. A participant will only have this value after they complete the first instance of this assessment, recording a `finishedOn` timestamp for the assessment instance.| Future update only |

All of these events are available to study administrators through [an API for activity events](/swagger-ui/index.html#/Activity%20Events). Global events (now deprecated, but originally scoped to an entire app context) are accessible through the `/v3/participants` and `/v1/activityevents` APIs. Study-scoped events are available through the `/v5/studies` APIs. These are now preferred since events like enrollment date will vary between studies.

### Custom events

In addition, app developers can define new *custom events* and *automatic custom events* for use by your application. These events are defined as part of the `App` configuration:

```json
{ 
  "customEvents": {
    "event1": "immutable",
    "event2": "future_only",
    "event3": "mutable"
  },
  "automaticCustomEvents": {
    "event4": "activities_retrieved:P13W",
    "event5": "enrollment:P-2W"
  }
  "type": "App"
}

```

Custom events can be given different behavior with respect to how they allow updates:

- **immutable** events can be set once, and then can never be changed. Requests to update the value will be silently ignored;
- **future_only** events can be set, and then after that, they can only be updated to a later date and time. If an earlier timestamp is sent, it is silently ignored;
- **mutable** events can be set and then later they can be changed to a different value, or deleted.

Once an event is defined, the client can send timestamps to be recorded on the server under the given event ID. 

Custom events are differentiated internally with a `custom:` prefix so they cannot conflict with system events. You do not need to include this prefix unless you have overridden an existing event ID. For example, the payload to update an event can be either:

```json
{
   "eventId":"enrollment",
   "timestamp":"2018-04-04T16:43:11.357-07:00"
}
```
or

```json
{
   "eventId":"custom:enrollment",
   "timestamp":"2018-04-04T16:43:11.357-07:00"
}
```

The first call would attempt to update the immutable system event `enrollment`, and would quietly fail; the second would attempt to update the custom `enrollment` event, subject to its update type. 

<div class="ui compact icon message" style="display: none">
  <i class="circle info icon"></i>
  <p>Why do these APIs return 201 even when the event is not updated? So clients that send requests to update a <code>forward_only</code> event do not receive errors if their requests are received out-of-order. This behavior can be changed to report 400 in the event of an error through the use of a query parameter (<code>reportFailure=true</code>).</p>
</div>

### Automatic custom events

In addition to submitting values through the API, an app can be configured to create calculated events from other event values, through the `automaticCustomEvents` mapping. This can be helpful when scheduling gets more complex, because you can create further timestamps to schedule against. The periods are given in the [ISO 8601 Date & Time Standard](https://en.wikipedia.org/wiki/ISO_8601#Durations) for *durations,* and negative durations are allowed. These events are updated when the events they depend upon are updated, and they inherit the same mutability as those events. 

In the `App` configuration, the key is the new event ID to generate, and the value is a calculated period of time before or after another event ID. For example:

```json
{ 
  "automaticCustomEvents": {
    "event1": "activities_retrieved:P13W",
    "event2": "enrollment:P-2W"
  }
  "type": "App"
}
```

In the example above, `event1` will be scheduled thirteen weeks after the `activities_retrieved` updates successfully, each time it occurs (it is a “future updates only” event), and `event2` will be scheduled two weeks before `enrollment` updates successfully, which can only occur once (it is immutable).

### Study-specific event APIs

Activity events initially assumed that there was one study in an app (hence, there is only one value for events like `enrollment`). The v2 activity event APIs (under `/v5/studies`) are similar to the v1 APIs, but they are *scoped* to a specific study. If the client uses these APIs, it can ask for events related to study 1 and study 2, and receive back different values for events like `enrollment`.

For backwards compatibility, study-scoped `enrollment`, `activities_retrieved`, and `created_on` events will also be created as global events. Since these values are immutable, they will only be created the first time any study triggers them (not necessarily the same study). For this reason, global events should be retired in favor of the events retrieved through study-specific APIs.

## Schedules

A schedule is owned by an organization and defines the overall duration of a study protocol (in days or weeks expressed as an [ISO 8601 Duration](https://en.wikipedia.org/wiki/ISO_8601#Durations)). Note that this duration is applied to each element of the schedule, known as a [Session,](/model-browser.html#Session) and these sessions do not necessarily all start at the beginning of a study. So the schedule duration may not be the absolute number of days that a study will run for any given participant.

Here is an example of the top-level JSON of a schedule:

```json
{
  "name":"An example schedule",
  "ownerId":"sage-bionetworks",
  "duration":"P4W",
  "guid":"YBxBQyfVdop4wmN0RMra4h7G",
  "createdOn":"2021-03-13T22:52:30.495Z",
  "modifiedOn":"2021-03-15T00:13:31.166Z",
  "published":false,
  "deleted":false,
  "sessions":[...sessions here...],
  "version":32,
  "type":"Schedule"
}
```

| Field | Req? | Description |
|-------|------|-------------|
| name  | Y | A name for the schedule to show study designers. Never shown to participants. |
| duration | Y | The duration of the sessions in the schedule, expressed in days or weeks only (though these can be mixed).<br><br>No single series of scheduled sessions can run longer than this duration. If all the sessions in a schedule start at the beginning of the study, this duration should be the calendar duration of the study as it is actually performed by participants. **However, if events can be triggered later in the study, then those time series can themselves be of the given duration.** It is up to study designers to determine if this is acceptable, or if the design needs to be adjusted to more strictly limit the actual time it will take to complete the study. |
| ownerId | — | The ID of the organization that owns this schedule. Unless the caller is an admin (who can set any organization), this will be the caller’s organization. It’s set by Bridge when the caller creates a new schedule. |
| published | — | If true, this schedule has been published and can no longer be updated. Schedules should be published before they are used in production. If they are not, researchers may not be able to recover information about scheduling context for participant study data.  |
| deleted | — | Is the schedule logically deleted? It will no longer appear in lists of schedules (unless deleted items are included with a query parameter), though it can still be retrieved through the API. |
| clientData | N | An optional JSON payload that can be used to store arbitrary information with the schedule, usually information for UI or authoring tools (the `clientData` information is not copied over to the `Timeline` that is sent to a participant). |
| sessions | N | Described below (a schedule must contain at least one session). |
| version | Y | An optimistic lock for this schedule. When updating an existing schedule, this value must be returned as part of the schedule. If it has been modified since retrieval, the server will return a 409 (Conflict) response and the schedule will not be updated. |

### Sessions

The schedule in turn contains a number of `Session` objects that do the real work of defining a schedule. The session JSON is large, but it can be broken into three major parts.

First, each session defines a stream of activities that should be scheduled, starting with the time of a specific event (the `startEventId`). For example if the event were `enrollment` in a study, then the session would define one or more activities to perform in terms of “N days since enrollment.” If the event were a custom event named `clinic_visit`, then the activities would be defined in terms of “N days since `clinic_visit`.”

In this same JSON for a session, the event is `enrollment` (the time when the participant signs a consent on Bridge):

```json
{
  "name":"Weekly Tapping Test",
  "labels":[
    {
      "lang":"en",
      "value":"Let's get tappin’!",
      "type":"Label"
    }
  ],
  "guid":"my7oqQBok40EhlinRYFke0k1",
  "startEventId":"enrollment",
  "delay":"P1W",
  "interval":"P1W",
  "timeWindows":[...time windows here...],
  "type":"Session"
}
  ```

| Field | Req? | Description |
|-------|------|-------------|
| name | Y | A name for the session to display in study design tools. The name will be included in a `Timeline` and will be used as the default value if no other label can be found to display to participants. |
| labels | N | An array of Label objects. The `lang` property is required and must be a valid ISO 639 alpha-2 or alpha-3 language code specifying the language of the label. The array cannot contain two labels with the same language code. The `value` is required, and should contain the label in the given language. <br><br>When returning a `Timeline` to a client, the caller’s languages will be used (in order of preference) to select a `Label` in that language. If this fails, the `en` language `Label` will be used as a default. If that also does not exist, the session name will be used as the label. |
| startEventId | Y | An activity event ID (described above) from which the activities in this stream will be calculated. |
| delay | N | If absent, the first activity of this session will occur the moment the client finds the `startEventId` value defined in the participant’s event map. If present, this is an ISO 8601 duration measured in minutes, hours, days, or weeks. |
| interval | N | If absent, this session will be scheduled once (note that due to time windows, this does not necessarily mean the participant will have only one activity to perform; see below). If present, this is an ISO 8601 duration measured in days or weeks. Every interval period of time from the start event (plus the delay, if present), the session will be scheduled again, until the end of the study. |
| occurrences | N | A session with an interval will generate session instances until the end of a schedule. Alternatively, the session can define a fixed number of occurrences to issue before the stream ends. If the occurrences would extend beyond the end of the schedule, they are truncated. | 
| timeWindows | Y | The time windows are an array of `TimeWindow` objects. These are described below. |

### Time Windows

A session can contain one or more `TimeWindow` objects. Each of these windows effectively defines a separate (if closely related) *scheduled session* in the `Timeline` object that is returned to the participant. In general, time windows are used to schedule multiple performances of session in a single day (if a session has a time window that extends beyond a single day, it is harder to think of a scenario where having multiple time windows makes sense).

```json
{
  "guid":"jARfqtWbX7Kn3inzZSEKr6dq",
  "startTime":"20:00",
  "expiration":"PT6H",
  "persistent":false,
  "type":"TimeWindow"
}
```

| Field | Req? | Description |
|-------|------|-------------|
| startTime | Y | A local time of day for the participant, given in MM:HH 24hr format. |
| expiration | N | The period after which the window should be removed as a task from the UI (whether it was started by the participant or not). If the session defines an interval, this value is required and it cannot be greater than the interval of the session. Upon expiration, if the assessment was started, the data should be uploaded. |
| persistent | N | If set to true, the session instance should be left in the UI for the participant to finish as often as they would like, until the session expires. |

### Assessments

The second set of session properties is the list of the assessments to perform, and in what order:

```json
{
  "performanceOrder":"sequential",
  "assessments":[
    {
      "title":"Medication Tracker",
      "guid":"y5NqJgkHz37ge9RnEtgioraS",
      "appId":"local-app",
      "identifier":"medication-tracker",
      "minutesToComplete":1,
      "colorScheme": {
        "foreground": "#FFFFFF",
        "background": "#ABBCE8",
        "activated": "#ABBCE8",
        "inactivated": "#C7D0E6"
      },
      "type":"AssessmentReference"
    },
    {
      "title":"Tapping Test",
      "labels":[
        {
          "lang":"en",
          "value":"Tapping test time!",
          "type":"Label"
        }
      ],
      "guid":"192vyvketDEuJo7I2to3IQbW",
      "appId":"shared",
      "identifier":"tapping",
      "minutesToComplete":5,
      "type":"AssessmentReference"
    }
  ],
  "type":"Session"
}
```

| Field | Req? | Description |
|-------|------|-------------|
| performanceOrder | Y | There are three possible values. `sequential` indicates the assessments must be performed in the order they appear in the schedule. `randomized` indicates the assessments should be randomized by the clients in their presentation to the participant. Bridge will randomized the order of assessments each time they are given as part of a session instance in a `Timeline`. Finally, `participant_choice` indicates the participant can complete the assessments in any order they wish. |
| assessments | Y | One or more assessment references to be performed as part of this session. | 

Beyond the `guid`, `appId`, and `identifier` properties, assessment references have no further required information. However, they can include display information; **that information will not be added to the client app’s `Timeline` unless it is copied to the assessment reference at the time the schedule is created.** It is expected that design-time tools will allow designers to select assessments, and then these tools will copy default information from the assessment to the assessment reference. At that point it can be edited by study designers (e.g. to translate the assessment’s presentation in the schedule into a new language).

{% include image.html url="/images/assessment-ui-information.svg" 
  description="Display information in the assessment reference" %}

### Assessment references

| Field | Req? | Description |
|-------|------|-------------|
| guid | Y | The GUID of the assessment. |
| appId | Y | The app from which the assessment can be retrieved. This can have only one of two values: `shared` if the assessment is a shared assessment; and the appId of the app if the assessment is a locally managed assessment. | 
| title | N | The title of the assessment. While it is the name of the assessment as seen by study designers, it can also be used as the label if nothing better exists. |
| labels | N | The labels of an assessment. The `lang` property is required and must be a valid ISO 639 alpha-2 or alpha-3 language code specifying the language of the label. The array cannot contain two labels with the same language code. The `value` is required and is the label in the given language. <br><br>When returning a `Timeline` to a client, the caller’s languages will be used (in order of preference) to select a `Label` in that language. If this fails, the `en` language `Label` will be used as a default. If that also does not exist, the assessment title will be used as the label (though it is not required to have a title). |
| identifier | Y | The identifier of the assessment. This can be used by client apps to identify resources (like icons) for an assessment that are not tied to a specific revision of the assessment. |
| colorScheme | N | A color scheme for the display of this assessment. This is an object with four properties defining up to four colors in hex triplet format (e.g. #FFF or #FFFFF). The four color properties are `background`, `foreground`, `activated`, and `inactivated`. <br><br>In UIs where a session is displayed (and not individual assessments), the design of the first assessment in the session can be used to render the session.|
| minutesToComplete | N | The minutes it takes to complete the assessment. |

### Notification Configuration

Finally, a `Session` can define the notifications that the mobile app should show to the participant.

```json
{
  "notifyAt":"start_of_window",
  "remindAt":"after_window_start",
  "reminderPeriod":"PT15M",
  "allowSnooze":true,
  "messages":[
    {
      "lang":"en",
      "subject":"Tapping Test",
      "message":"Time for the tapping test",
      "type":"NotificationMessage"
    },
    {
      "lang":"fr",
      "subject":"Test de taraudage",
      "message":"L'heure du test de taraudage",
      "type":"NotificationMessage"
    }
  ],
  "type":"Session"
}
```

| Field | Req? | Description |
|-------|------|-------------|
| notifyAt | N | For any notification to be sent, this value must be set. There are three values: `start_of_window` indicates that a notification should be sent at the start of the window; `participant_choice` suggests the notification should be scheduled by the participant (the design is unspecified by Bridge); and `random` indicates that the notification should be scheduled for a random time during the time window (after it starts and before it expires). |
| remindAt | N | For a second reminder notification, this value must be set. There are two values: `after_window_start` and `before_window_end`, that can be used with the `reminderPeriod` to set a fixed reminder. For example a reminder `before_window_end` with a `reminderPeriod` of “PT10M” should send a reminder ten minutes before a session window ends. Required if `reminderPeriod` is set. |
| reminderPeriod | N | An ISO 8601 duration measured in minutes, hours, days, or weeks. Required if `remindAt` is set. |
| allowSnooze | N | A boolean indicating whether or not the participant may snooze the notification or reminder to be displayed at a later time. |
| messages | N | An array of localized messages to display to the participant as the notification.<br><br>The `lang` property is required and must be a valid ISO 639 alpha-2 or alpha-3 language code specifying the language of the label. The array cannot contain two labels with the same language code. The `subject` is a short version of the message (40 characters or less) while the `message` field is a longer version (60 characters or less).<br><br>When returning a `Timeline` to a client, the caller’s languages will be used (in order of preference) to select a `Label` in that language. If this fails, the `en` language `NotificationMessage` will be used as a default. It is required to have an `en` message if notifications are enabled. |

## Timelines

Once a schedule has been created, it is communicated to consuming applications (such as mobile apps created for participants to execute research) through a partially resolved format known as a `Timeline`. The timeline spells out all the individual tasks the participant will be asked to perform over the lifetime of the study. It also includes information about the sessions and assessments so the client can render a UI without fully loading the assessments.

**NOTE:** The examples in this section are taken from this [example-timeline.json](./example-timeline.json) for a short two week study.

```json
{
  "duration": "P2W",

  "schedule": [
    // the schedule
  ],
  "sessions": [
    // SessionInfo objects describing the sessions
  ],
  "assessments": [
    // AssessmentInfo objects describing the assessments
  ],
  "type": "Timeline"
}
```

Timelines have the following top-level properties:

| Field | Req? | Description |
|-------|------|-------------|
| duration | Y | The duration from the schedule, which is the maximum amount of time any event time stream in the study can last for a participant.  No single series of scheduled sessions can run longer than this duration. If all the sessions in a schedule start at the beginning of the study, this duration should be the calendar duration of the study as it is performed by participants. However, if events can be triggered later in the study, then those time series can themselves be of the given duration. |
| totalMinutes | Y | The total number of minutes it will take to perform all sessions in a timeline. This value is provided to schedule designers to give them a measure of the “performance burden” of their protocol for study participants. |
| totalNotifications | Y | The total number of notifications that will be presented to the participant by your study. This value is provided to schedule designers to give them a measure of the “burden” of the notification design for study participants. |

### Scheduled sessions

The `schedule` property of the timeline contains scheduled sessions with their scheduled activities. This is the timeline of what sessions and assessments should be done, and on what days.

```json
{
  "schedule": [
    {
      "refGuid": "LBHjyu4oragS2xmj3gtPQD_e",
      "instanceGuid": "B0sfyeq6wAW-YbBH5RFXbQ",
      "startDay": 0,
      "endDay": 0,
      "startTime": "08:00",
      "expiration": "PT8H",
      "assessments": [
        {
          "refKey": "d9831818d9831818",
          "instanceGuid": "1ggnxuRfxovtibAQfcZXfQ",
          "type": "ScheduledAssessment"
        }
      ],
      "type": "ScheduledSession"
    },
    {
      "refGuid": "dAGKM4nN39cDbyADic_bDNXs",
      "instanceGuid": "5m4DWgtn0oY3S8LR72QowA",
      "startDay": 2,
      "endDay": 8,
      "startTime": "00:00",
      "expiration": "P1W",
      "assessments": [
        {
          "refKey": "6e56429e6e56429e",
          "instanceGuid": "S_OM4Jv3Cov4GM3N_tAcCg",
          "type": "ScheduledAssessment"
        }
      ],
      "type": "ScheduledSession"
    },
    {
      "refGuid": "LBHjyu4oragS2xmj3gtPQD_e",
      "instanceGuid": "SNRtbbtLy5Gfiy8QP37GpQ",
      "startDay": 7,
      "endDay": 7,
      "startTime": "08:00",
      "expiration": "PT8H",
      "assessments": [
        {
          "refKey": "d9831818d9831818",
          "instanceGuid": "r7o4Vo0UqzfiYGiTejW69A",
          "type": "ScheduledAssessment"
        }
      ],
      "type": "ScheduledSession"
    }
  ],
  "type": "Timeline"
}
```

Each entry in this array has the following properties

| Field | Req? | Description |
|-------|------|-------------|
| refGuid | Y | This is a reference to a `SessionInfo` entry in the top-level `sessions` property array of this timeline. That block contains all the configuration information for this session (and all the other instances of this session that were generated from the same repeating session. This GUID happens to be the GUID of the session in the schedule. |
| instanceGuid | Y | This is a unique identifier for any study data generated and uploaded as part of this performance of a repeating session. Uploads should include the session or assessment `instanceGuid` along with the timestamp of the event that triggered this scheduled session, so the server can reconstruct the relationship of the schedule and the upload at a later time. |
| startDay | Y | The first day on which this scheduled session should be introduced to the participant (taking account the `startTime` and `expiration` period). This value is zero-indexed. The “day since event X” is calculated from the time of an event timestamp to the participant’s current local time, as a number of days (these are *calendar* days, not 24 hour periods). The specific event to measure against is the `startEventId` in the `SessionInfo` object for this scheduled session. |
| endDay | Y | The last day on which this scheduled session should be provided to the participant. The “day since event X” is calculated from the time of an event timestamp to the participant’s current local time, as a number of days (these are *calendar* days, not 24 hour periods). If this session expires but was started the data that was collected should be uploaded **without updating the `finishedOn` timestamp of the associated history record.** |
| startTime | N | The local time of day that the scheduled session should be shown to the user. This is the beginning of the *time window* for this scheduled session, which is also used to specify notification behavior. |
| expiration | N | If present, this is a duration from the `startTime` or `delayTime` after which the session should be removed from the UI. This value is required if the session as a whole has an `interval` value and repeats, and it must be equal to or shorter than the repeating interval. If the scheduled session was started by the user, partial data should be uploaded to the Bridge server after the scheduled session expires. |
| delayTime | N | If there is a delay of less than a day on a scheduled session, then a `delayTime` will be provided. Depending on the local time, the client may choose to use this to delay before showing the scheduled session (e.g. if the timestamp is after the specified `startTime`). |
| assessments | Y | This is an array of the assessments in this session. The order they should be presented or performed is given by the `performanceOrder` field of the `SessionInfo` object for this scheduled session. Each assessment will have a `refKey` to an `AssessmentInfo` entry under the top-level `assessments` property array, and an `instanceGuid` which is the unique identifier for any study data generated and uploaded by this assessment. (The `refKey` is a transient internal reference within the `Timeline` JSON to a configured assessment block in the same JSON). |
<div style="display:none">
| delayTime | N | On the first day of a scheduled session, the `startTime` may be before or after the event timestamp that triggers the schedule session. If it is after the timestamp, then the app should wait until that time to start the scheduled session; if it is before the timestamp, the app should immediately start the scheduled session. If a `delayTime` is present, the client should wait until both the `delayTime` and the `startTime` have passed. This can force a break in activities when they are scheduled in a short period of time (e.g. at the beginning of a study). |
</div>

The scheduled assessments have only two pieces of information:

| Field | Req? | Description |
|-------|------|-------------|
| refGuid | Y | This is a reference to a `AssessmentInfo` entry in the top-level `assessments` property array of this timeline. That block contains all the configuration information for this assessment (since assessments can be configured differently, this is not the assessment’s GUID, it is an internal reference for this JSON object only).  |
| instanceGuid | Y | This is a unique identifier for any study data generated and uploaded as part of this performance of a repeating assessment (within a repeating session). Uploads should include the session or assessment `instanceGuid` along with the timestamp of the event that triggered this scheduled session, so the server can reconstruct the relationship of the schedule and the upload at a later time. |

In addition to this schedule, there are configurations for the highly redundant `Session` and `Assessment` information. This information is similar to the `Schedule` but 1) it merges in UI display information from the assessment and 2) it resolves language dependencies and returns the best language options for the participant retrieving the `Timeline`:

```json
{
  "assessments": [
    {
      "key": "6e56429e6e56429e",
      "guid": "vB2sRcexlEnqIWPOrBy2ReWD",
      "appId": "api",
      "identifier": "test-survey",
      "revision": 1,
      "label": "Take the enrollment survey!",
      "minutesToComplete": 10,
      "colorScheme": {
        "background": "#FF00FF",
        "type": "ColorScheme"
      },
      "type": "AssessmentInfo"
    },
    {
      "key": "d9831818d9831818",
      "guid": "63UuD59NLrpJGsvbdVU2wul7",
      "appId": "shared",
      "identifier": "digital-jar-open",
      "label": "Digital Jar Open",
      "minutesToComplete": 2,
      "type": "AssessmentInfo"
    }
  ],
  "sessions": [
    {
      "guid": "LBHjyu4oragS2xmj3gtPQD_e",
      "label": "Weekly Jar Opening Test",
      "minutesToComplete": 2,
      "startEventId": "enrollment",
      "performanceOrder": "sequential",
      "type": "SessionInfo"
    },
    {
      "guid": "dAGKM4nN39cDbyADic_bDNXs",
      "label": "Background Survey",
      "startEventId": "enrollment",
      "performanceOrder": "sequential",
      "notifyAt": "start_of_window",
      "remindAt": "before_window_end",
      "reminderPeriod": "PT3H",
      "minutesToComplete": 10,
      "message": {
        "lang": "en",
        "subject": "Please take the initial survey",
        "message": "This survey is very important to us, please do it!!",
        "type": "NotificationMessage"
      },
      "type": "SessionInfo"
    }
  ]
}
```

The values of these fields are given in the description of the `Session` and `Assessment` objects above (most of this information is copied over from the schedule without modification). Note that both local and shared assessments may appear in the schedule. You must retrieve the configuration for these assessments through different endpoints:

Local assessments (any `appId` value except `shared`):<br>
    `https://ws.sagebridge.org/v1/assessments/{guid}/config`

Shared assessments:<br>
    `https://ws.sagebridge.org/v1/sharedassessments/{guid}/config`

### Calculating the participant’s schedule

To determine which elements of a timeline should currently be made available to a participant, the following algorithm is suggested:

1. Retrieve the user’s activity event map (event IDs mapped to timestamps) and the participant’s timeline;
2. For each event in the activity event map, calculate the “day since event N” for this participant, using the local time of the device. For example, in Java, you would use something like `ChronoUnit.DAYS.between(eventTimestamp, now)`;
3. For each event ID in the map, search for scheduled events that have the same `startEventId`, where the `startDay` <= `daysSince` and `endDay` >= `daysSince`. **Scheduled activities that are keyed off an event that is not in the participant’s events are ignored;**
4. Once you have all these scheduled sessions assembled, remove any sessions where the `startTime` and `expiration` values define a local time window that is outside of the local time;
5. Now retrieve the adherence records for the remaining session instance GUIDs of these sessions. You should set `currentTimestampsOnly=true`, leave `adherenceRecordType` unset, and to filter out long-running persistent assessments, you should set `startTime` and `endTime` values for the search;
6. Remove any scheduled sessions that have `finishedOn` timestamps, and from in-process sessions, remove any scheduled assessments with `finishedOn` timestamps;
7. The remaining scheduled sessions and their scheduled assessments are currently available to be performed by the user, including those that have `startedOn` timestamps but that have not been finished (no `finishedOn` timestamp).

Because sessions include information on notifications, the client will need to be proactive in retrieving and processing timeline information. 

### Caching a timeline

Published schedules cannot be changed, so their timelines cannot be changed, allowing for long-term local caching of `Timeline` data. Participant-facing `Timeline` APIs accept the `If-Modified-Since` header and will return 304 if the `Timeline` has not been modified after the given modification time. In the Java SDK, the date value for the `If-Modified-Since` header can be passed to the method call.

## The Adherence API

The third and final part of the Bridge scheduling system, [the adherence APIs,](/swagger-ui/index.html#/Adherence%20Records) support both schedule state management for mobile clients and adherence reporting for study administrators. Once a participant’s client has a timeline, it is able to interpret the set of [AdherenceRecord](/model-browser.html#AdherenceRecord) objects available for a participant.

This collection of records is *sparse;* if the participant did not do a scheduled session or assessment, there will not be a record for that session or assessment in the set of records. Furthermore, these records are persisted by the client, so they will only exist if the client updates the server on the current state of timeline performance.

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
| startedOn | Y | The timestamp (from the client) when the assessment or session was started. **Note: sometimes the client is wrong, so we might want to record a server timestamp instead or as well as this value.** |
| finishedOn | N | The timestamp (from the client) when the assessment or session was ended by the user. Do not set this value if the assessment or session eventually expires. |
| clientData | N | An arbitrary JSON object that the client can use to store further information about the assessment or session, its state, display information, etc. |
<div style="display:none">
| uploadedOn | N | The timestamp (from the server) when we record an associated upload has been finished for this assessment or session. |
</div>

### Updating adherence records

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
