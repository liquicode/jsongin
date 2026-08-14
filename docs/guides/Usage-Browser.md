# @liquicode/jsongin


# Browser Usage

`jsongin` has no dependencies, so browser use is a single script tag.
The `dist/jsongin.min.js` file is a UMD bundle of the entire library.


## Include jsongin using UNPKG

```html
<script
  type="text/javascript"
  src="https://unpkg.com/@liquicode/jsongin@latest/dist/jsongin.min.js"
></script>
```

To pin a version rather than tracking the latest, name it in the URL:

```html
<script
  type="text/javascript"
  src="https://unpkg.com/@liquicode/jsongin@0.1.0/dist/jsongin.min.js"
></script>
```


## Use jsongin in your Page

Loading the script defines two globals.
Both refer to the same library and you can use whichever you prefer.

```html
<script>
  // The library's own namespace:
  var jsongin = window.liquicode.jsongin;

  // Or the bundle's global, which is the same instance:
  var jsongin = window.jsongin;

  console.log( 'Loaded: ' + jsongin.Library.name + ', v' + jsongin.Library.version );
</script>
```

Both of these are ready-to-use instances with logging turned off.


## Create an Instance with Custom Settings

To configure the engine, use the `NewJsongin( Settings )` factory method.
In the browser it is found at `window.liquicode.NewJsongin`.

```html
<script>
  var jsongin = window.liquicode.NewJsongin( {
    OpLog: console.log,
    OpError: console.error,
  } );
</script>
```

> See the [OpLog](./OpLog.md) document for more information about how OpLog works.


## See Also

- [NodeJS Usage](./Usage-NodeJS.md)
- [Library Guide](./Library-Guide.md)
