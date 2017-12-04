---
title: Importing External Data
layout: article
---

Bridge can support the export of data from external data sources, like wearable devices, to be included in a participant's contributed dataset. Bridge can be implemented to access data from any provider that implements the **OAuth 2.0 Authorization Code Grant Flow**, following [RFC 6749](https://tools.ietf.org/html/rfc6749#section-4.1).

The participant explicitly grants permissions to Bridge to export data from third party devices and data providers. Each provider will differ, but the steps to configuration and use Bridge for this purpose will be close to the following.

## Set Up A Provider

Set up an account with an OAuth 2.0 provider for this specific application, from whom you wish to retrieve data. The provider's API documentation, and your application registration, should provide the following information:

* a client identifier;
* a secret token (this string should not be included in the code for your app, or distributed to end users);
* a redirection URL. You will provide this URL to both the OAuth 2.0 provider and to Bridge;
* the OAuth provider's URL to request access tokens (this should be in the provider's documentation).

## Add Provider Information to Bridge

In the Bridge Study Manager, under `Study > Settings > OAuth Providers`, you can add the information you collected from the provider. Assign a simple identifier to this provider so you can reference different providers in the API (if needed).

Bridge also supports registering specific URLs with the server so they can be intercepted by your app. This feature is useful here to intercept the callback URL you register with the OAuth provider, then the app can extract the query string parameter named `code` from the URL. See:

* [Support Universal Links](https://developer.apple.com/library/content/documentation/General/Conceptual/AppSearch/UniversalLinks.html) (iOS)

* [Verify Android App Links](https://developer.android.com/training/app-links/verify-site-associations.html) (Android)

URLs that use the Bridge server in this fashion start with `https://webservices.sagebridge.org/<your-bridge-study-identifier>/`

You will need to configure your study in Bridge to provide the server-side support necessary for this feature. Look under `App Support > App & Universal Links`.

## Request Authentication Token from Provider

See [RFC 6749](https://tools.ietf.org/html/rfc6749#section-4.1) for the first steps of the authorization process. Your app will open an authentication page in a web browser, and the user will be asked to authenticate. If they are successful, the browser will be redirected to your callback URL with a query string parameter named `code`. If you intercept the URL in your app (see above), you can extract this authorization token for the next step.

## Authorize Bridge to Retrieve an Access Grant

The client app then calls Bridge's [OAuth access grant endpoint](/swagger-ui/index.html#!/_For_Consented_Users/requestOAuthAccessToken), sending the [OAuthAuthorizationToken](/#OAuthAuthorizationToken) payload. If successful, an [OAuthAccessToken](/#OAuthAccessToken) payload is returned to the client, and the Bridge serve will be able to access data on the user's behalf.

* When an authorization token is sent to the server, Bridge always refreshes the access grant token and returns it to the client, if it can;

* The same API can be called without an authorization token. If possible, Bridge will return the currently authorized access grant. This may be a new grant if the previous grant sent to the client has expired;

* If a grant cannot be produced, the server will return 404, "OAuthAccessToken not found."

The client does not need to use the access grant. The process remains the same to simply grant permission to the server.