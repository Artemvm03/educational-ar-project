// src/components/interactive-charge.js
AFRAME.registerComponent('interactive-charge', {
  schema: {
    chargeValue: {type: 'number', default: 1},
    draggable: {type: 'boolean', default: true},
    hoverEffect: {type: 'boolean', default: true}
  },

  init: function () {
    this.isDragging = false;
    this.isHovering = false;
    // Площина для перетягування (горизонтальна)
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.5);
    // Raycaster для обчислення позиції миші
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    // Початкова позиція для розрахунку зміщення
    this.dragStartPoint = new THREE.Vector3();
    this.initialPosition = new THREE.Vector3();
    
    // Прив'язуємо методи до контексту
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    
    // Налаштовуємо слухачі подій
    this.setupEventListeners();
    console.log("Interactive Charge component initialized for:", this.el.id);
  },

  setupEventListeners: function() {
    this.el.addEventListener('mousedown', this.onMouseDown);
    // Використовуємо document для глобального відстеження
    document.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('mousemove', this.onMouseMove);
    // События наведення
    if (this.data.hoverEffect) {
      this.el.addEventListener('mouseenter', this.onMouseEnter);
      this.el.addEventListener('mouseleave', this.onMouseLeave);
    }
  },

  remove: function () {
    // Прибираємо слухачі подій
    this.el.removeEventListener('mousedown', this.onMouseDown);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    if (this.data.hoverEffect) {
      this.el.removeEventListener('mouseenter', this.onMouseEnter);
      this.el.removeEventListener('mouseleave', this.onMouseLeave);
    }
  },

  onMouseDown: function (evt) {
    if (!this.data.draggable || evt.button !== 0) return;
    // Запобігаємо конфліктам з контролами камери
    evt.preventDefault();
    evt.stopPropagation();
    this.isDragging = true;
    this.el.addState('dragging');
    
    // Оновлюємо координати миші для raycaster
    this.mouse.x = (evt.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(evt.clientY / window.innerHeight) * 2 + 1;
    
    // Отримуємо Raycaster з камери
    const camera = this.el.sceneEl.camera;
    this.raycaster.setFromCamera(this.mouse, camera);
    
    // Визначаємо точку перетину з площиною перетягування
    this.raycaster.ray.intersectPlane(this.dragPlane, this.dragStartPoint);
    this.initialPosition.copy(this.el.object3D.position);
    
    // Тимчасово вимикаємо контроли камери
    const cameraEl = this.el.sceneEl.querySelector('[camera]');
    if (cameraEl) {
      cameraEl.setAttribute('look-controls', 'enabled', false);
    }
    console.log('Dragging started for', this.el.id);
  },

  onMouseUp: function (evt) {
    if (this.isDragging) {
      this.isDragging = false;
      this.el.removeState('dragging');
      
      // Вмикаємо контроли камери назад
      const cameraEl = this.el.sceneEl.querySelector('[camera]');
      if (cameraEl) {
        cameraEl.setAttribute('look-controls', 'enabled', true);
      }
      console.log('Dragging stopped for', this.el.id);
      this.el.sceneEl.emit('charge-moved');
    }
  },

  onMouseMove: function (evt) {
    if (!this.isDragging) return;
    
    // Оновлюємо координати миші
    this.mouse.x = (evt.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(evt.clientY / window.innerHeight) * 2 + 1;
    
    // Оновлюємо Raycaster
    const camera = this.el.sceneEl.camera;
    this.raycaster.setFromCamera(this.mouse, camera);
    let intersectionPoint = new THREE.Vector3();
    
    // Отримуємо нову точку перетину з площиною перетягування
    if (this.raycaster.ray.intersectPlane(this.dragPlane, intersectionPoint)) {
      // Обчислюємо зміщення від початкової точки перетягування
      const delta = intersectionPoint.clone().sub(this.dragStartPoint);
      // Оновлюємо позицію об'єкта
      this.el.object3D.position.copy(this.initialPosition.clone().add(delta));
      // Оновлюємо силові лінії в реальному часі
      this.el.sceneEl.emit('charge-moved');
    }
  },

  onMouseEnter: function() {
    if (this.data.hoverEffect && !this.isDragging) {
      this.isHovering = true;
      this.el.addState('hovered');
      // Візуальний ефект наведення
      this.el.setAttribute('scale', '1.1 1.1 1.1');
    }
  },

  onMouseLeave: function() {
    if (this.data.hoverEffect && !this.isDragging) {
      this.isHovering = false;
      this.el.removeState('hovered');
      // Повертаємо початковий масштаб
      this.el.setAttribute('scale', '1 1 1');
    }
  }
});