# Sección de Notas - Documentación

## 📝 Descripción

La nueva sección de **Notas** permite gestionar las calificaciones de los estudiantes por curso. Incluye las siguientes características:

### ✨ Características principales:

1. **Selección de Curso**: Primero debes seleccionar un curso para ver y gestionar las notas de ese curso específico.

2. **Registro de Notas**: Cada nota tiene 3 espacios para calificaciones:
   - Nota 1
   - Nota 2
   - Nota 3

3. **Cálculo Automático del Promedio**: El sistema calcula automáticamente el promedio de las 3 notas.

4. **Estado de Aprobación**:
   - **Aprobado**: Si el promedio es mayor o igual a 51
   - **Reprobado**: Si el promedio es menor a 51

5. **Exportación a PDF**: Puedes exportar todas las notas del curso seleccionado a un archivo PDF que incluye:
   - Información del curso
   - Tabla con todas las notas
   - Estadísticas (total de estudiantes, aprobados, reprobados, promedio general)

6. **Panel de Estadísticas**: Muestra en tiempo real:
   - Total de estudiantes
   - Cantidad de aprobados
   - Cantidad de reprobados
   - Promedio general del curso

### 🎯 Cómo usar la sección:

1. **Acceder a la sección**: Click en "Notas" en el menú de navegación

2. **Seleccionar un curso**: En el selector desplegable, elige el curso que deseas gestionar

3. **Agregar una nota**:
   - Selecciona un estudiante
   - Ingresa las 3 notas (0-100)
   - Click en "Guardar"

4. **Editar una nota**:
   - Click en el botón ✏️ en la fila de la nota
   - Modifica los valores
   - Click en "Actualizar"

5. **Eliminar una nota**:
   - Click en el botón 🗑️ en la fila de la nota
   - Confirma la eliminación

6. **Exportar a PDF**:
   - Click en el botón "📄 Exportar a PDF"
   - El archivo se descargará automáticamente

### 🎨 Interfaz:

- **Tarjetas de estadísticas codificadas por colores**:
  - Verde para aprobados
  - Rojo para reprobados
  - Azul para información general

- **Tabla de notas con colores**:
  - Badge verde para "Aprobado"
  - Badge rojo para "Reprobado"

### 🔧 Configuración técnica:

La sección de notas requiere:

1. **Colección en PocketBase**: `grades` con los siguientes campos:
   - `student_id` (Relation - students)
   - `course_id` (Relation - courses)
   - `note1` (Number)
   - `note2` (Number)
   - `note3` (Number)
   - `average` (Number)
   - `status` (Text - "Aprobado" o "Reprobado")

2. **Dependencias instaladas**:
   - `jspdf`: Para generar PDFs
   - `jspdf-autotable`: Para crear tablas en los PDFs

### 📦 Archivos creados:

```
src/app/
├── core/services/
│   └── grades.service.ts          # Servicio para gestionar notas
└── sections/grades/
    ├── grades.component.ts        # Lógica del componente
    ├── grades.component.html      # Plantilla HTML
    └── grades.component.css       # Estilos del componente
```

### 🚀 Comandos:

```bash
# Desarrollo
npm start

# Compilar para producción
npm run build

# Servidor SSR
npm run serve:ssr:ColegioAngular
```

### 📊 Regla de aprobación:

```
Promedio = (Nota1 + Nota2 + Nota3) / 3

Si Promedio >= 51 → Aprobado
Si Promedio < 51 → Reprobado
```

## 🎓 Ejemplo de uso:

1. Usuario selecciona "Matemáticas - 5to Grado"
2. Registra notas para "Juan Pérez": 60, 55, 70
3. El sistema calcula: Promedio = 61.67
4. Estado: **Aprobado** (verde)
5. Usuario puede exportar el reporte completo a PDF

---

¡La sección de Notas está lista para usar! 🎉

