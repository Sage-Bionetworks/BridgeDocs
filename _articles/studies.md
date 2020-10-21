---
title: Studies
layout: article
---

<div id="toc"></div>

A Bridge app can be used to run one or more studies, which may have overlapping or discrete participants. Each study is sponsored by one or more organizations, and the administrative accounts for that organization will have privileged access to work with the study.

## Organizational sponsors

A study can be ”sponsored” by one or more organizations. The members of this organization have privileged access to the study, based on the user’s roles(s). Other administrators in a Bridge app may be able to view the presence of some aspects of a study, but will not be able to edit the study, enroll or withdraw members, or see the data collected for the study.

After creating an account, it can be associated to a study through the [add member](/swagger-ui/index.html#/Organizations/addMember) and [remove member](/swagger-ui/index.html#/Organizations/removeMember) APIs. The members of an organization can be [enumerated through a search API](/swagger-ui/index.html#/Organizations/getMembers) as well, and a special API exists to return [administrative users who are currently unassigned to an organization](/swagger-ui/index.html#/Organizations/getUnassignedAdminAccounts) (useful for finding the account you have just created).

## Enrollment

A user must create an account in Bridge before they can be enrolled in a study. There are two ways to be enrolled in a study:

1. The user can consent to participate to a consent that will enroll them in a specific study;
1. A study administrator can create [StudyParticipant](/model-browser.html#StudyParticipant) that includes an `enrollment` property with an [Enrollment](/model-browser.html#Enrollment) object. This will enroll the account in a study at the same time as it is created. The `Enrollment` must include the study ID and may optionally include an external ID;
1. A study administrator can [manually enroll an existing participant,](/swagger-ui/index.html#/Studies/enrollParticipant) optionally providing an external ID to identify the participant in the study.

In the second two cases where a user is not enrolling themself, researchers must be sure they have acquired informed consent from the participant outside of Bridge.

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

You may wish to create accounts that are only identified by an identifier that you create and manage outside of Bridge. *External IDs are application scoped and must be associated to a study in that app.* The [External identifiers APIs](/swagger-ui/index.html#/External%20Identifiers) allow you to [create](/swagger-ui/index.html#/External%20Identifiers/createExternalId) and [enumerate](/swagger-ui/index.html#/External%20Identifiers/getExternalIds) accounts using only an [ExternalIdentifier](/model-browser.html#ExternalIdentifier) object. 

<div class="ui warning message">
    <p>
    	How will your participant authenticate with Bridge if you use an external ID? You will make it harder for the user to participate in your study if you do not collect a phone number or email address to use as a delivery method to sign in the user. The participant could use a password, but this needs to be set when the account is created given the fact that there is no way to send a *change of password* email to a user without an email address.
    </p>
</div>