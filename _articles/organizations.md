---
title: Organizations
layout: article
---

<div id="toc"></div>

Organizations are currently being developed and have limitations in functionality that will be addressed late in the v2 development roadmap:

1. Accounts can only be members of one organization;
2. Accounts cannot have different roles vis-a-vis different studies they can access through their organization;

If these limitations currently impact your design, we can use multiple app configurations as a workaround.

## Membership

Administrative accounts in the Bridge system are scoped to an app, and are created as members of an organization (this can be an institution, a team, or any other set of collaborators who are working together on a [study](studies.html)). Accounts can currently only be part of one organization.

After creating an account, it can be associated to a study through the [add member](/swagger-ui/index.html#/Organizations/addMember) and [remove member](/swagger-ui/index.html#/Organizations/removeMember) APIs. The members of an organization can be [enumerated through a search API](/swagger-ui/index.html#/Organizations/getMembers) as well, and a special API exists to return [administrative users who are currently unassigned to an organization](/swagger-ui/index.html#/Organizations/getUnassignedAdminAccounts) (useful for finding the account if it is not created with the `orgMembership` field set to your organization’s identifier).

## Sponsorship

Organizations can *sponsor* one or more studies, giving all members of an organization access to those studies. The specific APIs that users can use in these studies are determined by the user’s roles. 

Once a study has been created, there are APIs for an organization to [sponsor the study](/swagger-ui/index.html#/Organizations/addStudySponsorship) or to [stop sponsoring the study.](/swagger-ui/index.html#/Organizations/removeStudySponsorship) There is also an API to [list an organization’s sponsored studies.](/swagger-ui/index.html#/Organizations/getSponsoredStudies)

## Study access

This is a general description of what each role allows, for any study the caller has access to through their organizational membership. For specific API access, please consult the [API documentation](/swagger-ui/index.html). It is not currently possible to assign accounts to different roles vis-a-vis different studies.


| Role       | Scope | Description |
| ---------- | ----- | ------------ |
| Developer  | App | Developers can currently change many aspects of an app's configuration for functionality such as authentication and server-supported app configuration. This role currently spans all studies and is app-scoped. |
| Researcher | Study | A researcher can see participants in the studies they have access to through their organizations. This includes participant, enrollment, and consent records. They have the ability to manually enroll new accounts into studies, with an optional external ID, and to withdraw them. This is the only role that can re-identify participants by mapping back a health code to the participant's personally identifiable information. |
| Org Admin  | App | An organization administrator can create, edit, and delete other organizational accounts. However, only admins can change the studies that an organization sponsors. |
| Admin      | App | An admin can use any API within the context of an individual app. |
