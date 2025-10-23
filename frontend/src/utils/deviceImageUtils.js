export const generateDeviceImageUrl = (deviceModel) => {
  console.log('🔍 generateDeviceImageUrl called with:', deviceModel);
  
  if (!deviceModel) {
    console.log('❌ deviceModel is null/empty, returning null');
    return null;
  }
  
  const model = deviceModel.toLowerCase().trim();
  let brand = '';
  let cleanModel = model;
  
  // Brand detection and removal (GSM Arena pattern)
  if (model.includes('iphone')) {
    brand = 'apple';
    cleanModel = model.replace('apple', '').trim();
  } else if (model.includes('samsung') || model.includes('galaxy')) {
    brand = 'samsung';
    cleanModel = model.replace('samsung', '').trim();
    
    // Samsung model code mapping for better URL generation
    if (cleanModel.includes('galaxy a12')) {
      cleanModel = 'galaxy-a12-sm-a125';
    } else if (cleanModel.includes('galaxy a32')) {
      cleanModel = 'galaxy-a32-sm-a325';
    } else if (cleanModel.includes('galaxy a52')) {
      cleanModel = 'galaxy-a52-sm-a525';
    } else if (cleanModel.includes('galaxy a72')) {
      cleanModel = 'galaxy-a72-sm-a725';
    } else if (cleanModel.includes('galaxy s21')) {
      cleanModel = 'galaxy-s21-sm-g991';
    } else if (cleanModel.includes('galaxy s21 ultra')) {
      cleanModel = 'galaxy-s21-ultra-sm-g998';
    } else if (cleanModel.includes('galaxy s22')) {
      cleanModel = 'galaxy-s22-sm-s901';
    } else if (cleanModel.includes('galaxy s23')) {
      cleanModel = 'galaxy-s23-sm-s911';
    } else if (cleanModel.includes('galaxy note 20')) {
      cleanModel = 'galaxy-note20-sm-n980';
    } else if (cleanModel.includes('galaxy a70')) {
      cleanModel = 'galaxy-a70-sm-a705';
    } else if (cleanModel.includes('galaxy a71')) {
      cleanModel = 'galaxy-a71-sm-a715';
    }
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
  
  // Generate URL with brand prefix and trailing dash (GSM Arena pattern)
  const imageUrl = `https://fdn2.gsmarena.com/vv/bigpic/${brand}-${cleanModel}-.jpg`;
  console.log('✅ Generated URL:', imageUrl);
  
  return imageUrl;
};
