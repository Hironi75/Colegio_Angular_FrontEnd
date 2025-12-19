-- ============================================================================
-- SCRIPT PARA CREAR LA COLECCIÓN ENROLLMENTS Y DATOS DE EJEMPLO
-- ============================================================================
-- Este script te ayuda a configurar el sistema de matrículas en PocketBase
--
-- IMPORTANTE: Este es un script de REFERENCIA. Debes adaptarlo a tus IDs reales.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PASO 1: Verificar que existen las colecciones necesarias
-- ----------------------------------------------------------------------------

-- Ver todos los estudiantes
SELECT id, full_name, grade, status FROM students;

-- Ver todos los cursos
SELECT id, title, level, credits FROM courses;

-- ----------------------------------------------------------------------------
-- PASO 2: Crear enrollments de ejemplo
-- ----------------------------------------------------------------------------

-- NOTA: Reemplaza los IDs con los IDs reales de tu base de datos

-- Ejemplo 1: Matricular estudiantes de PRIMARIA en un curso de Matemáticas
-- Primero identifica el ID del curso y de los estudiantes:
/*
Supongamos:
- Curso "Matemáticas - Primaria" tiene ID: "abc123xyz"
- Cristina Fuentes tiene ID: "jwf2tty35iai0"
- Miguel Angel tiene ID: "zn5gukpgbtmc"
- Elias Zapata tiene ID: "jkzu09xkkwgqpp"
*/

INSERT INTO enrollments (student_id, course_id, enrollment_date, status)
VALUES
  -- Estudiantes de Primaria en Matemáticas
  ('jwf2tty35iai0', 'abc123xyz', datetime('now'), 'Activo'),  -- Cristina Fuentes
  ('zn5gukpgbtmc', 'abc123xyz', datetime('now'), 'Activo'),   -- Miguel Angel
  ('jkzu09xkkwgqpp', 'abc123xyz', datetime('now'), 'Activo'); -- Elias Zapata

-- Ejemplo 2: Matricular estudiante de SECUNDARIA en Física
/*
Supongamos:
- Curso "Física - Secundaria" tiene ID: "def456uvw"
- Tomas Zapata tiene ID: "x2ch81x4q7syem0"
*/

INSERT INTO enrollments (student_id, course_id, enrollment_date, status)
VALUES
  ('x2ch81x4q7syem0', 'def456uvw', datetime('now'), 'Activo'); -- Tomas Zapata

-- ----------------------------------------------------------------------------
-- PASO 3: Script para matricular TODOS los estudiantes de un grado en un curso
-- ----------------------------------------------------------------------------

-- TEMPLATE: Matricular todos los estudiantes que contengan "Primaria" en su grade
-- a un curso específico de Primaria

-- Primero, identifica el ID del curso:
-- SELECT id FROM courses WHERE title = 'Matemáticas' AND level = 'Primaria';

-- Luego ejecuta (reemplaza COURSE_ID_AQUI):
/*
INSERT INTO enrollments (student_id, course_id, enrollment_date, status)
SELECT
  id as student_id,
  'COURSE_ID_AQUI' as course_id,
  datetime('now') as enrollment_date,
  'Activo' as status
FROM students
WHERE grade LIKE '%Primaria%' OR grade LIKE '%1er%' OR grade LIKE '%1ero%'
  AND status = 'Activo';
*/

-- TEMPLATE: Matricular todos los estudiantes que contengan "Sec" en su grade
-- a un curso específico de Secundaria

/*
INSERT INTO enrollments (student_id, course_id, enrollment_date, status)
SELECT
  id as student_id,
  'COURSE_ID_AQUI' as course_id,
  datetime('now') as enrollment_date,
  'Activo' as status
FROM students
WHERE (grade LIKE '%Sec%' OR grade LIKE '%Secundaria%')
  AND status = 'Activo';
*/

-- ----------------------------------------------------------------------------
-- PASO 4: Queries útiles para verificar y gestionar enrollments
-- ----------------------------------------------------------------------------

-- Ver todas las matrículas con nombres legibles
SELECT
  e.id,
  s.full_name as estudiante,
  s.grade as grado,
  c.title as curso,
  c.level as nivel,
  e.enrollment_date as fecha_matricula,
  e.status
FROM enrollments e
LEFT JOIN students s ON e.student_id = s.id
LEFT JOIN courses c ON e.course_id = c.id
ORDER BY c.title, s.full_name;

