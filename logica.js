import * as THREE from './node_modules/three/build/three.module.js'

const rangoQ1 = document.getElementById('rango-q1');
const numeroQ1 = document.getElementById('numero-q1');
const rangoQ2 = document.getElementById('rango-q2');
const numeroQ2 = document.getElementById('numero-q2');
const rangoQ3 = document.getElementById('rango-q3');
const numeroQ3 = document.getElementById('numero-q3');
const botonRestablecer = document.getElementById('boton-rest');
const estatus = document.getElementById('estatus');

const contenedor = document.querySelector('#plano-robot');

// Escena, camara y renderizador.
const escena = new THREE.Scene();
escena.background = new THREE.Color('#f7efdf');

const ancho = contenedor.clientWidth;
const alto = contenedor.clientHeight;

const camara = new THREE.PerspectiveCamera(45, ancho / alto, 0.1, 100);
camara.position.set(18, 30, 22);
camara.lookAt(0, 11, 0);

const renderizador = new THREE.WebGLRenderer({ antialias: true });
renderizador.setSize(ancho, alto);
renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2));
contenedor.append(renderizador.domElement);

const materialRobot = new THREE.MeshBasicMaterial({
    color: '#c45d2d',
    wireframe: false
});

// Articulaciones, base y eslabones
const base = new THREE.CylinderGeometry(3, 3, 1.5, 32);
const baseRobot = new THREE.Mesh(base, materialRobot);
baseRobot.position.set(0, 0, 0);
escena.add(baseRobot);

const grupo1 = new THREE.Group();
grupo1.position.set(0, 0.75, 0);
escena.add(grupo1);

const eslabon1 = new THREE.CylinderGeometry(0.75, 0.75, 5, 32);
const brazo1 = new THREE.Mesh(eslabon1, materialRobot);
brazo1.position.set(0, 2.5, 0);
grupo1.add(brazo1);

const grupo2 = new THREE.Group();
grupo2.position.set(0, 5, 0);
grupo1.add(grupo2);

const articulacion1 = new THREE.SphereGeometry(1.1, 20, 20);
const esfera = new THREE.Mesh(articulacion1, materialRobot);
esfera.position.set(0, 0, 0);
grupo2.add(esfera);

const eslabon2 = new THREE.CylinderGeometry(0.75, 0.75, 5);
const brazo2 = new THREE.Mesh(eslabon2, materialRobot);
brazo2.position.set(0, 3, 0);
grupo2.add(brazo2);

const grupo3 = new THREE.Group();
grupo3.position.set(0, 6, 0);
grupo2.add(grupo3);

const articulacion2 = new THREE.BoxGeometry(2, 1.1, 2);
const prismatica = new THREE.Mesh(articulacion2, materialRobot);
prismatica.position.set(0, 0, 0);
grupo3.add(prismatica);

const extensionGeometria = new THREE.BoxGeometry(0.9, 4, 0.9);
const extension = new THREE.Mesh(extensionGeometria, materialRobot);
extension.position.set(0, 2, 0);
grupo3.add(extension);

const pinza = new THREE.BoxGeometry(1.4, 2, 1.4);
const tool = new THREE.Mesh(pinza, materialRobot);
tool.position.set(0, 4.4, 0);
grupo3.add(tool);

const posturaInicial = {
    q1: 0,
    q2: 0,
    q3: 20
};

const posturaActual = { ...posturaInicial };
const origenControles = {
    q1: 'numero',
    q2: 'numero',
    q3: 'numero'
};
const posicionEfector = new THREE.Vector3();
const posicionPantalla = new THREE.Vector3();
const etiquetaTcp = document.createElement('div');
etiquetaTcp.className = 'etiqueta-tcp';
contenedor.append(etiquetaTcp);

function sincronizarEntradas(rango, numero, clave) {
    const registrarRango = () => {
        origenControles[clave] = 'rango';
        leerControles();
        aplicarPostura();
    };

    const reflejarDesdeNumero = () => {
        origenControles[clave] = 'numero';

        if (numero.value === '') {
            return;
        }

        const valor = Number(numero.value);
        const minimo = Number(numero.min);
        const maximo = Number(numero.max);

        if (valor < minimo || valor > maximo) {
            window.alert('El robot alcanzo su limite, ingresa otro valor');
            numero.value = '';
            return;
        }

        leerControles();
        aplicarPostura();
    };

    rango.addEventListener('input', registrarRango);
    numero.addEventListener('input', reflejarDesdeNumero);
    numero.addEventListener('blur', reflejarDesdeNumero);
}

