export const generateDeviceImageUrl = (deviceModel) => {
  console.log('🔍 generateDeviceImageUrl called with:', deviceModel);
  
  if (!deviceModel) {
    console.log('❌ deviceModel is null/empty, returning null');
    return null;
  }
  
  // Smart algorithm like competitor - clean the entire model name
  const cleanModel = deviceModel
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  
  const imageUrl = `https://fdn2.gsmarena.com/vv/bigpic/${cleanModel}.jpg`;
  console.log('✅ Generated URL:', imageUrl);
  
  return imageUrl;
};
