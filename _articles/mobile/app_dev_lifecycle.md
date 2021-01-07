---
title: Support for the app development lifecycle
layout: article
---

<div id="toc"></div>

After your first release, you will want to test changes while maintaining your production configuration. The Bridge server provides support through the process of developing and releasing software changes.

## Developing and testing 

**By setting application versions on server objects, you restrict new content to the next released version of your application.** 

You can filter two key model objects: consent groups (subpopulations) and schedules. By setting the minimum app version for your platform (iOS or Android) to a level above the released version of your application, your developers and testers can see the new content, while participants will not.

For consent groups, the application version is set on the consent group itself (in the research manager, for either "iPhone OS" or for "Android").

For scheduling, a criteria-type schedule plan can tie each schedule in a list of schedules to a specific application version range. The first schedule that applies will be used to schedule a user, allowing you to deliver one schedule to production users and a different schedule to testers.

If you need to introduce a change in the tasks and schedules that are to be performed, you can reference these different asctivities through the filtered schedule.  

Similarly, you can make changes to existing schemas that are backwards compatible with any schema revision you are already using in production (data will not be sent to a different Synapse table, though columns may be added in that table and some columns may no longer be populated with data):

|Action|Description|
|---|---|
|Add non-required schema field|Always safe. You can start sending this data with your next release but the existing app is not required to send it.|
|Add required schema field|Set the min app version for this field to the next release version of your application. The next release will see this field (and will be required to send it).|
|Remove schema field (required or not)|Set the max app version for this field to the current release version of your application. The next release will not see the field (and should not send that data).|
|Change the name of a field|This is like a remove and then an add. You may need to set a max version on the old field, and create a new field with a min app version, in order to avoid creating a new revision of the schema.|

## Release to production 

When you are ready, you release a new version of your app to the app store with a higher version number. As users download the app and requests start to include that version number, new app versions (and only new app versions) will see your changes during this transitional period.

The same process works for hiding content on a release: by setting the minimum app version for a consent group or schedule, when you release a new app version, these objects will no longer be returned to users. 

Note that this transition period may take a few days since we cannot recalculate the scheduled activities that have already been sent to the client (and cached there). Old tasks will expire while new tasks will start appearing in the API.

## End-of-life for older app versions

It is not possible to force users to update their applications, so it is wise to leave older configuration for older app versions if at all possible. Over time, with subsequent revisions of operating systems and phone hardware, some users may even find they cannot update to newer versions of your app until they update their phone hardware.

However, when this is no longer tenable to maintain, you can adjust the minimum supported app version for your study, and app versions before this version will receive an error response from the server. The 410 HTTP response ("Gone") can be intercepted by your application and a message can be shown to the user that the app will no longer work until they upgrade. At this point, anything filtered only to those obsolete app versions can be deleted.

