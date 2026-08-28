# Playground

Try `jsongin` in the browser, against any released version of the library.

Pick a version, pick a command, edit the boxes, and press **Run**. Every parameter the
command takes gets its own labelled box, filled with a working example, so choosing a command
reshapes the form to match its signature.

<iframe
	id="playground-frame"
	src="playground/index.html"
	title="jsongin Playground"
	loading="lazy"
	style="width:100%; height:78vh; min-height:620px; border:1px solid var(--border-color,#d8dee4); border-radius:8px;"
></iframe>

<p>
	<a href="playground/index.html" target="_blank" rel="noopener noreferrer">Open the Playground in its own tab</a>
</p>

## What the boxes accept

Each box says whether it is read as **JSON** or as **text**.

A JSON box is read with `JSON.parse`, so a value JSON cannot express - a date, a regular
expression - cannot be typed into one. A text box is handed to the library verbatim, which is
what a path such as `user.name` wants, and what `Parse()` wants for its JSON source.

A box marked optional may be left empty, and is then not passed to the command at all - which
is not the same as passing it an empty value.

A command which returns a flag and does its work by changing the document in place, such as
`SetValue()` and `DeleteValue()`, also shows the document as it stands after the call.

A returned `false` or `null` is an answer rather than a failure, and is shown as a result.
Only a thrown error is shown as an error.

## Why the command list changes

The list is built from what the selected version actually exports, so a version is never
offered a command it does not have.

`Query()` is there for every version back to 0.0.1, which offers four commands in all.
`Aggregate()`, `Evaluate()`, `Diff()`, `Invert()`, `DeleteValue()` and `CompareValues()`
arrived with the current release, and picking an older version drops them from the list.

The shape of the library's own export changed at 0.0.19: before it, the bundle exports a
factory which has to be called to get an engine, and from it the export is the engine itself.
The page handles both, which is what lets it reach all the way back.

## Where the versions come from

Every version in the list is fetched from [UNPKG](https://unpkg.com), the same way the
[Browser Usage](/guides/Usage-Browser.md) guide describes, so the page needs a network
connection. Only released versions are ever offered here.

A working copy of the repository gets one more entry. Building the documentation packs the
current source and leaves the bundle beside this page, and the page offers a **current build**
entry when it finds that file. The bundle is not kept in source control and is not published,
so the entry exists only where somebody built it - which is what lets an unreleased change be
tried here without that build reaching anybody else.
