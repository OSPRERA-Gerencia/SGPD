# Pasos para Arreglar Carga y Agregar Estado de Revisión

## Problema 1: Proyectos no aparecen en la página

**Causa**: Las nuevas columnas (`development_points`, `functional_points`, `is_reviewed_by_team`, etc.) no existen en la base de datos todavía.

**Solución**: Ejecutar AMBAS migraciones en Supabase SQL Editor:

1. `migration_add_project_overrides.sql` - Agrega columnas de puntos y override values
2. `migration_add_review_tracking.sql` - Agrega columnas de tracking de revisión

**Después de ejecutar**:
- Recargar localhost:3000/projects
- Los proyectos deberían aparecer normalmente

---

## Problema 2: Marcar proyectos como revisados

**Funcionalidad implementada**:
1. Cuando guardás valores considerados (override) en el modal → se marca `is_reviewed_by_team = true`
2. Se guarda timestamp en `reviewed_at`
3. El proyecto aparece con badge especial indicando que fue revisado

**Badge visual**: Los proyectos revisados tendrán un badge verde "✓ Revisado" en la tabla.

**Filtro para /sprints**: Podemos agregar filtro para mostrar solo proyectos revisados.

---

## Próximos pasos (opcional)

### Agregar badge "Revisado" en la tabla
Editar`ProjectsTable.tsx` para mostrar badge junto al título:

```tsx
{project.is_reviewed_by_team && (
  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
    ✓ Revisado
  </span>
)}
```

### Filtrar proyectos revisados en `/sprints`
Agregar filtro en query:
```ts
.eq('is_reviewed_by_team', true)
```
