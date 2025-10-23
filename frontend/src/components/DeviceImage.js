import React, { useState } from 'react';
import { Smartphone } from 'lucide-react';
import { generateDeviceImageUrl } from '@/utils/deviceImageUtils';

const DeviceImage = ({ deviceModel, className = "" }) => {
  const [imageError, setImageError] = useState(false);
  const imageUrl = generateDeviceImageUrl(deviceModel);
  
  // Fallback to blue icon
  if (!imageUrl || imageError) {
    return (
      <div className={`bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center ${className}`}>
        <Smartphone className="w-5 h-5 text-white" />
      </div>
    );
  }
  
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
        onError={() => setImageError(true)}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default DeviceImage;
