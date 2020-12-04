---
title: Bridge REST API
layout: html5
---

<div id="swagger-ui"></div>
<!--<div id="api_url" content="/rest-api/{{site.data.versions.java_sdk}}/rest-api/swagger.json"></div>-->
<div id="api_url" content="/swagger.json"></div>
<script src="./swagger-ui-bundle.js"> </script>
<script src="./swagger-ui-standalone-preset.js"> </script>
<script>
window.onload = function() {
  var url = document.getElementById("api_url").getAttribute("content");
  const ui = SwaggerUIBundle({
    url: url,
    dom_id: '#swagger-ui',
    deepLinking: true,
    docExpansion: 'none',
    defaultModelRendering: 'model',
    tagsSorter: 'alpha',
    layout: "StandaloneLayout",
    validatorUrl: null,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ]
  })
  window.ui = ui
}
</script>
