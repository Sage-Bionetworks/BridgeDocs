---
title: Participant Data
layout: article
---

## Participant Data

Participant data are non-time series reports which represent data that does not have a date or time associated with it. Participant data is retrievable with the participant's userId and/or identifier.

Before, we used the Participant Report API to store non time-series information about Participants, using a dummy date of 2000-12-31. For example, Demographics and Engagement survey results in mPower 2.0 are stored this way.

Using Participant Report API:

```json
{
  "localDate": "2000-12-31",
  "studyIds": {
    "study1": "externalId1",
    "study2": "externalId2"
  },
  "dateTime": "2000-12-31T06:50:21.650-07:00",
  "data": "data"
}
```

Using Participant Data API:

```json
{
"identifier": "dataIdentifier",
"data": "data"
}
```


TODO is this a part of a larger migration to non-time series models?

##API - TODO, link specifically to ParticipantData
<dt><a href="/swagger-ui/index.html" target="_blank" rel="noopener">API Browser</a></dt>
    <dd>Documents the URLs of the Participant Data API</dd>