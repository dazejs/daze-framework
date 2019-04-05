const Route = require('./route');
const Collection = require('./collection');
const Container = require('../container');
const Meta = require('../foundation/support/meta');
const Dispatcher = require('./dispatcher');

class Router {
  /**
   * Create Router
   */
  constructor() {
    /**
     * @var {Application} app Application instance
     */
    this.app = Container.get('app');

    /**
     * @var {Collection} collection Router Collection instance
     */
    this.collection = new Collection();

    /**
     * @var {Controller[]} controllers controllers in container
     */
    this.controllers = this.getControllers();

    this.registerRoutes();
  }

  getRouterPipe() {
    return (request) => {
      const metchedRoute = this.collection.match(request);
      const dispatcher = new Dispatcher(metchedRoute);
      return dispatcher.resolve(request);
    };
  }

  registerRoutes() {
    for (const controller of this.controllers) {
      this.parseController(controller);
    }
  }

  /**
   * parse controller
   * @param {Controller} controller
   */
  parseController(controller) {
    const routes = Meta.get('routes', controller.prototype) || [];
    const prefix = Meta.get('prefix', controller.prototype) || '';
    const middlewares = Meta.get('middlewares', controller.prototype) || '';
    for (const route of routes) {
      this.register(`${prefix}${route.uri}`, [route.method], controller, route.action, middlewares);
    }
  }

  register(uri, methods, controller, action, middlewares) {
    const route = new Route(uri, methods, controller, action, middlewares);
    this.collection.add(route);
  }

  getControllers() {
    return this.app.tagged('controller');
  }
}

module.exports = Router;
