# SGPD - Sistema de Gestión de Proyectos y Demanda

Sistema de gestión de proyectos con integración a Jira para el seguimiento de iniciativas y demandas.

## 🚀 Características

- **Gestión de Proyectos**: Creación y seguimiento de proyectos con información detallada
- **Integración Jira**: Creación automática de tickets en Jira con transición a estado "Backlog"
- **Priorización**: Sistema de scoring basado en impacto y frecuencia
- **Gestión de Dependencias**: Seguimiento de dependencias entre sistemas
- **Dashboard**: Visualización de proyectos por gerencia y estado

## 🛠️ Tecnologías

- **Framework**: Next.js 14 (App Router)
- **Base de Datos**: PostgreSQL con Prisma ORM
- **UI**: React con Tailwind CSS
- **Autenticación**: NextAuth.js
- **Deploy**: Vercel
- **Integración**: Jira Cloud API

## 📋 Variables de Entorno

Configurar en Vercel o archivo `.env.local`:

```env
# Base de datos
DATABASE_URL="postgresql://..."

# Jira
JIRA_EMAIL="tu-email@ejemplo.com"
JIRA_API_TOKEN="tu-api-token"
JIRA_DOMAIN="tu-dominio.atlassian.net"
JIRA_PROJECT_KEY="TU-KEY"
JIRA_ISSUE_TYPE="Task"  # Opcional

# NextAuth
NEXTAUTH_SECRET="tu-secret"
NEXTAUTH_URL="https://tu-dominio.com"
```

## 🚀 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Migraciones de base de datos
npx prisma migrate dev

# Ejecutar en desarrollo
npm run dev
```

## 📦 Deployment

El proyecto está configurado para deployment automático en Vercel. Asegurar que las variables de entorno estén configuradas en el dashboard de Vercel.

## 📝 Estructura de Campos en Jira

Los proyectos se mapean automáticamente a campos personalizados de Jira:
- **Gerencia Solicitante** → `customfield_10073`
- **Impacto** → `customfield_10074` (categorías) y `customfield_10075` (descripción)
- **Puntaje de Impacto** → `customfield_10076`
- **Frecuencia** → `customfield_10077` (descripción)
- **Puntaje de Frecuencia** → `customfield_10078`
- **Requiere Cambios** → `customfield_10079`
- **Detalle de Dependencias** → `customfield_10080`

## 📄 Licencia

Proyecto interno.
