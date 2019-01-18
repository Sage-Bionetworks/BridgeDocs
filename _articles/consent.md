---
title: Consenting Participants
layout: article
---

*All participants in your mHealth study must consent to participate in your research before you can collect their data.* The United States requires this **informed consent,** along with approval of your research by an Institutional Review Board. Once you have approval to do the research, Bridge can help you collect and manage these consents.

### Scenario 1: Bridge manages consent

If you are managing consents through Bridge, then any authenticated user who has not consented to research will receive a 412 HTTP response from the server when calling a participant-facing API ("Precondition Required"). This response will include the user's session in the body of the response. The user is signed in, just not authorized to send or to receive data from Bridge.

To consent, the user must [send a consent record to the API](/swagger-ui/index.html#/Consents/createConsentSignature). The call returns the user's session updated with the new consent status. Thereafter, participant-facing calls will work as expected.

Bridge can support multiple consent groups (initially, a Bridge study will have one default consent group that is required, and the subpopulation GUID for that group will be the study's identifier). It will determine all the consent groups that apply to a user (see [customizing content](/articles/filtering.html)), and the user will need to consent to all required consent groups before accessing Bridge services. Users do not need to agree to optional consents to use Bridge services. If you update the contents of a consent document after a user has signed it, this will be noted in the user's session, but they will not be required to consent again.

At the time of consent, a signed version of the document will sent via email or SMS link to the user for their records (this feature can be disabled). You can update the consent document contents and save new versions of this document; when you wish to do so, you can publish a new version as the approved version of the consent to present to users.

### Scenario 2: No electronic consent required

If you are consenting your users in a clinical or similar setting, and that consent includes use of your mHealth app, you may not need Bridge's consent support at all. Simply navigate to the default consent group in the Bridge Study Manager and deselect "User must consent to this agreement." Then save. Now that this consent is optional, users will never receive a 412 response after signing in.

### Scenario 3: Consent before creating a Bridge account

In some scenarios you may wish for users to consent before downloading your app. For example, Sage Bionetwork's mPower app has [a web-based consent process](https://parkinsonmpower.org/study/intro) that users can complete before downloading the app. In this scenario, users do not make an account before they give consent. To support this, Bridge has the "intent to participate" API (currently this service only supports phone-based accounts). 

The workflow is as follows:

- The user navigates to a consent web site, and agrees to consent by giving their telephone number;
- The website detects it is not embedded in an app, and sends the consent to the [intent to participate](/swagger-ui/index.html#/Consents/createConsentSignature) api;
- The Bridge server responds by sending an SMS message to the user with a link to download the app (the message content is configurable in the Bridge Study Manager);
- The user clicks on the link, downloads the app, and opens it;
- When the app is opened, it asks again for a phone number;
- The app takes the user's phone number and signs up for an account, then requests an SMS link at the same phone number in order to sign in to the app;
- The user clicks on the link which opens up the app. The app extracts a token in the link to complete sign in via a phone number;
- On sign in, the system detects that the user has already submitted an intent to participate under that phone number, and completes the consent process without further intervention by the user. The sign in request thus returns a 200 HTTP status response and a consented session.

This sequence of events can also support cases where the user downloads and installs your app without visiting your consent website... as is possible once you publish your app in an app store.

- The user downloads your app from the app store
- When the app is opened, it asks for a phone number;
- The app takes the user's phone number and signs up for an account, then requests an SMS link at the same phone number in order to sign in to the app;
- The user clicks on the link which opens up the app. The app extracts a token in the link to complete sign in via a phone number;
- On sign in, the app receives a 412 response and goes into the same consent workflow, embedded in the app.

In [Sage Bionetworks applications](https://github.com/Sage-Bionetworks/web-mpower-2), we use the same consent website for both scenarios. When the website is accessed on the desktop, it submits the consent to the ITP service. When the website detects that it is being displayed in a `WebView`, it passes the consent back to the client through a JavaScript bridge, so the native client can call the consent service, record the updated session state, and if everything is successful, close the `WebView`. The user is now consented and can use all of the Bridge APIs.
