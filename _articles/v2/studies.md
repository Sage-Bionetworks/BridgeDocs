---
title: Studies
layout: article
---

{% include v2.html %}

<div id="toc"></div>

A Bridge app can be used to run one or more [studies](/model-browser.html#Study), with participants who can enroll in one or more of these studies. Each study is sponsored by an [organization,](/articles/v2/authorization.html#organizations) which grants permission to the members of that organization to access the study (according to their assigned roles). 

<div class="ui icon message">
  <i class="circle info icon"></i>
  <div class="content">
  While multiple organizations can sponsor a study, a user is only able to be a member of one organization at this time. This organization gives them the same roles vis-a-vis all the studies the organization sponsors. This will be enhanced after the initial v2 APIs are released.
  </div>
</div>

## Study Lifecycle

Studies follow a lifecycle that supports the proper performance of study research. New studies are created in the `design` phase and are manually advanced by study coordinators as appropriate.

{% include image.html url="/images/study-phases.svg" 
  description="Study lifecycle flow chart" %}

###### Study lifecycle phases
| Phase       | Description |
|-------------|-------------|
| legacy      | This study was created prior to the addition of study phases, and does not participate in any of the lifecyle constraints. To move this study into the lifecycle, this study can be transitioned via the [design endpoint.](/swagger-ui/index.html#/Studies/transitionStudyToDesign) |
| design      | The study can be edited, including the associated schedule, and the schedule can be changed. The study is not visible in public registries, and when an account is enrolled in a study in the `design` phase, the `test_user` data group will be added to the account if it does not yet exist. The study can be logically or physically deleted by a developer, study designer, or admin. When ready, this study can be transitioned via the [recruit endpoint.](/swagger-ui/index.html#/Studies/transitionStudyToRecruitment) |
| recruitment | To move to recruitment, the associated app should be available in the app store and the IRB approval for the study must be recorded as part of the study.<br><br>The study metadata can be edited during recruitment, but the associated schedule and custom events cannot be changed, nor can the study be switched to another schedule. The study becomes visible in public registries, and accounts are enrolled normally (no test tag is added). The study cannot be logically or physically deleted. When recruitment targets have been met, this study can be transitioned via the [conduct endpoint.](/swagger-ui/index.html#/Studies/transitionStudyToInFlight) |
| in_flight   | The study metadata can be edited, but the schedule remains immutable. The study should no longer be visible in public registries, and attempts to enroll an account in the study will be rejected (HTTP response code: `423`). The study cannot be logically or physically deleted. The app should still be available in app stores in case a current participant needs to reinstall the app to continue the study. When appropriate, this study can be transitioned via the [analyze endpoint.](/swagger-ui/index.html#/Studies/transitionStudyToAnalysis) **Note: the system may be able to do some checks at this time to determine all participants are finished with the study.** |
| analysis    | The study can no longer be edited in any way. The study should no longer be visible in public registries, and attempts to enroll an account in the study will be rejected (HTTP response code: `423`). Any uploads that are attempted once the study transitions to this state will be rejected and/or not uploaded to Synapse. The study cannot be logically or physically deleted. The app can be removed from app stores if it is not used to conduct any other studies. When this analysis is done, the study can be transitioned via the [complete endpoint.](/swagger-ui/index.html#/Studies/transitionStudyToCompleted) |
| completed   | The study can no longer be edited in any way. The study should no longer be visible in public registries, and attempts to enroll an account in the study will be rejected (HTTP response code: `423`). The study will still be available in Bridge so that final IRB reporting can occur. Once this has been done, the study can be logically deleted. |
| withdrawn   | A study can be transitioned from any other phase than `completed` to the `withdrawn` state, using the [withdraw endpoint.](/swagger-ui/index.html#/Studies/transitionStudyToWithdrawn) At this point the study cannot be changed at all, but the study can be logically deleted. There may be additional requirements in the future. |

## Information for study display and oversight

Even before a participant signs in to a Bridge app, it is possible to retrieve [`StudyInfo`](/model-browser.html#StudyInfo) from Bridge using a public (unauthenticated) [study info API.](/swagger-ui/index.html#/Studies/getStudyInfo) This information may be helpful for tailoring a UI. In one Bridge app for example, participants were prompted to enter their study ID, and then the app used that information to tailor the sign in screen to that specific study in the app.

The fields in the [`StudyInfo`](/model-browser.html#StudyInfo) object are a subset of the fields that exist in the larger `Study` model (which can be retrieved by participant apps after sign in, via the [get study API](/swagger-ui/index.html#/Studies/getStudy).

| Field | Required | Description |
|-------|----------|-------------|
| identifier | Y | A string identifier that is unique for this study in the context of the app where it is hosted (lower- or upper-case letters, numbers, dashes, and/or underscores only). |
| name | Y | The name of the study as you would like it to appear to participants. |
| details | N | This is a long form textual description of the study for prospective participants. It can embed rich text formatting (such as markdown) if the client will support rendering the notation. |
| phase | Y | The phase of this study (see above). |
| studyLogoUrl | N | If supplied, it should be an URL to download and display a vector-graphic (SVG) logo or graphic identifying this study. See information on uploading a logo image, below. |
| colorScheme | N | A set of colors that can be used to customize an app when the user is in the context of performing this study. |
| signInTypes | N | Participants may be enrolled with different credentials, necessitating different method of authenticating users with the Bridge server. On a per study basis, a study can indicate the optimal sign in method. A client may ask the participant for their study, then query the server for this information in order to display the appropriate sign in screen to the participant. Values should be interpreted to be in the order of their importance, if there are multiple options given. Possible values are enumerated in the <a href="/model-browser.html#SignInType">SignInTypes</a> enumeration. |

Study designers can upload a study logo. The API is similar to the [hosted files API](/swagger-ui/index.html#/Files):

1. The developer should create a [FileRevision](/model-browser.html#FileRevision) object for the image and submit it via the [logo creation API](/swagger-ui/index.html#/Studies/createStudyLogo);
1. The revision will be returned with a pre-signed URL to PUT the content of the image to Amazon's S3 file hosting service (the URL expires in 10 minutes);
1. The developer should PUT the file contents to S3;
1. The developer should call [the API to mark the logo upload as completed](/swagger-ui/index.html#/Studies/finishStudyLogoUpload).

After the second call to record that the upload is finished, the study object’s `studyLogoUrl` will be updated with an HTTP link to download the logo image. The updated study object is returned from the finish API.

Another set of fields on the `Study` model contain information for study designers and for oversight:

| Field | Required | Description |
|-------|----------|-------------|
| scheduleGuid | (Y) | The GUID of the schedule that will be used to generate a timeline for participants in this study. The GUID can be used to retrieve the appropriate `Timeline` through the APIs. This field is required to move into the recruitment phase. *NOTE: Bridge will implement a `Protocol` design for v2 that includes study arms with different schedules assignable to each arm of the study. Currently Bridge implicitly assumes a study with one arm, e.g. no control vs. intervention groups.* |
| clientData | N | This is an arbitrary JSON object graph that the client can use to store extra information about a study that is not specified in the Bridge schema. |
| institutionId | N | If the investigator or sponsoring institution have assigned this study an identifier of some kind, it should be recorded in this field. |
| diseases | N | What disease state is this study researching? Can be general (neurodegenerative disorders) or specific (progressive supranuclear palsy). This is an array of values and the individual entries are not currently constrained. |
| studyDesignTypes | N | What type of research design is being used in this study (intervential, observational, cohort study, cross-over, etc.). This is an array of values and the individual entries are not currently constrained. |
| keywords | N | Free text keyword values to aid in searching for this study (to categorize it, please use the `diseases` and `studyDesignTypes` arrays). |
| irbName | N | The name of the IRB that approved the study or decided it was exempt from human subjects research guidelines. Optional, but can be used to identify one of several IRBs if more than one is included in the study’s contact information. |
| irbProtocolName | N | The name of the protocol as it was submitted to the IRB for approval. |
| irbProtocolId | N | The identification number issued by the IRB for the study, if any. |
| irbDecisionOn | (Y) | Before the study can launch, it must be reviewed by your IRB and either be approved, or considered exempt from human subjects research guidelines. Once `irbDecisionOn` is set, `irbDecisionType` and `irbExpiresOn` must also be set. |
| irbDecisionType | (Y) | The type of decision issued by the IRB, either `approved` or `exempt`. |
| irbExpiresOn | (Y) | The last date that the IRB’s review is considered up-to-date for this study. Only required if the IRB’s decision was an approval and not an exemption. |
| contacts | Y | An array of `Contact` objects that describe contact information that you intend to display to participants and other end users of the study (the array can be empty; see below). |

A contact contains the following information:

| Field | Required | Description |
|-------|----------|-------------|
| name | Y | The name of the person or organization, e.g. “Dr. Tim Powers, Ph.D.” or “Sage Bionetworks”. |
| role | Y | The purpose of the contact. The values that are supported include `irb`, `principal_investigator`, `investigator`, (fiscal) `sponsor`, `study_support` and `technical_support`.  | Professor of Psychiatry and . |
| position | N | The position of an individual relative to their institutional affiliation (not their role in the study, please use the role attribute for this). For example, “AssociateBioengineering.” |
| affiliation | N | The organization an individual is affiliated with, e.g. "UC San Francisco”. This may or may not be the same as the institution sponsoring the study. |
| address | N | The full mailing [Address](/model-browser.html#Address), if required (see below). |
| email | N | Email address of an individual or organization. |
| phone | N | [Phone number](/model-browser.html#Phone) of an individual or organization. |
| jurisdiction | N | The regulatory jurisdiction of this entry. When multiple jurisdictions are involved in a study, there may be principal investigators, IRBs, and study coordinators involved from each jurisdiction. It may be useful to show a participant the people and organizations involved in their specific jurisdiction, or the primary jurisdiction and their specific jurisdiction, or all jurisdictions. |

The `Address` is suitable for displaying an address to end users. 
    
| Field | Required | Description |
|-------|----------|-------------|
| placeName | N | The name of a building, or sometimes the name of the organization at the address. |
| street | N | A street (usually a number and a name, but anything that defines the locality). |
| mailRouting | N | Mail routing information such as a unit, P.O. box, mail stop, or other directions on where to deliver mail at the locality. |
| city | N | City. In the example from the Philippines above, there are two municipalities specified. |
| division | N | state, province, prefecture |
| postalCode | N |  Zip code, post code, etc. |
| country | N | Country. |

Here are some examples of more unusual addresses and how they might be stored:

<dl>
<dt style="font-style: italic">50 miles (80 km) West of Socorro, New Mexico, USA</dt>

<dd><code>mailRouting</code> = “50 miles (80 km) West of”<br>
<code>city</code> = “Socorro”<br>
<code>division</code> = “New Mexico”<br>
<code>country</code> = “USA”</dd>

<dt style="font-style: italic">647 National Road<br>
16 Sunlight Building<br>
Barangay Muzon, Taytay, Rizal<br>
Taytay CPO-PO Box# 1920 + Rizal<br>
Philippines</dt>

<dd><code>placeName</code> = “647 National Road”<br>
<code>street</code> = “16 Sunlight Building”<br>
<code>city</code> = “Barangay Muzon, Taytay”<br>
<code>division</code> = “Rizal”<br>
<code>mailRouting</code> = “Taytay CPO-PO Box# 1920”<br>
<code>country</code> = “Philippines”</dd>
</dl>

## Participant APIs

A more complete view of the participants’ in a study can be retrieved through the [Study participant APIs.](/swagger-ui/index.html#/Study%20Participants) Many additional APIs exist to work with an enrolled account in a study, such as to resend an email verification request or to withdraw a participant from the study. 