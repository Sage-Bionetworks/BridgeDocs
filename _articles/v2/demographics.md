---
title: Demographics
layout: article
---

{% include v2.html %}

Demographics APIs can be used to submit and fetch demographics information about participants. See also: the [demographics APIs endpoint documentation](/swagger-ui/index.html#/Demographics).

<div id="toc"></div>

## Models

### DemographicUser

A [DemographicUser](/model-browser.html#DemographicUser) represents a collection of demographics owned by a specific user at either the [app level or the study level](#app-level-and-study-level). A participant which has demographics information at both the app level and study level will have a DemographicUser at the app level and another DemographicUser at the study level.

A DemographicUser contains a collection which maps the category name of the demographic to a [Demographic](#demographic).

### Demographic

A [Demographic](/model-browser.html#Demographic) contains demographic information for a specific participant, either at the app level or study level, in a specific category. It can contain multiple possible values. The category name for the Demographic is stored as the key to the collection contained within the [DemographicUser](#demographicuser)

Demographics can be multipleSelect if the participant identifies with multiple values within that category (e.g., if the category is ethnicity), in which case any number of values is accepted. If a Demographic is not multipleSelect, it must have exactly 1 value.

Currently, values of Demographics are untyped and all values are stored as strings. This means that retrieving a Demographic will always return its values as strings (see [DemographicResponse](#demographicresponse)). However, values can be uploaded with any type (number, boolean, string).

Demographics can have units associated with their values. If there are no units, the units field should be null or left out.

### Assessment Models

The [DemographicUserAssessment](/model-browser.html#DemographicUserAssessment), [DemographicUserAssessmentAnswerCollection](/model-browser.html#DemographicUserAssessmentAnswerCollection), and [DemographicUserAssessmentAnswer](/model-browser.html#DemographicUserAssessmentAnswer) are used to submit demographics using the [assessment APIs](#assessment-and-non-assessment). However, demographics cannot be retrieved using the assessment format; they can be retrieved using the non-assessment format APIs only.

### Response Models

Responses from demographics APIs can return the demographics response models. They will not return a [DemographicUser](#demographicuser), [Demographic](#demographic), or any of the [assessment Models](#assessment-models).

#### DemographicUserResponse

A [DemographicUserResponse](/model-browser.html#DemographicUserResponse) is similar to a [DemographicUser](#demographicuser), but it also contains the user ID of the user who owns the returned demographics. Additionally, the collection which maps category name to demographics contains [DemographicResponses](#demographicresponse) instead of [Demographics](#demographic).

#### DemographicResponse

A [DemographicResponse](/model-browser.html#DemographicResponse) is similar to a [Demographic](#demographic), but it also contains an ID which can be used to delete the demographic. Additionally, the collection of values will always be a collection of strings.

#### DemographicUserResponseList

A [DemographicUserResponseList](/model-browser.html#DemographicUserResponseList) is a [PagedResourceList](/model-browser.html#PagedResourceList) which contains a list of [DemographicUserResponses](#demographicuserresponse).

## API Categories

Demographics APIs are split into multiple categories: self and non-self, app-level or study-level APIs, and assessment or non-assessment APIs.

### Self and Non-Self

Demographics can be operated on by the participant who owns the demographics, or on their behalf by a researcher, study-coordinator, etc.

For example, the [saveDemographicUser](/swagger-ui/index.html#/Demographics/saveDemographicUser/) endpoint will allow any researcher or study-coordinator to post demographics on a specified user's behalf. A participant can use the [saveDemographicUserSelf](/swagger-ui/index.html#/Demographics/saveDemographicUserSelf) API to submit their own demographic information.

### App-Level and Study-Level

Demographics can be operated on at the app-level or study-level. App-level demographics are a user's demographic information associated with an app, whereas study-level demographics are associated with a specific study within an app.

For example, the [saveDemographicUserAppLevel](/swagger-ui/index.html#/Demographics/saveDemographicUserAppLevel) endpoint can be used to submit app-level demographics, whereas the [saveDemographicUser](/swagger-ui/index.html#/Demographics/saveDemographicUser) endpoint can be used to submit study-level demographics.

### Assessment and Non-Assessment

Demographics can be submitted in an assessment format or non-assessment format.

<div class="ui icon message" style="margin-top: 2rem">
  <i class="ui exclamation triangle icon"></i>
  <div class="content">
   Unless your use case requires it, it is recommended that you use the non-assessment APIs.
  </div>
</div>

The assessment APIs accept a JSON format conforming to the [Bridge mobile client assessment result](https://github.com/Sage-Bionetworks/mobile-client-json/blob/00320defcb5c67873c501b5d99201fed6fdcd0e6/schemas/v2/AssessmentResultObject.json) instead of the typical JSON format.

For example, the [saveDemographicUserAssessment](/swagger-ui/index.html#/Demographics/saveDemographicUserAssessment) endpoint will allow the submission of demographics in the assessment format, whereas the [saveDemographicUser](/swagger-ui/index.html#/Demographics/saveDemographicUser) endpoint will allow the submission of demographics in the typical format.

## Participant Versions and Synapse

Demographics are part of the participant version record. Updates to demographics will create a new participant version, and any updates that cause a new participant version to be created will store a new copy of demographics. If exporting is enabled, demographics will also be exported to Synapse.

### Exporting to Synapse

Demographics are exported to Synapse along with participant versions. However, they are stored in a separate table called "Participant Versions Demographics" alongside the original "Participant Versions" table.

The "Participant Versions Demographics" table contains the app ID of the app associated with the demographics, the study ID of the study associated with the demographics (null if [app-level](#app-level-and-study-level)), the demographic category name, the demographic value, and units for that demographic (can be null). It also has a health code and participant version number which can be [used to join the demographics table with the main participant versions table](#materializedview).

If the demographic is multiple select, each value will be stored in a separate row. If the demographic is multiple select with no values, there will be a single row containing a value of null.

### MaterializedView

The main participant versions table can be used with the demographics table by joining them together in a [Synapse MaterializedView](https://rest-docs.synapse.org/rest/org/sagebionetworks/repo/model/table/MaterializedView.html) on the health code and participant version number columns.

A MaterializedView which joins the participant versions table and demographics together is provided. It is created alongside the demographics table and is named "Participant Versions Demographics Joined View."

### App-Level and Study-Level

In the same way that each app has a separate participant versions table and each study has a separate participant versions table, each app has a separate demographics table and [joining view](#materializedview), and each study has a separate demographics table and joining view.

App demographics tables contain all app-level demographics for that app and all study-level demographics for each of its substudies. Study demographics tables contain all app-level demographics for that study's parent app and all study-level demographics for that particular study.
