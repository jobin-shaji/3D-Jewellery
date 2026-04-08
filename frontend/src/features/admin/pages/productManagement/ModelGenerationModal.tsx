import React, { useState } from 'react';
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useToast } from "@/shared/hooks/use-toast";
import { Box, Loader2, UploadCloud } from "lucide-react";

interface ModelGenerationModalProps {
  onJobCreated: (jobId: string) => void;
}

export const ModelGenerationModal: React.FC<ModelGenerationModalProps> = ({ onJobCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [quality, setQuality] = useState<string>('fast');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length < 5) {
        toast({
          title: "Not enough images",
          description: "Photogrammetry requires at least 5 images, but 20+ is recommended.",
          variant: "destructive"
        });
        return;
      }
      setImages(files);
    }
  };

  const handleStartGeneration = async () => {
    if (images.length === 0) return;

    setIsUploading(true);
    
    const formData = new FormData();
    images.forEach(img => {
      formData.append('files', img);
    });

    let endpoint = '/upload_fast';
    if (quality === 'medium') endpoint = '/upload_fast2';
    if (quality === 'normal') endpoint = '/upload_fast3';
    if (quality === 'detailed') endpoint = '/upload';
    
    try {
      const baseUrl = import.meta.env.VITE_PYTHON_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        body: formData,
        // Let the browser set Content-Type to multipart/form-data with boundary
      });

      if (!response.ok) {
        throw new Error(`Failed to upload images: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.job_id) {
        toast({
          title: "3D Generation Started",
          description: `Job submitted successfully. You can now save the product. Status will be tracked automatically.`,
        });
        onJobCreated(data.job_id);
        setIsOpen(false);
        setImages([]); // Reset state
      } else {
        throw new Error('No job_id returned from the server.');
      }
    } catch (error: any) {
      console.error("Error creating 3D generation job:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Could not connect to the Python backend. Ensure it is running.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full">
          <UploadCloud className="h-4 w-4 mr-2" />
          Generate from Images
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate 3D Model</DialogTitle>
          <DialogDescription>
            Upload overlapping photos of your product to generate a 3D model using photogrammetry.
            This process takes time and will run in the background.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="photos">Select Images (20+ recommended)</Label>
            <Input
              id="photos"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              disabled={isUploading}
            />
            {images.length > 0 && (
              <p className="text-sm text-green-600 font-medium">
                {images.length} images selected ready for upload.
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="quality">Generation Quality</Label>
            <Select value={quality} onValueChange={setQuality} disabled={isUploading}>
              <SelectTrigger id="quality">
                <SelectValue placeholder="Select quality level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fast">Fast (Lower quality, ~1-3 mins)</SelectItem>
                <SelectItem value="medium">Medium (Moderate quality, ~3-5 mins)</SelectItem>
                <SelectItem value="normal">Normal (Good quality, ~5-15 mins)</SelectItem>
                <SelectItem value="detailed">Detailed (High quality, ~10-30 mins)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleStartGeneration} 
            disabled={images.length === 0 || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Box className="h-4 w-4 mr-2" />
                Start Generation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
