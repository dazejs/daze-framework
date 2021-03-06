/**
 * Copyright (c) 2019 Chan Zewail <chanzewail@gmail.com>
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
const http = require('http');
const pathToRegExp = require('path-to-regexp');
const is = require('core-util-is');
const Container = require('../container');
const Middleware = require('../middleware');
const Response = require('../response');
const { parsePattern } = require('./helpers');

class Route {
  /**
   * Create Route
   * @param {String} uri route URI
   * @param {Array} methods route methods
   * @param {Controller | Function} controller controller
   * @param {String} action controller action
   * @param {Array} middlewares route middlewares
   */
  constructor(uri, methods = [], controller = null, action = '', middlewares = []) {
    this.app = Container.get('app');
    /**
     * @type {Array} keys route params keys
     */
    this.keys = [];

    /**
     * @type {String} uri URI
     */
    this.uri = uri;

    /**
     * @type {Array} methods upper case method name
     */
    this.methods = this.parseMethods(methods);

    /**
     * @type {RegExp} regexp path RegExp
     */
    this.regexp = pathToRegExp(uri, this.keys);

    /**
     * @type {Controller | Function} controller controller
     */
    this.controller = controller;

    /**
     * @type {String} action controller action name
     */
    this.action = action;

    /**
     * @type {Middleware} middleware Middleware instance
     */
    this.middleware = new Middleware();

    /**
     * patch HEAD method with GET method
     */
    if (this.methods.includes('GET') && !this.methods.includes('HEAD')) {
      this.methods.push('HEAD');
    }

    // this.registerDefaultMiddlewares();

    this.registerControllerMiddlewares(middlewares);
  }

  get pieces() {
    const pieces = pathToRegExp.parse(this.uri);
    const res = [];
    for (const piece of pieces) {
      if (piece && typeof piece === 'string') {
        res.push(...parsePattern(piece).map(p => ({
          key: p,
          type: 'static',
        })));
      }
      if (piece && typeof piece === 'object') {
        res.push({
          key: piece.pattern,
          type: 'reg',
        });
      }
    }
    return res;
  }

  // /**
  //  * register default route middlewares
  //  */
  // registerDefaultMiddlewares() {
  //   // this.middleware.register(LoadSessionMiddleware);
  //   // this.middleware.register(VerifyCsrfTokenMiddleware);
  // }

  /**
   * register route middleware
   * @param {Function} middleware
   */
  registerMiddleware(middleware, args) {
    if (middleware && is.isFunction(middleware)) {
      this.middleware.register(middleware, args);
    }
    return this;
  }

  addMethod(method) {
    const _method = method.toUpperCase();
    if (http.METHODS.includes(_method) && !this.methods.includes(_method)) {
      this.methods.push(_method);
    }
    return this;
  }


  parseMethods(methods = []) {
    const _methods = [];
    for (const method of methods) {
      const _method = method.toUpperCase();
      _methods.push(_method);
    }
    return [...new Set(_methods)];
  }

  /**
   * get route params
   * @param {String} path request path
   */
  getParams(path) {
    return path.match(this.regexp).slice(1);
  }

  /**
   * register Middlewares in Middleware instance
   */
  registerControllerMiddlewares(middlewares) {
    if (!Array.isArray(middlewares)) return this;
    for (const middleware of middlewares) {
      this.middleware.register(middleware);
    }
    return this;
  }

  /**
   * check the path is matched this route
   * @param {String} path request path
   */
  match(path) {
    return this.regexp.test(path);
  }

  async resolve(request) {
    const controller = this.app.get(this.controller, [request]);
    const routeParams = this.getParams(request.path);
    const res = await controller[this.action](...routeParams);
    if (res instanceof Response) return res;
    return (new Response()).setData(res);
  }
}

module.exports = Route;
