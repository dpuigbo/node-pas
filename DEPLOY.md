# Guía de Despliegue — PAS Robotics Manage en Hostinger

Esta guía cubre dos escenarios:

- **Opción A** — Hostinger **Node.js Web App** (hosting gestionado, sin SSH)
- **Opción B** — Hostinger **VPS** (control total con SSH, PM2, Nginx)

Elige la que corresponda a tu plan de Hostinger.

---

## Opción A: Hostinger Node.js Web App (recomendado)

Hostinger ofrece hosting gestionado para Node.js en los planes Business y Cloud.
No necesitas configurar Nginx, PM2 ni certificados SSL — todo está incluido.

### A.1 Crear la aplicación en hPanel

1. Entra en **hPanel** → **Websites** → **Add Website** → **Node.js Apps**
2. Conecta tu cuenta de GitHub (OAuth) e instala la extensión de Hostinger
3. Selecciona el repositorio `dpuigbo/node-pas` y la rama `main`

### A.2 Configurar los ajustes de build

| Campo | Valor |
|-------|-------|
| Install command | `npm run setup` |
| Build command | `npm run build` |
| Start command | `npm start` |
| Entry point | `server/src/index.js` |
| Output directory | `client/dist` |

> El script `npm run setup` instala dependencias del root, server y client, y
> compila el frontend. `npm start` arranca Express, que sirve el frontend
> compilado y la API.

### A.3 Variables de entorno

Configúralas en hPanel → **Environment Variables**:

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` (o el que asigne Hostinger) |
| `SESSION_SECRET` | Un string largo aleatorio |
| `DB_HOST` | `127.0.0.1` (si la BD está en el mismo hosting) |
| `DB_PORT` | `3306` |
| `DB_USER` | `u306143177_admin_db_user` |
| `DB_PASSWORD` | Tu contraseña de MySQL |
| `DB_NAME` | `u306143177_admin_db` |

Para generar un secreto seguro:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### A.4 Despliegue automático

Cada push a `main` en GitHub dispara automáticamente un redeploy en Hostinger.
No necesitas GitHub Actions: Hostinger detecta los cambios vía su integración con GitHub.

### A.5 Configurar el subdominio

1. En hPanel → **Dominios** → tu dominio → **DNS / Zona DNS**
2. Añade un registro **A**: nombre = `pas`, apunta a = IP del hosting
3. En la config de la app Node.js, asocia el subdominio `pas.tudominio.com`

---

## Opción B: Hostinger VPS (control total)

### B.1 Conectarse por SSH

```bash
ssh root@TU_IP_VPS
```

### B.2 Instalar Node.js (v20 LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### B.3 Instalar PM2 y Nginx

```bash
sudo npm install -g pm2
sudo apt-get install -y nginx git
```

### B.4 Crear un usuario para la app

```bash
sudo adduser pasapp
sudo usermod -aG sudo pasapp
su - pasapp
```

### B.5 Clonar y configurar

```bash
cd /home/pasapp
git clone https://github.com/dpuigbo/node-pas.git
cd node-pas
cp .env.example .env
nano .env          # rellena con los datos de tu BD MySQL
```

### B.6 Instalar, compilar y arrancar

```bash
npm run setup      # instala todo y compila el frontend
pm2 start ecosystem.config.js
pm2 save
pm2 startup        # sigue las instrucciones para auto-inicio
```

Verificar:

```bash
curl http://localhost:3000/api/health
```

### B.7 Configurar Nginx como reverse proxy

```bash
sudo nano /etc/nginx/sites-available/pas-robotics
```

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

```bash
sudo ln -s /etc/nginx/sites-available/pas-robotics /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### B.8 Certificado SSL

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d pas.tudominio.com
```

### B.9 Deploy automático con GitHub Actions

El workflow `.github/workflows/deploy.yml` usa SSH. Configura estos secretos en
GitHub → **Settings** → **Secrets and variables** → **Actions**:

| Secret | Valor |
|--------|-------|
| `VPS_HOST` | IP de tu VPS |
| `VPS_USER` | `pasapp` |
| `VPS_SSH_KEY` | Contenido de `~/.ssh/deploy_key` (clave privada) |
| `VPS_PORT` | `22` |

Genera la clave en el VPS:

```bash
ssh-keygen -t ed25519 -C "deploy@pas-robotics" -f ~/.ssh/deploy_key -N ""
cat ~/.ssh/deploy_key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
cat ~/.ssh/deploy_key   # copia esto a GitHub Secret VPS_SSH_KEY
```

### B.10 Configurar el subdominio

1. En hPanel → **Dominios** → tu dominio → **DNS / Zona DNS**
2. Registro **A**: nombre = `pas`, apunta a = IP del VPS, TTL = 14400

---

## Preparar la base de datos

La app usa la BD MySQL existente (`u306143177_admin_db`). Ver `DB.md` para
detalles de la auditoría.

Si es la primera vez, ejecuta el script de saneamiento (una sola vez, con
backup previo):

```bash
mysql -h 127.0.0.1 -u USUARIO -p NOMBRE_BD < server/src/db/sql/limpieza_produccion.sql
```

Para crear una BD vacía desde cero:

```bash
mysql -h 127.0.0.1 -u USUARIO -p NOMBRE_BD < server/src/db/sql/schema_limpio.sql
```

---

## Comandos útiles de PM2 (solo VPS)

```bash
pm2 status              # ver estado
pm2 logs pas-robotics   # logs en tiempo real
pm2 restart pas-robotics
pm2 monit               # monitor interactivo
```

---

## Estructura del proyecto

```
node-pas/
├── .env                    # Variables de entorno (NO se sube a git)
├── .github/workflows/      # CI/CD con GitHub Actions
│   └── deploy.yml
├── ecosystem.config.js     # Configuración PM2 (solo VPS)
├── package.json            # Scripts raíz (setup, build, start)
├── DB.md                   # Auditoría de la base de datos
├── server/                 # Backend Express + MySQL (knex)
│   ├── src/
│   │   ├── index.js        # Punto de entrada
│   │   ├── config/         # Configuración BD
│   │   ├── db/sql/         # schema_limpio.sql, limpieza_produccion.sql
│   │   ├── routes/         # Endpoints API
│   │   └── middleware/     # Error handler
│   └── package.json
└── client/                 # Frontend React + Vite + Tailwind
    ├── src/
    │   ├── pages/          # Dashboard, Clientes, Modelos, etc.
    │   └── components/     # Sidebar, etc.
    ├── index.html
    └── package.json
```
