/*jslint indent: 2, newcap: true */
/*global window, document, Polymer*/
(function () {
  'use strict';
  var forEach, map, createRow;

  forEach = Function.prototype.call.bind(Array.prototype.forEach);
  map = Function.prototype.call.bind(Array.prototype.map);

  function getStyle(element, name) {
    return document.defaultView.getComputedStyle(element, null)
      .getPropertyValue(name);
  }

  function cloneGrid(grid) {
    return grid.map(function (row) {
      return row.slice(0);
    });
  }


  /**
   * Try to put an element into the grid.
   * Return a clone of the grid with the element if it is successful.
   * Return false otherwise.
   */
  function putElement(grid, x, y, rows, cols, count) {
    var col, row;

    if (x + cols > count) {
      return false;
    }
    grid = cloneGrid(grid);

    for (row = y; row < y + rows; row += 1) {
      if (grid[row] === undefined) {
        grid[row] = createRow();
      }
      for (col = x; col < x + cols; col += 1) {
        if (grid[row][col] === 1) {
          return false;
        }
        grid[row][col] = 1;
      }
    }
    return grid;
  }


  function packageElements(list, that) {
    var elements, grid;

    grid = [ createRow() ];
    elements = Array.prototype.slice.call(list, 0);
    /*
     * first fit decreasing:
     *
    elements.sort(function (a, b) {
      if (a.area > b.area) {
        return -1;
      }
      if (a.area < b.area) {
        return 1;
      }
      return 0;
    });
    */

    elements.forEach(function (item) {
      var y, x, result, len;

      for (y = 0; y < grid.length; y += 1) {
        for (x = 0; x < that.columns; x += 1) {
          if (grid[y][x] === 0) {
            // Try to insert the element in that position
            result = putElement(grid, x, y, item.rows, item.cols, that.columns);

            // It was inserted
            if (result !== false) {
              grid = result;
              item.item.left = (that.cellSize + that.gutterSize) * x;
              item.item.top = (that.cellSize + that.gutterSize) * y;
              return;
            }
          }
        }
      }
      len = grid.length;
      result = putElement(grid, 0, grid.length, item.rows, item.cols, that.columns);
      grid = result;
      item.item.top = (that.cellSize + that.gutterSize) * len;
      item.item.left = 0;
    });
  }

  function resizeContainer(element) {
    var width;

    element.style.width = 'auto';
    window.requestAnimationFrame(function () {

      width = parseInt(getStyle(element, 'width'), 10);
      element.columns = Math.floor(width / (element.cellSize + element.gutterSize));
      createRow = function () {
        return Array.apply(0, Array.call(0, element.columns))
          .map(function () {
            return 0;
          });
      };
      element.style.width = (element.columns * (element.cellSize + element.gutterSize) - element.gutterSize) + 'px';
      packageElements(element.elements, element);
    });
  }

  Polymer('bin-packing-grid', {
    cellSize : 100,
    gutterSize : 5,
    created : function () {
      this.elements = this.elements || [];
    },

    ready : function () {
      var items, that = this;

      items = this.getElementsByTagName('bin-packing-item');
      this.elements = map(items, function (item) {
        var cols, rows;

        cols = parseInt(item.cols, 10);
        rows = parseInt(item.rows, 10);

        return {
          area : cols * rows,
          cols : cols,
          rows : rows,
          item : item
        };
      });

      forEach(items, function (item) {
        var size = that.cellSize + that.gutterSize;

        item.style.width = (item.cols * size - that.gutterSize) + "px";
        item.style.height = (item.rows * size - that.gutterSize) + "px";
      });

      resizeContainer(that);
      window.addEventListener('resize', resizeContainer.bind(0, that));
    }
  });
}());
