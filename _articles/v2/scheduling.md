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
| activities_retrieved  | The timestamp of the first time the client requests the scheduled activities or timeline for a study. This event will only be available if the study uses Bridge’s scheduling support. | Immutable |
| study\_start\_date | This event is the `activities_retrieved` event for the user if it exists, or else it is the `enrollment` event if it exists for the user, or else it is the `created_on` event for the user’s account. `study_start_date` is mutable in the sense that it may change if the events it is calculated from change, but otherwise it cannot be changed. All accounts will have this event. | Immutable |
| retrieved\_\_activities\_on | The most recent time the participant has requested activities from the server (through either the scheduled activities or the timeline APIs. | Future update only |
| signed\_in\_on | The most recent time the participant has signed in to the Bridge server through any API (including reauthentication). | Future update only |
| uploaded\_on | The most recent time the participant has uploaded data to the Bridge server. | Future update only
|activity:**guid**:finished | This event records a timestamp when the client has completed a task, survey, or assessment. Further activities can be scheduled to follow-up on this activity by scheduling against this event. A participant will only have this value after they complete a specific activity, and the client uses the v1 or v2 APIs to record a `finishedOn` timestamp for the :activity or assessment (the event is named `activity` in either case). | Future update only |
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

Custom events can be given any of the behaviors for a type of event. After they are defined, the client can send arbitrary events to be recorded on the server under the given event ID. 

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

The first call would attempt to update the immutable system event `enrollment`, and would quietly fail; the second would succeed if an `enrollment` custom event was defined and it was of type `future_only` (with a later date being submitted) or `mutable`. Otherwise it too will fail quietly. 

<div class="ui compact icon message">
  <i class="circle info icon"></i>
  <p>Why do these APIs return 201 even when the event is not updated? So clients that send requests to update a <code>forward_only</code> event do not receive errors if their requests are received out-of-order. This behavior can be changed to report 400 in the event of an error through the use of a query parameter (<code>reportFailure=true</code>).</p>
</div>

### Automatic custom events

In addition to submitting values through the API, an app can be configured to create calculated events from other event values, through the `automaticCustomEvents` mapping. This can be helpful when scheduling gets more complex, because you can create further timestamps to schedule against. In the `App` configuration, the key is the new event ID to generate, and the value is a calculated period of time before or after another event ID. For example:

```json
{ 
  "automaticCustomEvents": {
    "event1": "activities_retrieved:P13W",
    "event2": "enrollment:P-2W"
  }
  "type": "App"
}
```

In the example above, `event1` will be scheduled thirteen weeks after the `activities_retrieved` event, when it occurs, and `event2` will be scheduled two weeks before `enrollment` when it occurs. The periods are given in the [ISO 8601 Date & Time Standard](https://en.wikipedia.org/wiki/ISO_8601#Durations) for *durations,* and negative durations are allowed (which is not the case for durations given in the schedule described below). 

### Study-specific event APIs

Activity events initially assumed that there was one study in an app (hence, there is only one value for events like `enrollment`). The v2 activity event APIs (under `/v5/studies`) are similar to the v1 APIs, but they are *scoped* to a specific study. If the client uses these APIs, it can ask for events related to study 1 and study 2, and receive back different values for events like `enrollment`.

For backwards compatibility, study-scoped `enrollment`, `activities_retrieved`, and `created_on` events will also be created as global events. Since these values are immutable, they will only be created the first time any study triggers them (not necessarily the same study). For this reason, global events should be retired in favor of the events retrieved through study-specific APIs.

## Schedules

A schedule is owned by an organization and defines the overall duration of a study protocol (all durations in a schedule use an [ISO 8601 Duration](https://en.wikipedia.org/wiki/ISO_8601#Durations)). For example:

```json
{
  "name":"An example schedule",
  "ownerId":"sage-bionetworks",
  "guid":"YBxBQyfVdop4wmN0RMra4h7G",
  "duration":"P4W",
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
| duration | Y | The duration of the schedule expressed in days or weeks only (though these can be mixed). **Note:** right now this determines the length of the study where the schedule is used. |
| ownerId | — | The ID of the organization that owns this schedule. Unless the caller is an admin, this will be the caller’s organization. It’s set by Bridge when the caller creates a new schedule. |
| published | — | If true, this schedule has been published and can no longer be updated. Schedules should be published before they are used in production. If they are not, researchers may not be able to recover information about scheduling context for participant study data.  |
| deleted | — | Is the schedule logically deleted? It will no longer appear in lists of schedules (unless deleted items are included with a query parameter), though it can still be retrieved through the API. |
| clientData | N | An optional JSON payload that can be used to store arbitrary information with the schedule, usually information for UI or authoring tools (the `clientData` information is not copied over to the `Timeline` that is sent to a participant). |
| sessions | N | Described below (a schedule must contain at least one session). |
| version | Y | An optimistic lock for this schedule. When updating an existing schedule, this value must be returned as part of the schedule. If it has been modified since retrieval, the server will return a 409 (Conflict) response and the schedule will not be updated. |

### Sessions

The schedule in turn contains a number of `Session` objects that do the real work of defining a schedule. The session JSON is large, but it can be broken into three major parts.

#### Scheduling and time windows

First, it defines a stream of activities that should be scheduled, starting with the time of a specific event. 

For example if the event were enrollment in a study, then the session would define one or more activities to perform in terms of “day N in the study.” If the event were a clinic visit, then the activities would be defined in terms of “N days since the clinic visit.”

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
  "timeWindows":[
    {
      "guid":"Z9TfvnF-Ps7NjmEJoFpKfEbd",
      "startTime":"08:00",
      "expiration":"PT6H",
      "persistent":false,
      "type":"TimeWindow"
    },
    {
      "guid":"fTnghp8ybgGuof8vNWEE50vS",
      "startTime":"14:00",
      "expiration":"PT6H",
      "persistent":false,
      "type":"TimeWindow"
    },
    {
      "guid":"jARfqtWbX7Kn3inzZSEKr6dq",
      "startTime":"20:00",
      "expiration":"PT6H",
      "persistent":false,
      "type":"TimeWindow"
    }
  ],
  "type":"Session"
}
  ```

| Field | Req? | Description |
|-------|------|-------------|
| name | Y | A name for the schedule to display in study design tools. The name will be included in a `Timeline` and will be used as the default value if no other label can be found to display to participants. |
| labels | N | An array of Label objects. The `lang` property is required and must be a valid ISO 639 alpha-2 or alpha-3 language code specifying the language of the label. The array cannot contain two labels with the same language code. The `value` is required and is the label in the given language. <br><br>When returning a `Timeline` to a client, the caller’s languages will be used (in order of preference) to select a `Label` in that language. If this fails, the `en` language `Label` will be used as a default. If that also does not exist, the session name will be used as the label. |
| startEventId | Y | An activity event ID (described above) from which the activities in this stream will be calculated. |
| delay | N | If absent, the first activity of this session will occur the moment the client finds the `startEventId` value defined in the participant’s event map. If present, this is an ISO 8601 duration measured in minutes, hours, days, or weeks. |
| interval | N | If absent, this session will be scheduled once (note that due to time windows, this does not necessarily mean the participant will have only one activity to perform; see below). If present, this is an ISO 8601 duration measured in days or weeks. Every interval period of time from the start event (plus the delay, if present), the session will be scheduled again, until the end of the study. |
| occurrences | N | A session with an interval will generate session instances until the end of a schedule. Alternatively, the session can define a fixed number of occurrences to issue before the stream ends. If the occurrences would extend beyond the end of the schedule, they are truncated. | 
| timeWindows | Y | The time windows are an array of `TimeWindow` objects. These are described below. |

##### Time Windows

In the `Timeline`, one scheduled session will be created for each instance of a `TimeWindow` in a session, because each window effectively defines a separate (if closely related) session instance that the participant will have to perform.

| Field | Req? | Description |
|-------|------|-------------|
| startTime | Y | A local time of day for the participant, given in MM:HH 24hr format. |
| expiration | N | The period after which the window should be removed as a task from the UI (whether it was started by the participant or not). If the session defines an interval, this value is required and it cannot be greater than the interval of the session. Upon expiration, if the assessment was started, the data should be uploaded (the history record can remain in a started but not finished state). |
| persistent | N | If set to true, the session instance should be left in the UI for the participant to finish as often as they would like, until the session expires. |

#### Assessments

The second set of session properties define the assessments to perform, and in what order:

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

Beyond the `guid` and `appId` properties, assessment references have no further required information. However, they can include display information; **that information will not be added to the client app’s `Timeline` unless it is copied to the assessment reference at the time the schedule is created.** It is expected that design-time tools will allow designers to select assessments, and then these tools will copy default information from the assessment to the assessment reference. At that point it can be edited by study designers (e.g. to translate the assessment’s presentation in the schedule into a new language).

{% include image.html url="/images/assessment-ui-information.svg" 
  description="Display information in the assessment reference" %}

##### Assessment references

| Field | Req? | Description |
|-------|------|-------------|
| guid | Y | The GUID of the assessment. |
| appId | Y | The app from which the assessment can be retrieved. This can have only one of two values: `shared` if the assessment is a shared assessment; and the appId of the app if the assessment is a locally managed assessment. | 
| title | N | The title of the assessment. While it is the name of the assessment as seen by study designers, it can also be used as the label if nothing better exists. |
| labels | N | The labels of an assessment. The `lang` property is required and must be a valid ISO 639 alpha-2 or alpha-3 language code specifying the language of the label. The array cannot contain two labels with the same language code. The `value` is required and is the label in the given language. <br><br>When returning a `Timeline` to a client, the caller’s languages will be used (in order of preference) to select a `Label` in that language. If this fails, the `en` language `Label` will be used as a default. If that also does not exist, the assessment title will be used as the label (though it is not required to have a title). |
| identifier | N | The identifier of the assessment. This can be used by client apps to identify resources (like icons) for an assessment that are not tied to a specific revision of the assessment. |
| colorScheme | N | A color scheme for the display of this assessment. This is an object with four properties defining up to four colors in hex triplet format (e.g. #FFF or #FFFFF). The four color properties are `background`, `foreground`, `activated`, and `inactivated`. <br><br>In UIs where a session is displayed (and not individual assessments), the design of the first assessment in the session can be used to render the session.|
| minutesToComplete | N | The minutes it takes to complete the assessment. |

#### Notification Configuration

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
| allowSnooze | N | A boolean indicating whether or not the participant may snooze the notification or reminder to be displayed at a later time (not specified by Bridge). |
| messages | N | An array of localized messages to display to the participant as the notification.<br><br>The `lang` property is required and must be a valid ISO 639 alpha-2 or alpha-3 language code specifying the language of the label. The array cannot contain two labels with the same language code. The `subject` is a short version of the message (40 characters or less) while the `message` field is a longer version (60 characters or less).<br><br>When returning a `Timeline` to a client, the caller’s languages will be used (in order of preference) to select a `Label` in that language. If this fails, the `en` language `NotificationMessage` will be used as a default. It is required to have an `en` message if notifications are enabled. |


## Timelines

