---
title: The REST API
layout: article
---

<div class="ui positive message">
<p>The REST API has been specified as a <a href="/swagger.json">Swagger specification 
file</a>, which can be used to generate a simple Bridge REST client in a wide 
variety of languages. See <a href="http://swagger.io/">Swagger</a> for more 
information.</p>

<dl>
    <dt><a href="/swagger-ui/index.html?url=/rest-api/{{site.data.versions.java_sdk}}/swagger.json" target="_blank">API Browser</a></dt>
    <dd>Documents the URLs of the API</dd>

    <dt><a href="/model-browser.html">Model Browser</a></dt>
    <dd>Documents the JSON payloads sent back and forth in the API</dd>
</dl>
</div>

<div id="toc"></div>

The Bridge service API can be accessed at [https://webservices.sagebridge.org](https://webservices.sagebridge.org). 

## Authentication
Sessions are always scoped to a specific study, which is provided when a user signs in. Once credentials are submitted to the sign in URL, the system will return a JSON [UserSessionInfo](/#UserSessionInfo) payload that  includes a `sessionToken` property. That session token should be sent with all further requests to the Bridge server using the `Bridge-Session` HTTP header.

If you have not signed in, all services will return a 401 (forbidden) error response.

## Consent

If your study requires consent to participant, the first time a user signs in to Bridge they will receive a 412 (Precondition Not Met) response along with the user's session. Participant-facing services will continue to return a 412 response and will not work until the user has called Bridge's services to consent to research. Note that a user can have a session but not be consented to participate in the study. 

The user's current consent status is summarized in the [UserSessionInfo](/#UserSessionInfo) object under the `consentStatuses` property where a [ConsentStatus](/#ConsentStatus) object exists for every consent that applies to the user in the study. 

## Data formats

Timestamps are expressed in ISO 8601 format (e.g. 2011-12-03T22:11:34.554Z), using the extended notation, to represent dates, dates and times, or times (separate from a specific day or time zone).

JSON objects returned from the Bridge server will contain a `type` property with a unique type string for that kind of object. This may aid deserialization. However, these type properties do not need to be submitted back to the server (the Bridge server can deduce the JSON object's type from the API endpoint). The [Model Browser](/model-browser.html) shows the type of every object returned by the Bridge server. Including the type property in your JSON back to the server is harmless.

## Roles

Many endpoints will return a 403 error (Unauthorized) unless the caller is in one of several administrative [roles](/#Role). Study developers will need the `developer` role to configure and manage the study; study researchers who are cleared by their IRB to see personal information about study participants will need the `researcher` role.

Study developers and researchers can access most of the study management functionality through the [Bridge Study Manager](https://research.sagebridge.org/).

## Application versioning

If the version of the app making a request has a lower app version than the version supported by your study, services will return 410 (Service Gone) to indicate the application is obsolete and must be updated. This minimum required application version can be set separately for Android and iOS applications. 

## Deprecation and service warnings

Service endpoints are versioned independently, e.g. there may be one up-to-date service available at `/v1/*`, while another up-to-date service is available at `/v2/*`. All HTTP verbs will work against that version of the endpoint.

When an endpoint has been deprecated (it is planned for removal at a future date), the responses from that endpoint will include a warning message. At a future time, that endpoint may return 410, Gone, and will no longer be functional. Please look for an alternative service in the API, and contact us if necessary to find a suitable service to which to migrate.

We currently consider "sub-path" endpoints to be separate endpoints. For example `/v1/api/consent` and `/v1/api/consent/email` are considered separate endpoints and versioned separately.

If an expected header is missing, the response from that endpoint will also include a warning message.

If there is a warning of any of these issues, the response from that endpoint will include a single `Bridge-Api-Status` header with an error message describing the issues with that call. The call still succeeds, but this error message is logged by our SDK and is otherwise important to look for during development. 

## Server Responses and Errors

|HTTP status code|Error type|Message|
|---|---|---|
|200||*variable*|
|201||"&lt;entityTypeName&gt; created."|
|400|BadRequestException|*variable*|
|400|PublishedSurveyException|A published survey cannot be updated or deleted (only closed).|
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
|423|BridgeServerException|"Account disabled, please contact user support"|
|500|BridgeServerException|*variable*|
|503|ServiceUnavailableException|*variable*|

If a response returns no JSON payload, it will normally return a message, and this includes error responses:

```json
{"message":"Not signed in."}
```

These messages are not localized. They are somewhat suitable for display to users, but mostly present as an aid to API developers.

Invalid entities return more complex errors with an "errors" property that breaks down the issues by field (the field key can be a nested set of properties into the JSON object structure). For example, here is the response to an invalid survey:

```json
{   
   "message":"Survey is invalid: element1.identifier is required",
   "errors":{   
      "element1.identifier":[   
         "element1.identifier is required"
      ]
   }
}
```

The first element of the survey is missing an identifier (which is required).