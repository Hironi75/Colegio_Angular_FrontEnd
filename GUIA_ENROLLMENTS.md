# 📚 Guía Completa: Sistema de Matrículas (Enrollments)

## 🎯 ¿Por qué necesitas Enrollments?

El campo `grade` (como "1ero 'A'", "5to Sec") **NO es suficiente** para saber qué estudiantes pertenecen a cada curso/aula porque:

- ❌ Es ambiguo: "1er A" podría ser cualquier materia de primer grado
- ❌ No establece una relación directa: estudiante ↔ curso
- ❌ Dificulta filtrar: ¿Cómo sabes qué estudiantes toman Matemáticas vs Física?

### ✅ Solución: Tabla de Enrollments (Matrículas)

Crea una tabla que relacione **qué estudiantes están matriculados en qué cursos**:

```
Enrollment (Matrícula)
├── student_id → Qué estudiante
├── course_id → En qué curso/aula
├── enrollment_date → Cuándo se matriculó
└── status → Activo/Inactivo
```

---

## 📋 PASO 1: Crear Colección en PocketBase

### 1.1 Acceder a PocketBase Admin

1. Abre tu navegador
2. Ve a: `http://127.0.0.1:8090/_/` (o tu URL de PocketBase)
3. Inicia sesión con tu cuenta de administrador

### 1.2 Crear Nueva Colección

1. Haz clic en **"Collections"** en el menú lateral
2. Haz clic en **"+ New collection"**
3. Configura:
   - **Name:** `enrollments`
   - **Type:** Base collection

### 1.3 Agregar Campos

Haz clic en **"+ New field"** para cada campo:

#### Campo 1: student_id
```
Type: Relation
Options:
  ├── Collection: students
  ├── Single: ✓ (checked)
  ├── Display fields: full_name
  └── Required: ✓ (checked)
```

#### Campo 2: course_id
```
Type: Relation
Options:
  ├── Collection: courses
  ├── Single: ✓ (checked)
  ├── Display fields: title
  └── Required: ✓ (checked)
```

#### Campo 3: enrollment_date
```
Type: Date
Options:
  └── Required: ☐ (unchecked - opcional)
```

#### Campo 4: status
```
Type: Select
Options:
  ├── Values: Activo, Inactivo
  ├── Max select: 1
  └── Required: ☐ (unchecked - opcional)
```

### 1.4 Configurar Índice Único (IMPORTANTE)

1. Ve a la pestaña **"Indexes"** de la colección `enrollments`
2. Haz clic en **"+ New index"**
3. Configura:
   ```
   Index name: idx_unique_enrollment
   Fields: student_id, course_id
   Unique: ✓ (checked)
   ```

Esto evita que un estudiante se matricule dos veces en el mismo curso.

### 1.5 Configurar Reglas de Acceso (API Rules)

En la pestaña **"API Rules"**:

```
List/View: @request.auth.id != ""
Create: @request.auth.id != ""
Update: @request.auth.id != ""
Delete: @request.auth.id != ""
```

---

## 📊 PASO 2: Registrar Matrículas

Ahora debes **matricular a tus estudiantes en los cursos**. Tienes dos opciones:

### Opción A: Manualmente (Interfaz Web)

1. En PocketBase, ve a la colección `enrollments`
2. Haz clic en **"+ New record"**
3. Rellena:
   - **student_id:** Selecciona al estudiante
   - **course_id:** Selecciona el curso
   - **status:** Activo
4. Repite para cada estudiante en cada curso

**Ejemplo:**

| student_id | course_id | status |
|-----------|-----------|--------|
| Cristina Fuentes | Matemáticas - Primaria | Activo |
| Miguel Angel | Matemáticas - Primaria | Activo |
| Tomas Zapata | Física - Secundaria | Activo |

### Opción B: Importación Masiva (JSON)

1. Prepara un archivo JSON con tus matrículas:

```json
[
  {
    "student_id": "STUDENT_ID_1",
    "course_id": "COURSE_ID_MATEMATICAS_PRIMARIA",
    "enrollment_date": "2025-01-01 00:00:00.000Z",
    "status": "Activo"
  },
  {
    "student_id": "STUDENT_ID_2",
    "course_id": "COURSE_ID_MATEMATICAS_PRIMARIA",
    "enrollment_date": "2025-01-01 00:00:00.000Z",
    "status": "Activo"
  },
  {
    "student_id": "STUDENT_ID_3",
    "course_id": "COURSE_ID_FISICA_SECUNDARIA",
    "enrollment_date": "2025-01-01 00:00:00.000Z",
    "status": "Activo"
  }
]
```

2. En PocketBase, ve a `enrollments` → **"Import"**
3. Pega el JSON y haz clic en **"Import"**

### Opción C: Script SQL (Para muchos estudiantes)

Si tienes muchos estudiantes, crea un script:

```sql
-- Ejemplo: Matricular todos los estudiantes de 1er grado en Matemáticas Primaria

-- Primero, obtén los IDs
SELECT id, full_name FROM students WHERE grade LIKE '1%';
SELECT id, title FROM courses WHERE title = 'Matemáticas' AND level = 'Primaria';

-- Luego inserta las matrículas (reemplaza STUDENT_ID y COURSE_ID)
INSERT INTO enrollments (student_id, course_id, enrollment_date, status) VALUES
  ('STUDENT_ID_1', 'COURSE_ID_MATEMATICAS', '2025-01-01', 'Activo'),
  ('STUDENT_ID_2', 'COURSE_ID_MATEMATICAS', '2025-01-01', 'Activo'),
  ('STUDENT_ID_3', 'COURSE_ID_MATEMATICAS', '2025-01-01', 'Activo');
```

