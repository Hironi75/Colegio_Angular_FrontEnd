-- Script SQL para actualizar el campo grade de los estudiantes
-- Este script actualiza los datos basándose en los formatos actuales vistos en PocketBase

-- IMPORTANTE: Ejecuta este script en la base de datos de PocketBase
-- Puedes hacerlo desde la interfaz de PocketBase o usando sqlite3

-- =============================================================================
-- PASO 1: Actualizar estudiantes con formato "Xero" o "Xer" (probablemente Primaria)
-- =============================================================================

-- Actualizar "1ero 'A'" a "1° Primaria"
UPDATE students
SET grade = '1° Primaria'
WHERE grade LIKE '1ero%' OR grade LIKE '1er%' OR grade = "1ero 'A'";

-- Actualizar "2do A" a "2° Primaria"
UPDATE students
SET grade = '2° Primaria'
WHERE grade LIKE '2do%' OR grade LIKE '2nd%';

-- Actualizar "3ero A" a "3° Primaria"
UPDATE students
SET grade = '3° Primaria'
WHERE grade LIKE '3ero%' OR grade LIKE '3er%';

-- Actualizar "4to A" a "4° Primaria"
UPDATE students
SET grade = '4° Primaria'
WHERE grade LIKE '4to%' AND grade NOT LIKE '%Sec%';

-- Actualizar "5to A" a "5° Primaria"
UPDATE students
SET grade = '5° Primaria'
WHERE grade LIKE '5to%' AND grade NOT LIKE '%Sec%';

-- Actualizar "6to A" a "6° Primaria"
UPDATE students
SET grade = '6° Primaria'
WHERE grade LIKE '6to%' AND grade NOT LIKE '%Sec%';

-- =============================================================================
-- PASO 2: Actualizar estudiantes con formato "Xto Sec" (Secundaria)
-- =============================================================================

-- Actualizar "1ero Sec" o "1er Sec" a "1° Secundaria"
UPDATE students
SET grade = '1° Secundaria'
WHERE (grade LIKE '1ero%Sec%' OR grade LIKE '1er%Sec%') AND grade NOT LIKE '%Secundaria%';

-- Actualizar "2do Sec" a "2° Secundaria"
UPDATE students
SET grade = '2° Secundaria'
WHERE grade LIKE '2do%Sec%' AND grade NOT LIKE '%Secundaria%';

-- Actualizar "3ero Sec" o "3er Sec" a "3° Secundaria"
UPDATE students
SET grade = '3° Secundaria'
WHERE (grade LIKE '3ero%Sec%' OR grade LIKE '3er%Sec%') AND grade NOT LIKE '%Secundaria%';

-- Actualizar "4to Sec" a "4° Secundaria"
UPDATE students
SET grade = '4° Secundaria'
WHERE grade LIKE '4to%Sec%' AND grade NOT LIKE '%Secundaria%';

-- Actualizar "5to Sec" a "5° Secundaria"
UPDATE students
SET grade = '5° Secundaria'
WHERE grade LIKE '5to%Sec%' AND grade NOT LIKE '%Secundaria%';

-- =============================================================================
-- PASO 3: Verificar los cambios
-- =============================================================================

-- Ver todos los estudiantes con sus grados actualizados
SELECT id, full_name, grade, status
FROM students
ORDER BY grade;

-- Ver estudiantes que podrían tener formato incorrecto
-- (no contienen "Primaria" ni "Secundaria")
SELECT id, full_name, grade, status
FROM students
WHERE grade NOT LIKE '%Primaria%'
  AND grade NOT LIKE '%Secundaria%'
  AND grade NOT LIKE '%Prim%'
  AND grade NOT LIKE '%Sec%';

-- =============================================================================
-- OPCIONAL: Si quieres revertir cambios (cuidado, esto es solo un ejemplo)
-- =============================================================================

-- ADVERTENCIA: Esto borrará los cambios. Solo usa si necesitas revertir
-- CREATE TABLE students_backup AS SELECT * FROM students;
-- Para restaurar: INSERT INTO students SELECT * FROM students_backup;

