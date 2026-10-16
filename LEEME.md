# UMBRAL · Versión 3.1

Revisión del UMBRAL V3 existente. Conserva las ocho salas, las trece conexiones, las texturas originales, el movimiento, los ajustes y la campaña de doce misiones. Esta entrega contiene **53 archivos sueltos**, preparados para reemplazarse y añadirse en tu repositorio actual.

## Subida manual desde iPhone

1. Toca **UMBRAL-v3.1-GitHub-Pages.zip** en Archivos para descomprimirlo.
2. En tu repositorio de UMBRAL, abre **Add file → Upload files**.
3. Sube **los 53 archivos de dentro**, al mismo nivel que el `index.html` actual. Reemplaza los nombres existentes y añade los nuevos. No subas el ZIP cerrado ni una carpeta adicional.
4. Confirma con **Commit changes** y espera a que termine la publicación de Pages.
5. Abre tu dirección habitual. El menú debe mostrar **V 3.1**. Si sigue mostrando V3.0, recarga cuando termine la publicación.

Conserva tu configuración actual de Pages. Si todavía no está activada: **Settings → Pages → Deploy from a branch → main → /(root) → Save**. No necesitas instalar dependencias, compilar ni abrir otro repositorio. La vista previa de HTML en Archivos no ejecuta el juego; usa la dirección HTTPS de Pages.

## Cambios de esta revisión

- Ventana curva cerrada y ensamblada: corregida la orientación de sus tramos, remates y uniones. El hielo vuelve al azul casi negro, con una transición superior tenue, irregular y pixelada.
- Destellos ambientales desde la primera visita a Archivo/Observación, sin depender de la misión ni de autorizar Análisis. Mirando el cristal aparecen a intervalos variables de **2–6 segundos**; cada uno dura **1.2 segundos**, con crecimiento de unos 40 ms. Cambian posición, tamaño, intensidad y forma; algunos tienen un núcleo tenue. Los efectos se suspenden fuera del sector o sin visión del cristal.
- Las **averías** siguen habilitándose únicamente al recoger el plano. Los destellos son un sistema separado.
- Inspección con mayor resolución y encuadre adaptado a vertical/horizontal. Se mantiene la resolución retro del mundo mientras caminas. Los CRT tienen fondo negro y trazos verdes o azules según el equipo. La ayuda local identifica cada mando, su función y la medida actual antes de manipularlo.
- Receptor con corredera, banco óptico con conector y obturador, banco de contactos con zócalo, lector de microfilm con transporte y rodillo manual de impresora. Sus acciones modifican estados reales. Hay quince instrumentos físicos y los siete CRT anteriores.
- Archivo con carpetas, expedientes, bobinas, lector y archivador; estantes diferenciados por función. Los módulos ópticos de Calibración quedan en soportes sobre el estante, fuera del paso.
- Botón **TURNO** a la izquierda: misión actual y siguiente, transición al completar y acceso al registro completo. Las doce descripciones explican qué revisar y dónde, sin un texto largo. El registro permite continuar operando el mismo equipo al cerrarlo.
- Avisos inferiores en cola: uno cada vez durante cinco segundos, sobre una sombra suave. Plano con los nombres dentro de cada sala y una flecha más visible que indica posición y orientación.
- Composición musical original, espaciada y amortiguada, integrada con los sonidos mecánicos existentes. Las averías reales pendientes empiezan a aumentar gradualmente la tensión después de un minuto; al resolverlas, disminuye progresivamente. Los ciclos benignos no la elevan.

## Controles y guardado

- **PC:** WASD/flechas y ratón; **E** opera o recoge. **M** abre el plano después de encontrarlo. **J** abre/cierra el registro completo. **Esc/P** pausa mientras caminas.
- **CRT:** clic o teclas **1–4**; también Tab/flechas y Enter. **E/Esc** sale.
- **Instrumentos:** toca sus piezas. Arrastra perillas y correderas. En PC, **1–5/Tab** selecciona, **←/→** ajusta y **Enter** acciona. **E/Esc** sale. La ayuda de inspección explica el mando seleccionado.
- **Móvil:** joystick izquierdo y arrastre derecho simultáneos; mira al equipo y toca **OPERAR**. **TURNO** despliega el resumen y su flecha inferior abre el registro completo. **Ⅱ** pausa.
- **Plano:** recoge el papel en Acceso. El botón junto a pausa permite abrirlo; M, E, Esc o **PLEGAR PLANO** lo cierran. La flecha sigue tu ubicación y hacia dónde miras. El jugador y la cámara quedan quietos mientras la estación sigue funcionando.
- **Registro completo:** usa su X, J o Esc para cerrarlo. También inmoviliza al jugador sin detener los sistemas.

