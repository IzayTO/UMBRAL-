# UMBRAL · Versión 2.0

La misma UMBRAL, ampliada a una estación científica antártica ficticia. Ocho salas según el croquis blanco: Acceso, Taller, Control, Servidores, Calibración, Análisis, Archivo y Observación. Incluye un primer turno completo, equipos operables y guardado local.

## Subir manualmente a tu repositorio

1. Descomprime `UMBRAL-v2-GitHub-Pages.zip`.
2. En **tu repositorio actual de UMBRAL**, abre **Add file → Upload files**.
3. Sube **los 42 archivos sueltos** del ZIP a la misma raíz donde está tu `index.html`. Reemplaza los archivos con el mismo nombre y añade los nuevos. Confirma con **Commit changes**.
4. Conserva la configuración de GitHub Pages que ya utilizas. Si aún no está activada: **Settings → Pages → Deploy from a branch → main → /(root) → Save**.
5. Espera a que termine la publicación y abre tu enlace de Pages en Safari o en el navegador del PC. El menú muestra **V 2.0**.

Se sube el contenido descomprimido, no el ZIP cerrado ni una carpeta que lo envuelva. No requiere instalaciones, compilación ni un repositorio nuevo. Los archivos de código y estilos incluyen una versión de caché para facilitar la actualización desde V1. Si ves el menú anterior, recarga la página tras finalizar Pages.

La vista previa de `index.html` en Archivos del iPhone no ejecuta módulos web: juega desde tu enlace HTTPS de Pages.

Guía oficial: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Controles

- **PC:** WASD/flechas y ratón; Pointer Lock con alternativa de arrastrar. **E** opera un equipo cercano. Dentro del CRT: clic, teclas **1–4**, Tab/flechas y Enter. **E/Esc** sale del equipo. **Esc/P** pausa al caminar. **J** recuerda la tarea.
- **Móvil:** joystick izquierdo y arrastre derecho simultáneos. Al mirar un equipo cercano aparece **OPERAR**. Toca las teclas dibujadas dentro del CRT y usa **SALIR** para volver a caminar. **Ⅱ** pausa.
- Conserva los ajustes de volumen, visibilidad, sensibilidad, imagen, oscilación y lámparas de V1. En pausa aparece la tarea actual.
- **Volver al punto inicial** conserva el progreso. **Reiniciar el turno completo** borra el turno guardado y comienza otra vez.

El audio se activa con ENTRAR. Cambiar de aplicación o pausar detiene el turno. La posición y las tareas se guardan en ese navegador si permite almacenamiento local; no se envían datos a un servidor.

## Primer turno — guía si te atascas

1. Desde Acceso, cruza Taller y entra en Control. Tras unos segundos de vigilancia aparece la advertencia del canal 17.
2. Opera el CRT de Control y ejecuta **DIAGNÓSTICO**.
3. Toma el ramal central hacia Servidores, atravesando la pasarela de vidrio. En su consola: **AISLAR CANAL → REAJUSTAR MÓDULO → esperar → RESTABLECER**. El interbloqueo impide intervenir con corriente. El banco de Taller permite comprobar un repuesto de forma independiente.
4. Regresa por el mismo ramal y entra en Calibración. **EJECUTAR PRUEBA** emite diez pulsos. La lectura responde al estado real del enlace; debe quedar aceptada.
5. En Análisis consulta **LECTURAS**, **SENSORES** y **TRAYECTORIA**, y después **ENVIAR REGISTRO**.
6. Cruza a Archivo por el pasillo horizontal y usa su segunda salida hacia Observación. **CONSULTAR EVENTO** prepara el registro. Sal de la consola, acércate al tramo central del cristal y mira al hielo. Un destello muy breve y lejano aparece una sola vez. El informe queda disponible en la computadora.

Servidores es un ramal sin salida: no hay paso hacia el corredor inferior. El plano físico de Acceso reproduce las conexiones del croquis.

