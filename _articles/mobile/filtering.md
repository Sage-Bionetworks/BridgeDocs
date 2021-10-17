---
title: Customizing Content for Participants
layout: article
---

<div id="toc"></div>

As described in [Study Design](/articles/study_design.html), study content can be tailored to users for the purpose of implementing features like app updates, localization, or study cohorts. 

The following server objects can be filtered based on the caller requesting them:

* [Subpopulations](/#Subpopulation) (consent groups);
* [Schedules](/#SchedulePlan) (and through schedules, specific surveys or tasks);
* [App configs](/#AppConfig) (and through app configs, specific app config elements);
* [Templates](/#Template);
* [Notification topics](/#NotificationTopic).

Each object includes a [Criteria](/#Criteria) property that matches the following aspects of a request or authenticated user:

* The language of the requesting user (as specified in the `Accept-Language` header);
* The minimum or maximum version of the app making the call on a specific platform (as specified in the `User-Agent` header using a Bridge-specific format);
* Data groups that the user is required or prohibited from having (authenticated requests only);
* Studies that the user is enrolled in or prohibited from being enrolled in (authenticated requests only);

**Filtering is opt-in**: if a request doesn't include filtering information, all objects will be considered to be relevant for that user.

Subpopulation filtering returns *all matches that apply,* because a user may have more than one applicable consent agreement they must agree to.

Other objects return *the first matching object.* Note that the language preference weight of the `Accept-Language` header is honored, so this is the first match with the results ordered by language preference.

For example, if a request for an app config included the following header:

    Accept-Language: fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5

And there were three app configs, specifying the languages English, German, and French (in that order), the request would return the French language app config, even though the English language app config matches first, simply because the user has indicated that they prefer French to English.

## On the server: Criteria

When creating server configuration, all fields in the criteria object are optional. If a field is not provided, then all participants are assumed to match on that aspect of the criteria. 

For example, if `allOfGroups` is an empty array, the participant can be assigned any data groups and they will match when selecting server objects. If no `User-Agent` header is included with a request, no filtering will be done based on the version of the application. And so forth.

|Name|Type|Description|
|---|---|---|
|language|String|The object associated with these criteria should be returned to participants only if the participant has declared this language to be one of their preferred languages. Languages are declared by participants through the Accept-Language HTTP header (we save this language preference the first time it is sent; thereafter it is retrieved as part of the participant's profile information, and can be changed through the profile and participant APIs).|
|minAppVersions|Object|This object maps operating system names to a minimum app version. For example, "iPhone OS" may be set to version 2, while "Android" might be set to version 10. Any operating system names can be used, but these two strings are expected for these two common mobile operating systems. The object associated with these criteria should be returned to participants only if the User-Agent header specifies an application version that is equal to or greater the version given for that operating system. Minimum and maximum values, when both specified, indicate a range of valid application version numbers. If no value for the operating system, there is no minimum required version.|
|maxAppVersions|Object|This object maps operating system names to a maximum app version. For example, "iPhone OS" may be set to version 2, while "Android" might be set to version 10. Any operating system names can be used, but these two strings are expected for these two common mobile operating systems. The object associated with these criteria should be returned to participants only if the User-Agent header specifies an application version that is equal to or less than the version given for that operating system. Minimum and maximum values, when both specified, indicate a range of valid application version numbers. If no value for the operating system, there is no maximum required version.|
|allofGroups|String[]|The object associated with these criteria should be returned to participants only if the user making the request has been assigned *ALL* of the data groups contained in this set (duplicate values in the array are removed). If the set is empty, there are no required data groups. Data groups must be defined as part of the [Study](/#Study) object before they can be included in this set or assigned to participants, and the same data group cannot be in the allOfGroups and noneOfGroups sets at the same time|
|noneOfGroups|String[]|The object associated with these criteria should be returned to participants only if the user making the request has been assigned *NONE* of the data groups contained in this set (duplicate values in the array are removed). If the set is empty, there are no prohibited data groups. Data groups must be defined as part of the [Study](/#Study) object before they can be included in this set or assigned to participants, and the same data group cannot be in the allOfGroups and noneOfGroups sets at the same time.|
|allOfStudyIds|String[]|The object associated with these criteria should be returned to participants only if the user making the request has been enrolled in *ALL* of the studies in this set (duplicate values of the array are removed). If the set is empty, there are no required study memberships. The same study IDs cannot be in the allOfStudyIds and noneOfStudyIds sets at the same time.|
|noneOfStudyIds|String[]|The object associated with these criteria should be returned to participants only if the user making the request has been enrolled in *NONE* of the studies contained in this set (duplicate values in the array are removed). If the set is empty, there are no prohibited study memberships. The same study ID cannot be in the allOfStudyIds and noneOfStudyIds sets at the same time.|

### Example

```json
{
    ...
    "criteria": {
        "language": "en",
        "minAppVersions": {
            "iPhone OS": 3,
            "Android": 10
        },
        "maxAppVersions": {
            "iPhone OS": 22
        },
        "allOfGroups":["b","a"],
        "noneOfGroups":["c","d"],
        "allOfStudyIds":[],
        "noneOfStudyIds":["sage"],
        "type": "Criteria"
    },
    "type": "SomeFilterableObject"
}
```

In this example the iOS application would only see the object if it was a version between 3-22, while an Android application would see the object if it was version 10 or greater (no upper limit). The user would have to have data groups "a" and "b", and could not have data groups "c" and "d". Finally, the user would need to declare English as an accepted language, and they cannot be enrolled in the Sage Bionetworks (`sage`) study.

## From the client

Features such as content filtering require the application to send some information to the server.

### User Agent Header

Applications should send their version information as part of a specially formatted `User-Agent` header. This header tells the server about the app, hardware and SDK being used to make the request. The app must submit one of the following formats:

|Format Variants|Example|
|---|---|
|appName/appVersion|Share The Journey/22|
|appName/appVersion sdkName/sdkVersion|Asthma/14 BridgeJavaSDK/10|
|appName/appVersion (deviceName; osName/osVersion) sdkName/sdkVersion|Cardio Health/1 (Unknown iPhone; iPhone OS/9.0.2) BridgeSDK/4|

If the header is not in one of these prescribed formats, it will be ignored and all server resources will be returned. Note that it is possible to come up with partial combinations of these strings that confuses our parsing; be sure your UA string is in one of these formats.

Application version filtering, both to lock old versions of your app out of the server and to filter content, is done on the combination of osName and appVersion.

The [Java REST client](/articles/java.html) provides APIs to set this header through the [ClientInfo](/#ClientInfo) object. 

### Accept-Language Header

The user's language preference is provided using the standard semantics of the HTTP `Accept-Language` header. Because study requirements can change significantly based on a user's language, Bridge saves these language preferences in the user's participant record and does not use different language preferences after that. 

**Note that we can only use a persisted language choice for authenticated calls.** The following table describes what can be matched for the API calls associated to each object:

|Name|Authenticated?|Applicable criteria|
|---|---|---|
|Subpopulations|Yes|All criteria, using headers or user settings|
|Schedules|Yes|All criteria, using headers or user settings|
|App configs|No|Language and app/platform from HTTP headers|
|Templates|Mostly No|Language and app/platform from HTTP headers|
|Notification topics|Yes|All criteria, using headers or user settings|

The `Accept-Language` header value is typically captured and persisted on sign in (as long as the application sends it). If you wish to allow a user to change their language choice after enrolling, you will need to update the language using the user's participant record.

The participant record stores language preferences as an ordered list of two-letter language codes, from most desired to least desired (but still acceptable) language choice. For example, "en, fr" would indicate that the server should return English resources if they exist, or French otherwise. 

### Data groups

Data groups are string "tags" that are assigned to a participant's record using the participant record APIs. The server will also filter content based on the data groups of the participant making a request. They do not have to be sent with the request (the server knows them already). They can really represent anything about a group of users that you need to track through the Bridge server, for filtering or any other purpose. 

To prevent abuse of data groups, all possible data group strings must be defined beforehand as part of the [Study](/#Study) object.
