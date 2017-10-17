---
title: Bridge REST API
layout: none
---
<head>
  <meta charset="UTF-8">
  <title>Bridge REST API</title>
  <link rel="icon" type="image/png" href="/swagger-ui/images/favicon-32x32.png" sizes="32x32" />
  <link rel="icon" type="image/png" href="/swagger-ui/images/favicon-16x16.png" sizes="16x16" />
  <link href='/swagger-ui/css/typography.css' media='screen' rel='stylesheet' type='text/css'/>
  <link href='/swagger-ui/css/reset.css' media='screen' rel='stylesheet' type='text/css'/>
  <link href='/swagger-ui/css/screen.css' media='screen' rel='stylesheet' type='text/css'/>
  <link href='/swagger-ui/css/reset.css' media='print' rel='stylesheet' type='text/css'/>
  <link href='/swagger-ui/css/print.css' media='print' rel='stylesheet' type='text/css'/>
  <script src='/swagger-ui/lib/object-assign-pollyfill.js' type='text/javascript'></script>
  <script src='/swagger-ui/lib/jquery-1.8.0.min.js' type='text/javascript'></script>
  <script src='/swagger-ui/lib/jquery.slideto.min.js' type='text/javascript'></script>
  <script src='/swagger-ui/lib/jquery.wiggle.min.js' type='text/javascript'></script>
  <script src='/swagger-ui/lib/jquery.ba-bbq.min.js' type='text/javascript'></script>
  <script src='/swagger-ui/lib/handlebars-4.0.5.js' type='text/javascript'></script>
  <script src='/swagger-ui/lib/lodash.min.js' type='text/javascript'></script>
  <script src='/swagger-ui/lib/backbone-min.js' type='text/javascript'></script>
  <script src='/swagger-ui/swagger-ui.js' type='text/javascript'></script>
  <script src='/scripts/bridge-auth.js' type='text/javascript'></script>
  <script src='/swagger-ui/lib/highlight.9.1.0.pack.js' type='text/javascript'></script>
  <script src='/swagger-ui/lib/highlight.9.1.0.pack_extended.js' type='text/javascript'></script>
  <script src='/swagger-ui/lib/jsoneditor.min.js' type='text/javascript'></script>
  <script src='/swagger-ui/lib/marked.js' type='text/javascript'></script>
  <script src='/swagger-ui/lib/swagger-oauth.js' type='text/javascript'></script>
  <script src='/swagger-ui/load.js' id="load" 
    path="/rest-api/{{site.data.versions.java_sdk}}/rest-api/swagger.json"></script>
</head>
<body class="swagger-section">
<div id='header'>
  <div class="swagger-ui-wrap">
    <h3 style="font-size: 23px; line-height:23px; display:inline-block">
        <a style="color:white!important; cursor:pointer" href="../">Bridge API</a>
    </h3>
    <form class='signIn' onsubmit="getSessionToken(this); return false">
      <input type="text" size="15" id="studyId" placeholder="Study ID"/>
      <input type="text" size="15" id="email" placeholder="Email"/>
      <input type="password" size="15" id="password" placeholder="Password"/>
      <button>Sign In</button>
    </form>
  </div>
</div>
<div id="message-bar" class="swagger-ui-wrap" data-sw-translate></div>
<div class="swagger-ui-wrap" style="margin-bottom: 1rem; font-style:italic">
  <p>Any endpoint with the <span class="swagger-section authorize__btn_operation_logout authorize__btn_operation"></span> symbol requires 
  that you be authenticated to make the service call. To create a session and use it in this help 
  documentation, sign in using the form at the top. Be aware that if you use the signIn or signOut 
  endpoints after this, you will break the sesssion you need to use the docs. </p>
</div>
<div id="swagger-ui-container" class="swagger-ui-wrap"></div>
<style>
.signIn {
    display: block;
    clear: none;
    float: right;  
}
  .signIn input {
    font-size: 0.9em;
    padding: 3px;
    margin: 0;    
  }
</style>

</body>
</html>
