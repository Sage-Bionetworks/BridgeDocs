---
title: Consenting Participants
layout: article
---

<div id="toc"></div>

*All participants in your mHealth study must consent to participate in your research before you can collect their data.* The United States requires this **informed consent,** along with approval of your research by an Institutional Review Board. Once you have approval to do the research, Bridge can help you collect and manage these consents.

### Scenario 1: Bridge manages consent

If you are managing consents through Bridge, an authenticated user will receive back a 412 HTTP response from the server when calling a participant-facing API ("Precondition Required"). This response will include [the user's session](/#UserSessionInfo) in the body of the response. The user is authenticated, but not authorized to send or to receive data from Bridge.

To consent, the user must [send a consent record to the API](/swagger-ui/index.html#/Consents/createConsentSignature) (the subpopulation GUID for the default consent is the study identifier, the same used to authenticate with the correct study when contacting the Bridge server). The call returns the user's session updated with the new consent status. Thereafter, participant-facing calls will work as expected.

Bridge can support multiple [consent groups](/#Subpopulation) (initially, a Bridge study will have one default consent group that is required, but this is configurable). It will determine all the consent groups that apply to a user (see [customizing content](/articles/filtering.html)), and the user will need to consent to all required consent groups before accessing Bridge services. Users do not need to agree to optional consents to use Bridge services. If you update the contents of a consent document after a user hask signed it, this will be noted in the user's session, but they will not be required to consent again.

At the time of consent, a signed version of the document will sent via email or SMS link to the user for their records (this feature can be disabled). You can [update the consent document contents and save new versions of this document;](/swagger-ui/index.html#/Study%20Consents) when you wish to do so, you can [publish](/swagger-ui/index.html#/Study%20Consents/publishConsent) a new version as the approved version of the consent to present to users.

### Scenario 2: No electronic consent required

If you are consenting your users in a clinical or similar setting, and that consent includes use of your mHealth app, you may not need Bridge's consent support at all. Simply navigate to the default consent group in the Bridge Study Manager and deselect "User must consent to this agreement." Then save. Now that this consent is optional, users will never receive a 412 response after signing in.

### Scenario 3: Consent before creating a Bridge account

In some scenarios you may wish for users to consent before downloading your app. For example, Sage Bionetwork's mPower app has [a web-based consent process](https://parkinsonmpower.org/study/intro) that users can complete before downloading the app. In this scenario, users do not make an account before they give consent. To support this, Bridge has the [intent to participate API](/swagger-ui/index.html#/Intent%20To%20Participate/submitIntentToParticipate). 

The workflow is as follows:

1. The user navigates to a consent web site, and agrees to consent. This consent includes a credential that will be used to sign in the user, either an email address or a telephone number;
1. The website detects it is not embedded in an app, and sends the consent to the [intent to participate API](/swagger-ui/index.html#/Intent%20To%20Participate/submitIntentToParticipate);
1. The Bridge server responds by sending either an email or SMS message to the user with a link to download the app (the message content is configurable in the Bridge Study Manager);
1. The user clicks on the link, downloads and installs the app, and then opens it;
1. When the app is opened, it asks again for the same email address or phone number;
1. The app takes that credential and [signs up](/articles/authentication.html) for an account, then immediately triggers a [sign in](/articles/authentication.html) request via email or SMS;
1. The user gets an email message or SMS message with a link that they click on. This link is intercepted by the host operating system and opens the app (this requires some additional configuration on [Android](https://developer.android.com/training/app-links/verify-site-associations.html) or [iOS](https://developer.apple.com/library/archive/documentation/General/Conceptual/AppSearch/UniversalLinks.html) to give the operating system permission to intercept the link; Bridge can be configured to serve as the [host domain](https://research.sagebridge.org/#/app_links) for this purpose);
1. The app extracts a token in the link to complete sign in via [email address](/swagger-ui/index.html#/Authentication/signInViaEmail) or [phone number](/swagger-ui/index.html#/Authentication/signInViaPhone);
1. On sign in, the system detects that the user has already submitted an intent to participate under that credential, and completes the consent process without further intervention by the user. The sign in request thus returns a 200 HTTP status response and a consented session.

This sequence of events can also support cases where the user downloads and installs your app without visiting your consent website... as is possible once you publish your app in a public app store.

1. The user downloads your app from the app store;
1. When the app is opened, it asks for an email address or phone number (as in step #5 above);
1. The app takes the user's credential and signs up for an account, then requests an email or SMS link at that address or phone number in order to sign in to the app (as in step #6 above);
1. The user clicks on the link which opens up the app. The app extracts a token in the link to complete sign in via a email address or phone number (steps #7 and #8);
1. On sign in, the app receives a 412 response and goes into the same consent workflow, embedded in the app;
1. This consent is submitted through the normal [consent to research API](/swagger-ui/index.html#/Consents/createConsentSignature).

In [Sage Bionetworks applications](https://github.com/Sage-Bionetworks/web-mpower-2), we use the same consent website for both scenarios. The key component is [the Sign.vue file](https://github.com/Sage-Bionetworks/web-mpower-2/blob/release/src/components/study/Sign.vue), where we test the computed property `isEmbedded`. When the website is accessed on the desktop, it submits the consent to the ITP service. When the website detects that it is being displayed in a `WebView`, it passes the consent back to the client through a JavaScript bridge, so the native client can call the consent service, record the updated session state, and if everything is successful, close the `WebView`. The user is now consented and can use all of the Bridge APIs.
