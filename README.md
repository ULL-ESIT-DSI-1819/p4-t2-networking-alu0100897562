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
asdas