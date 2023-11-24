# jsongin
[`@liquicode/jsongin`](https://github.com/liquicode/jsongin)


# Project( Document, Projection )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |         o         | The document to project from.            |
| Projection    |         o         | The set of fields to include/exclude in the output. |


## Description

`jsongin` supports the MongoDB projection mechanic with the function `jsongin.Project( Document, Projection )`.
This function will return a document that includes (or excludes) fields found in `Document`.
Specify fields in `Projection` and assign them a 0 to exclude or a 1 to include that field in the output.


## See Also

- [`GetValue( Document, Path )`](./GetValue.md)
- [`SetValue( Document, Path, Value )`](./SetValue.md)
- MongoDB Reference: [Project Fields to Return from Query](https://www.mongodb.com/docs/manual/tutorial/project-fields-from-query-results/)


## Examples

```js
```

