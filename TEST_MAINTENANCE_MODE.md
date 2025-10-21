# 🧪 **Test Maintenance Mode - Ghid Complet**

## **📋 Checklist de Testare**

### **✅ Test 1: Activare Maintenance Mode**

**Pași:**
1. Login ca **admin**: `http://localhost:3000/login`
   - Email: `admin@fixgsm.com`
   - Password: `admin123`

2. Navighează la **Admin Dashboard**

3. Click pe tab **"Settings"**

4. Scroll până la secțiunea **"Maintenance Mode"**

5. **Activează** checkbox-ul "Maintenance Mode"

6. Completează câmpul **"Timp Estimat Mentenanță"**: 
   - Exemplu: `"2 ore"` sau `"30 minute"`

7. Click **"Salvează Setări"**

**Rezultat așteptat:**
- ✅ Toast notification: "Setări salvate cu succes!"
- ✅ Câmpul "Timp Estimat" rămâne vizibil (cu border orange)
- ✅ Admin rămâne pe pagina curentă (nu e redirecționat)

---

### **✅ Test 2: Verificare Blocare Acces (User Normal)**

**Pași:**
1. Deschide un **tab nou** în browser (sau mod Incognito: `Ctrl+Shift+N`)

2. Accesează `http://localhost:3000/`

3. **SAU** încearcă să accesezi direct `http://localhost:3000/login`

**Rezultat așteptat:**
- ✅ Loading screen: "Se verifică statusul platformei..."
- ✅ Redirecționare AUTOMATĂ la `/maintenance`
- ✅ Pagina de maintenance se afișează cu:
  - Icon Wrench animat (bounce)
  - Titlu: "Mentenanță în Curs"
  - Card "Timp Estimat": "2 ore" (sau ce ai setat)
  - Card "Status": "Actualizare Sistem"
  - Mesaj explicativ
  - Buton "Verifică Status"
  - Email suport: support@fixgsm.ro
  - Footer: "Verificăm automat statusul la fiecare 30 de secunde"

---

### **✅ Test 3: Admin Poate Accesa În Continuare**

**Pași:**
1. În tab-ul de **admin** (unde ești deja logat)

2. Navighează prin platformă:
   - Click **"Dashboard"** → ✅ funcționează
   - Click **"Tenants"** → ✅ funcționează
   - Click **"Settings"** → ✅ funcționează
   - Click **"Backup"** → ✅ funcționează

3. Verifică că **NU** ești redirecționat la `/maintenance`

**Rezultat așteptat:**
- ✅ Admin poate accesa TOATE paginile
- ✅ NICIO redirecționare către maintenance
- ✅ Toate funcționalitățile admin funcționează normal

---

### **✅ Test 4: Buton "Verifică Status" (Manual Refresh)**

**Pași:**
1. În tab-ul Incognito (pe pagina `/maintenance`)

2. Click pe butonul **"Verifică Status"**

**Rezultat așteptat:**
- ✅ Buton se transformă în: "Se verifică..." cu spinner
- ✅ După verificare, butonul revine la: "Verifică Status"
- ✅ Dacă maintenance e încă activ → rămâi pe pagina maintenance
- ✅ Dacă maintenance e dezactivat → redirecționare la `/login`

---

### **✅ Test 5: Auto-refresh (30 secunde)**

**Pași:**
1. În tab-ul Incognito (pe pagina `/maintenance`)

2. Lasă pagina deschisă și **NU** atinge nimic

3. Așteaptă **30 de secunde**

4. Observă comportamentul

**Rezultat așteptat:**
- ✅ La fiecare 30 secunde, se face verificare automată
- ✅ Verificarea rulează în background (nu se vede loading)
- ✅ Dacă maintenance e activ → pagina rămâne la fel
- ✅ Dacă maintenance e dezactivat → redirecționare AUTOMATĂ la `/login`

---

### **✅ Test 6: Dezactivare Maintenance Mode**

**Pași:**
1. În tab-ul de **admin**

2. Mergi la **Settings**

3. **Dezactivează** checkbox-ul "Maintenance Mode"

4. Click **"Salvează Setări"**

**Rezultat așteptat:**
- ✅ Toast: "Setări salvate cu succes!"
- ✅ Câmpul "Timp Estimat" **dispare** (condiționat)
- ✅ Admin rămâne pe pagina de settings

---

### **✅ Test 7: Auto-redirect După Dezactivare**

**Pași:**
1. După ce ai dezactivat maintenance (Test 6)

2. Mergi la tab-ul Incognito (care e pe `/maintenance`)

3. Așteaptă **maxim 30 secunde** SAU click **"Verifică Status"**

**Rezultat așteptat:**
- ✅ Redirecționare AUTOMATĂ la `/login`
- ✅ Pagina de login se încarcă normal
- ✅ Poți face login fără probleme

---

