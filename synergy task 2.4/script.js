// Управление данными в LocalStorage
class BookStore {
    constructor() {
        this.booksKey = 'bookstore_books';
        this.rentalsKey = 'bookstore_rentals';
        this.init();
    }

    init() {
        if (!localStorage.getItem(this.booksKey)) {
            // Инициализация с примерами книг
            const defaultBooks = [
                {
                    id: 1,
                    title: 'Война и мир',
                    author: 'Лев Толстой',
                    year: 1869,
                    category: 'Классическая литература',
                    price: 1500,
                    rentPrice2Weeks: 200,
                    rentPriceMonth: 350,
                    rentPrice3Months: 900,
                    status: 'available',
                    available: true
                },
                {
                    id: 2,
                    title: 'Преступление и наказание',
                    author: 'Фёдор Достоевский',
                    year: 1866,
                    category: 'Классическая литература',
                    price: 1200,
                    rentPrice2Weeks: 180,
                    rentPriceMonth: 300,
                    rentPrice3Months: 750,
                    status: 'available',
                    available: true
                },
                {
                    id: 3,
                    title: 'Мастер и Маргарита',
                    author: 'Михаил Булгаков',
                    year: 1967,
                    category: 'Фантастика',
                    price: 1100,
                    rentPrice2Weeks: 150,
                    rentPriceMonth: 280,
                    rentPrice3Months: 700,
                    status: 'available',
                    available: true
                },
                {
                    id: 4,
                    title: '1984',
                    author: 'Джордж Оруэлл',
                    year: 1949,
                    category: 'Антиутопия',
                    price: 1000,
                    rentPrice2Weeks: 140,
                    rentPriceMonth: 250,
                    rentPrice3Months: 650,
                    status: 'available',
                    available: true
                },
                {
                    id: 5,
                    title: 'Гарри Поттер и философский камень',
                    author: 'Дж. К. Роулинг',
                    year: 1997,
                    category: 'Фэнтези',
                    price: 800,
                    rentPrice2Weeks: 120,
                    rentPriceMonth: 200,
                    rentPrice3Months: 500,
                    status: 'available',
                    available: true
                }
            ];
            localStorage.setItem(this.booksKey, JSON.stringify(defaultBooks));
        }
        if (!localStorage.getItem(this.rentalsKey)) {
            localStorage.setItem(this.rentalsKey, JSON.stringify([]));
        }
    }

    getBooks() {
        return JSON.parse(localStorage.getItem(this.booksKey) || '[]');
    }

    saveBooks(books) {
        localStorage.setItem(this.booksKey, JSON.stringify(books));
    }

    getRentals() {
        return JSON.parse(localStorage.getItem(this.rentalsKey) || '[]');
    }

    saveRentals(rentals) {
        localStorage.setItem(this.rentalsKey, JSON.stringify(rentals));
    }

    addBook(book) {
        const books = this.getBooks();
        const newId = books.length > 0 ? Math.max(...books.map(b => b.id)) + 1 : 1;
        book.id = newId;
        books.push(book);
        this.saveBooks(books);
        return book;
    }

    updateBook(id, updatedBook) {
        const books = this.getBooks();
        const index = books.findIndex(b => b.id === id);
        if (index !== -1) {
            books[index] = { ...books[index], ...updatedBook };
            this.saveBooks(books);
            return books[index];
        }
        return null;
    }

    deleteBook(id) {
        const books = this.getBooks();
        const filtered = books.filter(b => b.id !== id);
        this.saveBooks(filtered);
    }

    addRental(rental) {
        const rentals = this.getRentals();
        rentals.push(rental);
        this.saveRentals(rentals);
    }

    updateRental(id, updatedRental) {
        const rentals = this.getRentals();
        const index = rentals.findIndex(r => r.id === id);
        if (index !== -1) {
            rentals[index] = { ...rentals[index], ...updatedRental };
            this.saveRentals(rentals);
            return rentals[index];
        }
        return null;
    }

    removeRental(id) {
        const rentals = this.getRentals();
        const filtered = rentals.filter(r => r.id !== id);
        this.saveRentals(filtered);
    }
}

// Основной класс приложения
class App {
    constructor() {
        this.store = new BookStore();
        this.currentBookId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUserView();
        this.checkRentalReminders();
        // Проверка напоминаний каждые 5 минут
        setInterval(() => this.checkRentalReminders(), 5 * 60 * 1000);
    }