ENTRAR activa el audio con el gesto exigido por el navegador. Cambiar de aplicación pausa. El almacenamiento local conserva posición, misiones, averías y eventos cada cinco segundos y al interactuar o pausar, si el navegador lo permite.

**V3.1 continúa tu guardado de V3 y mantiene tus ajustes.** Los controles nuevos reciben valores compatibles con el progreso anterior. VOLVER AL PUNTO INICIAL conserva el progreso; REINICIAR EL TURNO COMPLETO comienza otra campaña. No hace falta reiniciar para ver el hielo, los destellos o la nueva interfaz.

## Primer turno — consulta si te atascas

1. **Acceso:** registra el turno y recoge el plano de la pared.
2. **Reconocimiento:** visita Taller, Control y Calibración. Inspecciona la fuente de Taller y activa supervisión en el CRT de Control.
3. **Línea sin respuesta:** espera las lecturas de supervisión; ejecuta DIAGNÓSTICO cuando se registre el fallo.
4. **Enlace:** en Servidores, AISLAR → CONTACTOS → deslizar la corredera hasta el tope y soltar → esperar el asentamiento → RESTABLECER. En PC, lleva la corredera con flechas y confirma con Enter.
5. **Sincronía:** superpone los pulsos del osciloscopio y pulsa COMPARAR. Referencia: desfase residual dentro de ±1.5 ns. Las derivas posteriores pueden exigir otro ajuste.
6. **Calibración:** en el banco óptico de la mesa, encaja el conector, cierra el obturador, ajusta el LED a la banda útil y emite diez pulsos. El CRT permite consultar tiempos o iniciar otra prueba cuando el banco esté preparado.
7. **Selección:** ajusta coincidencias y ventana temporal en Control. PRUEBA calcula tasa y retención; ACEPTAR conserva una configuración válida.
8. **Archivo:** usa el lector de microfilm o el CRT. Consulta dos series, compara ruido y sincronía y selecciona una referencia estable.
9. **Evento inusual:** el detector registra el candidato. Revisa COINCIDENCIA y COMPROBAR ESTADO en Control; atiende los fallos que indique.
10. **Expediente:** adjunta sincronía, calibración, adquisición y validación. AUTORIZAR ANÁLISIS abre permanentemente el puesto científico.
11. **Observación:** prepara el evento en su CRT, sal y contempla el cristal. La señal óptica principal también dura 1.2 segundos.
12. **Reconstrucción:** en Análisis, consulta LECTURAS, SENSORES y RECONSTRUIR; después registra el informe.

El turno continúa después del informe. Llegan nuevos candidatos sin alterar el que estás consultando. OTRO REGISTRO recorre la memoria; volver a un evento conserva sus datos y su calidad instrumental.

La reja interna de Análisis se mantiene. El paso hacia Archivo está abierto desde el principio: la autorización restringe el puesto de investigación, no el recorrido de la estación.

## Averías y procedimientos

El director considera tiempo, sectores visitados, etapa de campaña, historial reciente y equipos pendientes. Decide probabilísticamente, puede dejar silencios largos y limita a dos los acontecimientos simultáneos. Puede surgir otro durante una reparación ordinaria; las pruebas delicadas aplazan nuevas incidencias. Las averías reales permanecen hasta corregirlas. Algunos ruidos son ciclos normales que se resuelven solos.

- **Ventilador:** inspecciona, ajusta balance hasta reducir vibración y verifica.
- **Relé:** aísla el circuito. En el banco de Taller, encaja un repuesto y mide su continuidad. Sustituye el contacto y restablece el relé.
- **Lámpara:** regula el balasto hacia 24 V y verifica.
- **Fuente:** desconecta la carga, corrige la salida a 24 V e inspecciona de nuevo.
- **Comunicación:** busca el canal de la placa de ruta y comprueba el retorno.
- **Tubería:** inspecciona, gira la válvula hasta la banda 0.35–0.55 y verifica.
- **Impresora:** lee el registro; gira su rodillo hasta el final y suelta para recoger el papel.
- **Temperatura:** conecta el patrón, corrige la diferencia a menos de 0.3 °C y verifica.
- **Deriva:** vuelve a superponer y medir pulsos; repite la calibración luminosa.
- **Interferencia:** activa el filtro de red y ensaya otra adquisición.

