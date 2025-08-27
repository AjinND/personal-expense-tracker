// src/components/profile/ProfilePhotoUpload.tsx
"use client";

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string;
  userName: string;
  onPhotoUpdate: (photoUrl: string) => Promise<void> | void;
  maxSizeBytes?: number;
  acceptedFormats?: string[];
}

export const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  currentPhotoUrl,
  userName,
  onPhotoUpdate,
  maxSizeBytes = 2 * 1024 * 1024, // 2MB default
  acceptedFormats = ['image/jpeg', 'image/png', 'image/gif']
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      return `Invalid file type. Please select ${acceptedFormats.join(', ')}`;
    }

    // Check file size
    if (file.size > maxSizeBytes) {
      const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
      return `File size must be less than ${maxSizeMB}MB`;
    }

    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      toast({
        title: "Invalid File",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);

      const response = await fetch('/api/profile/photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();

      if (data.success) {
        await onPhotoUpdate(data.photoUrl);
        setPreviewUrl(null);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        toast({
          title: "Success",
          description: "Profile photo updated successfully"
        });
      } else {
        throw new Error(data.error || 'Upload failed');
      }

    } catch (error) {
      console.error('Photo upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload photo",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const displayPhotoUrl = previewUrl || currentPhotoUrl;

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={displayPhotoUrl} alt={userName} />
          <AvatarFallback className="bg-blue-600 text-white text-xl">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-2">
          {!previewUrl ? (
            <Button
              variant="outline"
              size="sm"
              onClick={triggerFileSelect}
              disabled={isUploading}
            >
              <Camera className="h-4 w-4 mr-2" />
              Change Photo
            </Button>
          ) : (
            <div className="space-x-2">
              <Button
                size="sm"
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isUploading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Select profile photo"
          />

          <p className="text-sm text-gray-500">
            JPG or PNG. Max size {Math.round(maxSizeBytes / (1024 * 1024))}MB.
          </p>
        </div>
      </div>

      {selectedFile && (
        <Alert>
          <AlertDescription>
            Ready to upload: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};