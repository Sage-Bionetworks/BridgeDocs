---
title: iOS &amp; Research SDKs
layout: article
---

<div class="ui positive message">
<p>We support iOS development with three frameworks: BridgeSDK, BridgeApp, and Research.</p>

<p>The relevant Github repos are:</p>

<dl>
    <dt><a href="https://github.com/Sage-Bionetworks/Bridge-iOS-SDK.git">BridgeSDK</a></dt>
    <dd>A framework to access the Bridge REST API</dd>

    <dt><a href="https://github.com/Sage-Bionetworks/BridgeApp-Apple-SDK.git">BridgeApp</a></dt>
    <dd>An extensible, customizable application framework for building mHealth apps using Bridge and Research</dd>

    <dt><a href="https://github.com/Sage-Bionetworks/SageResearch.git">Research/ResearchUI</a></dt>
    <dd>Sage's fork of <a href="https://github.com/Sage-Bionetworks/SageResearch.git">Research, a task modeling framework hosted by Apple's ResearchKit</a></dd>
</dl>
</div>

## BridgeSDK

The BridgeSDK framework is written in Objective-C, and provides robust and secure access to the [Bridge REST API](https://developer.sagebridge.org/articles/rest.html) for your iOS apps under the BSD license. It supports caching of Bridge objects where appropriate, NSURLSession background uploads of data, and accessing much of the REST API via background downloads so your app can continue to work when no Internet connection is available.

BridgeSDK supports Xcode 9.4 and newer, and has a minimum target version of iOS 8.0.

### Adding BridgeSDK directly to your project

BridgeApp (see below) includes BridgeSDK as a sub-project, so if you intend to use that framework, skip these instructions and follow the ones in that section.

Otherwise:

BridgeSDK includes the correct commits of a few other git submodules it depends on, so when you clone it you should do so recursively:

```bash
git clone --recursive https://github.com/Sage-Bionetworks/Bridge-iOS-SDK.git
```

If you've already cloned the repo without the --recursive option, you can do this from within the Bridge-iOS-SDK directory to get the submodules:

```bash
git submodule update --init --recursive
```

Then:

- Add the BridgeSDK project to the app target for your project.

- Add the BridgeSDK target's build product (BridgeSDK.framework) to the Linked Frameworks and Libraries and Embedded Frameworks sections on your app target's General tab (or, alternatively, add it to the Link Binary with Libraries and Embed Frameworks build phases).

- In your AppDelegate source file, import the BridgeSDK:

Objective-C:

```objc
@import BridgeSDK;
```

Swift:

```swift
import BridgeSDK
```

- From your AppDelegate's `application:willFinishLaunchingWithOptions:` method, before calling any other BridgeSDK methods, call one of the its setup methods with your study name (provided by Sage when your Bridge study was created), e.g.:

Objective-C:

```objc
- (BOOL)application:(UIApplication *)application willFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
	...
	[BridgeSDK setup];
	...
}
```

Swift:

```swift
func application(_ application: UIApplication, willFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey: Any]?) -> Bool {
        ...
        BridgeSDK.setup()
        ...
    }
```

### Using BridgeSDK in your project

BridgeSDK is organized into 'managers' that correspond roughly to the Bridge REST APIs. You can obtain a default instance of an API manager from the corresponding BridgeSDK class property. For example, to sign up a new participant to your study, you might make a call like this:

Objective-C:

```objc
[BridgeSDK.authManager signUpWithEmail:email
                              username:email
                              password:password
                            dataGroups:dataGroups
                            completion:^(NSURLSessionTask * __unused task,
                                            id __unused responseObject,
                                            NSError *error)
    {
        dispatch_async(dispatch_get_main_queue(), ^{
            if (!error) {
                // handle successful sign-up, e.g. ask the user to click the link in the verification email before proceeding to sign them in with these credentials
            } else {
                // handle failed sign-up
            }
        });
    }];
```

Swift:

```swift
BridgeSDK.authManager.signUp(withEmail: email, username: email, password: password) { (_, responseObject, error) in
    DispatchQueue.main.async {
        guard error == nil else {
            // handle failed sign-up
            return
        }
        // handle successful sign-up, e.g. ask the user to click the link in the verification email before proceeding to sign them in with these credentials
    }
}
```

See the [BridgeSDK documentation](https://developer.sagebridge.org/BridgeSDK/46/html/index.html) for more details, and the BridgeApp framework and sample app source code for working examples.

## BridgeApp

The BridgeApp framework is written primarily in Swift 4.0, and provides an extensible and customizable application framework for building mHealth apps using Bridge and SageResearch. It supersedes both Apple's and Sage's forks of the older AppCore framework, which was not built to be extensible or customizable and is therefore no longer being actively supported.

BridgeApp includes the correct commits of BridgeSDK and SageResearch as git submodules, so when you clone it you should do so recursively:

```bash
git clone --recursive https://github.com/Sage-Bionetworks/BridgeApp-Apple-SDK.git
```

If you've already cloned the repo without the --recursive option, you can do this from within the BridgeApp directory to get the submodules:

```bash
git submodule update --init --recursive
```

The BridgeApp Xcode project includes the BridgeApp target for building the framework, and the BridgeAppExample target for building a sample app demonstrating how to use the framework to build a basic functioning Bridge/Research mHealth app.
