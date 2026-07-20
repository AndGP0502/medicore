# MediCore Móvil

App móvil (React Native + Expo + TypeScript + Expo Router) del CRM clínico MediCore.
Consume el backend FastAPI existente en `../backend` (`/api/v1`).

## Requisitos

- Node 18+
- Backend MediCore corriendo (por defecto en `http://localhost:8000`)
- App **Expo Go** en el teléfono, o un emulador Android/iOS

## Configuración

```bash
cd mobile
npm install
copy .env.example .env   # (Linux/macOS: cp .env.example .env)
```

Edita `.env` si el backend no está en localhost. **En un dispositivo físico**
`localhost` no funciona: usa la IP LAN de tu PC, por ejemplo:

```
EXPO_PUBLIC_API_URL=http://192.168.1.10:8000/api/v1
```

La URL también puede cambiarse en caliente desde la pantalla **Perfil** de la app.

## Ejecutar

```bash
npx expo start
```

Escanea el QR con Expo Go (Android) o la cámara (iOS).

## Validaciones

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint app src
npx expo-doctor     # chequeos del proyecto
```

## Arquitectura

- `app/` — rutas (Expo Router): login, tabs (Inicio, Pacientes, Citas, Más) y
  pantallas de Laboratorio, Inventario, Facturación, Reportes, IA y Perfil.
- `src/api/` — cliente Axios (refresh con cola anti-duplicados, tokens en
  `expo-secure-store`) y hooks de TanStack Query por módulo.
- `src/stores/` — Zustand solo para sesión.
- `src/components/` — UI compartida (estados de carga/error/vacío, formularios
  React Hook Form + Zod, listas paginadas, selectores de paciente/doctor).
- `src/types/api.ts` — tipos espejo de los schemas Pydantic del backend.

Notas:

- El backend usa *soft delete*: la UI habla de desactivar/archivar, nunca de
  borrado permanente.
- La app **no** implementa SRI ni firma electrónica (exclusivo del escritorio).
- Las respuestas del Asistente IA se muestran siempre como sugerencias de
  apoyo, no como diagnósticos confirmados.
