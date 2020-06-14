const APlus = require("../src/index");

const adapter = {
  deferred() {
    let reject, resolve;
    return {
      promise: new APlus((res, rej) => {
        reject = rej;
        resolve = res;
      }),
      resolve,
      reject,
    };
  },
  resolved: (val) => new APlus((res) => res(val)),
  rejected: (val) => new APlus((_, rej) => rej(val)),
};

module.exports = adapter;
