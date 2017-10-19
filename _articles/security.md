---
title: Security Overview
layout: article
---

<div id="toc"></div>

Sage has extensive internal policies which govern the deployment of Bridge Services to ensure compliance with legal and ethical obligations governing human health research. We've undergone security reviews by numerous industry and academic partners, and have our systems and processes regularly audited by external security specialists to ensure compliance with HIPAA and other regulations.

**Amazon Web Services** provides the base layer for all Bridge Services. AWS is the world-wide leader in cloud computing and provides security measures at the physical and network layers sufficient to comply with strict federal requirements including [the standards of HIPPA](http://aws.amazon.com/compliance/). Coded study data are stored at rest in Bridge using a combination of [Amazon S3](https://aws.amazon.com/s3/) and [DynamoDB](https://aws.amazon.com/dynamodb/). A number of asynchronous background processes run on [Amazon EC2](https://aws.amazon.com/ec2/) workers or as [Amazon lambda](https://aws.amazon.com/lambda/) functions.

##Storage of Personally-Identifying User Account Data by Bridge Server
Bridge has been deployed in research studies following two main strategies:

1. **Study participants self-enroll in the study electronically.** This strategy is used when studies allow participants across the country to self-enroll in the study electronically, as in many of the public Research Kit studies. In this case, the app provides minimal identifying information such as first name, last name, Date of Birth, and email address to the server. This information is sufficient to create an electronic record of consent to participate in a mobile study. Bridge also provides tools to the research team to facilitate recontact of study participants when permitted by the study protocol. This strategy has the broadest possible enrollment, and allows for study designs in which participants never physically interact with the study team.

2. **Consent and registration is managed by a 3rd party, and participants use Bridge Server anonymously** This strategy is often used when the study app is a complement to a traditional clinical study, in which participants are enrolled in person during a clinic visit. In this case, a 3rd party research team may maintain all personally-identifying information about a study participant. Either Sage, or the research team may assign anonymous identifiers which are used to identify participants by Bridge Server. In this case no PII is stored in Bridge server, at the cost of prohibiting auto-enrollment in the study through a publicly-available app. 

In either strategy, Bridge stores account information in a back-end database distinct from the one that stores the study data. Currently, the Bridge server stores account data in an AWS-hosted MySQL database (RDS).  This way, in the rare event that either database is compromised, the connection between a person and her/his health data will remain protected. Account information is encrypted at rest, as documented in [Encrypting Amazon RDS Resources](http://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Overview.Encryption.html). In addition, the database is configured so that connections to the database must use SSL.

##Storage of Study Data
Study data, defined as survey responses and mobile sensor data, is stored in Bridge separately from user account information. A publicly accessible account identifier is generated for each account by Bridge. In addition, for each user in a study, the Bridge service generates a universally unique identifier (UUIDs). This UUID, called “participant health code”, is used internally by Bridge as the key to user’s study data. If the same user enrolls in multiple studies, multiple account IDs and health codes will be generated to keep data for each study isolated. Thus, Bridge never links the Bridge account ID directly to the study data.

Bridge stores encrypted study data in a combination of AWS DynamoDB and AWS Simple Storage Service (S3). The only unencrypted data stored in either system will be the study participant ID, the study ID, the ID of the data module (defines the data schema), and the time the data was captured, stored in Dynamo for each time point at which data is collected. This allows Bridge to support time-range queries for a user to retrieve his / her own data. This design allows clients to complete personal data histories for participants, even if data is collected from multiple devices / interfaces. Large binary study data such as voice recordings, and bundled uploads will be stored in S3, using Amazon’s server-side encryption. Amazon manages the server-side encryption transparently for us. It currently uses 256-AES-GCM.

![Sequence Diagram](/images/security2.png)

Process for transferring health data from client to Bridge server: 

1. Data is encrypted by the mobile client using Cryptographic Message Syntax (CMS). The CMS public key is generated by Sage using 2048-bit RSA and is supplied to the app developer. Each study is assigned a different public key. Data will be cached on the device for upload to the server pending network availability. 

2. A background process on the client OS calls the service to get a location to upload data to, returned as URL pointing to an AWS S3 bucket dedicated for file upload that is part of the Bridge stack. 

3. Upload of the encrypted data file over S3 is via HTTPS. 

4. A call to Bridge Server informs the server that the upload process is complete. 

5. An asynchronous server process decrypts and validates the file using a private key held only by Sage Bionetworks. 

6. Metadata is written to Dynamo to record the user, study, and time of data collection. Research data is written to a S3 bucket dedicated for each particular study. For more details see our policies around Key Management.

##Researcher Access to Study Data
Bridge provides no APIs to allow researchers to query the study data in real time. Instead, authenticated researchers on the project team can trigger an export of the aggregated study data from all participants in their study in which participants are identified only by their unique study data ID. This ensures that the researcher cannot link back any particular records to any particular participant. 
