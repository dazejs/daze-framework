/**
 * Copyright (c) 2018 Chan Zewail
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

const TYPE = 'service';

function injectClass(elementDescriptor, name) {
  return {
    ...elementDescriptor,
    finisher(target) {
      Reflect.setMetadata('type', TYPE, target.prototype);
      Reflect.setMetadata(TYPE, name, target.prototype);
      return target;
    },
  };
}

function handle(elementDescriptor, name) {
  const { kind } = elementDescriptor;
  if (kind === 'class') {
    return injectClass(elementDescriptor, name);
  }
  return elementDescriptor;
}

module.exports = function Controller(name = '') {
  return elementDescriptor => handle(elementDescriptor, name);
};
