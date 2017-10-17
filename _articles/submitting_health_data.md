---
title: Submitting Health Data
layout: article
---

Before your study can accept health data, you will need to set up [schemas](schemas.html). A schema tells Bridge Server the format of your data, so it can process, validate, and export your data to [Synapse](https://www.synapse.org/).

Apps can submit health data in one of two ways:

1. [asynchronous zip file uploads](bundled_zip_file_uploads.html) - This is generally best if your data has a lot of attachments, such as accelerometer data.
2. [synchronous direct health data submissions](synchronous_health_data_submission.html) - This is best if your data is very small (such as survey responses) where you don't want to incur the overhead of uploading a small file to S3.