Las fuentes locales se atenúan y filtran con distancia y separación de habitaciones. La música utiliza frases cortas, resonancias y pausas; el carácter amortiguado procede de su timbre y mezcla, no solo de bajar el volumen. No hay enemigos ni apariciones.

## Continuidad artística y ciencia

Se verificó que las 16 texturas originales, `world.js`, `layout.js`, `input.js` y Three.js conservan sus bytes. La ampliación parte de la versión existente: distribución, materiales originales y controles permanecen. La mejora de resolución y reducción de grano se aplica al operar; el tratamiento del mundo sigue siendo el original.

UMBRAL es ficticio. Los sensores y sus tiempos son datos sintéticos simplificados. Cada evento activa sensores distintos con tiempos, cargas y orientación coherentes; se conservan al volver a consultarlo. La calidad depende de sincronía, calibración y estado instrumental. La reconstrucción es didáctica: no representa una resolución medida del observatorio IceCube.

Los destellos son una licencia visual de **luz producida por partículas secundarias**, no neutrinos visibles. Ni su frecuencia ni su duración representan tasas reales de IceCube. Un candidato requiere distinguir ruido y otros fondos; no confirma por sí solo un neutrino astrofísico. Las reparaciones se realizan sobre equipos locales.

## Verificación realizada

- Progresión de las doce misiones, interbloqueos, todos los procedimientos de mantenimiento, reparaciones repetidas, guardado compatible, datos estables y exploración posterior.
- Recorridos entre trece conexiones, acceso a los siete CRT y quince instrumentos, reja y desbloqueo, y 25.000 movimientos con colisiones.
- Botones, perillas y correderas mediante rayos sobre la geometría real, en vertical y horizontal; comprobación de que la cámara de inspección no atraviesa paredes ni oculta las pantallas.
- Plano y registro de misiones con movimiento/cámara bloqueados y simulación activa; regreso al equipo abierto; control con dos punteros y avisos consecutivos.
- Ventana cerrada mediante muestreo de rayos; destellos desde una visita temprana, intervalos variables, duración y suspensión. Compilación/enlace real de shaders mediante Mesa y lectura de sus píxeles para comprobar el azul oscuro.
- Arranque con un renderizador simulado y audio con un contexto simulado; revisión de composición mediante renders independientes de la escena.

**No se ha realizado una prueba interactiva en Safari ni en un iPhone físico.** Estas comprobaciones no certifican rendimiento ni presentación en ese dispositivo. Se conserva WebGL 2, resolución adaptable y cuatro luces con sombras como máximo. Pantallas y maquinaria limitan sus actualizaciones; la composición reutiliza cuatro voces y el audio espacial reutiliza tres. IMAGEN → LIGERA sigue disponible.

Todos los recursos necesarios están incluidos; no hay CDN ni servidor de juego. La entrega lleva 53 archivos, incluidas 28 texturas PNG y Three.js r170. No incluye las herramientas internas de verificación.

## Referencias consultadas

- [Detección de partículas secundarias — IceCube](https://icecube.wisc.edu/outreach/neutrinos/)
- [Sensores, tiempos, cargas y patrones — IceCube Masterclass](https://masterclass.icecube.wisc.edu/en/icecube-and-neutrinos/detecting-neutrinos/)
- [Sincronización y adquisición — IceCube](https://icecube.wisc.edu/news/research/2016/12/everything-you-always-wanted-to-know-about-icecube-detector/)
- [Calibración mediante LED — IceCube](https://icecube.wisc.edu/news/research/2025/08/successful-design-production-and-testing-of-led-calibration-systems-for-upgrade-sensor-modules/)
- [Petri Alanko: materiales sonoros y composición de Control](https://www.lacedrecords.com/blogs/blog/interview-how-alan-wake-composer-petri-alanko-established-control)
- [Martin Stig Andersen: integrar composición, espacio y juego](https://www.lacedrecords.co/blogs/blog/interview-control-inside-composer-martin-stig-andersen)
- [Andersen: tratamiento sonoro de INSIDE](https://www.gamedeveloper.com/audio/audio-design-deep-dive-using-a-human-skull-to-create-the-sounds-of-i-inside-i-)
- [Publicación con GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

Las entrevistas orientaron decisiones de integración musical; no se ha copiado música ni se presupone una frecuencia que cause miedo universalmente. La composición y síntesis incluidas son originales de UMBRAL.

Preparado exclusivamente para tu subida manual. No se ha modificado ni publicado el repositorio remoto.
