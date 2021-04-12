var COMMENT_PARSER = /\/\*!?(?:\@preserve)?[ \t]*(?:\r\n|\n)([\s\S]*?)(?:\r\n|\n)[ \t]*\*\//;
function multiline(fn) {
  return COMMENT_PARSER.exec(fn.toString())[1];
};

// fetch doesn't work on Safari
var request = new XMLHttpRequest();
request.addEventListener("load", function (response) {
  var swagger = JSON.parse(response.target.responseText);
  window.definitions = processSwagger(swagger);
  init();
  loadModel();
});

var path = document.head.querySelector("meta[name='api.path']").getAttribute("content");

request.overrideMimeType("text/json; charset=utf-8");
request.open("GET", path);
request.send();

marked.setOptions({ gfm: true, tables: true });

var templateText = multiline(function () {/*
    <h2>
        Type: <span style='color:black'>{{{displayName}}}</span> 
        {{#discriminator}}<i>&laquo;Abstract&raquo;</i>{{/discriminator}}
        {{#if supertype}} <i>subtype of <a href="#{{supertype}}">{{supertype}}</a></i>{{/if}}
    </h2>
    {{#if showClassRelationships}}
        <div class="ui message">
            {{#if subclasses.length}}
                <p class="subclass">
                    To create a complete JSON payload, you will need to use one of these subtypes:
                    <ul style="margin-bottom:0">
                    {{#subclasses}}
                        <li><a href="{{link}}">{{name}}</a></li>
                    {{/subclasses}}
                    </ul>
                </p>
            {{/if}}
            {{#if uses.length}}
                <p class="subclass">Used in types: 
                    {{#uses}}
                        <a href="{{link}}">{{{displayName}}}</a>
                    {{/uses}}
                </p>
            {{/if}}
        </div>
    {{/if}}
    <p>{{{description}}}</p>
    {{#if properties}}
        <h2>Properties</h2>
        <dl class="properties">
            {{#inheritedProperties}}
                <dt>
                    <span>
                        <b>{{name}}</b> : 
                        {{#if type.title}}
                            <a href="{{type.link}}">{{type.title}}</a>
                        {{else}}
                            {{type}}
                        {{/if}}
                    </span>
                    <span>
                        {{#if required}}
                            <span class="ui tiny red label" style="opacity: .7"
                              data-tooltip="This value must be sent to the server on a create or update operation">REQUIRED</span>
                        {{/if}}
                        {{#if readOnly}}
                            <span class="ui tiny olive label" style="opacity: .7"
                              data-tooltip="This value cannot be updated on the server">READONLY</span>
                        {{/if}}
                        {{#if optional}}
                            <span class="ui tiny yellow label" style="opacity: .7"
                              data-tooltip="The server may not return a value for this field (it may be missing or null)" >OPTIONAL</span>
                        {{/if}}
                    </span>
                    <span class="ui tiny label">INHERITED</span>
                </dt>
                <dd>
                    {{#if default}}
                        <p style="color:#b22222">default value: {{default}}</p>
                    {{/if}}
                    {{#if enum}}
                        <div class="enumeration">
                            {{#enum}}<code>{{.}}</code><br>{{/enum}}
                        </div>
                    {{/if}}
                    {{{description}}}
                    {{#if example}}
                        <p>Example: <code>{{example}}</code></p>
                    {{/if}}
                </dd>
            {{/inheritedProperties}}
            {{#properties}}
                <dt>
                    <span>
                        <b>{{name}}</b> : 
                        {{#if type.title}}
                            <a href="{{type.link}}">{{type.title}}</a>
                        {{else}}
                            {{type}}
                        {{/if}}
                    </span>
                    <span>
                        {{#if required}}
                            <span class="ui tiny red label" style="opacity: .7"
                              data-tooltip="This value must be sent to the server on a create or update operation">REQUIRED</span>
                        {{/if}}
                        {{#if readOnly}}
                            <span class="ui tiny olive label" style="opacity: .7"
                              data-tooltip="This value cannot be updated on the server">READONLY</span>
                        {{/if}}
                        {{#if optional}}
                            <span class="ui tiny yellow label" style="opacity: .7"
                              data-tooltip="The server may not return a value for this field (it may be missing or null)" >OPTIONAL</span>
                        {{/if}}
                    </span>
                </dt>
                <dd>
                    {{#if default}}
                        <p style="color:#b22222">default value: {{default}}</p>
                    {{/if}}
                    {{#if enum}}
                        <div class="enumeration">
                            {{#enum}}<code>{{.}}</code><br>{{/enum}}
                        </div>
                    {{/if}}
                    {{{description}}}
                    {{#if example}}
                        <p>Example: <code>{{example}}</code></p>
                    {{/if}}
                </dd>
            {{/properties}}
        </dl>
    {{/if}}  
*/});
var nameContainer = document.querySelector("#model_nav");
var modelDetail = document.querySelector("#model_detail");
var currentItem, definitions;
var template = Handlebars.compile(templateText);

