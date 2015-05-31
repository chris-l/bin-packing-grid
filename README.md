# &lt;bin-packing-grid&gt;

Polymer element that fit elements into a grid using a bin-packing algorithm.

It will try to fill all the gaps, but in case there are gaps left, it will create div elements to fill them.

## Demo

[Check it live!](http://chris-l.github.io/bin-packing-grid)

## Install

Install the component using [Bower](http://bower.io/):

```sh
$ bower install bin-packing-grid --save
```

Or [download as ZIP](https://github.com/chris-l/bin-packing-grid/archive/master.zip).

## Usage

1. Import Web Components' polyfill:

    ```html
    <script src="bower_components/webcomponentsjs/webcomponents.min.js"></script>
    ```

2. Import the bin-packing-grid element:

    ```html
    <link rel="import" href="bower_components/bin-packing-grid/dist/bin-packing-grid.html">
    ```

3. Start using it!

    ```html
    <bin-packing-grid cell-size="150">
      <bin-packing-item rows="1" cols="2">2x1</bin-packing-item>
      <bin-packing-item rows="2" cols="1">1x2</bin-packing-item>
      <bin-packing-item rows="2" cols="3">3x2</bin-packing-item>
    </bin-packing-grid>
    ```

## Options

### For &lt;bin-packing-grid&gt;:

Attribute     | Options     | Default      | Description
---           | ---         | ---          | ---
`cellSize`    | *number*    | `100`        | Size in pixels for each cell
`gutterSize`  | *number*    | `5`          | Size in pixels for the space used to separate elements

### For &lt;bin-packing-item&gt;:

Attribute     | Options     | Default      | Description
---           | ---         | ---          | ---
`rows`        | *number*    | `1`          | Height of the item, using the cellSize of the &lt;bin-packing-grid&gt; parent as unit.
`cols`        | *number*    | `1`          | Width of the item, using the cellSize of the &lt;bin-packing-grid&gt; parent as unit.

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

[MIT License](http://opensource.org/licenses/MIT)
