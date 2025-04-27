// /lib/threadUtils.ts

/**
 * Maximum character limit for each tweet
 */
const MAX_TWEET_LENGTH = 280;

/**
 * Splits long-form content into tweet-sized segments
 * Maintains sentence coherence and natural flow
 * 
 * @param content Long-form text content to split
 * @returns Array of tweet segments
 */
export function splitIntoThreads(content: string): string[] {
  // Trim whitespace and normalize line breaks
  const trimmedContent = content.trim().replace(/\r\n/g, '\n');
  
  // Split content into paragraphs
  const paragraphs = trimmedContent.split(/\n\s*\n/);
  
  const threads: string[] = [];
  let currentThread = '';
  
  // Process each paragraph
  for (const paragraph of paragraphs) {
    // Split paragraph into sentences
    // This is a simple regex that works for most English sentences
    // A more robust solution might use NLP libraries
    const sentences = paragraph.split(/(?<=[.!?])\s+/);
    
    for (const sentence of sentences) {
      // If sentence is too long on its own, split it further
      if (sentence.length > MAX_TWEET_LENGTH) {
        if (currentThread) {
          threads.push(currentThread.trim());
          currentThread = '';
        }
        
        // Split long sentence into chunks
        const chunks = splitLongSentence(sentence);
        threads.push(...chunks);
        continue;
      }
      
      // Check if adding this sentence would exceed the limit
      if ((currentThread + ' ' + sentence).length <= MAX_TWEET_LENGTH) {
        // Add to current thread
        currentThread = currentThread 
          ? currentThread + ' ' + sentence 
          : sentence;
      } else {
        // Start a new thread
        threads.push(currentThread.trim());
        currentThread = sentence;
      }
    }
    
    // Add paragraph break if needed and if there's space
    if (currentThread.length + 2 <= MAX_TWEET_LENGTH) {
      currentThread += '\n\n';
    } else {
      threads.push(currentThread.trim());
      currentThread = '';
    }
  }
  
  // Add the last thread if not empty
  if (currentThread.trim()) {
    threads.push(currentThread.trim());
  }
  
  // Add thread numbering if more than one tweet
  if (threads.length > 1) {
    return threads.map((thread, index) => {
      // Only add numbering if it doesn't exceed the limit
      const numbering = `${index + 1}/${threads.length} `;
      if (thread.length + numbering.length <= MAX_TWEET_LENGTH) {
        return numbering + thread;
      }
      
      // If adding numbering would exceed limit, leave as is
      return thread;
    });
  }
  
  return threads;
}

/**
 * Splits a sentence that exceeds the maximum tweet length into smaller chunks
 * Tries to split at natural breakpoints (commas, semicolons, etc.)
 * 
 * @param sentence Long sentence to split
 * @returns Array of sentence chunks
 */
function splitLongSentence(sentence: string): string[] {
  const chunks: string[] = [];
  
  // Define breakpoints in order of preference
  const breakpoints = [
    /(?<=[:;])\s+/,  // Split at semicolons and colons
    /(?<=,)\s+/,     // Split at commas
    /\s+(?=and|or|but|so|because|that|which|when|where|who|if)/i, // Split before conjunctions
    /\s+/            // As a last resort, split at any space
  ];
  
  let remainingSentence = sentence;
  
  while (remainingSentence.length > MAX_TWEET_LENGTH) {
    let splitFound = false;
    
    // Try each breakpoint type in order
    for (const breakpoint of breakpoints) {
      // Find all possible split positions
      const matches = [...remainingSentence.matchAll(new RegExp(breakpoint, 'g'))];
      
      if (matches.length > 0) {
        // Find the last match that would result in a chunk <= MAX_TWEET_LENGTH
        for (let i = matches.length - 1; i >= 0; i--) {
          const match = matches[i];
          if (!match.index) continue;
          
          if (match.index <= MAX_TWEET_LENGTH - 3) { // Leave room for ellipsis
            const chunk = remainingSentence.substring(0, match.index).trim() + '...';
            chunks.push(chunk);
            
            // Continue with the rest of the sentence
            remainingSentence = '...' + remainingSentence.substring(match.index).trim();
            splitFound = true;
            break;
          }
        }
      }
      
      if (splitFound) break;
    }
    
    // If no good breakpoint was found, force split at MAX_TWEET_LENGTH - 3
    if (!splitFound) {
      const chunk = remainingSentence.substring(0, MAX_TWEET_LENGTH - 3).trim() + '...';
      chunks.push(chunk);
      
      remainingSentence = '...' + remainingSentence.substring(MAX_TWEET_LENGTH - 3).trim();
    }
  }
  
  // Add the last part
  if (remainingSentence.length > 0) {
    chunks.push(remainingSentence);
  }
  
  return chunks;
}

/**
 * Estimates the number of tweets needed for the given content
 * Useful for providing feedback to users before generating the full thread
 * 
 * @param content Content to estimate
 * @returns Estimated number of tweets
 */
export function estimateTweetCount(content: string): number {
  // A simple estimation based on total character count
  // Actual count may differ due to sentence coherence logic
  const totalChars = content.length;
  return Math.ceil(totalChars / (MAX_TWEET_LENGTH * 0.8)); // 0.8 factor for estimation
}

/**
 * Checks if the given tweet text exceeds the character limit
 * 
 * @param text Tweet text to check
 * @returns Boolean indicating if text is valid
 */
export function isValidTweetLength(text: string): boolean {
  return text.length <= MAX_TWEET_LENGTH;
}