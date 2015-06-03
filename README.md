# &lt;bin-packing-grid&gt;

This is a Polymer element that fit elements into a grid using a bin-packing algorithm. The result is similar to the grid used on pinterest and other sites.

It will try to fit everything and leave no spaces, but in case there are gaps left, it will create **div** elements to fill them.

And just for the record, the size of the elements are never changed at all; the elements are only reordered.

Also, this element is responsive.

It uses Polymer 1.0 and it doesn't require jquery or any other library - no dependencies except Polymer itself.

## Algorithm

This uses a variation of the best-fit algorithm; it tries to fit each element and check the possible positions but it first gives priority to the one that keeps the height of the grid smaller.

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

## How it works

The `<bin-packing-grid>` creates a grid formed by squares, which each side has the measure of `cell-size` in pixels (default 100). Each one of those squares is separated by a gutter determined by `gutter-size` also in pixels (default 5).

The size of each `<bin-packing-item>` element is determined by the amount of `rows` (number of squares, plus gutter space, vertically) and `cols` (number of squares, plus gutter space, horizontally)

The `<bin-packing-item>` elements don't have colours, backgrounds, borders or any visual style by default. The only style properties added are the ones required to resize and positionate the element into the grid.
Is up to the developer to add any other desired style. By using the **transition** css property, is possible to animate the movement of elements.

To fill the gaps, `<div>` elements with the **bin-packing-filler** class will be created. Those elements are created into the shadow dom. You can target that element for styling with a rule like this:

```css
bin-packing-grid::shadow .bin-packing-filler {
  background-color: blue;
}
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
