const isPromise = (value) => {
  if (value) {
    if ("then" in value && typeof value.then === "function") return true;
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

  const handlers = [];

  // low level state management
  const fulfill = (result) => {
    status = STATUS.fulfilled;
    value = result;
    handlers.forEach(h.onFulfill(value));
    handlers = [];
  };

  const reject = (err) => {
    status = STATUS.rejected;
    value = err;
    handlers.forEach(h.onReject(value));
    handlers = [];
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
              reject(ex);
            }
          }
          resolve(result);
        },
        (error) => {
          if (isFunction(onReject)) {
            try {
              return reject(onReject(error));
            } catch (ex) {
              reject(ex);
            }
          }
          reject(error);
        }
      );
    });
  };

  innerResolve(fn);
}
