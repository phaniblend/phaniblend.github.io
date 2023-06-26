// Constants
const radius = 600; // Increased radius of carousel
const totalImages = 5; // Number of images
const imageFolderPath = 'images/'; // Path to image folder
const maxAngularVelocity = (2 * Math.PI) / 180; // Maximum angular velocity
const rotationSpeed = 0.01; // Rotation speed of the carousel

// Three.js variables
let scene, camera, renderer;
let imageMeshes = [];

// Animation state variable
let isPaused = false;

// Load images and create the carousel
function loadImagesAndCreateCarousel() {
  // Fetch the image data using d3.js
  d3.json('images.json').then(data => {
    // Initialize Three.js after loading images
    init(data);
    animate();
  }).catch(error => {
    console.error('Error loading images:', error);
  });
}

function init(data) {
  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.z = 900; // Increased distance from the carousel

  // Renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Create image meshes and add them to the scene
  const angleStep = 2 * Math.PI / totalImages;
  data.forEach((imageData, index) => {
    const texture = new THREE.TextureLoader().load(`${imageFolderPath}${imageData.filename}`);
    texture.minFilter = THREE.LinearFilter; // To avoid power of two issue [1]
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const geometry = new THREE.PlaneGeometry(400, 400); // Increased size of the meshes
    geometry.translate(-200, 0, 0); // Adjust origin to the left edge
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, -radius); // All images start at the back of the carousel
    mesh.rotation.y = index * angleStep; // Adjust rotation to form the carousel
    mesh.scale.set(2, 2, 2); // Increase scale of the meshes
    scene.add(mesh);
    imageMeshes.push(mesh);
    mesh.userData.filename = imageData.filename; // To store the filename for popup [3]
  });

  // Add mousemove listener
  document.addEventListener('mousemove', onMouseMove, false);

  // Add window resize listener [5]
  window.addEventListener('resize', onWindowResize, false);

  // Add popup close listener
  document.getElementById('popup').addEventListener('click', onPopupClose);

  // Add close button listener
  document.getElementById('close-container').addEventListener('click', onPopupClose);

  // Add click listener
  document.addEventListener('click', onMouseClick, false);
}

function onMouseClick(event) {
  // Calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Create a raycaster and update it with the camera and mouse position
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  // Check for intersections between the raycaster and the image meshes
  const intersects = raycaster.intersectObjects(scene.children);

  if (intersects.length > 0) {
    // Show the popup with the full source image
    const popup = document.getElementById('popup');
    const img = popup.querySelector('img');
    img.src = `${imageFolderPath}${intersects[0].object.userData.filename}`;
    popup.style.display = 'block';
    isPaused = true; // Set animation state to true
  }
}

function onPopupClose() {
  // Hide the popup and resume the carousel animation
  const popup = document.getElementById('popup');
  popup.style.display = 'none';
  isPaused = false; // Set animation state to false
}

function onMouseMove(event) {
  // Calculate mouse movement ratios
  const horizontalPosition = event.clientX / window.innerWidth;

  // Rotate images based on horizontal mouse position
  imageMeshes.forEach(mesh => {
    // Determine the direction of rotation based on the mouse position
    const direction = horizontalPosition > 0.5 ? 1 : -1;
    mesh.rotation.y += direction * rotationSpeed; // Use the rotation speed variable instead of angular velocity
  });
}

function onWindowResize() {
  // Resize the renderer and the camera according to the window size
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function animate() {
  requestAnimationFrame(animate);
  if (!isPaused) {
    renderer.render(scene, camera);
  }
}

// Load images and create the carousel on page load
window.addEventListener('load', loadImagesAndCreateCarousel);
