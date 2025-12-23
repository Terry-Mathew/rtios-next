/**
 * Gemini API Type Utilities
 * 
 * Helper functions and types for working with Google Gemini API responses.
 */

/**
 * Represents a web source from Gemini's grounding metadata
 */
export interface WebSource {
  uri: string;
  title: string;
}

/**
 * Type for Gemini grounding chunk (from API response)
 */
interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

/**
 * Extracts web sources from Gemini's grounding metadata chunks
 * 
 * @param chunks - Array of grounding chunks from Gemini API response
 * @returns Array of web sources with URI and title (defaults to URI if no title provided)
 * 
 * @example
 * const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
 * const sources = extractWebSources(groundingChunks);
 */
export function extractWebSources(chunks: unknown[]): WebSource[] {
  if (!Array.isArray(chunks)) {
    return [];
  }

  return chunks
    .filter((chunk): chunk is GroundingChunk => {
      return (
        typeof chunk === 'object' &&
        chunk !== null &&
        'web' in chunk &&
        typeof chunk.web === 'object' &&
        chunk.web !== null &&
        'uri' in chunk.web &&
        typeof chunk.web.uri === 'string'
      );
    })
    .map((chunk) => ({
      uri: chunk.web!.uri!,
      title: chunk.web!.title || chunk.web!.uri! // Use URI as fallback if no title
    }))
    .filter((source) => source.uri.length > 0);
}

