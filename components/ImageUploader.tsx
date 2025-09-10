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
      debounceRef.current = window.setTimeout(() => {
        searchUnsplash(q);
      }, 350);
    },
    [searchUnsplash]
  );

  const onSearchSubmit = useCallback(() => searchUnsplash(searchQuery), [
    searchUnsplash,
    searchQuery,
  ]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile && !selectedUnsplash) {
      toast({
        title: "No media selected",
        description: `Please select a ${type} to upload.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 600)); // mock upload

      // resolve URL
      const url = selectedFile ? previewUrl : selectedUnsplash?.url;
      if (!url) throw new Error("No URL resolved");

      const finalAlt =
        altText?.trim() ||
        (selectedUnsplash?.alt ?? (selectedFile?.name ?? type).toString());

      onImageSelected(url, finalAlt);
      toast({
        title: "Upload successful",
        description: `${isImage ? "Image" : "Video"} added to your thread.`,
      });

      // reset only the mutable bits; keep tab and search history
      setSelectedFile(null);
      setSelectedUnsplash(null);
      setAltText("");
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setTab("upload");
    } catch (err) {
      console.error(err);
      toast({
        title: "Upload failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    altText,
    isImage,
    onImageSelected,
    previewUrl,
    selectedFile,
    selectedUnsplash,
    toast,
    type,
  ]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isImage ? "Add Image" : "Add Video"}</DialogTitle>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v: typeof tab) => setTab(v)}
          className="w-full mt-2"
          defaultValue="upload"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            {isImage ? (
              <TabsTrigger value="unsplash">Unsplash</TabsTrigger>
            ) : (
              <TabsTrigger value="unsplash" disabled>
                Unsplash (Images Only)
              </TabsTrigger>
            )}
          </TabsList>

          {/* UPLOAD TAB */}
          <TabsContent value="upload" className="mt-4 space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="media-upload">
                {isImage ? "Image" : "Video"}
              </Label>
              <Input
                id="media-upload"
                type="file"
                accept={isImage ? VALID_IMAGE_TYPES.join(",") : VALID_VIDEO_TYPES.join(",")}
                onChange={handleFileSelect}
                aria-label={`Select a ${type} file`}
              />
            </div>

            {previewUrl && (
              <div className="mt-4">
                {isImage ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-64 max-w-full object-contain rounded-md"
                  />
                ) : (
                  <video
                    src={previewUrl ?? ""}
                    controls
                    className="max-h-64 max-w-full rounded-md"
                  />
                )}
              </div>
            )}

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="alt-text">Alt Text</Label>
              <Input
                id="alt-text"
                placeholder="Describe the media for accessibility"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
              />
            </div>
          </TabsContent>

          {/* UNSPLASH TAB */}
          <TabsContent value="unsplash" className="mt-4 space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search Unsplash images…"
                value={searchQuery}
                onChange={onSearchChange}
                onKeyDown={(e) => e.key === "Enter" && onSearchSubmit()}
                aria-label="Search Unsplash"
              />
              <Button onClick={onSearchSubmit} disabled={isLoading} title="Search">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {unsplashImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {unsplashImages.map((img) => {
                  const active = selectedUnsplash?.id === img.id;
                  return (
                    <button
                      key={img.id}
                      type="button"
                      className={`relative cursor-pointer overflow-hidden rounded-md border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        active ? "border-blue-500 ring-2 ring-blue-500" : "border-transparent"
                      }`}
                      onClick={() => setSelectedUnsplash(img)}
                      aria-pressed={active}
                      title={img.alt}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.alt} className="h-32 w-full object-cover" />
                    </button>
                  );
                })}
              </div>
            )}

            {selectedUnsplash && (
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="unsplash-alt-text">Alt Text</Label>
                <Input
                  id="unsplash-alt-text"
                  placeholder="Describe the image for accessibility"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
