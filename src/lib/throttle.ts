/** Leading-edge throttle: runs at most once per `ms`, with trailing flush. */
export function throttle<T extends (...args: never[]) => void>(
  fn: T,
  ms: number,
): T & { cancel: () => void; flush: () => void } {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: Parameters<T> | undefined;

  const wrapped = ((...args: Parameters<T>) => {
    lastArgs = args;
    const now = Date.now();
    const remaining = ms - (now - last);

    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = undefined;
      }
      last = now;
      fn(...args);
    } else if (!timer) {
      timer = setTimeout(() => {
        timer = undefined;
        last = Date.now();
        if (lastArgs) fn(...lastArgs);
      }, remaining);
    }
  }) as T & { cancel: () => void; flush: () => void };

  wrapped.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
    lastArgs = undefined;
  };

  wrapped.flush = () => {
    if (lastArgs) {
      if (timer) clearTimeout(timer);
      timer = undefined;
      last = Date.now();
      fn(...lastArgs);
      lastArgs = undefined;
    }
  };

  return wrapped;
}

export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  ms: number,
): T & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const wrapped = ((...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      fn(...args);
    }, ms);
  }) as T & { cancel: () => void };

  wrapped.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
  };

  return wrapped;
}
