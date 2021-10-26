---
title: Participants
layout: article
---

{% include v2.html %}

<div id="toc"></div>

Onboarding participants occurs in three steps:

1. An account must be created for the user on the Bridge server;
2. A user may need to engage in an informed consent process;
3. The user is enrolled in one or more studies as a participant.

**Users cannot be enrolled in a study until they have consented to participate in your research , and they cannot consent to research until they have created an account (Bridge cannot verify that only participants are submitting data to your study until we have some way to identify them).** However consent is not alway collected via the Bridge server, and account creation and enrollment can sometimes be combined.

If you require that a user complete an informed consent process *before* creating an account for that user, we have [the Intent to Participant API](/swagger-ui/index.html#/Intent%20To%20Participate) that can be used for this purpose. This API allows you to capture consent, then create an account, then enroll that account the first time it signs in to the Bridge server, using our v1 consent process.

The recording of consent at sign in is transparent to the user. We must still store their contact information in memory, along with their consent, until they proceed to account creation and sign in. 

## Creating an account

Most study coordinators come into this process wishing to enroll a user without knowing if that user has created an account for the app being used for their study. In cases where the app has only one study, the user probably does not, but in apps where there is more than one study, it is possible.

### Public sign up

For studies that allow it, users may directly download and sign up for an account within an app itself. The app must support this through our [sign up APIs](TODO). Different apps will require different forms of sign up, to support different forms of authentication (see [Bridge Authentication](/articles/mobile/authentication.html)). 

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

Note that at this point, the user does not have to specify the study. The system will then attempt to validate identifiers that uniquely identify the account:

1. For email addresses and phone numbers, the identifier can be verified immediately with a verification email message or SMS message. The account will be `unverified` (and unusable) until this occurs;
2. For apps that send an email message or SMS text with a link to sign in, this verification step can be turned off in the app configuration, since the act of signing in will verify the validity of the identifier and activate the account.

Although the user can sign in to the Bridge server at this point, APIs that would provide information about, or collect information for the study, will return a 412 status to the user until they consent, if server consent is required. This status (Precondition Not Met) is returned with the user’s [UserSession](/model-browser.html#UserSession) that includes a session token for making the appropriate calls to consent.

If the account already exists, the sign up attempt will report success, and then send the “account already exists” email or SMS message to the participant to inform them that another attempt was made to create an account for them with that identifier, if the account has a verified email address or phone number.

### Administrative account creation

Study coordinators can also create accounts through the [create study participant API](/swagger-ui/index.html#/_For%20Study%20Coordinators/createStudyParticipant). If created, the system will follow the same credential verification rules described for public sign ups to create an account.

If the `StudyParticipant` payload included information about an external ID, the new account will immediately be enrolled in that study (see below).

If the account already exists, the caller will receive a 409 response with JSON that includes the existing user ID of the account (and it will not be enrolled in any study using any external IDs that were provided) This ID should be used to enroll the user in the study.

## Informed consent

*This step is optional, but if it is skipped, external partners are responsible for ensuring they meet their IRB’s requirements for informed consent of the participant.* While the consent system will be reworked as part of our v2 science APIs, you can still continue to use our e-consent APIs (see [Consenting Participants](/articles/v1/consent.html) for more information). The use of external IDs implies that consent has occurred outside of our system (in the future there will be a flag to indicate that consent should still be collected through the Bridge system).

## Enrollment

Finally, a user is enrolled in one or more studies as a participant. This may or may not be a separate API call. For example, our v1 consent system can be configured to enroll the user in a study when they sign a consent. In addition, an account created by a study coordinator that includes an external ID will be enrolled at the time it is created, because the external ID is associated with a specific study (and an account can have a different external ID for each enrollment). 

However if an account is not enrolled, it can be manually enrolled by a study coordinator using the [enrollment API](/swagger-ui/index.html#/Studies/enrollParticipant) after it is created. Only the `userId` and an optional `externalId` are required in the `Enrollment` payload for this call.

Enrollments can be [enumerated](/swagger-ui/index.html#/Studies/getEnrollees) for a study (including the number of participants who have withdrawn from the study). Users can [withdraw from a study](/swagger-ui/index.html#/Studies/withdrawParticipant) or [withdraw from all studies in an app.](/swagger-ui/index.html#/Consents/withdrawFromApp)

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
      "externalId":"externalId2",
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

## External IDs as credentials

An *external ID* is an identifier that is created and managed outside of Bridge, but associated to a user’s account so researchers can re-identify users at a later time (if they hold a mapping for these identifiers). It is one of the identifiers through which an account can be retrieved from Bridge, along with the user ID, health code, email, and/or phone number. 

You may wish to create accounts that are *only* identifiable by an external ID. ***Sage Bionetworks does not recommend this practice for two reasons:***

1. The only way we can authenticate such an account is by using the external ID as a credential (instead of an email or phone number), but by its nature, it cannot be too difficult for participants to enter, so it is not complex enough to secure the account from being “hacked;”
1. If the account does not have a phone number or email address, we cannot trigger a “reset password” workflow for the user. You will either need to create the account with a password and communicate that to the user in a secure fashion, or we have seen implementers hard-code the password for an app in the app itself, which is also insecure and easy to hack.

Bridge recommends use of the phone number of the user’s device as an account credential, as it provides a balance of security and anonymity for the account holder, with a fallback to email address for those devices that do not have a phone number.

Another alternative to consider is using a phone number or email address as a password. Combined with an external ID with at least a million combinations (e.g. something like “AX 4320”), this is an acceptable level of security which hashes the identifier* and removes it from the Bridge APIs. The value is still passed to the Bridge server during authentication, but it is only held transient in memory. It is no longer possible to re-identify the account via the identifier.

For further information on all Bridge authentication options, see [Bridge Authentication.](/articles/mobile/authentication.html)

*\* All data is encrypted when stored in the database.*
