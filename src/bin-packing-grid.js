/*jslint indent: 2, regexp: true, nomen: true */
/*global window, document, HTMLElement, setInterval, clearInterval*/
(function () {
  'use strict';
  var forEach, map, createRow, resizer, importDoc, gridPrototype,
    itemPrototype, gridProperties, itemProperties;

  importDoc = (document._currentScript || document.currentScript).ownerDocument;
  map = Function.prototype.call.bind(Array.prototype.map);
  forEach = Function.prototype.call.bind(Array.prototype.forEach);


  /**
   * Create and add the shadow root to obj.root
   * If necessary, it will rewrite the style and add it to the document head
   *
   * @param {object} obj The element to add the shadow root.
   * @param {string} idTemplate The id of the template element.
   * @param {string} [elementName] The name element, used for rewriting the css.
   *                 If omited, it will use the idTemplate as name.
   */
  function addShadowRoot(obj, idTemplate, elementName) {
    var template, styleStr, newStyle, hasStyle, dummy;

    obj.root = obj.createShadowRoot();
    template = importDoc.querySelector('#' + idTemplate);
    obj.root.appendChild(template.content.cloneNode(true));

    hasStyle = /<style(.|\n)*<\/style>/m;
    if (window.ShadowDOMPolyfill && hasStyle.test(template.innerHTML)) {
      dummy = document.createElement('head');
      dummy.innerHTML = template.innerHTML;
      styleStr = map(dummy.getElementsByTagName('style'), function (style) {
        return style.innerHTML
          .replace(/:host/gm, elementName || idTemplate).replace(/::content/gm, '')
          .trim();
      }).join("\n");
      dummy = null;

      newStyle = document.createElement('style');
      newStyle.innerHTML = styleStr;
      document.getElementsByTagName('head')[0].appendChild(newStyle);
    }
  }



  /**
   * Uses Object.defineProperty to add setters and getters
   * to each property of the element.
   *
   * Each property is reflected to the equivalent DOM attribute
   * @param {object} obj The element to add the shadow root.
   * @param {object} props Object with the properties.
   */
  function prepareProperties(obj, props) {
    function toHyphens(str) {
      return str.replace(/([A-Z])/g, '-$1').toLowerCase();
    }
    function convert(val, desc) {
      if (desc.type === Number) {
        return parseInt(val, 10);
      }
      if (desc.type === String) {
        return String(val);
      }
      return val;
    }
    obj.props = {};

    Object.keys(props).forEach(function (name) {
      var attrName, desc, value;

      desc = props[name];
      attrName = toHyphens(name);
      value = desc.value;
      if (typeof value === 'function') {
        value = value();
      }

      if (obj.getAttribute(attrName) === null) {
        obj.setAttribute(attrName, obj.props[name] || value);
      }
      Object.defineProperty(obj, name, {
        get : function () {
          return convert(obj.getAttribute(attrName), desc) || obj.props[name] || value;
        },
        set : function (val) {
          obj.props[name] = val;
          obj.setAttribute(attrName, val);
          if (typeof obj[desc.observer] === 'function') {
            obj[desc.observer]();
          }
        }
      });
    });
  }


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
   * Return the style of an element.
   *
   * @param {array} grid The grid
   * @param {object} that The bin-packing-grid element
   */
  function addFiller(grid, that) {

    function createFiller(y, x) {
      var element = document.createElement('div');
      that.root.appendChild(element);
      element.style.width = that.cellSize + 'px';
      element.style.height = that.cellSize + 'px';
      element.style.top = ((that.cellSize + that.gutterSize) * y) + 'px';
      element.style.left = ((that.cellSize + that.gutterSize) * x) + 'px';
      element.className = 'bin-packing-filler';
    }

    // Remove any filler elements
    forEach(that.root.querySelectorAll('.bin-packing-filler'), function (item) {
      that.root.removeChild(item);
    });


    var y, x, clone;
    clone = cloneGrid(grid);
    clone.reverse();

    for (y = 0; y < clone.length; y += 1) {
      for (x = 0; x < that.columns; x += 1) {
        if (clone[y][x] === 0) {
          if (y === 0) {
            clone[y][x] = false;
          } else if (clone[y - 1][x] === false) {
            clone[y][x] = false;
          } else {
            createFiller(grid.length - y - 1, x);
          }
        }
      }
    }
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
          if (a.grid.length < b.grid.length) {
            return -1;
          }
          if (a.grid.length > b.grid.length) {
            return 1;
          }
          if (a.y < b.y) {
            return -1;
          }
          if (a.y > b.y) {
            return 1;
          }
          if (a.x > b.x) {
            return -1;
          }
          if (a.x < b.x) {
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
      if (result === false) {
        throw new Error('The element does not fit!');
      }
      grid = result;
      item.item.setAttribute('top', len);
      item.item.setAttribute('left', 0);
    });
    addFiller(grid, that);

    // Set the height of the grid.
    that.style.height = (grid.length * (that.cellSize + that.gutterSize)) + 'px';
  }

  /**
   * This is where the actual action begins.
   * Here the container is resized and the max number of columns is determined.
   * Then the function to package the elements is called.
   * @param {object} element The bin-packing-grid element.
   */
  function resizeContainer(element) {
    var width, inter;

    element.style.width = 'auto';
    inter = setInterval(function () {

      width = parseInt(getStyle(element, 'width'), 10);

      if (isNaN(width)) {
        return;
      }
      clearInterval(inter);

      element.columns = (function () {
        var cols, widest;

        cols = Math.floor(width / (element.cellSize + element.gutterSize));
        widest = element.elements.slice(0).sort(function (a, b) {
          return a.rows > b.rows;
        }).pop().rows;
        // The minimal width of the grid is the width of the widest element.
        return cols < widest ? widest : cols;
      }());

      createRow = function () {
        return Array.apply(0, Array.call(0, element.columns))
          .map(function () {
            return 0;
          });
      };
      element.style.width = (element.columns * (element.cellSize + element.gutterSize) - element.gutterSize) + 'px';
      packageElements(element.elements, element);
    }, 1);
  }

  /**
   * bin-packing-grid
   */
  gridPrototype = Object.create(HTMLElement.prototype);

  gridProperties = {
    cellSize : {
      type : Number,
      value : 100
    },
    gutterSize : {
      type : Number,
      value : 5
    }
  };

  /**
   * Reflow the grid. (Re)create the "elements" property and resize it.
   * Call this function if you dinamically add <bin-packing-item> elements
   * to the grid.
   */
  gridPrototype.reflow = function () {
    var items, that = this;

    items = this.querySelectorAll('bin-packing-item');
    forEach(items, function (item) {
      item.gutterSize = that.gutterSize;
      item.baseSize = that.cellSize + that.gutterSize;
    });
    this.elements = map(items, function (item) {
      var cols, rows;

      cols = typeof item.cols === 'number' ? item.cols :
          parseInt(item.getAttribute('cols'), 10) || 0;
      rows = typeof item.rows === 'number' ? item.rows :
          parseInt(item.getAttribute('rows'), 10) || 0;

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
  };

  gridPrototype.createdCallback = function () {
    addShadowRoot(this, 'bin-packing-grid');
    prepareProperties(this, gridProperties);
    this.elements = this.elements || [];
    this.reflow();
  };

  document.registerElement('bin-packing-grid', {
    prototype : gridPrototype
  });

  /**
   * bin-packing-item
   */
  itemPrototype = Object.create(HTMLElement.prototype);

  itemProperties = {
    top : {
      type : Number,
      observer : 'change',
      value : 0
    },
    left : {
      type : Number,
      observer : 'change',
      value : 0
    },
    cols : {
      type : Number,
      observer : 'change',
      value : 1
    },
    rows : {
      type : Number,
      observer : 'change',
      value : 1
    },
    baseSize : {
      type : Number,
      observer : 'change',
      value : 0
    },
    gutterSize : {
      type : Number,
      observer : 'change',
      value : 0
    }
  };

  itemPrototype.change = function () {
    this.style.top = (this.baseSize * this.top) + 'px';
    this.style.left = (this.baseSize * this.left) + 'px';
    this.style.width = (this.cols * this.baseSize - this.gutterSize) + "px";
    this.style.height = (this.rows * this.baseSize - this.gutterSize) + "px";
  };

  /*jslint unparam:true*/
  itemPrototype.attributeChangedCallback = (function () {
    function toCamelCase(str) {
      var parts, head;

      parts = str.split('-');
      head = parts.shift();

      parts = parts.map(function (x) {
        return x[0].toUpperCase() + x.slice(1);
      }).join('');

      return head + parts;
    }
    return function (attr, oldVal, newVal) {
      if (itemProperties[attr]) {
        this[toCamelCase(attr)] = newVal;
      }
    };
  }());
  /*jslint unparam:false*/

  itemPrototype.createdCallback = function () {
    var parent, interval, that;

    prepareProperties(this, itemProperties);
    that = this;
    parent = this.parentNode;
    if (parent === null) {
      return;
    }
    interval = setInterval(function () {
      if (!parent.cellSize) {
        return;
      }
      clearInterval(interval);
      that.gutterSize = parent.gutterSize;
      that.baseSize = parent.cellSize + parent.gutterSize;
    }, 1);
  };

  document.registerElement('bin-packing-item', {
    prototype : itemPrototype
  });

}());
