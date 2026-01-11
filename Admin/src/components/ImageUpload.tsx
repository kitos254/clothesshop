import React, { useState, useRef } from 'react';
import { X, Upload, ImageIcon, Loader2, Edit, Crop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import CropModal from '@/pages/Products/components/cropModal';
import axios from '@/lib/axios';

interface ImageUploadProps {
  productId?: string;
  images: Array<{
    _id?: string;
    url: string;
    alt: string;
    isPrimary: boolean;
    file?: File;
    isPreview?: boolean;
  }>;
  onImagesChange: (images: any[]) => void;
  maxImages?: number;
}

interface ImageToCrop {
  id: string;
  file: File;
  url: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  productId,
  images,
  onImagesChange,
  maxImages = 10
}) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imagesToCrop, setImagesToCrop] = useState<ImageToCrop[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: `${file.name} is not an image file`,
          variant: "destructive",
        });
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    if (images.length + validFiles.length > maxImages) {
      toast({
        title: "Too Many Images",
        description: `Maximum ${maxImages} images allowed`,
        variant: "destructive",
      });
      return;
    }

    // Always crop first, then add to preview - no immediate upload
    prepareFilesForCropping(validFiles);
  };

  const prepareFilesForCropping = (files: File[]) => {
    const imagesToCrop: ImageToCrop[] = files.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      url: URL.createObjectURL(file)
    }));
    
    setImagesToCrop(imagesToCrop);
    setShowCropModal(true);
  };

  const handleCropComplete = (croppedImages: { id: string; file: File }[]) => {
    setShowCropModal(false);
    
    // Clean up object URLs
    imagesToCrop.forEach(img => URL.revokeObjectURL(img.url));
    setImagesToCrop([]);

    // Always add to preview first - don't upload immediately
    addImagesToPreview(croppedImages.map(img => img.file));
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    
    // Clean up object URLs
    imagesToCrop.forEach(img => URL.revokeObjectURL(img.url));
    setImagesToCrop([]);
  };

  const uploadAllPreviewImages = async () => {
    const previewImages = images.filter(img => img.isPreview && img.file);
    if (previewImages.length === 0) {
      toast({
        title: "No Images to Upload",
        description: "Please add some images first",
        variant: "destructive",
      });
      return;
    }

    if (!productId) {
      toast({
        title: "Cannot Upload",
        description: "Please save the product first to upload images",
        variant: "destructive",
      });
      return;
    }

    const files = previewImages.map(img => img.file!);
    await uploadImagesToProduct(files);
  };

  const uploadImagesToProduct = async (files: File[]) => {
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      const response = await axios.post(`/products/${productId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // Update the images array to replace preview images with uploaded ones
        const updatedImages = images.map(img => {
          if (img.isPreview && img.file && files.includes(img.file)) {
            // This preview image was just uploaded, so we'll replace it with server data
            return null; // Will be filtered out
          }
          return img;
        }).filter(Boolean); // Remove null entries

        // Add the newly uploaded images from server response
        const newUploadedImages = response.data.data.product.images || [];
        onImagesChange([...updatedImages, ...newUploadedImages]);

        toast({
          title: "Success",
          description: `${response.data.data.newImages} images uploaded successfully`,
        });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.response?.data?.message || "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const addImagesToPreview = (files: File[]) => {
    const newImagePreviews = files.map((file, index) => ({
      url: URL.createObjectURL(file),
      alt: file.name,
      isPrimary: images.length === 0 && index === 0,
      file, // Store the file for later upload
      isPreview: true
    }));

    onImagesChange([...images, ...newImagePreviews]);
  };

  const removeImage = async (index: number) => {
    const imageToRemove = images[index];
    
    if (productId && imageToRemove._id) {
      // Remove from server
      try {
        await axios.delete(`/products/${productId}/images`, {
          data: { imageIds: [imageToRemove._id] }
        });
        
        const updatedImages = images.filter((_, i) => i !== index);
        onImagesChange(updatedImages);
        
        toast({
          title: "Success",
          description: "Image removed successfully",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to remove image",
          variant: "destructive",
        });
      }
    } else {
      // Remove from preview
      const updatedImages = images.filter((_, i) => i !== index);
      
      // Update primary if needed
      if (imageToRemove.isPrimary && updatedImages.length > 0) {
        updatedImages[0].isPrimary = true;
      }
      
      onImagesChange(updatedImages);
      
      // Cleanup object URL if it's a preview
      if (imageToRemove.isPreview) {
        URL.revokeObjectURL(imageToRemove.url);
      }
    }
  };

  const editImage = (index: number) => {
    const imageToEdit = images[index];
    if (imageToEdit.isPreview && imageToEdit.file) {
      // Prepare for cropping
      const imagesToCrop: ImageToCrop[] = [{
        id: `edit-${Date.now()}`,
        file: imageToEdit.file,
        url: imageToEdit.url
      }];
      
      setImagesToCrop(imagesToCrop);
      setShowCropModal(true);
    }
  };

  const setPrimaryImage = (index: number) => {
    const updatedImages = images.map((img, i) => ({
      ...img,
      isPrimary: i === index
    }));
    onImagesChange(updatedImages);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Button for Preview Images */}
      {images.some(img => img.isPreview) && (
        <div className="flex justify-center">
          <Button
            type="button"
            onClick={uploadAllPreviewImages}
            disabled={uploading}
            className="bg-primary hover:bg-primary/90"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {images.filter(img => img.isPreview).length} Photo{images.filter(img => img.isPreview).length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Image Grid with Add Button */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Existing Images */}
        {images.map((image, index) => (
          <Card key={index} className="relative group">
            <CardContent className="p-0">
              {/* 3:4 aspect ratio container */}
              <div className="relative" style={{ aspectRatio: '3/4' }}>
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-full object-cover rounded"
                />
                
                {/* Primary Badge */}
                {image.isPrimary && (
                  <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                    Primary
                  </div>
                )}
                
                {/* Preview Badge */}
                {image.isPreview && (
                  <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    Preview
                  </div>
                )}
                
                {/* Uploaded Badge */}
                {!image.isPreview && (
                  <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-2 py-1 rounded">
                    Uploaded
                  </div>
                )}
                
                {/* Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1">
                  {!image.isPrimary && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPrimaryImage(index)}
                      className="text-xs px-2 py-1 h-auto"
                    >
                      Set Primary
                    </Button>
                  )}
                  
                  {/* Edit button for preview images */}
                  {image.isPreview && image.file && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => editImage(index)}
                      className="text-xs px-2 py-1 h-auto"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeImage(index)}
                    className="text-xs px-2 py-1 h-auto"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add Images Placeholder */}
        {images.length < maxImages && (
          <Card className="relative group cursor-pointer hover:bg-muted/50 transition-colors">
            <CardContent className="p-0">
              <div 
                className="relative border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 rounded flex items-center justify-center transition-colors"
                style={{ aspectRatio: '3/4' }}
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center space-y-2 text-center p-4">
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <Crop className="h-8 w-8 text-muted-foreground" />
                  )}
                  
                  <div className="text-sm">
                    <p className="font-medium text-muted-foreground">
                      {uploading ? 'Processing...' : 'Add Images'}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      Click or drop here
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Crop Modal */}
      <CropModal
        isOpen={showCropModal}
        images={imagesToCrop}
        onCropAll={handleCropComplete}
        onCancel={handleCropCancel}
        onAddImages={(files) => {
          // Allow adding more images during cropping
          prepareFilesForCropping(files);
        }}
      />
    </div>
  );
};

export default ImageUpload;
