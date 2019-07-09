---
title: Configuring apps remotely
layout: article
---

<div id="toc"></div>

The Bridge app config system allows your app to retrieve arbitrary JSON configuration that you provide, as well as Bridge-specific information about the versions of the upload schemas and surveys your app should retrieve and use. This allows you to vary the behavior of your app to some degree (e.g. fixing a typo, adding a scheduled activity, or adding a survey question), without having to do a full app release cycle. It also allows you to manage the upgrade of apps to a newly released version.

Bridge's system includes the top-level [AppConfig](/model-browser.html#AppConfig) object, and one or more [AppConfigElements](/model-browser.html#AppConfigElement) that can be included in an app config. These can all be created and managed by developers through the [Bridge Study Manager](https://research.sagebridge.org/).

## App Configs

You can create one or more app config objects in Bridge. One of your app configs can be selected and returned to clients based on public selection criteria like the requesting app version, or the user's language (as expressed in the `User-Agent` and `Accept-Language` headers). If the user's request will match more than one app config, we return the oldest app config. App config objects are not versioned or published; once created, they are immediately available for selection by clients.

<div class="ui compact warning icon message">
  <i class="exclamation triangle icon"></i>
  <p style="margin:0">Set the minimum app version for iOS and Android to 1000 on your new app config, so it is not returned to clients before you are ready!</p>
</div>

An app config has several important property keys to bring to your attention:

**`criteria`**: The [Criteria](/model-browser.html#Criteria) used to select an app config based on a request. Because app configs are normally retrieved at first start up for an app, they can be retrieved through a public API before authenticating. But for this reason, only the criteria information that is communicated through HTTP headers (app version and user language) can be used to select an app config.

**`clientData`**: This is an arbitrary JSON payload that can contain anything you add to it. It is not structured or validated, and can be entered through the Bridge Study Manager.

**`surveyReferences`, `schemaReferences`, and `configReferences`**: These properties contain arrays of references to surveys, schemas, and app config elements. From these references you can retrieve the specific revision of a survey or schema to use in the app (survey GUID & createdOn timestamp, or schema ID and revision).

Config references link to a specific config element by its revision.

**`configElements`**: This is a map of string GUIDs to JSON app config element objects. There will be an app config element included for every element in the `configReferences` object (the former is editable, while this field is readonly). As you'd expect, the revisions that are included are the revisions specified in `configReferences`.

## App Config Elements

[AppConfigElement](/model-browser.html#AppConfigElement) objects are in JSON and cannot be selected based on request criteria, however, they can be referenced in an app config, and app configs can be selected as described above. (App configs are thus the "top-level" objects of a JSON object graph.) App config elements can be revised in one or more revisions. Revisions are not published because you must specify a specific element revision when you include the element in an app config.

<div class="ui compact icon message">
  <i class="circle info icon"></i>
  <p style="margin:0"><b>Why app config elements?</b> Our principle use of these separate objects is to separate out configuration for external partners to manage. They can create new revisions of their configuration, and our developers can review and include the new revisions in the top-level app configs.</p>
</div>

## Versioning in scheduled activities

When scheduled activities are created and returned to users, we also currently resolve the specific upload schema revision or survey version to use for the activity. In the scheduling UI, you will notice that we do not ask for revision information. The scheduler uses the most recently published survey or the most recent schema revision, and includes that version information in the scheduled activities that are returned to the client.

This versioning information is now deprecated. It proved to be neither maintainable or flexible enough. Using app config objects to provide the versioning for all objects in your study is both versionable, and easier to manage. **The older version information is deprecated and will eventually be removed from the scheduling system.**