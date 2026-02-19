# PAS Robotics Manage — Especificacion Funcional

Aplicacion web de gestion de mantenimiento preventivo y correctivo para robots industriales.

El nucleo del sistema es un **editor visual de bloques WYSIWYG** donde el usuario disena plantillas de informes de mantenimiento y ve en tiempo real como se imprimiran. Cuando un tecnico va a una intervencion, el sistema genera informes a partir de esas plantillas, el tecnico rellena los datos en campo, y el sistema produce un PDF profesional listo para entregar al cliente.

El idioma de toda la interfaz es **espanol**.

---

## 1. Modelo de Dominio

### Jerarquia de entidades

```
Cliente
  +-- Plantas (ubicaciones fisicas)
  |     +-- Maquinas (lineas de produccion / celulas)
  |           +-- Sistemas roboticos
  |                 +-- Componentes del sistema (controladora, unidades mecanicas, drive units)
  +-- Intervenciones (visitas de mantenimiento)
        +-- Informes (uno por sistema intervenido)
              +-- Componentes del informe (datos rellenados por el tecnico)
```

### Entidades

**Cliente**: empresa a la que se presta servicio. Nombre, sede, y parametros de facturacion (tarifa hora trabajo, tarifa hora viaje, dietas, peajes, km).

**Planta**: ubicacion fisica del cliente. Tiene direccion. Unica por (cliente, nombre).

**Maquina**: linea de produccion o celula dentro de una planta. Pertenece a cliente + planta.

**Fabricante**: catalogo de fabricantes de robots (ABB, KUKA, FANUC...). Nombre, activo/inactivo, orden de visualizacion.

**Modelo de componente**: catalogo de modelos de controladora, unidad mecanica o drive unit. Pertenece a un fabricante. Tiene:
- Tipo: `controller` | `mechanical_unit` | `drive_unit`
- Nombre, notas
- Configuracion de aceites por eje (estructura JSON)
- Unico por (fabricante, tipo, nombre)

**Version de template**: cada modelo de componente puede tener multiples versiones de su plantilla de inspeccion. Cada version almacena:
- Un schema JSON con la definicion de bloques (ver seccion 3)
- Un numero de version (auto-incremental)
- Un estado: `borrador` | `activo` | `obsoleto`
- Notas del autor
- **Regla de negocio**: solo puede haber UNA version activa por modelo de componente a la vez. Al activar una, las demas activas pasan automaticamente a obsoletas.

**Sistema**: un sistema robotico instalado en un cliente. Pertenece a cliente + planta + maquina + fabricante. Unico por (cliente, fabricante, nombre).

**Componente del sistema**: instancia fisica de un componente dentro de un sistema. Tiene:
- Tipo: `controller` | `mechanical_unit` | `drive_unit`
- Referencia al modelo de componente
- Etiqueta, numero de serie, numero de ejes
- Metadatos adicionales (estructura libre)
- Un sistema tiene exactamente 1 controladora, y N unidades mecanicas y N drive units.

**Intervencion**: visita de mantenimiento a un cliente. Tiene:
- Tipo: `preventiva` | `correctiva`
- Estado: `borrador` | `en_curso` | `completada` | `facturada`
- Referencia, titulo, fechas inicio/fin, notas
- Relacion muchos-a-muchos con sistemas (una intervencion puede cubrir varios sistemas)

**Informe**: un informe por cada sistema incluido en una intervencion. Unico por (intervencion, sistema). Tiene:
- Estado: `borrador` | `finalizado` | `entregado`
- Fechas de realizacion, notas
- Usuario que lo creo (auditoria)

**Componente del informe**: datos rellenados por el tecnico para un componente especifico de un sistema. Tiene:
- Referencia al componente del sistema (unica — un componente solo aparece una vez por informe)
- Tipo de componente, etiqueta, orden de visualizacion
- Referencia a la version de template usada
- **Schema congelado** (snapshot): copia del schema del template en el momento de creacion. Cambios posteriores al template NO afectan informes existentes.
- **Datos rellenados** (JSON): los valores que introduce el tecnico

**Aceites** y **Consumibles**: catalogos con nombre, fabricante, costes y precios.

---

## 2. El Editor de Bloques WYSIWYG

### Layout de 3 paneles

