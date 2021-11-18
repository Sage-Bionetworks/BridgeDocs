---
title: Scheduling
layout: article
---

{% include v2.html %}

<div id="toc"></div>

A [`Schedule`](/model-browser.html#Schedule2) can be defined by a study designer which describes what each participant in a study should be prompted to do over the entire course of that study. The schedule is converted into a [`Timeline`](/model-browser.html#Timeline) for client apps, which provides detailed information on how to execute the schedule, UI configuration to display tasks to the user, and metadata to annotate uploaded research data so its context is preserved. Since each participant can start a study at a different time, this schedule is not described relative to calendrical dates, but instead relative to a set of [`StudyActivityEvent`](/model-browser.html#StudyActivityEvent) that are specific to each participant. 

## Study Activity Events

*Activity events (v1) have been replaced with the [study activity events v2 API](/swagger-ui/index.html#/Study%20Activity%20Events). The global v1 event APIs still work, but they are ignored by the v2 scheduling system.* 

It is best to start with an example of what an activity event is. If a user enrolls on March 14th, 2021, and the study wishes to have the user take a test on a weekly basis, then over the course of the study, that individual would be prompted to do the test on March 14th, March 21st, March 28th, and so forth until the end of the study. When a different user joins on May 1st, their activities would fall on May 1st, May 8th, May 15th, again until the end of the study. The *schedule* remains the same for both users, but it is calculated against a different timestamp for each user’s `enrollment` event in that study.

The server provides a number of system events that study designers can work with when building schedules (e.g. `timeline_retrieved` and `created_on`). Study designers can define additional events specific to their study and protocol, known as *custom* events. 

###### Study activity event types
| Event Name | Description | Behavior
|------------|----------------------|----------|----------|
| created_on | The timestamp of the moment an account is created. All accounts will have this event. | Immutable |
| enrollment  | The timestamp of a user’s consent signature, which marks the moment the participant has joined the study by self-enrolling. For backwards compatibility, the first study enrollment will also create a v1 global enrollment event. This event will only be available if the study uses Bridge’s electronic consent support. | Immutable |
| timeline_retrieved  | The timestamp of the first time a participant mobile app requests the timeline for a participant, or the participant’s mapping of recent activity events. This event will only be available if the study uses Bridge’s v2 scheduling support. | Immutable |
|session:**guid**:finished| This event records the most recent time that a session instance derived from this session was marked as finished by the client. A participant will only have this value after they complete the first instance of this session, recording a `finishedOn` timestamp for the session instance.| Future update only |
|assessment:**identifier**:finished| This event records the most recent time that an assessment instance of this type was marked as finished by the client. It doesn’t matter in which session the assessment is found, so this timestamp can be updated by performing the same assessment as scheduled by different sessions. A participant will only have this value after they complete the first instance of this assessment, recording a `finishedOn` timestamp for the assessment instance.| Future update only |
| sent\_install\_link | This event records when a study coordinator or researcher sends an “install app link” message to a participant (via an email message or an SMS message, depending on the configuration of the account). If the message is sent again at a later time, this event will be updated. This can be used to track when follow-up is necessary during onboarding. | Future update only |

**Immutable** events cannot be updated once a value is written to the server. **Future update only** events can only be changed if the new timestamp being submitted is after the timestamp that is persisted on the server. And **mutable** events have no restrictions and can be updated with any value. No system events are mutable, but custom events can be.

Event instances maintain the update behavior of the event at the time they are published. If you later change the update behavior of a custom events, any existing published events will not pick up this behavior.

Study coordinators can see the activity events for a participant through [an API for activity events](/swagger-ui/index.html#/Study%20Activity%20Events). 

### Custom events

In addition, app developers can define new *custom events* for use by a study’s schedule. These events are defined as part of a `Study` object’s configuration:

```json
{ 
  "customEvents": [
    {"eventId": "event1", "updateType": "immutable", "type": "CustomEvent"},
    {"eventId": "event2", "updateType": "future_only", "type": "CustomEvent"},
    {"eventId": "event3", "updateType": "mutable", "type": "CustomEvent"},
  ],
  "type": "Study"
}
```

Custom events can be given different behavior with respect to how they allow updates:

- **immutable** events can be set once, and then can never be changed. Requests to update the value will be silently ignored;
- **future_only** events can be set, and then after that, they can only be updated to a later date and time. If an earlier timestamp is sent, it is silently ignored;
- **mutable** events can be set and then later they can be changed to a different value, or deleted.

Once an event is defined, the client can send timestamps to be recorded on the server under the given event ID. **Custom events are differentiated with a “custom:” prefix** (that is, if you define an event `event1`, it should be given as `custom:event1` when submitted through the API—the API has some tolerance for differentiating custom events from system events, but this convention ensures no ambiguity is possible). 

<div class="ui compact icon message">
  <i class="circle info icon"></i>
  <p>Why do these APIs return 201 even when the event will not be updated due to its update type? So clients that send requests to update a <code>forward_only</code> event do not receive errors if their requests are received out-of-order.</p>
</div>

### Activity event history

Events that are `mutable` or `future_only` can create a history of different timestamp values that are important for maintaining the context of participant compliance with a protocol. These can be retrieved through the [study activity event history API](/swagger-ui/index.html#/Study%20Activity%20Events/getStudyParticipantStudyActivityEventHistory). For each activity requested of a participant in a timeline, there can be an adherence record for that activity that is identified by the instance GUID of that activity *and the timestamp of the triggering event that was in effect when the participant performed that activity.*

For example, if a scheduled entry occurs on the 3rd day after event X, and X can be changed, then the specification to perform a task 3 days after an event could mean:

- “day 3 since event X<sub>1</sub>”; and 
- ”day 3 since event X<sub>2</sub>” 

So having the timestamp of an event as well as the instance GUID is crucial to retaining *when* the assessment was completed by the participant.

## Schedules

A schedule defines the overall duration of a study protocol and the activities that participants will be asked to perform (currently all participants in a study receive the same schedule, but this will change with the introduction of *study arms*).

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
  "studyBursts":[...study bursts here...],
  "sessions":[...sessions here...],
  "version":32,
  "type":"Schedule"
}
```

| Field | Req? | Description |
|-------|------|-------------|
| name  | Y | A name for the schedule to show study designers. Never shown to participants. |
| duration | Y | The duration of the sessions in the schedule, expressed as an [ISO 8601 Duration](https://en.wikipedia.org/wiki/ISO_8601#Durations) of days or weeks (though these can be mixed).<br><br>No single series of scheduled sessions can run longer than this duration. If all the sessions in a schedule start at the beginning of the study, this duration should be the calendar duration of the study as it is actually performed by participants. **However, if events can be triggered later in the study, then those time series can themselves be of the given duration.** It is up to study designers to determine if this is acceptable, or if the design needs to be adjusted to more strictly limit the actual time it will take to complete the study. |
| ownerId | — | The ID of the organization that owns this schedule. Unless the caller is an admin (who can set any organization), this will be the caller’s organization. It’s set by Bridge when the caller creates a new schedule. |
| published | — | If true, this schedule has been published and can no longer be updated. Schedules will be published when the studies they are used in are moved out of the `DRAFT` state, so they cannot be changed once a study has started. |
| deleted | — | Is the schedule logically deleted? It will no longer appear in lists of schedules (unless deleted items are included with a query parameter), though it can still be retrieved through the API. |
| clientData | N | An optional JSON payload that can be used to store arbitrary information with the schedule, usually information for UI or authoring tools (the `clientData` information is not copied over to the `Timeline` that is sent to a participant). |
| sessions | N | <a href="#sessions">Described below</a> (not required, but a schedule must contain at least one session to be useful). |
| studyBursts| N | <a href="#study-bursts">Described below</a> after sessions (study bursts are optional).
| version | Y | An optimistic lock for this schedule. When updating an existing schedule, this value must be returned as part of the schedule. If it has been modified since retrieval, the server will return a 409 (Conflict) response and the schedule will not be updated. |

### Sessions

The schedule in turn contains a number of `Session` objects that do the real work of defining a schedule. The session JSON is large, but it can be broken into three major parts.

First, each session defines a stream of activities that should be scheduled, starting with the time of one or more events known as _activity events_ (the `startEventIds` array). For example if one of the events in the array was `enrollment` in a study, then the session would define one or more activities to perform in terms of “N days since enrollment.” If the event were a custom event named `custom:clinic_visit`, then the activities would be defined in terms of “N days since `custom:clinic_visit`.” 

*Each event in the list thus generates a separate stream of activities to perform.* One common scenario would be a block of activities to perform after each of three clinic visits. Each visit can be defined as a separate custom event, and then that event can be created when the visit occurs for a particular study subject. It is not necessary to create three separate but identical sessions for each visit; instead, trigger one session based on three distinct events.

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
  "startEventIds": ["enrollment"],
  "studyBurstIds": [], // see study bursts below
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
| startEventIds | Y | One or more event IDs (described above) from which the activities in this stream will be calculated. At least one `startEventId` or one `studyBurstId` needs to be present in the session. |
| studyBurstIds | Y | One or more study burst IDs that will trigger this session for the user if the originating event occrs for them. At least one `startEventId` or one `studyBurstId` needs to be present in the session.  |
| delay | N | If absent, the first activity of this session will occur the moment the client finds the event ID value defined in the participant’s event map. If present, this is an ISO 8601 duration measured in minutes, hours, days, or weeks. |
| interval | N | If absent, this session will be scheduled once (note that due to time windows, this does not necessarily mean the participant will have only one activity to perform; see below). If present, this is an ISO 8601 duration measured in days or weeks. Every interval period of time from the start event (plus the delay, if present), the session will be scheduled again, until the end of the study. |
| occurrences | N | A session with an interval will generate session instances until the end of a schedule. Alternatively, the session can define a fixed number of occurrences to issue before the stream ends. If the occurrences would extend beyond the end of the schedule, they are truncated. | 
| timeWindows | Y | The time windows are an array of `TimeWindow` objects. These are described below. |

#### Time Windows

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

#### Assessments

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

#### Assessment references

| Field | Req? | Description |
|-------|------|-------------|
| guid | Y | The GUID of the assessment. |
| appId | Y | The app from which the assessment can be retrieved. This can have only one of two values: `shared` if the assessment is a shared assessment; and the appId of the app if the assessment is a locally managed assessment. | 
| title | N | The title of the assessment. While it is the name of the assessment as seen by study designers, it can also be used as the label if nothing better exists. |
| labels | N | The labels of an assessment. The `lang` property is required and must be a valid ISO 639 alpha-2 or alpha-3 language code specifying the language of the label. The array cannot contain two labels with the same language code. The `value` is required and is the label in the given language. <br><br>When returning a `Timeline` to a client, the caller’s languages will be used (in order of preference) to select a `Label` in that language. If this fails, the `en` language `Label` will be used as a default. If that also does not exist, the assessment title will be used as the label (though it is not required to have a title). |
| identifier | Y | The identifier of the assessment. This can be used by client apps to identify resources (like icons) for an assessment that are not tied to a specific revision of the assessment. |
| colorScheme | N | A color scheme for the display of this assessment. This is an object with four properties defining up to four colors in hex triplet format (e.g. #FFF or #FFFFF). The four color properties are `background`, `foreground`, `activated`, and `inactivated`. <br><br>In UIs where a session is displayed (and not individual assessments), the design of the first assessment in the session can be used to render the session.|
| minutesToComplete | N | The minutes it takes to complete the assessment. |

#### Notification Configuration

Finally, a `Session` can define one or more notifications that the mobile app should show to the participant. There is no limit set on these notifications other than the practical one of annoying participants. The total notification burden for the whole study is given in the `totalNotifications` value of the `Timeline`.

```json
"notifications":[
  {
    "notifyAt":"after_window_start",
    "offset":"PT10M",
    "interval": "P2D",
    "allowSnooze":true,
    "messages":[
      {
        "lang":"en",
        "subject":"Time to take the tapping test",
        "message":"It'll only take 2 minutes!",
        "type":"NotificationMessage"
      }
    ],
    "type":"Notification"
  },
  {
    "notifyAt":"before_window_end",
    "offset":"PT10M",
    "allowSnooze":false,
    "messages":[
      {
        "lang":"en",
        "subject":"Please help us",
        "message":"There's still time to  do the tapping test. It is important!",
        "type":"NotificationMessage"
      }
    ],
    "type":"Notification"
  }
]
```

| Field | Req? | Description |
|-------|------|-------------|
| notifyAt | Y | If a notification is defined, this value is required. Notifications occur relative to `after_window_start` or `before_window_end`. |
| offset | N | A period of time `after_window_start` or `before_window_end` when the notification should be shown. (Note that the value is positive, even when it is subtracting time from the end of the scheduling window.) If offset is not present, then the notification should be shown at the time the window begins or ends. |
| interval | N | If a time window lasts for more than twenty-four hours in the session, a notification can be repeated on a daily period value (only day values are allowed, e.g. “P1D”). |
| allowSnooze | N | A boolean indicating whether or not the participant may snooze the notification or reminder to be displayed at a later time. |
| messages | Y | An array of localized messages to display to the participant as the notification.<br><br>The `lang` property is required and must be a valid ISO 639 alpha-2 or alpha-3 language code specifying the language of the label. The array cannot contain two labels with the same language code. The `subject` is a short version of the message (40 characters or less) while the `message` field is a longer version (60 characters or less).<br><br>When returning a `Timeline` to a client, the caller’s languages will be used (in order of preference) to select a `Label` in that language. If this fails, the `en` language `NotificationMessage` will be used as a default. It is required to have an `en` message if notifications are enabled. |

As an example, let’s say you have a time window that starts at 8am and lasts 7 days. You wish to notify the user at the start of the window, and then daily after that at 10am (until the assessment is done or the window expires). The configuration would look like this:

```json
"notifications": [
  {
    "notifyAt": "start_of_window",
    "messages": []
  },
  {
    "notifyAt": "start_of_window",
    "offset": "PT26H",
    "interval": "P1D",
    "messages": []
  }
]
```

The second notification waits for 26 hours, which is 10am the day after the time window starts, and then repeats *from that time* every day at 10am. On the last day of the window, the window expires at 8am, so no notification is delivered on the final day.

### Study Bursts

Study bursts group one or more sessions and repeat them at an interval from some originating event. They offer a means to repeat sets of sessions, much like an individual session can be repeated. Some protocols ask participants to do activities near each other in time, some number of times over the duration of a longer study. We refer to these kinds of protocols as utilizing a “study burst” design.

<div class="ui warning message">
    <div class="ui header">Note</div>
    <p>You can repeat sessions and then include them in study bursts, causing activities to “stack” over each other in a protocol. This is usually a very poor experience for users, but Bridge does not currently try and detect and prevent this. You will need to keep this in mind when designing study bursts</p>
    <p>A simple rule of thumb is to ensure that all the sessions in a study burst either occur once, or repeat a fixed number of times that is clearly less time than the interval of the study burst. </p>
</div>

A schedule can define a study burst alongside the sessions of the schedule:

```json
{
  "studyBursts": [
    {
      "originEventId": "custom:clinic_visit", 
      "identifier": "clinic_follow_up", 
      "interval": "P1W", 
      "occurrences": 4, 
      "updateType": "mutable", 
      "type": :StudyBurst"
    }
  ],
  "type": "Schedule"
}
```

Each entry in this `studyBursts` array contains the following information:

| Field | Req? | Description |
|-------|------|-------------|
| originEventId | Y | The event that triggers this study burst. When this event is published in a participant’s activity event table, the study burst’s follow-on events will be calculated and added to the table. |
| identifier | Y | The identifier used for the study burst IDs. It must be unique for study bursts in this schedule. |
| occurrences | Y | The number of follow-on events that will be produced by this study burst. While sessions can be repeated until they reach the duration of the study, study bursts can currently only be repeated a fixed number of times. |
| updateType | Y | How these study burst events can be modified after creation. |

In JSON example above, when the event `custom:clinic_visit` is created for a participant, four follow-on events will be created at one week intervals. Here is one example of what this might look like for a user:

| Event ID | Timestamp |
|----------|-----------|
| clinic_visit| 2021-10-22T19:32:54.820Z |
| study\_burst:clinic\_follow_up:01 | 2021-10-29T19:32:54.820Z |
| study\_burst:clinic\_follow_up:02 | 2021-11-05T19:32:54.820Z |
| study\_burst:clinic\_follow_up:03 | 2021-10-12T19:32:54.820Z |
| study\_burst:clinic\_follow_up:04 | 2021-10-19T19:32:54.820Z |

The study burst thus schedules events into the future. For the configuration example above, these events are *mutable,* so they can be re-scheduled through the Bridge APIs for any user that has these events.

The mutability of these events, based on their relative update types, are as follows (the future only update type is a special kind of mutability):

| Event     | Study Burst  | Result |
|-----------|--------------|--------|
| Immutable | Immutable | Neither the event nor the study burst events can be changed once created. |
| Immutable | Mutable   | The event cannot be changed, but the study burst events can be rescheduled individually.  |
| Mutable   | Immutable | Event can be changed, but this will not change the study burst events, which cannot be changed individually either. |
| Mutable   | Mutable   | Event can be changed, *causing the study burst events to be adjusted as well.* In addition, the study burst events can be rescheduled individually. |

There is currently no way to allow an original event to be mutable, and the study burst events to be mutable, without the former updating the latter.

The second part of a study burst is the specification of which sessions in the schedule should be repeated by the study burst. Each session can define one or more `studyBurstIds` that they will be included in:

```json
{
  "startEventIds": [],
  "studyBurstIds": ["clinic_follow_up"],
  "type": "Session"
}
```

At least one `startEventId` or one `studyBurstId` is required in a session.

## Timelines

Once a schedule has been created, it is communicated to participant-facing apps through a partially resolved format known as a `Timeline`. The timeline spells out all the individual tasks the participant will be asked to perform over the lifetime of the study. It also includes information about the sessions and assessments so the client can render a UI before fully loading the assessments.

**NOTE:** The examples in this section are taken from this [example-timeline.json](./example-timeline.json) for a short two week study. Unfortunately it does not include an example of a study burst.

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
<<<<<<< HEAD
      "startEventId": "enrollment",
=======
      "startEventId": "event1",
>>>>>>> 6d17cd050797dd41386a2393d472e8046e72cf91
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
      "startEventId": "enrollment",
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
      "startEventId": "enrollment",
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
| startEventId | Y | The event in the user’s event map that should trigger a calculation of this session’s time stream to determine if any of its tasks should currently be presented to the participant for completion. Note that this can be directly specified in a schedule, or it can be an event calculated to represent a study burst (e.g. `study_burst:clinic_follow_up:04`). This should not matter to clients as the scheduled assessment should be treated the same way. |
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
      "configUrl": "https://ws.sagebridge.org/v1/assessments/vB2sRcexlEnqIWPOrBy2ReWD/config",
      "type": "AssessmentInfo"
    },
    {
      "key": "d9831818d9831818",
      "guid": "63UuD59NLrpJGsvbdVU2wul7",
      "appId": "shared",
      "identifier": "digital-jar-open",
      "revision": 2,
      "label": "Digital Jar Open",
      "minutesToComplete": 2,
      "configUrl": "https://ws.sagebridge.org/v1/sharedassessments/63UuD59NLrpJGsvbdVU2wul7/config",
      "type": "AssessmentInfo"
    }
  ],
  "sessions": [
    {
      "guid": "LBHjyu4oragS2xmj3gtPQD_e",
      "label": "Weekly Jar Opening Test",
      "symbol": "⭐",
      "minutesToComplete": 2,
      "performanceOrder": "sequential",
      "timeWindowGuids": ["bDNXs_9cDbyADicdAGKM4nN3"],
      "type": "SessionInfo"
    },
    {
      "guid": "dAGKM4nN39cDbyADic_bDNXs",
      "label": "Background Survey",
      "symbol": "✔️",
      "minutesToComplete": 10,
      "performanceOrder": "sequential",
      "timeWindowGuids": ["uD6rp3U59NLJdVGul7svbU2w"],
      "notifications": [
        {
          "notifyAt": "after_window_start",
          "offset": "PT10M",
          "interval": "P1D",
          "allowSnooze": true,
          "message": {
            "lang": "en",
            "subject": "Please take the initial survey",
            "message": "This survey is very important to us, please do it!!",
            "type": "NotificationMessage"
          },
          "type": "NotificationInfo"
        }
      ],
      "type": "SessionInfo"
    }
  ]
}
```

The values of these fields are given in the description of the `Session` and `Assessment` objects above (most of this information is copied over from the schedule without modification, although labels and notification messages are localized for the language of the caller). Note that both local and shared assessments may appear in the schedule. You must retrieve the configuration for these assessments through different endpoints, so they provide a `configUrl` property for this purpose.

### Calculating the participant’s schedule

To determine which elements of a timeline should currently be made available to a participant, the following algorithm is suggested:

1. Retrieve the user’s activity event map (event IDs mapped to timestamps) and the participant’s timeline;
2. For each event in the activity event map, calculate the “day since event N” for this participant, using the local time of the device. For example, in Java you would use `ChronoUnit.DAYS.between(eventTimestamp, now)` or with the Joda Time library, `Days.daysBetween(start.toLocalDate(), end.toLocalDate()).getDays()`;
3. For each event ID in the map, search for scheduled events that have the same `startEventId`, where the `startDay` <= `daysSince` and `endDay` >= `daysSince`. **Scheduled activities that are keyed off an event that is not in the participant’s events are ignored;**
4. Once you have all these scheduled sessions assembled, remove any sessions where the `startTime` and `expiration` values define a local time window that is outside of the local time;
5. Now retrieve the adherence records for the remaining session instance GUIDs of these sessions. You should set `currentTimestampsOnly=true`, leave `adherenceRecordType` unset, and to filter out long-running persistent assessments, you should set `startTime` and `endTime` values for the search;
6. Remove any scheduled sessions that have `finishedOn` timestamps, and from in-process sessions, remove any scheduled assessments with `finishedOn` timestamps;
7. The remaining scheduled sessions and their scheduled assessments are currently available to be performed by the user, including those that have `startedOn` timestamps but that have not been finished (no `finishedOn` timestamp).

Because sessions include information on notifications, the client will need to be proactive in retrieving and processing timeline information. 

### Caching a timeline

Published schedules cannot be changed, so their timelines cannot be changed, allowing for long-term local caching of `Timeline` data. Participant-facing `Timeline` APIs accept the `If-Modified-Since` header and will return 304 if the `Timeline` has not been modified after the given modification time. In the Java SDK, the date value for the `If-Modified-Since` header can be passed to the method call.
