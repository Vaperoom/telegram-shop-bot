let tg = window.Telegram.WebApp;
tg.expand();

// Ініціалізація Telegram WebApp
tg.MainButton.textColor = '#FFFFFF';
tg.MainButton.color = '#8774e1';

// Завантаження товарів з GitHub
async function getProducts() {
    try {
        console.log('Початок завантаження товарів...');
        const timestamp = new Date().getTime();
        const response = await fetch(`https://raw.githubusercontent.com/gademoffshit/telegram-shop-bot/main/products.json?t=${timestamp}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Товари завантажені успішно:', data.products);
        return data.products || [];
    } catch (error) {
        console.error('Помилка завантаження товарів:', error);
        return [];
    }
}

// Отримуємо актуальний список товарів
let products = [];
async function loadProducts() {
    try {
        products = await getProducts();
        console.log('Товари завантажені в loadProducts:', products);
        filterAndDisplayProducts();
    } catch (error) {
        console.error('Помилка в loadProducts:', error);
    }
}

// Оновлюємо товари кожні 30 секунд
setInterval(loadProducts, 30000);

// Ініціалізація при завантаженні сторінки
window.addEventListener('load', async () => {
    console.log('Сторінка завантажена, ініціалізація...');
    await loadProducts();
    updateCartCounter();
});

// DOM елементи
const productsGrid = document.querySelector('.products-grid');
const categoryButtons = document.querySelectorAll('.category-btn');
const searchInput = document.querySelector('.search-input');
const sortSelect = document.querySelector('.sort-select');
const cartCounter = document.querySelector('.cart-counter');
const homeButton = document.getElementById('homeButton');
const cartButton = document.getElementById('cartButton');
const filterBtn = document.querySelector('.filter-btn');

// Стан програми
let cart = [];
let currentCategory = 'Одноразки'; // Змінюємо початкову категорію
let currentFilter = '';
let currentSort = 'default';

// Обробники кнопок
homeButton.addEventListener('click', () => {
    currentCategory = 'Одноразки'; // Змінюємо категорію за замовчуванням
    searchInput.value = '';
    currentFilter = '';
    sortSelect.value = 'default';
    currentSort = 'default';
    
    categoryButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === 'Одноразки') { // Змінюємо активну категорію
            btn.classList.add('active');
        }
    });
    
    filterAndDisplayProducts();
});

cartButton.addEventListener('click', showCart);

// Обробники категорій
categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Отримуємо назву категорії з тексту кнопки
        currentCategory = button.querySelector('span').textContent;
        console.log('Вибрана категорія:', currentCategory);
        filterAndDisplayProducts();
    });
});

// Пошук
searchInput.addEventListener('input', (e) => {
    currentFilter = e.target.value.toLowerCase();
    filterAndDisplayProducts();
});

// Сортування
sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    filterAndDisplayProducts();
});

// Обробник кліку по категорії
function handleCategoryClick(category) {
    currentCategory = category;
    showHome();
    filterAndDisplayProducts();
    showNotification(`Обрано категорію: ${category}`);
}

// Функція для фільтрації та відображення товарів
function filterAndDisplayProducts() {
    let filteredProducts = [...products];
    console.log('Початкові товари:', products);
    console.log('Поточна категорія:', currentCategory);

    // Фільтрація по категорії
    if (currentCategory && currentCategory !== 'Все') {
        filteredProducts = filteredProducts.filter(product => {
            console.log('Перевірка товару:', product.name, 'Категорія:', product.category);
            return product.category && product.category === currentCategory;
        });
    }

    // Фільтрація по пошуку
    if (currentFilter) {
        filteredProducts = filteredProducts.filter(product =>
            product.name.toLowerCase().includes(currentFilter.toLowerCase())
        );
    }

    // Сортування
    if (currentSort) {
        filteredProducts.sort((a, b) => {
            switch(currentSort) {
                case 'price_asc':
                    return a.price - b.price;
                case 'price_desc':
                    return b.price - a.price;
                case 'popular':
                    return (b.popularity || 0) - (a.popularity || 0);
                default:
                    return 0;
            }
        });
    }

    console.log('Відфільтровані товари:', filteredProducts);
    displayProducts(filteredProducts);
}

// Обробник для кнопки "Показати"
function handleShowProducts() {
    showHome();
    filterAndDisplayProducts();
}

// Відображення товарів
function displayProducts(products) {
    console.log('Відображення товарів:', products);
    const productsGrid = document.querySelector('.products-grid');
    if (!productsGrid) {
        console.error('Products grid not found');
        return;
    }
    
    productsGrid.innerHTML = '';
    
    if (!products || products.length === 0) {
        const noProductsElement = document.createElement('div');
        noProductsElement.className = 'no-products';
        noProductsElement.textContent = 'Нічого не знайдено';
        productsGrid.appendChild(noProductsElement);
        return;
    }
    
    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product-card';
        productElement.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-price">${product.price} zł</p>
            </div>
        `;
        
        productElement.addEventListener('click', () => {
            showProductDetails(product);
        });
        
        productsGrid.appendChild(productElement);
    });
}

