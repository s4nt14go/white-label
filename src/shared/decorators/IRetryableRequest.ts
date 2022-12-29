export type RetryableRequest = {
  firstFail?: string; // All DBretryable use cases will have this timestamp when being retried
}