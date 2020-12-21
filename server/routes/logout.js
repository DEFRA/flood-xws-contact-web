module.exports = {
  method: 'GET',
  path: '/logout',
  handler: async (request, h) => {
    request.cookieAuth.clear()
    return h.redirect('/')
  },
  options: {
    auth: false
  }
}
