module.exports = {
  method: 'GET',
  path: '/signout',
  handler: async (request, h) => {
    request.cookieAuth.clear()
    return h.redirect('/')
  },
  options: {
    auth: false
  }
}