// Показ корзини
function showCart() {
    hideAllContainers();
    
    if (cart.length === 0) {
        const cartContainer = document.createElement('div');
        cartContainer.className = 'cart-container';
        cartContainer.innerHTML = `
            <div class="cart-header">
                <button class="back-button">
                    <i class="material-icons">arrow_back</i>
                </button>
                <h1>VAPE ROOM | ELFBAR WROCLAW</h1>
            </div>
            <div class="cart-empty">
                <p>Ваша корзина пуста</p>
            </div>
        `;
        
        const backButton = cartContainer.querySelector('.back-button');
        if (backButton) {
            backButton.addEventListener('click', () => {
                showHome();
            });
        }
        
        document.body.appendChild(cartContainer);
        return;
    }
    
    const cartContainer = document.createElement('div');
    cartContainer.className = 'cart-container';
    
    let cartHTML = `
        <div class="cart-header">
            <button class="back-button">
                <i class="material-icons">arrow_back</i>
            </button>
            <h1>VAPE ROOM | ELFBAR WROCLAW</h1>
        </div>
        <div class="cart-items">
    `;
    
    let total = 0;
    cart.forEach(item => {
        total += item.price * item.quantity;
        cartHTML += `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-info">
                    <h3 class="cart-item-title">${item.name}</h3>
                    <p class="cart-item-price">Роздрібна ціна ${item.price}zł</p>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn minus" data-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn plus" data-id="${item.id}">+</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    cartHTML += `
        </div>
        <div class="cart-total">
            <div class="total-row">
                <span>Сумма ${total.toFixed(2)} zł</span>
            </div>
        </div>
        <button class="checkout-button" onclick="checkout()">
            ОФОРМИТИ ЗАМОВЛЕННЯ
        </button>
    `;
    
    cartContainer.innerHTML = cartHTML;
    
    // Добавляем обробники для кнопок кількості
    cartContainer.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id, 10);
            console.log('Product ID:', id);
            const isPlus = e.target.classList.contains('plus');
            const product = cart.find(item => item.id === id);
            console.log('Product found:', product);
            if (product) {
                if (isPlus) {
                    product.quantity += 1;
                } else {
                    product.quantity -= 1;
                    if (product.quantity <= 0) {
                        const index = cart.indexOf(product);
                        cart.splice(index, 1);
                    }
                }
                console.log('Updated quantity:', product.quantity);
                updateCartCounter();
                showCart(); // Обновляем відображення корзини
            }
        });
    });
    
    // Обробник для кнопки "Назад"
    const backButton = cartContainer.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            showHome();
        });
    }
    
    document.body.appendChild(cartContainer);
}

// Додавання в корзину
function addToCart(product) {
    if (!product.in_stock) {
        alert('Извините, этот товар сейчас недоступен.');
        return;
    }
    
    const existingProduct = cart.find(item => item.id === product.id);
    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        cart.push({...product, quantity: 1});
    }
    saveCart();
    updateCartCounter();
    showNotification('Товар додано в корзину');
    showCart();
}

// Обновлення лічильника корзини
function updateCartCounter() {
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    cartCounter.textContent = totalItems;
    if (totalItems > 0) {
        cartCounter.style.display = 'flex';
    } else {
        cartCounter.style.display = 'none';
    }
    const cartBadge = document.querySelector('.cart-badge');
    if (cartBadge) {
        cartBadge.textContent = totalItems;
        cartBadge.style.display = totalItems > 0 ? 'block' : 'none';
    }
}

// Оформлення замовлення
function checkout() {
    hideAllContainers();
    
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    const checkoutContainer = document.createElement('div');
    checkoutContainer.className = 'checkout-container';
    
    checkoutContainer.innerHTML = `
        <div class="checkout-header">
            <button class="back-button">
                <i class="material-icons">arrow_back</i>
            </button>
            <h1>Оформлення замовлення</h1>
        </div>
        
        <h1>Оформлення замовлення</h1>
        
        <div class="form-section">
            <div class="section-header">
                <div class="section-number">1</div>
                <h2>Ваші контактні дані</h2>
            </div>
            
            <div class="form-group">
                <label for="name">Ім'я</label>
                <input type="text" id="name" placeholder="Введіть ваше ім'я">
                <span class="error-message" id="nameError"></span>
            </div>
            
            <div class="form-group">
                <label for="surname">Прізвище</label>
                <input type="text" id="surname" placeholder="Введіть ваше прізвище">
                <span class="error-message" id="surnameError"></span>
            </div>
            
            <div class="form-group">
                <label for="phone">Номер телефону</label>
                <input type="tel" id="phone" placeholder="+48XXXXXXXXX">
                <span class="error-message" id="phoneError"></span>
            </div>
            
            <div class="form-group">
                <label for="email">Електронна пошта</label>
                <input type="email" id="email" placeholder="example@email.com">
                <span class="error-message" id="emailError"></span>
            </div>
            
            <div class="form-group">
                <label for="telegram">Ваш нік у телеграмі</label>
                <input type="text" id="telegram" placeholder="@username">
                <span class="helper-text">Щоб у разі чого менеджер міг зв'язатися</span>
                <span class="error-message" id="telegramError"></span>
            </div>
        </div>
        
        <div class="form-section">
            <div class="section-header">
                <div class="section-number">2</div>
                <h2>Доставка</h2>
            </div>
            
            <div class="delivery-options">
                <label class="radio-option">
                    <input type="radio" name="delivery" value="inpost_parcel" checked>
                    <span>InPost пачкомат</span>
                </label>
                
                <label class="radio-option">
                    <input type="radio" name="delivery" value="inpost_courier">
                    <span>InPost кур'єр</span>
                </label>
                
                <label class="radio-option">
                    <input type="radio" name="delivery" value="international">
                    <span>Доставка за кордон</span>
                </label>
            </div>
            
            <div class="form-group">
                <label for="address">Адреса доставки</label>
                <input type="text" id="address" placeholder="Введіть адресу доставки">
                <span class="error-message" id="addressError"></span>
            </div>
            
            <div class="form-group">
                <label for="promo">Промокод</label>
                <input type="text" id="promo" placeholder="Введіть промокод">
            </div>
        </div>
        
        <div class="form-section">
            <div class="section-header">
                <div class="section-number">3</div>
                <h2>Ітогова сума</h2>
            </div>
            <p class="total-amount">${total.toFixed(2)} zł</p>
        </div>
        
        <button class="checkout-form-button" onclick="validateAndProceed()">
            ОФОРМИТИ ЗАМОВЛЕННЯ
        </button>
    `;
    
    // Обробники кнопок
    const backButton = checkoutContainer.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            showCart();
        });
    }
    
    const homeButton = checkoutContainer.querySelector('.home-button');
    if (homeButton) {
        homeButton.addEventListener('click', (e) => {
            e.preventDefault();
            showHome();
        });
    }
    
    document.body.appendChild(checkoutContainer);
}

let savedUserDetails = {};

function validateAndProceed() {
    const inputs = document.querySelectorAll('.checkout-container input');
    let isValid = true;

    inputs.forEach(input => {
        let valid = true;
        if (input.id === 'name' || input.id === 'surname') {
            valid = /^[A-Za-z]+$/.test(input.value);
        } else if (input.id === 'phone') {
            valid = /^\+48\d{0,9}$/.test(input.value);
        } else if (input.id === 'email') {
            valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
        } else if (input.id === 'telegram' || input.id === 'address') {
            valid = input.value.trim() !== '';
        }

        if (!valid) {
            input.classList.add('invalid');
            isValid = false;
        } else {
            input.classList.remove('invalid');
        }
    });

    if (isValid) {
        savedUserDetails = getUserDetails(); // Save user details
        sendOrderDetailsToAdmin();
        sendOrderConfirmationToUser(getOrderData());
    } else {
        showNotification('Будь ласка, заповніть усі обов’язкові поля правильно.');
    }
}

function getUserDetails() {
    const user = tg.initDataUnsafe.user;
    const userDetails = {
        name: document.querySelector('#name').value,
        surname: document.querySelector('#surname').value,
        phone: document.querySelector('#phone').value,
        email: document.querySelector('#email').value,
        telegram: user ? user.username : '',
        address: document.querySelector('#address').value
    };

    console.log('Отримані дані користувача:', userDetails);

    // Перевіряємо, чи заповнені всі поля
    for (const [key, value] of Object.entries(userDetails)) {
        if (!value && key !== 'telegram') { // telegram може бути пустим
            console.error(`Відсутнє значення для ${key}`);
            return null;
        }
    }

    return userDetails;
}

function getOrderData() {
    const userDetails = getUserDetails();
    if (!userDetails) {
        console.error('Дані користувача не знайдені');
        return null;
    }

    return {
        name: userDetails.name,
        surname: userDetails.surname,
        phone: userDetails.phone,
        email: userDetails.email,
        telegram: userDetails.telegram,
        address: userDetails.address,
        items: cart.map(item => ({ name: item.name, quantity: item.quantity })),
        total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    };
}

function sendOrderDetailsToAdmin() {
    const orderData = getOrderData();
    if (!orderData) {
        console.error('Дані замовлення не знайдені');
        showNotification('Виникла помилка при відправці замовлення. Будь ласка, спробуйте ще раз.');
        return;
    }

    const adminChatId = '7356161144';
    const botToken = '5037002755:AAH0SdUBgoGG27O3Gm6BS31cOKE286e3Oqo';
    
    // Формуємо повідомлення: читаємий текст без JSON тегів
    const humanReadableText = `🆕 Нове замовлення!\n\n` +
        `📋 Деталі замовлення:\n` +
        `👤 Ім'я: ${orderData.name}\n` +
        `👥 Прізвище: ${orderData.surname}\n` +
        `📞 Телефон: ${orderData.phone}\n` +
        `📧 Email: ${orderData.email}\n` +
        `📱 Telegram: @${orderData.telegram}\n` +
        `📍 Адреса доставки: ${orderData.address}\n\n` +
        `🛍️ Товари:\n${orderData.items.map(item => 
            `• ${item.name} - ${item.quantity}шт x ${item.price} zł`
        ).join('\n')}\n\n` +
        `🚚 Вартість доставки: ${orderData.deliveryPrice} zł\n` +
        `💰 Усього: ${orderData.total} zł`;
    
    const messageText = `${humanReadableText}`;
    
    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chat_id: adminChatId,
            text: messageText,
            parse_mode: 'HTML'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.ok) {
            console.log('Дані замовлення відправлені успішно');
            // Відправляємо підтвердження замовлення користувачеві
            sendOrderConfirmationToUser(orderData);
        } else {
            console.error('Помилка відправки даних замовлення:', data);
            showNotification('Виникла помилка при відправці замовлення. Будь ласка, спробуйте ще раз.');
        }
    })
    .catch(error => {
        console.error('Помилка відправки даних замовлення:', error);
        showNotification('Виникла помилка при відправці замовлення. Будь ласка, спробуйте ще раз.');
    });
}

