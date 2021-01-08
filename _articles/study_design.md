---
title: Study Design
layout: article
---

<div id="toc"></div>

## Participant recruitment

Bridge Server supports a variety of ways to incorporate mobile apps into your research study. For example, you may publish your app in the Apple or Google app stores to make them accessible to anyone with a smartphone, and conduct research using the app as your only point of contact with study participants. Or you may recruit participants into a study that has an in-person clinical component, and use the app as a way to collect additional data in between clinic visits. 

We refer to these as the "public study" and "clinical study" approaches to recruiting study participants.

All study participants need to provide a unique account identifier to Bridge Server when registering for the study using an app. For public studies, this account identifier is an email address. For clinical studies, the study team must provide a custom account identifier for each participant. Your team may elect to do this, for example, because you are already collecting personally-identifiable information using another mechanism, and you do not want to duplicate this information in Bridge.

Whether an email address or a custom identifier, Bridge securely stores this information, along with other participant account data, separately from the research data. Bridge generates a mapping between the account identifier and a unique, random health code, and uses the latter to identify participants in study data. If the account identifier is something that is non-identifying, Bridge can be configured to include this value in the externalId field of the study data.

### Public study options

In studies that allow for public recruitment using email-based sign ups, you can additionally configure the study to accept an account identifier. That identifier can be optional, or required at sign up, and you have the option to validate it against a list of external identifiers you have provided for the study.

<div class="ui message">
    <div class="ui header">Example</div>

    <p>You plan to release a public study, but you would like previously enrolled study participants from your clinic to use the application as well. To relate their study data to their clinical records, you can enter the account identifiers from your clinical study into Bridge, and configure the server to allow for optional, validated account identifiers to be entered at some point in the app's onboarding process.
</div>

### Clinical study options

Clinical studies must import account identifiers into Bridge, and create credentials for every identifier before it can be used. If you create the credentials at the time you import the identifiers, you may need to track assignment in an external system.

However, you can delay the creation of credentials, and use this to keep track of which identifiers you have allocated through the Bridge Study Manager:

![Assigning External IDs](/images/assign_external_id.png)
_Code 82-110-929 has been assigned to a user; other codes are still available for assignment._

In the study manager, you can see the identifiers listed along with information about whether or not the identifier has credentials. When you are ready to assign the identifier, you can create credentials to record the fact, and then assign that identifier to a new user.

<div class="ui warning message">
    <div class="ui header">Note</div>
    <p>It is important to understand how Bridge supports external patient identifiers through a public API.

    <p>For each external account identifier imported into Bridge, a matching set of credentials needs to be generated (a fake email address and password). The application will use these credentials to authenticate and start a session with the Bridge server. For example, if your email support address is <code>support@yourorganization.com</code>, and the account identifier is <code>ASDF</code>, the fake credentials will be <code>support+ASDF@yourorganization.com</code> using the password <code>ASDF</code>.

    <p>We must do this because the Bridge API is public and without authentication, anyone could submit data to your study. <b>It is important that your identifiers be as secure as a reasonably secure password.</b> A site like <a href="https://howsecureismypassword.net/">How Secure Is My Password?</a> can help choose a format for your codes.
</div>

## Content for your study

Once a study is configured, you can add content to the study, such as consents, surveys, data upload schemas, and schedules. 

### Filtering

Scheduled activities and consents can be selectively chosen for a participant based on a number of **filtering criteria.** Since all the content that the participant sees is driven by scheduling, this allows you to tailor all the other aspects of a study for a given participant. **Filtering is "opt in". If these values are not sent in HTTP headers or set for the user, no filtering will occur.** 

The criteria that can be used for filtering are:

* **The operating system and application version of a user's request**<br>Through the use of our REST client, your application will send an HTTP header to Bridge that includes your application version. We can tailor content based on this version.

* **The data group tags assigned to a user**<br>Data group tags can be assigned to users to model any of a number of differences between users (anything short of information that would be identifying for an individual user, like an ID).

* **The user's preferred language**<br>Information about the user's preferred language is sent in an HTTP header and saved as part of the user's profile. This language preference can be used to return localized content to a study participant.

**Note:** If a public API (one that does not require authentication) performs filtering on the returned content, then only the information found in the User-Agent and Accept-Language headers will be used to filter. Currently the only API of this nature is a public API to retrieve an app configuration from the server. 

Using this filtering, Bridge can model a few different use cases: 

* **Study Cohorts**<br>Individuals can be tagged with a data group during enrollment, and your study can filter consents, schedules, surveys and tasks based upon these cohorts. Cohorts can include control groups, underage participants, and more.

* **Test Users**<br>Test or beta users can be tagged with a data group. Records in Synapse are exported with the user’s data groups, so you can remove this test data from your final data set. All studies have a `test_user` data group that can be used for this purpose.

* **Application releases**<br>You can hold back consent and scheduling changes by filtering them out of study content until a new app with a new version is downloaded by users. Test versions of the application, with the higher application version, can see these changes during your testing period.

* **Localization**<br>Language differences can be used to return different consents, activities, and surveys to a user, or even change the study to meet different governance requirements for different locales.

* **Application end-of-life**<br>The application version can be used to force users to upgrade if their version of the app is no longer compatible with your study's evolving requirements.

### Versioning

Consents and surveys can be edited multiple times, and then a revision can be published when you have a final product. Surveys can have multiple published versions. It is common to return the most recently published survey version, but if outstanding tasks still refer to an old version of the survey, those tasks will continue to work.

Schemas are not currently published _(however, they will be shortly)._

Only published resources can be included in a participant's activities. Schedules can also be created that use whatver is the most recently published version of a resource.

Schedules, email templates, and all other configuration settings are not versioned; they are immediately reflected in your study. **That includes filtering criteria itself.**

### Consents

Bridge Server can be configured to require and collect consent to research, before it will allow a user to access its services.

For public studies, at least one consent should be required. You do not have an opportunity to interact with users before they sign up and participate in a study, so this is your only means of acquiring consent.

For clinical studies, a required consent is optional. Most customers disable consent in these situations, and consent participants in face-to-face meetings, but it can still be recorded through the Bridge Server if you wish.

### Upload Schemas

Upload schemas describe how to export data in JSON format, from your app to a Synapse table. With the correct schema, you can upload your data in a way that makes it easier to search and process data within Synapse, our data repository platform. See [Submitting Health Data](/articles/data/submitting_health_data.html) for details.

### Schedules

The rest of the content that is presented to users is driven by the schedules you create for your study. See [Scheduling](/articles/v1/scheduling.html) for details and options.