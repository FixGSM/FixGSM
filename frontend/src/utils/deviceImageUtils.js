export const generateDeviceImageUrl = (deviceModel) => {
  if (!deviceModel) return null;
  
  // Smart algorithm like competitor - clean the entire model name
  const cleanModel = deviceModel
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  
  // Generate URL directly (no manual brand mapping needed)
  return `https://fdn2.gsmarena.com/vv/bigpic/${cleanModel}.jpg`;
};
