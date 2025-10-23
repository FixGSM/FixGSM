// Cache pentru URL-uri deja găsite
const imageUrlCache = new Map();

// Funcție pentru a testa dacă o imagine există
const testImageUrl = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

// Funcție pentru a căuta pe GSM Arena
const searchGSMArena = async (deviceModel) => {
  try {
    console.log('🔍 Searching GSM Arena for:', deviceModel);
    
    // Construiește URL-ul de căutare
    const searchUrl = `https://www.gsmarena.com/results.php3?sQuickSearch=yes&sName=${encodeURIComponent(deviceModel)}`;
    
    // Face request către GSM Arena
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.log('❌ GSM Arena search failed:', response.status);
      return null;
    }
    
    const html = await response.text();
    
    // Parse HTML pentru a găsi link-ul către pagina dispozitivului
    const devicePageMatch = html.match(/href="([^"]*\.php)"[^>]*>([^<]*${deviceModel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^<]*)</i);
    
    if (!devicePageMatch) {
      console.log('❌ Device not found on GSM Arena');
      return null;
    }
    
    const devicePageUrl = `https://www.gsmarena.com/${devicePageMatch[1]}`;
    console.log('📱 Found device page:', devicePageUrl);
    
    // Face request către pagina dispozitivului
    const deviceResponse = await fetch(devicePageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!deviceResponse.ok) {
      console.log('❌ Device page failed:', deviceResponse.status);
      return null;
    }
    
    const deviceHtml = await deviceResponse.text();
    
    // Parse pentru a găsi URL-ul imaginii
    const imageMatch = deviceHtml.match(/https:\/\/fdn2\.gsmarena\.com\/vv\/bigpic\/[^"]*\.jpg/);
    
    if (!imageMatch) {
      console.log('❌ Image URL not found on device page');
      return null;
    }
    
    const imageUrl = imageMatch[0];
    console.log('✅ Found image URL:', imageUrl);
    
    return imageUrl;
    
  } catch (error) {
    console.log('❌ GSM Arena search error:', error);
    return null;
  }
};

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

// Funcție principală cu căutare inteligentă
export const generateDeviceImageUrl = async (deviceModel) => {
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
  
  // Testează URL-urile posibile
  for (const url of possibleUrls) {
    console.log('🧪 Testing URL:', url);
    if (await testImageUrl(url)) {
      console.log('✅ Found working URL:', url);
      imageUrlCache.set(deviceModel, url);
      return url;
    }
  }
  
  // Dacă nu găsește nimic, caută pe GSM Arena
  console.log('🔍 No standard URL worked, searching GSM Arena...');
  const gsmArenaUrl = await searchGSMArena(deviceModel);
  
  if (gsmArenaUrl) {
    console.log('✅ Found URL via GSM Arena search:', gsmArenaUrl);
    imageUrlCache.set(deviceModel, gsmArenaUrl);
    return gsmArenaUrl;
  }
  
  console.log('❌ No image found for:', deviceModel);
  return null;
};
