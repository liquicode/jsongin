# Playground

Try `jsongin` in your browser.

Choose a function, edit the boxes, and press **Run**.
Each of the function's parameters gets its own box, filled in with a working example.

<iframe
	id="playground-frame"
	src="playground/index.html?v=0.2.0"
	title="jsongin Playground"
	loading="lazy"
	style="width:100%; height:78vh; min-height:620px; border:1px solid var(--border-color,#d8dee4); border-radius:8px;"
></iframe>

<p>
	<a href="playground/index.html?v=0.2.0" target="_blank" rel="noopener noreferrer">Open the Playground in its own tab</a>
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

## The Version

The Playground runs the published `jsongin` named in its version box, loaded from
  [UNPKG](https://unpkg.com) as described in [Browser Usage](/guides/Usage-Browser.md), so it needs
  an internet connection.

