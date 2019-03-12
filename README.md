## - DSI - 2018-19 -
# Práctica 4: Networking with Sockets
Durante esta práctica seguiremos el Capítulo 3: *"Networking with Sockets"* del libro *Node.JS The Right Way*, realizando sus ejemplos y resolviendo los problemas propuestos en las secciones *"Testability"* y *"Robustness"*.  

# A la escucha de Conexiones Socket
Los servicios de red sirven para dos cosas principalmente: conectar dos terminales y transmitir información entre ellos. En esta sección veremos cómo crear servicios basados en sockets usando Nodejs.  
## Enlazando un servidor a un puerto TCP
Las conexiones socket TCP se componen de dos terminales. Uno se enlaza a un puerto numerado mientras que el otro trata de conectarse a este puerto.  

En Node.js, las operaciones de *bind* (enlazado) y *connect* (conexión), vienen dadas por el **módulo net**. Con el siguiente código podemos hacer bind a un puerto TCP a la espera de conexiones:  

![Fallo al cargar la imagen](/img/1-bind.png)

- El método **net.createServer** toma como argumento una callback y devuelve un objeto **Server**. 
- Esta callback se invoca cada vez que un terminal intente conectarse al puerto indicado. 
- El parámetro **connection** es un objeto **Socket** que se usa para enviar o recibir datos.
- La llamada a **server.listen** hace el enlace del servidor al puerto TCP indicado.

## Escribiendo datos a un Socket
Durante la práctica 2 se escribió un programa simple que vigilaba un fichero a la espera de que se modificara. Vamos a reutilizar ese código como fuente de información para nuestro ejemplo de servidor. 

Creamos un directorio *networking* para almacenar los ficheros de esta sección, creando ahora el fichero *net-watcher.js*:

![Fallo al cargar la imagen](/img/1-net-watcher.png)

- Funciona como el ejemplo de la práctica 2, recibiendo por línea de comandos el nombre del fichero a vigilar.
- La callback pasada como parámetro a **createServer** tiene tres funciones:
  - Informar de que la conexión se ha establecido (al cliente y por consola).
  - Vigilar los cambios en el fichero, enviando la información de los cambios al cliente.
  - Escuchar a la espera del cierre de conexión para informar de la desconexión del cliente y dejar de vigilar el fichero.
  - Para enviar información al cliente, siempre se usa la función **connection.write**.
- Además, se le pasa una callback a **server.listen** para indicar que se ha enlazado correctamente el puerto y se está a la espera de conexiones.

## Conectando a un Socket TCP con Netcat
Para probar el funcionamiento de nuestro programa, necesitamos tres sesiones en la terminal: una para el servidor, otra para un cliente y otra para modificar el fichero.

En la primera terminal usamos el comando **watch** para modificar el fichero con touch en intervalos de 1 segundo:

![Fallo al cargar la imagen](/img/1-touch.png)

En la segunda ejecutamos el programa:

![Fallo al cargar la imagen](/img/1-net-watcher_test.png)

Finalmente usamos **netcat**, una utilidad de sockets, con el comando **nc**:

![Fallo al cargar la imagen](/img/1-netcat.png)

Los sockets TCP son útiles para comunicaciones entre máquinas situadas en distintas redes, pero para conexiones en una misma máquina los sockets Unix son más eficientes. El módulo *net* también puede crear estos sockets, como veremos a continuación.

## A la escucha en Sockets Unix
Para usar los Sockets Unix en nuestro *net-watcher.js*, modificamos el puerto en la función **listen** de la última línea, cambiándolo por la ruta *'/tmp/watcher.sock'* y almacenamos el nuevo fichero como *net-watcher-unix.js*.

Ejecutamos el programa igual que antes, con la diferencia de que para usar **netcat** como cliente, en lugar de pasar como parámetros *localhost* y el número del puerto, usamos *-U /tmp/watcher.sock*.

Se debe tener en cuenta que esto solo funciona en sistemas basados en Unix, evidentemente.

# Implementando un Protocolo de Mensajería
En esta sección implementaremos un protocolo basado en mensajes JSON sobre nuestra conexión TCP, ya que en la sección anterior estábamos enviando mensajes de texto plano destinados a ser leídos por humanos.

