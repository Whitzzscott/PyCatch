import pycatch from '../../index';
import { controller } from '../controller';

describe('pycatch tests', () => {
  beforeEach(() => {
    controller.clearLogs();
  });

  test('should initialize pycatch correctly', () => {
    pycatch.initialize();
    expect(controller.getLogs()).toEqual([]);
    expect(global.console.log).toHaveBeenCalledWith(
      '%cpycatch initialized 💻🔥',
      'color: turquoise; font-weight: bold',
    );
  });

  test('should capture global errors correctly', () => {
    pycatch.initialize();
    const errorEvent = new Error('Global Error');
    if (window.onerror) {
      window.onerror('message', 'source', 1, 1, errorEvent);
    }
    const logs = controller.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].error.message).toBe('Global Error');
    expect(logs[0].source).toBe('global');
  });

  test('should capture unhandled promise rejections correctly', async () => {
    pycatch.initialize();
    const rejectionError = new Error('Promise Rejected');
    const rejectionEvent = {
      reason: rejectionError,
      promise: Promise.reject(rejectionError),
      bubbles: false,
      cancelBubble: false,
      cancelable: true,
      composed: false,
      currentTarget: window,
      defaultPrevented: false,
      eventPhase: 0,
      isTrusted: true,
      returnValue: true,
      srcElement: window,
      target: window,
      timeStamp: Date.now(),
      type: 'unhandledrejection',
    };
    window.onunhandledrejection!(rejectionEvent as unknown as PromiseRejectionEvent);

    await Promise.resolve(); // Ensure async completion

    const logs = controller.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].error.message).toBe('Promise Rejected');
    expect(logs[0].source).toBe('promise');
  });

  test('should capture fetch errors correctly', async () => {
    pycatch.initialize();
    const originalFetch = window.fetch;
    window.fetch = jest.fn().mockRejectedValueOnce(new Error('Fetch failed'));

    try {
      await fetch('https://example.com');
    } catch (err) {
      const logs = controller.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].error.message).toBe('Fetch failed');
      expect(logs[0].source).toBe('fetch');
    } finally {
      window.fetch = originalFetch;
    }
  });

  test('should track mouse position and clicked element', () => {
    pycatch.initialize();
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: 150,
      clientY: 250,
    });
    const clickEvent = new MouseEvent('click', {});
    document.dispatchEvent(mouseEvent);
    document.dispatchEvent(clickEvent);

    const logs = controller.getLogs();
    expect(logs.length).toBe(0); // No error logs yet
    expect(controller.getLogs()).toEqual(
      expect.arrayContaining([{
        mousePosition: { x: 150, y: 250 },
        lastClickedElement: null,
        source: 'unknown',
        timestamp: expect.any(String),
      }]),
    );
  });

  test('should clear logs correctly', () => {
    pycatch.initialize();
    const errorEvent = new Error('Another Error');
    if (window.onerror) {
      window.onerror('message', 'source', 1, 1, errorEvent);
    }
    expect(controller.getLogs().length).toBe(1);
    controller.clearLogs();
    expect(controller.getLogs().length).toBe(0);
  });
});
