# 🚧 **Maintenance Mode - Documentație Completă**

## **Descriere**

Sistem complet de Maintenance Mode care permite administratorilor să blocheze accesul utilizatorilor la platformă pentru mentenanță programată. Admin-ii pot în continuare să acceseze platforma pentru configurări.

---

## **✨ Funcționalități**

### **1. Activare/Dezactivare Maintenance**
- Toggle simplu din Admin Dashboard → Settings
- Câmp opțional pentru timp estimat (ex: "2 ore", "30 minute")
- Salvare automată în MongoDB

### **2. Pagină Dedicată Maintenance**
- Design modern și profesional
- Afișare timp estimat (dacă e setat)
- Email contact suport
- Buton "Verifică Status" pentru refresh manual
- Auto-refresh la fiecare 30 secunde

### **3. Redirecționare Automată**
- Utilizatorii non-admin sunt redirecționați automat către `/maintenance`
- Admin-ii pot accesa platforma normal
- Când maintenance e dezactivat, utilizatorii sunt redirecționați automat înapoi

### **4. API Public**
- Endpoint `/api/maintenance-status` (fără autentificare)
- Verificare status în timp real
- Date: `maintenance_mode`, `support_email`, `estimated_time`

---

## **🎯 Cum Funcționează**

### **Flow Activare Maintenance:**

1. **Admin** → Login → Admin Dashboard
2. Click tab **"Settings"**
3. Activează checkbox **"Maintenance Mode"**
4. (Opțional) Completează **"Timp Estimat Mentenanță"**
5. Click **"Salvează Setări"**
6. ✅ Maintenance activat!

### **Ce se întâmplă:**

**Pentru utilizatori normali (tenants/employees):**
- La următoarea încărcare de pagină → redirecționare automată la `/maintenance`
- Dacă sunt deja logați → verificare la fiecare 30 secunde
- Dacă încearcă să acceseze orice pagină → redirecționare la `/maintenance`

**Pentru admin:**
- Poate accesa toată platforma normal
- Poate gestiona setările
- Poate dezactiva maintenance când e gata

---

## **🔧 Componente Tehnice**

### **1. Backend (server.py)**

#### **Endpoint GET `/api/maintenance-status`**
```python
@api_router.get("/maintenance-status")
async def get_maintenance_status():
    """Get maintenance mode status (public endpoint - no auth required)"""
    settings = await db["platform_settings"].find_one({"settings_id": "global"})
    
    if not settings:
        return {
            "maintenance_mode": False,
            "support_email": "support@fixgsm.ro",
            "estimated_time": None
        }
    
    return {
        "maintenance_mode": settings.get("maintenance_mode", False),
        "support_email": settings.get("support_email", "support@fixgsm.ro"),
        "estimated_time": settings.get("estimated_maintenance_time", None)
    }
```

**Caracteristici:**
- ✅ Public (fără autentificare)
- ✅ Rapid (query simplu)
- ✅ Returnează date minime necesare

#### **Endpoint PUT `/api/admin/platform-settings`**
```python
@api_router.put("/admin/platform-settings")
async def update_platform_settings(data: dict, current_user: dict = Depends(get_current_user)):
    """Update platform settings (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if "maintenance_mode" in data:
        update_data["maintenance_mode"] = data["maintenance_mode"]
    if "estimated_maintenance_time" in data:
        update_data["estimated_maintenance_time"] = data["estimated_maintenance_time"]
    # ... alte setări
    
    await db["platform_settings"].update_one(
        {"settings_id": "global"},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "Settings updated successfully"}
```

---

### **2. Frontend - MaintenancePage.js**

#### **Design:**
- Gradient background animat
- Icon Wrench animat (bounce)
- Cards pentru Status și Estimated Time
- Buton "Verifică Status" cu loading state
- Auto-refresh la fiecare 30 secunde

#### **Features:**
```javascript
// Check maintenance status
const checkMaintenanceStatus = async () => {
  const response = await axios.get(`${BACKEND_URL}/api/maintenance-status`);
  
  if (!response.data.maintenance_mode) {
    navigate('/login'); // Maintenance is over
  }
};

// Auto-check every 30 seconds
useEffect(() => {
  const interval = setInterval(checkMaintenanceStatus, 30000);
  return () => clearInterval(interval);
}, []);
```

---

### **3. Frontend - MaintenanceGuard (App.js)**

#### **Purpose:**
Verifică statusul maintenance la fiecare schimbare de rută și redirecționează utilizatorii non-admin.

#### **Logică:**
```javascript
const MaintenanceGuard = ({ children }) => {
  const userType = localStorage.getItem('fixgsm_user_type');
  
  useEffect(() => {
    const checkMaintenance = async () => {
      const response = await axios.get(`${BACKEND_URL}/api/maintenance-status`);
      
      // Redirect non-admin users to maintenance page
      if (response.data.maintenance_mode && userType !== 'admin' && location.pathname !== '/maintenance') {
        navigate('/maintenance', { replace: true });
      }
      
      // Redirect back if maintenance is off
      else if (!response.data.maintenance_mode && location.pathname === '/maintenance') {
        navigate('/login', { replace: true });
      }
    };
    
    checkMaintenance();
    
    // Check every 30 seconds
    const interval = setInterval(checkMaintenance, 30000);
    return () => clearInterval(interval);
  }, [location.pathname]);
  
  return children;
};
```

**Features:**
- ✅ Verificare la fiecare schimbare de rută
- ✅ Auto-refresh la 30 secunde
- ✅ Admin-ii sunt excluși (pot accesa)
- ✅ Loading screen în timpul verificării inițiale