JSON es muy usado en Node.js, es más sencillo que el texto plano para programar clientes y además sigue siendo "leíble" por humanos.

## Serializando mensajes con JSON
Vamos a desarrollar nuestro protocolo de mensajería usando JSON para serializar mensajes. Cada mensaje es un objeto JSON serializado, que es un hash de parejas clave-valor.

El servicio de vigilancia de ficheros que desarrollamos en la sección anterior envía dos tipos de mensaje que necesitamos convertir a JSON:

- Cuando una conexión se establece, el cliente recibe la cadena que avisa que se está vigilando el fichero.
- Cuando se modifica el fichero en cuestión, el cliente recibe una cadena indicándolo.

Vamos a codificar el primer mensaje de la siguiente manera: {*"type":"watching"."file":"target.txt"*}

- El campo **type** indica que se está **vigilando** el **fichero** especificado.

El segundo mensaje se codifica de la siguiente: {*"type":"changed","timestamp":1358175733785*}

- El campo **type** anuncia que el fichero se ha modificado. 
- El campo **timestamp** contiene un entero representando el número de milisegundos desde medianoche del 1 de enero de 1970. Es un formato de tiempo conveniente para trabajar con JavaScript. Se puede obtener el tiempo actual en este formato con **Date.now**.

No hay saltos de línea en nuestros mensajes JSON. Aunque JSON ignora los espacios en blanco fuera de los strings indicados por las comillas dobles, nuestro protocolo usará saltos de línea para separar los mensajes. Nos referiremos al protocolo como **Line-Delimited JSON (LDJ).**

## Cambiando a Mensajes JSON
Ahora que tenemos definido nuestro protocolo accesible para máquinas, vamos a modificar nuestro *net-watcher* para usarlo.

Debemos usar **JSON.stringify** para codificar los objetos mensaje y enviarlos a través de **connection.write**. *JSON.stringify* recibe un objeto JavaScript y devuelve una cadena que contiene su representación serializada en forma JSON.

Para aplicarlo a nuestro código, copiamos el del apartado anterior en un nuevo fichero *net-watcher-json-service.js* y modificamos las líneas en las que aparece **connection.write** (13 y 16) de la siguiente manera:

![Fallo al cargar la imagen](/img/2-watcher_json.png)

Ejecutamos el programa como siempre, y esta vez veremos desde el cliente nuestros nuevos mensajes JSON:

![Fallo al cargar la imagen](/img/2-watcher_json_test.png)

# Creando Conexiones de Socket Cliente
Ya que durante esta práctica hemos estado aprendiendo sobre el lado del servidor, es hora de implementar un programa cliente para recibir mensajes JSON desde nuestro servidor.

Para ello escribimos el siguiente código en un nuevo fichero *net-watcher-json-client.js*:

![Fallo al cargar la imagen](/img/3-watcher_client.png)

Este pequeño programa usa **net.connect** para crear una conexión cliente al puerto 60300 de la máquina local, y luego espera por datos. El objeto **client** es un **Socket**, al igual que el objeto **connection** que vimos en el servidor.

Cuando un evento de **data** ocurre, la callback recibe el objeto JSON, lo parsea y muestra por consola el mensaje adecuado al objeto recibido.

Probamos el programa, evidentemente ejecutando también el servidor y haciendo un touch en el fichero vigilado:

![Fallo al cargar la imagen](/img/3-watcher_client_test.png)

# Comprobando el Funcionamiento de una Aplicación de Red
Los Test Funcionales sirven para asegurarnos de que nuestro código hace exactamente lo que esperamos. En esta sección desarrollaremos un test para nuestro servicio de vigilancia de ficheros en red, tanto para el servidor como para el cliente. Simularemos un servidor ajustado a nuestro protocolo LDJ mientras exponemos debilidades en el cliente.

Tras escribir la prueba, arreglaremos el código del cliente para que pueda pasarla.

## Entendiendo el problema del Límite de Mensaje
Al desarrollar programas de red con Node.js, estos se suelen comunicar mediante mensajes, que pueden llegar enteros de una vez o divididos en distintos eventos.

