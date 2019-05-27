const path = require('path');
const glob = require('glob');
const is = require('core-util-is');
const Container = require('../container');
const { patchModule } = require('./helpers');
const { isModule, getModuleMiddlewares } = require('./helpers');
const { getMiddlewares, setMiddlewares } = require('../middleware/helpers');

/**
 * {
 *  controller: {}
 *  middlewares: []
 * }
 */
class Module {
  /**
   * Create Module
   */
  constructor() {
    this.app = Container.get('app');

    this.loadModules();
  }

  /**
   * load application modules
   */
  loadModules() {
    for (const mdl of this.app.modules) {
      this.register(mdl);
    }
  }

  /**
   * register a module
   * @param {STring | Class} mdl
   */
  register(mdl) {
    if (is.isString(mdl)) {
      this.parseStringModule(mdl);
    } else if (is.isFunction(mdl)) {
      this.parseFunctionModule(mdl);
    }
  }

  /**
   * parse module if typeof string
   * @param {String} mdl
   */
  parseStringModule(mdl) {
    const modulePath = require.resolve(path.join(this.app.appPath, mdl));
    // eslint-disable-next-line global-require, import/no-dynamic-require
    this.parseFunctionModule(require(modulePath));
  }

  /**
   * parse module if typeof function
   * @param {Function} mdl
   */
  parseFunctionModule(M) {
    // 使用了 @module 装饰器
    if (isModule(M.prototype)) {
      this.loadModuleProperties(M);
      return this;
    }
    throw new TypeError('unsupport module');
  }

  /**
   * load module Props
   * @param {Object} ModuleInstance module instance
   */
  loadModuleProperties(Mod) {
    const middlewares = getModuleMiddlewares(Mod.prototype);
    const ModuleInstance = new Mod();
    this.parsePropertyControllers(ModuleInstance, middlewares);
    this.parsePropertyModules(ModuleInstance);
  }

  /**
   * Load all sub-modules
   * @param {object} ModuleInstance
   */
  parsePropertyModules(ModuleInstance) {
    const propertyModules = this.getModuleModules(ModuleInstance);
    for (const Mod of propertyModules) {
      if (isModule(Mod.prototype)) {
        this.loadModuleProperties(Mod);
      }
    }
  }

  /**
   * get module controllers use glob
   * @param {Object} module instance
   * @param {Array} middlewares module middlewares
   */
  parsePropertyControllers(ModuleInstance, middlewares) {
    const controllersProp = ModuleInstance.controllers || [];
    if (!Array.isArray(controllersProp)) throw new Error('Module s controller prop must be an Array!');
    for (const controllerProp of controllersProp) {
      // 如果是字符串，标识路径
      if (typeof controllerProp === 'string') {
        const klawControllers = glob.sync(path.resolve(this.app.controllerPath, controllerProp), {
          nodir: true,
        });
        for (const controller of klawControllers) {
          // eslint-disable-next-line global-require, import/no-dynamic-require
          const Ctrl = require(controller);
          const metaMiddlewares = getMiddlewares(Ctrl.prototype);
          setMiddlewares(Ctrl.prototype, [...middlewares, ...metaMiddlewares]);
          this.app.get('controller').register(Ctrl);
        }
      } else {
        const metaMiddlewares = getMiddlewares(controllersProp.prototype);
        setMiddlewares(controllerProp.prototype, [...middlewares, ...metaMiddlewares]);
        this.app.get('controller').register(controllerProp);
      }
    }
  }

  /**
   * get module subModules
   * @param {Object} ModuleInstance module instance
   */
  getModuleModules(ModuleInstance) {
    const modulesProp = ModuleInstance.modules || [];
    if (!Array.isArray(modulesProp)) throw new Error('Module s modules prop must be an Array!');
    let modules = [];
    for (const moduleProp of modulesProp) {
      // 如果是字符串，标识路径
      if (typeof moduleProp === 'string') {
        const klawModules = glob.sync(path.resolve(this.app.appPath, moduleProp), {
          nodir: true,
        });
        modules = modules.concat(klawModules.map((m) => {
          // eslint-disable-next-line global-require, import/no-dynamic-require
          const Mod2 = require(m);
          return patchModule(Mod2, ModuleInstance);
        }));
      } else {
        modules.push(patchModule(moduleProp, ModuleInstance));
      }
    }
    return modules;
  }
}


module.exports = Module;
