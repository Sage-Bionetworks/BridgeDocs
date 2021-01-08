---
title: Exporting to Synapse
layout: article
---

<div id="toc"></div>

Your study can be configured to automatically export health data to [Synapse](https://www.synapse.org/). This document covers how to configure your study, export your data, and understand your data in Synapse.

## Prerequisites

If your study is already configured to export to Synapse, you can skip to [Exporting Your Data](#exporting-your-data). To determine if your study is configured, go to the [Bridge Study Manager](https://research.sagebridge.org/), navigate to Upload &amp; Export, subsection Export Settings. If Synapse Project ID and Synapse Access Team ID are filled out, you're good to go.

If these aren't filled out, you'll need to create a Project and a Team in Synapse. You will need to give [BridgeExporter](https://www.synapse.org/#!Profile:3325672) administator permissions, so that this account can create tables and manage their permissions. To do this:

1. Browse to the home page of your Synapse project.
2. Click "Share".
3. Under "Add People", type in BridgeExporter.
4. Select BridgeExporter from the auto-complete list that pops up.
5. BridgeExporter should be added to the list of people at the top of the popup. On the right, there's a dropdown. Click on the dropdown and select "Administrator".
6. Optionally uncheck "Notify people via email". BridgeExporter is an automated account, and as such, any email would just be ignored.
7. Click "Save".

You don't need to do anything special for the Team. By default, you become the Team Manager when you create the team. If people need access to the Synapse tables, you should add them to this team. To do this:

1. Have the team member create a Synapse account. Note their Synapse username.
2. Browse to the Team's home page in Synapse.
3. On the right hand, click the "Tools" dropdown and click "Invite User".
4. Under "User Search", type in the username.
5. Click on the user in the auto-complete list that pops up.
6. Click "Send Invitation".
7. Next time they log into their Synapse account, they should have the option to accept the invitation and join your Team.

Lastly, you may want to add the Team to the Project, so that your team members can view other content in your Project (such as Wiki, Files, etc). To do this:

1. Browse to the home page of your Synapse project.
2. Click "Share".
3. Under "Add People", type in the name of your Team.
4. Select the Team from the auto-complete list that pops up.
5. Your Team should be added to the list of people at the top of the popup. On the right, there's a dropdown. By default, the dropdown is set to "Can download". Feel free to change this to whatever you deem appropriate. (That said, we do not recommend giving Administrator privileges to such a wide audience.)
6. Click "Save".

## Configuring Your Study

Note the Synapse ID from the Project you created in the previous step. This can be found in the Project's home page, near the top left. It should look like "syn5611559".

Also note the Team ID from the Team you created in the previous step. This can be found in the Team's URL. For example, if the URL is `https://www.synapse.org/#!Team:3335336`, the Team ID is 3335336.

In the [Bridge Study Manager](https://research.sagebridge.org/), navigate to Upload &amp; Export, subsection Export Settings. There are two fields and two checkboxes:

* **Synapse Project ID** - Fill in the noted Project ID. When you fill this in, a link will be generated and allow you to verify you have the correct Project ID.
* **Synapse Access Team ID** - Fill in the noted Team ID. This will also generate a link.
* **This study has a custom export schedule set up for it** - This is an advanced feature not covered in this doc. In most cases, you should leave this unchecked.
* **Disable Export** - If for whatever reason, you need to pause exports to Synapse, check this checkbox.

Once you've filled in the settings, click "Save". Your study should now be configured to export its data to Synapse.

## Exporting Your Data

Bridge automatically exports your study's data to Synapse every night. This export runs nightly at 3am Pacific Local Time and is subject to change without notice. Bridge will export all data from the previous day, using midnight Pacific Local Time as the nightly cutoff.

For example, on October 11th at 3am PDT, Bridge will export data from October 10 12am PDT to October 11 12am PDT to Synapse.

In addition, if you need faster turnaround (either for lab work, or for app development and QA), you can trigger an On-Demand Export through the [Bridge Study Manager](https://research.sagebridge.org/). Navigate to Upload &amp; Export, subsection Export Settings, and click on "Export Now to Synapse" in the top right. This will kick off an On-Demand Export. After about a minute or so, your data should appear in Synapse. (Note that because of clock skew and asynchronous processing, if you submit health data, and then immediately press the Export Now button, the Export may begin before the health data is processed.)

The Export Now feature remembers the last time data was exported for this study (either a nightly export or the On-Demand Export) and only exports data that has been submitted since then. As such, you don't have to worry about double-exporting anything with the Export Now feature.

## Understanding Your Data

Bridge exports your data to Synapse as tables. To find them, navigate to your Project in Synapse and click on the Tables tab.

Bridge creates 4 different types of tables in your Project:

1. Health Data Summary Table, previously known as the appVersion table. This table contains a summary of all health data exported to Synapse. Each health data record is a single row in this table. This table is best used for statistics, reporting, and general health checks.
2. Individual health data tables. Bridge creates a table for each revision of each schema. These tables contain the submitted health data. Each health data record is a single row in one of these tables.
3. Default Health Data Record Table. This is used for health data records that do not correspond to any particular schema (or for records whose schemas could not be found). Each health data record is a single row in this table.
4. Study status table. Each export job (nightly or on-demand) appends a row to this table. This is used for advanced features not covered in this doc.

### Common Fields

Both the summary table and the health data tables contain a set of common fields:

|Field|Description|
|---|---|
|recordId|Unique ID for this health data record.|
|appVersion|App version, as reported by the app. Generally in the form "version 1.0.2, build 12".|
|phoneInfo|Phone information, as reported by the app. Generally contains phone hardware information and OS information.|
|uploadDate|Calendar date (Pacific Local Time) when the data was exported to Synapse.|
|healthCode|De-identified code, which uniquely represents an individual participant in this study.|
|externalId|External ID, a unique ID for each individual, defined and set by the apps and managed outside of Bridge. This field is app-specific and may not be filled out in each table.|
|dataGroups|Comma-separated list of data groups. Can be used for tagging test users or study subpopulations.|
|createdOn|When the health data was measured, as reported by the app. This is displayed in the Synapse Web UI in your local time zone, but is stored externally as epoch milliseconds and does not contain any inherent time zone information.|
|createdOnTimeZone|The participant's time zone, at the moment this data was measured, as reported by the app. This time zone is a string representation of a UTC offset. Combine this with createdOn to get a date-time with time zone information.|
|userSharingScope|Participant's sharing scope, representing what level of sharing they have consented to. The two possible values are:<ul><li>**ALL\_QUALIFIED\_RESEARCHERS** - Participant has consented to sharing their data with any researcher who qualifies given the governance qualifications of this data set.</li><li>**SPONSORS\_AND\_PARTNERS** - Participant has consented only to sharing their data with the original study researchers and their affiliated research partners. This data should not be shared with anyone else.</li></ul>|
|validationErrors|Error messages indicating that this health data record failed validation. For example, the record may have missing required fields, may have fields of the wrong type, or may have multiple-choice answers that are not allowed.|
|substudyMemberships|A mapping from substudy ID to the participant's external ID. If the participant is not in that substudy, there will be no entry for that particular substudy. A user might be in a substudy without an external ID. The data is in the format "&#124;[substudyId1]=[externalId1]&#124;[substudyId2]=[externalId2]&#124;".|

### Summary Table

The Health Data Summary Table (previously called the appVersion table) includes one additional field:

|Field|Description|
|---|---|
|originalTable|Name of the table that contains the health data record this row is referencing.|

### Health Data Tables

In addition to common fields, health data tables also includes fields defined by [health data metadata](/articles/data/health_data_metadata.html) and by [schemas](/articles/data/schemas.html). See those pages for further information.

Some fields in the health data tables are file handles (attachments). In the Synapse Web UI, these are displayed as links, which allow you to download the attached file. In the Synapse API or through the R, Python, or Java clients, these are file handle IDs, and require a separate call to Synapse to download the attached files.

Lastly, every row in the health data tables also includes a rawData field, which includes a link to the raw JSON or zip file submitted by the client.

### Default Health Data Record Table

This table also includes the same common fields, health data metadata fields, and raw data fields as health data tables. The key difference is that records in this table do not correspond to any schema (or to non-existent schemas).
