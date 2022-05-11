---
title: Platform Overview
layout: article
---

<div class="ui message">
<p>Key components of Sage's platform are:</p>

<dl>
    <dt><a href="/articles/rest.html">Bridge Services</a></dt>
	<dd>A set of REST-based web services that allow mobile apps to receive study configuration such as surveys and task schedules, manage participant registration and consent, and securely receive participant data.  </dd>

    <dt><a href="/articles/ios/ios.html">iOS and Research Kit SDKs</a></dt> 
	<dd>Open source libraries for building mobile health apps using Bridge Services and Apple's Research Kit.</dd>

	<dt><a href="/articles/android/android.html">Android SDKs</a></dt>
	<dd>Open source libraries for building mobile health apps using Bridge Services and the open source Research Stack framework.</dd>

	<dt><a href="/articles/java.html">Java REST Client</a></dt>
	<dd>A Java-based client for integration with the Bridge server.</dd>

	<dt><a href="https://synapse.org">Synapse</a></dt>
	<dd>An open source software platform that data scientists can use to carry out, track, and communicate their research in real time. Synapse has seeded a growing number of large scale biomedical research projects centered around genomic, clinical, imaging, mobile health, and other biomedical data sets.</dd>
</dl>
</div>
Participants in a Sage-supported mHealth study interact with an app installed on their iPhone or Android smartphone.  These apps communicate over the internet with Bridge Server, a service designed to manage mHealth data in IRB-approved human health research studies in a secure and ethical fashion. Bridge is hosted on Amazon Web Services and other cloud providers, and is operated by Sage Bionetworks. [Bridge Server source code](https://github.com/Sage-Bionetworks/BridgePF) is available in GitHub - however Sage recommends developers use Sage's hosted services rather than manage their own server instance.  This approach has allowed Bridge server to be used to support over 15 different research studies, including those conducted by independent research teams without scientific oversight from Sage Bionetworks.  

![Sage Platform](/images/BridgeDataFlow.png)

Data flows in a Bridge-supported mHealth study as shown above.  

1. Participants interact with an app on their smartphone.  

2. During registration, the study app creates an account for the participant with Bridge. As part of enrollment, study participants may provide personally identifying information (PII) to create an account (e.g. email / password), to allow for recontact by the research team (e.g. address, phone), to create a record of informed consent (e.g. name, signature, date of birth), or for other reasons as permitted by the study protocol.  

3. Bridge stores participant PII in the account database, and generates a unique, random health code for each participant. The account management service automatically generates a unique random identifier, or health code, that will be associated with participant study data, and maintains an encrypted mapping between participant account and participant study data. Thus, researchers analyzing the coded study data will not know the identity of the participants.

4. As the participant completes activities in the app, data is uploaded to Bridge Server, mapped to the participant’s health code, and cached by Bridge Server.  

5. Coded study data is periodically exported to Synapse, typically this is done on a nightly basis. 

6. Data is made available to the study analysis team. Synapse provides supports for data analysts to work with mHealth data, while separating these researchers from access to potentially sensitive account data.


