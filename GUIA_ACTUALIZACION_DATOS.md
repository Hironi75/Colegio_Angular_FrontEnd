# 📋 Guía para Actualizar Datos de Estudiantes en PocketBase

## ❗ Problema Actual
Los estudiantes no tienen el campo `grade` con el formato correcto que indique claramente si pertenecen a **Primaria** o **Secundaria**.

### Formatos actuales (INCORRECTOS):
- ❌ "1ero 'A'"
- ❌ "1er A"
- ❌ "5to Sec"

### Formatos correctos (RECOMENDADOS):
- ✅ "1° Primaria"
- ✅ "2° Primaria"
- ✅ "6° Primaria"
- ✅ "1° Secundaria"
- ✅ "5° Secundaria"

O también puedes usar formatos alternativos que el sistema ahora acepta:
- ✅ "1° Prim"
- ✅ "5° Sec"
- ✅ "3° Secundaria"

## 🔧 Cómo Actualizar los Datos en PocketBase

### Opción 1: Actualizar Manualmente (Pocos estudiantes)

1. Abre PocketBase en tu navegador
2. Ve a la colección `students`
3. Para cada estudiante, edita el campo `grade`:
   - Si es de **Primaria**: Usa formato "X° Primaria" (donde X es 1, 2, 3, 4, 5 o 6)
   - Si es de **Secundaria**: Usa formato "X° Secundaria" (donde X es 1, 2, 3, 4 o 5)

**Ejemplo:**
- Cristina Fuentes: Cambiar "1ero 'A'" → "1° Primaria"
- Miguel Angel Zenteno: Cambiar "1er A" → "1° Primaria"
- Tomas Zapata Ortiz: Cambiar "5to Sec" → "5° Secundaria"

### Opción 2: Actualizar Masivamente con SQL (Muchos estudiantes)

Si tienes muchos estudiantes, puedes usar SQL directamente en PocketBase:

```sql
-- Para actualizar estudiantes que tienen "Sec" en su grade a formato correcto
UPDATE students 
SET grade = REPLACE(grade, 'Sec', 'Secundaria')
WHERE grade LIKE '%Sec%';

-- Para actualizar formatos específicos
UPDATE students 
SET grade = '1° Primaria'
WHERE grade IN ('1ero A', '1er A', "1ero 'A'");

UPDATE students 
SET grade = '5° Secundaria'
WHERE grade = '5to Sec';
```

### Opción 3: Crear un Script de Migración

Puedes crear un archivo SQL con todas las actualizaciones necesarias:

```sql
-- Actualizar todos los grados de primaria
UPDATE students SET grade = '1° Primaria' WHERE grade LIKE '1%' AND grade NOT LIKE '%Sec%';
UPDATE students SET grade = '2° Primaria' WHERE grade LIKE '2%' AND grade NOT LIKE '%Sec%';
UPDATE students SET grade = '3° Primaria' WHERE grade LIKE '3%' AND grade NOT LIKE '%Sec%';
UPDATE students SET grade = '4° Primaria' WHERE grade LIKE '4%' AND grade NOT LIKE '%Sec%';
UPDATE students SET grade = '5° Primaria' WHERE grade LIKE '5%' AND grade NOT LIKE '%Sec%';
UPDATE students SET grade = '6° Primaria' WHERE grade LIKE '6%' AND grade NOT LIKE '%Sec%';

-- Actualizar todos los grados de secundaria
UPDATE students SET grade = '1° Secundaria' WHERE grade LIKE '1%Sec%';
UPDATE students SET grade = '2° Secundaria' WHERE grade LIKE '2%Sec%';
UPDATE students SET grade = '3° Secundaria' WHERE grade LIKE '3%Sec%';
UPDATE students SET grade = '4° Secundaria' WHERE grade LIKE '4%Sec%';
UPDATE students SET grade = '5° Secundaria' WHERE grade LIKE '5%Sec%';
```

## 🎯 Estructura Recomendada para Cursos

Asegúrate también que tus **cursos** tengan el campo `level` correctamente configurado:

### En la colección `courses`:
- Campo `level` debe ser exactamente: **"Primaria"** o **"Secundaria"**
- Ejemplo:
  - Matemáticas Básicas | level: "Primaria"
  - Física | level: "Secundaria"
  - Inglés I | level: "Primaria"

## 🔍 Verificación

Después de actualizar los datos:

1. Recarga la página de Notas en tu aplicación Angular
2. Selecciona un curso de **Primaria**
3. Verifica que solo aparezcan estudiantes con grado que contenga "Primaria"
4. Selecciona un curso de **Secundaria**
5. Verifica que solo aparezcan estudiantes con grado que contenga "Secundaria"

## 📊 Ejemplo Completo

### Antes:
| Estudiante | Grade | Problema |
|-----------|--------|----------|
| Cristina Fuentes | 1ero "A" | ❌ No especifica nivel |
| Miguel Angel | 1er A | ❌ No especifica nivel |
| Tomas Zapata | 5to Sec | ❌ Abreviatura ambigua |

### Después:
| Estudiante | Grade | ✅ Correcto |
|-----------|--------|-------------|
| Cristina Fuentes | 1° Primaria | ✅ Claro |
| Miguel Angel | 1° Primaria | ✅ Claro |
| Tomas Zapata | 5° Secundaria | ✅ Claro |

## 💡 Notas Adicionales

- El sistema ahora acepta variaciones como "Prim", "Sec", "Secundaria", "Primaria"
- Es importante ser consistente en el formato para facilitar futuras búsquedas y filtros
- Si un estudiante no tiene el formato correcto, verás una advertencia en la consola del navegador

