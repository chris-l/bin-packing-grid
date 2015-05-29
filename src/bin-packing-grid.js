/*jslint indent: 2, newcap: true */
/*global window, document, Polymer*/
(function () {
  'use strict';
  var map, createRow, resizer;

  map = Function.prototype.call.bind(Array.prototype.map);


  /**
   * Return the style of an element.
   *
   * @param {object} element The element to check the style
   * @param {string} name The name of the style to check
   */
  function getStyle(element, name) {
    return document.defaultView.getComputedStyle(element, null)
      .getPropertyValue(name);
  }


  /**
   * Clone a grid. A grid is an array of arrays, and each element of those
   * arrays contains either a 1 or a 0.
   *
   * @param {array} grid The grid
   */
  function cloneGrid(grid) {
    return grid.map(function (row) {
      return row.slice(0);
    });
  }


  /**
   * Try to put an element into the grid.
   * Return a clone of the grid with the element if it is successful.
   * Return false otherwise.
   *
   * @param {array} grid The grid
   * @param {number} x The x offset
   * @param {number} y The y offset
   * @param {number} rows Number of rows the element has
   * @param {number} cols Number of columns the element has
   * @param {number} count Number of columns the grid has
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


  /**
   * Do the actual packaging of elements
   *
   * @param {array} list Array with the elements
   * @param {object} that The bin-packing-grid element
   */
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
      var y, x, result, len, matches = [], match, next;

      for (y = 0; y < grid.length; y += 1) {
        for (x = 0; x < that.columns; x += 1) {
          if (grid[y][x] === 0) {
            // Try to insert the element in that position
            result = putElement(grid, x, y, item.rows, item.cols, that.columns);

            // It was inserted
            if (result !== false) {
              // Next block of used space in this row.
              next = grid[y].indexOf(1, x);

              matches.push({
                grid : result,
                left : grid[y].slice(x, next),
                y : y,
                x : x
              });

              break;
            }
          }
        }
      }
      if (matches.length > 0) {
        matches.sort(function (a, b) {
          if (a.x > b.x) {
            return -1;
          }
          if (a.x < b.x) {
            return 1;
          }
          if (a.y < b.y) {
            return -1;
          }
          if (a.y > b.y) {
            return 1;
          }
          return 0;
        });
        match = matches.shift();
        item.item.setAttribute('top', match.y);
        item.item.setAttribute('left', match.x);
        grid = match.grid;
        return;
      }
      len = grid.length;
      result = putElement(grid, 0, grid.length, item.rows, item.cols, that.columns);
      grid = result;
      item.item.setAttribute('top', len);
      item.item.setAttribute('left', 0);
    });
  }

  /**
   * This is where the actual action begins.
   * Here the container is resized and the max number of columns is determined.
   * Then the function to package the elements is called.
   * @param {object} element The bin-packing-grid element.
   */
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

  Polymer({
    is : 'bin-packing-grid',

    properties: {
      cellSize : {
        type : Number,
        value : 100
      },
      gutterSize : {
        type : Number,
        value : 5
      }
    },

    created : function () {
      this.elements = this.elements || [];
    },

    init : function () {
      var items, that = this;

      items = Polymer.dom(this).querySelectorAll('bin-packing-item');
      this.elements = map(items, function (item) {
        var cols, rows;

        cols = parseInt(item.getAttribute('cols'), 10);
        rows = parseInt(item.getAttribute('rows'), 10);

        return {
          area : cols * rows,
          cols : cols,
          rows : rows,
          item : item
        };
      });

      if (resizer) {
        window.removeEventListener('resize', resizer);
      }
      resizer = resizeContainer.bind(0, that);
      window.addEventListener('resize', resizer);
      resizer();
    },

    ready : function () {
      this.init();
    }
  });
}());
