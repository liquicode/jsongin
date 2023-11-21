# jsongin
[`@liquiode/jsongin`](https://github.com/liquicode/jsongin)


# Projection Reference


> MongoDB Reference: [Project Fields to Return from Query](https://www.mongodb.com/docs/manual/tutorial/project-fields-from-query-results/)


`jsongin` supports the MongoDB projection mechanic with the function `jsongin.Projection( Document, Projection )`.
This function will return a document that includes (or excludes) fields found in `Document`.
Specify fields in `Projection` and assign them a 0 to exclude or a 1 to include that field in the output.




