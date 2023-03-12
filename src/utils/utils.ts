export const SHAKE_ANIMATION_TIME = 830;

interface WaitOptions<T> {
  response?: T;
  error?: unknown;
  time?: number;
  success?: boolean;
}

export const wait = async <T>({
  response = undefined,
  error = undefined,
  time = 50,
  success = true,
}: WaitOptions<T>): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (success) {
        resolve(response);
      } else {
        reject(error);
      }
    }, time);
  });
};

export const isEmptyObj = (obj: unknown) => {
  if (!obj || typeof obj !== 'object') {
    return true;
  }
  return Object.keys(obj).length === 0;
};

export const clone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

export const getKey = (event: KeyboardEvent): string => {
  let { key } = event;
  const { code } = event;

  if (code === 'Space') {
    key = 'Space';
  }
  return key;
};

/**
 * Get a random number between min and max (included).
 * @param a - Min integer. If no b provided so min = 0 and max = a.
 * @param b - Max integer.
 * @returns Random number.
 */
export const getRandomNum = (a: number, b?: number) => {
  let min = 0;
  let max = 0;

  if (!b) {
    max = a;
  } else {
    min = a;
    max = b;
  }

  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Get a random element of an array and the random index of this element.
 * @param array - Array to get a random element.
 */
export const getRandomElementWithIndex = <T>(
  array: Array<T>
): {
  index: number; // -1 if empty is empty.
  el: T | undefined;
} => {
  const index = getRandomNum(array.length - 1);
  const el = array[index];

  return { index, el };
};

/**
 * Get a random element of an array.
 * @param array - Array to get a random element.
 * @returns Random element.
 */
export const getRandomElement = <T>(array: Array<T>) => getRandomElementWithIndex(array).el;
