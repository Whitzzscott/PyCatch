type ErrorSource = 'global' | 'promise' | 'fetch' | 'unknown';

interface CapturedError {
  error: {
    message: string;
    stack: string | null;
    name: string | null;
  };
  timestamp: string;
  mousePosition: { x: number | null; y: number | null };
  lastClickedElement: string | null;
  source: ErrorSource;
}

const errorLog: CapturedError[] = [];

let lastMousePosition = { x: null as number | null, y: null as number | null };
let lastClickedElement: Element | null = null;

const captureContext = (
  error: any,
  source: ErrorSource = 'unknown',
): CapturedError => ({
  error: {
    message: error.message || String(error),
    stack: error.stack || null,
    name: error.name || null,
  },
  timestamp: new Date().toISOString(),
  mousePosition: lastMousePosition,
  lastClickedElement: lastClickedElement?.outerHTML || null,
  source,
});

const setupMouseTracking = () => {
  document.addEventListener('mousemove', (e: MouseEvent) => {
    lastMousePosition = { x: e.clientX, y: e.clientY };
  });
  document.addEventListener('click', (e: MouseEvent) => {
    lastClickedElement = e.target as Element;
  });
};

const monkeyPatchFetch = () => {
  const originalFetch = window.fetch;
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    try {
      const res = await originalFetch(...args);
      if (!res.ok) {
        errorLog.push(
          captureContext(
            {
              message: `Fetch error: ${res.statusText}`,
              status: res.status,
              url: args[0],
            },
            'fetch',
          ),
        );
      }
      return res;
    } catch (err: any) {
      errorLog.push(
        captureContext(
          {
            message: err.message,
            stack: err.stack,
            url: args[0],
          },
          'fetch',
        ),
      );
      throw err;
    }
  };
};

const setupGlobalErrorHandlers = () => {
  window.onerror = (message, source, lineno, colno, error) => {
    const context = captureContext(error || { message }, 'global');
    errorLog.push(context);
  };

  window.onunhandledrejection = (event: PromiseRejectionEvent) => {
    const error = event.reason || {};
    const context = captureContext(error, 'promise');
    errorLog.push(context);
  };
};

export const controller = {
  setupMouseTracking,
  monkeyPatchFetch,
  setupGlobalErrorHandlers,
  getLogs: (): CapturedError[] => errorLog,
  clearLogs: (): void => {
    errorLog.length = 0;
  },
};
