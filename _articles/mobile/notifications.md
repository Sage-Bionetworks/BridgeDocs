---
title: Notifications
layout: article
---

<div id="toc"></div>

Bridge provides support to send notifications to individual participants, or to groups of participants interested in specific [notification topics](/#NotificationTopic). These topics can be either push notifications or SMS notifications. Your client application registers for notifications, and subscribes to the topics the user is interested in.

Additionally, researchers can create topics with [Criteria](/#Criteria), to send the notification only to those users who meet the criteria.

## Push Notifications

### Configuring Push Notifications

Mobile operating system providers (Apple and Google) provide push notification services (APNS and GCM, respectively). Each service must be configured separately for your study, and then Bridge must be updated with some key information to send push notifications to your app. This configuration is the same regardless of how you use push notifications through Bridge, and only needs to be set up one time.

Bridge engineers will work with your app developers to configure Bridge to send push notifications through the Bridge Study Manager. 

### Registering for Push Notifications

After a user consents to receive push notifications via the mobile operating system, the system will notify your application and provide a unique *device identifier* (APNS calls this the *device token*, and GCM calls this the *registrationId*). 

Your app should [send this device identifier](/swagger-ui/index.html#/_For%20Consented%20Users/createNotificationRegistration) to Bridge in order to register for notifications. Bridge returns a registration GUID which you can use to [update the device identifier at a later time](/swagger-ui/index.html#/_For%20Consented%20Users/updateNotificationRegistration), as well as to subscribe to notification topics (see below).

It is possible to [retrieve a list of device registrations for a participant](/swagger-ui/index.html#/_For%20Consented%20Users/getNotificationRegistrations) (if the participant installs your app on multiple devices. there will be more than one).

Some notification services, like APNS, suggest that this device identifier can change over the lifetime of your app's installation. Follow the advice of your push notification provider. Bridge allows the registration to be updated at any time.

Once registered, you will be able to [send a push notification to an individual user](/swagger-ui/index.html#/_For%20Researchers/sendNotificationToParticipant) on the registered device. In the Bridge Study Manager, find an individual user, and navigate to their *Push Notifications* tab. If they have a registration, they can receive a notification.

<div class="ui message">
    <div class="ui header">Example</div>

    <p>A study has asked participants to provide genetic history in a survey. If the user qualifies, the study would like to offer a free DNA testing kit to the participant. In this context, it would be appropriate to contact the participant directly, either through email or through a notification for a free offer of the kit.</p>
</div>

## SMS Notifications

To register for SMS Notifications, all you need is a phone number. You'll need to call the [Create Notification Registration API](/swagger-ui/index.html#/_For%20Consented%20Users/createNotificationRegistration), and include the sms protocol and the phone number, with the international calling code. For example:

```json
{
  "protocol":"sms",
  "endpoint":"+14255550123"
} 
```

Only consented participants can register for SMS notifications, and a participant can only register for SMS notifications with a phone number associated to their account.

## Notification Topics

To send notifications to more than one user, you must [create some *notification topics*](/swagger-ui/index.html#/_For%20Developers/createNotificationTopic). You must define a name and a short name for your topic. The name will be displayed in the Bridge Study Manager (as well as the short name). The short name is displayed in SMS notifications and must be 10 characters or less.

Under *Push Notifications* in the Bridge Study Manager, developers can create one or more topics. We strongly suggest you create a general topic to apply to all users, but you may create as many additional topics as you need. Apps then subscribe to one or more topics in order to [receive topic notifications](/swagger-ui/index.html#/_For%20Researchers/sendNotificationToTopic).

Topic notifications can be sent from the Bridge Study Manager by navigating to the topic under *Push Notifications*.

**NOTE:** If a device is unregistered with Bridge, or if a participant withdraws consent, all topic subscriptions are deleted as well.

There are two types of notification topics: manual subscription topics and criteria-managed topics.

### Manual Subscription Topics

Manual subscription topics are notification topics that do not have criteria associated with them. Your app must [subscribe to any topic for which that user will receive notifications](/swagger-ui/index.html#/_For%20Consented%20Users/subscribeToTopics). **NOTE:** When you call this API, you must specify *all* topics that the user should be subscribed to. Any manual subscription topics not included in this list will be unsubscribed. **NOTE:** Criteria-Managed Topics are not affected.

The topic GUIDs can be hard-coded in your application, but it is more advisable to [retrieve them from the server](/swagger-ui/index.html#/_For%20Consented%20Users/getTopicSubscriptions) or from the user's session, which also contains the list of [SubscriptionStatus](/#SubscriptionStatus) records.

When the user gives permission to receive remote notifications, register their device and set up some default topic subscriptions (see below). In your app, present the list of topics to the user as a set of preferences to receive different types of notifications, so the user can turn notifications on or off for each topic.

These subscriptions are persisted with the server. In order for a user to receive a notification, they must have subscribed to the topic.

During the first time onboarding experience, you can choose one of several defaults:

* enable all notification types (subscribe the user to all topics to start); 
* disable all notification types (do not subscribe the user to any topic, though this may be confusing since they just gave consent to receive notifications); or 
* present the user with the topics and allow them to selectively subscribe to some notifications (the most complex onboarding option since it requires some additional UI).

<div class="ui message">
    <div class="ui header">Example</div>

    <p>To engage users, a study plans to send notifications on a variety of topics: when a new survey or article appears in the application; when the study reaches the target number of active users; when the study produces a new report on the participant's data; when a new version of the app is released; and other potential topics may be added later.

    <p>It is appropriate to break these notifications up into different topics, and allow the user to subscribe only to the notifications they are interested in. Too many notifications will encourage the participant to turn off notifications or delete the app.

    <p>Note that if a new topic is added later, no user will initially be subscribed to it. You will need to subscribe them in an app update, or notify users through a general topic channel that there is a new kind of notification available to them.
</div>

### Criteria-Managed Topics

Criteria-Managed Topics are topics that are managed by criteria, such as the participant's language preferences and data group. When the participant first registers for notifications, or when their criteria change, Bridge server automatically subscribes the participant to matching topics. **NOTE:** Notification topics by app version is not yet supported. **NOTE:** Manual subscription topics are unaffected and must be subscribed to or unsubscribed from manually.

<div class="ui message">
    <div class="ui header">Example</div>
    <p>In a bilingual study, you could create a "General English" topic requiring the user's language to be "en" and "General Spanish" topic requiring the user's language to be "es".

    <p>Your app could use subscribe the user to both topics. When sending notifications, your research manager would send an English message to the English channel and a Spanish message to the Spanish channel. Depending on the user's chosen language, they would receive one of the two notifications, in their chosen language.

    <p>The advantage of this approach is that if the participant ever changes their language, they would immediately begin receiving the notifications in that language.
</div>

## Notification Content

The content of a notification is defined by the [NotificationMessage](/#NotificationMessage) object. It is currently very simple, but will be augmented over time.

### SMS Notification Content

SMS notifications are in the form:

```
[short name]> [message]
```

For example, if your topic has name "Monthly Reminder Topic" and short name "Reminder", and you send a notification with subject "Monthly Reminder" and message "This is your monthly reminder", then the SMS notification will appear as

```
Reminder> This is your monthly reminder
```

Note that the notification subject is not used for SMS notifications.
