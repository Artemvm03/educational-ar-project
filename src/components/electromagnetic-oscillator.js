// electromagnetic-oscillator.js
AFRAME.registerComponent('electromagnetic-oscillator', {
    schema: {
        amplitude: {type: 'number', default: 0.5}, // Амплитуда коливань електрона по осі X
        frequency: {type: 'number', default: 1},   // Частота коливань (1 Гц)
        waveSpeed: {type: 'number', default: 2},   // Швидкість поширення хвилі (для візуалізації)
        maxWaveDistance: {type: 'number', default: 4}, // Максимальна відстань поширення хвилі
        numWaveSegments: {type: 'number', default: 10}, // Кількість сегментів хвилі для візуалізації
        fieldLineLength: {type: 'number', default: 0.5} // Довжина ліній поля
    },

    init: function () {
        this.electron = this.el;
        this.scene = this.el.sceneEl;
        this.time = 0; // Для відстеження часу
        this.electronInitialY = this.electron.object3D.position.y; // Зберігаємо початкову Y-позицію

        // Створюємо контейнери для ліній електричного та магнітного полів
        this.electricFieldContainer = document.createElement('a-entity');
        this.electricFieldContainer.setAttribute('id', 'electric-field-container');
        this.scene.appendChild(this.electricFieldContainer);

        this.magneticFieldContainer = document.createElement('a-entity');
        this.magneticFieldContainer.setAttribute('id', 'magnetic-field-container');
        this.scene.appendChild(this.magneticFieldContainer);

        console.log('Electromagnetic Oscillator component initialized.');
    },

    tick: function (time, deltaTime) {
        if (isNaN(deltaTime)) {
            // Іноді deltaTime може бути NaN на першому тіку, ігноруємо
            return;
        }
        this.time += deltaTime / 1000; // Час в секундах

        // 1. Анімуємо коливання електрона по осі X
        const xPos = this.data.amplitude * Math.sin(2 * Math.PI * this.data.frequency * this.time);
        this.electron.object3D.position.set(xPos, this.electronInitialY, 0);

        // 2. Оновлюємо візуалізацію електромагнітної хвилі
        this._updateElectromagneticWave();
    },

    _updateElectromagneticWave: function () {
        // Очищаємо попередні лінії
        while (this.electricFieldContainer.firstChild) {
            this.electricFieldContainer.removeChild(this.electricFieldContainer.firstChild);
        }
        while (this.magneticFieldContainer.firstChild) {
            this.magneticFieldContainer.removeChild(this.magneticFieldContainer.firstChild);
        }

        const electronPos = this.electron.object3D.position.clone();
        const waveSpeed = this.data.waveSpeed;
        const maxDist = this.data.maxWaveDistance;
        const numSegments = this.data.numWaveSegments;
        const fieldLen = this.data.fieldLineLength;

        for (let i = 0; i <= numSegments; i++) {
            const zDistance = (i / numSegments) * maxDist; // Відстань від джерела по осі Z
            
            // Затримка по часу для поширення хвилі (фаза)
            const delayedTime = this.time - zDistance / waveSpeed;

            if (delayedTime < 0) continue; // Хвиля ще не дійшла до цієї точки

            // Електричне поле (E) - коливається по осі X, поширюється по Z
            // Пропорційно похідній від sin (тобто cos), зі зміщенням фази
            // Примітка: Це дуже спрощена модель для візуалізації, не точний фізичний розрахунок
            const electricFieldMagnitude = Math.cos(2 * Math.PI * this.data.frequency * delayedTime);
            
            // Напрямок електричного поля (по осі X)
            const eFieldStart = new THREE.Vector3(electronPos.x + electricFieldMagnitude * fieldLen / 2, electronPos.y, electronPos.z - zDistance);
            const eFieldEnd = new THREE.Vector3(electronPos.x - electricFieldMagnitude * fieldLen / 2, electronPos.y, electronPos.z - zDistance);

            this._createLine(this.electricFieldContainer, eFieldStart, eFieldEnd, 'red');

            // Магнітне поле (B) - перпендикулярне до E і напрямку поширення (Z)
            // Коливається по осі Y, також зі зміщенням фази
            // Знову ж таки, спрощення: магнітне поле буде 90 градусів поза фазою з електричним
            // І зазвичай його амплітуда пропорційна амплітуді E
            const magneticFieldMagnitude = Math.sin(2 * Math.PI * this.data.frequency * delayedTime);
            
            // Напрямок магнітного поля (по осі Y)
            const bFieldStart = new THREE.Vector3(electronPos.x, electronPos.y + magneticFieldMagnitude * fieldLen / 2, electronPos.z - zDistance);
            const bFieldEnd = new THREE.Vector3(electronPos.x, electronPos.y - magneticFieldMagnitude * fieldLen / 2, electronPos.z - zDistance);

            this._createLine(this.magneticFieldContainer, bFieldStart, bFieldEnd, 'blue');
        }
    },

    _createLine: function (container, startPoint, endPoint, color) {
        const lineEntity = document.createElement('a-entity');
        lineEntity.setAttribute('line', `start: ${startPoint.x} ${startPoint.y} ${startPoint.z}; end: ${endPoint.x} ${endPoint.y} ${endPoint.z}; color: ${color}`);
        container.appendChild(lineEntity);
    }
});