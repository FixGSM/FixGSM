// Cache pentru URL-uri deja găsite
const imageUrlCache = new Map();

// Funcție pentru a genera URL-uri posibile
const generatePossibleUrls = (deviceModel) => {
  const model = deviceModel.toLowerCase().trim();
  let brand = '';
  let cleanModel = model;
  
  // Brand detection
  if (model.includes('iphone')) {
    brand = 'apple';
    cleanModel = model.replace('apple', '').trim();
  } else if (model.includes('samsung') || model.includes('galaxy')) {
    brand = 'samsung';
    cleanModel = model.replace('samsung', '').trim();
    
    // Samsung model code detection for better URL generation
    if (cleanModel.includes('galaxy a12')) {
      cleanModel = 'galaxy-a12-sm-a125';
    } else if (cleanModel.includes('galaxy a17')) {
      cleanModel = 'galaxy-a17-5g';
    } else if (cleanModel.includes('galaxy a20')) {
      cleanModel = 'galaxy-a20';
    } else if (cleanModel.includes('galaxy a25')) {
      cleanModel = 'galaxy-a25';
    } else if (cleanModel.includes('galaxy a32')) {
      cleanModel = 'galaxy-a32-sm-a325';
    } else if (cleanModel.includes('galaxy a36')) {
      cleanModel = 'galaxy-a36';
    } else if (cleanModel.includes('galaxy a52')) {
      cleanModel = 'galaxy-a52-sm-a525';
    } else if (cleanModel.includes('galaxy a71')) {
      cleanModel = 'galaxy-a71';
    } else if (cleanModel.includes('galaxy a72')) {
      cleanModel = 'galaxy-a72-4g';
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
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  const urls = [];
  
  // Pattern 1: Standard cu trailing dash
  urls.push(`https://fdn2.gsmarena.com/vv/bigpic/${brand}-${cleanModel}-.jpg`);
  
  // Pattern 2: Fără trailing dash
  urls.push(`https://fdn2.gsmarena.com/vv/bigpic/${brand}-${cleanModel}.jpg`);
  
  // Pattern 3: Doar model (fără brand)
  urls.push(`https://fdn2.gsmarena.com/vv/bigpic/${cleanModel}-.jpg`);
  urls.push(`https://fdn2.gsmarena.com/vv/bigpic/${cleanModel}.jpg`);
  
  return urls;
};

// Funcție principală simplificată (fără testare CORS)
export const generateDeviceImageUrl = (deviceModel) => {
  console.log('🔍 generateDeviceImageUrl called with:', deviceModel);
  
  if (!deviceModel) {
    console.log('❌ deviceModel is null/empty, returning null');
    return null;
  }
  
  // Verifică cache-ul mai întâi
  if (imageUrlCache.has(deviceModel)) {
    console.log('💾 Using cached URL:', imageUrlCache.get(deviceModel));
    return imageUrlCache.get(deviceModel);
  }
  
  // Generează URL-uri posibile
  const possibleUrls = generatePossibleUrls(deviceModel);
  console.log('🔗 Generated possible URLs:', possibleUrls);
  
  // Returnează primul URL (cel mai probabil să funcționeze)
  const bestUrl = possibleUrls[0];
  console.log('✅ Using best URL:', bestUrl);
  
  // Cache URL-ul
  imageUrlCache.set(deviceModel, bestUrl);
  return bestUrl;
};