function sendOrderConfirmationToUser(orderData) {
    if (!orderData) {
        console.error('Дані замовлення не знайдені для підтвердження користувача');
        return;
    }

    const botToken = '5037002755:AAH0SdUBgoGG27O3Gm6BS31cOKE286e3Oqo';
    const userId = tg.initDataUnsafe?.user?.id;

    if (!userId) {
        console.error('ID користувача не знайдений');
        return;
    }

    const humanReadableText = `Ваше замовлення:\n\n` +
        `📋 Деталі замовлення:\n` +
        `👤 Ім'я: ${orderData.name}\n` +
        `👥 Прізвище: ${orderData.surname}\n` +
        `📞 Телефон: ${orderData.phone}\n` +
        `📧 Email: ${orderData.email}\n` +
        `📱 Telegram: @${orderData.telegram}\n` +
        `📍 Адреса доставки: ${orderData.address}\n\n` +
        `🛍️ Товари:\n${orderData.items.map(item => 
            `• ${item.name} - ${item.quantity}шт x ${item.price} zł`
        ).join('\n')}\n\n` +
        `🚚 Вартість доставки: ${orderData.deliveryPrice} zł\n` +
        `💰 Усього: ${orderData.total} zł`;

    const messageText = `${humanReadableText}`;

    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chat_id: userId,
            text: messageText,
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: "✅ Підтвердити замовлення ✅",
                        callback_data: "confirm_order"
                    }],
                    [{
                        text: "До головного меню",
                        callback_data: "back_to_main"
                    }]
                ]
            }
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.ok) {
            console.log('Підтвердження замовлення відправлено успішно');
            // Відправляємо підтвердження замовлення адміну
            sendOrderDetailsToAdmin();
            Telegram.WebApp.close();
        } else {
            console.error('Помилка відправки підтвердження замовлення:', data);
            showNotification('Виникла помилка при відправці підтвердження. Будь ласка, спробуйте ще раз.');
        }
    })
    .catch(error => {
        console.error('Помилка відправки підтвердження замовлення:', error);
        showNotification('Виникла помилка при відправці підтвердження. Будь ласка, спробуйте ще раз.');
    });
}

// Функція для показу повідомлень
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 2000);
}

