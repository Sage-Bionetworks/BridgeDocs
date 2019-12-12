var root = document.body.querySelector("script#bridge-shared-modules");
var ldg = document.createElement('div');
ldg.setAttribute('data-bridge-sm',true);
ldg.className="loading";
ldg.textContent = "Loading modules...";
root.parentNode.insertBefore(ldg, root);
function createCORSRequest(method, url) {
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {
    xhr.open(method, url, true);
  } else if (typeof XDomainRequest != "undefined") {
    xhr = new XDomainRequest();
    xhr.open(method, url);
  } else {
    xhr = null;
  }
  return xhr;
}
function displayItems(items) {
    if (items.length === 0) {
      var div = document.createElement("div");
      div.setAttribute('data-bridge-sm',true);

      var p = document.createElement("p");
      p.innerText = "There are no shared modules at this time.";
      root.parentNode.insertBefore(p, root);
    }
    items.forEach(function(item) {
      console.log(item);
      var div = document.createElement("div");
      div.setAttribute('data-bridge-sm',true);
      var hdr = document.createElement("h3");
      hdr.innerText = item.name;
      var body = document.createElement("section");
      body.innerHTML = (item.notes) ? item.notes : "<p class='no-notes'><em>No information available.</em></p>";
      div.appendChild(hdr);
      div.appendChild(body);
      root.parentNode.insertBefore(div, root);
    });
    root.parentNode.removeChild(ldg);
}
var url = 'https://ws.sagebridge.org/v3/sharedmodules/metadata?mostrecent=true&published=true&cb=' + new Date().getTime();
var request = createCORSRequest('GET', url);
if (request) {
  request.setRequestHeader('Content-Type', 'application/json');
  request.send();
  request.onreadystatechange = function() {
    if(request.readyState === 4 && request.status === 200) {
      // TODO: sort entries, then possibly reverse it given insertion order
      var object = JSON.parse(request.responseText);
      object.items.sort(function(a,b){return a.name.localeCompare(b.name);});
      displayItems(object.items);
    }
  };
}
