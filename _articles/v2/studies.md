---
title: Studies
layout: article
---

<div id="toc"></div>

A Bridge app can be used to run one or more [studies](/model-browser.html#Study), which may have participants who have enrolled in more than one of these studies. Each study is sponsored by an [organization,](/articles/v2/authorization.html#organizations) which grants permission to the members of that organization to access the study (according to their assigned roles). 

<div class="ui icon message">
  <i class="circle info icon"></i>
  <div class="content">
  Initially, only one organization will be able to sponsor a study, and a user will hold the same roles vis-a-vis every study they can access as an organization member. This will be enhanced after the initial v2 APIs are released, as part of a larger project to unify Sage Bionetwork’s two platforms—Bridge and Synapse—into a coordinated product line.*
  </div>
</div>

## Study Lifecycle

Studies follow a lifecycle that supports the proper performance of study research. New studies are created in the `design` phase and are manually advanced by study owners as appropriate.

| Phase       | Description |
|-------------|-------------|
| legacy      | This study was created prior to the addition of study phases, and does not participate in any of the lifecyle constraints. |
| design      | The study can be edited, including the associated schedule, and the schedule can be changed (assuming a non-published schedule is associated to the study). The study is not visible in public registries, and when an account is enrolled in a study in `design,` the `test_user` data group will be added to the account if it does not yet exist. The study can be logically or physically deleted by a developer, study designer, or admin. When ready, this study can be transitioned via the `recruit` endpoint. |
| recruitment | To move to recruitment, the associated app should be available in the app store and the IRB approval for the study must be recorded as part of the study (there may be other criteria that must be met at this time).<br><br>The study metadata can be edited during recruitment, but the associated schedule cannot be changed, nor can that schedule itself be changed (an unpublished schedule associated to the study will be published in this transition). The study becomes visible in public registries, and accounts are enrolled normally (no test tag). The study cannot be logically or physically deleted. When recuitment targets have been met, this study can be transitioned via the `execute` endpoint. |
| in_flight   | The study metadata can be edited, but the schedule remains immutable. The study should no longer be visible in public registries, and attempts to enroll an account in the study will be rejected (HTTP response code: `423`). The study cannot be logically or physically deleted. The app should still be available in app stores in case a current participant needs to reinstall the app to continue the study. When appropriate, this study can be transitioned via the `close enrollment` endpoint. **Note: the system may be able to do some checks at this time to determine all participants are finished with the study.** |
| analysis    | The study can no longer be edited in any way. The study should no longer be visible in public registries, and attempts to enroll an account in the study will be rejected (HTTP response code: `423`). Any uploads that are attempted once the study transitions to this state will be rejected and/or not uploaded to Synapse. The study cannot be logically or physically deleted. The app can be removed from app stores if it is not used to conduct any other studies. When this analysis is done, the study can be transitioned via the `closeout` endpoint. |
| completed   | The study can no longer be edited in any way. The study should no longer be visible in public registries, and attempts to enroll an account in the study will be rejected (HTTP response code: `423`). The study will still be available in Bridge so that final IRB reporting can occur. Once this has been done, the study can be logically deleted. |
| withdrawn   | A study can be transitioned from any other phase than `completed` to the `withdrawn` state. At this point the study cannot be changed at all, but the study can be logically deleted. There may be additional requirements in the future. |

## Information about a study for end users

In addition, the study contains important information for participants that the client will want to access to render the appropriate APIs:

| Field | Required | Description |
|-------|----------|-------------|
| identifier | Y | |
| name | Y | |
| clientData | N | |
| phase | Y | |
| scheduleGuid | | |


## Enrollment

A user must create an account in Bridge before they can be enrolled in a study. There are three ways to be enrolled in a study:

### Self-enrollment

**The user creates an account,** using the [SignUp](/swagger-ui/index.html#/Authentication/signUp) API, verifies their email or phone number, and then attempts to sign in. Upon detection that the user is not consented to participate in research (the user receives a 412 exception), the user is presented with the ability to consent using Bridge’s electronic consent APIs. When the user signs the consent for a study, they are enrolled in that study. Note that the user no longer receives a 412 after being enrolled in at least one study, so the [UserSession](/model-browser.html#UserSession) may need to be examined to determine if the user is in a particular study.

### Manual enrollment by study administrator

**An administrator [manually enrolls an existing participant,](/swagger-ui/index.html#/Studies/enrollParticipant)** optionally providing an external ID to identify the participant in the study. Only the `userId` is required in the `Enrollment` payload for this call.

**An administrator creates an account directly enrolled in a study.** This last option is necessary to create accounts that have only an external identifier as an authentication credential (you cannot add an external identifier to an account after it is created, if it is the only means of identifying the account other than the user's record ID).

In the latter two cases where an administrator is enrolling a user on their behalf, external partners are responsible for ensuring they meet their IRB’s requirements for informed consent of the participant.

Enrollments can be [enumerated](/swagger-ui/index.html#/Studies/getEnrollees) for a study (including the number of participants who have withdrawn from the study). Users can [withdraw from a study](/swagger-ui/index.html#/Studies/withdrawParticipant) or [withdraw from all studies in an app.](/swagger-ui/index.html#/Consents/withdrawFromApp)

In the user’s session, enrollments are given with the following JSON through two read-only properties, `studyIds` and `externalIds`:

```json
{
  "studyIds": ["study1", "study2"],
  "externalIds": {
    "study1": "externalId1",
    "study2": "externalId2"
  },
  "type": "UserSessionInfo"
}
```

## External IDs

An *external ID* is an identifier that is created and managed outside of Bridge, but associated to a user’s account so researchers can re-identify users at a later time (if they hold a mapping for these identifiers). The [External  identifiers APIs](/swagger-ui/index.html#/External%20Identifiers) allow you to [create](/swagger-ui/index.html#/External%20Identifiers/createExternalId) and [enumerate](/swagger-ui/index.html#/External%20Identifiers/getExternalIds) accounts using only an [ExternalIdentifier](/model-browser.html#ExternalIdentifier) object. 

You may wish to create accounts that are *only* identifiable by an external ID. ***Sage Bionetworks does not recommend this practice for two reasons:***

1. The only way we can authenticate such an account is by using the external ID as a credential (instead of an email or phone number), but by its nature, it cannot be too difficult for participants to enter, so it is usually not complex enough to evade brute force attacks;
1. If the account does not have a phone number or email address, we cannot trigger a “reset password” worfklow for the user. You will either need to create the account with a password and communicate that to the user, or  we have seen implementers hard-code the password for an app, **which is not secure.**

Bridge recommends use of the phone number of the user’s device as an account credential, as it provides a balance of security and anonymity for the account holder, with a fallback to email address for those devices that do not have a phone number.

## Participant APIs

A more complete view of the participants’ in a study can be retrieved through the [Study participants API.](/swagger-ui/index.html#/Study%20Participants) Many additional APIs exist to work with the account, such as to resend an email verification request or to withdraw a participant from the study. 