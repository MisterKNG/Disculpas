// Texto de la carta (puedes editarlo)
const apologyText = `Sé que fallé y entiendo el dolor que causé.
No quiero excusas: quiero que sepas que aprendo de esto
y que haré lo que haga falta para ser mejor para ti.

Te pido perdón con el corazón en la mano, no quiero que sigas pensando mal de mi.
No quiero perderte, no quiero que sigamos así por una estupidez mía :c
Quiero seguir compartiendo más momentos contigo, te extraño loca renegona
Con este detalle espero que me comprendas, chiquita renegona <3 
Te amo más que a mis propios miedos.
¿Podemos estar bien y perdonarme aun que sea el 50%? ❤️`;

/* ---------- TIP: si quieres personalizar el texto, edita 'apologyText' arriba. ---------- */

/* Referencias DOM */
const typedEl = document.getElementById('typed');
const playTextBtn = document.getElementById('playTextBtn');
const forgiveBtn = document.getElementById('forgiveBtn');
const resultEl = document.getElementById('result');
const heartsContainer = document.getElementById('hearts-container');
const music = document.getElementById('bgMusic');
const musicToggle = document.getElementById('musicToggle');

let typing = false;
let heartsInterval;

/* --- Máquina de escribir --- */
function typeText(text, target, speed = 36) {
  target.textContent = '';
  let i = 0;
  typing = true;
  return new Promise((resolve) => {
    const id = setInterval(() => {
      target.textContent += text[i] === '\n' ? '\n' : text[i];
      i++;
      // Scroll into view if necessary
      target.scrollTop = target.scrollHeight;
      if (i >= text.length) {
        clearInterval(id);
        typing = false;
        resolve();
      }
    }, speed);
  });
}

/* --- Generar corazones flotando de fondo --- */
function spawnFloatingHeart() {
  const h = document.createElement('div');
  h.className = 'small-heart';
  const size = 24 + Math.random() * 36;
  h.style.width = `${size}px`;
  h.style.height = `${size}px`;
  const left = Math.random() * 100;
  h.style.left = `${left}%`;
  h.style.bottom = `-20vh`;
  const color = ['#ff6b8a','#ff9bb3','#ffd6e0','#ffb3c6'][Math.floor(Math.random()*4)];
  h.style.color = color;

  // inner svg-like heart (uses CSS shape defined in styles)
  const inner = document.createElement('div');
  inner.className = 'heart-shape';
  h.appendChild(inner);

  heartsContainer.appendChild(h);

  const duration = 7000 + Math.random() * 7000;
  const delay = Math.random() * 800;

  h.style.animation = `floatUp ${duration}ms linear ${delay}ms forwards`;

  // remove after done
  setTimeout(() => h.remove(), duration + delay + 200);
}

function startBackgroundHearts() {
  if (heartsInterval) return;
  // spawn a heart every 600ms on average
  heartsInterval = setInterval(spawnFloatingHeart, 550);
  // spawn a few immediately
  for (let i=0;i<6;i++) setTimeout(spawnFloatingHeart, i*150);
}
function stopBackgroundHearts() {
  clearInterval(heartsInterval);
  heartsInterval = null;
}

/* --- Hearts burst when forgiven --- */
function burstHearts(x = window.innerWidth/2, y = window.innerHeight/2, count = 28) {
  for (let i = 0; i < count; i++) {
    const h = document.createElement('div');
    h.className = 'small-heart';
    const size = 12 + Math.random() * 18;
    h.style.width = `${size}px`;
    h.style.height = `${size}px`;
    h.style.left = `${x}px`;
    h.style.top = `${y}px`;
    const color = ['#ff6b8a','#ff9bb3','#ffd6e0','#ffb3c6'][Math.floor(Math.random()*4)];
    h.style.color = color;
    h.style.opacity = 1;
    h.style.transform = `translate(-50%,-50%) scale(0.8)`;

    const inner = document.createElement('div');
    inner.className = 'heart-shape';
    h.appendChild(inner);

    document.body.appendChild(h);

    // Random trajectory
    const angle = Math.random() * Math.PI * 2;
    const distance = 80 + Math.random() * 160;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;

    h.animate([
      { transform: `translate(-50%,-50%) translate(0px,0px) scale(0.9)`, opacity: 1 },
      { transform: `translate(-50%,-50%) translate(${dx}px,${dy}px) scale(1.2)`, opacity: 0 }
    ], {
      duration: 1200 + Math.random() * 700,
      easing: 'cubic-bezier(.2,.8,.2,1)'
    });

    setTimeout(() => h.remove(), 2200);
  }
}

/* --- Controls --- */
playTextBtn.addEventListener('click', async () => {
  if (typing) return; // evita duplicar
  typedEl.textContent = '';
  resultEl.classList.add('hidden');
  await typeText(apologyText, typedEl, 36);
  // pequeño brillo final
  typedEl.animate([{filter:'blur(0px)'},{filter:'blur(0.6px)'},{filter:'blur(0px)'}], {duration:600});
});

forgiveBtn.addEventListener('click', async (e) => {
  // si aún no se ha escrito el texto, escribe primero (mejor experiencia)
  if (!typing && typedEl.textContent.trim().length === 0) {
    await typeText(apologyText, typedEl, 28);
  }
  // mostrar resultado romántico
  resultEl.classList.remove('hidden');
  resultEl.textContent = 'Sabía que almenos puedas entenderme, pero terminemos de aclarar en persona, pero recuerda que TE AMO.';
  // burst de corazones desde el botón
  const rect = forgiveBtn.getBoundingClientRect();
  burstHearts(rect.left + rect.width/2, rect.top + rect.height/2, 36);

  // un pequeño efecto: más corazones de fondo por un tiempo
  startBackgroundHearts();
  setTimeout(() => {
    // calma los corazones después de un rato pero deja algunos
    stopBackgroundHearts();
  }, 8000);
});

/* --- Música toggle --- */
musicToggle.addEventListener('click', () => {
  if (!music) return;
  if (music.paused) {
    music.play().catch(()=> {
      // Autoplay a veces bloqueado; mostrar instrucción
      alert('Si el navegador bloquea la reproducción automática, pulsa "Tocar música" de nuevo o permite reproducción en la pestaña.');
    });
    musicToggle.textContent = 'Pausar música ⏸️';
  } else {
    music.pause();
    musicToggle.textContent = 'Tocar música 🎵';
  }
});

/* --- Inicia animaciones de fondo al cargar --- */
window.addEventListener('load', () => {
  startBackgroundHearts();
  // intenta autoplay (puede bloquearse)
  music.play().then(()=> {
    musicToggle.textContent = 'Pausar música ⏸️';
  }).catch(()=> {
    // no pasar nada si el navegador impide el autoplay
  });
});

/* --- Accesibilidad: detener corazones con tecla Esc --- */
window.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape') {
    stopBackgroundHearts();
  }
});