// Функція для відображення деталей продукту
function showProductDetails(product) {
    hideAllContainers();
    
    const detailsContainer = document.createElement('div');
    detailsContainer.className = 'product-details-container';
    detailsContainer.innerHTML = `
        <div class="product-details-header">
            <button class="back-button" id="detailsBackButton">
                <i class="material-icons">arrow_back</i>
            </button>
            <h2>Деталі</h2>
        </div>
        <div class="product-details">
            <h1>${product.price} zł</h1>
            <h3>${product.name}</h3>
            <div class="availability ${product.inStock ? 'in-stock' : 'out-of-stock'}">
                ${product.inStock ? 'В наявності' : 'Немає у наявності'}
            </div>
            <div class="product-characteristics">
                <h4>Характеристики</h4>
                <ul>
                    <li>Об'єм: ${product.volume || 'N/A'}</li>
                    <li>Міцність: ${product.strength || 'N/A'}</li>
                    <li>Виробник: ${product.manufacturer || 'N/A'}</li>
                </ul>
            </div>
            <div class="product-description">
                <h4>Опис</h4>
                <p>${product.description || 'Опис недоступний'}</p>
            </div>
            <button class="add-to-cart-button">ДОДАТИ В КОРЗИНУ</button>
        </div>
    `;
    
    document.body.appendChild(detailsContainer);
    
    const backButton = document.getElementById('detailsBackButton');
    if (backButton) {
        backButton.onclick = () => {
            detailsContainer.remove();
            showHome();
        };
    }
    
    const addToCartButton = detailsContainer.querySelector('.add-to-cart-button');
    if (addToCartButton) {
        addToCartButton.onclick = () => {
            addToCart(product);
            showNotification('Товар додано в корзину');
        };
    }
}

// Обробник для категорій в каталозі
function handleCategoryClick(category) {
    currentCategory = category;
    hideAllContainers();
    document.querySelector('.app').style.display = 'block';
    filterAndDisplayProducts();
}

// Обновлюємо функцію showCatalog
function showCatalog() {
    hideAllContainers();
    
    let catalogContainer = document.querySelector('.catalog-container');
    if (!catalogContainer) {
        catalogContainer = document.createElement('div');
        catalogContainer.className = 'catalog-container';
        catalogContainer.innerHTML = `
            <div class="catalog-header">
                <button class="back-button">
                    <i class="material-icons">arrow_back</i>
                </button>
                <h2>Фільтр</h2>
                <button class="clear-button">Очистити</button>
            </div>
            <div class="filter-count">: 0</div>
            <div class="catalog-section">
                <h3>Вибір категорії</h3>
                <div class="category-list">
                    <div class="category-item" data-category="Поди">
                        <span>Поди</span>
                        <i class="material-icons">chevron_right</i>
                    </div>
                    <div class="category-item" data-category="Рідина">
                        <span>Рідина</span>
                        <i class="material-icons">chevron_right</i>
                    </div>
                    <div class="category-item" data-category="Одноразки">
                        <span>Одноразки</span>
                        <i class="material-icons">chevron_right</i>
                    </div>
                    <div class="category-item" data-category="Картриджи">
                        <span>Картриджи</span>
                        <i class="material-icons">chevron_right</i>
                    </div>
                    <div class="category-item" data-category="Box">
                        <span>Box</span>
                        <i class="material-icons">chevron_right</i>

                    </div>
                </div>
            </div>
            <button class="show-products-button">
                Показати
                <span class="products-count">Знайдено товарів: 130</span>
            </button>
        `;
        
        // Добавляем обробники для категорій
        catalogContainer.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', () => {
                handleCategoryClick(item.dataset.category);
            });
        });

        // Обробник для кнопки "Назад"
        const backButton = catalogContainer.querySelector('.back-button');
        if (backButton) {
            backButton.addEventListener('click', () => {
                showHome();
            });
        }

        // Обробник для кнопки "Очистити"
        const clearButton = catalogContainer.querySelector('.clear-button');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                currentCategory = null;
                showNotification('Фільтри очищені');
                showHome();
            });
        }

        // Обробник для кнопки "Показати"
        const showButton = catalogContainer.querySelector('.show-products-button');
        if (showButton) {
            showButton.addEventListener('click', handleShowProducts);
        }
        
        document.body.appendChild(catalogContainer);
    }
    
    catalogContainer.style.display = 'block';
}

function handleCategoryClick(category) {
    hideAllContainers();
    
    const subcategories = {
        'Одноразки': [
            'Elfbar 2000',
            'Elfbar ri3000',
            'Elfbar4000',
            'Hqd click6000',
            'Hqd7000',
            'Vozol12000',
            'Hqd15000',
            'Elfbar bc18000',
            'Vozol Star20000',
            'Vozol Vista20000',
            'Hqd20000',
            'Elfbar gh23000',
            'Elfbar raya 25000',
            'Hqd Everest 25000',
            'Elfbar ice king 30000'
        ],
        'Рідина': [
            'Elfliq 30ml/5%',
            'Chaser Black 30 ml/5%',
            'Chaser Lux 30 ml/5%',
            'Chaser Mix 30 ml/5%',
            'Chaser F/P 30 ml/5%',
            'Chaser New 30 ml/5%',
            'Рик и морти 30ml/ 4.5%'
        ],
        'Картриджи': []
    };
    
    const selectedSubcategories = subcategories[category] || [];
    
    const catalogContainer = document.createElement('div');
    catalogContainer.className = 'catalog-container';
    
    let catalogHTML = `
        <div class="catalog-header">
            <button class="back-button">
                <i class="material-icons">arrow_back</i>
            </button>
            <h1>Категорія: ${category}</h1>
        </div>
        <div class="category-list">
            <div class="category-item" onclick="showCatalog()">
                <span>Всі категорії</span>
                <i class="material-icons">chevron_right</i>
            </div>
    `;
    
    selectedSubcategories.forEach(subcategory => {
        catalogHTML += `
            <div class="category-item">
                <span>${subcategory}</span>
                <i class="material-icons">chevron_right</i>
            </div>
        `;
    });
    
    catalogHTML += '</div>';
    catalogContainer.innerHTML = catalogHTML;
    
    const backButton = catalogContainer.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', showCatalog);
    }
    
    document.body.appendChild(catalogContainer);
}