## Continuidad de V1

Las 16 texturas originales, el motor incluido, el código de movimiento y colisiones y el shader final de color/grano se conservan byte por byte. Acceso reutiliza el mobiliario original; Taller redistribuye sus modelos de mantenimiento sin escalar sus proporciones. Las variantes de paredes siguen la misma paleta y el mismo procedimiento de texturizado.

Se mantiene la síntesis sonora original, ampliando las posiciones de zumbidos y las variaciones de ventilación. Los CRT, manómetros e indicadores responden al turno. La ventana curva tiene unos 35° de arco y el hielo permanece casi negro, con una transición azul muy tenue en el 15% superior.

## Ciencia y ficción

La instalación, su historia, los eventos y las lecturas son ficticios. La luz representa emisión Cherenkov de partículas cargadas secundarias; no es una fotografía de un neutrino. Un candidato no implica una identificación astrofísica confirmada. La trayectoria es un eje principal ponderado calculado a partir de posiciones y cargas simuladas, orientado por el orden temporal: una simplificación jugable, no el algoritmo de IceCube. `p.e.` expresa carga en unidades equivalentes de fotoelectrones.

La reparación afecta al receptor local del canal, no requiere retirar un sensor enterrado en el hielo. La prueba utiliza pulsos LED conocidos para comprobar respuesta y dispersión temporal.

Referencias científicas:
- https://icecube.wisc.edu/outreach/neutrinos/
- https://masterclass.icecube.wisc.edu/en/icecube-and-neutrinos/detecting-neutrinos/
- https://icecube.wisc.edu/news/research/2025/08/successful-design-production-and-testing-of-led-calibration-systems-for-upgrade-sensor-modules/

## Rendimiento y verificación

Three.js r170 y WebGL 2, sin CDN. Aproximadamente 43.000 triángulos estáticos, 121 volúmenes de colisión y un máximo de cuatro luces con sombra activas. Las salas se descartan por visibilidad a través de puertas; los objetos se agrupan por sala y material. Las sombras se actualizan al cambiar el conjunto visible de salas o luces; no se recalculan continuamente. Se conserva la resolución contenida y adaptable de V1. Los CRT actualizan sus texturas solo cuando son visibles.

Comprobado: trece conexiones transitables, acceso a las siete consolas y al cristal, 25.000 movimientos simulados, interbloqueos y orden de misiones, efectos de reparación/calibración, reconstrucción, guardado y recuperación, clics sobre las superficies CRT, encuadre vertical, dos punteros independientes, pausa y destello con desaparición. Se comprobó el arranque con un renderizador simulado, se compilaron los shaders mediante OpenGL de prueba y se inspeccionaron renders independientes de la geometría.

**No se realizó una prueba interactiva en un navegador real ni en un iPhone físico.** La compatibilidad y los FPS en tu dispositivo quedan por confirmar jugando en Safari. Se necesita un navegador con WebGL 2 y aceleración gráfica. La opción IMAGEN → LIGERA reduce la carga si fuese necesario.

## Archivos

- `index.html`, `style.css`: menú e interfaz original con interacción contextual.
- `game.js`: arranque, cámara, renderizado y coordinación.
- `world.js`: modelos, materiales y utilidades originales reutilizados.
- `layout.js`, `station.js`: croquis, ocho salas, puertas, equipos, vidrio e hielo.
- `missions.js`, `terminals.js`: simulación del turno, datos y CRT operables.
- `input.js`, `physics.js`, `audio.js`: controles, colisiones y ambiente.
- `three.module.min.js`: motor local.
- 28 PNG: las 16 texturas originales y 12 recursos adicionales.
- `LEEME.md`, `LICENCIAS.txt`: instrucciones y licencia de la dependencia.

La entrega está preparada para tu subida manual. No se ha escrito ni publicado ningún cambio en tu repositorio.
