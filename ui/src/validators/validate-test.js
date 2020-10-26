import { createStateForEditTest } from '../features/components/TestForm/utils';

const isTestValid = (test) => {
  try {
    createStateForEditTest(test);
    return true;
  }
  catch (e) {
    return false;
  }
}

export {
  isTestValid,
}