// Обновлюємо функцію showCatalog
function showCatalog() {
    hideAllContainers();
    
    let catalogContainer = document.querySelector('.catalog-container');
    if (!catalogContainer) {
        catalogContainer = document.createElement('div');
        catalogContainer.className = 'catalog-container';
        catalogContainer.innerHTML = `
            <div class="catalog-header">
                <button class="back-button">
                    <i class="material-icons">arrow_back</i>
                </button>
                <h2>Фільтр</h2>
                <button class="clear-button">Очистити</button>
            </div>
            <div class="filter-count">: 0</div>
            <div class="catalog-section">
                <h3>Вибір категорії</h3>
                <div class="category-list">
                    <div class="category-item" data-category="Поди">
                        <span>Поди</span>
                        <i class="material-icons">chevron_right</i>
                    </div>
                    <div class="category-item" data-category="Рідина">
                        <span>Рідина</span>
                        <i class="material-icons">chevron_right</i>
                    </div>
                    <div class="category-item" data-category="Одноразки">
                        <span>Одноразки</span>
                        <i class="material-icons">chevron_right</i>
                    </div>
                    <div class="category-item" data-category="Картриджи">
                        <span>Картриджи</span>
                        <i class="material-icons">chevron_right</i>
                    </div>
                    <div class="category-item" data-category="Box">
                        <span>Box</span>
                        <i class="material-icons">chevron_right</i>

                    </div>
                </div>
            </div>
            <button class="show-products-button">
                Показати
                <span class="products-count">Знайдено товарів: 130</span>
            </button>
        `;
        
        // Добавляем обробники для категорій
        catalogContainer.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', () => {
                handleCategoryClick(item.dataset.category);
            });
        });

        // Обробник для кнопки "Назад"
        const backButton = catalogContainer.querySelector('.back-button');
        if (backButton) {
            backButton.addEventListener('click', () => {
                showHome();
            });
        }

        // Обробник для кнопки "Очистити"
        const clearButton = catalogContainer.querySelector('.clear-button');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                currentCategory = null;
                showNotification('Фільтри очищені');
                showHome();
            });
        }

        // Обробник для кнопки "Показати"
        const showButton = catalogContainer.querySelector('.show-products-button');
        if (showButton) {
            showButton.addEventListener('click', handleShowProducts);
        }
        
        document.body.appendChild(catalogContainer);
    }
    
    catalogContainer.style.display = 'block';
}

function handleCategoryClick(category) {
    hideAllContainers();
    
    const subcategories = {
        'Одноразки': [
            'Elfbar 2000',
            'Elfbar ri3000',
            'Elfbar4000',
            'Hqd click6000',
            'Hqd7000',
            'Vozol12000',
            'Hqd15000',
            'Elfbar bc18000',
            'Vozol Star20000',
            'Vozol Vista20000',
            'Hqd20000',
            'Elfbar gh23000',
            'Elfbar raya 25000',
            'Hqd Everest 25000',
            'Elfbar ice king 30000'
        ],
        'Рідина': [
            'Elfliq 30ml/5%',
            'Chaser Black 30 ml/5%',
            'Chaser Lux 30 ml/5%',
            'Chaser Mix 30 ml/5%',
            'Chaser F/P 30 ml/5%',
            'Chaser New 30 ml/5%',
            'Рик и морти 30ml/ 4.5%'
        ],
        'Картриджи': []
    };
    
    const selectedSubcategories = subcategories[category] || [];
    
    const catalogContainer = document.createElement('div');
    catalogContainer.className = 'catalog-container';
    
    let catalogHTML = `
        <div class="catalog-header">
            <button class="back-button">
                <i class="material-icons">arrow_back</i>
            </button>
            <h1>Категорія: ${category}</h1>
        </div>
        <div class="category-list">
            <div class="category-item" onclick="showCatalog()">
                <span>Всі категорії</span>
                <i class="material-icons">chevron_right</i>
            </div>
    `;
    
    selectedSubcategories.forEach(subcategory => {
        catalogHTML += `
            <div class="category-item">
                <span>${subcategory}</span>
                <i class="material-icons">chevron_right</i>
            </div>
        `;
    });
    
    catalogHTML += '</div>';
    catalogContainer.innerHTML = catalogHTML;
    
    const backButton = catalogContainer.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', showCatalog);
    }
    
    document.body.appendChild(catalogContainer);
}

// Обновлюємо функцію showCatalog
function showCatalog() {
    hideAllContainers();
    
    let catalogContainer = document.querySelector('.catalog-container');
    if (!catalogContainer) {
        catalogContainer = document.createElement('div');
        catalogContainer.className = 'catalog-container';
        catalogContainer.innerHTML = `
            <div class="catalog-header">
                <button class="back-button">
                    <i class="material-icons">arrow_back</i>
                </button>
                <h2>Фільтр</h2>
                <button class="clear-button">Очистити</button>
            </div>
            <div class="filter-count">: 0</div>
            <div class="catalog-section">
                <h3>Вибір категорії</h3>
                <div class="category-list">
                    <div class="category-item" data-category="Поди">
                        <span>Поди</span>
                        <i class="material-icons">chevron_right</i>
                    </div>
                    <div class="category-item" data-category="Рідина">
                        <span>Рідина</span>
                        <i class="material-icons">chevron_right</i>
                    </div>
                    <div class="category-item" data-category="Одноразки">
                        <span>Одноразки</span>
                        <i class="material-icons">chevron_right</i>
                    </div>
                    <div class="category-item" data-category="Картриджи">
                        <span>Картриджи</span>
                        <i class="material-icons">chevron_right</i>
                    </div>
                    <div class="category-item" data-category="Box">
                        <span>Box</span>
                        <i class="material-icons">chevron_right</i>

                    </div>
                </div>
            </div>
            <button class="show-products-button">
                Показати
                <span class="products-count">Знайдено товарів: 130</span>
            </button>
        `;
        
        // Добавляем обробники для категорій
        catalogContainer.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', () => {
                handleCategoryClick(item.dataset.category);
            });
        });

        // Обробник для кнопки "Назад"
        const backButton = catalogContainer.querySelector('.back-button');
        if (backButton) {
            backButton.addEventListener('click', () => {
                showHome();
            });
        }

        // Обробник для кнопки "Очистити"
        const clearButton = catalogContainer.querySelector('.clear-button');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                currentCategory = null;
                showNotification('Фільтри очищені');
                showHome();
            });
        }

        // Обробник для кнопки "Показати"
        const showButton = catalogContainer.querySelector('.show-products-button');
        if (showButton) {
            showButton.addEventListener('click', handleShowProducts);
        }
        
        document.body.appendChild(catalogContainer);
    }
    
    catalogContainer.style.display = 'block';
}

