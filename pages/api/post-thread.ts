// /pages/api/post-thread.ts
import type { NextApiRequest, NextApiResponse } from 'next';

type ThreadItem = {
  text: string;
  image?: {
    url: string;
    alt: string;
  };
  video?: {
    url: string;
  };
};

type ThreadPostRequest = {
  threads: ThreadItem[];
  schedule?: boolean;
  scheduledTime?: string;
};

type ThreadPostResponse = {
  success: boolean;
  threadId?: string;
  message?: string;
  scheduledTime?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ThreadPostResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    // Parse the request body
    const { threads, schedule, scheduledTime }: ThreadPostRequest = req.body;

    // Validate input
    if (!threads || !Array.isArray(threads) || threads.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid thread data. Please provide at least one thread item.'
      });
    }

    // Validate that each thread has text
    const invalidThreads = threads.filter(thread => !thread.text || thread.text.trim() === '');
    if (invalidThreads.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'All thread items must contain text.'
      });
    }

    // In a real implementation, this would:
    // 1. Authenticate the user and get their access tokens
    // 2. Format the thread for the Twitter API
    // 3. Upload any media files first to get media IDs
    // 4. Post the thread using the Twitter API
    
    // For this mock implementation, we'll simulate processing
    await simulateProcessing();

    // Generate a mock thread ID
    const threadId = `thread_${Math.random().toString(36).substring(2, 15)}`;

    // Generate a mock scheduled time if scheduling was requested
    let responseScheduledTime;
    if (schedule) {
      responseScheduledTime = scheduledTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    }

    // Return a success response
    return res.status(200).json({
      success: true,
      threadId,
      message: schedule ? 'Thread scheduled successfully' : 'Thread posted successfully',
      scheduledTime: responseScheduledTime
    });

  } catch (error) {
    console.error('Error posting thread:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
}

/**
 * Simulates API processing time
 */
async function simulateProcessing() {
  // Set mockEvents = true to enable mock processing delays
  const mockEvents = true;
  
  if (mockEvents) {
    // Simulate network delay and API processing time
    const delay = Math.floor(Math.random() * 1000) + 500; // Between 500-1500ms
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Randomly simulate an error (10% chance)
    if (Math.random() < 0.1) {
      throw new Error('Twitter API rate limit exceeded. Please try again later.');
    }
  }
}