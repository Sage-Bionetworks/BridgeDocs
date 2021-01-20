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