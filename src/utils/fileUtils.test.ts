import { describe, it, expect } from 'vitest';
import { fileToBase64 } from './fileUtils';

describe('fileUtils', () => {
  it('should convert a file to base64 string', async () => {
    // Create a mock file
    const content = 'Hello World';
    const file = new File([content], 'test.txt', { type: 'text/plain' });

    // The result should be the base64 representation of "Hello World"
    // "Hello World" in base64 is "SGVsbG8gV29ybGQ="
    const result = await fileToBase64(file);
    
    expect(result).toBe('SGVsbG8gV29ybGQ=');
  });
});