```
+----------------+-----------------------------------------+------------------+
|                |                                         |                  |
|   PALETA       |           CANVAS A4                     |  CONFIGURACION   |
|   DE BLOQUES   |        (794 x 1123 px)                  |  DEL BLOQUE      |
|                |                                         |  SELECCIONADO    |
|  Categorias:   |  +-----------------------------------+  |                  |
|  - Estructura  |  | [Header]                          |  |  Titulo: ____    |
|  - Campos      |  | [SectionTitle]                    |  |  Color: #___     |
|  - Inspeccion  |  | [Tristate] <-- seleccionado       |  |  Nivel: ___      |
|  - Media       |  | [Tristate]                        |  |  Required: [ ]   |
|                |  | [Table]                           |  |                  |
|                |  | [Signature]                       |  |  [Duplicar]      |
|                |  +-----------------------------------+  |  [Eliminar]      |
|                |                                         |                  |
|                |  Indicador A4: 210x297mm                |                  |
+----------------+-----------------------------------------+------------------+
```

### Panel izquierdo — Paleta de bloques

Bloques agrupados por categoria (Estructura, Campos de datos, Inspeccion, Media y firma). El usuario puede:
- Hacer clic para anadir un bloque al final del canvas
- Arrastrar un bloque y soltarlo en una posicion concreta del canvas

### Panel central — Canvas A4

Contenedor proporcional a un A4 real (210x297mm) con margenes configurables. Comportamiento:
- Cada bloque se renderiza con los **mismos estilos que tendra en el PDF** (principio WYSIWYG)
- Clic sobre un bloque lo selecciona y abre su configuracion en el panel derecho
- Hover sobre un bloque revela controles inline: mover arriba/abajo, duplicar, eliminar
- Boton "+" entre bloques para insertar en esa posicion
- Indicador de salto de pagina (linea punteada) cada altura equivalente a un A4
- Drag and drop para reordenar bloques

### Panel derecho — Configuracion del bloque

Aparece al seleccionar un bloque. Muestra campos editables especificos del tipo de bloque seleccionado. Tipos de campo de configuracion soportados:
- Texto, numero, toggle (si/no), selector, color
- Lista clave-valor (con botones anadir/eliminar)
- Editor de columnas de tabla (anadir, eliminar, reordenar, editar nombre/tipo/ancho)
- Editor de filas fijas de tabla
- ESC cierra el panel

### Toolbar superior

- Toggle para mostrar/ocultar la paleta
- Nombre del template + indicador "Sin guardar" cuando hay cambios pendientes
- Selector de estado (Borrador / Activo / Obsoleto)
- Boton guardar
- Boton "Configuracion de pagina" (abre modal con margenes, orientacion, tamano de fuente)
- Boton "Vista previa PDF" (abre preview en iframe o nueva pestana)

### Estado del editor

El editor gestiona:
- Identificador de la version de template que se esta editando
- Nombre y estado del template
- Lista ordenada de bloques, donde cada bloque tiene: id (UUID), tipo, y configuracion
- Bloque actualmente seleccionado (o ninguno)
- Configuracion de pagina: orientacion (vertical/horizontal), margenes (mm), tamano de fuente base
- Flag de cambios sin guardar

### Acciones del editor

- **Anadir bloque**: crea bloque con UUID, configuracion por defecto, y clave auto-generada (para bloques de datos)
- **Eliminar bloque**
- **Duplicar bloque**: crea copia con nuevo UUID y sufijo en la clave
- **Mover arriba / abajo**: reordena
- **Reordenar por drag and drop**: reordena segun nueva lista de IDs
- **Seleccionar / deseleccionar bloque**
- **Actualizar configuracion de bloque**: campo simple o campo anidado (ej: columna 3 de una tabla)
- **Guardar**: persiste el schema. Valida que las claves sean unicas antes de guardar.

### Migracion de schemas legacy

Si el sistema tiene plantillas en formato antiguo (secciones con campos en vez de bloques), el editor las convierte automaticamente al formato de bloques al abrirlas.

---

## 3. Tipos de Bloque

Cada tipo de bloque es una unidad autocontenida que sabe:

