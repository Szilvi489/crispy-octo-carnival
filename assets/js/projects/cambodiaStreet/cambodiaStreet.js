(async () => {
  const DEBUG_3D_HELPERS = false;
  const section = document.querySelector('.cambodia-street-section');
  if (!section) return;

  const imagesWrap = section.querySelector('.cambodia-street-images');
  const dataEl = section.querySelector('.cambodia-street-gallery-data');
  const modelHost = section.querySelector('#container3D');
  if (!imagesWrap || !dataEl) return;

  let data = {};
  try {
    data = JSON.parse(dataEl.textContent || '{}');
  } catch (error) {
    console.error('Cambodia Street gallery JSON is invalid:', error);
  }
  const layout = Array.isArray(data.layout) ? data.layout : [];
  const all = Array.isArray(data.all) ? data.all : [];

  const getImageByPosition = (position) => {
    const match = layout.find((entry) => entry && Number(entry.position) === position && typeof entry.path === 'string');
    return match ? match.path : null;
  };

  const firstImagePath = getImageByPosition(1) || (layout[0] && layout[0].path) || all[0];
  if (firstImagePath) {
    const img1 = new Image();
    img1.className = 'cambodia-street-image-1';
    img1.alt = 'Cambodia Street opening image';
    img1.src = firstImagePath;
    imagesWrap.appendChild(img1);

    img1.addEventListener('load', () => {
      if (window.gsap && typeof window.gsap.to === 'function' && typeof window.gsap.set === 'function') {
        window.gsap.set(img1, { xPercent: -50, yPercent: -100, opacity: 0 });
        window.gsap.to(img1, 
          { duration: 1.1,
              xPercent: -50,
              yPercent: -50,
             opacity: 1,
              ease: 'power3.out',
              delay: 0.55, 
            }); 
      } else {
        img1.style.opacity = '1';
        img1.style.transform = 'translate(-50%, -50%) scale(1)';
      }
    }, { once: true });
  }

  const textBox1 = document.createElement('h2');
  textBox1.className = 'cambodia-street-textbox-1';
  textBox1.textContent = 'Angkor Wat Statues';
  imagesWrap.appendChild(textBox1);

  if (window.gsap && typeof window.gsap.to === 'function' && typeof window.gsap.set === 'function') {
    window.gsap.set(textBox1, { xPercent: -50, yPercent: -190, opacity: 0 });
    window.gsap.to(textBox1, {
      duration: 1.1,
      xPercent: -50,
      yPercent: -50,
      opacity: 1,
      ease: 'power3.out',
      delay: 0.55,
    });
  } else {
    textBox1.style.opacity = '1';
    textBox1.style.transform = 'translate(-50%, -50%)';
  }

  // 3D setup
  if (!modelHost) return;

  let THREE;
  let GLTFLoader;
  try {
    const [threeModule, loaderModule] = await Promise.all([
      import('https://esm.sh/three@0.150.1'),
      import('https://esm.sh/three@0.150.1/examples/jsm/loaders/GLTFLoader.js'),
    ]);
    THREE = threeModule;
    GLTFLoader = loaderModule.GLTFLoader;
  } catch (error) {
    console.error('Cambodia Street Three.js module import failed:', error);
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 15;
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  modelHost.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 11, 50);
  scene.add(directionalLight);

  if (DEBUG_3D_HELPERS) {
    const axesHelper = new THREE.AxesHelper(2);
    scene.add(axesHelper);
    const gridHelper = new THREE.GridHelper(8, 8, 0x00aaff, 0xbfefff);
    gridHelper.position.y = -0.9;
    scene.add(gridHelper);
  }

  let modelCambodiaLion = null;

  const setupScrollLinkedModelMotion = () => {
    const gsapApi = window.gsap;
    const scrollTriggerApi = window.ScrollTrigger;

    if (
      !modelCambodiaLion ||
      !gsapApi ||
      !scrollTriggerApi ||
      typeof gsapApi.to !== 'function'
    ) {
      return;
    }

    if (typeof gsapApi.registerPlugin === 'function') {
      gsapApi.registerPlugin(scrollTriggerApi);
    }

    const speedOfTravel = 0.25;//sopeed of travel compared to scroll
    const stopScrollDistance = () => `+=${section.offsetHeight * speedOfTravel}`;

    gsapApi.to(modelCambodiaLion.rotation, {
      y: modelCambodiaLion.rotation.y + Math.PI * 1.8,
      x: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: stopScrollDistance,
        scrub: true,
        invalidateOnRefresh: true,
      },
    });

    gsapApi.to(modelCambodiaLion.position, {
      y: -0.9,
      x: 2,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: stopScrollDistance,
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
  };

  const loader = new GLTFLoader();
  loader.load('/assets/images/projects/cambodiaStreet/3DImages/guardian_lion_from_cambodia.glb',
    (gltf) => {
      modelCambodiaLion = gltf.scene;
      modelCambodiaLion.position.y = -1.9;
      modelCambodiaLion.position.x = -4.8;
      modelCambodiaLion.rotation.y = 0.600;
      modelCambodiaLion.scale.setScalar(0.3);
      scene.add(modelCambodiaLion);
      setupScrollLinkedModelMotion();
    },
    undefined,
    (error) => {
      console.error('Cambodia Street GLB load failed:', error);
    }
  );

  const renderFrame = () => {
    requestAnimationFrame(renderFrame);
    renderer.render(scene, camera);
  };
  renderFrame();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    camera.lookAt(0, -0.60, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
