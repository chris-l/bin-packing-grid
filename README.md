# &lt;bin-packing-grid&gt;

This is a custom element that fit elements into a grid using a bin-packing algorithm. The result is similar to the grid used on pinterest and other sites.

It will try to fit everything and leave no spaces, but in case there are gaps left, it will create **div** elements to fill them.

And just for the record, the size of the elements are never changed at all; the elements are only reordered.

Also, this element is responsive.

It is created using only vanilla js and it has no dependencies! (except, of course, the webcomponents.js polyfill)

## Demo

[Check it live!](http://chris-l.github.io/bin-packing-grid)

## Changelog

* 0.2.2
 - Fix: It was incorrectly using the rows instead of cols while checking for the wide elements.
* 0.2.1
 - New `detect-size` attribute. Using it, is not necessary to manually set the `rows` and `cols` and instead, it tries to automatically detect how many are necessary.
 - Added a simple border to each bin-packing-item, to make visible the elements if no custom css is added.
* 0.2.0
 - Removed Polymer as dependency. Now is a vanilla js component!
 - The dist file is vulcanized.
* 0.1.2
 - Now is possible to [create dynamically `<bin-packing-item>` elements](#dynamically-create-elements) and call the `reflow` method on the grid element to repackage and reorder the grid.
* 0.1.1
 - Bug fixes
* 0.1.0
 - First version

## Algorithm

This uses a variation of the best-fit algorithm; it tries to fit each element and check the possible positions but it first gives priority to the one that keeps the height of the grid smaller.

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
      <bin-packing-item detect-size><img src="someimage.jpg"></bin-packing-item>
      <bin-packing-item rows="2" cols="3">3x2</bin-packing-item>
    </bin-packing-grid>
    ```

## How it works

The `<bin-packing-grid>` creates a grid formed by squares, which each side has the measure of `cell-size` in pixels (default 100). Each one of those squares is separated by a gutter determined by `gutter-size` also in pixels (default 5).

The size of each `<bin-packing-item>` element is determined by the amount of `rows` (number of squares, plus gutter space, vertically) and `cols` (number of squares, plus gutter space, horizontally).

Instead of manually specifying `rows` and `cols`, is possible to add the `detect-size` attribute (with any or no value) to try to detect the required number of `rows` and `cols`.

The `<bin-packing-item>` elements don't have colours, backgrounds or any visual style by default (except a border to make it visible). The only style properties added are the ones required to set the size and positionate the element into the grid.
Is up to the developer to add any other desired style. By using the **transition** css property, is possible to animate the movement of elements.

To fill the gaps, `<div>` elements with the **bin-packing-filler** class will be created. Those elements are created into the shadow dom. You can target that element for styling with a rule like this:

```css
bin-packing-grid::shadow .bin-packing-filler {
  background-color: blue;
}
```

### Dynamically create elements

Just create a `<bin-packing-item>` element, attach it to the grid, and call `reflow`.

```javascript
var item, grid;

grid = document.getElementsByTagName('bin-packing-grid')[0];

item = document.createElement('bin-packing-item');
item.rows = 3;
item.cols = 3;
grid.appendChild(item);
grid.reflow();
```

## Options

### For &lt;bin-packing-grid&gt;:

Property     | Attribute     | Type        | Default      | Description
---          | ---           | ---         | ---          | ---
`cellSize`   | `cell-size`   | *number*    | `100`        | Size in pixels for each cell
`gutterSize` | `gutter-size` | *number*    | `5`          | Size in pixels for the space used to separate elements

### For &lt;bin-packing-item&gt;:

Property     | Attribute     | Type        | Default      | Description
---          | ---           | ---         | ---          | ---
`rows`       | `rows`        | *number*    | `1`          | Height of the item, using the cellSize of the &lt;bin-packing-grid&gt; parent as unit.
`cols`       | `cols`        | *number*    | `1`          | Width of the item, using the cellSize of the &lt;bin-packing-grid&gt; parent as unit.
`detectSize` | `detect-size` | *boolean*   | `false`      | Automatically set the `rows` and `cols` required for the content inside of the &lt;bin-packing-item&gt; element.

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

[MIT License](http://opensource.org/licenses/MIT)