1. **Identificarse**: tipo, nombre para mostrar, icono, categoria
2. **Configurarse**: valores por defecto, esquema de configuracion
3. **Renderizarse en 3 contextos**:
   - **Preview**: como se ve en el canvas del editor (HTML)
   - **PDF**: como se imprime en el PDF final (HTML optimizado para generadores PDF)
   - **Formulario**: que campos de formulario genera para que el tecnico rellene datos
4. **Inicializar datos**: generar la estructura de datos vacia para un informe nuevo
5. **Validar datos**: comprobar que los datos rellenados son correctos

**Principio clave**: anadir un nuevo tipo de bloque al sistema = crear una sola unidad (clase, componente, modulo — segun la tecnologia) y registrarlo. No debe requerir tocar el formulario de llenado, ni el generador de PDF, ni el editor.

### 3.1 Bloques de estructura (no producen datos)

**Cabecera (`header`)** — Cabecera del informe
- Configuracion: titulo, subtitulo, mostrar logo (si/no), mostrar fecha (si/no), mostrar referencia (si/no), posicion del logo (izquierda/derecha/centro), URL del logo
- Preview: titulo, subtitulo, placeholder de logo, fecha y referencia de ejemplo
- PDF: logo real (si esta configurado), titulo, fecha del informe y referencia. Los datos contextuales (fecha, referencia, cliente, sistema) se inyectan automaticamente desde la intervencion/informe, no los escribe el tecnico.

**Titulo de seccion (`section_title`)**
- Configuracion: titulo, descripcion, nivel (1, 2 o 3), color (hex)
- Preview/PDF: barra lateral de color, titulo con tamano segun nivel, descripcion opcional

**Separador (`divider`)**
- Configuracion: estilo (solido/discontinuo/punteado/espacio), espaciado (pequeno/mediano/grande), color

### 3.2 Campos de datos

Todos los campos de datos comparten: `clave` (identificador unico, snake_case, obligatorio), `etiqueta`, `obligatorio` (si/no), `ancho` (completo/mitad/tercio/dos_tercios), `texto de ayuda`.

**Campo de texto (`text_field`)** — Texto corto (una linea)
- Config adicional: placeholder
- Formulario: input de texto
- Dato: texto o vacio

**Campo numerico (`number_field`)**
- Config adicional: unidad (ej: "mm", "A", "V"), minimo, maximo
- Formulario: input numerico con sufijo de unidad
- Dato: numero o vacio

**Campo de fecha (`date_field`)**
- Formulario: selector de fecha
- Dato: fecha (formato AAAA-MM-DD) o vacio

**Area de texto (`text_area`)** — Texto largo (multilínea)
- Config adicional: numero de filas visible, placeholder
- Formulario: textarea
- Dato: texto o vacio

**Selector (`select_field`)** — Lista desplegable
- Config adicional: opciones (lista de valor + etiqueta)
- Formulario: select/dropdown
- Dato: valor seleccionado o vacio
- Config UI: editor de opciones con botones anadir/eliminar

### 3.3 Bloques de inspeccion

**Tristate (`tristate`)** — Punto de inspeccion OK / NOK / N/A
- Config: clave, etiqueta, con observacion (si/no), obligatorio (si/no), nivel de mantenimiento (general/nivel1/nivel2/nivel3)
- Preview: indicador de nivel con color (verde=N1, ambar=N2, rojo=N3), etiqueta, 3 botones OK/NOK/NA, campo de observaciones si esta habilitado
- PDF: fila compacta con etiqueta a la izquierda, badges OK/NOK/NA a la derecha con el valor seleccionado resaltado, observacion en cursiva debajo. El badge de nivel de mantenimiento tambien aparece en el PDF.
- Formulario: selector de 3 opciones (OK/NOK/NA) en linea + campo de observacion
- Dato: `{valor: ok|nok|na|null, observacion: texto}`

**Lista de verificacion (`checklist`)**
- Config: clave, etiqueta, items (lista de clave + etiqueta)
- Formulario: lista de checkboxes
- Dato: lista de claves marcadas

### 3.4 Tabla

