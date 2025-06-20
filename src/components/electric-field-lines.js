// src/components/electric-field-lines.js
AFRAME.registerComponent('electric-field-lines', {
  init: function () {
    this.container = this.el;
    this.scene = this.el.sceneEl;
    this.fieldLines = []; // Масив для зберігання ліній
    
    // Прив'язуємо методи до контексту, щоб 'this' завжди посилався на компонент
    this.updateFieldLines = this.updateFieldLines.bind(this);
    this._calculateElectricField = this._calculateElectricField.bind(this);
    this._createFieldLine = this._createFieldLine.bind(this);
    this._generateSingleChargeField = this._generateSingleChargeField.bind(this);
    this._clearAllFieldLines = this._clearAllFieldLines.bind(this);
    
    // Слухаємо події зміни зарядів
    this.scene.addEventListener('charge-moved', this.updateFieldLines);
    this.scene.addEventListener('charges-changed', this.updateFieldLines);
    console.log('Electric Field Lines component initialized.');
    
    // Початкове відображення при завантаженні сцени
    // Додаємо невелику затримку, щоб переконатися, що DOM повністю завантажений
    setTimeout(() => {
      this.updateFieldLines();
    }, 100);
  },

  remove: function () {
    // Прибираємо слухачі подій при видаленні компонента
    this.scene.removeEventListener('charge-moved', this.updateFieldLines);
    this.scene.removeEventListener('charges-changed', this.updateFieldLines);
    this._clearAllFieldLines();
  },

  _clearAllFieldLines: function() {
    // Видаляємо всі лінії з Three.js сцени
    this.fieldLines.forEach(line => {
      if (line.parent) {
        line.parent.remove(line);
      }
      if (line.geometry) {
        line.geometry.dispose();
      }
      if (line.material) {
        line.material.dispose();
      }
    });
    this.fieldLines = [];
    
    // Також очищаємо DOM контейнер
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    
    console.log('All field lines cleared');
  },

  updateFieldLines: function () {
    console.log('Updating field lines...');
    
    // Повністю очищаємо попередні лінії
    this._clearAllFieldLines();
    
    // Збираємо всі заряди
    const charges = [];
    this.scene.querySelectorAll('[data-charge-value]').forEach(chargeEl => {
      if (chargeEl.parentNode) { // Перевіряємо, чи елемент ще в DOM
        const position = chargeEl.object3D.position;
        const value = parseFloat(chargeEl.getAttribute('data-charge-value'));
        charges.push({ element: chargeEl, position: position, value: value });
      }
    });
    
    // Якщо зарядів немає, просто очищаємо і виходимо
    if (charges.length === 0) {
      console.log('No charges found, field lines cleared.');
      return;
    }
    
    console.log('Found charges:', charges.length);
    
    // Пошук позитивного та негативного заряду
    const positiveCharge = charges.find(c => c.value > 0);
    const negativeCharge = charges.find(c => c.value < 0);
    
    // Логіка генерації ліній поля
    if (positiveCharge && negativeCharge) {
      console.log('Generating field lines between two charges.');
      const numLines = 15; // Збільшимо кількість ліній для кращої візуалізації
      const startRadius = 0.25;
      
      for (let i = 0; i < numLines; i++) {
        // Початкова точка для лінії від позитивного заряду
        const angle = (i / numLines) * 2 * Math.PI;
        // Додаємо невеликий зсув по Y або Z, щоб лінії не були тільки в одній площині
        const startPoint = new THREE.Vector3(
          positiveCharge.position.x + startRadius * Math.cos(angle),
          positiveCharge.position.y + startRadius * Math.sin(angle),
          positiveCharge.position.z + (Math.random() - 0.5) * startRadius * 0.5 // Невелике випадкове зміщення
        );
        
        const path = [];
        let currentPoint = startPoint.clone();
        path.push(currentPoint.clone());
        
        const stepSize = 0.1;
        const maxSteps = 150; // Збільшимо максимальну кількість кроків
        
        for (let step = 0; step < maxSteps; step++) {
          const fieldVector = this._calculateElectricField(currentPoint, charges);
          if (fieldVector.length() < 0.001) break; // Зменшили поріг для більш точного розрахунку
          
          currentPoint.add(fieldVector.normalize().multiplyScalar(stepSize));
          path.push(currentPoint.clone());
          
          // Зупинка при наближенні до негативного заряду
          if (negativeCharge && currentPoint.distanceTo(negativeCharge.position) < startRadius) {
            break;
          }
          
          // Зупинка при виході за межі сцени
          if (Math.abs(currentPoint.x) > 5 || Math.abs(currentPoint.y) > 5 ||
              Math.abs(currentPoint.z) > 5) {
            break;
          }
        }
        
        if (path.length > 1) { // Створюємо лінію, тільки якщо є більше однієї точки
          this._createFieldLine(path);
        }
      }
    } else if (positiveCharge) {
      console.log('Generating field lines for a single positive charge.');
      this._generateSingleChargeField(positiveCharge, true); // true = позитивний
    } else if (negativeCharge) {
      console.log('Generating field lines for a single negative charge.');
      this._generateSingleChargeField(negativeCharge, false); // false = негативний
    }
  },

  /**
   * Генерує лінії поля для одного ізольованого заряду.
   * Лінії йдуть радіально від позитивного заряду або до негативного.
   * @param {object} charge - Об'єкт заряду ({element, position, value}).
   * @param {boolean} isPositive - True, якщо заряд позитивний, false - якщо негативний.
   */
  _generateSingleChargeField: function(charge, isPositive) {
    const numLines = 20; // Кількість ліній для одиночного заряду
    const startRadius = 0.25; // Радіус, з якого починаються лінії
    const maxSteps = 100; // Зменшили максимальну кількість кроків для кращої продуктивності
    const stepSize = 0.15; // Збільшили розмір кроку
    const sceneBounds = 8; // Зменшили межі сцени для кращої візуалізації
    
    for (let i = 0; i < numLines; i++) {
      // Визначаємо початкові точки, розподілені по сфері навколо заряду
      // Використовуємо сферичні координати для кращого розподілу
      const phi = Math.acos(1 - 2 * (i + 0.5) / numLines); // Рівномірний розподіл по широті
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5); // "Золотий кут" для розподілу по довготі
      
      const startPoint = new THREE.Vector3(
        charge.position.x + startRadius * Math.sin(phi) * Math.cos(theta),
        charge.position.y + startRadius * Math.sin(phi) * Math.sin(theta),
        charge.position.z + startRadius * Math.cos(phi)
      );
      
      const path = [];
      let currentPoint = startPoint.clone();
      path.push(currentPoint.clone());
      
      for (let step = 0; step < maxSteps; step++) {
        let fieldDirection = currentPoint.clone().sub(charge.position); // Вектор від заряду до поточної точки
        if (fieldDirection.length() < 0.01) break; // Уникнути нульового вектора та надто близьких точок
        
        fieldDirection.normalize(); // Нормалізуємо, щоб отримати тільки напрямок
        if (!isPositive) {
          fieldDirection.negate(); // Якщо заряд негативний, лінії йдуть ДО нього
        }
        
        currentPoint.add(fieldDirection.multiplyScalar(stepSize));
        path.push(currentPoint.clone());
        
        // Зупинка, якщо лінія виходить за межі сцени
        if (Math.abs(currentPoint.x) > sceneBounds ||
            Math.abs(currentPoint.y) > sceneBounds ||
            Math.abs(currentPoint.z) > sceneBounds) {
          break;
        }
      }
      
      if (path.length > 1) { // Створюємо лінію, тільки якщо є більше однієї точки
        this._createFieldLine(path);
      }
    }
  },

  /**
   * Створює об'єкт Three.js Line з масиву точок шляху і додає його до контейнера.
   * @param {Array<THREE.Vector3>} path - Масив точок для лінії.
   */
  _createFieldLine: function(path) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    
    path.forEach(point => {
      positions.push(point.x, point.y, point.z);
    });
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    const material = new THREE.LineBasicMaterial({
      color: 0x00ff00, // Зелений колір
      opacity: 0.7,
      transparent: true,
      linewidth: 2 // Може не підтримуватися на всіх платформах/рендерах
    });
    
    const line = new THREE.Line(geometry, material);
    this.container.object3D.add(line);
    this.fieldLines.push(line); // Зберігаємо посилання на лінію для подальшого видалення
  },

  /**
   * Розраховує сумарний вектор електричного поля в заданій точці.
   * @param {THREE.Vector3} point - Точка, в якій потрібно розрахувати поле.
   * @param {Array<object>} charges - Масив об'єктів зарядів ({position, value}).
   * @returns {THREE.Vector3} - Сумарний вектор електричного поля.
   */
  _calculateElectricField: function(point, charges) {
    const k = 1; // Коефіцієнт Кулона (для простоти можна взяти 1, оскільки ми не моделюємо реальну силу)
    let totalField = new THREE.Vector3(0, 0, 0);
    
    charges.forEach(charge => {
      let r = point.clone().sub(charge.position); // Вектор від заряду до поточної точки
      let distanceSq = r.lengthSq(); // Квадрат відстані
      
      if (distanceSq > 0.01) { // Збільшили мінімальну відстань, щоб уникнути надто сильних полів біля заряду
        const fieldMagnitude = (k * Math.abs(charge.value)) / distanceSq; // Використовуємо абсолютне значення заряду для величини
        let fieldDirection = r.normalize(); // Нормалізований вектор напрямку від заряду
        
        if (charge.value < 0) {
          fieldDirection.negate(); // Якщо заряд негативний, напрямок поля до заряду
        }
        
        totalField.add(fieldDirection.multiplyScalar(fieldMagnitude));
      }
    });
    
    return totalField;
  }
});