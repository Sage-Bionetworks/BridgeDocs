---
title: Assessments
layout: article
---

*This is a v2 science API. These APIs are not yet complete or ready for production.*

<div id="toc"></div>

## Introduction 

Any activity a user performs in your mobile that collects data for scientific research is called an *assessment* in Bridge. 

Answering a survey, filling out a medication tracker, or doing a test with device sensors are all assessments of your participant. Assessments with good scientific validity are a team effort involving scientists and software engineers. Bridge provides features to share validated assessments between apps, and within the studies that are conducted in an app. These assessments can then be scheduled for participants who have been allocated to one or more arms of your study. The system allows for controlled customization of the display and execution of these assessments as a software component in your app.

[![Bridge Assessment Model](/images/BridgeAssessmentModel.svg)](/images/BridgeAssessmentModel.svg)

The [Assessments API](/swagger-ui/index.html#/Assessments) has two main components. First, an [Assessment](/model-browser.html#Assessment) and its associated [ExternalResource](/model-browser.html#ExternalResource) links provide documentation for the assessment (both technical and scientific). We expect most documentation will live outside of our shared assessment tools, hosted in places like Sage Bionetworks’ [Synapse wikis](https://docs.synapse.org/articles/wikis.html) or on [Github](https://github.com/). Second, each assessment has an associated [AssessmentConfig](/model-browser.html#AssessmentConfig) that Bridge’s client app SDK uses to customize and execute the assessment in a mobile app. This configuration is authored by mobile app developers. A [customization API](/swagger-ui/index.html#/Assessments/customizeAssessmentConfig) allows study designers to customize an assessment in a controlled manner, without breaking client apps or the scientific validity of the assessment. 

Assessments are conceptually organized into an ordered set of revisions that share a common `identifier`. The higher the `revision` number, the more recently that revision should have been created (although this isn’t strictly enforced, and the `createdOn` timestamp can be used to determine the actual temporal order of revisions). Each assessment revision can *also* be retrieved by a unique GUID, which is easier to work with than an `identifier` and `revision` value. You will need the `guid` to retrieve the assessment’s configuration, as each revision has its own configuration. Revisions logically replace one another and form a history of changes to an assessment.

Assessments are owned by organizations; only members of the organization with the appropriate role (study designer) can edit or publish an assessment, its configuration, or its resources. Bridge also has a shared assessment library of validated, high-quality assessments that researchers can schedule directly in their studies, or import into their app. Once a copy has been imported, organization study designers can edit the copy for the purposes of their research.

## Using assessments

Curated assessments are available through our [Shared Assessments APIs](/swagger-ui/index.html#/Shared%20Assessments). The assessments contain information for a few purposes. 

First, they provide an explanation of the scientific value of the assessment and the data it will generate (fields such as `summary`, `validationStatus` and `normingStatus`, which can be viewed for an [Assessment](/model-browser.html#Assessment)).

Second, the assessments include some default information about how to present them as tasks in a UI. This information is optional, but if provided, it can be copied to the [scheduling system](./scheduling.html) to display even before an assessment is activated by the user. Once part of a schedule, these values can be further customized by study designers if needed:

|Field|Purpose|
|-----|-------|
|identifier|The identifier of an assessment defines a class of assessments independently of specific revisions, and can be useful to identify resources that ship with a mobile app, like icons or other design elements.|
|labels|An array of labels that can be used to label and localize the assessment. Schedules can also include the assessment’s `title` (which is required).|
|colorScheme|A set of four colors (`background`, `foreground`, `activated` and `inactivated`) in hex triplet format that can be used to tailor the display of the assessment.|
|minutesToComplete|The number of minutes the assessment should take to complete.|

Finally, there will be a set of [ExternalResource](/model-browser.html#ExternalResource) objects that provide links to many kinds of documentation. Those links will be assigned to one of the following categories:

|Category|Purpose of Documentation|
|--------|-----------|
|customization_options|Describes the fields that can be edited, through a special API for this purpose, to customize an assessment in a specific app. These fields are chosen by the assessment authors because they are not believed to effect the validity of the data collected by the assessment.|
|icon|An icon representing this assessment, in study design tools or to participants through your mobile app.|
|data_repository|Describes an online location where data can be found that has been generated by this assessment, in one or more studies.|
|science_documentation|Documentation of the scientific interpretation of the data collected by the assessment. Schema information, like data dictionaries, falls into this category.|
|developer_documentation|Documentation on the software and the assessment configuration that is specifically for implementing an assessment in app development (information about the interpretation of the data that is generated should be marked as "science_documentation."|
|license|The software or other licenses for this assessment.|
|publication|A publication that was based at least in part on data collected through this assessment.|
|release_note|Documentation of changes in a specific revision of an assessment (we suggest that the `minRevision` and `maxRevision` values on this `ExternalResource` should both be set to the revision being documented).|
|sample_app|A sample app showing the implementation of the assessment in working software. Intended for developers who are implementing a new app.|
|sample_data|Sample data for researchers  that is identical to the data generated by the assessment.|
|screenshot|An image file (`format` field should be an image MIME type) showing an example of the assessment’s UI within Bridge’s app SDKs.|
|video_preview|A video file (with a video MIME type format field) or a web page with a video preview of the assessment.|
|see_also|Link to a related assessment, measure, or methodology (it does not need to be in the Bridge system).|
|used\_in\_study|A link to a study that has utilized this assessment (this is a link to some public face for the study, not data or publications from that study).|
|website|Any other website.|
|other|Any other kind of resource that might not be linkable (if you  can link to it, it may be better to categorize it as a website).|

A shared assessment can be scheduled as part of a Bridge `Schedule`, but to modify a shared assessment, it must be [imported into your app](/swagger-ui/index.html#/Shared%20Assessments/importSharedAssessment). You must be signed in to the app context on Bridge, and you must include the ID of the organization that will own the local copy of the shared assessment. Study designers or developers will be able to see and schedule this assessment in any study within the app, but only study designers or developers of the owning organization will be able to edit or customize the assessment. The imported assessment has a link to the shared assessment so you can retrieve all of the resources that document the original assessment.

## Developing assessments

Assessments will begin their development lifecycle in a specific app context. At this point the assessment object is sparse as developers will probably be focused on working out an appropriate configuration for the assessment. Once the software for the assessment has been tested and validated, appropriate documentation can be added through the [Assessment](/model-browser.html#Assessment) fields and its associated [ExternalResources](/model-browser.html#ExternalResource). It can then be [published to the shared assessment library](/swagger-ui/index.html#/Assessments/publishAssessment). A shared assessment's configuration will also be published; however the configuration cannot be changed or customized once it is shared. The external resources documenting the assessment [can then also be published](/swagger-ui/index.html#/Assessments/publishAssessmentResource) to the shared library.

If the assessment has never been published to the library before (its identifier is unique), it will be published at revision 1. Otherwise it will be published at the next highest revision number.

The *local* copy of the published assessment will be updated to reflect that it is now a logical “copy” of the newly shared assessment (its `originGuid` will be set to the GUID of the new shared assessment revision). 

While members of the owning organization will be able to edit the metadata of shared assessments (the assessment and resources), *they will not be able to edit the shared configuration.* To change the configuration, you will need to publish a new revision of your assessment (which should be treated like any other software release).

<div class="ui icon message">
  <i class="circle info icon"></i>
  <p style="margin:0"><b>Why are shared assessment configurations “locked”?</b> The configurations define the code that collects and formats the data produced by the assessment. Changing the configuration could inadvertently change the structure, formatting, or semantic meaning of the data produced. This could invalidate the assessment’s scientific utility.</p>
</div>

Alternatively, you may find a shared assessment that you wish to [import into your app context](/swagger-ui/index.html#/Shared%20Assessments/importSharedAssessmentResource). Importing will create a local copy that will have its `originGuid` set to the GUID of the shared assessment revision, and its configuration will be copied into your local study as well. 

Thus no matter how you create a copy of a shared assessment (publishing or importing), your local copy will be the same:

- it will have an `originGuid` pointing to the shared assessment version of the assessment;
- if the configuration is updated, the assessment will lose this link to its shared assessment.
- however, the local copy of a shared component *can* be customized through [the customization API](/swagger-ui/index.html#/Assessments/customizeAssessmentConfig) while still being considered a valid instance of the assessment.

If you do wish to change a local copy of a shared assessment (e.g. to fix bugs or introduce new behavior), you can do so. If you are a member of the organization that owns the shared assessment, you can publish it as a later revision of the shared assessment. Otherwise you can change the identifier and publish it as a new kind of assessment in the shared library. 

If you want to edit the resources that document the assessment, you have these choices (best done as part of publishing a new revision in the shared library):

- edit the `ExternalResource` in the shared library (for example, you can change the `minRevision` and `maxRevision` fields to reflect whether or not the resource is applicable to a new revision of the assessment);
- create a new `ExternalResource` and publish it to the shared library;
- delete a resource in the shared library (be careful with this option. if it only applies to an older revision of the shared assessment, it is better to set a `maxRevision` value to indicate that);
- import an `ExternalResource`, edit it, and then publish it at the time you publish the rest of the assessment (this last option just lets you coordinate your updates to the shared library).

## Assessment configuration

The assessment configuration can be any valid JSON and is not currently constrained by the server beyond the following rules:

- Each object node should have an `identifier` property with a value that is unique in your configuration JSON graph;
- Each object node should have a `type` property indicating the type of that node (usually the strict type the node would be deserialized to by a server or client).

**Note:** as Sage Bionetworks refines the assessment configuration model, these rules may change and more type information may be introduced.

## Customizing an assessment's configuration

Only local assessments can be customized (shared assessments, being shared, cannot be tailored to use in a specific app). The `customizationFields` of the [Assessment](/model-browser.html#Assessment) model specifies the nodes of a JSON tree that can be customized. The top-level properties are the identifiers of the nodes that have customizable properties. The value is an array of [PropertyInfo](/model-browser.html#PropertyInfo) objects. Each of these objects describes one property of the object node that can be customized through the customization API, along with some metadata for editing tools.

```json
{
  "Bnm_u6qFhrdmvW82nx2nFRyi": [
    {
      "propName": "label",
      "label": "The screen's label",
      "description": "The text in the title bar at the top of the screen",
      "propType": "string",
      "type": "PropertyInfo"
    }, 
    {
      "propName": "prompt",
      "label": "The screen's prompt",
      "description": "The text above the button to begin the test.",
      "propType": "string",
      "type": "PropertyInfo"
    }
  ],
  "L4gdW7rIttLVuurmBg5P9k5x": [
    {
      "propName": "metadata:show_back_button",
      "label": "Show back button?",
      "description": "Should the UI show a back button on this screen?",
      "propType": "boolean",
      "type": "PropertyInfo"
    },
    {
      "propName": "metadata:show_forward_button",
      "label": "Show forward button?",
      "description": "Should the UI show a forward button on this screen?",
      "propType": "boolean",
      "type": "PropertyInfo"
    }
  ]
}
```
Any changes that are submitted through the customization API that do not match these allowable fields will be ignored. The assessment will still be linked to a shared assessment (it will still have its `originGuid` field set) if it has ever been published to or imported from the shared assessments library.

## Referencing Assessments

There are two ways for a mobile app to work with assessments.

### App Config

If your app intends to use the Bridge platform but you do not wish to use its scheduling APIs, you can directly reference the assessments in the `AppConfig` for your app.

```json
{
  "assessmentReferences": [
    {
      "guid": "7iNDDklQm2Bt4HNqB_0mmqRL",
      "id": "body-area-draw",
      "sharedId": "body-area-draw",
      "configHref": "https://ws.sagebridge.org/v1/assessments/7iNDDklQm2Bt4HNqB_0mmqRL/config",
      "type": "AssessmentReference"
    },
    {
      "guid": "tiNjSpVAwIomGkWKcCFH6rzz",
      "id": "body-area-imaging",
      "configHref": "https://ws.sagebridge.org/v1/assessments/tiNjSpVAwIomGkWKcCFH6rzz/config",
      "type": "AssessmentReference"
    }
  ],
  "type": "AppConfig"
}
```

Each reference provides the link to download the config for that assessment. If a `sharedId` field is present, the assessment was derived from a shared assessment. 

<div class="ui icon message">
  <i class="red circle warning icon"></i>
  <p style="margin:0">These references will be updated to merge their content with the <code>AssessmentReference</code> objects described below for the scheduling API.</p>
</div>

### Schedules

Schedules can also include this information as part of a description of the assessment. It can be tailored to each usage of the assessment in a schedule, and schedule authoring tools should copy over all relevant values from an assessment (however an assessment is only required to include the `guid`, `appId`, and `title`, and the only required fields in this reference are `appId` and `guid`).

```json
{
  "sessions":[
    {
      "assessments":[
        {
          "guid":"y5NqJgkHz37ge9RnEtgioraS",
          "appId":"api",
          "identifier":"medication-tracker",
          "title":"Medication Tracker",
          "labels":[
            {
              "lang":"en",
              "value":"Enter your medications",
              "type":"Label"
            }
          ],
          "minutesToComplete":1,
          "colorScheme":{
            "background":"#ff00ff",
            "foreground":"#0022ff",
            "activated":"#339922",
            "inactivated":"#993399",
            "type":"ColorScheme"
          },
          "type":"AssessmentReference"
        }
      ],
      "type":"Session"
    }
  ],
  "type":"Schedule"
}
```