---
title: Android SDK
layout: article
---

<div class="ui message">
    <p>
    	We support Android development with Bridge Android SDK and Bridge ResearchStack SDK, available on <a href="https://github.com/Sage-Bionetworks/BridgeAndroidSDK">Github</a>.
    </p>
    <p>
    	Android SDK and ResearchStack SDK are still under active development. Bridge <a href="/articles/java.html">Java REST Client</a> may also be of interest.
    </p>
</div>

Bridge's Android SDKs target API 24 with support back to API 16

## Bridge ResearchStack SDK
 
Bridge <a href="https://github.com/ResearchStack/ResearchStack">ResearchStack</a> SDK is an SDK and UX framework for building Bridge research study apps on Android.

### Installation
Use the following snippet in your application's build.gradle file:

``` 
repositories {  
   jcenter()  
}

dependencies {  
   compile 'org.sagebionetworks.bridge:researchstack-sdk:{{site.data.versions.android_sdk}}'
}
```

### Features

* Study participant sign up, sign in

* Consent document workflow for a single subpopulation (additional support coming soon)

* Initial task after sign in

* Bridge data upload

### Roadmap

* Scheduled tasks

* Survey engine

## Bridge Android SDK

This project is still under active development. Use of BridgeResearchStackSDK is recommended. Bridge Android SDK wraps Bridge <a href="/articles/java.html">Java REST Client</a> to provide Android specific dependencies and functionality, and allows asynchronous (and offline) usage of Bridge APIs.

### Installation
Use the following snippet in your application's build.gradle file:

``` 
repositories {  
   jcenter()  
}

dependencies {  
   compile 'org.sagebionetworks.bridge:android-sdk:{{site.data.versions.android_sdk}}'
}
```

### Roadmap

* Sync Service for data uploads, tasks and surveys

* Authentication Manager integration