function handleCategoryClick(category) {
    hideAllContainers();
    
    const subcategories = {
        'Одноразки': [
            'Elfbar 2000',
            'Elfbar ri3000',
            'Elfbar4000',
            'Hqd click6000',
            'Hqd7000',
            'Vozol12000',
            'Hqd15000',
            'Elfbar bc18000',
            'Vozol Star20000',
            'Vozol Vista20000',
            'Hqd20000',
            'Elfbar gh23000',
            'Elfbar raya 25000',
            'Hqd Everest 25000',
            'Elfbar ice king 30000'
        ],
        'Рідина': [
            'Elfliq 30ml/5%',
            'Chaser Black 30 ml/5%',
            'Chaser Lux 30 ml/5%',
            'Chaser Mix 30 ml/5%',
            'Chaser F/P 30 ml/5%',
            'Chaser New 30 ml/5%',
            'Рик и морти 30ml/ 4.5%'
        ],
        'Картриджи': []
    };
    
    const selectedSubcategories = subcategories[category] || [];
    
    const catalogContainer = document.createElement('div');
    catalogContainer.className = 'catalog-container';
    
    let catalogHTML = `
        <div class="catalog-header">
            <button class="back-button">
                <i class="material-icons">arrow_back</i>
            </button>
            <h1>Категорія: ${category}</h1>
        </div>
        <div class="category-list">
            <div class="category-item" onclick="showCatalog()">
                <span>Всі категорії</span>
                <i class="material-icons">chevron_right</i>
            </div>
    `;
    
    selectedSubcategories.forEach(subcategory => {
        catalogHTML += `
            <div class="category-item">
                <span>${subcategory}</span>
                <i class="material-icons">chevron_right</i>
            </div>
        `;
    });
    
    catalogHTML += '</div>';
    catalogContainer.innerHTML = catalogHTML;
    
    const backButton = catalogContainer.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', showCatalog);
    }
    
    document.body.appendChild(catalogContainer);
}

// Обновлюємо функцію showCatalog
function showCatalog() {
    hideAllContainers();
    
    let catalogContainer = document.querySelector('.catalog-container');
    if (!catalogContainer) {
        catalogContainer = document.createElement('div');
        catalogContainer.className = 'catalog-container';
        catalogContainer.innerHTML = `
            <div class="catalog-header">
                <button class="back-button">
                    <i class="material-icons">arrow_back</i>
                </button>
                <h2>Фільтр</h2>
                <button class="clear-button">Очистити</button>
            </div>
            <div class="catalog-section">
                <h3>Вибір категорії</h3>
                <div class="category-list">
                    <div class="category-item" data-category="Поди">
                        <span>Поди</span>
                        <i class="material-icons">chevron_right</i>
                    </div>
                    <div class="category-item" data-category="Рідина">
                        <span>Рідина</span>
                        <i class="material-icons">chevron_right</i>
                    </div>
                    <div class="category-item" data-category="Одноразки">
                        <span>Одноразки</span>
                        <i class="material-icons">chevron_right</i>
                    </div>
                    <div class="category-item" data-category="Картриджи">
                        <span>Картриджи</span>
                        <i class="material-icons">chevron_right</i>
                    </div>
                    <div class="category-item" data-category="Box">
                        <span>Box</span>
                        <i class="material-icons">chevron_right</i>

                    </div>
                </div>
            </div>
            <button class="show-products-button">
                Показати
                <span class="products-count">Знайдено товарів: 130</span>
            </button>
        `;
        
        // Добавляем обробники для категорій
        catalogContainer.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', () => {
                handleCategoryClick(item.dataset.category);
            });
        });

        // Обробник для кнопки "Назад"
        const backButton = catalogContainer.querySelector('.back-button');
        if (backButton) {
            backButton.addEventListener('click', () => {
                showHome();
            });
        }

        // Обробник для кнопки "Очистити"
        const clearButton = catalogContainer.querySelector('.clear-button');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                currentCategory = null;
                showNotification('Фільтри очищені');
                showHome();
            });
        }

        // Обробник для кнопки "Показати"
        const showButton = catalogContainer.querySelector('.show-products-button');
        if (showButton) {
            showButton.addEventListener('click', handleShowProducts);
        }
        
        document.body.appendChild(catalogContainer);
    }
    
    catalogContainer.style.display = 'block';
}

function handleCategoryClick(category) {
    hideAllContainers();
    
    const subcategories = {
        'Одноразки': [
            'Elfbar 2000',
            'Elfbar ri3000',
            'Elfbar4000',
            'Hqd click6000',
            'Hqd7000',
            'Vozol12000',
            'Hqd15000',
            'Elfbar bc18000',
            'Vozol Star20000',
            'Vozol Vista20000',
            'Hqd20000',
            'Elfbar gh23000',
            'Elfbar raya 25000',
            'Hqd Everest 25000',
            'Elfbar ice king 30000'
        ],
        'Рідина': [
            'Elfliq 30ml/5%',
            'Chaser Black 30 ml/5%',
            'Chaser Lux 30 ml/5%',
            'Chaser Mix 30 ml/5%',
            'Chaser F/P 30 ml/5%',
            'Chaser New 30 ml/5%',
            'Рик и морти 30ml/ 4.5%'
        ],
        'Картриджи': []
    };
    
    const selectedSubcategories = subcategories[category] || [];
    
    const catalogContainer = document.createElement('div');
    catalogContainer.className = 'catalog-container';
    
    let catalogHTML = `
        <div class="catalog-header">
            <button class="back-button">
                <i class="material-icons">arrow_back</i>
            </button>
            <h1>Категорія: ${category}</h1>
        </div>
        <div class="category-list">
            <div class="category-item" onclick="showCatalog()">
                <span>Всі категорії</span>
                <i class="material-icons">chevron_right</i>
            </div>
    `;
    
    selectedSubcategories.forEach(subcategory => {
        catalogHTML += `
            <div class="category-item">
                <span>${subcategory}</span>
                <i class="material-icons">chevron_right</i>
            </div>
        `;
    });
    
    catalogHTML += '</div>';
    catalogContainer.innerHTML = catalogHTML;
    
    const backButton = catalogContainer.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', showCatalog);
    }
    
    document.body.appendChild(catalogContainer);
}

// Обробник зміни статусу наявності товарів
function updateProductStock(productId, inStock) {
    fetch('/update-stock', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: productId, in_stock: inStock })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Статус товара обновлен!');
        } else {
            console.error('Ошибка обновления статуса.');
        }
    });
}

// Прив'язування обробників до чекбоксів наявності товарів
function bindStockCheckboxes() {
    document.querySelectorAll('.stock-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const productId = this.getAttribute('data-id');
            const inStock = this.checked;
            updateProductStock(productId, inStock);
        });
    });
}

