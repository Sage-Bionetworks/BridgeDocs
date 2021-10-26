---
title: The REST API
layout: article
---

<div class="ui message">
<p>The REST API has been specified as a <a href="/rest-api/{{site.data.versions.java_sdk}}/rest-api/swagger.json">Swagger specification file</a>, which can be used to generate a Bridge REST client in a variety of languages. The Bridge platform team maintains <a href="java.html">a Java client</a> that layers authentication support on top of these basic API files. See <a href="http://swagger.io/">Swagger</a> for more information on producing clients in other languages.</p>

<dl>
    <dt><a href="/swagger-ui/index.html" target="_blank" rel="noopener">API Browser</a></dt>
    <dd>Documents the REST API</dd>

    <dt><a href="/model-browser.html">Model Browser</a></dt>
    <dd>Documents the JSON payloads sent back and forth in the API in an alternative format to the Swagger documentation browser above</dd>
</dl>
</div>

<div id="toc"></div>

The Bridge service API can be accessed at [https://webservices.sagebridge.org](https://webservices.sagebridge.org). 

## Authentication
Bridge’s is a *tenanted service* in which each app has a separate set of accounts (shared between all studies in that app for study participants). Thus authentication sessions are always scoped to a specific app, which must be specified when sign in credentials are sent to the Bridge server. Once authenticated, the sign in call returns a JSON [UserSessionInfo](/#UserSessionInfo) payload that  includes a `sessionToken` property. That session token should be sent with all further requests to the Bridge server using the `Bridge-Session` HTTP header.

If you have not signed in, all services will return a 401 (unauthorized) error response.

If you are calling an endpoint for which you do not have sufficient permissions to make the call, the service will return a 403 (forbidden) error response.

## Consent

If your study requires consent to participant, the first time a would-be participant user signs in to Bridge they will receive a 412 (Precondition Not Met) response along with the user's session. Participant-facing services will continue to return a 412 response and will not work until the user has called Bridge's services to consent to research. Note that a user can have a session but not be consented to participate in the study. 

The user's current consent status is summarized in the [UserSessionInfo](/#UserSessionInfo) object under the `consentStatuses` property where a [ConsentStatus](/#ConsentStatus) object exists for every consent that applies to the user in the study. 

<div class="ui message">
    <div class="ui header">Example</div>

    <p>With the introduction of multiple studies in a single application, both consent and consent enforcement (the 412 response) are changing. Sign in will no longer return a 412 response—but any calls that involve interacting with a particular study may return 412 if the configuration of that study requires the user to consent through the Bridge APIs.</p>
</div>

## Data formats and submissions

Timestamps are expressed in ISO 8601 format (e.g. 2011-12-03T22:11:34.554Z), using the extended notation, to represent dates, dates and times, or times.

JSON objects returned from the Bridge server will contain a `type` property with a unique type string for that kind of object. This may aid deserialization. However, these type properties do not need to be submitted back to the server (the Bridge server can deduce the JSON object's type from the API endpoint). The [Model Browser](/model-browser.html) shows the type of every object returned by the Bridge server. Including the type property in your JSON back to the server is harmless.

**JSON entities should be returned in their entirety to the Bridge server along with any changes that are desired in the object.** Bridge does not support partial updates of JSON records, with the except of one legacy API where this is documented.

## Roles

Many endpoints will return a 403 HTTP response (Forbidden) unless the caller is in [the appropriate administrative roles.](/articles/v2/authorization.html) 

Administrators (developers and researchers) can access most of the study management functionality through the [Bridge Study Manager](https://research.sagebridge.org/).

## Application versioning

If the version of the app making a request has a lower app version than the version configured by your app, services will return 410 (Service Gone) to indicate the application is obsolete and must be updated. This minimum required application version can be set separately for Android and iOS applications. 

## Deprecation and service warnings

Service endpoints are versioned independently, e.g. there may be one up-to-date service available at `/v1/*`, while another up-to-date service is available at `/v2/*`. If an API is versioned at a new version, all HTTP verbs that exist for that endpoint will work against that version of the endpoint. Separate "sub-path" endpoints are considered to be separate endpoints. For example `/v1/api/consent` and `/v1/api/consent/email` are considered separate endpoints and versioned separately.

When an endpoint has been deprecated, it will be marked as deprecated in our Swagger documentation, and the responses from that endpoint will include a `Bridge-Api-Status` header with an error message describing the issues with that call. The call will succeed, but at a future time, that endpoint may return 410, (Gone), and will no longer be functional. Please look for an alternative service in the API, and contact us if necessary to find a suitable service to which to migrate. 

## Server Responses and Errors

|HTTP status code|Error type|Message|
|---|---|---|
|200||*variable*|
|201||"&lt;entityTypeName&gt; created."|
|202||*variable* (request has been accepted)|
|400|BadRequestException|*variable*|
|400|PublishedEntityException|A published entity cannot be changed.|
|400|InvalidEntityException|*variable based on fields that are invalid*|
|401|NotAuthenticatedException|Not signed in|
|403|UnauthorizedException|Caller does not have permission to access this service.|
|404|EndpointNotFoundException|The request URL is invalid, and does not reach an endpoint on the server.|
|404|EntityNotFoundException|&lt;entityTypeName&gt; not found.|
|409|EntityAlreadyExistsException|&lt;entityTypeName&gt; already exists.|
|409|ConcurrentModificationException|&lt;entityTypeName&gt; has the wrong version number; it may have been saved in the background.|
|409|ConstraintViolationException|A constraining relationship between two entities has prevented the operation (usually a deletion).|
|410|UnsupportedVersionException|"This app version is not supported. Please update." The app has sent a valid User-Agent header and the server has determined that the app's version is out-of-date and no longer supported by the configuration of the study on the server. The user should be prompted to update the application before using it further. Data will not be accepted by the server and schedule, activities, surveys, etc. will not be returned to this app until it sends a later version number.|
|412|ConsentRequiredException|Consent is required before continuing. This exception is returned with a JSON payload that includes the user's session. The user is considered signed in at this point, but unable to use any service endpoint that requires consent to participate in the study.|
|423|AccountDisabledException|"Account disabled, please contact user support"|
|429|LimitExceededException|The app is limited in the number of accounts that can be registered and this app has reached the limit to its number of accounts.|
|500|BridgeServerException|*variable*|
|501|NotImplementedException|As configured, this app has not enabled this endpoint.|
|503|ServiceUnavailableException|*variable*|

If a response returns no JSON payload, it will normally return a message, and this includes error responses:

```json
{"message":"Not signed in."}
```

These messages are not localized. They are somewhat suitable for display to users, but mostly present as an aid to API developers.

Invalid entities return more complex errors with an "errors" property that breaks down the issues by field (the field key can be a nested set of properties into the JSON object structure). For example, here is the response to an invalid survey:

```json
{   
   "message":"Survey is invalid: element[1].identifier is required",
   "errors":{   
      "element[1].identifier":[   
         "element[1].identifier is required"
      ]
   }
}
```

The second element of the survey (array syntax is zero-indexed) is missing an identifier property (which is required).

## Swagger guidance

Bridge uses version 2.0 of the Open API Specification, which we have found ambiguous in a couple of areas. Here is how we use certain properties of the Swagger definition:

**required:** The caller is required to supply a property value when the model is submitted to the server. On an update, callers should return the value to the server even if it is unchanged (if not, it may be interpreted as a deletion of the property value).

**readOnly:** This value never needs to be provided by the caller or submitted back to the server (however, including it as part of the object is harmless, it will be ignored). System timestamps fall into this category.

**x-nullable:** When present, this is always set to false. This model property will never be null or missing when the model is returned from the server. This is a stronger promise than **required.** For example, most collection properties in Bridge will be set to empty objects or arrays in the JSON if no property is set, rather than being set to null or being excluded from the model JSON.