# UMBRAL · Versión 3.0

Ampliación del UMBRAL V2 existente: las mismas ocho salas, trece conexiones, materiales, controles y atmósfera. Incluye doce misiones, trece equipos físicos operables, plano portátil, diez clases de acontecimientos secundarios y exploración después del informe.

## Subida manual desde tu iPhone

1. Toca `UMBRAL-v3-GitHub-Pages.zip` en **Archivos** para descomprimirlo.
2. Abre **tu repositorio actual de UMBRAL → Add file → Upload files**.
3. Selecciona **los 50 archivos sueltos** de la carpeta descomprimida. Súbelos donde ya está `index.html`: reemplaza los nombres existentes y añade los nuevos.
4. Confirma con **Commit changes** y espera a que GitHub Pages termine de publicar.
5. Abre tu dirección habitual de Pages en Safari. El menú debe mostrar **V 3.0**. Si muestra V2, recarga después de terminar la publicación.

Sube el contenido del ZIP, no el ZIP cerrado ni la carpeta que lo contiene. Todos los archivos van juntos en la raíz. No necesitas otro repositorio, instalar dependencias ni compilar.

Conserva la configuración de Pages existente. Si aún no está activada: **Settings → Pages → Deploy from a branch → main → /(root) → Save**. La vista previa de HTML en Archivos del iPhone no ejecuta el juego; ábrelo desde la dirección HTTPS de Pages.

## Controles y guardado

- **PC:** WASD/flechas y ratón. **E** opera o recoge; **J** recuerda la tarea; **M** abre el plano después de recogerlo. **Esc/P** pausa mientras caminas.
- **CRT:** clic o teclas **1–4**; también Tab/flechas y Enter. **E/Esc** sale.
- **Instrumentos:** toca o pulsa los mandos del propio equipo. Para una perilla, **arrastra horizontal o verticalmente**. En PC, **1–5/Tab** selecciona un mando, **←/→** gira la perilla y **Enter** acciona. **E/Esc** sale.
- **Móvil:** joystick izquierdo y arrastre derecho simultáneos. Mira al equipo y toca **OPERAR**. Los interruptores y perillas son las piezas físicas bajo la pantalla. **TURNO** recuerda la tarea. **Ⅱ** pausa.
- **Plano:** recoge el papel en Acceso; aparece el botón **▤** junto a pausa. Al abrirlo, la cámara y el jugador quedan quietos, pero la estación y sus sonidos siguen funcionando. **PLEGAR PLANO**, M, E o Esc lo cierran. Solo el punto pixelado cambia con tu posición.

Se mantienen los ajustes originales. ENTRAR activa el sonido mediante el gesto requerido por los navegadores. Cambiar de aplicación pausa la partida. Posición, procedimientos, averías y datos se guardan localmente cada cinco segundos y al interactuar o pausar, si el navegador permite almacenamiento.

V3 inicia su campaña desde Acceso y tiene su propio guardado. Conserva los ajustes de V1 y no borra el guardado de V2. **VOLVER AL PUNTO INICIAL** conserva el progreso; **REINICIAR EL TURNO COMPLETO** reinicia V3.

## Primer turno — guía si te atascas

1. **Acceso:** registra el turno en el panel de la pared y recoge el plano físico de esa sala.
2. **Reconocimiento:** visita Taller, Control y Calibración. Inspecciona la fuente de Taller y activa la supervisión en el CRT de Control.
3. **Línea sin respuesta:** la advertencia llega después de unos segundos de vigilancia. Ejecuta DIAGNÓSTICO en Control.
4. **Enlace:** en el panel físico de la pared este de Servidores: AISLAR → CONTACTOS → REAJUSTAR → esperar → RESTABLECER.
5. **Sincronía:** usa el osciloscopio de Calibración. Gira DESFASE hasta superponer los pulsos y pulsa COMPARAR. El desfase inicial se compensa cerca de −11.5 ns; una deriva posterior puede cambiarlo.
6. **LED:** ajusta el generador a nivel 3–7 y emite los diez pulsos. También puedes iniciar la prueba desde el CRT de Calibración. La aceptación depende del enlace y del reloj; TIEMPOS permite revisar cada respuesta y su RMS respecto a 240 ns.
7. **Selección:** en el discriminador físico de Control ajusta coincidencias y ventana. PRUEBA calcula registros por segundo y retención; ACEPTAR guarda una prueba válida. Un punto de partida útil es 5 coincidencias y 1200 ns.
8. **Archivo:** compara al menos dos series. Selecciona una referencia con reloj y pulsos verificados.
9. **Evento inusual:** el detector registra el candidato por sí mismo. En Control, consulta COINCIDENCIA y COMPROBAR ESTADO. Atiende los equipos que estén fuera de tolerancia.
10. **Expediente:** en Control añade los cuatro registros —sincronía, calibración, adquisición y validación— y AUTORIZAR ANÁLISIS.
11. **Observación:** consulta el evento, sal del CRT, acércate al cristal y mira al hielo. El pequeño destello crece durante unos 40 ms y se desvanece hasta completar 1.02 segundos.
12. **Reconstrucción:** entra al puesto de Análisis, consulta LECTURAS, SENSORES y RECONSTRUIR. En INFORME / MEMORIA, registra el informe.

El juego continúa. La adquisición añade candidatos nuevos a la memoria sin cambiar el evento que estás consultando. **OTRO REGISTRO** recorre los datos guardados; cada evento conserva sus lecturas, revisión y calidad instrumental.

