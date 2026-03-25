(async () => {
  const DEBUG_3D_HELPERS = true;
  const section = document.querySelector('.cambodia-street-section');
  if (!section) return;

  const imagesWrap = section.querySelector('.cambodia-street-images');
  const dataEl = section.querySelector('.cambodia-street-gallery-data');
  const modelHost = section.querySelector('#container3D');
  if (!imagesWrap || !dataEl) return;

  const updateModelHostVisibility = () => {
    const rect = section.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const activationLine = viewportHeight * 0.12;
    const isVisible = rect.top <= activationLine && rect.bottom > activationLine;

    if (!modelHost) {
      return;
    }

    modelHost.classList.toggle('is-active', isVisible);
  };

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

  const getTextboxTextById = (textboxId) => {
    const match = layout.find(
      (entry) => entry && Number(entry.textbox) === textboxId && typeof entry.text === 'string'
    );
    return match ? match.text : '';
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

  const mountTextbox = (id, tagName, fallbackText, delay) => {
    const text = getTextboxTextById(id) || fallbackText;
    if (!text) return;

    const node = document.createElement(tagName);
    node.className = `cambodia-street-textbox cambodia-street-textbox-${id}`;
    node.textContent = text;
    imagesWrap.appendChild(node);

    if (window.gsap && typeof window.gsap.to === 'function' && typeof window.gsap.set === 'function') {
      window.gsap.set(node, { xPercent: -50, yPercent: -190, opacity: 0 });
      window.gsap.to(node, {
        duration: 1.1,
        xPercent: -50,
        yPercent: -50,
        opacity: 1,
        ease: 'power3.out',
        delay,
      });
    } else {
      node.style.opacity = '1';
      node.style.transform = 'translate(-50%, -50%)';
    }
  };

  mountTextbox(1, 'h2', 'Siem Reap, Cambodia', 0.55);
  mountTextbox(2, 'p', '', 0.75);
  mountTextbox(3, 'p', '', 0.75);
  mountTextbox(4, 'p', '', 0.75);

  const setupScrollTextboxesMovingOut = () => {
    const gsapApi = window.gsap;
    const scrollTriggerApi = window.ScrollTrigger;

    if (
      !gsapApi ||
      !scrollTriggerApi ||
      typeof gsapApi.to !== 'function'
    ) {
      return;
    }

    if (typeof gsapApi.registerPlugin === 'function') {
      gsapApi.registerPlugin(scrollTriggerApi);
    }
    
    const textboxes = section.querySelectorAll('.cambodia-street-textbox');     
    textboxes.forEach((textbox) => {
      gsapApi.to(textbox, {
        y: () => -window.innerHeight * 0.42,
        ease: 'none',
        immediateRender: false,
        scrollTrigger: {
          trigger: section,
          start: 'top+=15% top',
          end: () => `+=${section.offsetHeight * 0.45}`,
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
    });
  };

  setupScrollTextboxesMovingOut();

  // 3D setup
  if (!modelHost) return;

  updateModelHostVisibility();
  window.addEventListener('scroll', updateModelHostVisibility, { passive: true });
  window.addEventListener('resize', updateModelHostVisibility);

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
  camera.lookAt(0, -0.60, 0);

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

  const movementProgress = 0.25;
  const shrinkProgress = 1;
  const movementEnd = () => `+=${section.offsetHeight * movementProgress}`;
  const movementAtHalfTime = () => `+=${section.offsetHeight * movementProgress * 0.5}`;
  const shrinkEnd = () => `+=${section.offsetHeight * shrinkProgress}`;

  const setupScrollLionMovement = () => {
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

    gsapApi.to(modelCambodiaLion.rotation, {
      y: modelCambodiaLion.rotation.y + Math.PI * 1.8,
      x: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: movementEnd,
        scrub: true,
        invalidateOnRefresh: true,
      },
    });

    gsapApi.to(modelCambodiaLion.position, {
      y: -1,
      x: 2,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: movementEnd,
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
  };

  const setupScrollLionGetsSmller = () => {
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
    gsapApi.to(modelCambodiaLion.scale, {
      x: 0.1,
      y: 0.1,
      z: 0.1,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: movementEnd,
        end: shrinkEnd,
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
      setupScrollLionMovement();
      setupScrollLionGetsSmller();
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
    camera.position.z = 15;
    camera.updateProjectionMatrix();
    camera.lookAt(0, -0.60, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