var getTypeLabel = function (key) {
  switch (key) {
    case 'boolean': return "Boolean";
    case 'string': return "String";
    case 'date-time': return "ISO 8601 date & time string";
    case 'date': return "ISO 8601 date string";
    case 'integer': return "Integer";
    default: return '';
  }
}

function getDefinition(definitions, $ref) {
  return definitions[$ref.split("/").pop()];
}
function processSwagger(swagger) {
  var defKeys = Object.keys(swagger.definitions);
  // pre-process definitions
  defKeys.forEach(function (propName) {
    var def = swagger.definitions[propName];
    def.title = propName;
    def.name = propName;
    def.link = "#" + propName;
  });
  // Proces definitions
  defKeys.forEach(function (propName) {
    var def = swagger.definitions[propName];
    processDefinition(swagger.definitions, propName, def);
  });
  // Post-process definitions, converting objects/sets into arrays for rendering 
  defKeys.forEach(function (propName) {
    var def = swagger.definitions[propName];
    // Object.values(def.properties);
    def.properties = Object.keys(def.properties).map(function (key) {
      return def.properties[key];
    });
    // Deduplicate arrays. Sets are not widely enough supported for this.
    if (def.uses) {
      def.uses = def.uses.filter(function (item, pos, self) {
        return self.indexOf(item) == pos;
      });
    }
    transferUsesFromSuperToSubType(swagger.definitions, def, propName);
    if (def.uses || def.subclasses) {
      def.showClassRelationships = true;
    }
  });
  return swagger.definitions;
}
function transferUsesFromSuperToSubType(definitions, def, propName) {
  if (def.supertype) {
    var aSuper = definitions[def.supertype];
    if (aSuper.uses) {
      def.uses = (def.uses || []).concat(aSuper.uses);
    }
    if (aSuper.properties) {
      Object.keys(aSuper.properties).forEach(function (keyName) {
        def.inheritedProperties.push(aSuper.properties[keyName]);
      });
    }
  }
}
function processDefinition(definitions, propName, def) {
  def.displayName = displayName(def);
  def.properties = def.properties || {};
  def.required = def.required || [];
  def.description = def.description || "";
  def.inheritedProperties = [];
  if (def.allOf) {
    processAllOf(definitions, def, def.allOf);
    delete def.allOf;
  }
  Object.keys(def.properties).forEach(function (propName) {
    processProperty(definitions, propName, def, def.properties[propName]);
  });
  // This is just so the key appears last; iteration in browser I test is consisent
  // with order of insertion.
  if (def.properties.type) {
    var type = def.properties.type;
    delete def.properties.type;
    def.properties.type = type;
  }
}
function processProperty(definitions, propName, def, property) {
  property.name = propName;
  property.definition = property.definition || "";
  property.optional = true
  for (propField in property) {
    switch (propField) {
      case 'x-nullable':
        property.optional = false; break;
      case 'enum':
        enumToConstant(property); break;
      case 'items':
        relabelArray(definitions, propName, def, property); break;
      case 'default':
        // necessary to do this so falsey defaults like 0 and false display in template.
        property.default = new String(property.default); break;
      case 'format':
      case 'type':
        relabelPropType(definitions, def, property); break;
      case '$ref':
        createSuperType(definitions, def, property); break;
      case 'description':
        property.description = marked(property.description); break;
    }
  }
  property.required = (def.required.indexOf(propName) > -1);
  if (property.required) {
    property.optional = false;
  }
  if (property.enum) {
    property.type = "Enumeration";
  }
  return property;
}
function enumToConstant(property) {
  if (property.enum.length === 1) {
    property.type = property.enum[0];
    delete property.enum;
  }
}
function relabelArray(definitions, propName, def, property) {
  var itemsProp = property.items;
  for (var itemsPropName in itemsProp) {
    switch (itemsPropName) {
      case '$ref':
        var arrayType = getDefinition(definitions, itemsProp.$ref);
        addUse(arrayType, def);
        property.link = arrayType.link;
        property.type = {
          title: arrayType.title + "[]",
          link: arrayType.link
        };
        break;
      case 'type':
        var label = getTypeLabel(itemsProp.type);
        if (label) {
          property.type = label + "[]";
        }
        break;
      case 'description':
        property[itemsPropName] = marked(itemsProp[itemsPropName]); break;
      default:
        if (itemsProp[itemsPropName]) {
          property[itemsPropName] = itemsProp[itemsPropName];
        }
    }
  }
  delete property.items;
}
function relabelPropType(definitions, def, property) {
  if (property.type === "object") {
    var ap = property.additionalProperties;
    if (ap) {
      if (ap.type) {
        if (ap.type === "array" && ap.items.type) {
          var label = getTypeLabel(ap.items.type);
          property.type = "Map<String," + label + "[]>";
        } else if (ap.type === "array" && ap.items.$ref) {
          var refType = getDefinition(definitions, ap.items.$ref);
          addUse(refType, def);
          property.type = {
            title: "Map<String," + refType.title + "[]>",
            link: refType.link
          };
        } else {
          var label = getTypeLabel(ap.type);
          property.type = "Map<String," + label + ">";
        }
      } else if (ap.$ref) {
        var refType = getDefinition(definitions, ap.$ref);
        addUse(refType, def);
        property.type = {
          title: "Map<String," + refType.title + ">",
          link: refType.link
        };
      }
    }
  }
  var label = getTypeLabel(property.format || property.type);
  if (label) {
    property.type = label;
    delete property.format;
  }
}
function addUse(parentDef, childDef) {
  if (parentDef && childDef) {
    parentDef.uses = parentDef.uses || [];
    parentDef.uses.push(childDef);
  } else {
    console.warn("missing parentDef or childDef", parentDef, childDef);
  }
}
function createSuperType(definitions, def, property) {
  var superType = getDefinition(definitions, property.$ref);
  addUse(superType, def);
  property.type = superType;
  delete property.$ref;
}
function processAllOf(definitions, def, array) {
  array.forEach(function (entryObj) {
    if (entryObj instanceof Array) {
      processAllOf(definitions, def, entryObj);
    } else {
      processAllOfEntry(definitions, def, entryObj);
    }
  });
}
function processAllOfEntry(definitions, def, entryObj) {
  for (var propName in entryObj) {
    switch (propName) {
      case 'properties':
        Object.assign(def.properties, entryObj.properties); break;
      case '$ref':
        var parentRef = getDefinition(definitions, entryObj.$ref);
        //processAllOfEntry(definitions, def, parentDef);
        def.supertype = parentRef.title;
        parentRef.subclasses = parentRef.subclasses || [];
        parentRef.subclasses.push(def);
        break;
      case 'required':
        copyRequired(def, entryObj.required); break;
      case 'example':
      case 'description':
      case 'type':
        copyPropIfMissing(def, entryObj, propName); break;
      // case 'name':
      // case 'displayName':
      // case 'title':
      // ignore for now, although this is information about parents 
    }
  }
}
function copyRequired(targetDef, required) {
  (required || []).forEach(function (required) {
    targetDef.required.push(required);
  });
}
function copyPropIfMissing(targetDef, source, propName) {
  if (!targetDef[propName]) {
    targetDef[propName] = source[propName];
  }
}
function init() {
  var modelNames = Object.keys(definitions);
  modelNames = modelNames.sort();

  var df = document.createDocumentFragment();
  modelNames.forEach(function (modelName) {
    var item = document.createElement("a");
    item.classList.add("item");
    item.id = "node-" + modelName;
    item.href = "#" + modelName;
    item.innerHTML = definitions[modelName].displayName;
    df.appendChild(item);
  });
  nameContainer.innerHTML = "";
  nameContainer.appendChild(df);
}

function displayName(def) {
  if (/List_/.test(def.name)) {
    var parts = def.name.split("_");
    return parts[0] + "&lt;" + parts[1] + "&gt;"
  }
  return def.name;
}
function renderDetail(defName) {
  modelDetail.innerHTML = "";
  var def = definitions[defName];
  def.description = marked(def.description);
  modelDetail.innerHTML = template(def);
}
function loadModel() {
  window.scrollTo(0, 0);
  var defName = document.location.hash.substring(1);
  var item = document.querySelector("#node-" + defName);
  if (item) {
    if (currentItem) {
      currentItem.classList.remove("active");
    }
    item.classList.add("active");
    renderDetail(defName);
    currentItem = item;
  }
}
window.addEventListener('hashchange', loadModel, false);