**Acceso a Análisis:** el croquis obliga a atravesar la sala 6 para llegar a Archivo. Su paso de circulación permanece abierto; el puesto científico está cerrado por una reja interna hasta validar el expediente. Así se conserva la distribución original sin bloquear la misión de Archivo. El desbloqueo es permanente.

## Acontecimientos e instrumentos

Las averías aleatorias solo se habilitan tras recoger el plano. El director considera sectores visitados, etapa del turno, historial, equipos pendientes y procedimientos delicados. Decide con probabilidad en intervalos variables: puede haber silencios largos y nunca mantiene más de dos acontecimientos a la vez. No todos producen avisos; escucha y acércate a los equipos.

- **Ventilador:** inspecciona y reduce la vibración con el balance; verifica.
- **Relé:** aísla el circuito local, prueba un repuesto en Taller, sustituye el contacto y conecta de nuevo.
- **Lámpara:** ajusta el balasto a 24 V y verifica.
- **Fuente:** desconecta la carga de ensayo, corrige a 24 V e inspecciona de nuevo.
- **Comunicación:** sintoniza el canal de la placa de ruta y reinicia.
- **Tubería:** inspecciona y regula el caudal a 0.35–0.55; verifica.
- **Impresora:** consulta el papel y acciona su avance.
- **Termómetro:** conecta la sonda patrón, corrige la diferencia a menos de 0.3 °C y verifica.
- **Deriva temporal:** superpone pulsos, compara y repite la calibración luminosa.
- **Interferencia:** activa el filtro de red y realiza una prueba de adquisición.

Algunos ruidos corresponden a ciclos normales. La inspección permite distinguirlos. Los equipos cercanos tienen fuentes direccionales; distancia y cambio de habitación atenúan y filtran el sonido.

Los destellos ambientales se habilitan al visitar Archivo u Observación. Son independientes del principal, espaciados de forma probabilística y se dibujan únicamente mientras miras la ventana.

## Continuidad y ciencia

Las 16 texturas originales, `world.js`, `layout.js`, `input.js`, el motor Three.js y el shader final de color/grano conservan los mismos bytes de V2. Se reutilizan las variantes de desgaste existentes. Se corrigieron cobertura y soporte del vidrio, posición del CRT de Análisis, apoyos de monitores/registrador, conexiones de tuberías, cableado y pequeños apoyos de objetos. La colisión original solo incorpora la posibilidad de desactivar la reja desbloqueada.

UMBRAL y sus registros son ficticios. Los 80 sensores forman una malla fija; cada evento activa una selección distinta. Los tiempos combinan propagación de partículas/luz, dispersión simplificada y calidad del detector. Se generan patrones alargados o dispersos. El eje principal ponderado es una aproximación didáctica: su incertidumbre es ilustrativa, no una resolución medida de IceCube. `p.e.` expresa carga en unidades equivalentes de fotoelectrones.

El neutrino no es visible directamente. Los destellos representan artísticamente luz Cherenkov de partículas cargadas secundarias que superan la velocidad de la luz **en el hielo**, nunca en el vacío. Un candidato exige distinguir muones, ruido y otros fondos; no confirma por sí solo un neutrino astrofísico. Las reparaciones se realizan sobre electrónica local, no sobre sensores extraídos del hielo.

## Verificación y rendimiento

Comprobados con pruebas de código y geometría: las doce misiones, interbloqueos, diez procedimientos de mantenimiento, reparaciones repetidas, guardado/recuperación, selección estable de eventos, variación científica, reja y trece conexiones, acceso a siete CRT y trece paneles, 25.000 movimientos con colisiones, plano y puertas, bloqueo de cámara/movimiento con simulación activa, dos punteros independientes y destello en formato vertical/horizontal.

Se ejercitaron botones y perillas con rayos sobre su geometría real; se verificó que las cámaras de inspección no crucen paredes ni oculten las pantallas. El arranque se probó con un renderizador simulado; el audio con un contexto simulado. Los shaders de escena, posprocesado e hielo compilaron y enlazaron mediante OpenGL Mesa. Se revisaron renders independientes de las ocho habitaciones.

**No se ha realizado una prueba interactiva en Safari ni en un iPhone físico.** La fluidez y compatibilidad final en tu dispositivo deben confirmarse jugando. Se conserva WebGL 2, resolución adaptable y un máximo de cuatro luces con sombras. Los materiales y geometrías se comparten; las habitaciones se descartan por puertas y las pantallas actualizan con frecuencia limitada. El audio añadido reutiliza tres voces espaciales. IMAGEN → LIGERA sigue disponible.

Todo funciona con archivos locales servidos por Pages, sin CDN ni servidor de juego. La entrega contiene 50 archivos en la raíz, incluidas 28 texturas PNG y Three.js r170.

Referencias:
- [Luz de partículas secundarias — IceCube](https://icecube.wisc.edu/outreach/neutrinos/)
- [Sensores, tiempos, cargas y patrones](https://masterclass.icecube.wisc.edu/en/icecube-and-neutrinos/detecting-neutrinos/)
- [Sincronización y adquisición](https://icecube.wisc.edu/news/research/2016/12/everything-you-always-wanted-to-know-about-icecube-detector/)
- [Pulsos LED de calibración](https://icecube.wisc.edu/news/research/2025/08/successful-design-production-and-testing-of-led-calibration-systems-for-upgrade-sensor-modules/)
- [Publicación con GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

Preparado exclusivamente para tu subida manual. No se ha modificado ni publicado el repositorio remoto.