En nuestro protocolo LDJ, el límite que se establece entre dos mensajes es el caracter de salto de línea (*\n*). ¿Qué pasaría si un mensaje fuera partido a la mitad y llegara al cliente como dos eventos *data* separados? Cosas como esta pueden pasar en la red, sobre todo cuando se trata de mensajes largos.

Vamos a crear un servicio de prueba que envíe mensajes divididos a nuestro cliente para ver cómo responde.

## Implementando un Servicio de Prueba
Desarrollar aplicaciones Node.js robustas implica lidiar de forma elegante con todos estos posibles problemas de red como mensajes entrantes divididos, caídas de conexión o errores en los datos. 

Con el siguiente código implementamos un servicio de prueba que divide un mensaje en varios trozos:

![Fallo al cargar la imagen](/img/4-test_service.png)

Como se puede ver, lo único que hace es simular el servidor desarrollado anteriormente, solo que lo único que hace es enviar un mensaje dividido en dos trozos.

Si probamos qué pasa cuando ejecutamos este servidor y tratamos de conectarnos con nuestro programa cliente:

![Fallo al cargar la imagen](/img/4-test_failed.png)

El mensaje de error *Unexpected end of JSON input* nos indica que efectivamente, estamos tratando de parsear un mensaje JSON incompleto. Con esto hemos simulado correctamente el caso de error al enviar un mensaje dividido a nuestro cliente, lo siguiente será arreglarlo.

# Extendiendo Clases Principales a Módulos Personalizados
Visto el fallo expuesto en el apartado anterior, concluimos que el cliente tiene dos responsabilidades: acumular en un buffer los mensajes que va recibiendo y gestionar cada mensaje cuando llega.

En lugar de programar directamente estas funcionalidades, lo ideal es convertir al menos una de ellas en un módulo Node.js. Vamos a crear un módulo que gestiona el buffering de entrada para que el programa principal pueda obtener los mensajes completos, por lo que necesitaremos también hablar de los *Módulos Personalizados* y las *Extensiones de Clases Principales* en Node.

## Extendiendo EventEmitter
Para que el programa no tenga que leer mensajes JSON divididos, implementaremos un módulo para un buffer LDJ cliente que incluiremos en nuestro programa.

Con el siguiente código creamos una clase **LDJClient** que hereda de **EventEmitter**:

![Fallo al cargar la imagen](/img/5-ldj-client.png)

- Al ser una clase, al ser invocada por otro código se debe llamar de la forma **new LDJClient(stream)** para obtener una instancia de la misma. El parámetro **stream** que se le pasa es un objeto que emite eventos de **data**, al igual que una conexión **Socket**.

- En el constructor llamamos a **super** para invocar el constructor de la clase de la que hereda, **EventEmitter**. Usar *super* cuando se está implementando el constructor de una clase que hereda de otra es una buena práctica a seguir.

- La forma de instanciar un objeto de esta clase sería la siguiente:

![Fallo al cargar la imagen](/img/5-ldj-client-instance.png)

Con esto todavía no hemos implementado nada para emitir mensajes de eventos, así que en los siguientes apartados lo veremos y hablaremos sobre el *buffering* de eventos de datos en Node.

## Buffering de Data Events
Vamos a usar el parámetro **stream** que se le pasa a nuestra clase para recoger y almacenar en un buffer las entradas. El objetivo es recoger los datos entrantes desde el stream y convertirlos en eventos **message** que contienen los mensajes objeto parseados.

Modificamos el constructor de la siguiente manera:

![Fallo al cargar la imagen](/img/5-ldj-client-2.png)

- Al igual que antes, empezamos llamando a **super**, para luego crear una variable string **buffer** donde se almacenará la información entrante.
- Luego usamos **stream.on** para gestionar los eventos data.
- Dentro de estos eventos, añadimos al buffer los datos *en crudo* y buscamos mensajes completos (llegando a un caracter *'\n'*). 
- Cada string con el mensaje pasa a través de **JSON.parse** y finalmente se emite desde la clase como un **message** vía **this.emit**.

Con esto resolvemos el problema inicial del manejo de mensajes divididos, solo nos queda añadir esta clase a un Módulo Node.js para que nuestro cliente pueda usarla.

## Exportando funcionalidades a un Módulo
Ya que nuestro módulo será una librería a la que accede nuestro programa, por convención, debemos almacenar el fichero en un directorio **lib** dentro de nuestro proyecto.

