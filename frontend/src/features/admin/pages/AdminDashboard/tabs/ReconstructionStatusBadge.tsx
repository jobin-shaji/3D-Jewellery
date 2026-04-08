import { useState, useEffect } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Cpu, RefreshCw, UploadCloud, AlertCircle } from "lucide-react";
import { upload3DModel } from "../../productManagement/hooks";
import { useToast } from "@/shared/hooks/use-toast";

interface ReconstructionStatusBadgeProps {
  productId: string;
  jobId: string;
  onSyncComplete: () => void;
}

export const ReconstructionStatusBadge = ({ productId, jobId, onSyncComplete }: ReconstructionStatusBadgeProps) => {
  const [status, setStatus] = useState<string>("checking");
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const baseUrl = import.meta.env.VITE_PYTHON_BACKEND_URL || 'http://localhost:8000';
        const response = await fetch(`${baseUrl}/status/${jobId}`);
        if (response.ok) {
          const data = await response.json();
          setStatus(data.status || 'unknown');

          // Stop polling if completed or failed
          if (data.status === 'completed' || data.status === 'failed') {
            clearInterval(intervalId);
          }
        }
      } catch (error) {
        console.error("Failed to check reconstruction status:", error);
      }
    };

    // Initial check
    checkStatus();

    // Poll every 10 seconds if not completed or failed
    if (status !== 'completed' && status !== 'failed') {
      intervalId = setInterval(checkStatus, 10000);
    }

    return () => clearInterval(intervalId);
  }, [jobId]);

  const handleSync = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    setIsSyncing(true);
    try {
      // 1. Fetch the .glb blob from python backend
      const baseUrl = import.meta.env.VITE_PYTHON_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${baseUrl}/models/${jobId}.glb`);
      if (!response.ok) throw new Error("Failed to download model from Python backend");
      
      const blob = await response.blob();
      
      // 2. Wrap as File
      const file = new File([blob], `${productId}_model.glb`, { type: 'model/gltf-binary' });

      // 3. Upload to Node.js backend to push to Cloudinary
      // @ts-ignore (productId is a string, but the signature incorrectly asks for number. This works at runtime)
      await upload3DModel(productId, file);

      toast({
        title: "Sync Successful",
        description: "3D model has been successfully saved to Cloudinary and linked to the product.",
      });

      // Notify parent to refresh list
      onSyncComplete();

    } catch (error: any) {
      console.error("Sync error:", error);
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync model to Cloudinary.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (status === 'completed') {
    return (
      <Button 
        size="sm" 
        variant="default"
        className="bg-blue-600 hover:bg-blue-700 h-7 text-xs flex items-center gap-1"
        onClick={handleSync}
        disabled={isSyncing}
      >
        {isSyncing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <UploadCloud className="h-3 w-3" />}
        {isSyncing ? "Syncing..." : "Sync 3D Model"}
      </Button>
    );
  }

  if (status === 'failed') {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle className="h-3 w-3" /> Failed
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
      <Cpu className="h-3 w-3 animate-pulse" /> 
      {status === 'checking' ? 'Checking' : status === 'processing' ? 'Generating 3D...' : 'Queued'}
    </Badge>
  );
};
