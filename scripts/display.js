let allMainCategories = new Set();
let allSubCategories = new Set();
let allProducts = []; // Сохраняем все товары для сортировки

document.addEventListener('DOMContentLoaded', function() {
    
    // Загружаем товары и создаем фильтры
    loadDishes().then(dishes => {
        // Сохраняем все товары
        allProducts = dishes;
        
        console.log("Товары загружены");
        console.log("Найдено категорий:", {
            main: Array.from(allMainCategories),
            sub: Array.from(allSubCategories)
        });
        
        // Создаем чекбоксы для категорий
        createCategoryFilters();
        
        // Отображаем товары с начальной сортировкой (по убыванию рейтинга)
        displaySortedProducts('popular');
        
        // Инициализируем обработчики фильтров и сортировки
        initializeFilterHandlers();
        initializeSortHandler();
    });
});


function loadDishes() {
    return fetch(`${API_CONFIG.BASE_URL}/exam-2024-1/api/goods?api_key=${API_CONFIG.API_KEY}`)
        .then(response => response.json())
        .then(products => {
            // Собираем уникальные категории
            products.forEach(product => {
                if (product.main_category) {
                    allMainCategories.add(product.main_category);
                }
                if (product.sub_category) {
                    allSubCategories.add(product.sub_category);
                }
            });
            
            return products;
        });
}

// Функция для создания чекбоксов с категориями
function createCategoryFilters() {
    const filterForm = document.querySelector('.simple-filter');
    
    if (!filterForm) {
        console.error('Форма фильтров не найдена!');
        return;
    }
    
    // Находим блок с категориями (первый filter-block)
    const firstFilterBlock = filterForm.querySelector('.filter-block');
    
    if (!firstFilterBlock) {
        console.error('Блок фильтров не найден!');
        return;
    }
    
    // Создаем HTML для чекбоксов
    let categoriesHTML = '<p><strong>Категории:</strong></p>';
    
    // Создаем чекбоксы для основных категорий
    const mainCategoriesArray = Array.from(allMainCategories);
    
    if (mainCategoriesArray.length > 0) {
        mainCategoriesArray.forEach((category, index) => {
            // Создаем уникальное имя для чекбокса
            const checkboxName = `category-${index}`;
            categoriesHTML += `
                <label>
                    <input type="checkbox" name="${checkboxName}" value="${category}" class="category-checkbox" data-category-type="main">
                    ${category}
                </label><br>
            `;
        });
    } else {
        categoriesHTML += '<p style="color: #666;">Категории не найдены</p>';
    }
    
    // Заменяем содержимое блока с категориями
    firstFilterBlock.innerHTML = categoriesHTML;
}

// Инициализация обработчиков для фильтров
function initializeFilterHandlers() {
    const filterForm = document.querySelector('.simple-filter');
    
    if (!filterForm) return;
    
    // Обработчик для кнопки "Применить"
    const applyButton = filterForm.querySelector('button[type="submit"]');
    if (applyButton) {
        applyButton.addEventListener('click', function(event) {
            event.preventDefault(); // Предотвращаем отправку формы
            applyFilters();
        });
    }
    
    // Обработчик для кнопки "Сбросить"
    const resetButton = filterForm.querySelector('button[type="reset"]');
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            // Даем время на сброс чекбоксов
            setTimeout(function() {
                // После сброса показываем все товары с текущей сортировкой
                const sortSelect = document.querySelector('#sort select');
                const currentSort = sortSelect ? sortSelect.value : 'popular';
                displaySortedProducts(currentSort);
                console.log('Фильтры сброшены, показаны все товары');
            }, 50);
        });
    }
}

// Инициализация обработчика сортировки
function initializeSortHandler() {
    const sortSelect = document.querySelector('#sort select');
    
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const sortType = this.value;
            console.log('Сортировка изменена на:', sortType);
            displaySortedProducts(sortType);
        });
    }
}

// Функция для отображения отсортированных товаров
function displaySortedProducts(sortType) {
    let productsToDisplay = [...allProducts]; // Копируем массив
    
    // Сортируем товары в зависимости от выбранного типа
    switch(sortType) {
        case 'price_asc':
            // По возрастанию цены (от дешевых к дорогим)
            productsToDisplay.sort((a, b) => (a.actual_price || 0) - (b.actual_price || 0));
            break;
        case 'price_desc':
            // По убыванию цены (от дорогих к дешевым)
            productsToDisplay.sort((a, b) => (b.actual_price || 0) - (a.actual_price || 0));
            break;
        case 'rating':
            // По возрастанию рейтинга (от низкого к высокому)
            productsToDisplay.sort((a, b) => (a.rating || 0) - (b.rating || 0));
            break;
        case 'new':
            // По новизне (новые сначала)
            productsToDisplay.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'popular':
        default:
            // По убыванию рейтинга (популярные сначала - от высокого рейтинга к низкому)
            productsToDisplay.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
    }
    
    // Отображаем отсортированные товары
    displayDishesByCategory(productsToDisplay);
}

