---
title: Participants
layout: article
---

{% include v2.html %}

<div id="toc"></div>

Onboarding participants occurs in three steps:

1. An account must be created for the user on the Bridge server;
2. A user may need to engage in an informed consent process;
3. The user is enrolled in a study as a participant.

After a user creates an account, step #1 does not need to be repeated for enrollment in other studies (for that app; accounts in other apps are entirely separate).

**Users cannot be enrolled in a study until they have consented to participate in your research, and they cannot consent to research until they have created an account (Bridge cannot verify that only consented participants are submitting data to your study until we can identify them).** However consent is not alway collected via the Bridge server, and account creation and enrollment can sometimes be combined.

<div class="ui icon message" style="margin-top: 2rem">
  <i class="ui circle info icon"></i>
  <div class="content">
    <p>If you require that a user complete an informed consent process <i>before</i> creating an account for that user, we have <a href="/swagger-ui/index.html#/Intent%20To%20Participate">the Intent to Participant API</a> that can be used for this purpose. This API allows you to capture consent, then create an account, then enroll that account the first time it signs in to the Bridge server.</p>
    <p>The v2 consent system will introduce a different way to re-order the steps to onboard participants.</p>
  </div>
</div>        

## Account Creation

### Creating a participant with an external ID

Currently the most common way to create an account for a participant is to create a record using an *external ID.* This is an identifier that researchers create to track a subject, which may or may not be associated to personally identifying information in the Bridge system. 

An external ID has the following properties:

1. You attest that the participant has agreed to the research through an informed consent process (or you have noted that your study is exempt from this requirement);
1. You are responsible for tracking the identity of the participant who has been assigned the external ID (though personally-identifying information may also be stored in Bridge);
1. Accounts with external IDs are *always* enrolled in a study. You cannot assign an external ID without also enrolling the account in a study.

Account creation can be as simple as attesting an external ID in an app:

```json
{
  "appId": "<app-id>",
  "externalIds": {
    "<study-id>": "<external-id>"
  }
}
```

*However,* this account would be useless because there’s no way for this participant to authenticate with the server. The account will additionally need a password, email address, or phone number in order to authenticate with the Bridge server.

You may wish to create accounts that are *only* identifiable by an external ID, using something like the external ID for the password as well. ***Sage Bionetworks does not recommend this practice,*** because external IDs by their nature are not complex enough to be secure passwords. They must also be transferred and communicated to others without encryption.

One alternative to consider as a password is the participant’s phone number or email address. Combined with an external ID with at least a million combinations (e.g. something like “AX 4320”), this is potentially an acceptable level of security. The email or phone number is stored as a hash on the server, so it cannot easily be used to re-identify a participant. The value is still passed to the Bridge server during authentication, but it is only held transient in memory until it is hashed and compared to the password.

Sage Bionetworks also recommends use of the phone number of the user’s device as an account credential, as it provides a balance of security and anonymity for the account holder, with a fallback to email address for those devices that do not have a phone number.

