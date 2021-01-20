---
title: Scheduling
layout: article
---

<div id="toc"></div>

## Activity Events

*This is a v1 science API that is being augmented for v2. These APIs are in flux.*  

Study participation is scheduled for each participant relative to their entrance into a study (since different participants start at different times). To manage these relative schedules, each individual is given a timeline of sessions to perform that are triggered based on *activity events* for that user. Events are a date and time mapped to a string key. Every participant will have a map of these values against which their scheduling can occur.

This map of events is available through [an API for activity events](/swagger-ui/index.html#/Activity%20Events) that includes APIs for global events, and with the introduction of multi-study apps, for study-scoped events as well. The APIs also provide participants, study coordinators, and researchers a means to create new custom events to support app-specific scheduling requirements.

The following standard events are provided by Bridge. Once an immutable event has a timestamp set, it cannot be changed. Mutable event timestamps can be updated, but only if the submitted value is later than the current timestamp value.

| Event Name | Description | Immutable? |
|------------|----------------------|----------|
|created_on | The timestamp of the moment an account is created. All accounts will have this event. | Yes |
|enrollment  | The timestamp of a user’s consent signature, which marks the moment the participant has joined the study. This event will only be available if the study uses Bridge’s electronic consent support. | Yes |
|activities_retrieved  | The timestamp of the first time the client requests the scheduled activities or timeline for a study. This event will only be available if the study uses Bridge’s scheduling support. | Yes |
|study\_start\_date | This event is the `activities_retrieved` event for the user if it exists, or else it is the `enrollment` event if it exists for the user, or else it is the `created_on` event for the user’s account. `study_start_date` is mutable in the sense that it may change if the events it is calculated from change, but otherwise it cannot be changed. All accounts will have this event. | Yes |
|activity:**guid**:finished | This event records a timestamp when the client has completed a task, survey, or assessment. Further activities can be scheduled to follow-up on this activity by scheduling against this event. A participant will only have this value after they complete a specific activity, and the client uses the v1 or v2 APIs to record a `finishedOn` timestamp for the :activity or assessment (the event is named `activity` in either case). | No |
|custom:**eventKey** | The client can send arbitrary events to be recorded on the server. If the client sends the event with a name of `foo`, it is returned as `custom:foo` (see more below). The event key must be declared in `App.activityEventKeys.` | No |

### Custom events

An app can be configured to allow clients to submit custom events. The two properties of the `App` object that are used for this purpose are `activityEventKeys` and `automaticCustomEvents`:

```json
{ 
  "activityEventKeys": ["event1", "event2"],
  "automaticCustomEvents": {
    "event1": "activities_retrieved:P13W",
    "event2": "enrollment:P-2W"
  }
  "type": "App"
}
```

The `activityEventKeys` array must include your custom event key (this prevents the use of participant-specific keys). Like other custom events, these events are submitted with the key as a name for the event, and they are returned from the API with a `custom:` prefix (e.g. the event `foo` will be returned under the key `custom:foo`). Here is an example of a custom activity event when submitted to the server:

```json
{
   "eventKey":"event1",
   "timestamp":"2018-04-04T16:43:11.357-07:00"
}
```

These custom events are available to the v1 and v2 scheduling APIs to schedule against. Custom events are mutable, but like other mutable events, timestamps for these events can only be updated if they are later in time than the currently persisted value. Calls to decrement time value are ignored.

### Automatic custom events

In addition to submitting values through the API, an app can be configured to create calculated events from other event values, through the `automaticCustomEvents` mapping. This can be helpful when scheduling gets more complex, because you can create further timestamps to schedule against. In the app configuration, the key is the new event key, and the value is a calculated period of time before or after another event ID. For example:

```json
{ 
  "automaticCustomEvents": {
    // thirteen weeks after the "activities_retrieved" event
    "event1": "activities_retrieved:P13W",
    // two weeks before the "enrollment" event
    "event2": "enrollment:P-2W"
  }
  "type": "App"
}
```

When the `activities_retrieved` event is created, `event1` will also be created, thirteen weeks after the `activities_retrieved` timestamp. When the `enrollment` event is created, `event2` will be created two weeks *before* the enrollment timestamp (moving into the past is expressed with a negative period value). Periods are described as part of the [ISO 8601 Date & Time Standard](https://en.wikipedia.org/wiki/ISO_8601#Durations), under *Durations.*

### Study-specific event APIs

Activity events initially assumed that there was one study in an app (hence, there is only one value for events like `enrollment`). The v2 activity event APIs are similar to the v1 APIs, but they are *scoped* to a specific study. If the client uses these APIs, it can ask for events related to study 1 and study 2, and receive back different values for events like `enrollment`.

For backwards compatability, study-scoped `enrollment`, `activities_retrieved`, and `created_on` events will also be created as global events. Since these values are immutable, they will only be created the first time any study triggers them (not necessarily the same study). For this reason, global events should be retired in favor of the events retrieved through study-specific APIs.

<div style="display:none">
## Schedules

Schedules stand alone from other systems in Bridge, however, to apply a schedule to a study participant, you need to associate a schedule to one or more arms of a [study.](/articles/v2/studies.html)

### Sessions

### Timelines

Participants in a study view a schedule as a *timeline.*
</div>