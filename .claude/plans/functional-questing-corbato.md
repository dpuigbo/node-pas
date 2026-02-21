# Plan: Fix TypeScript build errors (unused imports)

## Contexto
El build del client falla con 3 errores TS6133 (imports declarados pero no usados). El usuario está haciendo `git pull` + `npm run build` manual en SSH porque el auto-deploy de Hostinger no funciona.

## Archivos a corregir

### 1. `client/src/pages/Dashboard.tsx` (linea 8)
- Eliminar `CheckCircle` del import de lucide-react (no se usa)

### 2. `client/src/pages/FabricantesPage.tsx` (linea 3)
- Eliminar `GripVertical` del import de lucide-react (no se usa)

### 3. `client/src/pages/ModelosPage.tsx` (linea 3)
- Eliminar `Pencil` del import de lucide-react (no se usa)

## Verificacion
- Commit + push
- En SSH: `git pull origin main && npm run build && touch tmp/restart.txt`
- Navegar a `https://admin.pasrobotics.com/api/auth/dev-login`
