---
title: Getting Started
layout: article
---

These instructions are intended to guide you through setting up an iOS app that 
uses [BridgeApp](https://github.com/Sage-Bionetworks/BridgeApp-Apple-SDK "BridgeApp") 
to link [BridgeSDK](https://github.com/Sage-Bionetworks/Bridge-iOS-SDK "BridgeSDK") 
with [SageResearch](https://github.com/Sage-Bionetworks/SageResearch "SageResearch").
This is not intended as a full guide to building iOS applications, but only as a guide
to step your through the more convoluted parts of initial setup.  This guide is a work-in-progress
and will be updated as functionality is added by the Bridge team to support shared tasks and 
activities.

## Xcode Project Setup

### 1. Create a new project

It is better to start with a new project rather than attempt to modify the sample apps that are included 
with [SageResearch](https://github.com/Sage-Bionetworks/SageResearch "SageResearch") or 
[BridgeApp](https://github.com/Sage-Bionetworks/BridgeApp-Apple-SDK "BridgeApp") directly. This is for two reasons. 
First, these projects are *not* set up to be able to release a production iOS app to the App Store or as an 
Enterprise App. Second, you cannot then save your changes to github because these projects are read-only 
*examples*.

### 2. Add Capabilities

You will need to add Capabilities for Keychain Sharing as well as certain background modes. Most projects
that use Bridge are set up with the following:

* Keychain Sharing - The login information is saved to the keychain. Your application will need to set up a 
shared keychain `org.sagebase.Bridge` so that [BridgeSDK](https://github.com/Sage-Bionetworks/Bridge-iOS-SDK "BridgeSDK") 
can manage saving and storing the login credentials in the keychain.

* Background Modes - Some [SageResearch](https://github.com/Sage-Bionetworks/SageResearch "SageResearch")
tasks use background audio (to allow for spoken instructions) or location updates. Additionally, uploading task 
and survey results via [BridgeSDK](https://github.com/Sage-Bionetworks/Bridge-iOS-SDK "BridgeSDK") is done 
in the background.

* App Groups - The app groups allows for shared `UserDefaults` and `CoreData`. If setting up an app group, also include the `appGroupIdentifier` key in the `BridgeInfo-private.plist` file.

* Associated Domains - If your app uses phone or email based sign-in with app links, you will need to specify whatever domain you are intercepting and the SMS/email sign-in messages would need to format the link with that domain.

* HealthKit - If your app accesses `HealthKit` data. 
**For `HealthKit` data that is required such as demographic information, this should be stored in the user's Bridge profile for use by researchers as well as for use by your application in case the user does *not* give your application authorization to access `HealthKit`.**

### 3. Add permissions to the Info.plist

Many active tasks require user authorization in order to gather data from the phone's sensors or HealthKit. 

For certain types of permissions, you can use 
[RSDStandardPermissionsStep](http://researchkit.org/SageResearch/Documentation/Research/Protocols/RSDStandardPermissionsStep.html) 
as a starting point for setting up the permissions required by your application.

Typically, requesting authorization will be handled by the OS with a pop-up alert. You are required to include a description 
that will appear in this alert to describe how, why, and when the phone's sensors are being accessed. A full list of the 
required privacy permission keys is available 
[here](https://developer.apple.com/library/content/documentation/General/Reference/InfoPlistKeyReference/Articles/CocoaKeys.html "Cocoa Keys") .

|SBAPermissionTypeIdentifier|Xcode Info.plist Name|
|---|---|
|healthKit|Privacy - Health Update Usage description|
||Privacy - Health Share Usage Description|
|location|Privacy - Location When In Use Usage Description|
||Privacy - Location Always Usage Description|
|coremotion|Privacy - Motion Usage Description|
|microphone|Privacy - Microphone Usage Description|
|camera|Privacy - Camera Usage Description|
|photoLibrary|Privacy - Photo Library Usage Description|

### 4. Change "Deployment Info -> Main Interface" to `LaunchScreen`

The Main storyboard should only be displayed to a signed in user.

## Github Project Setup

### 1. Create the repo on github 
This [link](https://help.github.com/articles/adding-an-existing-project-to-github-using-the-command-line/ "Add Project to Github") 
has instructions for adding an existing project via the command line.

### 2. Adding [BridgeApp](https://github.com/Sage-Bionetworks/BridgeApp-Apple-SDK "BridgeApp") as a submodule
This [link](https://github.com/blog/2104-working-with-submodules "Working with Submodules") 
gives a good overview of working with submodules.  

[BridgeApp](https://github.com/Sage-Bionetworks/BridgeApp-Apple-SDK "BridgeAppSDK") is setup to include
pointers to the submodule commits for all included frameworks that it references so you do not need to 
add those submodules separately. To do this, you will need to add the submodule for BridgeApp and then
update the submodules that it references.

````
git submodule add https://github.com/Sage-Bionetworks/BridgeApp-Apple-SDK.git BridgeApp-Apple-SDK
cd BridgeApp-Apple-SDK/
git submodule update --init --recursive
cd ..
````

## Bridge Setup

### 1. Add BridgeApp.xcodeproj to your Xcode project

Highlight the `Frameworks` group within your Xcode project. Select `Add Files to...` 
to open a file selection dialog. Select all the projects that are required by BridgeApp:

* `\BridgeApp\BridgeApp.xcodeproj` 
* `\BridgeApp\BridgeSDK\BridgeSDK.xcodeproj`
* `\BridgeApp\Research\Research.xcodeproj`
* `\BridgeApp\ResearchUI\ResearchUI.xcodeproj`


### 2. Add each Framework as an Embedded Binary

* Select the App project and select the `General` settings tab.
* Under `Embedded Binaries` select the `+` button.
* Add each of the Framework binaries listed above. 
* Then under `Linked Frameworks and Libraries` move the `BridgeAppSDK.framework` to 
build **after** the other frameworks.

After linking the binaries for each framework, build the project.

### 3. Modify `AppDelegate` to inherit from `SBAAppDelegate`

In order to inherit the functionality included in the base class `SBAAppDelegate` you will need to modify
the app delegate created initially.  This will setup default behaviors that you can optionally override
from within the subclass.

````
//
//  AppDelegate.swift
//  GettingStarted
//

import UIKit
import BridgeApp
import BridgeSDK

@UIApplicationMain
class AppDelegate: SBAAppDelegate {


}
````

### 4. Download CMS Public Key

Login to the [Sage Researcher UI](https://research.sagebridge.org "Researcher UI") for your study. Navigate to 
"Settings -> General" and tap the button "Download CMS Public Key..." in the upper right corner next to the 
"Save" button. In the div, tap the "Download" button. Save the pem file to a private folder accessible from 
your Xcode project that is *not* part of the github repo (if this is an open source repo). Add the file to 
your Xcode project.

### 5. Add `BridgeInfo.plist` (required) and `BridgeInfo-private.plist` (optional)

Find the `BridgeInfo.plist` file that is included in `BridgeAppExample`. Copy/paste the file into 
your project support files. Remove or edit the keys in this file to include those required by your 
application. If your project is intended to be open source, you will want to include a file 
`BridgeInfo-private.plist` that points to those fields that should be kept private. The private 
plist will override any fields included in the open source version of the file. `BridgeAppExample`
does not include a private plist so that it can be run from the simulator. The info included in this
file is used defined the mapping to the [Sage Researcher UI](https://research.sagebridge.org "Researcher UI").
For detailed usage, see code file `BridgeSDK/SBBBridgeInfo.m`

|Key|Private|Optional|Description|
|---|---|---|---|
|studyIdentifier|YES|NO|"The identifier for this study" shown in "Settings -> General"|
|certificateName|YES|NO|The name of the CMS public key pem file|
|cacheDaysAhead|NO|NO|The number of days ahead to cache of upcoming scheduled activities|
|cacheDaysBehind|NO|NO|The number of days behind to cache of completed and expired scheduled activities|
|appUpdateURL|YES|YES|URL for updating the app|
|appGroupIdentifier|YES|YES|The app group identifier under your target's Capabilities in Xcode if you want BridgeSDK to use that shared space.|

### 6. Set up Sign-in and Main view controller

[mPower 2](https://github.com/Sage-Bionetworks/mPower-2-iOS "mPower 2") is currently the only app that is using both phone SMS and external ID sign in. This application is structured with two target apps within it. `mPower2` is the app that has been released to the Apple App Store. `mPower2TestApp` is used for unit testing, to allow UI testing of different permutations of a complicated activity schedule, and to test the `MotorControl` framework, which is designed as a stand-alone framework of active tasks that can be used independently of either the containing application or Bridge services.

We recommend that you structure your app using a "module" structure for the active tasks to facilitate using these validated tasks without requiring integration with Sage Bridge and Synapse services.

To set up and use Bridge schedules and upload schemas, your view controllers will need to use a `SBAScheduleManager` instance or a `SBAReportManager` instance as the data source. See `TaskBrowserViewController` in the mPower2 project for an example.

## Bridge Survey Setup

The [Sage Researcher UI](https://research.sagebridge.org "Researcher UI") currently supports several basic survey question types. To create and schedule a standard survey, you will need to do the following.

### 1. Open the [Sage Researcher UI](https://research.sagebridge.org "Researcher UI")

#### a. Create the Survey

Navigate to the "Surveys" menu item using the left menu in the Researcher UI. Tap the "New Survey" button 
in the upper right corner. Give your survey a name and identifier and then add at least one question. 
Because there is no auto-save of a survey that you are currently editing, you should tap the "Save" button 
to save your progress after each step that you add to the survey.

#### b. Save and Publish

Tap the "Save" button to ensure that your progress has been saved. Then navigate to the "History & Publication" tab and tap the "Publish" button. Without this step, your survey will not be displayed in the scheduling interface. For a long survey, you should publish the survey intermittently so as to have a record of your changes.

#### c. Add a `Schedule`

Navigate to the "Scheduling" menu item. Tap the "New Schedule Plan" button in the upper right. Assign a label for
the schedule, and include one or more activities. In this case, you will need to set "Take Survey" drop-down 
with the survey you have just published. Remember to then tap the "Save" button to save your schedule.

#### d. Add the Survey to the AppConfig

Navigate to the "App Configs" and add the survey to the app config for your application. You can also add information to the clientData JSON blob, and add schemas that are used by your application to upload task data.

### 2. Within your App

Using only the standard survey question types provided via the Bridge UI, no further actions are required. However, if you do wish to customize the Bridge surveys, you will need to implement the `taskViewController(_ taskViewController: UIViewController, viewControllerForStep stepModel: RSDStepViewModel) -> UIViewController?` method of the `RSDTaskViewControllerDelegate` to return a custom step view controller.

## Research Task Setup

To add a custom active task, you will need to set up JSON files defining the task, include factory overrides for any custom steps, and include a storyboard or nib for any custom view controllers. See `MotorControl` within the mPower2 project for an example. Additionally, you will need to set up the task and schema for uploading to synapse and scheduling the task. 

The following example instructions use the "Tapping" test as an example.

### 1. Open the [Sage Researcher UI](https://research.sagebridge.org "Researcher UI")

#### a. Add a `Task Identifier`

Navigate to the "Task Identifiers" menu item using the left menu of the Bridge Study Manager UI. Enter "Tapping" 
and tap the "Add" button. Then save by tapping the "Save" button. **Use only alphanumeric characters in your identifiers!**

#### b. Add a `Upload Schema`

Navigate to the "Upload Schemas" menu item using the left menu. Tap on the "New Schema" button. Enter "Tapping" as
both the `Name` and `Identifier` for the task schema. Then add the fields that map to the results for this schema. 
Be sure to tap the "Save" button to save your schema before navigating away from this tab.

To understand how the mapping works, you will need to go spelunking by searching out `RSDArchivable`. This is a protocol that is used to indicate which results should be archived and uploaded. For example, the `Tapping` schema would include the archived result from the motion sensors, the `MCTTappingResultObject`, and all `RSDAnswerResult` objects included in the top-level `RSDTaskResult`. The schema looks like this:

|Field|Type|
|---|---|
|answers.handSelection|String|
|answers.medicationTiming|String|
|right_motion.json|Attachment|
|left_motion.json|Attachment|
|right_tapping.samples|Attachment|
|left_tapping.samples|Attachment|

The "answers" file is a JSON dictionary with a mapping of all the `RSDAnswerResult` objects where `identifier` is the key and 
`value` is the value. The "right_motion.json" file is the motion sensor recording for the right hand and "left_motion.json" is 
the motion sensor recording for the left hand. The "right_tapping.samples" and "left_tapping.samples" fields are defined by 
the `MCTTappingResultObject` archive where a JSON dictionary file is created for "right_tapping" and "left_tapping" and the 
"samples" is a key within that dictionary.

#### c. Add a `Schedule`

Navigate to the "Scheduling" menu item. Tap the "New Schedule Plan" button in the upper right. Assign a label for
the schedule, and include one or more activities. In this case, you will need to set "Do Task" with the selected
task as "Tapping". Remember to then tap the "Save" button to save your schedule. 

### 2. Map the identifiers in the App Config

#### a. Add the `Task Identifier` to the `clientData`

By default, for schedules that use a "Task Identifier", the schedule manager will look in the `SBABridgeConfiguration` for the 
mapping to find the task. The default is to look for a resource file in the main bundle with the same name as the task. For a 
more complicated set up, you can either add the task to the bridge configuration in code or by adding a JSON blob to the 
client data. See the mPower2 `DataSourceManager` for an example of a hard coded mapping. See `SBAActivityMappingObject` for 
the JSON schema for setting up client data for download from the AppConfig.

#### b. Add the "Schema Revision" to the "Schemas (Tasks)" in the App Config

Navigate to the "App Config" menu item using the left menu of the Bridge Study Manager UI. Select the app configuration for your application. Under the list of schemas, add the schema and set the revision number. Hit the "Save" button to save. 

## Conclusion

While this is not a complete set of detailed instructions for all the various permutations 
that may be applicable for your project, hopefully this guide provides enough instruction to
get you started developing your own iOS research applications.
