const STATUS = {
  pending: 0,
  fulfilled: 1,
  rejected: 2,
};
const getThen = (value) => {
  if (value && typeof value.then === "function") {
    return value.then;
  }
};
function APlus(fn) {
  let status = STATUS.pending;
  let value;
  let handlers = []; // array as there can be multiple `then`s

  const fulfill = (result) => {
    status = STATUS.fulfilled;
    value = result;
    // call each handler with the resolved value
    handlers.forEach((h) => h.onFulfill(value));
  };

  const reject = (err) => {
    status = STATUS.rejected;
    value = err;
    // call each handler with the rejected value
    handlers.forEach((h) => h.onReject(value));
  };

  const process = (fn) => {
    try {
      fn(
        // this is resolve
        (result) => {
          // check if result is a Promise-like object
          try {
            const then = getThen(result);
            if (then) {
              process(then.bind(result));
              return;
            }
          } catch (err) {
            reject(err);
            return;
          }
          fulfill(result);
        },
        // this is reject
        (error) => {
          reject(error);
        }
      );
    } catch (err) {
      reject(err);
    }
  };
  function handle(onFulfill, onReject) {
    // save if pending
    if (status === STATUS.pending) handlers.push({ onFulfill, onReject });

    // call with the result if already resolved/rejected
    if (status === STATUS.fulfilled) onFulfill(value);
    if (status === STATUS.rejected) onReject(value);
  }

  const isFunction = (fn) => {
    if (typeof fn === "function") return true;
    return false;
  };

  this.then = (onFulfill, onReject) => {
    return new APlus((resolve, reject) => {
      // save the handlers wrapped with resolve and reject
      handle(
        (result) => {
          // using onFulfill only if it's a function
          if (isFunction(onFulfill)) {
            try {
              resolve(onFulfill(result));
            } catch (err) {
              reject(err);
            }
            return;
          }
          // otherwise calling resolve directly
          // user didn't pass a success handler
          resolve(result);
        },
        (error) => {
          if (isFunction(onReject)) {
            try {
              resolve(onReject(error));
            } catch (err) {
              reject(err);
            }
            return;
          }
          // if `onReject` is not provided
          // or if it's not a function
          // then the promise would be rejected
          reject(error);
        }
      );
    });
  };
  process(fn);
}

module.exports = APlus;
