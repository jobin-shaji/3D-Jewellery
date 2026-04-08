import React, { useState } from "react";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { FileText, Plus, X } from "lucide-react";

// Local types for SpecificationsForm
export interface Certification {
  name: string;
  file: File | null;
  fileName: string;
}

// Since this component doesn't use the full FormSectionProps, we'll create a minimal interface
export interface SpecificationsFormProps {
  // This component is now self-contained for certifications
  onCertificationsChange?: (certifications: Certification[]) => void;
}

export const SpecificationsForm: React.FC<SpecificationsFormProps> = ({
  onCertificationsChange
}) => {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [newCertification, setNewCertification] = useState<Certification>({
    name: "",
    file: null,
    fileName: ""
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewCertification(prev => ({
        ...prev,
        file,
        fileName: file.name
      }));
    }
  };

  const addCertification = () => {
    if (newCertification.name.trim() && newCertification.file) {
      const updatedCertifications = [...certifications, { ...newCertification }];
      setCertifications(updatedCertifications);
      setNewCertification({ name: "", file: null, fileName: "" });
      
      // Notify parent component of the change
      if (onCertificationsChange) {
        onCertificationsChange(updatedCertifications);
      }
    }
  };

  const removeCertification = (index: number) => {
    const updatedCertifications = certifications.filter((_, i) => i !== index);
    setCertifications(updatedCertifications);
    
    // Notify parent component of the change
    if (onCertificationsChange) {
      onCertificationsChange(updatedCertifications);
    }
  };

  return (
    <div className="border-t pt-6">
      <h3 className="text-lg font-semibold mb-4">Certifications</h3>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Certification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="certificationName">Certification Name</Label>
              <Input
                id="certificationName"
                value={newCertification.name}
                onChange={(e) => setNewCertification(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., GIA Certified Diamond"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="certificationFile">Certification file</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="certificationFile"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("certificationFile")?.click()}
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {newCertification.fileName || "Choose File"}
                </Button>
              </div>
            </div>
          </div>
          
          <Button
            type="button"
            onClick={addCertification}
            disabled={!newCertification.name.trim() || !newCertification.file}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Certification
          </Button>
        </CardContent>
      </Card>

      {/* Display added certifications */}
      {certifications.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="font-medium">Added Certifications</h4>
          {certifications.map((cert, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded border">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{cert.name}</p>
                  <p className="text-sm text-muted-foreground">{cert.fileName}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeCertification(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
