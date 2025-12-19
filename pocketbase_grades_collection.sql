-- Script para crear la colección de Notas en PocketBase
-- Este es un archivo de referencia. PocketBase usa su propia interfaz web para crear colecciones.

/*
INSTRUCCIONES PARA CREAR LA COLECCIÓN EN POCKETBASE:

1. Abre PocketBase Admin UI (http://127.0.0.1:8090/_/)
2. Ve a "Collections"
3. Click en "New collection"
4. Configura la colección de la siguiente manera:

NOMBRE: grades

CAMPOS:
┌─────────────┬──────────┬────────────┬──────────────────────────────────┐
│ Nombre      │ Tipo     │ Requerido  │ Opciones                         │
├─────────────┼──────────┼────────────┼──────────────────────────────────┤
│ student_id  │ Relation │ Sí         │ Collection: students             │
│             │          │            │ Single: Yes                      │
│             │          │            │ Display fields: full_name        │
├─────────────┼──────────┼────────────┼──────────────────────────────────┤
│ course_id   │ Relation │ Sí         │ Collection: courses              │
│             │          │            │ Single: Yes                      │
│             │          │            │ Display fields: title            │
├─────────────┼──────────┼────────────┼──────────────────────────────────┤
│ note1       │ Number   │ Sí         │ Min: 0, Max: 100                 │
├─────────────┼──────────┼────────────┼──────────────────────────────────┤
│ note2       │ Number   │ Sí         │ Min: 0, Max: 100                 │
├─────────────┼──────────┼────────────┼──────────────────────────────────┤
│ note3       │ Number   │ Sí         │ Min: 0, Max: 100                 │
├─────────────┼──────────┼────────────┼──────────────────────────────────┤
│ average     │ Number   │ No         │ Min: 0, Max: 100                 │
├─────────────┼──────────┼────────────┼──────────────────────────────────┤
│ status      │ Text     │ No         │ Max length: 20                   │
│             │          │            │ Pattern: ^(Aprobado|Reprobado)$  │
└─────────────┴──────────┴────────────┴──────────────────────────────────┘

REGLAS DE ACCESO (API Rules):
- List/View: @request.auth.id != "" (solo usuarios autenticados)
- Create/Update/Delete: @request.auth.id != "" (solo usuarios autenticados)

ÍNDICES (Indexes):
- CREATE INDEX idx_grades_student ON grades(student_id)
- CREATE INDEX idx_grades_course ON grades(course_id)
- CREATE UNIQUE INDEX idx_grades_unique ON grades(student_id, course_id)
  (Para evitar duplicados: un estudiante solo puede tener una entrada por curso)

*/

-- DATOS DE EJEMPLO (JSON para importar):
/*
[
  {
    "student_id": "RECORD_ID_STUDENT_1",
    "course_id": "RECORD_ID_COURSE_1",
    "note1": 75,
    "note2": 80,
    "note3": 85,
    "average": 80,
    "status": "Aprobado"
  },
  {
    "student_id": "RECORD_ID_STUDENT_2",
    "course_id": "RECORD_ID_COURSE_1",
    "note1": 45,
    "note2": 40,
    "note3": 50,
    "average": 45,
    "status": "Reprobado"
  },
  {
    "student_id": "RECORD_ID_STUDENT_3",
    "course_id": "RECORD_ID_COURSE_1",
    "note1": 90,
    "note2": 95,
    "note3": 88,
    "average": 91,
    "status": "Aprobado"
  }
]
*/

-- NOTA: Reemplaza RECORD_ID_STUDENT_X y RECORD_ID_COURSE_X con los IDs reales de tu base de datos.

