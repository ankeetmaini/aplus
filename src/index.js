const getThen = (value) => {
  const type = typeof value;
  if (value && (type === "object" || type === "function")) {
    const then = value.then;
    if (typeof then === "function") return then;
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
    setTimeout(() => {
      handlers.forEach((h) => h.onFulfill(value));
      handlers = null;
    });
  };

  const reject = (err) => {
    status = STATUS.rejected;
    value = err;
    setTimeout(() => {
      handlers.forEach((h) => h.onReject(value));
      handlers = null;
    });
  };

  const process = (fn) => {
    let called = false;
    try {
      // calling actual promise constructor
      fn(
        // resolve
        (result) => {
          if (result === this) {
            throw new TypeError();
          }
          if (called) return;
          called = true;
          // what if you resolved with a promise
          // like object which has a `then`
          // res(Promise.resolve(42))
          try {
            const then = getThen(result);
            if (then) {
              process(then.bind(result));
              return;
            }
            return fulfill(result);
          } catch (ex) {
            return reject(ex);
          }
        },
        // reject
        (error) => {
          if (error === this) {
            throw new TypeError();
          }
          if (called) return;
          called = true;
          return reject(error);
        }
      );
    } catch (error) {
      if (called) return;
      called = true;
      return reject(error);
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

  process(fn);
}

APlus.resolved = (value) => new APlus((res) => res(value));
APlus.rejected = (value) => new APlus((_, rej) => rej(value));

module.exports = APlus;
