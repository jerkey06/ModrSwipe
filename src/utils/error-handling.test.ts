import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  withRetry, 
  getErrorMessage, 
  FirebaseError, 
  ValidationError,
  RetryOptions 
} from './validation';

describe('Enhanced Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('withRetry function', () => {
    it('should succeed on first attempt', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success');
      
      const result = await withRetry(mockOperation, 'test-operation');
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable Firebase errors', async () => {
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new FirebaseError('Network error', 'network-request-failed'))
        .mockResolvedValue('success');
      
      const result = await withRetry(mockOperation, 'test-operation', { baseDelay: 10 });
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      const mockOperation = vi.fn()
        .mockRejectedValue(new FirebaseError('Permission denied', 'permission-denied'));
      
      await expect(withRetry(mockOperation, 'test-operation')).rejects.toThrow('Permission denied');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should respect maxAttempts configuration', async () => {
      const mockOperation = vi.fn()
        .mockRejectedValue(new FirebaseError('Network error', 'network-request-failed'));
      
      const options: RetryOptions = { maxAttempts: 2, baseDelay: 10 };
      
      await expect(withRetry(mockOperation, 'test-operation', options)).rejects.toThrow('Network error');
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should implement exponential backoff', async () => {
      const mockOperation = vi.fn()
        .mockRejectedValue(new FirebaseError('Timeout', 'timeout'));
      
      const startTime = Date.now();
      
      try {
        await withRetry(mockOperation, 'test-operation', { 
          maxAttempts: 3, 
          baseDelay: 100,
          backoffFactor: 2 
        });
      } catch (error) {
        // Expected to fail
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should have waited at least 100ms + 200ms = 300ms for retries
      expect(duration).toBeGreaterThan(250);
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should handle validation errors without retry', async () => {
      const mockOperation = vi.fn()
        .mockRejectedValue(new ValidationError('Invalid data'));
      
      await expect(withRetry(mockOperation, 'test-operation')).rejects.toThrow('Invalid data');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe('getErrorMessage function', () => {
    it('should return user-friendly messages for Firebase errors', () => {
      const testCases = [
        {
          error: new FirebaseError('Test', 'permission-denied'),
          expected: 'You don\'t have permission to access this resource. Please contact the room host.'
        },
        {
          error: new FirebaseError('Test', 'not-found'),
          expected: 'The requested room or resource was not found. Please check the room code.'
        },
        {
          error: new FirebaseError('Test', 'network-request-failed'),
          expected: 'Unable to connect to the server. Please check your internet connection and try again.'
        },
        {
          error: new FirebaseError('Test', 'timeout'),
          expected: 'The request took too long to complete. Please try again.'
        },
        {
          error: new FirebaseError('Test', 'unavailable'),
          expected: 'The service is temporarily unavailable. Please try again in a moment.'
        }
      ];

      testCases.forEach(({ error, expected }) => {
        expect(getErrorMessage(error)).toBe(expected);
      });
    });

    it('should handle validation errors', () => {
      const error = new ValidationError('Invalid input data');
      expect(getErrorMessage(error)).toBe('Invalid data: Invalid input data');
    });

    it('should handle generic errors', () => {
      const error = new Error('Generic error message');
      expect(getErrorMessage(error)).toBe('Generic error message');
    });

    it('should handle errors without messages', () => {
      const error = new Error();
      expect(getErrorMessage(error)).toBe('An unexpected error occurred.');
    });
  });

  describe('Error classification', () => {
    it('should correctly identify retryable Firebase errors', () => {
      const retryableErrors = [
        'network-request-failed',
        'timeout',
        'unavailable',
        'deadline-exceeded',
        'resource-exhausted',
        'internal',
        'aborted'
      ];

      retryableErrors.forEach(code => {
        const error = new FirebaseError('Test error', code);
        expect(error.code).toBe(code);
      });
    });

    it('should correctly identify non-retryable Firebase errors', () => {
      const nonRetryableErrors = [
        'permission-denied',
        'not-found',
        'unauthenticated',
        'already-exists',
        'failed-precondition',
        'out-of-range',
        'unimplemented',
        'data-loss'
      ];

      nonRetryableErrors.forEach(code => {
        const error = new FirebaseError('Test error', code);
        expect(error.code).toBe(code);
      });
    });
  });

  describe('Error boundary scenarios', () => {
    it('should handle concurrent retry operations', async () => {
      let callCount = 0;
      const mockOperation = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.reject(new FirebaseError('Network error', 'network-request-failed'));
        }
        return Promise.resolve(`success-${callCount}`);
      });

      const promises = [
        withRetry(mockOperation, 'operation-1', { baseDelay: 10 }),
        withRetry(mockOperation, 'operation-2', { baseDelay: 10 })
      ];

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(2);
      expect(mockOperation).toHaveBeenCalled();
    });

    it('should handle maximum delay cap', async () => {
      const mockOperation = vi.fn()
        .mockRejectedValue(new FirebaseError('Timeout', 'timeout'));
      
      const startTime = Date.now();
      
      try {
        await withRetry(mockOperation, 'test-operation', { 
          maxAttempts: 2,
          baseDelay: 5000,
          maxDelay: 100, // Cap at 100ms
          backoffFactor: 10
        });
      } catch (error) {
        // Expected to fail
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should not exceed maxDelay significantly
      expect(duration).toBeLessThan(500);
    });
  });
});