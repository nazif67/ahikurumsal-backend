# Production Deployment Guide - Ahikurumsal.com

Bu döküman, Ahikurumsal.com projelerinin production ortamına deploy edilmesi için gerekli adımları içermektedir.

## 📌 Alan Adı ve Port Yapılandırması

Projeler aşağıdaki alan adları ve portlar ile çalışacak şekilde yapılandırılmıştır:

- **Port 1338** → `api.ahikurumsal.com` (Strapi API Backend)
- **Port 3000** → `ahikurumsal.com` (Public Frontend)
- **Port 3001** → `admin.ahikurumsal.com` (Admin Panel)

## 🌐 DNS Ayarları - Hostinger

Hostinger DNS yönetim panelinde aşağıdaki kayıtları eklemeniz gerekmektedir:

```
Type: A Record
Host: @
Points to: [SUNUCU_IP_ADRESI]
TTL: 3600

Type: A Record
Host: www
Points to: [SUNUCU_IP_ADRESI]
TTL: 3600

Type: A Record
Host: api
Points to: [SUNUCU_IP_ADRESI]
TTL: 3600

Type: A Record
Host: admin
Points to: [SUNUCU_IP_ADRESI]
TTL: 3600
```

## ⚙️ Sunucu Gereksinimleri

- **Node.js**: >= 18.0.0 <= 22.x.x
- **npm**: >= 6.0.0
- **PostgreSQL**: >= 12.x (önerilir)
- **Nginx**: Reverse proxy için
- **PM2**: Process manager için
- **SSL**: Let's Encrypt ile Certbot (ücretsiz)

## 🚀 Kurulum Adımları

### 1. Sunucuya Bağlanma ve Gerekli Paketler

```bash
ssh root@[SUNUCU_IP_ADRESI]

apt update && apt upgrade -y

# Node.js kurulumu
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# PM2, Nginx, PostgreSQL, Git
npm install -g pm2
apt install -y nginx postgresql postgresql-contrib git
```

### 2. PostgreSQL Veritabanı Kurulumu

```bash
sudo -u postgres psql

CREATE DATABASE ahikurumsal_db;
CREATE USER ahikurumsal_user WITH PASSWORD 'güçlü_şifre_buraya';
GRANT ALL PRIVILEGES ON DATABASE ahikurumsal_db TO ahikurumsal_user;
\q
```

### 3. Proje Klasörlerinin Oluşturulması

```bash
mkdir -p /var/www/ahikurumsal
cd /var/www/ahikurumsal

# GitHub'dan projeleri klonlama
git clone [API_REPO_URL] api
git clone [BACKEND_REPO_URL] admin
git clone [FRONTEND_REPO_URL] frontend
```

### 4. API Backend (Strapi) - Port 1338

```bash
cd /var/www/ahikurumsal/api

# env-production-example.txt dosyasını .env olarak kopyalayın
cp env-production-example.txt .env
nano .env

# Güvenlik anahtarlarını oluşturmak için:
# node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

npm install
npm run build
pm2 start npm --name "ahikurumsal-api" -- start
pm2 save
```

### 5. Admin Panel - Port 3001

```bash
cd /var/www/ahikurumsal/admin

cp env-production-example.txt .env
nano .env

npm install
npm run build
pm2 start npm --name "ahikurumsal-admin" -- start
pm2 save
```

### 6. Frontend - Port 3000

```bash
cd /var/www/ahikurumsal/frontend

cp env-production-example.txt .env
nano .env

npm install
npm run build
pm2 start npm --name "ahikurumsal-frontend" -- start
pm2 save
```

### 7. Nginx Reverse Proxy Yapılandırması

#### API (api.ahikurumsal.com → localhost:1338)

```bash
nano /etc/nginx/sites-available/api.ahikurumsal.com
```

İçerik:

