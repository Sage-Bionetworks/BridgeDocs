## Assessment configuration

The assessment configuration is represented through a tree of `AssessmentNode` objects. The nodes provide support for both strict typing, and a more dynamic declaration of type information by assessment designers. The systems work together to provide flexibility in configuration development, while providing certain benefits, like the validation of configuration syntax.

Configuration can be loaded and updated separately from the metadata that describes an assessment, through a separate set of APIs. Client apps will generally only be concerned with the assessment configuration, while study designers may only work with what can be customized in the configuration through the customization API.

### Strict type system

The [AssessmentNode](/model-browser.html#AssessmentNode) is the root type of a type hierarchy that captures some common building blocks of app assessments. This base node includes basic information for UIs that may or may not be used depending on the position of the node in the tree. The meaning of a field like `label` or `prompt` thus depends on the position and type of the node in the tree.

Subtypes of this node capture further information for common configuration items like questions, forms, surveys, and sections. Here is the currently proposed class hierarchy of sub-types which will replace Bridge’s existing "task identifier" and `Survey` model:

[![Assessment type hierarchy  ](/images/AssessmentTypeHierarchy.svg)](/images/AssessmentTypeHierarchy.svg)

Strictly typed nodes can capture more specific configuration information, and the server can validate the configuration (e.g. a survey node can only contain form or section child nodes; a form can only contain input types; a date control cannot set the latest allowable date to a date before the earliest allowable date).

### Dynamic type system

In addition, the assessment configurations provide for some dynamic typing through three mechanisms:

1. Any node can declare an arbitrary type for the node’s `type` field (the strict type of the node will still be available from the node’s `baseType` property);
2. Each node has a metadata dictionary of String key/value entries that can record additional properties for the node;
3. While nodes by default have a `children` array of child nodes, a configuration node can have multiple named sets of children. If the JSON submitted to the server includes multiple properties with arrays of `AssessmentNode` objects, these will be persisted and returned separately (instead of one `children` array).

Assessment developers can use these configuration features to define new kinds of nodes. If these configurations fall into common use, Bridge may later incorporate them into the strict typing system.

For example, Mary wishes to create a container node that indicates two processes should be run currently—one UI thread will always be a user interface of some sort, and a second thread will be a passive instrument running to measure the participant's performance. She decides to cue her app with the introduction of a “Parallel” node type, that has two child configuration nodes: a “ui” node and an “instrument” node. 
Here is one of several ways that this configuration could be represented in JSON:

```json
{
   "title": "An assessment",
   "guid": "4ppcTG3aWyXY_6LpOOTM_lnS",
   "type": "AssessmentNode",
   "async": [
      {
         "title": "Async child node",
         "guid": "qatz-xkLVi66FHeXBXVu_l4Z",
         "metadata": {
           "update_interval": "1.0 / 60.0"
         },
         "type": "Accelerometer",
         "baseType": "AssessmentNode"
      }
   ],
   "ui": [
      {
         "title": "UI child node",
         "guid": "L4FADTt5zzCKdslKPu86TYiX",
         "type": "AssessmentNode"
      },
      {
         "title":"Second UI child node",
         "guid":"v4KIUJNt9GEENrKXHimLDBxi",
         "type":"AssessmentNode"
      }
   ]
}
```

### Rules

Here is a contrived rule. As configured, it is a type of navigation rule, that should be evaluated before the node is processed (displayed to user, executed), that performs the instruction "quitSurvey" if the title of the node itself is either "Quit Me Now" or "Stop Now":

```json
{
    "category":"navigation",
    "evalPhase":"before",
    "instruction":"quitSurvey",
    "predicate":{
      "type":"OrPredicate",
      "predicates":[
          {
            "type":"Statement",
            "target":"title",
            "operator":"eq",
            "expectedValues":["Quit Me Now"]
          },
          {
            "type":"Statement",
            "target":"title",
            "operator":"eq",
            "expectedValues":["Stop Now"]
          }
      ]
    }
}
```

Again, the meaning of the category, evaluation phase, and instruction are open to interpretation by client software and are not currently constrained by the Bridge server. Only the predicates for evaluating the rule are constrained. [TODO: We know there are some existing instructions on the client, document these.]