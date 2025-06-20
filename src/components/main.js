// src/components/main.js
document.addEventListener('DOMContentLoaded', () => {
  const sceneEl = document.querySelector('a-scene');
  const positiveChargeCheckbox = document.getElementById('positiveChargeCheckbox');
  const negativeChargeCheckbox = document.getElementById('negativeChargeCheckbox');
  let positiveChargeEntity = null;
  let negativeChargeEntity = null;

  // Зберігаємо останні відомі позиції зарядів
  let lastPositiveChargePosition = { x: 1, y: 0.5, z: -1 };
  let lastNegativeChargePosition = { x: -1, y: 0.5, z: -1 };

  /**
   * Функція для створення позитивного заряду
   */
  function createPositiveCharge() {
    if (!positiveChargeEntity) {
      positiveChargeEntity = document.createElement('a-sphere');
      positiveChargeEntity.setAttribute('id', 'positiveCharge');
      // Використовуємо останню відому позицію
      positiveChargeEntity.setAttribute('position', `${lastPositiveChargePosition.x} ${lastPositiveChargePosition.y} ${lastPositiveChargePosition.z}`);
      // Налаштування сфери
      positiveChargeEntity.setAttribute('radius', '0.2');
      positiveChargeEntity.setAttribute('color', 'red');
      positiveChargeEntity.setAttribute('data-charge-value', '1');
      positiveChargeEntity.setAttribute('interactive-charge', '');

      // Додаємо текст для позначки заряду
      const textEl = document.createElement('a-text');
      textEl.setAttribute('value', '+Q');
      textEl.setAttribute('align', 'center');
      textEl.setAttribute('color', 'white');
      textEl.setAttribute('position', '0 0 0.25');
      textEl.setAttribute('width', '4');
      positiveChargeEntity.appendChild(textEl);

      // Додаємо до сцени
      sceneEl.appendChild(positiveChargeEntity);
      
      // Даємо час для ініціалізації, потім повідомляємо про зміну зарядів
      setTimeout(() => {
        sceneEl.emit('charges-changed');
        console.log('Positive charge created at:', lastPositiveChargePosition);
      }, 50);
    }
  }

  /**
   * Функція для створення негативного заряду
   */
  function createNegativeCharge() {
    if (!negativeChargeEntity) {
      negativeChargeEntity = document.createElement('a-sphere');
      negativeChargeEntity.setAttribute('id', 'negativeCharge');
      // Використовуємо останню відому позицію
      negativeChargeEntity.setAttribute('position', `${lastNegativeChargePosition.x} ${lastNegativeChargePosition.y} ${lastNegativeChargePosition.z}`);
      // Налаштування сфери
      negativeChargeEntity.setAttribute('radius', '0.2');
      negativeChargeEntity.setAttribute('color', 'blue');
      negativeChargeEntity.setAttribute('data-charge-value', '-1');
      negativeChargeEntity.setAttribute('interactive-charge', '');

      // Додаємо текст для позначки заряду
      const textEl = document.createElement('a-text');
      textEl.setAttribute('value', '-Q');
      textEl.setAttribute('align', 'center');
      textEl.setAttribute('color', 'white');
      textEl.setAttribute('position', '0 0 0.25');
      textEl.setAttribute('width', '4');
      negativeChargeEntity.appendChild(textEl);

      // Додаємо до сцени
      sceneEl.appendChild(negativeChargeEntity);
      
      // Даємо час для ініціалізації, потім повідомляємо про зміну зарядів
      setTimeout(() => {
        sceneEl.emit('charges-changed');
        console.log('Negative charge created at:', lastNegativeChargePosition);
      }, 50);
    }
  }

  /**
   * Функція для видалення заряду
   * @param {Element} chargeEntity - Сутність заряду для видалення
   */
  function removeCharge(chargeEntity) {
    if (chargeEntity && chargeEntity.parentNode) {
      // Зберігаємо останню позицію перед видаленням
      const pos = chargeEntity.object3D.position;
      if (chargeEntity.id === 'positiveCharge') {
        lastPositiveChargePosition = { x: pos.x, y: pos.y, z: pos.z };
        console.log('Positive charge removed, position saved:', lastPositiveChargePosition);
      } else if (chargeEntity.id === 'negativeCharge') {
        lastNegativeChargePosition = { x: pos.x, y: pos.y, z: pos.z };
        console.log('Negative charge removed, position saved:', lastNegativeChargePosition);
      }

      // Видаляємо з DOM
      chargeEntity.parentNode.removeChild(chargeEntity);
      
      // Оновлюємо поле після видалення з невеликою затримкою
      setTimeout(() => {
        sceneEl.emit('charges-changed');
      }, 50);
    }
  }

  /**
   * Обробник зміни чекбокса позитивного заряду
   */
  positiveChargeCheckbox.addEventListener('change', function() {
    if (this.checked) {
      createPositiveCharge();
    } else {
      removeCharge(positiveChargeEntity);
      positiveChargeEntity = null;
    }
  });

  /**
   * Обробник зміни чекбокса негативного заряду
   */
  negativeChargeCheckbox.addEventListener('change', function() {
    if (this.checked) {
      createNegativeCharge();
    } else {
      removeCharge(negativeChargeEntity);
      negativeChargeEntity = null;
    }
  });

  /**
   * Ініціалізація зарядів на основі початкового стану чекбоксів
   */
  function initializeCharges() {
    if (positiveChargeCheckbox.checked) {
      createPositiveCharge();
    }
    if (negativeChargeCheckbox.checked) {
      createNegativeCharge();
    }
  }

  /**
   * Функція для отримання всіх активних зарядів
   * @returns {Array} Масив об'єктів з інформацією про заряди
   */
  function getActiveCharges() {
    const charges = [];
    
    if (positiveChargeEntity) {
      const pos = positiveChargeEntity.object3D.position;
      charges.push({
        id: 'positiveCharge',
        value: 1,
        position: { x: pos.x, y: pos.y, z: pos.z },
        element: positiveChargeEntity
      });
    }
    
    if (negativeChargeEntity) {
      const pos = negativeChargeEntity.object3D.position;
      charges.push({
        id: 'negativeCharge',
        value: -1,
        position: { x: pos.x, y: pos.y, z: pos.z },
        element: negativeChargeEntity
      });
    }
    
    return charges;
  }

  /**
   * Функція для оновлення позицій зарядів
   */
  function updateChargePositions() {
    if (positiveChargeEntity) {
      const pos = positiveChargeEntity.object3D.position;
      lastPositiveChargePosition = { x: pos.x, y: pos.y, z: pos.z };
    }
    
    if (negativeChargeEntity) {
      const pos = negativeChargeEntity.object3D.position;
      lastNegativeChargePosition = { x: pos.x, y: pos.y, z: pos.z };
    }
  }

  // Глобальні функції для доступу з інших компонентів
  window.chargeManager = {
    getActiveCharges: getActiveCharges,
    updateChargePositions: updateChargePositions,
    createPositiveCharge: createPositiveCharge,
    createNegativeCharge: createNegativeCharge,
    removeCharge: removeCharge
  };

  // Слухач для оновлення позицій при переміщенні зарядів
  sceneEl.addEventListener('charge-moved', updateChargePositions);

  // Ініціалізуємо заряди при завантаженні
  initializeCharges();

  console.log('Charge manager initialized');
});