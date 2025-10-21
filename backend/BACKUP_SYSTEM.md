# 🔒 **FixGSM Backup System**

## **Descriere**

Sistem complet de backup și restore pentru baza de date MongoDB, cu interfață grafică în Admin Dashboard.

---

## **✨ Funcționalități**

### **1. Creare Backup**
- Execută `mongodump` pentru a exporta întreaga bază de date
- Compresie automată în format ZIP
- Salvare metadata în MongoDB (dimensiune, număr fișiere, dată)
- Stocare locală în folder `backend/backups/`

### **2. Listare Backup-uri**
- Vizualizare toate backup-urile disponibile
- Informații: dimensiune, număr fișiere, dată creare
- Sorting descrescător (cele mai recente primele)

### **3. Download Backup**
- Download direct prin browser
- Format ZIP comprimat
- Nume fișier: `fixgsm_backup_YYYYMMDD_HHMMSS.zip`

### **4. Restaurare Backup**
- Restaurare completă bază de date din backup
- Confirmare dublă pentru siguranță
- Flag `--drop` pentru înlocuire colecții existente
- Reîncărcare automată pagină după restore

### **5. Ștergere Backup**
- Șterge fișier de pe disk
- Șterge metadata din MongoDB
- Confirmare pentru siguranță

---

## **🔧 Cerințe Tehnice**

### **MongoDB Database Tools**

Sistemul necesită instalarea MongoDB Database Tools pentru `mongodump` și `mongorestore`:

#### **Windows:**
```powershell
# Download MongoDB Database Tools
# https://www.mongodb.com/try/download/database-tools

# Sau instalare prin Chocolatey
choco install mongodb-database-tools
```

#### **Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install mongodb-database-tools

# CentOS/RHEL
sudo yum install mongodb-database-tools
```

#### **MacOS:**
```bash
brew install mongodb/brew/mongodb-database-tools
```

---

## **📂 Structură Backup**

```
backend/
├── backups/
│   ├── fixgsm_backup_20251019_120000.zip
│   ├── fixgsm_backup_20251018_150000.zip
│   └── ...
└── server.py
```

### **Conținut ZIP:**
```
fixgsm_backup_20251019_120000/
├── fixgsm_db/
│   ├── tenants.bson
│   ├── tenants.metadata.json
│   ├── users.bson
│   ├── users.metadata.json
│   ├── tickets.bson
│   ├── tickets.metadata.json
│   ├── payments.bson
│   ├── payments.metadata.json
│   └── ... (toate colecțiile)
```

---

## **🛡️ Siguranță**

### **Acces:**
- Doar utilizatori cu `user_type: "admin"` pot accesa funcțiile de backup
- Autentificare JWT obligatorie

### **Confirmări:**
- **Creare Backup:** Confirmare implicită
- **Download Backup:** Confirmare implicită
- **Restaurare:** 2 confirmări (PERICOL de pierdere date!)
- **Ștergere:** 1 confirmare

### **Timeout:**
- **Backup:** 300 secunde (5 minute)
- **Restore:** 300 secunde (5 minute)

---

## **📊 API Endpoints**

### **POST** `/api/admin/backup`
Creează un backup nou al bazei de date.

**Response:**
```json
{
  "message": "Backup created successfully",
  "backup_id": "uuid",
  "filename": "fixgsm_backup_20251019_120000.zip",
  "file_count": 24,
  "size_mb": 12.5,
  "timestamp": "20251019_120000"
}
```

---

### **GET** `/api/admin/backups`
Listează toate backup-urile disponibile.

**Response:**
```json
[
  {
    "backup_id": "uuid",
    "backup_name": "fixgsm_backup_20251019_120000",
    "filename": "fixgsm_backup_20251019_120000.zip",
    "filepath": "backups/fixgsm_backup_20251019_120000.zip",
    "file_count": 24,
    "size_bytes": 13107200,
    "size_mb": 12.5,
    "created_at": "2025-10-19T12:00:00Z",
    "created_by": "admin_user_id",
    "status": "completed"
  }
]
```

---

### **GET** `/api/admin/backup/{backup_id}/download`
Download un backup specific.

**Response:** ZIP file (binary)

---

### **POST** `/api/admin/backup/{backup_id}/restore`
Restaurează baza de date din backup.

**Response:**
```json
{
  "message": "Database restored successfully",
  "backup_id": "uuid",
  "restored_at": "2025-10-19T12:00:00Z"
}
```

---

### **DELETE** `/api/admin/backup/{backup_id}`
Șterge un backup.

**Response:**
```json
{
  "message": "Backup deleted successfully"
}
```

---

## **⚠️ Avertismente**

### **Restaurare Backup:**
- **VA ÎNLOCUI TOATE DATELE EXISTENTE!**
- Nu se poate anula operațiunea
- Se recomandă crearea unui backup nou înainte de restore
- Flag `--drop` șterge colecțiile existente

### **Performanță:**
- Backup-uri mari pot dura câteva minute
- Se recomandă backup-uri regulate (zilnic/săptămânal)
- Nu executa backup-uri în orele de vârf

### **Stocare:**
- Folder-ul `backups/` poate crește semnificativ
- Se recomandă cleanup periodic al backup-urilor vechi
- Adaugă `backups/` în `.gitignore`

---

## **🚀 Best Practices**

1. **Backup regulat:**
   - Zilnic pentru producție
   - Săptămânal pentru dezvoltare
   - Înainte de actualizări majore

2. **Testare restore:**
   - Testează restaurarea periodic
   - Verifică integritatea datelor după restore

3. **Backup offsite:**
   - Copiază backup-urile pe server extern
   - Cloud storage (AWS S3, Google Cloud, etc.)

4. **Monitoring:**
   - Verifică dimensiunea backup-urilor
   - Alertă dacă backup-ul eșuează
   - Log-uri pentru audit

5. **Cleanup automat:**
   - Păstrează ultimele 10-30 backup-uri
   - Șterge backup-uri mai vechi de 90 zile

---

## **📝 TODO Viitor**

- [ ] Backup automat programat (cron job)
- [ ] Upload backup către cloud storage
- [ ] Backup incremental (doar modificări)
- [ ] Criptare backup-uri (AES-256)
- [ ] Email notificare la backup creat/eșuat
- [ ] Comparare backup-uri (diff)
- [ ] Restore selectiv (doar anumite colecții)
- [ ] Compresie îmbunătățită (tar.gz)

---

## **🎯 Suport**

Pentru probleme sau întrebări legate de sistemul de backup, contactează administratorul platformei.

