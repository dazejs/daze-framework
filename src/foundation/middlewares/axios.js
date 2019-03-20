
const axios = require('axios')
const Middleware = require('../../base/middleware')

/**
 * @see https://github.com/axios/axios
 */
class Axios extends Middleware {
  factory(ax) {
    return ax
  }

  handle(ctx) {
    ctx.$http = ctx.axios = this.factory(axios)
    return ctx
  }
}

module.exports = Axios