**Tabla de datos (`table`)**
- Config: clave, etiqueta, columnas (lista de clave/etiqueta/tipo/ancho), filas fijas predefinidas, permitir anadir filas (si/no), minimo y maximo de filas
- Tipos de columna soportados: texto, numero, fecha, tristate, selector
- Preview: tabla con cabeceras oscuras, filas predefinidas o placeholder, indicador "y N mas" si hay muchas filas fijas
- PDF: tabla compacta con fondos alternados en filas, tristate como badges de color
- Formulario: tabla editable (tipo repeater) con campos segun el tipo de cada columna, respetando limites de filas
- Config UI: editor completo de columnas (anadir, eliminar, reordenar, editar tipo y ancho) + editor de filas fijas

### 3.5 Media y firma

**Imagen (`image`)**
- Config: clave, etiqueta, permitir multiples (si/no), maximo de archivos, tamano maximo (MB), ancho
- Formulario: subida de imagen(es)
- PDF: imagen(es) incrustada(s)
- Dato: ruta del archivo o lista de rutas

**Firma (`signature`)** — Firma digital capturada a mano
- Config: clave, etiqueta, rol (ej: "Tecnico PAS", "Responsable cliente"), obligatorio (si/no), ancho
- Preview: rectangulo con icono de firma y texto del rol
- PDF: imagen de la firma capturada, o linea vacia con espacio para firma manual si no se ha firmado
- Formulario: **widget real de captura de firma** (area de dibujo donde el usuario firma con el dedo o raton), NO un campo de texto
- Dato: imagen codificada en base64

---

## 4. Formato del Schema

Cada version de template almacena un schema JSON con esta estructura:

```json
{
  "blocks": [
    {
      "id": "uuid-v4",
      "type": "header",
      "config": {
        "title": "Informe de Mantenimiento Preventivo",
        "subtitle": "Controladora IRC5",
        "showLogo": true,
        "showDate": true,
        "showReference": true,
        "logoPosition": "left",
        "logoUrl": ""
      }
    },
    {
      "id": "uuid-v4",
      "type": "tristate",
      "config": {
        "key": "estado_general",
        "label": "Estado general del equipo",
        "withObservation": true,
        "required": true,
        "maintenanceLevel": "level1"
      }
    }
  ],
  "pageConfig": {
    "orientation": "portrait",
    "margins": { "top": 20, "right": 15, "bottom": 20, "left": 15 },
    "fontSize": 10
  }
}
```

### Reglas de integridad del schema

- Cada bloque tiene un `id` UUID v4 unico dentro del schema
- Los bloques que producen datos tienen `key` obligatorio, unico dentro del schema, en formato snake_case, maximo 64 caracteres
- Orientacion de pagina: `portrait` (vertical) o `landscape` (horizontal)
- Margenes: en milimetros, entre 5 y 50
- Tamano de fuente base: entre 8 y 14

---

## 5. Flujo de Trabajo Completo

### Paso 1: Diseno del template

El administrador accede a un modelo de componente (ej: "Controladora IRC5"), ve la lista de versiones de template, y abre el editor de bloques. Arrastra bloques, los configura, ve el preview A4 en tiempo real, y guarda. Puede crear nuevas versiones y activarlas.

### Paso 2: Creacion del informe

Cuando se crea un informe para una intervencion + sistema:
1. Para cada componente fisico del sistema (controladora, unidades mecanicas, drive units):
   - Se busca la version activa del template del modelo correspondiente (si no hay activa, se usa la mas reciente con un aviso en log)
   - Se crea un componente del informe con:
     - **Schema congelado**: copia exacta del schema del template en ese momento
     - **Datos inicializados**: estructura vacia generada por cada bloque segun su tipo
2. Todo esto se ejecuta de forma atomica (transaccion): o se crean todos los componentes o ninguno.
3. **Los cambios futuros al template NO afectan informes ya creados** (patron snapshot).

### Paso 3: Llenado del informe

El tecnico abre el informe. El sistema lee el schema congelado de cada componente del informe y genera dinamicamente un formulario con los campos apropiados segun cada bloque. El tecnico rellena los datos en campo. Los datos se guardan en el JSON de datos del componente.

La interfaz de llenado se organiza en **tabs**, una por cada componente del sistema (ej: tab "Controladora IRC5", tab "IRB 6700", tab "Drive Unit 1").

### Paso 4: Generacion del PDF

