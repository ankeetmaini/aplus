const isPromise = (value) => {
  if (value) {
    if (typeof value.then === "function") return true;
  }
};

const isFunction = (fn) => typeof fn === "function";

const STATUS = {
  pending: 0,
  fulfilled: 1,
  rejected: 2,
};

function APlus(fn) {
  let status = STATUS.pending;
  let value;

  let handlers = [];

  // low level state management
  const fulfill = (result) => {
    status = STATUS.fulfilled;
    value = result;
    handlers.forEach((h) => h.onFulfill(value));
    handlers = null;
  };

  const reject = (err) => {
    status = STATUS.rejected;
    value = err;
    handlers.forEach((h) => h.onReject(value));
    handlers = null;
  };

  const innerResolve = (fn) => {
    let called = false;
    try {
      fn(
        // resolve
        (result) => {
          if (called) return;
          called = true;
          if (isPromise(result)) {
            innerResolve(result);
            return;
          }
          fulfill(result);
        },
        // reject
        (error) => {
          if (called) return;
          called = true;
          reject(error);
        }
      );
    } catch (error) {
      if (called) return;
      called = true;
      reject(error);
    }
  };

  const handle = (onFulfill, onReject) => {
    // putting this out of settimeout as evaluation will happen only after next tick
    setTimeout(() => {
      if (status === STATUS.pending) handlers.push({ onFulfill, onReject });
      if (status === STATUS.fulfilled) {
        if (typeof onFulfill === "function") onFulfill(value);
      }

      if (status === STATUS.rejected) {
        if (typeof onReject === "function") onReject(value);
      }
    }, 0);
  };

  this.then = (onFulfill, onReject) => {
    // need to return a promise
    return new APlus((resolve, reject) => {
      // instead of directly giving `handle`
      // onFulfill/onReject we pass a wrapper
      // function which takes in the result
      // and then returns the `returned` value
      // by then handlers
      handle(
        (result) => {
          if (isFunction(onFulfill)) {
            try {
              return resolve(onFulfill(result));
            } catch (ex) {
              return reject(ex);
            }
          }
          return resolve(result);
        },
        (error) => {
          if (isFunction(onReject)) {
            try {
              return resolve(onReject(error));
            } catch (ex) {
              return reject(ex);
            }
          }
          return reject(error);
        }
      );
    });
  };

  innerResolve(fn);
}

APlus.resolved = (value) => new APlus((res) => res(value));
APlus.rejected = (value) => new APlus((_, rej) => rej(value));

module.exports = APlus;
