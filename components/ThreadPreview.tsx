// /components/ThreadPreview.tsx
import React, { memo, useCallback, useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Image as ImageIcon, Video as VideoIcon, GripVertical } from "lucide-react";
import ImageUploader from "./ImageUploader";

/**
 * Types
 */
export interface Thread {
  id?: string; // optional but used if present for stable DnD keys
  text: string;
  image?: { url: string; alt?: string };
  video?: { url: string };
}

interface ThreadPreviewProps {
  threads: Thread[];
  setThreads: React.Dispatch<React.SetStateAction<Thread[]>>;
}

/**
 * Helpers
 */
const getItemId = (thread: Thread, index: number) => thread.id ?? `thread-${index}`;

/**
 * Sortable item
 */
interface SortableItemProps {
  id: string;
  thread: Thread;
  index: number;
  onDelete: (index: number) => void;
  onAddImage: (index: number) => void;
  onAddVideo: (index: number) => void;
  onRemoveMedia: (index: number, type: "image" | "video") => void;
}

const SortableItem = memo(function SortableItem({
  id,
  thread,
  index,
  onDelete,
  onAddImage,
  onAddVideo,
  onRemoveMedia,
}: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="p-4 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors mb-4">
        <div className="flex items-start gap-3">
          {/* Drag handle + index chip */}
          <div className="flex-shrink-0 flex flex-col items-center select-none">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              {index + 1}
            </div>
            <button
              className="h-6 mt-1 flex items-center justify-center cursor-grab active:cursor-grabbing"
              aria-label={`Reorder item ${index + 1}`}
              title="Drag to reorder"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-grow space-y-3">
            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{thread.text}</p>

            {/* Image */}
            {thread.image?.url && (
              <div className="relative mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thread.image.url}
                  alt={thread.image.alt || "Tweet image"}
                  className="rounded-lg max-h-48 w-full object-cover"
                  loading="lazy"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2 h-7 w-7 p-0"
                  onClick={() => onRemoveMedia(index, "image")}
                  aria-label="Remove image"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Video */}
            {thread.video?.url && (
              <div className="relative mt-2">
                <video src={thread.video.url} controls className="rounded-lg max-h-48 w-full" />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2 h-7 w-7 p-0"
                  onClick={() => onRemoveMedia(index, "video")}
                  aria-label="Remove video"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mt-2">
              {!thread.image && (
                <Button size="sm" variant="outline" onClick={() => onAddImage(index)} aria-label="Add image">
                  <ImageIcon className="h-4 w-4 mr-1" /> Add Image
                </Button>
              )}

              {!thread.video && (
                <Button size="sm" variant="outline" onClick={() => onAddVideo(index)} aria-label="Add video">
                  <VideoIcon className="h-4 w-4 mr-1" /> Add Video
                </Button>
              )}

              <div className="flex-grow" />

              <Button
                size="sm"
                variant="destructive"
                className="h-8 w-8 p-0"
                onClick={() => onDelete(index)}
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
});

export default function ThreadPreview({ threads, setThreads }: ThreadPreviewProps) {
  const [activeUploadIndex, setActiveUploadIndex] = useState<number | null>(null);
  const [uploadType, setUploadType] = useState<"image" | "video" | null>(null);

  // Sensors: small activation constraint to avoid accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Stable ids for SortableContext (prefer provided thread.id)
  const itemIds = useMemo(() => threads.map((t, i) => getItemId(t, i)), [threads]);

  /** DnD handlers */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = itemIds.indexOf(String(active.id));
      const newIndex = itemIds.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;

      setThreads((prev) => arrayMove(prev, oldIndex, newIndex));
    },
    [itemIds, setThreads]
  );

  /** CRUD helpers */
  const deleteThread = useCallback(
    (index: number) => {
      setThreads((prev) => prev.filter((_, i) => i !== index));
    },
    [setThreads]
  );

  const handleAddImage = useCallback((index: number) => {
    setActiveUploadIndex(index);
    setUploadType("image");
  }, []);

  const handleAddVideo = useCallback((index: number) => {
    setActiveUploadIndex(index);
    setUploadType("video");
  }, []);

  const attachMedia = useCallback(
    (url: string, type: "image" | "video", alt = "") => {
      if (activeUploadIndex == null) return;
      setThreads((prev) =>
        prev.map((t, i) => {
          if (i !== activeUploadIndex) return t;
          if (type === "image") return { ...t, image: { url, alt }, video: t.video };
          return { ...t, video: { url }, image: t.image };
        })
      );
      setActiveUploadIndex(null);
      setUploadType(null);
    },
    [activeUploadIndex, setThreads]
  );

  const removeMedia = useCallback(
    (index: number, type: "image" | "video") => {
      setThreads((prev) =>
        prev.map((t, i) => {
          if (i !== index) return t;
          const { image, video, ...rest } = t;
          return type === "image" ? { ...rest, video } : { ...rest, image } as Thread;
        })
      );
    },
    [setThreads]
  );

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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {threads.map((thread, index) => (
              <SortableItem
                key={itemIds[index]}
                id={itemIds[index]}
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
