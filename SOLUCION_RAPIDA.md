# 🔧 Solución Rápida: Actualizar Estudiantes en PocketBase

## 📌 Problema Identificado

Según tu captura de pantalla, tienes estos estudiantes con formatos incorrectos:

| Estudiante | Grade Actual | ❌ Problema | ✅ Debería ser |
|-----------|--------------|-------------|----------------|
| Cristina Fuentes | 1ero "A" | No especifica nivel | 1° Primaria |
| Miguel Angel Zenteno Orallana | 1er A | No especifica nivel | 1° Primaria |
| Elias Zapata Ortiz | 1er A | No especifica nivel | 1° Primaria |
| Tomas Zapata Ortiz | 5to Sec | Abreviatura "Sec" | 5° Secundaria |

## 🚀 Solución Rápida (3 Opciones)

### ✅ Opción 1: Actualización Manual (RECOMENDADA si tienes pocos estudiantes)

1. Abre PocketBase en tu navegador: `http://127.0.0.1:8090/_/`
2. Ve a la colección `students`
3. Haz clic en cada estudiante para editarlo
4. Cambia el campo `grade`:

   **Para Cristina Fuentes:**
   - Actual: `1ero "A"`
   - Cambiar a: `1° Primaria`

   **Para Miguel Angel y Elias:**
   - Actual: `1er A`
   - Cambiar a: `1° Primaria`

   **Para Tomas Zapata:**
   - Actual: `5to Sec`
   - Cambiar a: `5° Secundaria`

### ✅ Opción 2: Usar el Script SQL Proporcionado

1. Abre PocketBase Admin
2. Ve a Settings > Backups (haz un backup primero por seguridad)
3. Abre la terminal en tu servidor donde está PocketBase
4. Ejecuta:

```bash
# Asumiendo que tu base de datos está en pb_data/data.db
sqlite3 pb_data/data.db < actualizar_grades_estudiantes.sql
```

O si prefieres hacerlo desde la interfaz web de PocketBase:
1. Copia el contenido del archivo `actualizar_grades_estudiantes.sql`
2. Ve a la sección de SQL en PocketBase (si está disponible)
3. Pega y ejecuta el script

### ✅ Opción 3: Comando SQL Directo (RÁPIDO)

Si solo quieres actualizar esos 4 estudiantes específicos, ejecuta este SQL:

```sql
-- Actualizar todos los estudiantes con "1ero" o "1er" a Primaria
UPDATE students 
SET grade = '1° Primaria'
WHERE grade IN ('1ero "A"', '1er A', "1ero 'A'");

-- Actualizar estudiantes con "5to Sec" a Secundaria
UPDATE students 
SET grade = '5° Secundaria'
WHERE grade = '5to Sec';

-- Verificar los cambios
SELECT full_name, grade FROM students WHERE full_name IN (
  'Cristina Fuentes',
  'Miguel Angel Zenteno Orallana',
  'Elias Zapata Ortiz',
  'Tomas Zapata Ortiz'
);
```

## 📋 Formato Estándar para el Campo "grade"

Después de actualizar, asegúrate de que TODOS tus nuevos estudiantes sigan este formato:

### Primaria (grados 1-6):
- ✅ `1° Primaria`
- ✅ `2° Primaria`
- ✅ `3° Primaria`
- ✅ `4° Primaria`
- ✅ `5° Primaria`
- ✅ `6° Primaria`

### Secundaria (grados 1-5):
- ✅ `1° Secundaria`
- ✅ `2° Secundaria`
- ✅ `3° Secundaria`
- ✅ `4° Secundaria`
- ✅ `5° Secundaria`

### ⚠️ También se aceptan (pero no recomendados):
- `1° Prim` (se reconoce como Primaria)
- `1° Sec` (se reconoce como Secundaria)

## 🎯 Verificación en la Aplicación

Después de actualizar los datos:

1. **Recarga la página de Notas** en tu aplicación Angular
2. Si ves una **alerta amarilla** en la parte superior, significa que aún hay estudiantes con formato incorrecto
3. La alerta te mostrará **exactamente qué estudiantes** necesitas actualizar
4. Una vez que todos estén correctos, la alerta desaparecerá

### Comportamiento esperado:

**Cuando selecciones un curso de Primaria:**
- Solo verás estudiantes con "Primaria" en su grade
- No verás estudiantes con "Secundaria"

**Cuando selecciones un curso de Secundaria:**
- Solo verás estudiantes con "Secundaria" en su grade
- No verás estudiantes con "Primaria"

## 🔍 Ejemplo Visual del Resultado

### ANTES (❌ Incorrecto):
```
Curso: Matemáticas - Primaria
Estudiantes disponibles:
  - Cristina Fuentes (1ero "A")     ❌ No aparece
  - Miguel Angel (1er A)             ❌ No aparece
  - Tomas Zapata (5to Sec)          ❌ Aparece (pero no debería)
```

### DESPUÉS (✅ Correcto):
```
Curso: Matemáticas - Primaria
Estudiantes disponibles:
  - Cristina Fuentes (1° Primaria)  ✅ Aparece correctamente
  - Miguel Angel (1° Primaria)      ✅ Aparece correctamente

Curso: Física - Secundaria
Estudiantes disponibles:
  - Tomas Zapata (5° Secundaria)    ✅ Aparece correctamente
```

## 💡 Consejo Final

Si vas a agregar más estudiantes en el futuro:
1. **Siempre** usa el formato completo: "X° Primaria" o "X° Secundaria"
2. Crea un documento de referencia para tu equipo
3. Considera validar este campo en PocketBase con una regla de validación

## ❓ ¿Preguntas Frecuentes?

**P: ¿Qué pasa si un estudiante no tiene el formato correcto?**  
R: No aparecerá en la lista de estudiantes disponibles cuando selecciones un curso. Verás una alerta amarilla indicándote cuáles necesitan corrección.

**P: ¿Puedo usar "Prim" en lugar de "Primaria"?**  
R: Sí, el sistema lo reconoce, pero es mejor usar el formato completo para claridad.

**P: ¿Cómo sé si ya actualicé todos los estudiantes?**  
R: La alerta amarilla desaparecerá automáticamente cuando todos los estudiantes tengan el formato correcto.

