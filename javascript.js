document.addEventListener('DOMContentLoaded', () => {
    // Зберігаємо посилання на основні елементи сторінки
    const productAddInput = document.getElementById('product-search-input'); // Поле для вводу назви
    const productAddButton = document.getElementById('product-add-button'); // Кнопка "додати"
    const productListMain = document.querySelector('.product-list-main'); // Основний список товарів
    const unboughtProductList = document.querySelector('.unbought-product-list'); // Список статистики "залишилося"
    const purchasedProductList = document.querySelector('.purchased-product-list'); // Список статистики "куплено"

    // Головний масив, де зберігаються всі товари
    let shoppingList = [];

    // Функція для пошуку HTML-картки товару за ID
    const getProductCardElementById = (id) => {
        return productListMain.querySelector(`.product-card[data-id="${id}"]`);
    };

    // Функція для пошуку HTML-елемента статистики товару за ID
    const getSummaryProductElementById = (id) => {
        // Шукаємо в обох списках статистики
        let element = unboughtProductList.querySelector(`.summary-product[data-id="${id}"]`);
        if (!element) {
            element = purchasedProductList.querySelector(`.summary-product[data-id="${id}"]`);
        }
        return element;
    };

    // Функція, яка "малює" весь інтерфейс на основі даних (використовується лише при першому завантаженні)
    const initialRender = () => {
        // Повністю очищуємо списки перед новим рендером
        productListMain.innerHTML = '';
        unboughtProductList.innerHTML = '';
        purchasedProductList.innerHTML = '';

        // Створюємо копію масиву і сортуємо: куплені зверху
        const sortedList = [...shoppingList].sort((a, b) => a.isPurchased - b.isPurchased);

        // Якщо список порожній, показуємо повідомлення
        if (sortedList.length === 0) {
            displayEmptyMessage();
        } else {
            // Перебираємо кожен товар для відображення
            sortedList.forEach(product => {
                // Створюємо html-картку для основного списку
                const productCard = createProductCard(product);
                productListMain.appendChild(productCard);

                // Створюємо html-елемент для списку статистики
                const summaryProduct = createSummaryProduct(product);
                // Розподіляємо по списках статистики
                if (product.isPurchased) {
                    purchasedProductList.appendChild(summaryProduct);
                } else {
                    unboughtProductList.appendChild(summaryProduct);
                }
            });
        }

        // Зберігаємо поточний стан в localstorage
        saveState();
    };

    // Функція для відображення повідомлення "Список порожній"
    const displayEmptyMessage = () => {
        const emptyMessage = document.createElement('p');
        emptyMessage.id = 'empty-list-message'; // Додаємо ID для легкого видалення
        emptyMessage.textContent = 'Список порожній';
        emptyMessage.style.textAlign = 'center';
        emptyMessage.style.color = 'grey';
        productListMain.appendChild(emptyMessage);
    };

    // Функція для видалення повідомлення "Список порожній"
    const removeEmptyMessage = () => {
        const message = document.getElementById('empty-list-message');
        if (message) {
            message.remove();
        }
    };

    // Функція, що створює html-картку товару для основного списку
    const createProductCard = (product) => {
        // Створюємо головний div-контейнер картки
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.id = product.id; // Прив'язуємо id товару до елемента для ідентифікації

        // Змінна для зручності, щоб не писати product.isPurchased
        const isPurchased = product.isPurchased;

        // Створюємо елемент з назвою товару
        const productNameSpan = document.createElement('span');
        productNameSpan.className = 'product-name';
        productNameSpan.textContent = product.name;
        // Якщо товар куплений, додаємо клас для закреслення
        if (isPurchased) {
            productNameSpan.classList.add('crossed');
        }

        const productInfo = document.createElement('div');
        productInfo.className = 'product-info';
        productInfo.appendChild(productNameSpan);

        // Блок керування кількістю
        let quantityControls;
        // Якщо куплено, просто показуємо кількість
        if (isPurchased) {
            quantityControls = document.createElement('div');
            quantityControls.className = 'quantity-display';
            quantityControls.innerHTML = `<span class="quantity-value">${product.quantity}</span>`;
        } else {
            // Інакше показуємо кнопки +/-
            quantityControls = document.createElement('div');
            quantityControls.className = 'quantity-controls';
            quantityControls.innerHTML = `
                <button type="button" class="minus-quantity-button" data-tooltip="Зменшити кількість" ${product.quantity <= 1 ? 'disabled' : ''}>-</button>
                <span class="quantity-value">${product.quantity}</span>
                <button type="button" class="add-quantity-button" data-tooltip="Збільшити кількість">+</button>
            `;
        }

        // Блок з кнопками дій
        const productControls = document.createElement('div');
        productControls.className = 'product-controls';

        const purchaseStatusButton = document.createElement('button');
        purchaseStatusButton.type = 'button';
        purchaseStatusButton.className = 'purchase-status-button';
        // Текст і підказка для кнопки залежать від статусу
        if (isPurchased) {
            purchaseStatusButton.textContent = 'Не куплено';
            purchaseStatusButton.dataset.tooltip = 'Позначити як не куплений';
        } else {
            purchaseStatusButton.textContent = 'Куплено';
            purchaseStatusButton.dataset.tooltip = 'Позначити як куплений';
        }
        productControls.appendChild(purchaseStatusButton);

        // Кнопку видалення додаємо тільки для некуплених товарів
        if (!isPurchased) {
            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'delete-button';
            deleteButton.dataset.tooltip = 'Видалити товар';
            deleteButton.innerHTML = '×';
            productControls.appendChild(deleteButton);
        }

        // Збираємо всі частини картки в одне ціле
        card.append(productInfo, quantityControls, productControls);
        // Повертаємо готову html-картку
        return card;
    };

    // Функція, що створює html-елемент для бічної панелі статистики
    const createSummaryProduct = (product) => {
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'summary-product';
        summaryDiv.dataset.id = product.id; // Прив'язуємо ID для легкого пошуку

        const nameSpan = document.createElement('span');
        nameSpan.className = 'summary-product-name';
        nameSpan.textContent = product.name;

        const quantitySpan = document.createElement('span');
        quantitySpan.className = 'summary-product-quantity';
        quantitySpan.textContent = product.quantity;

        if (product.isPurchased) {
            nameSpan.classList.add('crossed');
            quantitySpan.classList.add('crossed');
        }

        summaryDiv.append(nameSpan, quantitySpan);
        return summaryDiv;
    };

    // Функція додавання нового товару
    const addProduct = (name) => {
        // Прибираємо зайві пробіли на початку і в кінці
        const trimmedName = name.trim();
        // Перевірка, щоб не додавати порожні товари
        if (trimmedName === '') {
            // Замінюємо alert на консольне попередження, оскільки alert не працює в цьому середовищі
            console.warn('Назва товару не може бути порожньою!');
            return;
        }

        // Перевіряємо, чи такий товар вже існує (за назвою і статусом "не куплено")
        const existingProduct = shoppingList.find(p =>
            p.name.toLowerCase() === trimmedName.toLowerCase() && !p.isPurchased
        );

        if (existingProduct) {
            // Якщо товар існує і він не куплений, збільшуємо кількість
            updateQuantity(existingProduct.id, 1);
        } else {
            // Створюємо об'єкт нового товару
            const newProduct = {
                id: Date.now(), // Унікальний id на основі поточного часу
                name: trimmedName,
                quantity: 1,
                isPurchased: false,
            };

            // Додаємо новий товар в кінець масиву
            shoppingList.push(newProduct);

            // Видаляємо повідомлення "Список порожній", якщо воно є
            removeEmptyMessage();

            // Створюємо та додаємо HTML-елементи для нового товару
            const productCard = createProductCard(newProduct);
            productListMain.appendChild(productCard);

            const summaryProduct = createSummaryProduct(newProduct);
            unboughtProductList.appendChild(summaryProduct);
        }

        // Очищуємо поле вводу
        productAddInput.value = '';
        // Повертаємо курсор в поле вводу для зручності
        productAddInput.focus();

        // Зберігаємо поточний стан в localstorage
        saveState();
    };

    // Функція оновлення кількості товару
    const updateQuantity = (id, change) => {
        // Знаходимо потрібний товар в масиві за його id
        const product = shoppingList.find(p => p.id === id);
        // Перевіряємо, чи товар було знайдено
        if (product) {
            // Обчислюємо нову кількість
            const newQuantity = product.quantity + change;
            // Кількість не може бути менше 1
            if (newQuantity >= 1) {
                // Оновлюємо кількість в об'єкті
                product.quantity = newQuantity;

                // Оновлюємо кількість у DOM елементах
                const productCard = getProductCardElementById(id);
                if (productCard) {
                    const quantityValueSpan = productCard.querySelector('.quantity-value');
                    if (quantityValueSpan) {
                        quantityValueSpan.textContent = product.quantity;
                    }
                    // Оновлюємо стан кнопки "-"
                    const minusButton = productCard.querySelector('.minus-quantity-button');
                    if (minusButton) {
                        minusButton.disabled = product.quantity <= 1;
                    }
                }

                const summaryProduct = getSummaryProductElementById(id);
                if (summaryProduct) {
                    const summaryQuantitySpan = summaryProduct.querySelector('.summary-product-quantity');
                    if (summaryQuantitySpan) {
                        summaryQuantitySpan.textContent = product.quantity;
                    }
                }
                // Зберігаємо поточний стан в localstorage
                saveState();
            }
        }
    };

    // Функція зміни статусу куплено/некуплено
    const togglePurchaseStatus = (id) => {
        const product = shoppingList.find(p => p.id === id);
        if (product) {
            // Інвертуємо статус (true -> false, false -> true)
            product.isPurchased = !product.isPurchased;

            // Отримуємо існуючі DOM-елементи
            const oldProductCard = getProductCardElementById(id);
            const oldSummaryProduct = getSummaryProductElementById(id);

            // Видаляємо старі елементи з DOM
            if (oldProductCard) oldProductCard.remove();
            if (oldSummaryProduct) oldSummaryProduct.remove();

            // Створюємо нові елементи з оновленими даними
            const newProductCard = createProductCard(product);
            const newSummaryProduct = createSummaryProduct(product);

            // Додаємо новий елемент до основного списку з урахуванням сортування "некуплені зверху"
            if (product.isPurchased) {
                // Якщо товар куплений, додаємо його в кінець списку
                productListMain.appendChild(newProductCard);
                purchasedProductList.appendChild(newSummaryProduct);
            } else {
                // Якщо товар став некупленим, додаємо його на початок "некупленої" секції
                let inserted = false;
                for (const child of productListMain.children) {
                    const childProduct = shoppingList.find(p => p.id === Number(child.dataset.id));
                    // Вставляємо перед першим купленим товаром
                    if (childProduct && childProduct.isPurchased) {
                        productListMain.insertBefore(newProductCard, child);
                        inserted = true;
                        break;
                    }
                }
                if (!inserted) {
                    // Якщо немає куплених товарів, або це перший товар, просто додаємо на початок
                    productListMain.prepend(newProductCard);
                }
                unboughtProductList.appendChild(newSummaryProduct);
            }
            // Зберігаємо поточний стан в localstorage
            saveState();
        }
    };

    // Функція видалення товару
    const deleteProduct = (id) => {
        // Створюємо новий масив, в якому немає товару із заданим id
        shoppingList = shoppingList.filter(p => p.id !== id);

        // Видаляємо HTML-елементи з DOM
        const productCard = getProductCardElementById(id);
        if (productCard) {
            productCard.remove();
        }
        const summaryProduct = getSummaryProductElementById(id);
        if (summaryProduct) {
            summaryProduct.remove();
        }

        // Якщо список порожній після видалення, відображаємо повідомлення
        if (shoppingList.length === 0) {
            displayEmptyMessage();
        }
        // Зберігаємо поточний стан в localstorage
        saveState();
    };

    // Функція для редагування назви товару
    const editName = (spanElement, id) => {
        // Зберігаємо поточну назву на випадок скасування
        const currentName = spanElement.textContent;
        // Створюємо поле вводу
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'product-name-edit';
        input.style.cssText = `
            color: #636363;
            border-radius: 3px;
            border: 1px solid #2185D0;
            box-shadow: 0 0 3px 2px rgba(33, 133, 208, 0.5);
            padding: 5px;
            box-sizing: border-box;
            width: 100%;
            font-weight: bold;
        `;

        // Замінюємо текстовий елемент на поле вводу
        spanElement.replaceWith(input);
        // Ставимо курсор в поле вводу
        input.focus();

        // Функція, яка зберігає зміни
        const saveChanges = () => {
            const newName = input.value.trim();
            const product = shoppingList.find(p => p.id === id);
            if (product) {
                // Якщо нове ім'я не порожнє - зберігаємо, інакше - повертаємо старе
                product.name = newName !== '' ? newName : currentName;

                // Оновлюємо назву в DOM
                // Повертаємо span на місце input
                input.replaceWith(spanElement);
                spanElement.textContent = product.name;

                // Оновлюємо назву в елементі статистики
                const summaryProduct = getSummaryProductElementById(id);
                if (summaryProduct) {
                    const summaryNameSpan = summaryProduct.querySelector('.summary-product-name');
                    if (summaryNameSpan) {
                        summaryNameSpan.textContent = product.name;
                    }
                }
                // Зберігаємо поточний стан в localstorage
                saveState();
            }
        };

        // Зберігаємо, коли користувач клікає поза полем вводу
        input.addEventListener('blur', saveChanges, { once: true }); // Використовуємо { once: true }, щоб уникнути подвійного виклику при Enter
        // Зберігаємо також по натисканню enter
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur(); // Зберегти зміни при натисканні enter
            }
        });
    };

    // Зберігає поточний стан списку в локальне сховище браузера
    const saveState = () => {
        // Перетворюємо масив в текст (json) і зберігаємо
        localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
    };

    // Завантажує стан з локального сховища при запуску
    const loadState = () => {
        // Намагаємося отримати збережені дані
        const savedState = localStorage.getItem('shoppingList');
        // Перевіряємо, чи є збережений стан і чи він не є порожнім масивом
        if (savedState && JSON.parse(savedState).length > 0) {
            // Якщо дані є, розшифровуємо їх з json назад в масив
            shoppingList = JSON.parse(savedState);
        } else {
            // Якщо даних немає або список порожній, створюємо початковий список
            shoppingList = [
                { id: 1, name: 'Помідори', quantity: 2, isPurchased: true },
                { id: 2, name: 'Печиво', quantity: 1, isPurchased: false },
                { id: 3, name: 'Сир', quantity: 1, isPurchased: false },
            ];
        }
    };

    // Додавання товару по кліку на кнопку
    productAddButton.addEventListener('click', () => {
        addProduct(productAddInput.value);
    });

    // Додавання товару по натисканню enter в полі вводу
    productAddInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            addProduct(productAddInput.value);
        }
    });

    // Один обробник кліків для всього списку товарів (делегування)
    productListMain.addEventListener('click', (e) => {
        // Отримуємо елемент, на якому відбувся клік
        const target = e.target;
        // Знаходимо батьківську картку товару для цього елемента
        const card = target.closest('.product-card');
        // Якщо клік був не всередині картки, ігноруємо його
        if (!card) return;

        // Отримуємо id товару з data-атрибута картки
        const id = Number(card.dataset.id);

        // Кнопка +
        if (target.closest('.add-quantity-button')) {
            updateQuantity(id, 1);
        }
        // Кнопка -
        else if (target.closest('.minus-quantity-button')) {
            updateQuantity(id, -1);
        }
        // Кнопка куплено/не куплено
        else if (target.closest('.purchase-status-button')) {
            togglePurchaseStatus(id);
        }
        // Кнопка видалити
        else if (target.closest('.delete-button')) {
            deleteProduct(id);
        }
        // Клік на назву товару для редагування
        else if (target.matches('.product-name') && !target.classList.contains('crossed')) {
            editName(target, id);
        }
    });

    // Спочатку завантажуємо дані
    loadState();
    // Потім на основі цих даних малюємо інтерфейс
    initialRender(); // Викликаємо початковий рендер лише один раз
});