Al hacer clic en "Descargar PDF":
1. Se cargan todos los componentes del informe con sus schemas y datos
2. Se aplica la configuracion de pagina (orientacion, margenes, fuente) al documento
3. Para cada componente, se itera por los bloques del schema y se genera el HTML de impresion con los datos rellenados
4. En la cabecera se inyectan automaticamente los datos contextuales (fecha, referencia, cliente, sistema)
5. Se genera el PDF con footer de paginacion, logo de empresa, y metadatos

### Rutas de acceso al PDF (requieren autenticacion)

- Vista previa del template (sin datos reales)
- Visualizacion del informe en el navegador
- Descarga del informe como archivo

---

## 6. Reglas de Negocio

### Versiones de template
- Solo puede haber UNA version activa por modelo de componente
- Al activar una version, las demas activas del mismo modelo pasan a obsoletas automaticamente
- No se puede eliminar la unica version activa sin confirmacion explicita
- Al crear una nueva version, se pre-popula con un schema inicial basico (cabecera + titulo de seccion + tristate)

### Informes
- Un informe es unico por (intervencion, sistema)
- Un componente del informe es unico por componente fisico del sistema
- El schema congelado es inmutable una vez creado
- Si no hay version activa del template, se usa la mas reciente con un warning en el log

### Validaciones al guardar un template
- Claves de bloque unicas dentro del schema
- Claves no vacias, en formato snake_case, maximo 64 caracteres
- Opciones de selector y checklist con al menos 1 item
- Tabla con al menos 1 columna
- Todas las rutas de PDF requieren autenticacion

### Seguridad
- Escape de HTML consistente en todo el renderizado
- Creacion de informes envuelta en transaccion atomica
- Autenticacion requerida para todas las rutas

---

## 7. Configuracion global

- **Logo de empresa**: imagen subida en la configuracion de la aplicacion, que se inyecta en los bloques de cabecera que tienen "mostrar logo" activado
- **Datos de la empresa**: nombre, direccion, telefono — aparecen en el footer de los PDFs

---

## 8. Plantillas de ejemplo (seeds)

### Controladora (ej: IRC5)
- Cabecera "Control de Controladora"
- Seccion "Inspeccion General": 5 puntos tristate (cables alimentacion, sistema ventilacion, indicadores LED, pantalla/display, conexiones red)
- Seccion "Parametros": campos numericos (temperatura interna, voltaje bus DC)
- Seccion "Software": campos de texto (version firmware, version software)
- Seccion "Observaciones": area de texto libre

### Unidad Mecanica (ej: IRB 6700)
- Cabecera
- Seccion "Inspeccion Visual": 8 puntos tristate (carroceria, cableado externo, mangueras, conectores, topes mecanicos, puntos de engrase, ruidos anormales, juego mecanico)
- Seccion "Mediciones por Eje": tabla con columnas [Eje, Holgura(mm), Corriente(A), Estado(tristate)]
- Seccion "Aceites": tabla con columnas [Eje, Aceite actual, Volumen(ml), Estado(tristate)]
- Seccion "Firma": firma del tecnico + firma del responsable del cliente

### Drive Unit
- Cabecera
- Seccion "Inspeccion": 4 puntos tristate
- Seccion "Parametros electricos": tabla con columnas [Parametro, Valor, Unidad, Estado(tristate)]
- Seccion "Observaciones": area de texto + firma del tecnico

---

## 9. Principios de Diseno

1. **Cada bloque es autocontenido**: anadir un nuevo tipo de bloque debe requerir crear una sola unidad de codigo y registrarla. No debe ser necesario modificar el formulario de llenado, el generador de PDF, ni el editor de bloques.

2. **WYSIWYG real**: los estilos del preview en el editor deben ser identicos a los del PDF generado. El canvas simula un A4 real.

3. **La configuracion de pagina llega hasta el PDF**: orientacion, margenes y tamano de fuente configurados en el editor deben aplicarse fielmente en la generacion del PDF.

4. **Patron snapshot**: el schema se congela al crear el informe. Evoluciones del template no rompen informes existentes.

5. **Firma digital real**: el bloque de firma requiere un widget de captura de trazos (dibujar con dedo/raton), no un campo de texto.

6. **Atomicidad**: la creacion de un informe con todos sus componentes debe ser atomica (todo o nada).