Añadimos lo siguiente al código de la clase:

![Fallo al cargar la imagen](/img/5-ldj-client-module.png)

- Dentro de la definición de la clase, tras el constructor, añadimos un método **static** llamado **connect**. Un método *static* se asocia a la clase LDJClient en sí, no a las instancias individuales de la misma. 
- El método **connect** simplemente ahorra a los usuarios de la librería el tener que instanciar la clase manualmente.
- El objeto **module.exports** que se añade tras la definición de la clase es nuestro nexo de unión con el exterior. Todo lo que se añada a *exports* podrá ser usado desde el código que lo invoque, en este caso añadimos la clase LDJClient completa.
- Para invocar este módulo usamos el método *connect* de la siguiente manera, añadiendo la ruta al fichero fuente:

![Fallo al cargar la imagen](/img/5-ldj-client-module-instance.png)

Ahora que tenemos nuestro módulo completo, pasamos a usarlo desde el cliente.

## Importando un Módulo Node.js Personalizado
Vamos a crear un nuevo programa cliente con el siguiente código:

![Fallo al cargar la imagen](/img/5-net-watcher-ldj-client.png)

Es muy similar a nuestro cliente previo, solo que en lugar de enviar los mensajes a **JSON.parse**, confiamos en nuestro módulo para producir los mensajes.

Para comprobar su funcionamiento, vamos a usar de nuevo nuestro servidor simulado e intentar conectarnos desde este cliente:

![Fallo al cargar la imagen](/img/5-net-watcher-ldj-client-test.png)

Como podemos ver, problema solucionado.

# Desarrollando Tests Unitarios con Mocha
Mocha es framework de pruebas multiparadigma para Node.js, uno de los más usados por los desarrolladores. Aunque incluye distintos estilos para describir las pruebas, nos centraremos en las Desarrollo Dirigido por Comportamiento (Behavior-driven development - **BDD**). Lo instalaremos con el gestor de paquetes de node, **npm**, visto en anteriores prácticas.

## Semántica del Versionado de Paquetes
Como breve inciso, una explicación rápida del Versionado de Paquetes de software. Es una convención que consiste en numerar la versión del paquete con tres dígitos separados por puntos, de derecha a izquierda:

- Si los cambios en el código no introducen ni eliminan ninguna funcionalidad, solo corrigen pequeñas fallas, etc, entonces se incrementa el número **patch**.
- Si los cambios introducen alguna funcionalidad pero no alteran la existente, entonces se incrementa el número **minor** y se reinicia el patch.
- Si el código rompe con las funcionalidades previas de alguna forma, entonces se incrementa el número **major** y se reinicia el resto.

## Escribiendo Pruebas Unitarias con Mocha
Una vez instalado Mocha, vamos a usarlo para desarrollar pruebas unitarias para nuestro código. Creamos un subdirectorio **test** donde almacenaremos nuestro código relacionado con las pruebas siguiendo la convención de Node.js.

Dentro del directorio, creamos el fichero *ldj-client-test.js* con el siguiente contenido:

![Fallo al cargar la imagen](/img/6-ldj-client-test.png)

- De entre los módulos que cargamos al principio, la novedad es el módulo **assert**. Contiene funciones de interés para comparar valores.
- Usamos el método **describe** de Mocha para darle un **contexto** a nuestras pruebas, en este caso, sobre nuestro LDJClient. El segundo argumento que se le pasa al método es una callback que contiene todas las pruebas.
- Dentro del contexto declaramos dos variables, una es la instancia de la clase LDJClient y otra un EventEmitter, para luego actualizar las instancias en el **beforeEach** antes de cada prueba.
- Dado que la clase es **asíncrona** por naturaleza, invocamos la callback de **done** que provee Mocha para que indique cuándo se ha finalizado la prueba.
- En el cuerpo de la prueba, preparamos un manejador de eventos **message**  sobre el cliente. Este manejador usa el método **deepEqual** para comprobar que el *payload* recibido cumple nuestras expectativas. 
- Finalmente emitimos el evento.

Ya tenemos el código, es hora de ejecutarlo.

