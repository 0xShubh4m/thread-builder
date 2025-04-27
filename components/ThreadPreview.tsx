// /components/ThreadPreview.tsx
import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Image, Video, GripVertical } from "lucide-react";
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

// SortableItem component
const SortableItem = ({ thread, index, onDelete, onAddImage, onAddVideo, onRemoveMedia }: {
  thread: Thread;
  index: number;
  onDelete: (index: number) => void;
  onAddImage: (index: number) => void;
  onAddVideo: (index: number) => void;
  onRemoveMedia: (index: number, type: 'image' | 'video') => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: `thread-${index}` });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div ref={setNodeRef} style={style}>
      <Card className="p-4 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors mb-4">
        <div className="flex items-start gap-3">
          {/* Drag handle and tweet number */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              {index + 1}
            </div>
            <div className="h-6 flex items-center justify-center cursor-grab" {...attributes} {...listeners}>
              <GripVertical className="w-4 h-4 text-gray-400" />
            </div>
            {index < Infinity - 1 && (
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
                  onClick={() => onRemoveMedia(index, 'image')}
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
                  onClick={() => onRemoveMedia(index, 'video')}
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
                  onClick={() => onAddImage(index)}
                >
                  <Image className="h-4 w-4 mr-1" />
                  Add Image
                </Button>
              )}
              
              {!thread.video && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onAddVideo(index)}
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
                onClick={() => onDelete(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default function ThreadPreview({ threads, setThreads }: ThreadPreviewProps) {
  const [activeUploadIndex, setActiveUploadIndex] = useState<number | null>(null);
  const [uploadType, setUploadType] = useState<'image' | 'video' | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle reordering of tweets
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setThreads((items) => {
        const oldIndex = parseInt(active.id.split('-')[1]);
        const newIndex = parseInt(over.id.split('-')[1]);
        
        const newItems = [...items];
        const [movedItem] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, movedItem);
        
        return newItems;
      });
    }
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
    
    setThreads([...newThreads]);
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
      
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={threads.map((_, index) => `thread-${index}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {threads.map((thread, index) => (
              <SortableItem
                key={`thread-${index}`}
                thread={thread}
                index={index}
                onDelete={deleteThread}
                onAddImage={handleAddImage}
                onAddVideo={handleAddVideo}
                onRemoveMedia={removeMedia}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}