const APlus = require("../src/index");

const adapter = {
  deferred() {
    let reject, resolve;
    const promise = new APlus((res, rej) => {
      reject = rej;
      resolve = res;
    });
    return {
      promise,
      resolve,
      reject,
    };
  },
  resolved: (val) => new APlus((res) => res(val)),
  rejected: (val) => new APlus((_, rej) => rej(val)),
};

module.exports = adapter;
