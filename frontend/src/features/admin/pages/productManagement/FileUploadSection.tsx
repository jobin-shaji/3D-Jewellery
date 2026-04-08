import React from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Box, Image, X, Cpu } from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import { ModelGenerationModal } from "./ModelGenerationModal";

// Local types for FileUploadSection
export interface FileUploadState {
  model3DFile: File | null;
  imageFiles: File[];
  model3DPreview: string;
  imagePreviews: string[];
}

export interface FileUploadProps {
  fileState: FileUploadState;
  onModel3DUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onRemove3DModel: () => void;
  reconstructionJobId?: string | null;
  onReconstructionJobCreated?: (jobId: string) => void;
}

export const FileUploadSection: React.FC<FileUploadProps> = ({
  fileState,
  onModel3DUpload,
  onImageUpload,
  onRemoveImage,
  onRemove3DModel,
  reconstructionJobId,
  onReconstructionJobCreated
}) => {
  const { toast } = useToast();

  const handle3DModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB limit due to Cloudinary free plan)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "3D model files must be under 10MB due to Cloudinary free plan limits. Please compress your model.",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      const allowedTypes = ['.glb', '.gltf', '.obj', '.fbx'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedTypes.includes(fileExtension)) {
        toast({
          title: "Invalid File Type",
          description: "Please select a .glb, .gltf, .obj, or .fbx file.",
          variant: "destructive",
        });
        return;
      }

      onModel3DUpload(e);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate each file
    const validFiles: File[] = [];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    for (const file of files) {
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: `${file.name} is too large. Images must be under 5MB.`,
          variant: "destructive",
        });
        continue;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not a valid image file.`,
          variant: "destructive",
        });
        continue;
      }
      
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    onImageUpload(e);
  };

  return (
    <div className="border-t pt-6">
      <h3 className="text-lg font-semibold mb-4">Product Files</h3>

      {/* 3D Model Upload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-2">
          <Label htmlFor="model3d">3D Model File</Label>
          <p className="text-sm text-muted-foreground">
            Supported formats: .glb, .gltf, .obj, .fbx (max 10MB)
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                id="model3d"
                type="file"
                accept=".glb,.gltf,.obj,.fbx"
                onChange={handle3DModelUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("model3d")?.click()}
                className="w-full"
              >
                <Box className="h-4 w-4 mr-2" />
                Choose 3D Model
              </Button>
              {onReconstructionJobCreated && (
                <ModelGenerationModal onJobCreated={onReconstructionJobCreated} />
              )}
            </div>
            
            {reconstructionJobId && !fileState.model3DPreview && (
              <div className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded text-blue-800">
                <div className="flex items-center">
                  <Cpu className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">3D Generation Pipeline Running</span>
                </div>
              </div>
            )}

            {fileState.model3DPreview && (
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <span className="text-sm">{fileState.model3DPreview}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onRemove3DModel}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Product Images Upload */}
        <div className="space-y-2">
          <Label htmlFor="images">Product Images</Label>
          <p className="text-sm text-muted-foreground">
            Supported formats: .jpeg, .png, .webp (max 5MB)
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("images")?.click()}
                className="w-full"
              >
                <Image className="h-4 w-4 mr-2" />
                Add Images
              </Button>
            </div>

            {/* Image Previews */}
            {fileState.imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {fileState.imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onRemoveImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {fileState.imageFiles.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {fileState.imageFiles.length} image(s) selected
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
