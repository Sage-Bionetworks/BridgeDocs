---
title: Submitting Health Data
layout: article
---

Before your study can accept health data, you will need to set up [schemas](/articles/data/schemas.html). A schema tells Bridge Server the format of your data, so it can process, validate, and export your data to [Synapse](https://www.synapse.org/).

Apps can submit health data in one of three ways:

1. [asynchronous zip file uploads](/articles/data/bundled_zip_file_uploads.html) - This is generally best if your data has a lot of attachments, such as accelerometer data.
2. [single file uploads](/articles/data/single_file_uploads.html) - This is for uploading a single non-JSON file, such as CSVs or PDFs or images.
3. [synchronous direct health data submissions](/articles/data/synchronous_health_data_submission.html) - This is best if your data is very small (such as survey responses) where you don't want to incur the overhead of uploading a small file to S3.