// Виклик функції прив'язування обробників після завантаження товарів
window.addEventListener('load', () => {
    bindStockCheckboxes();
});

// Функція для приховування всіх контейнерів
function hideAllContainers() {
    document.querySelectorAll('.checkout-container, .payment-container').forEach(container => container.remove());
    document.querySelector('.app').style.display = 'none';
    document.querySelector('.cart-container')?.remove();
    document.querySelector('.catalog-container')?.remove();
    document.querySelector('.account-container')?.remove();
    document.querySelector('.product-details-container')?.remove();
}

// Функції для сторінок
function showHome() {
    hideAllContainers();
    document.querySelector('.app').style.display = 'block';
    currentCategory = 'Одноразки';
    filterAndDisplayProducts();
}

function showAccount() {
    hideAllContainers();
    
    let accountContainer = document.querySelector('.account-container');
    if (!accountContainer) {
        accountContainer = document.createElement('div');
        accountContainer.className = 'account-container';
        accountContainer.innerHTML = `
            <div class="account-header">
                <div class="account-avatar">
                    <i class="material-icons">account_circle</i>
                </div>
                <h2>Личный кабинет</h2>
            </div>
            <div class="account-menu">
                <div class="account-menu-item" data-action="orders">
                    <i class="material-icons">shopping_bag</i>
                    <span>Мої замовлення</span>
                    <i class="material-icons">chevron_right</i>
                </div>
                <div class="account-menu-item" data-action="support">
                    <i class="material-icons">support_agent</i>
                    <span>Підтримка</span>
                    <i class="material-icons">chevron_right</i>
                </div>
                <div class="account-menu-item" data-action="about">
                    <i class="material-icons">info</i>
                    <span>Про нас</span>
                    <i class="material-icons">chevron_right</i>
                </div>
            </div>
        `;
        
        // Добавляем обробники для пунктів меню
        accountContainer.querySelectorAll('.account-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                switch (item.dataset.action) {
                    case 'orders':
                        showOrders();
                        break;
                    case 'support':
                        tg.openTelegramLink('https://t.me/odnorazki_wro');
                        break;
                    case 'about':
                        // Отправляем callback для показа інформації о магазине
                        fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                callback_query_id: tg.initDataUnsafe?.query_id,
                                data: 'about_us'
                            })
                        });
                        Telegram.WebApp.close();
                        break;
                }
            });
        });
        
        document.body.appendChild(accountContainer);
    }
    
    accountContainer.style.display = 'block';
}

function showOrders() {
    showNotification('Історія замовлень поки недоступна');
}

// Створюємо нижню навігацію
const bottomNav = document.createElement('div');
bottomNav.className = 'bottom-nav';
bottomNav.innerHTML = `
    <div class="nav-item" data-page="home">
        <i class="material-icons">home</i>
        <span>Головна</span>
    </div>
    <div class="nav-item" data-page="catalog">
        <i class="material-icons">assignment</i>
        <span>Каталог</span>
    </div>
    <div class="nav-item" data-page="cart">
        <i class="material-icons">shopping_cart</i>
        <span>Корзина</span>
        <div class="cart-badge">0</div>
    </div>
    <div class="nav-item" data-page="chat">
        <i class="material-icons">chat</i>
        <span>Чати</span>
    </div>
    <div class="nav-item" data-page="account">
        <i class="material-icons">person</i>
        <span>Кабінет</span>
    </div>
`;
document.body.appendChild(bottomNav);

// Обробники навігації
const navItems = bottomNav.querySelectorAll('.nav-item');
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        const page = item.dataset.page;
        switch(page) {
            case 'home':
                showHome();
                break;
            case 'catalog':
                showCatalog();
                break;
            case 'cart':
                if (cart.length === 0) {
                    showNotification('Корзина пуста');
                } else {
                    showCart();
                }
                break;
            case 'chat':
                tg.openTelegramLink('https://t.me/odnorazki_wro');
                break;
            case 'account':
                showAccount();
                break;
        }
    });
});

// Добавляем стили
const style = document.createElement('style');
style.textContent = `
    .bottom-nav {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: var(--tg-theme-bg-color);
        display: flex;
        justify-content: space-around;
        padding: 10px 0;
        box-shadow: 0 -1px 0 0 var(--tg-theme-hint-color);
        z-index: 1000;
    }

    .nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        color: var(--tg-theme-hint-color);
        cursor: pointer;
        transition: all 0.3s;
        padding: 4px 8px;
        position: relative;
        min-width: 64px;
    }

    .nav-item.active {
        color: var(--tg-theme-button-color);
    }

    .nav-item i {
        font-size: 24px;
        margin-bottom: 4px;
    }

    .nav-item span {
        font-size: 12px;
        text-align: center;
    }

    .cart-badge {
        position: absolute;
        top: -2px;
        right: 8px;
        background: var(--tg-theme-button-color);
        color: var(--tg-theme-button-text-color);
        border-radius: 12px;
        padding: 2px 6px;
        font-size: 10px;
        display: none;
        min-width: 8px;
        height: 16px;
        text-align: center;
        line-height: 16px;
    }

    .products-grid {
        margin-bottom: 80px;
        padding-bottom: 20px;
    }

    .app {
        padding-bottom: 70px;
    }
`;
document.head.appendChild(style);

// Добавляем стили для повідомлень
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification {
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%) translateY(100%);
        background: var(--tg-theme-bg-color);
        color: var(--tg-theme-text-color);
        padding: 12px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        transition: transform 0.3s ease-out;
        text-align: center;
    }

    .notification.show {
        transform: translateX(-50%) translateY(0);
    }
