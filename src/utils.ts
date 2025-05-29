import { window, ProgressLocation } from 'vscode';

const sleep = (time: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
};

const showProgress = async (message: string) => {
  await window.withProgress(
    {
      location: ProgressLocation.Notification,
      cancellable: false
    },
    async (progress, token) => {
      return new Promise(async (resolve) => {
        const seconds = 3;
        for (let i = 0; i < seconds; i++) {
          progress.report({
            increment: (100 / seconds),
            message: `${message}`
          });
          await sleep(1000);
        }
        resolve(null);
      });
    }
  );
};

export { sleep, showProgress };