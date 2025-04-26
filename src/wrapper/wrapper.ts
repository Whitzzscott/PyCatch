import { controller } from '../controller';

let initialized = false;

const pycatch = {
  initialize: (): void => {
    if (initialized) return;
    initialized = true;

    controller.setupMouseTracking();
    controller.setupGlobalErrorHandlers();
    controller.monkeyPatchFetch();

    console.log(
      '%cpycatch initialized 💻🔥',
      'color: turquoise; font-weight: bold',
    );
  },

  getLogs: controller.getLogs,
  clearLogs: controller.clearLogs,
};

export default pycatch;
