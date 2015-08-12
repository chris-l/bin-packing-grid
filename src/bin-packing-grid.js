/*jslint indent: 2, regexp: true, nomen: true */
/*global window, document, HTMLElement, setInterval, clearInterval, setTimeout*/
(function () {
  'use strict';
  var forEach, map, createRow, resizer, gridPrototype, itemPrototype,
    gridProperties, itemProperties, declaredProps, addShadowRoot;

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
  addShadowRoot = (function () {
    var importDoc, shimStyle;

    importDoc = (document._currentScript || document.currentScript).ownerDocument;

    if (window.ShadowDOMPolyfill) {
      shimStyle = document.createElement('style');
      document.head.insertBefore(shimStyle, document.head.firstChild);
    }

    return function (obj, idTemplate, tagName) {
      var template, list;

      obj.root = obj.createShadowRoot();
      template = importDoc.getElementById(idTemplate);
      obj.root.appendChild(template.content.cloneNode(true));

      if (window.ShadowDOMPolyfill) {
        list = obj.root.getElementsByTagName('style');
        Array.prototype.forEach.call(list, function (style) {
          var name = tagName || idTemplate;
          if (!template.shimmed) {
            shimStyle.innerHTML += style.innerHTML
              .replace(/:host\(([^\)]+)\)/gm, name + '$1')
              .replace(/:host\b/gm, name)
              .replace(/::shadow\b/gm, ' ')
              .replace(/::content\b/gm, ' ');
          }
          style.parentNode.removeChild(style);
        });
        template.shimmed = true;
      }
    };
  }());



  /**
   * Uses Object.defineProperty to add setters and getters
   * to each property of the element.
   *
   * Each property is reflected to the equivalent DOM attribute
   * @param {object} obj The element to add the shadow root.
   * @param {object} props Object with the properties.
   */
  declaredProps = (function () {
    var exports = {};

    function parse(val, type) {
      switch (type) {
      case Number:
        return parseFloat(val || 0, 10);
      case Boolean:
        return val !== null;
      case Object:
      case Array:
        return JSON.parse(val);
      case Date:
        return new Date(val);
      default:
        return val || '';
      }
    }
    function toHyphens(str) {
      return str.replace(/([A-Z])/g, '-$1').toLowerCase();
    }
    function toCamelCase(str) {
      return str.split('-')
        .map(function (x, i) {
          return i === 0 ? x : x[0].toUpperCase() + x.slice(1);
        }).join('');
    }
    exports.serialize = function (val) {
      if (typeof val === 'string') {
        return val;
      }
      if (typeof val === 'number' || val instanceof Date) {
        return val.toString();
      }
      return JSON.stringify(val);
    };

    exports.syncProperty = function (obj, props, attr, val) {
      var name = toCamelCase(attr), type;
      if (props[name]) {
        type = props[name].type || props[name];
        obj[name] = parse(val, type);
      }
    };

    exports.init = function (obj, props) {
      Object.defineProperty(obj, 'props', {
        enumerable : false,
        configurable : true,
        value : {}
      });

      Object.keys(props).forEach(function (name) {
        var attrName = toHyphens(name), desc, value;

        desc = props[name].type ? props[name] : { type : props[name] };
        value = typeof desc.value === 'function' ? desc.value() : desc.value;
        obj.props[name] = obj[name] || value;

        if (obj.getAttribute(attrName) === null) {
          if (desc.reflectToAttribute) {
            obj.setAttribute(attrName, exports.serialize(obj.props[name]));
          }
        } else {
          obj.props[name] = parse(obj.getAttribute(attrName), desc.type);
        }
        Object.defineProperty(obj, name, {
          get : function () {
            return obj.props[name] || parse(obj.getAttribute(attrName), desc.type);
          },
          set : function (val) {
            var old = obj.props[name];
            obj.props[name] = val;
            if (desc.reflectToAttribute) {
              if (desc.type === Boolean) {
                if (val) {
                  obj.setAttribute(attrName, '');
                } else {
                  obj.removeAttribute(attrName);
                }
              } else {
                obj.setAttribute(attrName, exports.serialize(val));
              }
            }
            if (typeof obj[desc.observer] === 'function') {
              obj[desc.observer](val, old);
            }
          }
        });
      });
    };

    return exports;
  }());


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
    var width;

    element.style.width = 'auto';

    setTimeout(function () {
      width = element.clientWidth;

      element.columns = (function () {
        var cols, widest;

        cols = Math.floor(width / (element.cellSize + element.gutterSize));
        widest = element.elements.slice(0).sort(function (a, b) {
          return a.cols > b.cols;
        }).pop().cols;
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
    }, 0);
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
   * Reflow the grid.
   * Call this function if you dinamically add <bin-packing-item> elements
   * to the grid.
   */
  gridPrototype.reflow = function () {
    this.createElementList();
    resizer();
  };


  /**
   * (Re)create the "elements" property.
   */
  gridPrototype.createElementList = function () {
    var items, that = this, elements;

    items = this.querySelectorAll('bin-packing-item');
    forEach(items, function (item) {
      item.gutterSize = that.gutterSize;
      item.baseSize = that.cellSize + that.gutterSize;
    });
    elements = map(items, function (item) {
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

    // filter out hidden elements.
    this.elements = elements.filter(function (element) {
      return element.item.getAttribute('hidden') === null;
    });
  };

  gridPrototype.createdCallback = function () {
    addShadowRoot(this, 'bin-packing-grid');
    declaredProps.init(this, gridProperties);
    this.elements = this.elements || [];
    this.createElementList();
    if (!resizer) {
      resizer = resizeContainer.bind(0, this);
      window.addEventListener('resize', resizer);
    }
    resizer();
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
    detectSize : {
      type : Boolean,
      observer : 'detectSizeLoop',
      value : false
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

  itemPrototype.detectSizeLoop = function (start) {
    var div, parent, inter;
    div = this.root.querySelector('div');
    parent = this.parentNode;
    if (start !== false && parent !== null) {
      inter = setInterval(function () {
        if (!this.detectSize) {
          clearInterval(inter);
          return;
        }
        if (div !== null && (this.prevClientWidth !== div.clientWidth ||
          this.prevClientHeight !== div.clientHeight)) {
          this.style.width = 'auto';
          this.cols = Math.ceil(this.clientWidth / this.baseSize);
          this.style.height = 'auto';
          this.rows = Math.ceil(this.clientHeight / this.baseSize);
          this.prevClientWidth = div.clientWidth;
          this.prevClientHeight = div.clientHeight;
          parent.createElementList();
          packageElements(parent.elements, parent);
        }
      }.bind(this), 1);
    }
  };

  /*jslint unparam: true*/
  itemPrototype.attributeChangedCallback = function (attr, oldVal, newVal) {
    declaredProps.syncProperty(this, itemProperties, attr, newVal);
  };
  /*jslint unparam: false*/

  itemPrototype.createdCallback = function () {
    var parent, interval, that;

    addShadowRoot(this, 'bin-packing-item');
    declaredProps.init(this, itemProperties);
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
      if (that.detectSize) {
        that.detectSizeLoop(true);
      }
    }, 1);
  };

  document.registerElement('bin-packing-item', {
    prototype : itemPrototype
  });

}());