### **✅ Test 8: Login După Dezactivare**

**Pași:**
1. În tab-ul Incognito (acum pe `/login`)

2. Încearcă să te loghezi cu un **tenant normal**:
   - Email: `office@brandmobile.ro`
   - Password: `Coolzone`

3. Click **"Login"**

**Rezultat așteptat:**
- ✅ Login reușit
- ✅ Redirecționare la `/dashboard`
- ✅ Dashboard se încarcă normal
- ✅ NICIO redirecționare către maintenance

---

### **✅ Test 9: Reactivare Maintenance (User Logat)**

**Pași:**
1. Ca **admin**, reactivează **"Maintenance Mode"**

2. Salvează setările

3. În tab-ul cu **tenant** (deja logat pe `/dashboard`)

4. Așteaptă **30 secunde** SAU încearcă să navighezi la altă pagină

**Rezultat așteptat:**
- ✅ La următoarea verificare (30s) → redirecționare la `/maintenance`
- ✅ SAU la click pe orice link → redirecționare imediată la `/maintenance`
- ✅ Tenant nu mai poate accesa dashboard-ul

---

### **✅ Test 10: Acces Direct URL (Maintenance Activ)**

**Pași:**
1. Cu **Maintenance Mode ACTIV**

2. În tab Incognito, încearcă să accesezi direct:
   - `http://localhost:3000/dashboard`
   - `http://localhost:3000/tickets`
   - `http://localhost:3000/settings`

**Rezultat așteptat:**
- ✅ Toate URL-urile redirect automat la `/maintenance`
- ✅ Nu se încarcă nicio pagină protejată
- ✅ Loading screen → apoi `/maintenance`

---

## **🐛 Troubleshooting**

### **Problema: Pot face login când maintenance e activ**

**Cauză:** MaintenanceGuard verifică după ce pagina se încarcă

**Fix:** Refresh pagina (F5) după login → ar trebui redirecționat la `/maintenance`

---

### **Problema: Admin e redirecționat la maintenance**

**Cauză:** `userType` nu e setat corect în localStorage

**Fix:** 
1. Verifică console: `localStorage.getItem('fixgsm_user_type')`
2. Ar trebui să fie: `"admin"`
3. Dacă nu e, re-login ca admin

---

### **Problema: Warning "uncontrolled input"**

**Cauză:** `estimated_maintenance_time` era `undefined` la început

**Fix:** ✅ Deja reparat în `AdminDashboard.js` - câmpul se inițializează cu `''`

---

### **Problema: Nu se face auto-refresh la 30s**

**Cauză:** Interval-ul nu rulează

**Fix:**
1. Verifică console pentru erori
2. Verifică că backend-ul (`/api/maintenance-status`) răspunde
3. Test manual: click "Verifică Status"

---

## **📊 Rezultate Finale Așteptate**

| Scenar io | Admin | Tenant/Employee |
|-----------|-------|-----------------|
| Maintenance OFF | ✅ Acces complet | ✅ Acces complet |
| Maintenance ON | ✅ Acces complet | ❌ Redirecționare `/maintenance` |
| Login când ON | ✅ Permite | ❌ Redirecționare după login |
| Direct URL când ON | ✅ Permite | ❌ Redirecționare |
| Auto-refresh 30s | ✅ Verifică dar nu redirect | ✅ Verifică și redirect dacă ON |

---

## **✅ Checklist Final**

- [ ] Activare maintenance → Toast succes
- [ ] User normal → Redirecționare `/maintenance`
- [ ] Pagina maintenance → Design corect, timp estimat afișat
- [ ] Admin → Poate accesa tot
- [ ] Buton "Verifică Status" → Funcționează
- [ ] Auto-refresh 30s → Funcționează
- [ ] Dezactivare maintenance → Toast succes
- [ ] User pe `/maintenance` → Auto-redirect la `/login`
- [ ] Login după dezactivare → Funcționează normal
- [ ] Reactivare cu user logat → Redirecționare la `/maintenance`
- [ ] Acces direct URL → Blocat când ON
- [ ] Niciun warning în console (despre input)

---

## **🎯 Comenzi Utile Pentru Testing**

### **Verificare Status Backend:**
```powershell
curl http://localhost:8000/api/maintenance-status
```

**Output așteptat:**
```json
{
  "maintenance_mode": true,
  "support_email": "support@fixgsm.ro",
  "estimated_time": "2 ore"
}
```

### **Verificare localStorage (Console Browser):**
```javascript
// Verifică user type
localStorage.getItem('fixgsm_user_type')  // 'admin', 'tenant_owner', sau 'employee'

// Verifică token
localStorage.getItem('fixgsm_token')  // JWT token

// Clear localStorage (logout forțat)
localStorage.clear()
```

---

**🎉 Dacă toate testele trec → MAINTENANCE MODE FUNCȚIONEAZĂ PERFECT!**

