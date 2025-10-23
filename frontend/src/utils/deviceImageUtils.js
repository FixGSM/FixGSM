export const generateDeviceImageUrl = (deviceModel) => {
  if (!deviceModel) return null;
  
  const model = deviceModel.toLowerCase().trim();
  let brand = '';
  let cleanModel = model;
  
  // Brand detection and removal
  if (model.includes('iphone')) {
    brand = 'apple';
    cleanModel = model.replace('apple', '').trim();
  } else if (model.includes('samsung') || model.includes('galaxy')) {
    brand = 'samsung';
    cleanModel = model.replace('samsung', '').trim();
  } else if (model.includes('xiaomi')) {
    brand = 'xiaomi';
    cleanModel = model.replace('xiaomi', '').trim();
  } else if (model.includes('redmi')) {
    brand = 'xiaomi';
  } else if (model.includes('poco')) {
    brand = 'xiaomi';
  } else if (model.includes('huawei')) {
    brand = 'huawei';
    cleanModel = model.replace('huawei', '').trim();
  } else if (model.includes('oppo')) {
    brand = 'oppo';
    cleanModel = model.replace('oppo', '').trim();
  } else if (model.includes('vivo')) {
    brand = 'vivo';
    cleanModel = model.replace('vivo', '').trim();
  } else if (model.includes('oneplus')) {
    brand = 'oneplus';
    cleanModel = model.replace('oneplus', '').replace('one plus', '').trim();
  } else if (model.includes('motorola') || model.includes('moto')) {
    brand = 'motorola';
    cleanModel = model.replace('motorola', '').trim();
  } else if (model.includes('nokia')) {
    brand = 'nokia';
    cleanModel = model.replace('nokia', '').trim();
  } else if (model.includes('realme')) {
    brand = 'realme';
    cleanModel = model.replace('realme', '').trim();
  }
  
  // Clean model name
  cleanModel = cleanModel
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  
  // NO trailing dash (like competitor)
  return `https://fdn2.gsmarena.com/vv/bigpic/${brand}-${cleanModel}.jpg`;
};