After initial account creation, a participant can be manually enrolled by a study coordinator in a further study using the [enrollment API](/swagger-ui/index.html#/Studies/enrollParticipant) after it is created. For an account that is only identified by an external ID, both the `userId` and an `externalId` for the new study will be required in the `Enrollment` payload (external IDs cannot be shared between studies).

<div class="ui icon message" style="margin-top: 2rem">
  <i class="red circle warning icon"></i>
  <p style="margin:0"><b>Anyone can join your study by creating an external ID account.</b> Unless you require consent on the server, users can enroll themselves in a study as part of a sign up for an account, simply by assigning themselves an external ID. Study coordinators must keep a canonical list of IDs they have assigned, and should only use data that is collected for these canonical accounts.</p>
</div>        


### Administrative participant account creation

Accounts can also be created with credentials like an email address or phone number, through the [create study participant API](/swagger-ui/index.html#/_For%20Study%20Coordinators/createStudyParticipant). If the `StudyParticipant` payload included information about an external ID, the new account will be enrolled in that study (as is the case with external IDs). The account can authenticate via an email message, SMS message, or the use of an email address and password.

The system will then attempt to validate identifiers that will be used to identify the account, depending on the app configuration and credentials provided:

1. For email addresses, the address can be verified before it is used to sign in with a password, or this can be disabled in favor of verifying the address when it is used to sign in via an email message;
2. For phone numbers, the number can be verified before it is used, or this can be disabled in favor of verifying the phone number when it is used to sign in via an SMS message;
3. External IDs cannot be verified. If an account is only identified via an external ID, this step is skipped.

If the account already exists, the caller will receive a 409 response with JSON that includes the existing user ID of the account (and the account will not be enrolled in any study using any external IDs that were provided in the request). This ID should be used to enroll the user in the study using the enrollment APIs, if an external ID was provided.

### Public sign up

For studies that allow it, users may directly download and sign up for an account within an app itself. The app must support this through our [sign up API](/swagger-ui/index.html#/Authentication/signUp). Different apps will require different forms of sign up, in order to support different forms of authentication (see [Bridge Authentication](/articles/mobile/authentication.html)). 

As an example, a minimal sign up for an app that uses a telephone number to authenticate a user might include the following:

```json
{
  "appId": "your-app-id",
  "phone": {
    "regionCode": "US",
    "number": "+12054441212"
  }
}
```

Note that at this point, the user does not have to specify the study. If the account already exists, the sign up attempt will report success, and then send the “account already exists” email or SMS message to the participant to inform them that another attempt was made to create an account for them with that identifier, if the account has a verified email address or phone number.

Next the credential will be verified as described above in the section “Administrative participant account creation.”

After credential verification, the user can authenticate with the Bridge server. If consent is required by Bridge for the app, the participant will not be able to access APIs that provide information about, or collect information for a study, until they consent. The HTTP status 412 (“Precondition Not Met”) is returned with the [UserSession](/model-browser.html#UserSession) that includes a session token for making the appropriate calls to consent.

## Informed consent

*This step is optional, but if it is skipped, external partners are responsible for ensuring they meet their IRB’s requirements for informed consent of the participant.* The use of external IDs only implies that consent has occurred outside of our system.

While the consent system will be reworked as part of our v2 science APIs, you can still continue to use our e-consent APIs to gather consent and enroll users in studies (see [Consenting Participants](/articles/v1/consent.html) for more information). 

## Enrollment

Finally, if it has not already been enrolled, an account may be enrolled through a separate API call in one of two ways:

1. Required consents in our v1 consent system will enroll a user in a specified study;

2. There is an [enrollment API](/swagger-ui/index.html#/Studies/enrollParticipant) to enroll an existing account in a new study. That enrollment can optionally be assigned a new `externalId` (external IDs are not shared between studies).

Enrollments can be [enumerated](/swagger-ui/index.html#/Studies/getEnrollees) for a study (including the number of participants who have withdrawn from the study). Users can [withdraw from a study](/swagger-ui/index.html#/Studies/withdrawParticipant) or [withdraw from all studies in an app.](/swagger-ui/index.html#/Consents/withdrawFromApp)

### Enrollment information in the user session 

For client apps, a user’s session contains an `EnrollmentInfo` map with detailed information about the user’s study enrollments:

```json
{
  "enrollments":{
    "study1":{
      "externalId":"externalId1",
      "enrolledOn":"2021-10-08T20:28:29.606Z",
      "consentRequired":false, // not currently used
      "type":"EnrollmentInfo"
    },
    "study2":{
      "enrolledOn":"2021-10-04T12:42:39.127Z",
      "consentRequired":true, // not currently used
      "type":"EnrollmentInfo"
    }
  },
  "type": "UserSessionInfo"
}
```
For backwards compatibility, enrollments are also given with the following JSON through two read-only properties, `studyIds` and `externalIds`:

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