// Функция для применения фильтров
function applyFilters() {
    console.log('Применение фильтров...');
    
    // Получаем параметры фильтров
    const filterParams = getFilterParams();
    
    // Фильтруем товары
    const filteredProducts = allProducts.filter(product => {
        return shouldShowProduct(product, filterParams);
    });
    
    // Получаем текущий тип сортировки
    const sortSelect = document.querySelector('#sort select');
    const currentSort = sortSelect ? sortSelect.value : 'popular';
    
    // Отображаем отфильтрованные и отсортированные товары
    let sortedFilteredProducts = [...filteredProducts];
    
    // Применяем сортировку к отфильтрованным товарам
    switch(currentSort) {
        case 'price_asc':
            // По возрастанию цены
            sortedFilteredProducts.sort((a, b) => (a.actual_price || 0) - (b.actual_price || 0));
            break;
        case 'price_desc':
            // По убыванию цены
            sortedFilteredProducts.sort((a, b) => (b.actual_price || 0) - (a.actual_price || 0));
            break;
        case 'rating':
            // По возрастанию рейтинга
            sortedFilteredProducts.sort((a, b) => (a.rating || 0) - (b.rating || 0));
            break;
        case 'new':
            // По новизне
            sortedFilteredProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'popular':
        default:
            // По убыванию рейтинга
            sortedFilteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
    }
    
    // Отображаем товары
    displayDishesByCategory(sortedFilteredProducts);
    
    console.log('Фильтры применены:', filterParams);
    console.log('Показано товаров:', sortedFilteredProducts.length);
}

// Функция для получения параметров фильтров
function getFilterParams() {
    const params = {
        selectedCategories: [],
        minPrice: null,
        maxPrice: null,
        onlyOnSale: false
    };
    
    // Получаем выбранные категории
    const selectedCheckboxes = document.querySelectorAll('.category-checkbox:checked');
    params.selectedCategories = Array.from(selectedCheckboxes).map(cb => cb.value);
    
    // Получаем минимальную цену
    const minPriceInput = document.querySelector('input[name="min"]');
    if (minPriceInput && minPriceInput.value.trim() !== '') {
        params.minPrice = parseInt(minPriceInput.value);
    }
    
    // Получаем максимальную цену
    const maxPriceInput = document.querySelector('input[name="max"]');
    if (maxPriceInput && maxPriceInput.value.trim() !== '') {
        params.maxPrice = parseInt(maxPriceInput.value);
    }
    
    // Получаем чекбокс "Только со скидкой"
    const saleCheckbox = document.querySelector('input[name="sale"]');
    if (saleCheckbox) {
        params.onlyOnSale = saleCheckbox.checked;
    }
    
    return params;
}

// Функция для определения, должен ли товар отображаться
function shouldShowProduct(product, filterParams) {
    // Проверка по категориям
    if (filterParams.selectedCategories.length > 0) {
        if (!filterParams.selectedCategories.includes(product.main_category)) {
            return false;
        }
    }
    
    // Проверка по цене
    const productPrice = product.actual_price || 0;
    
    if (filterParams.minPrice !== null && productPrice < filterParams.minPrice) {
        return false;
    }
    
    if (filterParams.maxPrice !== null && productPrice > filterParams.maxPrice) {
        return false;
    }
    
    // Проверка на скидку
    if (filterParams.onlyOnSale) {
        if (!product.discount_price) {
            return false;
        }
    }
    
    return true;
}

// Функция для отображения товаров
function displayDishesByCategory(dishesArray) {
    const section = document.getElementById('list');
    
    // Очищаем контейнер
    section.innerHTML = '';

    // Если нет товаров для отображения
    if (dishesArray.length === 0) {
        section.innerHTML = `
            <div class="no-products" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">
                <h3>Товары не найдены</h3>
                <p>Попробуйте изменить параметры фильтров</p>
            </div>
        `;
        return;
    }

    // Создаем карточки для каждого товара
    dishesArray.forEach(product => {
        const Element = createproductElement(product);
        section.appendChild(Element);
    });
}

function createproductElement(product) {
    const productDiv = document.createElement('div');
    productDiv.className = 'product';
    productDiv.setAttribute('data-product', product.keyword);
    
    // Форматируем цены
    const actualPrice = product.actual_price ? `${product.actual_price} ₽` : '0 ₽';
    const discountPrice = product.discount_price ? `${product.discount_price} ₽` : '';
    const rating = product.rating || '0.0';
    
    // Форматируем дату
    const createdDate = new Date(product.created_at);
    const formattedDate = createdDate.toLocaleDateString('ru-RU');
    
    productDiv.innerHTML = `
        <div class="product-content">
            <img src="${product.image_url}" alt="${product.name}" class="product-image">
            <div class="product-name">${product.name}</div>
            <div class="product-main-category" style="display: none;">${product.main_category || ''}</div>
            <div class="product-sub-category" style="display: none;">${product.sub_category || ''}</div>
            <div class="product-rating">★ ${rating}</div>
            <div class="price-container">
                ${discountPrice ? `<div class="product-discount-price">${discountPrice}</div>` : ''}
                <div class="product-actual-price">${actualPrice}</div>
            </div>
            <div class="product-created-at" style="display: none;">${product.created_at}</div>
            <button class="add-button" type="button">Добавить</button>
        </div>
    `;
    
    return productDiv;
}