-- Ver cuántos estudiantes hay por curso
SELECT
  c.title as curso,
  c.level as nivel,
  COUNT(e.id) as total_estudiantes
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'Activo'
GROUP BY c.id, c.title, c.level
ORDER BY c.level, c.title;

-- Ver en qué cursos está matriculado un estudiante específico
SELECT
  s.full_name as estudiante,
  c.title as curso,
  c.level as nivel,
  e.status
FROM enrollments e
JOIN students s ON e.student_id = s.id
JOIN courses c ON e.course_id = c.id
WHERE s.full_name LIKE '%Cristina%'; -- Cambia el nombre

-- Ver estudiantes que NO están matriculados en ningún curso
SELECT
  s.id,
  s.full_name,
  s.grade
FROM students s
LEFT JOIN enrollments e ON s.id = e.student_id AND e.status = 'Activo'
WHERE e.id IS NULL
  AND s.status = 'Activo';

-- Ver cursos que NO tienen estudiantes matriculados
SELECT
  c.id,
  c.title,
  c.level
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'Activo'
WHERE e.id IS NULL;

-- ----------------------------------------------------------------------------
-- PASO 5: Mantenimiento - Cambiar matrículas
-- ----------------------------------------------------------------------------

-- Desactivar una matrícula (el estudiante deja el curso)
-- UPDATE enrollments
-- SET status = 'Inactivo'
-- WHERE student_id = 'STUDENT_ID' AND course_id = 'COURSE_ID';

-- Cambiar un estudiante de curso
-- 1. Desactivar matrícula anterior
-- UPDATE enrollments SET status = 'Inactivo'
-- WHERE student_id = 'STUDENT_ID' AND course_id = 'OLD_COURSE_ID';

-- 2. Crear nueva matrícula
-- INSERT INTO enrollments (student_id, course_id, enrollment_date, status)
-- VALUES ('STUDENT_ID', 'NEW_COURSE_ID', datetime('now'), 'Activo');

-- Eliminar matrículas duplicadas (por si hay error)
/*
DELETE FROM enrollments
WHERE id NOT IN (
  SELECT MIN(id)
  FROM enrollments
  GROUP BY student_id, course_id
);
*/

-- ----------------------------------------------------------------------------
-- PASO 6: PLANTILLA PRÁCTICA - Usa esto para empezar rápido
-- ----------------------------------------------------------------------------

-- 1. Obtén los IDs que necesitas:
SELECT '=== ESTUDIANTES ===' as info;
SELECT id, full_name, grade FROM students WHERE status = 'Activo';

SELECT '=== CURSOS ===' as info;
SELECT id, title, level FROM courses;

-- 2. Copia y adapta esta plantilla para cada matrícula:
/*
INSERT INTO enrollments (student_id, course_id, enrollment_date, status) VALUES
  ('[ID_ESTUDIANTE_1]', '[ID_CURSO]', datetime('now'), 'Activo'),
  ('[ID_ESTUDIANTE_2]', '[ID_CURSO]', datetime('now'), 'Activo'),
  ('[ID_ESTUDIANTE_3]', '[ID_CURSO]', datetime('now'), 'Activo');
*/

-- 3. Verifica que se crearon correctamente:
-- SELECT * FROM enrollments ORDER BY created DESC LIMIT 10;

-- ============================================================================
-- TIPS IMPORTANTES
-- ============================================================================
/*
1. SIEMPRE haz un backup antes de ejecutar scripts masivos
2. Prueba primero con 1-2 matrículas antes de hacer inserciones masivas
3. El índice único previene duplicados (student_id + course_id)
4. Usa 'Inactivo' en lugar de DELETE para mantener historial
5. La fecha de matrícula es opcional pero útil para reportes
*/

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================
/*
ERROR: "UNIQUE constraint failed"
└── Ya existe una matrícula para ese estudiante en ese curso
    Solución: Verifica con SELECT antes de INSERT

ERROR: "FOREIGN KEY constraint failed"
└── El student_id o course_id no existen
    Solución: Verifica los IDs con SELECT id FROM students/courses

No aparecen estudiantes en la app:
└── 1. Verifica que status = 'Activo'
    2. Verifica que los IDs sean correctos
    3. Revisa la consola del navegador (F12)
*/