`;
document.head.appendChild(notificationStyles);

// Добавляем стили для нових контейнерів
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    .catalog-container, .account-container {
        padding: 16px;
        padding-bottom: 80px;
    }

    .catalog-header, .account-header {
        text-align: center;
        margin-bottom: 24px;
    }

    .catalog-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 16px;
    }

    .catalog-item {
        background: var(--tg-theme-bg-color);
        border-radius: 12px;
        padding: 16px;
        text-align: center;
        cursor: pointer;
        transition: transform 0.2s;
    }

    .catalog-item:active {
        transform: scale(0.95);
    }

    .catalog-item-icon {
        background: var(--tg-theme-button-color);
        width: 48px;
        height: 48px;
        border-radius: 24px;
        margin: 0 auto 12px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .catalog-item-icon i {
        color: var(--tg-theme-button-text-color);
        font-size: 24px;
    }

    .catalog-item-title {
        color: var(--tg-theme-text-color);
        font-size: 14px;
    }

    .account-header {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .account-avatar {
        width: 80px;
        height: 80px;
        border-radius: 40px;
        background: var(--tg-theme-button-color);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
    }

    .account-avatar i {
        font-size: 48px;
        color: var(--tg-theme-button-text-color);
    }

    .account-menu {
        background: var(--tg-theme-bg-color);
        border-radius: 12px;
    }

    .account-menu-item {
        display: flex;
        align-items: center;
        padding: 16px;
        cursor: pointer;
        border-bottom: 1px solid var(--tg-theme-hint-color);
    }

    .account-menu-item:last-child {
        border-bottom: none;
    }

    .account-menu-item i:first-child {
        margin-right: 16px;
        color: var(--tg-theme-button-color);
    }

    .account-menu-item span {
        flex: 1;
        color: var(--tg-theme-text-color);
    }

    .account-menu-item i:last-child {
        color: var(--tg-theme-hint-color);
    }
`;
document.head.appendChild(additionalStyles);

// Добавляем стили для деталей продукту
const productDetailsStyles = document.createElement('style');
productDetailsStyles.textContent = `
    .product-details-container {
        padding: 16px;
        padding-bottom: 80px;
    }

    .product-details-header {
        display: flex;
        align-items: center;
        margin-bottom: 24px;
    }

    .product-details-header .back-button {
        background: none;
        border: none;
        padding: 8px;
        margin-right: 16px;
        cursor: pointer;
        color: var(--tg-theme-text-color);
    }

    .product-details {
        background: var(--tg-theme-bg-color);
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .product-details h1 {
        color: #4CAF50;
        font-size: 24px;
        margin-bottom: 8px;
    }

    .product-details h3 {
        margin-bottom: 16px;
    }

    .availability {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 14px;
        margin-bottom: 16px;
        display: inline-block;
    }

    .in-stock {
        background: #4CAF50;
        color: white;
    }

    .out-of-stock {
        background: #F44336;
        color: white;
    }

    .product-characteristics ul {
        list-style: none;
        padding: 0;
    }

    .product-characteristics li {
        margin-bottom: 8px;
    }

    .product-description {
        margin-top: 16px;
    }

    .add-to-cart-button {
        width: 100%;
        padding: 12px;
        border: none;
        border-radius: 8px;
        background: #4CAF50;
        color: white;
        font-size: 16px;
        cursor: pointer;
        margin-top: 16px;
    }
`;
document.head.appendChild(productDetailsStyles);

// Обновлюємо стили для особистого кабінету
const accountStyles = document.createElement('style');
accountStyles.textContent = `
    .account-container {
        padding: 20px 16px 80px;
    }

    .account-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 32px;
        padding: 20px;
    }

    .account-avatar {
        width: 80px;
        height: 80px;
        border-radius: 40px;
        background: var(--tg-theme-button-color);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .account-avatar i {
        font-size: 48px;
        color: var(--tg-theme-button-text-color);
    }

    .account-header h2 {
        color: var(--tg-theme-text-color);
        font-size: 24px;
        margin: 0;
    }

    .account-menu {
        background: var(--tg-theme-bg-color);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .account-menu-item {
        display: flex;
        align-items: center;
        padding: 16px;
        cursor: pointer;
        transition: background-color 0.2s;
        border-bottom: 1px solid var(--tg-theme-hint-color);
    }

    .account-menu-item:last-child {
        border-bottom: none;
    }

    .account-menu-item:active {
        background-color: rgba(0, 0, 0, 0.05);
    }

    .account-menu-item i:first-child {
        margin-right: 16px;
        color: var(--tg-theme-button-color);
        font-size: 24px;
    }

    .account-menu-item span {
        flex: 1;
        color: var(--tg-theme-text-color);
        font-size: 16px;
    }

    .account-menu-item i:last-child {
        color: var(--tg-theme-hint-color);
    }
`;
document.head.appendChild(accountStyles);

// Обновлюємо стили для каталогу
const catalogStyles = document.createElement('style');
catalogStyles.textContent = `
    .catalog-container {
        padding: 16px;
        padding-bottom: 80px;
    }

    .catalog-header {
        text-align: center;
        margin-bottom: 24px;
    }

    .catalog-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 16px;
    }

    .catalog-item {
        background: var(--tg-theme-bg-color);
        border-radius: 12px;
        padding: 16px;
        text-align: center;
        cursor: pointer;
        transition: transform 0.2s;
    }

    .catalog-item:active {
        transform: scale(0.95);
    }

    .catalog-item-icon {
        background: var(--tg-theme-button-color);
        width: 48px;
        height: 48px;
        border-radius: 24px;
        margin: 0 auto 12px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .catalog-item-icon i {
        color: var(--tg-theme-button-text-color);
        font-size: 24px;
    }

    .catalog-item-title {
        color: var(--tg-theme-text-color);
        font-size: 14px;
    }
`;
document.head.appendChild(catalogStyles);

// Встановлюємо активну вкладку при завантаженні
document.querySelector('.nav-item[data-page="home"]').classList.add('active');

// Добавляем стили для відображення порожнього результату
const noProductsStyle = document.createElement('style');
noProductsStyle.textContent = `
    .no-products {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: var(--tg-theme-hint-color);
        font-size: 16px;
        text-align: center;
    }

    .products-grid {
        position: relative;
        min-height: calc(100vh - 200px);
    }
`;
document.head.appendChild(noProductsStyle);

function loadCart() {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

cart = loadCart();

function addToCart(product) {
    if (!product.in_stock) {
        alert('Извините, этот товар сейчас недоступен.');
        return;
    }
    
    const existingProduct = cart.find(item => item.id === product.id);
    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        cart.push({...product, quantity: 1});
    }
    saveCart();
    updateCartCounter();
    showNotification('Товар додано в корзину');
    showCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartCounter();
}

function clearCart() {
    cart = [];
    saveCart();
    updateCartCounter();
}

function updateCartCounter() {
    const counter = document.querySelector('.cart-counter');
    counter.textContent = cart.reduce((acc, item) => acc + item.quantity, 0);
}

window.addEventListener('load', () => {
    updateCartCounter();
});
