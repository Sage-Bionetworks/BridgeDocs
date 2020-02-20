---
title: Evolution of the Bridge System
layout: article
---

vi 

CLIENT DOMAIN

App Config (/v3/appconfigs and /v3/appconfigs/elements)
Authentication (/v3/auth and /v4/auth)
File Hosting (/v3/files)
Push Notifications (/v3/notifications and /v3/topics)
Reports (/v3/reports, /v4/reports, /v3/participants/reports)
Templates (/v3/templates)


SCIENCE DOMAIN

/v3/itp
/v1/activityevents

Schedule Plans and Activities (/v4/schedules, /v3/scheduleplans, /v3/activities, /v4/activities, /v3/compoundactivitydefinitions)

All of these APIs will be replaced with a new scheduling API modeled more closely on the scheduling needs of studies.

Consent (/v3/consents, /v3/subpopulations)

External IDs (/v3/externalids and /v4/externalids)

External IDs will remain and will be associated to organizations. Additionally, they will indicate to Bridge which study a user has been enrolled in, when more than one study is using a mobile app to conduct research.

Shared Modules (/v3/sharedmodules)

These were not adopted, and will be replaced with a shared assessment library.

Substudies (/v3/substudies)

Substudies will be replaced with organizational affiliation.

Surveys and Upload Schemas (/v3/surveys, /v3/uploadschemas, /v4/uploadschemas)

These will be replaced with a new Assessments API that will include configuration specific to each assessment, pulling some of the configuration that is currently in the app config system out into a model that the server better supports and understands.

Uploads (/v3/uploads, /v3/uploadstatuses, /v3/recordexportstatuses, /v3/healthdata)

The upload of research data from the phone using background services on the phones will not change, and the APIs will continue to exist, but there will be a new requirement to report the scheduled assessment that prompted the data collection, if one exists. 

ADMINISTRATION

/v3/cache
/v3/participants
/v3/schedulerconfigs
/v3/schedulerstatus
/v3/studies
/v3/studies/{studyId}
/v3/studies/{studyId}/participants/{userId}
/v3/oauth
/v3/users
