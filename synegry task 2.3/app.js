// Система уведомлений
const Notification = {
    show: (message, type = 'info', title = '') => {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
        `;
        
        container.appendChild(toast);
        
        // Автоматическое удаление через 3 секунды
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }
        }, 3000);
    },
    
    success: (message, title = 'Успешно') => Notification.show(message, 'success', title),
    error: (message, title = 'Ошибка') => Notification.show(message, 'error', title),
    warning: (message, title = 'Внимание') => Notification.show(message, 'warning', title),
    info: (message, title = 'Информация') => Notification.show(message, 'info', title)
};

// Система подтверждения
const Confirm = {
    show: (message, title = 'Подтверждение') => {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirmModal');
            const titleEl = document.getElementById('confirmTitle');
            const messageEl = document.getElementById('confirmMessage');
            const yesBtn = document.getElementById('confirmYes');
            const noBtn = document.getElementById('confirmNo');
            
            titleEl.textContent = title;
            messageEl.textContent = message;
            
            modal.style.display = 'block';
            
            const cleanup = () => {
                modal.style.display = 'none';
                yesBtn.removeEventListener('click', yesHandler);
                noBtn.removeEventListener('click', noHandler);
            };
            
            const yesHandler = () => {
                cleanup();
                resolve(true);
            };
            
            const noHandler = () => {
                cleanup();
                resolve(false);
            };
            
            yesBtn.addEventListener('click', yesHandler);
            noBtn.addEventListener('click', noHandler);
            
            // Закрытие при клике вне модального окна
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    noHandler();
                }
            });
        });
    }
};

// Утилиты для работы с Local Storage
const Storage = {
    get: (key) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Ошибка чтения из Local Storage:', e);
            return null;
        }
    },
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                Notification.error('Недостаточно места в хранилище. Пожалуйста, очистите данные.', 'Ошибка хранилища');
            } else {
                console.error('Ошибка записи в Local Storage:', e);
                Notification.error('Ошибка сохранения данных', 'Ошибка');
            }
        }
    },
    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Ошибка удаления из Local Storage:', e);
        }
    }
};

// Ключи для Local Storage
const STORAGE_KEYS = {
    USERS: 'blog_users',
    POSTS: 'blog_posts',
    SUBSCRIPTIONS: 'blog_subscriptions',
    REQUESTS: 'blog_requests',
    COMMENTS: 'blog_comments',
    CURRENT_USER: 'blog_current_user'
};

// Инициализация данных
function initStorage() {
    if (!Storage.get(STORAGE_KEYS.USERS)) {
        Storage.set(STORAGE_KEYS.USERS, []);
    }
    if (!Storage.get(STORAGE_KEYS.POSTS)) {
        Storage.set(STORAGE_KEYS.POSTS, []);
    }
    if (!Storage.get(STORAGE_KEYS.SUBSCRIPTIONS)) {
        Storage.set(STORAGE_KEYS.SUBSCRIPTIONS, {});
    }
    if (!Storage.get(STORAGE_KEYS.REQUESTS)) {
        Storage.set(STORAGE_KEYS.REQUESTS, {});
    }
    if (!Storage.get(STORAGE_KEYS.COMMENTS)) {
        Storage.set(STORAGE_KEYS.COMMENTS, {});
    }
}

// Управление пользователями
const UserManager = {
    register: (username, password, email) => {
        const users = Storage.get(STORAGE_KEYS.USERS) || [];
        if (users.find(u => u.username === username)) {
            return { success: false, message: 'Пользователь с таким именем уже существует' };
        }
        const newUser = {
            id: Date.now().toString(),
            username,
            password, // В реальном приложении нужно хешировать
            email: email || '',
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        Storage.set(STORAGE_KEYS.USERS, users);
        return { success: true, user: newUser };
    },
    login: (username, password) => {
        const users = Storage.get(STORAGE_KEYS.USERS) || [];
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            Storage.set(STORAGE_KEYS.CURRENT_USER, user);
            return { success: true, user };
        }
        return { success: false, message: 'Неверное имя пользователя или пароль' };
    },
    logout: () => {
        Storage.remove(STORAGE_KEYS.CURRENT_USER);
    },
    getCurrentUser: () => {
        return Storage.get(STORAGE_KEYS.CURRENT_USER);
    },
    getAllUsers: () => {
        return Storage.get(STORAGE_KEYS.USERS) || [];
    }
};

// Управление постами
const PostManager = {
    create: (authorId, title, content, tags, isPublic, isRequestOnly) => {
        const posts = Storage.get(STORAGE_KEYS.POSTS) || [];
        const newPost = {
            id: Date.now().toString(),
            authorId,
            title,
            content,
            tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
            isPublic: isPublic || false,
            isRequestOnly: isRequestOnly || false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        posts.push(newPost);
        Storage.set(STORAGE_KEYS.POSTS, posts);
        return newPost;
    },
    update: (postId, title, content, tags, isPublic, isRequestOnly) => {
        const posts = Storage.get(STORAGE_KEYS.POSTS) || [];
        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex === -1) return null;
        posts[postIndex] = {
            ...posts[postIndex],
            title,
            content,
            tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
            isPublic: isPublic || false,
            isRequestOnly: isRequestOnly || false,
            updatedAt: new Date().toISOString()
        };
        Storage.set(STORAGE_KEYS.POSTS, posts);
        return posts[postIndex];
    },
    delete: (postId) => {
        const posts = Storage.get(STORAGE_KEYS.POSTS) || [];
        const filteredPosts = posts.filter(p => p.id !== postId);
        Storage.set(STORAGE_KEYS.POSTS, filteredPosts);
        // Удаляем комментарии к посту
        const comments = Storage.get(STORAGE_KEYS.COMMENTS) || {};
        delete comments[postId];
        Storage.set(STORAGE_KEYS.COMMENTS, comments);
    },
    getAll: () => {
        return Storage.get(STORAGE_KEYS.POSTS) || [];
    },
    getById: (postId) => {
        const posts = Storage.get(STORAGE_KEYS.POSTS) || [];
        return posts.find(p => p.id === postId);
    },
    getByAuthor: (authorId) => {
        const posts = Storage.get(STORAGE_KEYS.POSTS) || [];
        return posts.filter(p => p.authorId === authorId);
    },
    getPublic: () => {
        const posts = Storage.get(STORAGE_KEYS.POSTS) || [];
        return posts.filter(p => p.isPublic && !p.isRequestOnly);
    },
    getBySubscriptions: (userId) => {
        const subscriptions = Storage.get(STORAGE_KEYS.SUBSCRIPTIONS) || {};
        const subscribedUsers = subscriptions[userId] || [];
        const posts = Storage.get(STORAGE_KEYS.POSTS) || [];
        return posts.filter(p => 
            subscribedUsers.includes(p.authorId) && 
            (p.isPublic || p.authorId === userId)
        );
    },
    canView: (post, userId) => {
        if (post.authorId === userId) return true;
        if (post.isPublic && !post.isRequestOnly) return true;
        if (post.isRequestOnly) {
            const requests = Storage.get(STORAGE_KEYS.REQUESTS) || {};
            const postRequests = requests[post.id] || [];
            return postRequests.some(r => r.userId === userId && r.approved);
        }
        return false;
    }
};

// Управление подписками
const SubscriptionManager = {
    subscribe: (userId, targetUserId) => {
        const subscriptions = Storage.get(STORAGE_KEYS.SUBSCRIPTIONS) || {};
        if (!subscriptions[userId]) {
            subscriptions[userId] = [];
        }
        if (!subscriptions[userId].includes(targetUserId)) {
            subscriptions[userId].push(targetUserId);
            Storage.set(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions);
        }
    },
    unsubscribe: (userId, targetUserId) => {
        const subscriptions = Storage.get(STORAGE_KEYS.SUBSCRIPTIONS) || {};
        if (subscriptions[userId]) {
            subscriptions[userId] = subscriptions[userId].filter(id => id !== targetUserId);
            Storage.set(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions);
        }
    },
    getSubscriptions: (userId) => {
        const subscriptions = Storage.get(STORAGE_KEYS.SUBSCRIPTIONS) || {};
        return subscriptions[userId] || [];
    },
    isSubscribed: (userId, targetUserId) => {
        const subscriptions = Storage.get(STORAGE_KEYS.SUBSCRIPTIONS) || {};
        return subscriptions[userId]?.includes(targetUserId) || false;
    }
};

// Управление запросами доступа
const RequestManager = {
    create: (postId, userId, message) => {
        const requests = Storage.get(STORAGE_KEYS.REQUESTS) || {};
        if (!requests[postId]) {
            requests[postId] = [];
        }
        const newRequest = {
            id: Date.now().toString(),
            userId,
            message: message || '',
            approved: false,
            createdAt: new Date().toISOString()
        };
        requests[postId].push(newRequest);
        Storage.set(STORAGE_KEYS.REQUESTS, requests);
        return newRequest;
    },
    approve: (postId, requestId) => {
        const requests = Storage.get(STORAGE_KEYS.REQUESTS) || {};
        if (requests[postId]) {
            const request = requests[postId].find(r => r.id === requestId);
            if (request) {
                request.approved = true;
                Storage.set(STORAGE_KEYS.REQUESTS, requests);
            }
        }
    },
    getByPost: (postId) => {
        const requests = Storage.get(STORAGE_KEYS.REQUESTS) || {};
        return requests[postId] || [];
    }
};

// Управление комментариями
const CommentManager = {
    add: (postId, authorId, text) => {
        const comments = Storage.get(STORAGE_KEYS.COMMENTS) || {};
        if (!comments[postId]) {
            comments[postId] = [];
        }
        const newComment = {
            id: Date.now().toString(),
            authorId,
            text,
            createdAt: new Date().toISOString()
        };
        comments[postId].push(newComment);
        Storage.set(STORAGE_KEYS.COMMENTS, comments);
        return newComment;
    },
    getByPost: (postId) => {
        const comments = Storage.get(STORAGE_KEYS.COMMENTS) || {};
        return comments[postId] || [];
    }
};

// UI Управление
const UI = {
    currentView: 'feed',
    currentTagFilter: null,
    currentPostId: null,
    
    init: () => {
        initStorage();
        UI.setupEventListeners();
        UI.checkAuth();
        UI.handleRouting();
        
        // Обработка изменений hash для навигации
        window.addEventListener('hashchange', () => {
            UI.handleRouting();
        });
    },
    
    handleRouting: () => {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#post/')) {
            const postId = hash.replace('#post/', '');
            UI.showSinglePost(postId);
        } else {
            UI.showMainView();
        }
    },
    
    showMainView: () => {
        window.location.hash = '';
        document.getElementById('singlePostView').style.display = 'none';
        document.getElementById('postsContainer').style.display = 'block';
        UI.currentPostId = null;
        const user = UserManager.getCurrentUser();
        if (user) {
            UI.loadPosts();
        } else {
            UI.showPublicPosts();
        }
    },
    
    showPublicPostsView: () => {
        window.location.hash = '';
        document.getElementById('singlePostView').style.display = 'none';
        document.getElementById('postsContainer').style.display = 'block';
        UI.currentPostId = null;
        UI.currentView = 'public';
        // Сбрасываем активную кнопку в сайдбаре, если есть
        document.querySelectorAll('.sidebar-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        UI.showPublicPosts();
    },
    
    showPublicPosts: () => {
        const posts = PostManager.getPublic();
        posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        UI.renderPosts(posts, true);
    },
    
    setupEventListeners: () => {
        // Переход на главную при клике на логотип (публичные посты)
        document.getElementById('logo').addEventListener('click', () => {
            UI.showPublicPostsView();
        });
        
        // Авторизация
        document.getElementById('loginBtn').addEventListener('click', () => UI.showAuthModal('login'));
        document.getElementById('registerBtn').addEventListener('click', () => UI.showAuthModal('register'));
        document.getElementById('logoutBtn').addEventListener('click', UI.logout);
        document.getElementById('authForm').addEventListener('submit', UI.handleAuth);
        document.getElementById('switchLink').addEventListener('click', (e) => {
            e.preventDefault();
            const isLogin = document.getElementById('modalTitle').textContent === 'Вход';
            UI.showAuthModal(isLogin ? 'register' : 'login');
        });
        
        // Закрытие модальных окон
        document.querySelectorAll('.close').forEach(close => {
            close.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });
        
        // Закрытие модальных окон при клике вне их области
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
        
        // Создание поста
        document.getElementById('createPostForm').addEventListener('submit', UI.handleCreatePost);
        
        // Редактирование поста
        document.getElementById('editPostForm').addEventListener('submit', UI.handleEditPost);
        
        // Боковая панель
        document.querySelectorAll('.sidebar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                UI.switchView(view);
            });
        });
        
        // Запрос доступа
        document.getElementById('sendRequestBtn').addEventListener('click', UI.handleSendRequest);
        document.getElementById('cancelRequestBtn').addEventListener('click', () => {
            document.getElementById('requestAccessModal').style.display = 'none';
        });
        
        // Закрытие модального окна подтверждения
        const confirmModal = document.getElementById('confirmModal');
        const confirmClose = document.querySelector('.confirm-close');
        if (confirmClose) {
            confirmClose.addEventListener('click', () => {
                document.getElementById('confirmNo').click();
            });
        }
        if (confirmModal) {
            // Добавляем обработчик для закрытия при клике вне области
            confirmModal.addEventListener('click', (e) => {
                if (e.target === confirmModal) {
                    document.getElementById('confirmNo').click();
                }
            });
        }
    },
    
    checkAuth: () => {
        const user = UserManager.getCurrentUser();
        if (user) {
            UI.showAuthenticatedUI(user);
        } else {
            UI.showUnauthenticatedUI();
        }
    },
    
    showAuthenticatedUI: (user) => {
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('registerBtn').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'block';
        document.getElementById('userName').style.display = 'block';
        document.getElementById('userName').textContent = user.username;
        document.getElementById('sidebar').style.display = 'block';
        document.getElementById('createPostSection').style.display = 'block';
        UI.loadPosts();
        UI.updateTagFilter();
    },
    
    showUnauthenticatedUI: () => {
        document.getElementById('loginBtn').style.display = 'block';
        document.getElementById('registerBtn').style.display = 'block';
        document.getElementById('logoutBtn').style.display = 'none';
        document.getElementById('userName').style.display = 'none';
        document.getElementById('sidebar').style.display = 'none';
        document.getElementById('createPostSection').style.display = 'none';
        document.getElementById('postsContainer').style.display = 'block';
        document.getElementById('singlePostView').style.display = 'none';
        UI.showPublicPosts();
    },
    
    showAuthModal: (mode) => {
        const modal = document.getElementById('authModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('authForm');
        const emailGroup = document.getElementById('emailGroup');
        const switchText = document.getElementById('switchAuth');
        const switchLink = document.getElementById('switchLink');
        
        if (mode === 'register') {
            title.textContent = 'Регистрация';
            form.querySelector('button').textContent = 'Зарегистрироваться';
            emailGroup.style.display = 'block';
            switchText.innerHTML = 'Уже есть аккаунт? <a href="#" id="switchLink">Войти</a>';
        } else {
            title.textContent = 'Вход';
            form.querySelector('button').textContent = 'Войти';
            emailGroup.style.display = 'none';
            switchText.innerHTML = 'Нет аккаунта? <a href="#" id="switchLink">Зарегистрироваться</a>';
        }
        
        document.getElementById('switchLink').addEventListener('click', (e) => {
            e.preventDefault();
            UI.showAuthModal(mode === 'register' ? 'login' : 'register');
        });
        
        modal.style.display = 'block';
        form.reset();
    },
    
    handleAuth: (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const email = document.getElementById('email').value;
        const isRegister = document.getElementById('modalTitle').textContent === 'Регистрация';
        
        let result;
        if (isRegister) {
            result = UserManager.register(username, password, email);
        } else {
            result = UserManager.login(username, password);
        }
        
        if (result.success) {
            Notification.success(isRegister ? 'Регистрация успешна!' : 'Вход выполнен!', isRegister ? 'Добро пожаловать!' : 'Успешный вход');
            document.getElementById('authModal').style.display = 'none';
            UI.checkAuth();
        } else {
            Notification.error(result.message || 'Ошибка при выполнении операции', 'Ошибка');
        }
    },
    
    logout: () => {
        UserManager.logout();
        UI.checkAuth();
    },
    
    handleCreatePost: (e) => {
        e.preventDefault();
        const user = UserManager.getCurrentUser();
        if (!user) return;
        
        const title = document.getElementById('postTitle').value;
        const content = document.getElementById('postContent').value;
        const tags = document.getElementById('postTags').value;
        const isPublic = document.getElementById('postIsPublic').checked;
        const isRequestOnly = document.getElementById('postIsRequestOnly').checked;
        
        PostManager.create(user.id, title, content, tags, isPublic, isRequestOnly);
        e.target.reset();
        Notification.success('Пост успешно создан!', 'Успешно');
        UI.loadPosts();
        UI.updateTagFilter();
    },
    
    handleEditPost: (e) => {
        e.preventDefault();
        const postId = document.getElementById('editPostId').value;
        const title = document.getElementById('editPostTitle').value;
        const content = document.getElementById('editPostContent').value;
        const tags = document.getElementById('editPostTags').value;
        const isPublic = document.getElementById('editPostIsPublic').checked;
        const isRequestOnly = document.getElementById('editPostIsRequestOnly').checked;
        
        PostManager.update(postId, title, content, tags, isPublic, isRequestOnly);
        document.getElementById('editPostModal').style.display = 'none';
        Notification.success('Пост успешно обновлен!', 'Успешно');
        
        // Если мы на странице отдельного поста, обновляем её, иначе обновляем список
        if (UI.currentPostId === postId) {
            UI.showSinglePost(postId);
        } else {
            UI.loadPosts();
        }
        UI.updateTagFilter();
    },
    
    switchView: (view) => {
        UI.currentView = view;
        UI.currentPostId = null;
        window.location.hash = '';
        document.getElementById('singlePostView').style.display = 'none';
        document.getElementById('postsContainer').style.display = 'block';
        document.querySelectorAll('.sidebar-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === view) {
                btn.classList.add('active');
            }
        });
        UI.loadPosts();
        UI.updateTagFilter();
    },
    
    loadPosts: () => {
        const user = UserManager.getCurrentUser();
        if (!user) return;
        
        let posts = [];
        
        switch (UI.currentView) {
            case 'feed':
                posts = PostManager.getBySubscriptions(user.id);
                break;
            case 'public':
                posts = PostManager.getPublic();
                break;
            case 'my-posts':
                posts = PostManager.getByAuthor(user.id);
                break;
            case 'subscriptions':
                UI.showSubscriptions();
                return;
            case 'users':
                UI.showUsers();
                return;
        }
        
        // Фильтрация по тегам
        if (UI.currentTagFilter) {
            posts = posts.filter(p => p.tags.includes(UI.currentTagFilter));
        }
        
        // Сортировка по дате
        posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        UI.renderPosts(posts);
    },
    
    renderPosts: (posts, isPublicView = false) => {
        const container = document.getElementById('postsContainer');
        const user = UserManager.getCurrentUser();
        const users = UserManager.getAllUsers();
        
        if (posts.length === 0) {
            container.innerHTML = '<div class="welcome-message"><p>Постов пока нет</p></div>';
            return;
        }
        
        container.innerHTML = posts.map(post => {
            const author = users.find(u => u.id === post.authorId);
            const canView = PostManager.canView(post, user?.id || null);
            const isAuthor = post.authorId === user?.id;
            const comments = CommentManager.getByPost(post.id);
            
            if (!canView && !isAuthor) {
                return `
                    <div class="post">
                        <div class="post-header">
                            <div class="post-author">👤 ${author?.username || 'Неизвестный'}</div>
                            <div class="post-date">${new Date(post.createdAt).toLocaleString('ru-RU')}</div>
                        </div>
                        <h3 class="post-title">🔒 Скрытый пост</h3>
                        <p class="post-content">Этот пост доступен только по запросу</p>
                        ${post.isRequestOnly ? `
                            <button class="btn btn-primary" onclick="UI.requestAccess('${post.id}')">
                                Запросить доступ
                            </button>
                        ` : ''}
                    </div>
                `;
            }
            
            // Для главной страницы показываем превью, для остальных - полный пост
            const contentPreview = isPublicView && post.content.length > 200 
                ? post.content.substring(0, 200) + '...' 
                : post.content;
            const showReadMore = isPublicView && post.content.length > 200;
            
            return `
                <div class="post">
                    <div class="post-header">
                        <div class="post-author">👤 ${author?.username || 'Неизвестный'}</div>
                        <div class="post-date">${new Date(post.createdAt).toLocaleString('ru-RU')}</div>
                    </div>
                    ${post.isPublic ? '<span class="post-status status-public">Публичный</span>' : ''}
                    ${post.isRequestOnly ? '<span class="post-status status-request">По запросу</span>' : ''}
                    ${!post.isPublic && !post.isRequestOnly ? '<span class="post-status status-private">Приватный</span>' : ''}
                    <h3 class="post-title ${showReadMore ? 'post-title-link' : ''}" ${showReadMore ? `onclick="UI.showSinglePost('${post.id}')" style="cursor: pointer;"` : ''}>${post.title}</h3>
                    <p class="post-content">${contentPreview}</p>
                    ${showReadMore ? `
                        <button class="btn btn-primary read-more-btn" onclick="UI.showSinglePost('${post.id}')">
                            Читать далее →
                        </button>
                    ` : ''}
                    ${post.tags.length > 0 ? `
                        <div class="post-tags">
                            ${post.tags.map(tag => `<span class="tag" onclick="UI.filterByTag('${tag}')">#${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                    ${!isPublicView ? `
                        <div class="post-actions">
                            ${!isAuthor && user ? `
                                ${SubscriptionManager.isSubscribed(user.id, post.authorId) ? 
                                    `<button class="btn btn-secondary" onclick="UI.unsubscribe('${post.authorId}')">Отписаться</button>` :
                                    `<button class="btn btn-success" onclick="UI.subscribe('${post.authorId}')">Подписаться</button>`
                                }
                            ` : ''}
                            ${isAuthor ? `
                                <button class="btn btn-primary" onclick="UI.editPost('${post.id}')">Редактировать</button>
                                <button class="btn btn-danger" onclick="UI.deletePost('${post.id}')">Удалить</button>
                            ` : ''}
                        </div>
                        <div class="comments-section">
                            <h4>Комментарии (${comments.length})</h4>
                            <div class="comments-list">
                                ${comments.map(comment => {
                                    const commentAuthor = users.find(u => u.id === comment.authorId);
                                    return `
                                        <div class="comment">
                                            <div class="comment-author">👤 ${commentAuthor?.username || 'Неизвестный'}</div>
                                            <div class="comment-text">${comment.text}</div>
                                            <div class="post-date">${new Date(comment.createdAt).toLocaleString('ru-RU')}</div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                            ${user ? `
                                <div class="comment-form">
                                    <input type="text" id="comment-${post.id}" placeholder="Написать комментарий...">
                                    <button class="btn btn-primary" onclick="UI.addComment('${post.id}')">Отправить</button>
                                </div>
                            ` : `
                                <p style="color: #999; text-align: center; padding: 1rem;">
                                    <a href="#" onclick="event.preventDefault(); UI.showAuthModal('login');" style="color: #667eea;">Войдите</a>, чтобы оставить комментарий
                                </p>
                            `}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    },
    
    showSubscriptions: () => {
        const user = UserManager.getCurrentUser();
        const subscriptions = SubscriptionManager.getSubscriptions(user.id);
        const users = UserManager.getAllUsers();
        const container = document.getElementById('postsContainer');
        
        if (subscriptions.length === 0) {
            container.innerHTML = '<div class="welcome-message"><p>Вы ни на кого не подписаны</p></div>';
            return;
        }
        
        container.innerHTML = `
            <h2>Мои подписки</h2>
            <div class="users-list">
                ${subscriptions.map(subId => {
                    const subUser = users.find(u => u.id === subId);
                    if (!subUser) return '';
                    return `
                        <div class="user-item">
                            <div class="user-info">👤 ${subUser.username}</div>
                            <button class="btn btn-danger" onclick="UI.unsubscribe('${subId}')">Отписаться</button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },
    
    showUsers: () => {
        const user = UserManager.getCurrentUser();
        const users = UserManager.getAllUsers().filter(u => u.id !== user.id);
        const subscriptions = SubscriptionManager.getSubscriptions(user.id);
        const container = document.getElementById('postsContainer');
        
        container.innerHTML = `
            <h2>Все пользователи</h2>
            <div class="users-list">
                ${users.map(u => {
                    const isSubscribed = subscriptions.includes(u.id);
                    return `
                        <div class="user-item">
                            <div class="user-info">👤 ${u.username}</div>
                            ${isSubscribed ? 
                                `<button class="btn btn-danger" onclick="UI.unsubscribe('${u.id}')">Отписаться</button>` :
                                `<button class="btn btn-success" onclick="UI.subscribe('${u.id}')">Подписаться</button>`
                            }
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },
    
    subscribe: async (targetUserId) => {
        const user = UserManager.getCurrentUser();
        SubscriptionManager.subscribe(user.id, targetUserId);
        Notification.success('Подписка оформлена!', 'Успешно');
        UI.loadPosts();
    },
    
    unsubscribe: async (targetUserId) => {
        const user = UserManager.getCurrentUser();
        SubscriptionManager.unsubscribe(user.id, targetUserId);
        Notification.info('Отписка выполнена', 'Информация');
        UI.loadPosts();
    },
    
    editPost: (postId) => {
        const post = PostManager.getById(postId);
        if (!post) return;
        
        document.getElementById('editPostId').value = post.id;
        document.getElementById('editPostTitle').value = post.title;
        document.getElementById('editPostContent').value = post.content;
        document.getElementById('editPostTags').value = post.tags.join(', ');
        document.getElementById('editPostIsPublic').checked = post.isPublic;
        document.getElementById('editPostIsRequestOnly').checked = post.isRequestOnly;
        
        document.getElementById('editPostModal').style.display = 'block';
    },
    
    deletePost: async (postId) => {
        const confirmed = await Confirm.show('Вы уверены, что хотите удалить этот пост? Это действие нельзя отменить.', 'Подтверждение удаления');
        if (confirmed) {
            PostManager.delete(postId);
            Notification.success('Пост успешно удален!', 'Успешно');
            
            // Если мы на странице удаленного поста, возвращаемся на главную
            if (UI.currentPostId === postId) {
                UI.showMainView();
            } else {
                UI.loadPosts();
            }
            UI.updateTagFilter();
        }
    },
    
    addComment: (postId) => {
        const user = UserManager.getCurrentUser();
        if (!user) {
            Notification.warning('Войдите, чтобы оставить комментарий', 'Требуется авторизация');
            return;
        }
        
        const input = document.getElementById(`comment-${postId}`) || document.getElementById(`comment-single-${postId}`);
        if (!input) return;
        
        const text = input.value.trim();
        if (!text) return;
        
        CommentManager.add(postId, user.id, text);
        input.value = '';
        
        // Если мы на странице отдельного поста, обновляем её, иначе обновляем список
        if (UI.currentPostId === postId) {
            UI.showSinglePost(postId);
        } else {
            UI.loadPosts();
        }
    },
    
    requestAccess: (postId) => {
        UI.currentRequestPostId = postId;
        document.getElementById('requestAccessModal').style.display = 'block';
    },
    
    handleSendRequest: () => {
        const user = UserManager.getCurrentUser();
        const message = document.getElementById('requestMessage').value;
        RequestManager.create(UI.currentRequestPostId, user.id, message);
        document.getElementById('requestAccessModal').style.display = 'none';
        document.getElementById('requestMessage').value = '';
        Notification.success('Запрос отправлен! Автор поста получит уведомление.', 'Запрос отправлен');
        UI.loadPosts();
    },
    
    filterByTag: (tag) => {
        UI.currentTagFilter = UI.currentTagFilter === tag ? null : tag;
        document.querySelectorAll('.tag-filter-item').forEach(item => {
            item.classList.remove('active');
            if (item.textContent === tag && UI.currentTagFilter === tag) {
                item.classList.add('active');
            }
        });
        UI.loadPosts();
    },
    
    updateTagFilter: () => {
        const posts = PostManager.getAll();
        const allTags = [...new Set(posts.flatMap(p => p.tags))];
        const container = document.getElementById('tagFilter');
        
        if (allTags.length === 0) {
            container.innerHTML = '<p style="color: #999;">Тегов пока нет</p>';
            return;
        }
        
        container.innerHTML = allTags.map(tag => `
            <div class="tag-filter-item ${UI.currentTagFilter === tag ? 'active' : ''}" 
                 onclick="UI.filterByTag('${tag}')">
                #${tag}
            </div>
        `).join('');
    },
    
    showSinglePost: (postId) => {
        UI.currentPostId = postId;
        window.location.hash = `#post/${postId}`;
        
        const post = PostManager.getById(postId);
        if (!post) {
            Notification.error('Пост не найден', 'Ошибка');
            UI.showMainView();
            return;
        }
        
        const user = UserManager.getCurrentUser();
        const users = UserManager.getAllUsers();
        const author = users.find(u => u.id === post.authorId);
        const canView = PostManager.canView(post, user?.id);
        const isAuthor = post.authorId === user?.id;
        const comments = CommentManager.getByPost(post.id);
        
        if (!canView && !isAuthor) {
            Notification.warning('У вас нет доступа к этому посту', 'Доступ ограничен');
            UI.showMainView();
            return;
        }
        
        // Скрываем список постов и показываем страницу отдельного поста
        document.getElementById('postsContainer').style.display = 'none';
        document.getElementById('singlePostView').style.display = 'block';
        
        const singlePostContent = document.getElementById('singlePostContent');
        singlePostContent.innerHTML = `
            <div class="post single-post-full">
                <div class="post-header">
                    <div class="post-author">👤 ${author?.username || 'Неизвестный'}</div>
                    <div class="post-date">${new Date(post.createdAt).toLocaleString('ru-RU')}</div>
                </div>
                ${post.isPublic ? '<span class="post-status status-public">Публичный</span>' : ''}
                ${post.isRequestOnly ? '<span class="post-status status-request">По запросу</span>' : ''}
                ${!post.isPublic && !post.isRequestOnly ? '<span class="post-status status-private">Приватный</span>' : ''}
                <h1 class="post-title">${post.title}</h1>
                <div class="post-content-full">${post.content.replace(/\n/g, '<br>')}</div>
                ${post.tags.length > 0 ? `
                    <div class="post-tags">
                        ${post.tags.map(tag => `<span class="tag" onclick="UI.filterByTag('${tag}'); UI.showMainView();">#${tag}</span>`).join('')}
                    </div>
                ` : ''}
                <div class="post-actions">
                    ${!isAuthor && user ? `
                        ${SubscriptionManager.isSubscribed(user.id, post.authorId) ? 
                            `<button class="btn btn-secondary" onclick="UI.unsubscribe('${post.authorId}')">Отписаться</button>` :
                            `<button class="btn btn-success" onclick="UI.subscribe('${post.authorId}')">Подписаться</button>`
                        }
                    ` : ''}
                    ${isAuthor ? `
                        <button class="btn btn-primary" onclick="UI.editPost('${post.id}')">Редактировать</button>
                        <button class="btn btn-danger" onclick="UI.deletePost('${post.id}')">Удалить</button>
                    ` : ''}
                </div>
                <div class="comments-section">
                    <h3>Комментарии (${comments.length})</h3>
                    <div class="comments-list">
                        ${comments.map(comment => {
                            const commentAuthor = users.find(u => u.id === comment.authorId);
                            return `
                                <div class="comment">
                                    <div class="comment-author">👤 ${commentAuthor?.username || 'Неизвестный'}</div>
                                    <div class="comment-text">${comment.text}</div>
                                    <div class="post-date">${new Date(comment.createdAt).toLocaleString('ru-RU')}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    ${user ? `
                        <div class="comment-form">
                            <input type="text" id="comment-single-${post.id}" placeholder="Написать комментарий...">
                            <button class="btn btn-primary" onclick="UI.addComment('${post.id}'); UI.showSinglePost('${post.id}');">Отправить</button>
                        </div>
                    ` : `
                        <p style="color: #999; text-align: center; padding: 1rem;">
                            <a href="#" onclick="event.preventDefault(); UI.showAuthModal('login');" style="color: #667eea;">Войдите</a>, чтобы оставить комментарий
                        </p>
                    `}
                </div>
            </div>
        `;
        
        // Добавляем обработчик Enter для комментариев
        setTimeout(() => {
            const commentInput = document.getElementById(`comment-single-${post.id}`);
            if (commentInput) {
                commentInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        UI.addComment(postId);
                        UI.showSinglePost(postId);
                    }
                });
            }
        }, 100);
    }
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
    setInterval(() => {
        if (UserManager.getCurrentUser()) {
            UI.updateTagFilter();
        }
    }, 1000);
});
