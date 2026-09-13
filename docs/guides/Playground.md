# Playground

Try `jsongin` in your browser, with any released version of the library.

Choose a version and a function, edit the boxes, and press **Run**.
Each of the function's parameters gets its own box, filled in with a working example.

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

## The Boxes

Each box is marked as ***JSON*** or ***text***.

- A JSON box is read with `JSON.parse`, so it cannot hold a date or a regular expression.
- A text box is passed to the function exactly as typed. This is what a path such as
  `user.name` needs, and what `Parse()` needs for its input.

A box marked optional can be left empty. It is then not passed at all, which is different from
  passing an empty value.

For functions which change the document in place, such as `SetValue()` and `DeleteValue()`, the
  document is also shown after the call.

A result of `false` or `null` is shown as a result. Only a thrown error is shown as an error.

## The Function List

The list shows only the functions the chosen version has, so older versions offer fewer.

Before version 0.0.19, the library exported a function which had to be called to get an engine.
From 0.0.19 on, it exports the engine itself. The Playground handles both.

## The Versions

The versions are loaded from [UNPKG](https://unpkg.com), as described in
  [Browser Usage](/guides/Usage-Browser.md), so the Playground needs an internet connection.

If you build the documentation from a copy of the source, the Playground also offers a
  **current build** entry, which runs your own unreleased copy. It only appears on your machine.
