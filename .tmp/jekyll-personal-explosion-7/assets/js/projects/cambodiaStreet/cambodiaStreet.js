(async () => {
  const DEBUG_3D_HELPERS = true;
  const cambodiaFocus = {
    lat: 12.5657,
    lng: 104.9910,
    altitude: 1.55
  };
  const cambodiaMarkers = [
    {
      lat: 13.3671,
      lng: 103.8448,
      radius: 0.54,
      altitude: 0.03,
      color: '#7be2ff',
      ringAltitude: 0.01,
      ringMaxRadius: 4.6,
      ringPropagationSpeed: 1.55,
      ringRepeatPeriod: 1100,
      ringColor: (t) => `rgba(123, 226, 255, ${1 - t})`
    },
    {
      lat: 11.5564,
      lng: 104.9282,
      radius: 0.46,
      altitude: 0.028,
      color: '#ffb363',
      ringAltitude: 0.01,
      ringMaxRadius: 3.8,
      ringPropagationSpeed: 1.25,
      ringRepeatPeriod: 1280,
      ringColor: (t) => `rgba(255, 179, 99, ${1 - t})`
    }
  ];
  const globeSection = document.querySelector('.cambodia-street-globe-section');
  const section = document.querySelector('.cambodia-street-section');
  const globeMount = document.getElementById('cambodiaStreetGlobeMount');
  const globeShell = globeSection ? globeSection.querySelector('.cambodia-street-globe-shell') : null;
  const globeRings = globeSection ? globeSection.querySelectorAll('.cambodia-street-globe-ring') : [];
  const globeParticles = globeSection ? globeSection.querySelector('.cambodia-street-globe-particles') : null;
  if (!section && !globeSection) return;

  const setupGlobePreludeParticles = () => {
    if (!globeParticles || globeParticles.dataset.particlesReady === 'true') {
      return;
    }

    const particleCount = 18;
    const fragment = document.createDocumentFragment();
    let index;

    for (index = 0; index < particleCount; index += 1) {
      const particle = document.createElement('span');
      particle.className = 'cambodia-street-globe-particle';
      particle.style.setProperty('--particle-x', (8 + (Math.random() * 84)).toFixed(2));
      particle.style.setProperty('--particle-y', (10 + (Math.random() * 80)).toFixed(2));
      particle.style.setProperty('--particle-size', (0.22 + (Math.random() * 0.68)).toFixed(3));
      particle.style.setProperty('--particle-opacity', (0.16 + (Math.random() * 0.52)).toFixed(3));
      fragment.appendChild(particle);
    }

    globeParticles.appendChild(fragment);
    globeParticles.dataset.particlesReady = 'true';
  };

  const animateGlobePrelude = () => {
    if (!globeShell || !window.gsap || typeof window.gsap.fromTo !== 'function') {
      return;
    }

    window.gsap.fromTo(
      globeShell,
      {
        autoAlpha: 0,
        scale: 0.72,
        rotationZ: -22,
        rotationX: 55,
        y: 72,
        transformPerspective: 1200,
        transformOrigin: '50% 50%'
      },
      {
        autoAlpha: 1,
        scale: 1,
        rotationZ: 0,
        rotationX: 0,
        y: 0,
        duration: 1.5,
        ease: 'power4.out',
        delay: 0.18
      }
    );

    if (globeRings.length) {
      window.gsap.fromTo(
        globeRings,
        {
          autoAlpha: 0,
          scale: 0.82
        },
        {
          autoAlpha: 1,
          scale: 1,
          duration: 1.1,
          ease: 'power2.out',
          stagger: 0.08,
          delay: 0.36
        }
      );

      globeRings.forEach((ring, index) => {
        window.gsap.to(ring, {
          rotationZ: index % 2 === 0 ? 360 : -360,
          duration: 28 + (index * 6),
          ease: 'none',
          repeat: -1
        });
      });
    }

    if (globeParticles && globeParticles.children.length) {
      Array.prototype.forEach.call(globeParticles.children, (particle, index) => {
        const driftY = (index % 2 === 0 ? -1 : 1) * (8 + (index % 5) * 2);
        const driftX = (index % 3 === 0 ? -1 : 1) * (4 + (index % 4) * 1.5);

        window.gsap.to(particle, {
          x: driftX,
          y: driftY,
          duration: 5.4 + (index * 0.35),
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1
        });
      });
    }
  };

  const setupInteractiveGlobe = async () => {
    let GlobeFactory;
    let globeInstance;
    let controls;
    let renderer;
    let initialCameraState;

    if (!globeMount) {
      return null;
    }

    try {
      const globeModule = await import('https://esm.sh/globe.gl@2.39.2?bundle');
      GlobeFactory = globeModule.default;
    } catch (error) {
      console.error('Cambodia Street Globe.gl import failed:', error);
      return null;
    }

    globeInstance = GlobeFactory()(globeMount)
      .backgroundColor('rgba(0,0,0,0)')
      .showAtmosphere(true)
      .atmosphereColor('#78e6ff')
      .atmosphereAltitude(0.18)
      .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
      .pointsData(cambodiaMarkers)
      .pointColor('color')
      .pointAltitude('altitude')
      .pointRadius('radius')
      .pointResolution(18)
      .ringsData(cambodiaMarkers)
      .ringLat('lat')
      .ringLng('lng')
      .ringColor('ringColor')
      .ringAltitude('ringAltitude')
      .ringMaxRadius('ringMaxRadius')
      .ringPropagationSpeed('ringPropagationSpeed')
      .ringRepeatPeriod('ringRepeatPeriod');

    const syncGlobeSize = () => {
      const rect = globeMount.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));

      globeInstance.width(width);
      globeInstance.height(height);
    };

    syncGlobeSize();

    controls = typeof globeInstance.controls === 'function' ? globeInstance.controls() : null;
    if (controls) {
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.rotateSpeed = 0.78;
      controls.autoRotate = false;
    }

    renderer = typeof globeInstance.renderer === 'function' ? globeInstance.renderer() : null;
    if (renderer && typeof renderer.setClearColor === 'function') {
      renderer.setClearColor(0x000000, 0);
    }

    globeMount.addEventListener('pointerdown', () => {
      globeMount.classList.add('is-dragging');
    });
    window.addEventListener('pointerup', () => {
      globeMount.classList.remove('is-dragging');
    });
    globeMount.addEventListener('pointerleave', () => {
      globeMount.classList.remove('is-dragging');
    });

    initialCameraState = {
      lat: cambodiaFocus.lat + 10,
      lng: cambodiaFocus.lng - 220,
      altitude: 2.9
    };

    globeInstance.pointOfView(initialCameraState, 0);

    if (window.gsap && typeof window.gsap.to === 'function') {
      window.gsap.to(initialCameraState, {
        lat: cambodiaFocus.lat + 1.2,
        lng: cambodiaFocus.lng + 14,
        altitude: 1.9,
        duration: 1.25,
        ease: 'power2.out',
        delay: 0.2,
        onUpdate: () => {
          globeInstance.pointOfView(initialCameraState, 0);
        },
        onComplete: () => {
          const settleState = {
            lat: initialCameraState.lat,
            lng: initialCameraState.lng,
            altitude: initialCameraState.altitude
          };

          window.gsap.to(settleState, {
            lat: cambodiaFocus.lat,
            lng: cambodiaFocus.lng,
            altitude: cambodiaFocus.altitude,
            duration: 1.4,
            ease: 'power3.out',
            onUpdate: () => {
              globeInstance.pointOfView(settleState, 0);
            }
          });
        }
      });
    } else {
      globeInstance.pointOfView(cambodiaFocus, 1600);
    }

    window.addEventListener('resize', syncGlobeSize);
    return globeInstance;
  };

  setupGlobePreludeParticles();
  animateGlobePrelude();
  await setupInteractiveGlobe();

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
