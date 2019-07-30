---
title: Swagger Guidance
layout: article
---

The Swagger 2.0 specification leaves some behavior ambiguous. Here is how we use certain properties of the Swagger definition:

**required:** The caller is required to supply a property value when the model is submitted to the server. On an update, callers should return the value to the server even if it is unchanged (if not, it may be interpreted as a deletion of the property value).

**readOnly:** This value never needs to be provided by the caller or submitted back to the server (however, including it as part of the object is harmless, it will be ignored). System timestamps fall into this category.

**x-nullable:** When present, this is always set to false. This model property will never be null or missing when the model is returned from the server. This is a stronger promise than **required.** For example, most collection properties in Bridge will be set to empty objects or arrays in the JSON if no property is set, rather than being set to null or being excluded from the model JSON.