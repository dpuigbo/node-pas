# Guía de Despliegue — PAS Robotics Manage en Hostinger VPS

## Requisitos previos

- VPS de Hostinger con Ubuntu/Debian
- Acceso SSH al servidor
- Dominio/subdominio apuntando a la IP del VPS (ej: `pas.tudominio.com`)
- Repositorio en GitHub

---

## Paso 1: Configurar el VPS (primera vez)

### 1.1 Conectarse por SSH

```bash
ssh root@TU_IP_VPS
```

### 1.2 Instalar Node.js (v20 LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version   # debería mostrar v20.x
npm --version
```

### 1.3 Instalar PM2 (gestor de procesos)

```bash
sudo npm install -g pm2
```

### 1.4 Instalar Nginx (reverse proxy)

```bash
sudo apt-get install -y nginx
```

### 1.5 Instalar Git

```bash
sudo apt-get install -y git
```

### 1.6 Crear un usuario para la app (recomendado)

```bash
sudo adduser pasapp
sudo usermod -aG sudo pasapp
su - pasapp
```

---

## Paso 2: Clonar y configurar la aplicación

### 2.1 Clonar el repositorio

```bash
cd /home/pasapp
git clone https://github.com/dpuigbo/node-pas.git
cd node-pas
```

### 2.2 Crear el archivo .env

```bash
cp .env.example .env
nano .env
```

Edita los valores:

```
NODE_ENV=production
PORT=3000
SESSION_SECRET=genera-un-secreto-largo-y-aleatorio-aqui
DB_PATH=/home/pasapp/node-pas/data/pas.db
```

Para generar un secreto seguro:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 2.3 Crear carpeta de datos

```bash
mkdir -p data
```

### 2.4 Instalar dependencias y compilar

```bash
npm install
cd server && npm install && cd ..
cd client && npm install && npx vite build && cd ..
```

### 2.5 Ejecutar migraciones y seeds

```bash
cd server
npx knex migrate:latest --knexfile src/db/knexfile.js
npx knex seed:run --knexfile src/db/knexfile.js
cd ..
```

### 2.6 Iniciar con PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup    # sigue las instrucciones que muestra para auto-inicio al reiniciar el VPS
```

Verificar que funciona:

```bash
curl http://localhost:3000/api/health
# Debería devolver: {"status":"ok","timestamp":"..."}
```

---

## Paso 3: Configurar Nginx como reverse proxy

### 3.1 Crear configuración del sitio

```bash
sudo nano /etc/nginx/sites-available/pas-robotics
```

Contenido (reemplaza `pas.tudominio.com`):

```nginx
server {
    listen 80;
    server_name pas.tudominio.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
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

### 3.2 Activar el sitio

```bash
sudo ln -s /etc/nginx/sites-available/pas-robotics /etc/nginx/sites-enabled/
sudo nginx -t           # verificar que no hay errores de sintaxis
sudo systemctl restart nginx
```

### 3.3 Instalar certificado SSL (Let's Encrypt)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d pas.tudominio.com
```

Certbot renovará el certificado automáticamente.

---

## Paso 4: Configurar deploys automáticos desde GitHub

### 4.1 Crear clave SSH en el VPS

En el VPS, como el usuario `pasapp`:

```bash
ssh-keygen -t ed25519 -C "deploy@pas-robotics" -f ~/.ssh/deploy_key -N ""
cat ~/.ssh/deploy_key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Copia la clave privada (la necesitarás en GitHub):

```bash
cat ~/.ssh/deploy_key
```

### 4.2 Configurar GitHub Secrets

Ve a tu repositorio en GitHub > **Settings** > **Secrets and variables** > **Actions** y añade:

| Secret | Valor |
|--------|-------|
| `VPS_HOST` | La IP de tu VPS (ej: `123.45.67.89`) |
| `VPS_USER` | `pasapp` (o el usuario que hayas creado) |
| `VPS_SSH_KEY` | El contenido completo de `~/.ssh/deploy_key` (la clave privada) |
| `VPS_PORT` | `22` (o el puerto SSH si lo cambiaste) |

### 4.3 Verificar el workflow

El archivo `.github/workflows/deploy.yml` ya está configurado. Cada vez que hagas push a `main`:

1. GitHub se conecta por SSH a tu VPS
2. Hace `git pull` para descargar los cambios
3. Instala dependencias
4. Compila el frontend
5. Ejecuta migraciones de base de datos
6. Reinicia la aplicación con PM2

### 4.4 Probar el deploy

Haz un cambio, commit, y push a `main`. Ve a tu repositorio > **Actions** para ver el progreso del deploy.

---

## Paso 5: Configurar el subdominio en Hostinger

### 5.1 En el panel de Hostinger (hPanel)

1. Ve a **Dominios** > tu dominio principal
2. Busca **DNS / Zona DNS**
3. Añade un registro **A**:
   - Nombre: `pas` (o el subdominio que quieras)
   - Apunta a: la IP de tu VPS
   - TTL: 14400
4. Espera a que propague (puede tardar hasta 24h, normalmente minutos)

### 5.2 Verificar

```bash
ping pas.tudominio.com   # debería resolver a la IP de tu VPS
```

---

## Comandos útiles de PM2

```bash
pm2 status              # ver estado de las apps
pm2 logs pas-robotics   # ver logs en tiempo real
pm2 restart pas-robotics # reiniciar
pm2 stop pas-robotics    # detener
pm2 monit               # monitor interactivo
```

---

## Estructura del proyecto

```
node-pas/
├── .env                    # Variables de entorno (NO se sube a git)
├── .github/workflows/      # CI/CD con GitHub Actions
│   └── deploy.yml
├── ecosystem.config.js     # Configuración PM2
├── package.json            # Scripts raíz
├── server/                 # Backend Express + SQLite
│   ├── src/
│   │   ├── index.js        # Punto de entrada
│   │   ├── config/         # Configuración BD
│   │   ├── db/             # Migraciones y seeds
│   │   ├── routes/         # Endpoints API
│   │   └── middleware/     # Error handler, etc.
│   └── package.json
├── client/                 # Frontend React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/          # Páginas (Dashboard, Clientes, etc.)
│   │   └── components/     # Componentes reutilizables
│   ├── index.html
│   └── package.json
└── data/                   # Base de datos SQLite (creada automáticamente)
```
