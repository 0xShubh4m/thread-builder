// /components/ImageUploader.tsx
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ImageUploaderProps {
  onImageSelected: (url: string, alt: string) => void;
  onClose: () => void;
  type: 'image' | 'video';
}

export default function ImageUploader({ onImageSelected, onClose, type }: ImageUploaderProps) {
  const [tab, setTab] = useState<string>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [altText, setAltText] = useState('');
  const [unsplashImages, setUnsplashImages] = useState<Array<{id: string; url: string; alt: string}>>([]);
  const [selectedUnsplashImage, setSelectedUnsplashImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  // Clear the file preview when unmounting
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validTypes = type === 'image' 
      ? ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] 
      : ['video/mp4', 'video/webm'];
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: `Invalid ${type} format`,
        description: type === 'image' 
          ? "Please select a valid image (JPEG, PNG, GIF, WEBP)" 
          : "Please select a valid video (MP4, WEBM)",
        variant: "destructive",
      });
      return;
    }

    // Create a preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setSelectedFile(file);
  };

  // Handle Unsplash search
  const searchUnsplash = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Empty search",
        description: "Please enter a search term",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Mock Unsplash API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock results
      const mockResults = Array(9).fill(0).map((_, idx) => ({
        id: `mock-${idx}`,
        url: `/api/placeholder/${300 + (idx % 3) * 100}/${200 + (idx % 2) * 100}`,
        alt: `${searchQuery} image ${idx + 1}`
      }));
      
      setUnsplashImages(mockResults);
    } catch (error) {
      console.error('Error searching Unsplash:', error);
      toast({
        title: "Search failed",
        description: "Failed to search for images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile && !selectedUnsplashImage) {
      toast({
        title: "No media selected",
        description: `Please select a ${type} to upload`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Mock upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let url;
      if (selectedFile) {
        // In a real implementation, this would be a file upload to a server or cloud storage
        // For now, we'll just use the object URL as a placeholder
        url = previewUrl;
      } else if (selectedUnsplashImage) {
        // In a real implementation, this would download the image from Unsplash and save it
        url = selectedUnsplashImage;
      }
      
      if (url) {
        onImageSelected(url, altText);
        toast({
          title: "Upload successful",
          description: `${type === 'image' ? 'Image' : 'Video'} has been added to your thread`,
        });
      }
    } catch (error) {
      console.error('Error uploading:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {type === 'image' ? 'Add Image' : 'Add Video'}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs 
          defaultValue="upload" 
          value={tab} 
          onValueChange={setTab}
          className="w-full mt-2"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            {type === 'image' && (
              <TabsTrigger value="unsplash">Unsplash</TabsTrigger>
            )}
            {type === 'video' && (
              <TabsTrigger value="unsplash" disabled>Unsplash (Images Only)</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="upload" className="mt-4 space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="media-upload">{type === 'image' ? 'Image' : 'Video'}</Label>
              <Input 
                id="media-upload" 
                type="file" 
                accept={type === 'image' ? "image/*" : "video/*"}
                onChange={handleFileSelect}
              />
            </div>
            
            {previewUrl && (
              <div className="mt-4">
                {type === 'image' ? (
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-h-64 max-w-full object-contain rounded-md"
                  />
                ) : (
                  <video 
                    src={previewUrl}
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
                placeholder="Describe the media content for accessibility"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="unsplash" className="mt-4 space-y-4">
            <div className="flex gap-2">
              <Input 
                placeholder="Search Unsplash images..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchUnsplash()}
              />
              <Button onClick={searchUnsplash} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            
            {unsplashImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {unsplashImages.map((image) => (
                  <div 
                    key={image.id}
                    className={`relative cursor-pointer overflow-hidden rounded-md border-2 ${
                      selectedUnsplashImage === image.url 
                        ? 'border-blue-500 ring-2 ring-blue-500' 
                        : 'border-transparent'
                    }`}
                    onClick={() => setSelectedUnsplashImage(image.url)}
                  >
                    <img 
                      src={image.url} 
                      alt={image.alt} 
                      className="h-32 w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
            
            {selectedUnsplashImage && (
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="unsplash-alt-text">Alt Text</Label>
                <Input 
                  id="unsplash-alt-text" 
                  placeholder="Describe the image content for accessibility"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleUpload} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
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