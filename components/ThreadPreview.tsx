// /components/ThreadPreview.tsx
import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Image, Video } from "lucide-react";
import ImageUploader from './ImageUploader';

interface Thread {
  text: string;
  image?: { url: string; alt: string; };
  video?: { url: string; };
}

interface ThreadPreviewProps {
  threads: Thread[];
  setThreads: React.Dispatch<React.SetStateAction<Thread[]>>;
}

export default function ThreadPreview({ threads, setThreads }: ThreadPreviewProps) {
  const [activeUploadIndex, setActiveUploadIndex] = useState<number | null>(null);
  const [uploadType, setUploadType] = useState<'image' | 'video' | null>(null);

  // Handle reordering of tweets
  const handleDragEnd = (result: any) => {
    // Drop outside the list
    if (!result.destination) return;
    
    const newThreads = [...threads];
    const [removed] = newThreads.splice(result.source.index, 1);
    newThreads.splice(result.destination.index, 0, removed);
    
    setThreads(newThreads);
  };

  // Delete a thread item
  const deleteThread = (index: number) => {
    const newThreads = [...threads];
    newThreads.splice(index, 1);
    setThreads(newThreads);
  };

  // Handle adding image to a tweet
  const handleAddImage = (index: number) => {
    setActiveUploadIndex(index);
    setUploadType('image');
  };

  // Handle adding video to a tweet
  const handleAddVideo = (index: number) => {
    setActiveUploadIndex(index);
    setUploadType('video');
  };

  // Attach media to a thread
  const attachMedia = (url: string, type: 'image' | 'video', alt: string = '') => {
    if (activeUploadIndex === null) return;
    
    const newThreads = [...threads];
    
    if (type === 'image') {
      newThreads[activeUploadIndex].image = { url, alt };
    } else if (type === 'video') {
      newThreads[activeUploadIndex].video = { url };
    }
    
    setThreads(newThreads);
    setActiveUploadIndex(null);
    setUploadType(null);
  };

  // Remove media from thread
  const removeMedia = (index: number, type: 'image' | 'video') => {
    const newThreads = [...threads];
    
    if (type === 'image') {
      delete newThreads[index].image;
    } else if (type === 'video') {
      delete newThreads[index].video;
    }
    
    setThreads(newThreads);
  };

  return (
    <>
      {activeUploadIndex !== null && uploadType && (
        <ImageUploader 
          onImageSelected={(url, alt) => attachMedia(url, uploadType, alt)}
          onClose={() => {
            setActiveUploadIndex(null);
            setUploadType(null);
          }}
          type={uploadType}
        />
      )}
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="thread-list">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {threads.map((thread, index) => (
                <Draggable key={index} draggableId={`thread-${index}`} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <Card className="p-4 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                        <div className="flex items-start gap-3">
                          {/* Tweet number and avatar */}
                          <div className="flex-shrink-0 flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                              {index + 1}
                            </div>
                            {index < threads.length - 1 && (
                              <div className="w-0.5 h-full bg-gray-300 dark:bg-gray-600 my-1"></div>
                            )}
                          </div>
                          
                          {/* Tweet content */}
                          <div className="flex-grow space-y-3">
                            <p className="text-sm text-gray-800 dark:text-gray-200">
                              {thread.text}
                            </p>
                            
                            {/* Attached media preview */}
                            {thread.image && (
                              <div className="relative mt-2">
                                <img 
                                  src={thread.image.url} 
                                  alt={thread.image.alt || "Tweet image"} 
                                  className="rounded-lg max-h-48 object-cover"
                                />
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="absolute top-2 right-2 h-7 w-7 p-0"
                                  onClick={() => removeMedia(index, 'image')}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            
                            {thread.video && (
                              <div className="relative mt-2">
                                <video 
                                  src={thread.video.url}
                                  controls
                                  className="rounded-lg max-h-48 w-full"
                                />
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="absolute top-2 right-2 h-7 w-7 p-0"
                                  onClick={() => removeMedia(index, 'video')}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            
                            {/* Media and delete buttons */}
                            <div className="flex items-center gap-2 mt-2">
                              {!thread.image && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleAddImage(index)}
                                >
                                  <Image className="h-4 w-4 mr-1" />
                                  Add Image
                                </Button>
                              )}
                              
                              {!thread.video && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleAddVideo(index)}
                                >
                                  <Video className="h-4 w-4 mr-1" />
                                  Add Video
                                </Button>
                              )}
                              
                              <div className="flex-grow"></div>
                              
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 w-8 p-0"
                                onClick={() => deleteThread(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </>
  );
}