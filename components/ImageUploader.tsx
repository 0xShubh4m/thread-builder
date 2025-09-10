// /components/ImageUploader.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ImageUploaderProps {
  onImageSelected: (url: string, alt: string) => void;
  onClose: () => void;
  type: "image" | "video";
}

type UnsplashItem = { id: string; url: string; alt: string };

const VALID_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;
const VALID_VIDEO_TYPES = ["video/mp4", "video/webm"] as const;

const MAX_FILE_MB = 25;

export default function ImageUploader({
  onImageSelected,
  onClose,
  type,
}: ImageUploaderProps) {
  const isImage = type === "image";
  const { toast } = useToast();

  // ui state
  const [tab, setTab] = useState<"upload" | "unsplash">("upload");
  const [isLoading, setIsLoading] = useState(false);

  // upload state
  const [altText, setAltText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // unsplash state
  const [searchQuery, setSearchQuery] = useState("");
  const [unsplashImages, setUnsplashImages] = useState<UnsplashItem[]>([]);
  const [selectedUnsplash, setSelectedUnsplash] = useState<UnsplashItem | null>(
    null
  );

  // debouncer
  const debounceRef = useRef<number | null>(null);

  // derive valid types
  const validTypes = useMemo(
    () => (isImage ? VALID_IMAGE_TYPES : VALID_VIDEO_TYPES),
    [isImage]
  );

  // cleanup object URL whenever file/preview changes or unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // clear Unsplash selection when switching back to upload
  useEffect(() => {
    if (tab === "upload") setSelectedUnsplash(null);
  }, [tab]);

  const fileTooLarge = (file: File) =>
    file.size / (1024 * 1024) > MAX_FILE_MB;

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!validTypes.includes(file.type as any)) {
        toast({
          title: `Invalid ${type} format`,
          description: isImage
            ? "Please select a valid image (JPEG, PNG, GIF, WEBP)."
            : "Please select a valid video (MP4, WEBM).",
          variant: "destructive",
        });
        e.currentTarget.value = "";
        return;
      }

      if (fileTooLarge(file)) {
        toast({
          title: "File too large",
          description: `Max size is ${MAX_FILE_MB}MB`,
          variant: "destructive",
        });
        e.currentTarget.value = "";
        return;
      }

      // cleanup last preview
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return prev;
      });

      const objectUrl = URL.createObjectURL(file);
      setSelectedFile(file);
      setPreviewUrl(objectUrl);

      // default alt from filename if empty and it's an image
      if (isImage && !altText) {
        const base = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ");
        setAltText(base);
      }
    },
    [altText, isImage, type, validTypes, toast]
  );

  // mock unsplash search (debounced)
  const searchUnsplash = useCallback(async (query: string) => {
    if (!query.trim()) {
      setUnsplashImages([]);
      return;
    }
    setIsLoading(true);
    try {
      // simulate API latency
      await new Promise((r) => setTimeout(r, 600));
      const results: UnsplashItem[] = Array.from({ length: 9 }, (_, idx) => ({
        id: `mock-${idx}`,
        url: `/api/placeholder/${300 + ((idx % 3) + 1) * 100}/${
          200 + ((idx % 2) + 1) * 100
        }`,
        alt: `${query} image ${idx + 1}`,
      }));
      setUnsplashImages(results);
    } catch (err) {
      console.error(err);
      toast({
        title: "Search failed",
        description: "Could not fetch images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // debounce on change
  const onSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;
      setSearchQuery(q);
      setSelectedUnsplash(null);

      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
      debounceRef.current = window.setTimeout(() =>
