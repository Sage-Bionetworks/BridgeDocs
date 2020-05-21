---
title: Single File Uploads
layout: article
---

<div id="toc"></div>

You can now upload single files as health data to Bridge. Simply follow the steps described in [Uploading Your Bundle](bundled_zip_file_uploads.html#uploading-your-bundle), with the following differences.

1. Instead of assembling a zip file bundle, simply upload your file as a single file.
2. In the call to the Upload Request API, add the flag "zipped" and set it to false. For example:

```json
{
  "name":"binary-file-encrypted",
  "contentLength":1245,
  "contentType":"application/octet-stream",
  "contentMd5":"Z1nJ4MVKEcHnLyD16vBEFA==",
  "zipped":false
}
```