## Ejecutando Pruebas Mocha desde npm
Para ejecutar las pruebas de Mocha desde npm, necesitamos modificar la sección *scripts* del fichero **package.json** (que creamos previamente con *npm init -y*. Tras ejecutar este comando, se habrá generado un directorio **node_modules** en nuestro proyecto, que contiene las dependencias de Mocha, además de haberse actualizado *package.json* con estas.) para que contenga lo siguiente:

![Fallo al cargar la imagen](/img/6-package.png)

Las entradas de la sección *scripts* son comandos que puedes invocar desde línea de comandos cuando se está usando **npm run**. Al ejecutar *npm run test*, ahora que hemos modificado la entrada, se ejecutará Mocha:

![Fallo al cargar la imagen](/img/6-npm_test.png)

Como vemos, hemos superado la prueba que escribimos.

## Añadiendo más Pruebas Asíncronas
Siguiendo esta estructura, podemos añadir también la prueba que hicimos previamente para comprobar el comportamiento del cliente frente a mensajes divididos a Mocha. Añadimos lo siguiente dentro del bloque **describe**:

![Fallo al cargar la imagen](/img/6-client-test.png)

Hace lo mismo que nuestro fichero *test-json-service.js* de una forma más simple, dividiendo el mensaje en dos usando el método **process.nextTick** para ejecutar el siguiente código como una callback que se ejecuta desde que termina el código previo.

Otra forma de programar este *delay* es usar **setTimeout(*callback*, *nºsegundos*)**.

# Ejercicios Finales
## Testability
**Implementar los tests adicionales:**
- **Paso de un mensaje que se divide en dos o más eventos *data* desde el *stream*.**

Implementadas las pruebas para recibir un mensaje dividido en dos y tres fragmentos:

![Fallo al cargar la imagen](/img/7-ej1-a.png)

![Fallo al cargar la imagen](/img/7-ej1-a-test.png)

- **Pasar **null** al constructor de **LDJClient** y comprobar que se lanza un error. Modificar el código del constructor para que se pueda pasar la prueba.**

- Apartado pendiente -
- ¿Por qué funciona el test si se supone que espera que se lance un error?
- ¿Por qué al descomentar el throw da un error y no pasa el test?

![Fallo al cargar la imagen](/img/7-ej1-b.png)

![Fallo al cargar la imagen](/img/7-ej1-b-fail.png)

![Fallo al cargar la imagen](/img/7-ej1-b-2.png)

![Fallo al cargar la imagen](/img/7-ej1-b-pass.png)

## Robustness
**Mejoras en la robustez de la clase LDJClient:**
- **¿Qué ocurre si el evento *data* que se recibe no está en formato JSON? Escribir una prueba que envíe un mensaje que no sea JSON y modificar el código para poder superarla.**

Si el evento no está en formato JSON, *JSON.parse* lanzará una excepción. Escribimos un test que espere que gestionemos este error:

![Fallo al cargar la imagen](/img/7-ej2-a.png)

- Me pasa lo mismo que con el throw del ejercicio anterior...

- **¿Qué ocurre si el mensaje está en formato JSON pero no contiene el caracter *'\n'* para delimitar cada mensaje? Escribir una prueba que envíe un evento *data* JSON sin el caracter salto de línea, seguido de un evento *close*. Las instancias de *Stream* emiten un evento *close* cuando se desconectan, modifica LDJClient para estar a la escucha de este evento y procesar el resto de buffer.**

Tal como está implementada la clase, al no recibir un caracter *'\n'*, el constructor no hace nada más que acumular los datos en crudo, ya que depende de buscar este caracter para identificar cada mensaje, sacarlo del buffer y enviarlo con *emit* convertido en objeto JSON. 

Tampoco tenemos ningún manejador de eventos a la escucha de una señal *close*, por lo que no haría nada con la señal close enviada en la prueba:

![Fallo al cargar la imagen](/img/7-ej2-b-test.png)

Modificamos el código añadiendo un manejador de eventos a la espera de una señal *close* dentro del evento de *data* de la siguiente forma:

![Fallo al cargar la imagen](/img/7-ej2-b.png)

![Fallo al cargar la imagen](/img/7-ej2-pass.png)

- **¿Debería LDJClient emitir un evento *close* a sus *listeners*?¿En qué circunstancias?**

¿Cuando el stream de entrada sea null?