    setupEventListeners() {
        // Переключение интерфейсов
        document.getElementById('userViewBtn').addEventListener('click', () => {
            this.loadUserView();
        });
        document.getElementById('adminViewBtn').addEventListener('click', () => {
            this.loadAdminView();
        });

        // Фильтры
        document.getElementById('categoryFilter').addEventListener('change', () => this.filterBooks());
        document.getElementById('authorFilter').addEventListener('change', () => this.filterBooks());
        document.getElementById('yearFilter').addEventListener('change', () => this.filterBooks());
        document.getElementById('resetFilters').addEventListener('click', () => this.resetFilters());

        // Форма администратора
        document.getElementById('bookForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBook();
        });
        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.resetForm();
        });

        // Модальные окна
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        window.addEventListener('click', (e) => {
            // Не закрываем модальное окно подтверждения через этот обработчик
            if (e.target.classList.contains('modal') && e.target.id !== 'confirmModal') {
                e.target.style.display = 'none';
            }
        });
    }

    loadUserView() {
        document.getElementById('userInterface').classList.add('active');
        document.getElementById('adminInterface').classList.remove('active');
        document.getElementById('userViewBtn').classList.add('active');
        document.getElementById('adminViewBtn').classList.remove('active');
        this.populateFilters();
        this.displayBooks();
    }

    loadAdminView() {
        document.getElementById('userInterface').classList.remove('active');
        document.getElementById('adminInterface').classList.add('active');
        document.getElementById('userViewBtn').classList.remove('active');
        document.getElementById('adminViewBtn').classList.add('active');
        this.displayAdminBooks();
        this.displayRentals();
    }

    populateFilters() {
        const books = this.store.getBooks();
        const categories = [...new Set(books.map(b => b.category))].sort();
        const authors = [...new Set(books.map(b => b.author))].sort();
        const years = [...new Set(books.map(b => b.year))].sort((a, b) => b - a);

        const categoryFilter = document.getElementById('categoryFilter');
        const authorFilter = document.getElementById('authorFilter');
        const yearFilter = document.getElementById('yearFilter');

        // Сохраняем выбранные значения
        const selectedCategory = categoryFilter.value;
        const selectedAuthor = authorFilter.value;
        const selectedYear = yearFilter.value;

        // Очищаем и заполняем категории
        categoryFilter.innerHTML = '<option value="">Все категории</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            if (cat === selectedCategory) option.selected = true;
            categoryFilter.appendChild(option);
        });

        // Очищаем и заполняем авторов
        authorFilter.innerHTML = '<option value="">Все авторы</option>';
        authors.forEach(author => {
            const option = document.createElement('option');
            option.value = author;
            option.textContent = author;
            if (author === selectedAuthor) option.selected = true;
            authorFilter.appendChild(option);
        });

        // Очищаем и заполняем годы
        yearFilter.innerHTML = '<option value="">Все годы</option>';
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            if (year.toString() === selectedYear) option.selected = true;
            yearFilter.appendChild(option);
        });
    }

    filterBooks() {
        const category = document.getElementById('categoryFilter').value;
        const author = document.getElementById('authorFilter').value;
        const year = document.getElementById('yearFilter').value;

        const books = this.store.getBooks();
        let filtered = books;

        if (category) {
            filtered = filtered.filter(b => b.category === category);
        }
        if (author) {
            filtered = filtered.filter(b => b.author === author);
        }
        if (year) {
            filtered = filtered.filter(b => b.year.toString() === year);
        }

        this.displayBooks(filtered);
    }

    resetFilters() {
        document.getElementById('categoryFilter').value = '';
        document.getElementById('authorFilter').value = '';
        document.getElementById('yearFilter').value = '';
        this.displayBooks();
    }

    displayBooks(books = null) {
        const booksList = document.getElementById('booksList');
        booksList.innerHTML = '';

        const booksToDisplay = books || this.store.getBooks();

        if (booksToDisplay.length === 0) {
            booksList.innerHTML = '<p style="text-align: center; padding: 2rem;">Книги не найдены</p>';
            return;
        }

        booksToDisplay.forEach(book => {
            const card = document.createElement('div');
            card.className = `book-card ${!book.available ? 'unavailable' : ''}`;
            
            const statusClass = `status-${book.status}`;
            const statusText = {
                'available': 'Доступна',
                'rented': 'В аренде',
                'sold': 'Продана'
            };

            card.innerHTML = `
                <div class="book-title">${book.title}</div>
                <div class="book-author">Автор: ${book.author}</div>
                <div class="book-info">
                    <div>Год: ${book.year}</div>
                    <div>Категория: ${book.category}</div>
                </div>
                <div class="book-price">Цена: ${book.price} ₽</div>
                <div class="book-status ${statusClass}">${statusText[book.status]}</div>
                <div class="book-actions">
                    <button class="btn-primary" onclick="app.viewBook(${book.id})">Просмотр</button>
                    ${book.available ? `<button class="btn-primary" onclick="app.openPurchaseModal(${book.id})">Купить/Арендовать</button>` : ''}
                </div>
            `;
            booksList.appendChild(card);
        });
    }

    viewBook(id) {
        const book = this.store.getBooks().find(b => b.id === id);
        if (!book) return;

        const modal = document.getElementById('viewModal');
        const details = document.getElementById('viewBookDetails');

        details.innerHTML = `
            <h2>${book.title}</h2>
            <div class="detail-row">
                <span class="detail-label">Автор:</span>
                <span class="detail-value">${book.author}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Год написания:</span>
                <span class="detail-value">${book.year}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Категория:</span>
                <span class="detail-value">${book.category}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Цена покупки:</span>
                <span class="detail-value">${book.price} ₽</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Аренда (2 недели):</span>
                <span class="detail-value">${book.rentPrice2Weeks} ₽</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Аренда (месяц):</span>
                <span class="detail-value">${book.rentPriceMonth} ₽</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Аренда (3 месяца):</span>
                <span class="detail-value">${book.rentPrice3Months} ₽</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Статус:</span>
                <span class="detail-value">${book.status === 'available' ? 'Доступна' : book.status === 'rented' ? 'В аренде' : 'Продана'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Доступность:</span>
                <span class="detail-value">${book.available ? 'Доступна' : 'Недоступна'}</span>
            </div>
        `;

        modal.style.display = 'block';
    }

    openPurchaseModal(id) {
        const book = this.store.getBooks().find(b => b.id === id);
        if (!book || !book.available) return;

        const modal = document.getElementById('purchaseModal');
        const details = document.getElementById('bookDetails');
        const title = document.getElementById('modalTitle');

        title.textContent = book.title;
        details.innerHTML = `
            <div class="detail-row">
                <span class="detail-label">Автор:</span>
                <span class="detail-value">${book.author}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Цена покупки:</span>
                <span class="detail-value">${book.price} ₽</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Аренда (2 недели):</span>
                <span class="detail-value">${book.rentPrice2Weeks} ₽</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Аренда (месяц):</span>
                <span class="detail-value">${book.rentPriceMonth} ₽</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Аренда (3 месяца):</span>
                <span class="detail-value">${book.rentPrice3Months} ₽</span>
            </div>
        `;

        // Устанавливаем обработчики для кнопок
        document.querySelectorAll('.purchase-btn').forEach(btn => {
            btn.onclick = () => {
                const type = btn.dataset.type;
                this.processPurchase(id, type);
            };
        });

        modal.style.display = 'block';
    }

    async processPurchase(bookId, type) {
        const book = this.store.getBooks().find(b => b.id === bookId);
        if (!book || !book.available) {
            this.showNotification('Книга недоступна', 'error');
            return;
        }

        // Определяем тип действия и текст подтверждения
        let actionText = '';
        let confirmMessage = '';
        const rentalPeriods = {
            'rent-2weeks': { days: 14, price: book.rentPrice2Weeks, name: '2 недели' },
            'rent-month': { days: 30, price: book.rentPriceMonth, name: 'месяц' },
            'rent-3months': { days: 90, price: book.rentPrice3Months, name: '3 месяца' }
        };

        if (type === 'buy') {
            actionText = 'купить';
            confirmMessage = `Вы уверены, что хотите купить книгу "${book.title}" за ${book.price} ₽?`;
        } else {
            const period = rentalPeriods[type];
            if (!period) return;
            actionText = `арендовать на ${period.name}`;
            confirmMessage = `Вы уверены, что хотите арендовать книгу "${book.title}" на ${period.name} за ${period.price} ₽?`;
        }

        // Показываем кастомное подтверждение
        const confirmed = await this.showConfirm('Подтверждение действия', confirmMessage);
        if (!confirmed) {
            return;
        }

        if (type === 'buy') {
            // Покупка
            this.store.updateBook(bookId, {
                status: 'sold',
                available: false
            });
            this.showNotification(`Книга "${book.title}" успешно куплена!`, 'success');
        } else {
            // Аренда
            const period = rentalPeriods[type];
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + period.days);

            const rental = {
                id: Date.now(),
                bookId: bookId,
                bookTitle: book.title,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                price: period.price,
                type: type,
                notified: false
            };

            this.store.addRental(rental);
            this.store.updateBook(bookId, {
                status: 'rented',
                available: false
            });

            this.showNotification(`Книга "${book.title}" арендована до ${endDate.toLocaleDateString('ru-RU')}`, 'success');
        }

        document.getElementById('purchaseModal').style.display = 'none';
        this.displayBooks();
        if (document.getElementById('adminInterface').classList.contains('active')) {
            this.displayAdminBooks();
            this.displayRentals();
        }
    }

    displayAdminBooks() {
        const booksList = document.getElementById('adminBooksList');
        booksList.innerHTML = '';

        const books = this.store.getBooks();

        if (books.length === 0) {
            booksList.innerHTML = '<p>Книги не найдены</p>';
            return;
        }

        books.forEach(book => {
            const item = document.createElement('div');
            item.className = 'admin-book-item';
            
            const statusText = {
                'available': 'Доступна',
                'rented': 'В аренде',
                'sold': 'Продана'
            };

            item.innerHTML = `
                <div class="admin-book-info">
                    <div><strong>${book.title}</strong> - ${book.author}</div>
                    <div>Год: ${book.year} | Категория: ${book.category}</div>
                    <div>Цена: ${book.price} ₽ | Статус: ${statusText[book.status]} | Доступность: ${book.available ? 'Да' : 'Нет'}</div>
                </div>
                <div class="admin-book-actions">
                    <button class="btn-edit" onclick="app.editBook(${book.id})">Редактировать</button>
                    <button class="btn-danger" onclick="app.deleteBook(${book.id})">Удалить</button>
                </div>
            `;
            booksList.appendChild(item);
        });
    }

    editBook(id) {
        const book = this.store.getBooks().find(b => b.id === id);
        if (!book) return;

        this.currentBookId = id;
        document.getElementById('bookId').value = id;
        document.getElementById('bookTitle').value = book.title;
        document.getElementById('bookAuthor').value = book.author;
        document.getElementById('bookYear').value = book.year;
        document.getElementById('bookCategory').value = book.category;
        document.getElementById('bookPrice').value = book.price;
        document.getElementById('rentPrice2Weeks').value = book.rentPrice2Weeks;
        document.getElementById('rentPriceMonth').value = book.rentPriceMonth;
        document.getElementById('rentPrice3Months').value = book.rentPrice3Months;
        document.getElementById('bookStatus').value = book.status;
        document.getElementById('bookAvailability').value = book.available.toString();

        document.getElementById('bookForm').scrollIntoView({ behavior: 'smooth' });
    }

    saveBook() {
        const id = document.getElementById('bookId').value;
        const bookData = {
            title: document.getElementById('bookTitle').value,
            author: document.getElementById('bookAuthor').value,
            year: parseInt(document.getElementById('bookYear').value),
            category: document.getElementById('bookCategory').value,
            price: parseFloat(document.getElementById('bookPrice').value),
            rentPrice2Weeks: parseFloat(document.getElementById('rentPrice2Weeks').value),
            rentPriceMonth: parseFloat(document.getElementById('rentPriceMonth').value),
            rentPrice3Months: parseFloat(document.getElementById('rentPrice3Months').value),
            status: document.getElementById('bookStatus').value,
            available: document.getElementById('bookAvailability').value === 'true'
        };

        if (id) {
            this.store.updateBook(parseInt(id), bookData);
            this.showNotification('Книга обновлена');
        } else {
            this.store.addBook(bookData);
            this.showNotification('Книга добавлена');
        }

        this.resetForm();
        this.displayAdminBooks();
        this.populateFilters();
    }

    async deleteBook(id) {
        const book = this.store.getBooks().find(b => b.id === id);
        const bookTitle = book ? `"${book.title}"` : 'эту книгу';
        const confirmed = await this.showConfirm(
            'Удаление книги',
            `Вы уверены, что хотите удалить книгу ${bookTitle}? Это действие нельзя отменить.`
        );
        
        if (confirmed) {
            this.store.deleteBook(id);
            this.showNotification('Книга удалена', 'success');
            this.displayAdminBooks();
            this.populateFilters();
            if (document.getElementById('userInterface').classList.contains('active')) {
                this.displayBooks();
            }
        }
    }

    resetForm() {
        this.currentBookId = null;
        document.getElementById('bookForm').reset();
        document.getElementById('bookId').value = '';
    }

    displayRentals() {
        const rentalsList = document.getElementById('rentalsList');
        rentalsList.innerHTML = '';

        const rentals = this.store.getRentals();
        const books = this.store.getBooks();

        if (rentals.length === 0) {
            rentalsList.innerHTML = '<p>Нет активных аренд</p>';
            return;
        }

        rentals.forEach(rental => {
            const book = books.find(b => b.id === rental.bookId);
            if (!book) return;

            const startDate = new Date(rental.startDate);
            const endDate = new Date(rental.endDate);
            const now = new Date();
            const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

            const item = document.createElement('div');
            item.className = `rental-item ${daysLeft <= 3 ? 'expiring' : ''}`;
            
            item.innerHTML = `
                <div class="rental-info">
                    <strong>${rental.bookTitle}</strong>
                </div>
                <div class="rental-dates">
                    Начало: ${startDate.toLocaleDateString('ru-RU')} | 
                    Окончание: ${endDate.toLocaleDateString('ru-RU')} | 
                    Осталось дней: ${daysLeft > 0 ? daysLeft : 'Просрочено'}
                </div>
                <div class="rental-dates">
                    Цена аренды: ${rental.price} ₽
                </div>
                ${daysLeft <= 3 ? '<div style="color: #dc3545; font-weight: bold; margin-top: 0.5rem;">⚠️ Срок аренды скоро истекает!</div>' : ''}
            `;
            rentalsList.appendChild(item);
        });
    }

    checkRentalReminders() {
        const rentals = this.store.getRentals();
        const now = new Date();
        let hasNotifications = false;

        rentals.forEach(rental => {
            const endDate = new Date(rental.endDate);
            const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

            // Напоминание за 3 дня до окончания
            if (daysLeft <= 3 && daysLeft > 0 && !rental.notified) {
                this.store.updateRental(rental.id, { notified: true });
                hasNotifications = true;
                
                // Показываем уведомление только если открыт интерфейс администратора
                if (document.getElementById('adminInterface').classList.contains('active')) {
                    setTimeout(() => {
                        this.showNotification(
                            `⚠️ Срок аренды книги "${rental.bookTitle}" истекает через ${daysLeft} ${daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дня' : 'дней'}`,
                            'warning'
                        );
                    }, 100);
                }
            }

            // Автоматическое освобождение книги после окончания срока
            if (daysLeft <= 0) {
                const book = this.store.getBooks().find(b => b.id === rental.bookId);
                if (book && book.status === 'rented') {
                    this.store.updateBook(rental.bookId, {
                        status: 'available',
                        available: true
                    });
                    this.store.removeRental(rental.id);
                }
            }
        });

        if (hasNotifications && document.getElementById('adminInterface').classList.contains('active')) {
            this.displayRentals();
            this.displayAdminBooks();
        }
    }

    showNotification(message, type = 'success') {
        // Удаляем предыдущие уведомления
        document.querySelectorAll('.notification').forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Автоматическое удаление через 4 секунды
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 4000);
    }

    showConfirm(title, message) {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirmModal');
            const titleEl = document.getElementById('confirmTitle');
            const messageEl = document.getElementById('confirmMessage');
            const yesBtn = document.getElementById('confirmYes');
            const noBtn = document.getElementById('confirmNo');

            titleEl.textContent = title;
            messageEl.textContent = message;

            // Удаляем старые обработчики
            const newYesBtn = yesBtn.cloneNode(true);
            const newNoBtn = noBtn.cloneNode(true);
            yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
            noBtn.parentNode.replaceChild(newNoBtn, noBtn);

            // Добавляем новые обработчики
            newYesBtn.addEventListener('click', () => {
                modal.style.display = 'none';
                resolve(true);
            });

            newNoBtn.addEventListener('click', () => {
                modal.style.display = 'none';
                resolve(false);
            });

            // Закрытие по клику вне модального окна
            const closeOnOutside = (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                    modal.removeEventListener('click', closeOnOutside);
                    resolve(false);
                }
            };
            modal.addEventListener('click', closeOnOutside);

            // Закрытие по Escape
            const closeOnEscape = (e) => {
                if (e.key === 'Escape') {
                    modal.style.display = 'none';
                    document.removeEventListener('keydown', closeOnEscape);
                    modal.removeEventListener('click', closeOnOutside);
                    resolve(false);
                }
            };
            document.addEventListener('keydown', closeOnEscape);

            modal.style.display = 'block';
        });
    }
}

// Инициализация приложения
const app = new App();
