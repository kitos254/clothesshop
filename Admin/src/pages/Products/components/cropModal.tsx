import { useRef, useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Crop, RefreshCw, ChevronLeft, ChevronRight, X, Plus } from 'lucide-react'

interface ImageToCrop {
  id: string
  file: File
  url: string
}

interface CropModalProps {
  isOpen: boolean
  images: ImageToCrop[]
  onCropAll: (croppedImages: { id: string; file: File }[]) => void
  onCancel: () => void
  onAddImages?: (files: File[]) => void
}

export default function CropModal({ isOpen, images, onCropAll, onCancel, onAddImages }: CropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // State for multiple images
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [croppedImages, setCroppedImages] = useState<{ [key: string]: File }>({})
  const [imagesToRemove, setImagesToRemove] = useState<Set<string>>(new Set())
  
  // State for image manipulation
  const [imageLoaded, setImageLoaded] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [imageScale, setImageScale] = useState(1) // Scale to fit image in container
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 300, height: 400 })
  const [isDraggingCrop, setIsDraggingCrop] = useState(false)
  const [isDraggingCorner, setIsDraggingCorner] = useState('')
  const [cropDragStart, setCropDragStart] = useState({ x: 0, y: 0 })
  const [showCroppedVersion, setShowCroppedVersion] = useState(false)

  // Constants - Fixed 3:4 aspect ratio
  const getAspectRatio = () => 3 / 4

  // Get current image
  const currentImage = images[currentImageIndex]
  const filteredImages = images.filter(img => !imagesToRemove.has(img.id))

  // Reset states when switching images
  const resetImageStates = useCallback(() => {
    setImageLoaded(false)
    // Don't reset rotation when switching images - let users maintain their preferred rotation
    setImageScale(1)
    setIsDraggingCrop(false)
    setIsDraggingCorner('')
    // Always start in crop mode when picking a new image
    setShowCroppedVersion(false)
  }, [])

  // Force recalculation of layout when image loads
  const recalculateLayout = useCallback(() => {
    if (!imageRef.current || !containerRef.current || !currentImage) return
    
    const img = imageRef.current
    const container = containerRef.current
    
    // Ensure image dimensions are available
    if (!img.naturalWidth || !img.naturalHeight) return
    
    // Calculate scale to fit image in container while showing it fully
    const containerRect = container.getBoundingClientRect()
    const containerWidth = containerRect.width - 40 // Account for padding
    const containerHeight = containerRect.height - 40
    
    const imageWidth = img.naturalWidth
    const imageHeight = img.naturalHeight
    
    // Calculate scale to fit image completely in container
    const scaleX = containerWidth / imageWidth
    const scaleY = containerHeight / imageHeight
    const fitScale = Math.min(scaleX, scaleY, 1) // Don't scale up beyond natural size
    
    setImageScale(fitScale)
    
    // Calculate displayed image dimensions
    const displayWidth = imageWidth * fitScale
    const displayHeight = imageHeight * fitScale
    
    // Calculate maximum crop dimensions that fit within the scaled image
    let cropWidth, cropHeight
    const currentAspectRatio = getAspectRatio()
    
    if (displayWidth / displayHeight > currentAspectRatio) {
      // Image is wider than current aspect ratio, constrain by height
      cropHeight = displayHeight
      cropWidth = cropHeight * currentAspectRatio
    } else {
      // Image is taller than current aspect ratio, constrain by width
      cropWidth = displayWidth
      cropHeight = cropWidth / currentAspectRatio
    }
    
    // Center the crop box on the displayed image
    const imageDisplayX = (containerRect.width - displayWidth) / 2
    const imageDisplayY = (containerRect.height - displayHeight) / 2
    
    setCropBox({
      x: imageDisplayX + (displayWidth - cropWidth) / 2,
      y: imageDisplayY + (displayHeight - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight
    })
  }, [currentImage])

  // Recalculate layout when image loads or changes
  useEffect(() => {
    if (imageLoaded && !showCroppedVersion) {
      recalculateLayout()
    }
  }, [imageLoaded, showCroppedVersion, recalculateLayout])

  // Initialize image and crop box when modal opens or image changes
  useEffect(() => {
    if (isOpen && currentImage && imageRef.current && containerRef.current) {
      // Only reset image states if switching images or opening modal, not when changing aspect ratio
      resetImageStates()

      // Only show cropped version if user was already viewing it
      // Do NOT automatically show cropped version when switching aspect ratio
      // If the image was previously cropped, do NOT setShowCroppedVersion(true) here

      const img = imageRef.current
      const container = containerRef.current

      const onLoad = () => {
        // Ensure image dimensions are available
        if (!img.naturalWidth || !img.naturalHeight) {
          return
        }

        setImageLoaded(true)
        // Don't reset rotation when image loads - preserve user's rotation choice

        // Use the recalculate function
        recalculateLayout()
      }

      // Set the image source to trigger loading
      img.src = getDisplayImageUrl()

      // Always add the load listener, even if image appears complete
      img.addEventListener('load', onLoad)

      // Also check if image is already loaded
      if (img.complete && img.naturalWidth && img.naturalHeight) {
        onLoad()
      }

      return () => img.removeEventListener('load', onLoad)
    }
  }, [isOpen, currentImage, resetImageStates, recalculateLayout])

  // Handle crop functionality
  const handleCropCurrent = async () => {
    if (!canvasRef.current || !imageRef.current || !imageLoaded || !currentImage) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    const img = imageRef.current

    // Calculate crop area in original image coordinates
    const container = containerRef.current!
    const containerRect = container.getBoundingClientRect()
    
    const displayWidth = img.naturalWidth * imageScale
    const displayHeight = img.naturalHeight * imageScale
    
    const imageX = (containerRect.width - displayWidth) / 2
    const imageY = (containerRect.height - displayHeight) / 2
    
    // Convert crop coordinates back to original image coordinates
    const cropStartX = (cropBox.x - imageX) / imageScale
    const cropStartY = (cropBox.y - imageY) / imageScale
    const cropWidth = cropBox.width / imageScale
    const cropHeight = cropBox.height / imageScale

    // Calculate output dimensions based on the larger dimension to maintain quality
    const currentAspectRatio = getAspectRatio()
    let targetWidth, targetHeight
    
    // Use the actual crop dimensions but scale to a reasonable size for output
    const maxOutputSize = 1200 // Maximum dimension
    if (cropWidth > cropHeight) {
      targetWidth = Math.min(maxOutputSize, cropWidth)
      targetHeight = targetWidth / currentAspectRatio
    } else {
      targetHeight = Math.min(maxOutputSize, cropHeight)
      targetWidth = targetHeight * currentAspectRatio
    }

    // Set canvas size to calculated dimensions
    canvas.width = targetWidth
    canvas.height = targetHeight

    ctx.clearRect(0, 0, targetWidth, targetHeight)

    // Draw cropped image
    ctx.drawImage(
      img,
      Math.max(0, cropStartX),
      Math.max(0, cropStartY),
      Math.min(cropWidth, img.naturalWidth - Math.max(0, cropStartX)),
      Math.min(cropHeight, img.naturalHeight - Math.max(0, cropStartY)),
      0,
      0,
      targetWidth,
      targetHeight
    )

    // Convert to file
    return new Promise<File>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `cropped-${currentImage.file.name}`, { type: 'image/jpeg' })
          resolve(file)
        }
      }, 'image/jpeg', 0.9)
    })
  }

  // Handle saving current image crop
  const handleSaveCurrentCrop = async () => {
    const croppedFile = await handleCropCurrent()
    if (croppedFile) {
      setCroppedImages(prev => ({
        ...prev,
        [currentImage.id]: croppedFile
      }))
      // Automatically show the cropped version after cropping
      setShowCroppedVersion(true)
    }
  }

  // Handle proceeding with cropped images
  const handleProceed = async () => {
    // Check if all images have been cropped
    const allImagesCropped = filteredImages.every(image => croppedImages[image.id])
    
    if (!allImagesCropped) {
      alert('Please edit all the images first')
      return
    }

    // Prepare final result with only already cropped images
    const finalImages: { id: string; file: File }[] = []
    
    for (const image of filteredImages) {
      if (croppedImages[image.id]) {
        finalImages.push({
          id: image.id,
          file: croppedImages[image.id]
        })
      }
    }

    onCropAll(finalImages)
  }

  // Navigation functions
  const goToPrevious = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1)
    }
  }

  const goToNext = () => {
    if (currentImageIndex < filteredImages.length - 1) {
      setCurrentImageIndex(prev => prev + 1)
    }
  }

  const selectImage = (index: number) => {
    setCurrentImageIndex(index)
    // Always show crop mode when switching images (user can view cropped version later)
    setShowCroppedVersion(false)
  }

  // Function to get the display image URL
  const getDisplayImageUrl = () => {
    if (!currentImage) return ''
    if (showCroppedVersion && croppedImages[currentImage.id]) {
      return URL.createObjectURL(croppedImages[currentImage.id])
    }
    return currentImage.url
  }

  // Remove image from list
  const removeCurrentImage = () => {
    if (currentImage) {
      setImagesToRemove(prev => new Set([...prev, currentImage.id]))
      
      // Remove from cropped images
      setCroppedImages(prev => {
        const updated = { ...prev }
        delete updated[currentImage.id]
        return updated
      })
      
      // Navigate to next available image
      const remainingImages = filteredImages.filter(img => img.id !== currentImage.id)
      if (remainingImages.length === 0) {
        onCancel()
        return
      }
      
      if (currentImageIndex >= remainingImages.length) {
        setCurrentImageIndex(remainingImages.length - 1)
      }
    }
  }

  // Reset to initial state
  const handleReset = () => {
    // Reset crop box to maximum size
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current
      const container = containerRef.current
      const containerRect = container.getBoundingClientRect()
      
      const displayWidth = img.naturalWidth * imageScale
      const displayHeight = img.naturalHeight * imageScale
      
      let cropWidth, cropHeight
      const currentAspectRatio = getAspectRatio()
      
      if (displayWidth / displayHeight > currentAspectRatio) {
        cropHeight = displayHeight
        cropWidth = cropHeight * currentAspectRatio
      } else {
        cropWidth = displayWidth
        cropHeight = cropWidth / currentAspectRatio
      }
      
      const imageDisplayX = (containerRect.width - displayWidth) / 2
      const imageDisplayY = (containerRect.height - displayHeight) / 2
      
      setCropBox({
        x: imageDisplayX + (displayWidth - cropWidth) / 2,
        y: imageDisplayY + (displayHeight - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight
      })
    }
  }

  // Handle adding new images
  const handleAddImages = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      if (onAddImages) {
        onAddImages(files)
      }
      // Reset the input value to allow selecting the same files again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Get client coordinates from mouse or touch event
  const getClientCoordinates = (e: React.MouseEvent | React.TouchEvent | TouchEvent | MouseEvent) => {
    if ('touches' in e) {
      return e.touches.length > 0 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: 0, y: 0 }
    }
    return { x: e.clientX, y: e.clientY }
  }

  // Mouse handlers for crop box dragging
  const handleCropMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    const coords = getClientCoordinates(e)
    setIsDraggingCrop(true)
    setCropDragStart({
      x: coords.x - cropBox.x,
      y: coords.y - cropBox.y
    })
  }

  // Touch handlers for crop box dragging
  const handleCropTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation()
    const coords = getClientCoordinates(e)
    setIsDraggingCrop(true)
    setCropDragStart({
      x: coords.x - cropBox.x,
      y: coords.y - cropBox.y
    })
  }

  // Corner dragging handlers
  const handleCornerMouseDown = (e: React.MouseEvent, corner: string) => {
    e.stopPropagation()
    const coords = getClientCoordinates(e)
    setIsDraggingCorner(corner)
    setCropDragStart({
      x: coords.x,
      y: coords.y
    })
  }

  // Touch corner dragging handlers
  const handleCornerTouchStart = (e: React.TouchEvent, corner: string) => {
    e.stopPropagation()
    const coords = getClientCoordinates(e)
    setIsDraggingCorner(corner)
    setCropDragStart({
      x: coords.x,
      y: coords.y
    })
  }

  const handleCropMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current || !imageRef.current) return

    const container = containerRef.current
    const img = imageRef.current
    const containerRect = container.getBoundingClientRect()
    
    // Calculate image boundaries
    const displayWidth = img.naturalWidth * imageScale
    const displayHeight = img.naturalHeight * imageScale
    
    const imageX = (containerRect.width - displayWidth) / 2
    const imageY = (containerRect.height - displayHeight) / 2

    const coords = getClientCoordinates(e)

    if (isDraggingCrop) {
      // Constrain crop box within image boundaries
      const minX = Math.max(0, imageX)
      const maxX = Math.min(containerRect.width - cropBox.width, imageX + displayWidth - cropBox.width)
      const minY = Math.max(0, imageY)
      const maxY = Math.min(containerRect.height - cropBox.height, imageY + displayHeight - cropBox.height)
      
      const newX = Math.max(minX, Math.min(coords.x - cropDragStart.x, maxX))
      const newY = Math.max(minY, Math.min(coords.y - cropDragStart.y, maxY))

      setCropBox(prev => ({
        ...prev,
        x: newX,
        y: newY
      }))
    } else if (isDraggingCorner) {
      // Handle corner dragging for resizing while maintaining aspect ratio
      const deltaX = coords.x - cropDragStart.x
      const deltaY = coords.y - cropDragStart.y
      
      let newWidth = cropBox.width
      let newHeight = cropBox.height
      let newX = cropBox.x
      let newY = cropBox.y

      // Calculate new dimensions based on corner being dragged
      if (isDraggingCorner.includes('right')) {
        newWidth = cropBox.width + deltaX
      } else if (isDraggingCorner.includes('left')) {
        newWidth = cropBox.width - deltaX
        newX = cropBox.x + deltaX
      }

      if (isDraggingCorner.includes('bottom')) {
        newHeight = cropBox.height + deltaY
      } else if (isDraggingCorner.includes('top')) {
        newHeight = cropBox.height - deltaY
        newY = cropBox.y + deltaY
      }

      // Maintain aspect ratio
      const currentAspectRatio = getAspectRatio()
      const targetHeight = newWidth / currentAspectRatio
      const targetWidth = newHeight * currentAspectRatio

      // Choose the dimension that results in a smaller crop box to ensure it fits
      if (targetHeight <= newHeight) {
        newHeight = targetHeight
      } else {
        newWidth = targetWidth
      }

      // Adjust position if dragging from top or left
      if (isDraggingCorner.includes('left')) {
        newX = cropBox.x + cropBox.width - newWidth
      }
      if (isDraggingCorner.includes('top')) {
        newY = cropBox.y + cropBox.height - newHeight
      }

      // Constrain within image boundaries
      const minSize = 50 // Minimum crop size
      
      const maxWidth = Math.min(displayWidth, containerRect.width - Math.max(0, imageX))
      const maxHeight = Math.min(displayHeight, containerRect.height - Math.max(0, imageY))
      
      newWidth = Math.max(minSize, Math.min(newWidth, maxWidth))
      newHeight = Math.max(minSize / currentAspectRatio, Math.min(newHeight, maxHeight))
      
      // Re-enforce aspect ratio after constraining
      if (newWidth / newHeight > currentAspectRatio) {
        newWidth = newHeight * currentAspectRatio
      } else {
        newHeight = newWidth / currentAspectRatio
      }

      // Ensure crop box stays within image bounds
      newX = Math.max(imageX, Math.min(newX, imageX + displayWidth - newWidth))
      newY = Math.max(imageY, Math.min(newY, imageY + displayHeight - newHeight))

      setCropBox({
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      })

      setCropDragStart({
        x: coords.x,
        y: coords.y
      })
    }
  }

  const handleCropMouseUp = () => {
    setIsDraggingCrop(false)
    setIsDraggingCorner('')
  }

  // Add global touch and mouse move/up listeners
  useEffect(() => {
    if (!isDraggingCrop && !isDraggingCorner) return

    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleCropMouseMove(e as any)
    }

    const handleGlobalTouchMove = (e: TouchEvent) => {
      e.preventDefault() // Prevent scrolling while dragging
      handleCropMouseMove(e as any)
    }

    const handleGlobalMouseUp = () => {
      handleCropMouseUp()
    }

    const handleGlobalTouchEnd = () => {
      handleCropMouseUp()
    }

    // Add listeners
    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false })
    document.addEventListener('mouseup', handleGlobalMouseUp)
    document.addEventListener('touchend', handleGlobalTouchEnd)

    return () => {
      // Remove listeners
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('touchmove', handleGlobalTouchMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('touchend', handleGlobalTouchEnd)
    }
  }, [isDraggingCrop, isDraggingCorner, cropBox, imageScale])

  return (
    <>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <Dialog open={isOpen} onOpenChange={() => onCancel()}>
        <DialogContent className="w-screen h-[100dvh] sm:max-w-7xl sm:max-h-[95vh] sm:w-[95vw] sm:h-auto overflow-hidden bg-black text-white border-gray-800 p-0 sm:p-6 flex flex-col z-[11000]" style={{ zIndex: 11000 }}>
        
        {filteredImages.length === 0 ? (
          <div className="flex items-center justify-center h-64 px-4 sm:px-0">
            <p className="text-gray-400">No images to crop</p>
          </div>
        ) : (
          <div className="flex flex-col h-full sm:h-[calc(95vh-120px)] overflow-hidden px-4 sm:px-0 pt-4 sm:pt-0">
            {/* Image Carousel - WhatsApp style */}
            <div className="flex gap-2 p-2 bg-gray-900 rounded-lg border border-gray-800 overflow-x-auto flex-shrink-0 h-20 hide-scrollbar mb-4">
              {filteredImages.map((image, index) => (
                <div key={image.id} className="relative flex-shrink-0">
                  <div
                    className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                      index === currentImageIndex 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => selectImage(index)}
                  >
                    <img
                      src={image.url}
                      alt={`Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {croppedImages[image.id] && (
                      <div className="absolute top-1 left-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full border border-white" />
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (index === currentImageIndex) {
                        removeCurrentImage()
                      } else {
                        setImagesToRemove(prev => new Set([...prev, image.id]))
                      }
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs"
                  >
                    <X className="w-2 h-2 sm:w-3 sm:h-3" />
                  </button>
                </div>
              ))}
              
              {/* Add Image Button - Always visible */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={handleAddImages}
                  className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg border-2 border-dashed border-blue-500 hover:border-blue-400 bg-blue-900/50 hover:bg-blue-800/60 transition-all flex items-center justify-center group shadow-lg"
                  title="Add more images"
                >
                  <Plus className="w-5 h-5 sm:w-7 sm:h-7 text-blue-300 group-hover:text-blue-200 font-bold" />
                </button>
                {/* Tooltip text */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-blue-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded">
                  Add Images
                </div>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-6 flex-1 flex-col sm:flex-row min-h-0">{/* Main cropping area */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* Navigation and Controls */}
                <div className="flex flex-col gap-3 mb-4 bg-gray-900 border border-gray-800 rounded-lg p-2 sm:p-4">
                  {/* Top row: Navigation - Hidden on mobile */}
                  <div className="hidden sm:flex items-center justify-between w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPrevious}
                      disabled={currentImageIndex === 0}
                      className="p-1 sm:p-2"
                    >
                      <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    
                    <div className="text-xs sm:text-sm text-center">
                      <span className="font-medium text-white">{currentImageIndex + 1}</span>
                      <span className="text-gray-400"> of {filteredImages.length}</span>
                      {currentImage && croppedImages[currentImage.id] && (
                        <span className="ml-1 sm:ml-2 inline-flex items-center gap-1 text-green-400">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full" />
                          <span className="hidden sm:inline">Cropped</span>
                        </span>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNext}
                      disabled={currentImageIndex === filteredImages.length - 1}
                      className="p-1 sm:p-2"
                    >
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>

                  {/* Bottom row: Actions */}
                  <div className="flex items-center justify-between w-full gap-2">
                    <div></div>

                    <div className="flex gap-1 sm:gap-2">
                      {!showCroppedVersion && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReset}
                            className="text-xs px-2 sm:px-3"
                          >
                            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Reset</span>
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={handleSaveCurrentCrop}
                            className="bg-blue-600 hover:bg-blue-700 text-xs px-2 sm:px-3"
                          >
                            <Crop className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Crop</span>
                            <span className="sm:hidden">Crop</span>
                          </Button>
                        </>
                      )}
                      {showCroppedVersion && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCroppedVersion(false)}
                          className="text-xs px-2 sm:px-3"
                        >
                          <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                          <span className="hidden sm:inline">Edit Crop</span>
                          <span className="sm:hidden">Edit</span>
                        </Button>
                      )}
                    </div>

                    {/* Progress - Hidden on mobile */}
                    <div className="hidden sm:block text-xs text-gray-400 text-right">
                      Progress: {Object.keys(croppedImages).filter(id => !imagesToRemove.has(id)).length}/{filteredImages.length} cropped
                    </div>
                  </div>
                </div>

                {/* Crop container */}
                <div 
                  ref={containerRef}
                  className="flex-1 relative bg-black overflow-hidden rounded-lg min-h-[250px] sm:min-h-[400px] touch-none"
                  onMouseMove={!showCroppedVersion ? handleCropMouseMove : undefined}
                  onTouchMove={!showCroppedVersion ? handleCropMouseMove : undefined}
                  onMouseUp={!showCroppedVersion ? handleCropMouseUp : undefined}
                  onTouchEnd={!showCroppedVersion ? handleCropMouseUp : undefined}
                  onMouseLeave={!showCroppedVersion ? handleCropMouseUp : undefined}
                >
                  {currentImage && (
                    <>
                      {/* Background image */}
                      <div 
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <img
                          ref={imageRef}
                          src={getDisplayImageUrl()}
                          alt="Crop preview"
                          className="max-w-none select-none"
                          style={{
                            width: showCroppedVersion ? 'auto' : (imageLoaded && imageRef.current?.naturalWidth ? 
                              `${imageRef.current.naturalWidth * imageScale}px` : 'auto'),
                            height: showCroppedVersion ? 'auto' : (imageLoaded && imageRef.current?.naturalHeight ? 
                              `${imageRef.current.naturalHeight * imageScale}px` : 'auto'),
                            maxWidth: showCroppedVersion ? '100%' : 'none',
                            maxHeight: showCroppedVersion ? '100%' : 'none',
                            objectFit: showCroppedVersion ? 'contain' : 'initial'
                          }}
                          draggable={false}
                          onLoad={() => {
                            // Force re-render when image loads and recalculate layout
                            if (imageRef.current?.naturalWidth && imageRef.current?.naturalHeight && !showCroppedVersion) {
                              setImageLoaded(true)
                              // Small delay to ensure DOM is updated
                              setTimeout(() => {
                                recalculateLayout()
                              }, 50)
                            }
                          }}
                        />
                      </div>

                      {/* Crop overlay and box - only show when not showing cropped version */}
                      {!showCroppedVersion && (
                        <>
                          {/* Crop overlay - only darken areas outside crop box */}
                          <div 
                            className="absolute bg-black/50"
                            style={{
                              left: 0,
                              top: 0,
                              right: 0,
                              bottom: 0,
                              clipPath: `polygon(0 0, 0 100%, ${cropBox.x}px 100%, ${cropBox.x}px ${cropBox.y}px, ${cropBox.x + cropBox.width}px ${cropBox.y}px, ${cropBox.x + cropBox.width}px ${cropBox.y + cropBox.height}px, ${cropBox.x}px ${cropBox.y + cropBox.height}px, ${cropBox.x}px 100%, 100% 100%, 100% 0)`
                            }}
                          />

                          {/* Crop box */}
                          <div
                            className="absolute border-2 border-white shadow-lg"
                            style={{
                              left: cropBox.x,
                              top: cropBox.y,
                              width: cropBox.width,
                              height: cropBox.height,
                              cursor: isDraggingCrop ? 'grabbing' : 'grab'
                            }}
                            onMouseDown={handleCropMouseDown}
                            onTouchStart={handleCropTouchStart}
                          >
                            {/* Corner indicators - draggable */}
                            <div 
                              className="absolute -top-1 -left-1 w-2 h-2 sm:w-3 sm:h-3 bg-white border border-blue-500 rounded-full cursor-nw-resize" 
                              onMouseDown={(e) => handleCornerMouseDown(e, 'top-left')}
                              onTouchStart={(e) => handleCornerTouchStart(e, 'top-left')}
                            />
                            <div 
                              className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-white border border-blue-500 rounded-full cursor-ne-resize"
                              onMouseDown={(e) => handleCornerMouseDown(e, 'top-right')}
                              onTouchStart={(e) => handleCornerTouchStart(e, 'top-right')}
                            />
                            <div 
                              className="absolute -bottom-1 -left-1 w-2 h-2 sm:w-3 sm:h-3 bg-white border border-blue-500 rounded-full cursor-sw-resize"
                              onMouseDown={(e) => handleCornerMouseDown(e, 'bottom-left')}
                              onTouchStart={(e) => handleCornerTouchStart(e, 'bottom-left')}
                            />
                            <div 
                              className="absolute -bottom-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-white border border-blue-500 rounded-full cursor-se-resize"
                              onMouseDown={(e) => handleCornerMouseDown(e, 'bottom-right')}
                              onTouchStart={(e) => handleCornerTouchStart(e, 'bottom-right')}
                            />
                            
                            {/* Center indicator */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 sm:w-2 sm:h-2 bg-white border border-blue-500 rounded-full touch-manipulation"></div>
                            
                            {/* Grid lines */}
                            <div className="absolute inset-0 border border-white/30">
                              <div className="absolute top-1/3 left-0 right-0 border-t border-white/30"></div>
                              <div className="absolute top-2/3 left-0 right-0 border-t border-white/30"></div>
                              <div className="absolute left-1/3 top-0 bottom-0 border-l border-white/30"></div>
                              <div className="absolute left-2/3 top-0 bottom-0 border-l border-white/30"></div>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden file input for adding images */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />

        <canvas ref={canvasRef} className="hidden" />

        <DialogFooter className="border-t border-gray-800 flex flex-row gap-2 px-4 py-3 sm:px-6 sm:py-4 mt-auto">
          <Button variant="outline" onClick={onCancel} className="border-gray-600 text-gray-300 hover:bg-gray-800 text-sm flex-1 sm:flex-none">
            Cancel
          </Button>
          <Button 
            onClick={handleProceed} 
            disabled={filteredImages.length === 0 || !filteredImages.every(image => croppedImages[image.id])}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:bg-gray-600 disabled:cursor-not-allowed flex-1 sm:flex-none"
          >
            <span className="hidden sm:inline">Proceed ({Object.keys(croppedImages).filter(id => !imagesToRemove.has(id)).length}/{filteredImages.length} cropped)</span>
            <span className="sm:hidden">Proceed ({Object.keys(croppedImages).filter(id => !imagesToRemove.has(id)).length}/{filteredImages.length})</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