```nginx
server {
    listen 80;
    server_name api.ahikurumsal.com;
    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:1338;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Admin (admin.ahikurumsal.com → localhost:3001)

```bash
nano /etc/nginx/sites-available/admin.ahikurumsal.com
```

İçerik:

```nginx
server {
    listen 80;
    server_name admin.ahikurumsal.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Frontend (ahikurumsal.com → localhost:3000)

```bash
nano /etc/nginx/sites-available/ahikurumsal.com
```

İçerik:

```nginx
server {
    listen 80;
    server_name ahikurumsal.com www.ahikurumsal.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Nginx Aktif Etme

```bash
ln -s /etc/nginx/sites-available/api.ahikurumsal.com /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/admin.ahikurumsal.com /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/ahikurumsal.com /etc/nginx/sites-enabled/

nginx -t
systemctl restart nginx
```

### 8. SSL Sertifikası (Let's Encrypt)

```bash
apt install -y certbot python3-certbot-nginx

certbot --nginx -d ahikurumsal.com -d www.ahikurumsal.com
certbot --nginx -d api.ahikurumsal.com
certbot --nginx -d admin.ahikurumsal.com

# Otomatik yenileme testi
certbot renew --dry-run
```

### 9. Firewall

```bash
apt install -y ufw
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

### 10. PM2 Startup

```bash
pm2 startup
# Çıktıdaki komutu çalıştırın
pm2 save
pm2 list
```

## 🔄 GitHub Auto-Deploy (Önerilen)

### .github/workflows/deploy.yml

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USERNAME }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/ahikurumsal/api
            git pull origin main
            npm install
            npm run build
            pm2 restart ahikurumsal-api
```

GitHub Secrets ekleyin:
- `SERVER_HOST`
- `SERVER_USERNAME`
- `SSH_PRIVATE_KEY`

## 📊 Monitoring

```bash
# PM2 status
pm2 list
pm2 monit

# Logs
pm2 logs ahikurumsal-api
pm2 logs ahikurumsal-admin
pm2 logs ahikurumsal-frontend

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# System
df -h
free -h
htop
```

## 🔄 Update Script

```bash
nano /var/www/ahikurumsal/update.sh
```

İçerik:

```bash
#!/bin/bash

echo "Updating API..."
cd /var/www/ahikurumsal/api
git pull origin main
npm install
npm run build
pm2 restart ahikurumsal-api

echo "Updating Admin..."
cd /var/www/ahikurumsal/admin
git pull origin main
npm install
npm run build
pm2 restart ahikurumsal-admin

echo "Updating Frontend..."
cd /var/www/ahikurumsal/frontend
git pull origin main
npm install
npm run build
pm2 restart ahikurumsal-frontend

echo "Done!"
pm2 list
```

```bash
chmod +x /var/www/ahikurumsal/update.sh
/var/www/ahikurumsal/update.sh
```

## 💾 Backup

```bash
# Database backup
pg_dump -U ahikurumsal_user -d ahikurumsal_db > backup_$(date +%Y%m%d).sql

# Uploads backup
tar -czf uploads_$(date +%Y%m%d).tar.gz /var/www/ahikurumsal/api/public/uploads

# Restore
psql -U ahikurumsal_user -d ahikurumsal_db < backup_20241113.sql
```

### Otomatik Backup Script

```bash
nano /root/backup-db.sh
```

İçerik:

```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
mkdir -p $BACKUP_DIR
pg_dump -U ahikurumsal_user -d ahikurumsal_db > $BACKUP_DIR/db_$(date +%Y%m%d_%H%M%S).sql
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete
```

```bash
chmod +x /root/backup-db.sh
crontab -e
# Ekleyin: 0 2 * * * /root/backup-db.sh
```

## 🔧 Troubleshooting

### Port kullanımda
```bash
lsof -i :1338
kill -9 [PID]
pm2 restart all
```

### Database bağlantı hatası
```bash
systemctl status postgresql
systemctl start postgresql
tail -f /var/log/postgresql/postgresql-*.log
```

### Nginx hatası
```bash
nginx -t
systemctl restart nginx
tail -f /var/log/nginx/error.log
```

## ✅ Kontrol Listesi

- [ ] DNS kayıtları eklendi
- [ ] Sunucu yazılımları kuruldu
- [ ] PostgreSQL hazır
- [ ] Projeler klonlandı
- [ ] .env dosyaları oluşturuldu
- [ ] npm install ve build tamamlandı
- [ ] PM2 ile uygulamalar başlatıldı
- [ ] Nginx yapılandırıldı
- [ ] SSL kuruldu
- [ ] Firewall ayarlandı
- [ ] PM2 startup ayarlandı
- [ ] Domainler test edildi
- [ ] API test edildi
- [ ] Admin panel çalışıyor
- [ ] Frontend çalışıyor
- [ ] Backup stratejisi kuruldu

## 📞 İletişim

- **Email**: info@ahikurumsal.com
- **Telefon**: +90 (326) 614 01 53
- **Adres**: Yeni Mahalle, Şehit Fuat Bey Caddesi No:1/3, İskenderun/Hatay

---

**Son Güncelleme**: 13 Kasım 2025

