function generateSlug() {
  return 'gt-' + Math.random().toString(36).slice(2, 11);
}

module.exports = { generateSlug };
