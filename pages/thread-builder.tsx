// /pages/thread-builder.tsx
import { useState } from 'react';
import Head from 'next/head';
import ThreadInput from '../components/ThreadInput';
import ThreadPreview from '../components/ThreadPreview';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

// Main Thread Builder Page
export default function ThreadBuilder() {
  const [threads, setThreads] = useState<Array<{
    text: string;
    image?: { url: string; alt: string; };
    video?: { url: string; };
  }>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const { toast } = useToast();

  // Handle posting the thread to the API
  const handlePostThread = async (schedule = false) => {
    try {
      setIsPosting(true);
      // Check if we have threads to post
      if (threads.length === 0) {
        toast({
          title: "No thread to post",
          description: "Please generate a thread first.",
          variant: "destructive",
        });
        return;
      }

      // Mock API call
      const response = await fetch('/api/post-thread', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threads,
          schedule,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to post thread');
      }

      // Show success message
      toast({
        title: schedule ? "Thread Scheduled" : "Thread Posted",
        description: schedule 
          ? "Your thread has been scheduled successfully." 
          : "Your thread has been posted successfully.",
      });
    } catch (error) {
      console.error('Error posting thread:', error);
      toast({
        title: "Failed to post thread",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Thread Builder</title>
        <meta name="description" content="Build and schedule your Twitter threads" />
      </Head>
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Thread Builder</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column: Thread Input */}
          <div className="space-y-6">
            <ThreadInput 
              setThreads={setThreads} 
              isGenerating={isGenerating}
              setIsGenerating={setIsGenerating}
            />
          </div>
          
          {/* Right column: Thread Preview */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Thread Preview</h2>
              
              {threads.length > 0 ? (
                <>
                  <ThreadPreview 
                    threads={threads}
                    setThreads={setThreads}
                  />
                  
                  {/* Action buttons */}
                  <div className="mt-6 flex gap-4">
                    <Button 
                      onClick={() => handlePostThread(false)}
                      disabled={isPosting || threads.length === 0}
                      className="px-6"
                    >
                      {isPosting ? "Posting..." : "Post Now"}
                    </Button>
                    <Button 
                      onClick={() => handlePostThread(true)}
                      disabled={isPosting || threads.length === 0}
                      variant="outline"
                      className="px-6"
                    >
                      {isPosting ? "Scheduling..." : "Schedule Post"}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p>Your thread preview will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}