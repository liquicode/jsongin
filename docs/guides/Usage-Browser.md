# @liquicode/jsongin


# Browser Usage

`jsongin` has no dependencies, so one script tag is enough.
`dist/jsongin.min.js` holds the whole library.


## Load It from UNPKG

```html
<script
  type="text/javascript"
  src="https://unpkg.com/@liquicode/jsongin@latest/dist/jsongin.min.js"
></script>
```

To use a fixed version instead of the latest, put the version in the URL:

```html
<script
  type="text/javascript"
  src="https://unpkg.com/@liquicode/jsongin@0.1.0/dist/jsongin.min.js"
></script>
```


## Use It in a Page

The script creates two globals which refer to the same engine. Use either one.

```html
<script>
  var jsongin = window.liquicode.jsongin;

  // The same engine:
  var jsongin = window.jsongin;

  console.log( 'Loaded: ' + jsongin.Library.name + ', v' + jsongin.Library.version );
</script>
```

This engine has logging turned off.


## Create an Engine with Settings

To choose settings, call `NewJsongin( Settings )`, which is at `window.liquicode.NewJsongin`.

```html
<script>
  var jsongin = window.liquicode.NewJsongin( {
    OpLog: console.log,
    OpError: console.error,
  } );
</script>
```

See [OpLog](./OpLog.md).


## See Also

- [NodeJS Usage](./Usage-NodeJS.md)
- [Library Guide](./Library-Guide.md)
