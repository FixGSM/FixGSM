import React, { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';
import { generateDeviceImageUrl } from '@/utils/deviceImageUtils';

const DeviceImage = ({ deviceModel, className = "" }) => {
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadImage = async () => {
      if (!deviceModel) {
        setIsLoading(false);
        return;
      }
      
      try {
        console.log('🖼️ DeviceImage loading:', deviceModel);
        setIsLoading(true);
        setImageError(false);
        
        const url = await generateDeviceImageUrl(deviceModel);
        setImageUrl(url);
        
        if (url) {
          console.log('✅ Image URL loaded:', url);
        } else {
          console.log('❌ No image URL found for:', deviceModel);
        }
      } catch (error) {
        console.log('❌ Error loading image URL:', error);
        setImageError(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadImage();
  }, [deviceModel]);
  
  console.log('🖼️ DeviceImage render:', { deviceModel, imageUrl, imageError, isLoading });
  
  // Loading state
  if (isLoading) {
    return (
      <div className={`bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg flex items-center justify-center ${className}`}>
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // Fallback to blue icon
  if (!imageUrl || imageError) {
    console.log('🔄 Using fallback icon for:', deviceModel);
    return (
      <div className={`bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center ${className}`}>
        <Smartphone className="w-5 h-5 text-white" />
      </div>
    );
  }
  
  console.log('📸 Rendering image for:', deviceModel, 'URL:', imageUrl);
  
  return (
    <div 
      className={`rounded-lg ${className}`}
      style={{
        backgroundImage: `url(${imageUrl})`,
        backgroundColor: 'transparent',
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Hidden img for error detection */}
      <img 
        src={imageUrl} 
        alt={deviceModel}
        onError={() => {
          console.log('❌ Image failed to load:', imageUrl);
          setImageError(true);
        }}
        onLoad={() => {
          console.log('✅ Image loaded successfully:', imageUrl);
        }}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default DeviceImage;