---

### **4. Frontend - Admin Settings**

#### **UI Elements:**

**Checkbox Maintenance Mode:**
```javascript
<Checkbox
  checked={platformSettings.maintenance_mode}
  onCheckedChange={(checked) => setPlatformSettings({
    ...platformSettings, 
    maintenance_mode: checked
  })}
/>
```

**Input Timp Estimat (condiționat):**
```javascript
{platformSettings.maintenance_mode && (
  <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
    <Label className="text-orange-300">
      <Clock className="w-4 h-4" />
      Timp Estimat Mentenanță
    </Label>
    <Input
      value={platformSettings.estimated_maintenance_time}
      onChange={(e) => setPlatformSettings({
        ...platformSettings, 
        estimated_maintenance_time: e.target.value
      })}
      placeholder="ex: 2 ore, 30 minute, etc."
    />
  </div>
)}
```

---

## **📊 Baza de Date**

### **Collection: `platform_settings`**

```javascript
{
  "settings_id": "global",
  "maintenance_mode": true,  // boolean
  "estimated_maintenance_time": "2 ore",  // string (optional)
  "support_email": "support@fixgsm.ro",
  "notification_email": "admin@fixgsm.com",
  "landing_page_url": "https://fixgsm.ro",
  "auto_approve_tenants": true,
  "created_at": "2025-10-20T00:00:00Z",
  "updated_at": "2025-10-20T01:30:00Z"
}
```

---

## **🚀 Testare**

### **Pas 1: Activare Maintenance**
1. Login ca **admin** (`admin@fixgsm.com` / `admin123`)
2. Mergi la **Admin Dashboard → Settings**
3. Activează **"Maintenance Mode"**
4. Completează **"Timp Estimat"**: "30 minute"
5. Click **"Salvează Setări"**
6. Toast: "Setări salvate cu succes!"

### **Pas 2: Verificare Redirecționare**
1. Deschide tab nou (incognito sau alt browser)
2. Încearcă să accesezi `http://localhost:3000/login`
3. Ar trebui să fii redirecționat automat la `/maintenance`
4. Verifică că pagina de maintenance se afișează corect
5. Verifică că timpul estimat apare: "30 minute"

### **Pas 3: Testare Admin Access**
1. În tab-ul de admin (unde ești deja logat)
2. Verifică că poți accesa toate paginile normal
3. Admin Dashboard, Settings, Backup, etc.
4. Confirmă că nu ești redirecționat

### **Pas 4: Dezactivare Maintenance**
1. Ca admin, mergi la **Settings**
2. Dezactivează **"Maintenance Mode"**
3. Click **"Salvează Setări"**
4. În tab-ul incognito, click **"Verifică Status"**
5. Ar trebui să fii redirecționat înapoi la `/login`

---

## **⚠️ Note Importante**

### **Admin Access:**
- Admin-ii pot ÎNTOTDEAUNA accesa platforma
- Chiar dacă maintenance e activ
- Pentru configurări de urgență

### **Auto-refresh:**
- Verificare automată la fiecare 30 secunde
- Buton manual "Verifică Status" pentru refresh imediat
- Redirecționare automată când maintenance se termină

### **Performance:**
- Endpoint public optimizat (fără autentificare)
- Query simplu în MongoDB
- Cache-able pentru performanță maximă

### **UX:**
- Design profesional și modern
- Mesaje clare pentru utilizatori
- Email contact suport vizibil
- Timpul estimat ajută la așteptare

---

## **🎨 Design Features**

### **Pagina Maintenance:**
- ✅ Gradient background animat
- ✅ Icon Wrench cu bounce animation
- ✅ Cards pentru Status și Estimated Time
- ✅ Alert box cu info mentenanță
- ✅ Buton "Verifică Status" cu loading
- ✅ Email contact suport
- ✅ Footer cu auto-refresh info
- ✅ Logo FixGSM stilizat

### **Admin Settings:**
- ✅ Checkbox pentru activare
- ✅ Input condiționat pentru timp estimat (apare doar când maintenance e activ)
- ✅ Design orange pentru atenție (warning color)
- ✅ Helper text pentru ghidare

---

## **🔮 Îmbunătățiri Viitoare**

### **V1 (Curent):**
- ✅ Activare/Dezactivare
- ✅ Timp estimat custom
- ✅ Redirecționare automată
- ✅ Pagină dedicată

### **V2 (Viitor):**
- [ ] Programare automată (start/end time)
- [ ] Mesaj custom pentru utilizatori
- [ ] Notificare email înainte de maintenance
- [ ] Whitelist pentru anumite IP-uri
- [ ] Countdown timer pe pagina de maintenance
- [ ] Istoric maintenance events
- [ ] Multi-language support

---

## **✅ Status Implementare**

| Feature | Status |
|---------|--------|
| Backend API | ✅ Complet |
| MaintenancePage | ✅ Complet |
| MaintenanceGuard | ✅ Complet |
| Admin Settings UI | ✅ Complet |
| Auto-refresh | ✅ Complet |
| Timp Estimat | ✅ Complet |
| Redirecționare | ✅ Complet |
| Testare | ✅ Ready |

---

**🎉 MAINTENANCE MODE COMPLET FUNCȚIONAL!**

**Pentru activare:**
1. Login ca admin
2. Admin Dashboard → Settings
3. Activează "Maintenance Mode"
4. Salvează!

Utilizatorii vor vedea pagina de maintenance automat! 🚧

