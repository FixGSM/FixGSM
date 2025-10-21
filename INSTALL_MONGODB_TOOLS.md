# 📥 **Instalare MongoDB Database Tools pe Windows**

## **Metoda 1: Download Manual (Recomandat)**

### **Pas 1: Download**
1. Accesează: https://www.mongodb.com/try/download/database-tools
2. Selectează:
   - **Version:** Latest (ex: 100.9.4)
   - **Platform:** Windows x86_64
   - **Package:** ZIP
3. Click **Download**

### **Pas 2: Extragere**
1. Extrage fișierul ZIP descărcat (ex: `mongodb-database-tools-windows-x86_64-100.9.4.zip`)
2. Vei găsi un folder `bin` cu următoarele executabile:
   - `mongodump.exe` ✅
   - `mongorestore.exe` ✅
   - `mongoexport.exe`
   - `mongoimport.exe`
   - `mongostat.exe`
   - etc.

### **Pas 3: Adăugare în PATH**

**Opțiunea A - Copiere în folder MongoDB (dacă ai MongoDB instalat):**
```powershell
# Copiază toate fișierele din bin în folder-ul MongoDB
Copy-Item "C:\path\to\extracted\bin\*" "C:\Program Files\MongoDB\Server\7.0\bin\" -Force
```

**Opțiunea B - Adăugare manuală în System PATH:**

1. **Deschide System Properties:**
   - Apasă `Win + R`
   - Tastează: `sysdm.cpl`
   - Click **OK**

2. **Environment Variables:**
   - Click tab **Advanced**
   - Click **Environment Variables**

3. **Edit PATH:**
   - În secțiunea **System variables**, găsește `Path`
   - Click **Edit**
   - Click **New**
   - Adaugă calea către folder-ul `bin` extras (ex: `C:\mongodb-tools\bin`)
   - Click **OK** pe toate ferestrele

4. **Restart PowerShell/Terminal**

### **Pas 4: Verificare**
```powershell
# Deschide un PowerShell NOU și testează:
mongodump --version
mongorestore --version
```

**Output așteptat:**
```
mongodump version: 100.9.4
git version: ...
Go version: ...
```

---

## **Metoda 2: Instalare prin Chocolatey (Opțional)**

### **Instalare Chocolatey mai întâi:**
```powershell
# Rulează ca Administrator
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

### **Apoi instalează MongoDB Tools:**
```powershell
choco install mongodb-database-tools -y
```

---

## **Metoda 3: Plasare Locală (Quick Fix pentru Dev)**

Dacă nu vrei să modifici PATH-ul de sistem:

1. Creează folder `backend/tools/`
2. Copiază `mongodump.exe` și `mongorestore.exe` acolo
3. Modifică `backend/server.py` să folosească calea locală:

```python
# În loc de:
subprocess.run(["mongodump", ...])

# Folosește:
import os
mongodump_path = os.path.join(os.path.dirname(__file__), "tools", "mongodump.exe")
subprocess.run([mongodump_path, ...])
```

---

## **🎯 După Instalare:**

Restartează toate terminalele și testează din **backend folder**:

```powershell
cd backend
mongodump --version
mongorestore --version
```

Apoi restartează serverul backend:
```powershell
python start_server.py
```

---

## **✅ Verificare Finală în FixGSM:**

1. Login ca **admin** în Admin Dashboard
2. Mergi la tab **Backup**
3. Click **"Backup Nou"** sau **"Creează Backup"**
4. Dacă totul e OK, vei vedea: **"Backup creat cu succes! Dimensiune: X MB"**
5. Backup-ul va apărea în listă

---

## **❓ Probleme Comune:**

### **"mongodump is not recognized"**
- PATH-ul nu e setat corect
- Restart PowerShell după modificarea PATH
- Verifică că `mongodump.exe` există în folder-ul adăugat

### **"Access Denied"**
- Rulează PowerShell ca Administrator
- Verifică permisiunile pe folder

### **"Connection refused"**
- MongoDB nu rulează
- Verifică că `mongodb://localhost:27017` funcționează

---

## **📞 Link-uri Utile:**

- **Download:** https://www.mongodb.com/try/download/database-tools
- **Documentație:** https://www.mongodb.com/docs/database-tools/
- **GitHub:** https://github.com/mongodb/mongo-tools

---

**După instalare, sistemul de backup va funcționa perfect! 🚀**

