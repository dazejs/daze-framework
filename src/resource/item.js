/**
 * Copyright (c) 2018 zewail
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

const Resource = require('./resource');

class Item extends Resource {
  constructor(data, formatter = null, key = null) {
    super(data, formatter, key);
    this.type = 'item';
  }
}

module.exports = Item;