---

## 🎯 PASO 3: Verificar en la Aplicación Angular

1. **Recarga la aplicación** en tu navegador
2. Ve a **"Gestión de Notas"**
3. **La alerta amarilla debería desaparecer** si configuraste enrollments correctamente
4. Selecciona un curso:
   - ✅ Solo deberían aparecer los estudiantes **matriculados en ese curso**
   - ✅ No aparecerán estudiantes de otros cursos

### Ejemplo de Comportamiento Esperado:

```
Curso: Matemáticas - Primaria
├── Estudiantes disponibles:
│   ├── ✅ Cristina Fuentes (matriculada en Matemáticas)
│   ├── ✅ Miguel Angel (matriculado en Matemáticas)
│   └── ❌ Tomas Zapata (NO matriculado, está en Física)

Curso: Física - Secundaria
├── Estudiantes disponibles:
│   ├── ❌ Cristina Fuentes (NO matriculada, está en Matemáticas)
│   ├── ❌ Miguel Angel (NO matriculado, está en Matemáticas)
│   └── ✅ Tomas Zapata (matriculado en Física)
```

---

## 🔍 PASO 4: Debug y Verificación

### 4.1 Verificar en Consola del Navegador

Abre la consola (F12) y verás logs como:

```
=== ESTUDIANTES DISPONIBLES (CON ENROLLMENTS) ===
Curso seleccionado: xxx
Estudiantes matriculados en este curso: ["student_id_1", "student_id_2"]
Estudiantes con notas en este curso: []
Estudiantes disponibles: Cristina Fuentes (1ero "A"), Miguel Angel (1er A)
```

### 4.2 Si no aparecen estudiantes:

```
⚠️ No hay estudiantes matriculados en este curso. 
   Configura las matrículas (enrollments) primero.
```

**Solución:** Verifica que:
- ✅ La colección `enrollments` existe
- ✅ Hay registros en `enrollments` para ese curso
- ✅ El campo `status` está en "Activo"

### 4.3 Consulta SQL para Verificar

```sql
-- Ver todas las matrículas
SELECT 
  e.id,
  s.full_name as student,
  c.title as course,
  e.status
FROM enrollments e
JOIN students s ON e.student_id = s.id
JOIN courses c ON e.course_id = c.id;

-- Ver matrículas de un curso específico
SELECT s.full_name 
FROM enrollments e
JOIN students s ON e.student_id = s.id
WHERE e.course_id = 'COURSE_ID_AQUI' AND e.status = 'Activo';
```

---

## 🎓 PASO 5: Gestión Continua

### Para agregar un nuevo estudiante a un curso:

1. Ve a `enrollments` en PocketBase
2. Crea un nuevo registro:
   - student_id: [Selecciona estudiante]
   - course_id: [Selecciona curso]
   - status: Activo

### Para remover un estudiante de un curso:

**Opción 1:** Cambiar status a "Inactivo" (mantiene historial)
**Opción 2:** Eliminar el registro (permanente)

### Para mover un estudiante de curso:

1. Cambia el enrollment anterior a "Inactivo"
2. Crea un nuevo enrollment con el nuevo curso

---

## 💡 Ventajas de Este Sistema

✅ **Claridad:** Sabes exactamente qué estudiantes están en qué curso
✅ **Flexibilidad:** Un estudiante puede estar en múltiples cursos
✅ **Historial:** Puedes ver matrículas pasadas (status: Inactivo)
✅ **Escalabilidad:** Fácil de gestionar con muchos estudiantes
✅ **Validación:** El índice único previene duplicados
✅ **Filtrado correcto:** Las notas solo se asignan a estudiantes matriculados

---

## 📝 Resumen de Estructura Final

```
students (Estudiantes)
├── id
├── full_name
├── grade (puede ser cualquier formato ahora)
└── status

courses (Cursos)
├── id
├── title
├── level
└── credits

enrollments (Matrículas) ← NUEVO
├── id
├── student_id → students.id
├── course_id → courses.id
├── enrollment_date
└── status (Activo/Inactivo)

grades (Notas)
├── id
├── student_id → students.id
├── course_id → courses.id
├── note1, note2, note3
└── average
```

---

## ❓ Preguntas Frecuentes

**P: ¿Necesito cambiar el campo `grade` de los estudiantes?**  
R: ¡No! Puedes dejarlo como está. Ahora la relación estudiante-curso se maneja con `enrollments`.

**P: ¿Qué pasa con las notas existentes?**  
R: Se mantienen. Solo necesitas crear los enrollments correspondientes.

**P: ¿Puedo tener un estudiante en múltiples cursos?**  
R: ¡Sí! Crea un enrollment por cada curso en el que esté matriculado.

**P: ¿Cómo matriculo a todo un grado en un curso?**  
R: Usa la Opción C (Script SQL) del Paso 2 para crear enrollments masivos.

---

**¡Este es el enfoque CORRECTO y profesional para gestionar estudiantes por curso!** 🎉

