module.exports = function(parameters) {
  // Just an example.
  if (!parameters.address) {
    return {
      error: 'Address is missing.'
    }
  }

  return {}
};
