---
title: Managing You Studies
layout: article
---

This article describes the management of administrative accounts and permissions to create and run studies through Bridge.

<div id="toc"></div>

## Roles

Bridge uses a role-based authorization system. 

In Bridge v1, roles such as “developer”, “researcher”, and “admin” authorized users to perform actions within the context of an app. 

| Role       | Scope | Description |
| ---------- | ----- | ------------ |
| Developer  | App | Developers can currently change many aspects of an app's configuration for functionality such as authentication and server-supported app configuration. This role currently spans all studies and is app-scoped. |
| Researcher | App | A researcher can see all accounts in an app, including all study participants, along with their enrollment and consent records. This role currently spans all studies and is app-scoped. |
| Admin      | App | An admin can use any API within the context of an individual app. In general, only Sage employees hold this role, but it can be granted to partners for specific apps. |

The app-scoped roles are currently being phased out as part of the v2 development roadmap.

In Bridge v2, where an app can support multiple studies, new roles have been introduced. User who are assigned these roles can only operate on studies that are sponsored by the organization they belong to. 

| Role       | Scope | Description |
| ---------- | ----- | ------------ |
| Organization Administrator  | Organization | An organization administrator can create, edit, and delete other administrative accounts within their organization. However, only app-scoped admins can change the studies that an organization sponsors. |
| Study Coordinator | Study | A study coordinator can see participants in the studies that are sponsored by their organization, **and see their personally-identifying information.** They can create, enroll and withdraw participants. |
| Study Developer | Study | A study developer can change the configuration of any study in Bridge that is sponsored by their organization. This includes elements such as the consent, study protocol, and scheduling for the study. |

## Organizations

Administrative accounts are assigned to an Organization (this can be an institution, a team, or any other set of collaborators who are working together on a [study](/articles/v2/studies.html)). Members of an organization are granted access to one or more studies through the organization‘s *sponsorship* of those studies. Partners will be added to the Bridge platform with an initial an *organizational administrator* who can manage further accounts in their organization through [account](/swagger-ui/index.html#/Accounts) and [organization](/swagger-ui/index.html#/Organizations) APIs.

<div class="ui warning message">
  <p>Initially, accounts can only be a member of one organization. This will be changed late in the v2 development roadmap to allow membership in multiple organizations. Part of that change will be the ability to assign different roles to an account within each organization. </p>
</div>

Organization admins have a set of [Account APIs](/swagger-ui/index.html#/Accounts) for creating administrative accounts. These accounts are scoped to their organization and cannot be re-assigned. The members of an organization can be [enumerated through a search API](/swagger-ui/index.html#/Organizations/getMembers).

However if an account already exists, it can be associated to an organization through the [add member](/swagger-ui/index.html#/Organizations/addMember) and [remove member](/swagger-ui/index.html#/Organizations/removeMember) APIs (only admins can move an account from one organization to another after it has been assigned). An API exists to return [administrative users who are currently unassigned to an organization](/swagger-ui/index.html#/Organizations/getUnassignedAdminAccounts) in order to find such accounts..

All of these APIs are tagged as a group of APIs that are available to organization administrators in our [Swagger API definition.](/swagger-ui/index.html#/_For%20Org%20Admins)

There is an API to [list an organization’s sponsored studies,](/swagger-ui/index.html#/Organizations/getSponsoredStudies) and study developers can create new studies that are sponsored by their organization. Only app-scoped admins can change the study sponsorships of an organization through APIs to [sponsor the study](/swagger-ui/index.html#/Organizations/addStudySponsorship) or to [stop sponsoring the study.](/swagger-ui/index.html#/Organizations/removeStudySponsorship)