function actualizarEstatus() {
    tool.getWorldPosition(posicionEfector);

    estatus.innerHTML =
        `<span class="linea-estatus">Posicion actual: q1 = ${posturaActual.q1} grados, q2 = ${posturaActual.q2} grados y q3 = ${posturaActual.q3} cm.</span>` +
        `<span class="linea-estatus coordenadas-efector">Efector final: X = ${posicionEfector.x.toFixed(2)}, Y = ${posicionEfector.y.toFixed(2)}, Z = ${posicionEfector.z.toFixed(2)}.</span>`;
}

function actualizarEtiquetaTcp() {
    tool.getWorldPosition(posicionEfector);
    posicionPantalla.copy(posicionEfector).project(camara);

    const visible = posicionPantalla.z >= -1 && posicionPantalla.z <= 1;

    if (!visible) {
        etiquetaTcp.style.opacity = '0';
        return;
    }

    const x = ((posicionPantalla.x + 1) * 0.5) * contenedor.clientWidth;
    const y = ((-posicionPantalla.y + 1) * 0.5) * contenedor.clientHeight;

    etiquetaTcp.style.opacity = '1';
    etiquetaTcp.style.left = `${x}px`;
    etiquetaTcp.style.top = `${y}px`;
    etiquetaTcp.textContent =
        `TCP (${posicionEfector.x.toFixed(2)}, ${posicionEfector.y.toFixed(2)}, ${posicionEfector.z.toFixed(2)})`;
}

function aplicarPostura() {
    grupo1.rotation.y = THREE.MathUtils.degToRad(posturaActual.q1);
    grupo2.rotation.z = THREE.MathUtils.degToRad(posturaActual.q2);

    const escalaExtension = 1 + (posturaActual.q3 * 0.05);
    extension.scale.y = escalaExtension;
    extension.position.y = 2 * escalaExtension;
    tool.position.y = (4 * escalaExtension) + 0.65;

    actualizarEstatus();
}

function leerControles() {
    posturaActual.q1 = origenControles.q1 === 'rango' || numeroQ1.value === ''
        ? Number(rangoQ1.value)
        : Number(numeroQ1.value);
    posturaActual.q2 = origenControles.q2 === 'rango' || numeroQ2.value === ''
        ? Number(rangoQ2.value)
        : Number(numeroQ2.value);
    posturaActual.q3 = origenControles.q3 === 'rango' || numeroQ3.value === ''
        ? Number(rangoQ3.value)
        : Number(numeroQ3.value);
}

function restablecerControles() {
    posturaActual.q1 = posturaInicial.q1;
    posturaActual.q2 = posturaInicial.q2;
    posturaActual.q3 = posturaInicial.q3;
    origenControles.q1 = 'numero';
    origenControles.q2 = 'numero';
    origenControles.q3 = 'numero';

    rangoQ1.value = posturaInicial.q1;
    numeroQ1.value = posturaInicial.q1;
    rangoQ2.value = posturaInicial.q2;
    numeroQ2.value = posturaInicial.q2;
    rangoQ3.value = posturaInicial.q3;
    numeroQ3.value = posturaInicial.q3;
}

function animar() {
    escena.updateMatrixWorld(true);
    camara.updateMatrixWorld();
    actualizarEtiquetaTcp();
    renderizador.render(escena, camara);
    window.requestAnimationFrame(animar);
}

sincronizarEntradas(rangoQ1, numeroQ1, 'q1');
sincronizarEntradas(rangoQ2, numeroQ2, 'q2');
sincronizarEntradas(rangoQ3, numeroQ3, 'q3');

botonRestablecer.addEventListener('click', () => {
    restablecerControles();
    aplicarPostura();
});

restablecerControles();
aplicarPostura();
animar();

window.addEventListener('resize', () => {
    const nuevoAncho = contenedor.clientWidth;
    const nuevoAlto = contenedor.clientHeight;

    camara.aspect = nuevoAncho / nuevoAlto;
    camara.updateProjectionMatrix();
    renderizador.setSize(nuevoAncho, nuevoAlto);
});



