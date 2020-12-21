const redirectToCountry = (h, query, region) => {
  const encodedQuery = encodeURIComponent(query)
  const url = `/england-only?query=${encodedQuery}&region=${region}`
  return h.redirect(url)
}

module.exports = {
  redirectToCountry
}
