---
title: REST Java Client
layout: article
---

<div class="ui positive message">

<p>Sage provides a Java-based REST client for interacting with Bridge services (v{{site.data.versions.java_sdk}}): </p>

<dl>
    <dt><a class="item" href="/rest-client/{{site.data.versions.java_sdk}}/rest-client/apidocs/index.html">REST client API docs</a></dt>
    <dd>JavaDocs for the REST client.</dd>
    
    <dt><a class="item" href="https://github.com/Sage-Bionetworks/BridgeJavaSDK">GitHub</a></dt>
    <dd>Source code.</dd>
</dl>

<p>Clients in other languages can be produced using the <a href="/articles/rest.html">swagger specification</a> of the services.</p>
</div>

## Installing the REST client (Maven)

Add the Sage Bionetworks repository and the REST client to your <code>pom.xml</code>:

``` xml
<dependencies>
    <dependency>
    <groupId>org.sagebionetworks</groupId>
    <artifactId>rest-client</artifactId>
    <version>{{site.data.versions.java_sdk}}</version>
    </dependency>
</dependencies>
...
<repositories>
    <repository>
        <id>org-sagebridge-repo-maven-releases</id>
        <name>org-sagebridge-repo-maven-releases</name>
        <url>http://repo-maven.sagebridge.org/</url>
    </repository>
</repositories>
```

## Using the REST client

If you don't have an account to start, you can create one (if you do not have a study, you will have to contact Sage Bionetworks to create one):

``` java
SignUp signUp = new SignUp()
    .study("my-study-id")
    .email("email@email.com")
    .password("password");

ClientManager manager = new ClientManager.Builder().build();
AuthenticationApi authApi = manager.getClient(AuthenticationApi.class);
authApi.signUp(signUp).execute();

// check your email and verify your email address

// Now you can sign in, although ClientManager will do this automatically
SignIn signIn = new SignIn()
    .study("my-study-id")
    .email("email@email.com")
    .password("password");

UserSessionInfo session = null;
try {
    session = authApi.signIn(signIn).execute().body();
} catch(ConsentRequiredException e) {
    // user still has session, but must consent to continue.
    String sessionToken = e.getSession().getSessionToken();
}

```

The available [Api clients](/rest-client/{{site.data.versions.java_sdk}}/apidocs/org/sagebionetworks/bridge/rest/api/package-summary.html) are documented in the javadocs for the REST client. You can create them using the `ClientManager` (as shown above).

The `ClientManager` class provides the means to configure your clients using a `bridge-sdk.properties` file in your user home directory (`~/bridge-sdk.properites` on Mac OSX and Linux):

``` java
study.identifier = yourStudyIdentifier
account.email = email@address.com
account.password = yourPassword
languages = en
```

This allows you to use credentials without embedding them in your program:

``` java
Config config = new Config();
ClientManager manager = new ClientManager.Builder().withConfig(config).build();

ForConsentedUsersApi usersApi = manager.getClient(ForConsentedUsersApi.class);
ScheduledActivityList scheduledActivities = usersApi
    .getScheduledActivities("+00:00", 4, 0).execute().body();
```

## Filtering server content

The server can tailor behavior for your app based on criteria such as the app's version or the declared language of the user. For this to work, you must send a `User-Agent` header with your requests, in a specific format understood by Bridge. The rest client represents the user agent through the `ClientInfo` class, which can be provided to the `ClientManager`: 

``` java
ClientInfo info = new ClientInfo();
info.setAppName("HealthStudyApp");
info.setAppVersion(12);
info.setDeviceName("Google Plexus");
info.setOsName("Android"); // or "iPhone OS"
info.setOsVersion("10.0.2");

List<String> languages = new ArrayList<>();
languages.add("en");
languages.add("fr");

ClientManager manager = new ClientManager.Builder()
    .withClientInfo(info)
    .withAcceptLanguage(languages)
    .withClientConfig(config).build();
```

See [customizing content](/articles/filtering.html) and the [`ClientInfo`](/#ClientInfo) object for further details.

Finally you may wish to sign out when you are done:

``` java
AuthenticationApi authApi = manager.getClient(AuthenticationApi.class);
authApi.signout().execute();
```

