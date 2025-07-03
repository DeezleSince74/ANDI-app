/**
 * Retry decorator and utilities
 */

export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoffFactor?: number;
  retryCondition?: (error: Error) => boolean;
}

export function retry(options: RetryOptions) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const { maxAttempts, delayMs, backoffFactor = 2, retryCondition } = options;
      let lastError: Error;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await method.apply(this, args);
        } catch (error) {
          lastError = error as Error;

          // Check if we should retry this error
          if (retryCondition && !retryCondition(lastError)) {
            throw lastError;
          }

          // Don't wait after the last attempt
          if (attempt === maxAttempts) {
            break;
          }

          const delay = delayMs * Math.pow(backoffFactor, attempt - 1);
          console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms: ${lastError.message}`);
          await sleep(delay);
        }
      }

      throw lastError;
    };

    return descriptor;
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { maxAttempts, delayMs, backoffFactor = 2, retryCondition } = options;
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (retryCondition && !retryCondition(lastError)) {
        throw lastError;
      }

      if (attempt === maxAttempts) {
        break;
      }

      const delay = delayMs * Math.pow(backoffFactor, attempt - 1);
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms: ${lastError.message}`);
      await sleep(delay);
    }
  }

  throw lastError;
}