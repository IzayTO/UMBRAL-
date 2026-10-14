# UMBRAL · Versión 1.0

Una experiencia original de horror ambiental en primera persona. Dos habitaciones cerradas de 6 × 6 metros, techos de 2,65 m y una puerta de acero permanentemente abierta. Taller y cuarto de mantenimiento. Solo exploración: sin enemigos, misiones ni sobresaltos programados.

## Publicar desde tu iPhone

1. Descomprime `UMBRAL-v1-GitHub-Pages.zip` en **Archivos**.
2. Crea un repositorio nuevo y público en GitHub; puedes llamarlo `UMBRAL`.
3. En **Add file → Upload files**, sube **los 26 archivos sueltos** que contiene el ZIP, todos juntos en la raíz. `index.html` debe quedar visible al abrir el repositorio, sin una carpeta delante. Confirma con **Commit changes**.
4. Abre **Settings → Pages**. En **Source**, elige **Deploy from a branch**. Selecciona **main**, **/(root)** y pulsa **Save**.
5. Cuando GitHub termine de publicar, abre la dirección que aparece allí. Con ese nombre sería `https://TU-USUARIO.github.io/UMBRAL/`.
6. Abre el enlace en **Safari**, pulsa **ENTRAR** y juega. En horizontal verás más de cada habitación.

**No subas el ZIP cerrado.** Se sube su contenido descomprimido. La vista previa de `index.html` dentro de Archivos no ejecuta este juego: usa el enlace de GitHub Pages.

No necesitas instalar dependencias, compilar, proporcionar claves ni conectar otro proyecto.

Guía oficial de GitHub: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Controles

- **iPhone / móvil:** joystick en la zona inferior izquierda para caminar; arrastrar la mitad derecha para mirar. Ambos dedos funcionan simultáneamente. Botón **Ⅱ** para pausar.
- **PC:** **WASD** o flechas para caminar; ratón con Pointer Lock para mirar; **Esc** o **P** para pausar. Si el navegador rechaza la captura del ratón, puedes mantener pulsado y arrastrar para mirar.
- **Ajustes:** volumen, visibilidad, sensibilidad, resolución, oscilación al caminar y variación suave de las lámparas. Se recuerdan en ese navegador cuando su almacenamiento está disponible.
- **Volver al punto inicial:** aparece dentro de Ajustes al pausar. Devuelve al comienzo sin recargar los materiales.

El sonido comienza al pulsar **ENTRAR**. Al pausar o cambiar de aplicación se detiene. Puedes explorar en silencio poniendo el volumen en cero. La escena no requiere interacción con los objetos.

## Dirección visual y sonora

Geometría y objetos originales: mesa de tablones y estructura de acero, sillas, estanterías, puerta con bisagras y cuña, radio analógica apagada, taza abierta, documentos, cajas etiquetadas, manómetro, depósito, bomba, válvula, conductos y utensilios de mantenimiento.

Texturas originales de 128 × 128 píxeles y una lámina de rótulos de 512 × 512: pintura desprendida, metal corroído, concreto poroso, juntas, madera, tela y esmalte deteriorado. Los materiales son difusos; no emplean reflejos PBR ni iluminación moderna de escaparate. Un pase ligero de color, grano y viñeta complementa esa construcción material.

Hay una sola lámpara por habitación, con alcance corto, atenuación, sombras de los objetos y paredes opacas. Las sombras se calculan una vez porque todo el mobiliario es estático. No hay linterna en esta versión.

El audio se sintetiza localmente mediante Web Audio: transformadores, ruido filtrado grave, aire, pasos y resonancias metálicas espaciadas. El sonido de la sala contigua se atenúa y filtra de manera aproximada según tu posición. Incluye periodos de menor actividad; no es música ni una afirmación de que alguna frecuencia cause miedo universal.

## Rendimiento y compatibilidad

- Three.js r170 / WebGL 2, incluido en el paquete: no depende de un CDN.
- Aproximadamente **9.402 triángulos**, **24 grupos de dibujo** para la escena y **21 volúmenes de colisión**.
- Dos mapas de sombra estáticos de 1024 × 1024; no se regeneran durante el recorrido.
- Resolución interna deliberadamente contenida, texturas con filtrado retro y reducción adaptativa de resolución si el tiempo de cuadro empeora.
- Pensado para Safari actual en iPhone y navegadores de escritorio con WebGL 2. Sin WebGPU ni extensiones obligatorias.
- Todos los modelos, materiales y sonidos forman parte del paquete o se generan con su código. No se cargan recursos de los juegos de referencia.

## Verificación de esta entrega

Se verificaron sintaxis y recursos locales, geometría y agrupación, recorrido entre ambas habitaciones, retorno, resistencia a atravesar paredes con desplazamientos grandes y 15.000 movimientos simulados. Se verificó la independencia de los dos punteros táctiles y su cancelación. Los shaders de escena y postproceso se compilaron y enlazaron en un contexto OpenGL de prueba con las definiciones de Three.js. La composición se inspeccionó mediante un render independiente de la geometría y sus materiales.

**Límite de verificación:** no se dispuso de una sesión de navegador de prueba ni de un iPhone físico. Estas comprobaciones no sustituyen jugar en Safari ni constituyen una medición de FPS en tu teléfono.

## Archivos

`index.html` y `style.css`: entrada e interfaz.

`game.js`: renderizado, estado, ajustes y bucle de juego.

`world.js`: geometría, mobiliario, materiales, lámparas y agrupación.

`input.js`: teclado, Pointer Lock y multitouch.

`physics.js`: colisiones y deslizamiento.

`audio.js`: síntesis y ambiente sonoro.

`three.module.min.js`: motor incluido; licencia en `LICENCIAS.txt`.

16 archivos PNG: materiales y rótulos originales. Mantén los nombres de todos los archivos.

Se entrega como proyecto independiente. No modifica otros repositorios.
