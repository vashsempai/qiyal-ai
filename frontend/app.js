// Qiyal.ai Frontend Application
// AI-powered freelance platform with social network

// Application State
let appState = {
  currentUser: {
    id: 1,
    name: 'Алексей Смирнов',
    avatar: 'АС',
    role: 'freelancer',
    email: 'alex@example.com',
    rating: 4.6,
    projects: 23,
    balance: 156800,
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
    hourlyRate: 7500
  },
  currentPage: 'home',
  currentTheme: localStorage.getItem('qiyal_theme') || 'light',
  currentFilter: 'all',
  searchTimeout: null,
  isAIAssistantOpen: false,
  isNotificationsOpen: false,
  activeChat: null,
  feedPage: 0
};

// Mock Data
const mockData = {
  categories: [
    { name: 'Веб-разработка', icon: 'monitor', count: 156 },
    { name: 'Мобильная разработка', icon: 'smartphone', count: 89 },
    { name: 'Дизайн и творчество', icon: 'palette', count: 203 },
    { name: 'Маркетинг и SMM', icon: 'trending-up', count: 134 },
    { name: 'Копирайтинг', icon: 'edit', count: 78 },
    { name: 'Прочие услуги', icon: 'settings', count: 112 }
  ],

  projects: [
    {
      id: 1,
      title: 'Разработка мобильного приложения для доставки еды',
      description: 'Создание современного iOS и Android приложения для службы доставки еды в Алматы. Требуется интеграция с картами, push-уведомления, система заказов.',
      budget: '450000-650000 ₸',
      deadline: '8-10 недель',
      skills: ['React Native', 'Node.js', 'Firebase', 'Maps API'],
      client: { name: 'FoodTech Kazakhstan', rating: 4.9, projects: 12, avatar: 'FK', verified: true },
      applicants: 23,
      views: 186,
      saves: 34,
      aiScore: 94,
      status: 'Срочный',
      category: 'Мобильная разработка',
      postedDate: '2024-10-01',
      featured: true
    },
    {
      id: 2,
      title: 'Редизайн корпоративного сайта IT-компании',
      description: 'Требуется полный редизайн корпоративного сайта с современным UX/UI дизайном.',
      budget: '280000-400000 ₸',
      deadline: '6 недель',
      skills: ['Figma', 'UI/UX', 'Web Design', 'Prototyping'],
      client: { name: 'TechCorp Solutions', rating: 4.8, projects: 23, avatar: 'TC', verified: true },
      applicants: 15,
      views: 128,
      saves: 22,
      aiScore: 87,
      status: 'Новый',
      category: 'Дизайн и творчество',
      postedDate: '2024-09-30',
      featured: false
    }
  ],

  talents: [
    {
      id: 1,
      name: 'Асель Нурланова',
      specialty: 'Full-Stack разработчик',
      location: 'Алматы, Казахстан',
      rating: 4.9,
      reviews: 52,
      hourlyRate: '8000-12000 ₸/час',
      responseTime: 'в течение 2 часов',
      skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
      avatar: 'АН',
      status: 'Доступен',
      projects: 52,
      badges: ['Top Performer', 'Fast Response']
    },
    {
      id: 2,
      name: 'Данияр Кенжебаев',
      specialty: 'UI/UX Designer',
      location: 'Нур-Султан, Казахстан',
      rating: 4.8,
      reviews: 38,
      hourlyRate: '6000-9000 ₸/час',
      responseTime: 'в течение 4 часов',
      skills: ['Figma', 'Adobe XD', 'Prototyping', 'User Research'],
      avatar: 'ДК',
      status: 'Занят',
      projects: 38,
      badges: ['Creative Excellence', 'User-Centered Design']
    }
  ],

  posts: [
    {
      id: 1,
      authorId: 2,
      authorName: 'Асель Нурланова',
      authorAvatar: 'АН',
      title: 'Работаю над Telegram ботом для e-commerce',
      content: 'Сегодня добавил интеграцию с **Kaspi Pay**. Скоро опубликую open-source пример!\n\nОсновные возможности:\n- Каталог товаров\n- Корзина\n- Оплата через Kaspi\n- Уведомления о статусе заказа',
      tags: ['Telegram', 'Bot', 'E-commerce', 'Kaspi'],
      createdAt: '2 часа назад',
      likes: 12,
      comments: 4,
      shares: 2,
      isLiked: false,
      isFollowing: false
    },
    {
      id: 2,
      authorId: 3,
      authorName: 'Данияр Кенжебаев',
      authorAvatar: 'ДК',
      title: 'UI/UX тренды 2025: что будет актуально',
      content: 'Делюсь своими наблюдениями о трендах в дизайне интерфейсов на следующий год:\n\n1. **Нейроморфизм 2.0** - эволюция скевоморфизма\n2. **AI-генерируемые иллюстрации**\n3. **Голосовые интерфейсы**',
      tags: ['UI/UX', 'Design', 'Trends', '2025'],
      createdAt: '5 часов назад',
      likes: 28,
      comments: 7,
      shares: 12,
      isLiked: true,
      isFollowing: true
    }
  ],

  conversations: [
    {
      id: 1,
      name: 'TechCorp Solutions',
      avatar: 'TC',
      lastMessage: 'Когда можем обсудить проект?',
      time: '10:30',
      unread: 2,
      active: true
    },
    {
      id: 2,
      name: 'Асель Нурланова',
      avatar: 'АН',
      lastMessage: 'Спасибо за рекомендацию!',
      time: 'Вчера',
      unread: 0,
      active: false
    }
  ],

  messages: [
    {
      id: 1,
      conversationId: 1,
      senderId: 'client',
      senderName: 'TechCorp Solutions',
      senderAvatar: 'TC',
      content: 'Здравствуйте! Рассматриваем ваше предложение по проекту.',
      time: '10:25',
      isOwn: false
    },
    {
      id: 2,
      conversationId: 1,
      senderId: appState.currentUser.id,
      senderName: appState.currentUser.name,
      senderAvatar: appState.currentUser.avatar,
      content: 'Отлично! Готов обсудить детали.',
      time: '10:27',
      isOwn: true
    },
    {
      id: 3,
      conversationId: 1,
      senderId: 'client',
      senderName: 'TechCorp Solutions',
      senderAvatar: 'TC',
      content: 'Когда можем обсудить проект?',
      time: '10:30',
      isOwn: false
    }
  ],

  notifications: [
    {
      id: 1,
      type: 'project_match',
      title: 'Новый подходящий проект',
      message: 'Найден проект с 94% совпадением ваших навыков',
      time: '5 минут назад',
      read: false
    },
    {
      id: 2,
      type: 'application_accepted',
      title: 'Заявка принята',
      message: 'TechCorp Solutions принял вашу заявку на проект',
      time: '2 часа назад',
      read: false
    },
    {
      id: 3,
      type: 'message',
      title: 'Новое сообщение',
      message: 'Асель Нурланова написала вам',
      time: '1 день назад',
      read: true
    }
  ]
};

// NDA Filter
const NDA_REGEX = /nda|confidential|secret|non-disclosure|конфиденциальный|секретно|неразглашение/gi;

function checkNDAContent(text) {
  const matches = text.match(NDA_REGEX);
  return matches ? matches.length > 0 : false;
}

// Utility Functions
function formatNumber(num) {
  return new Intl.NumberFormat('ru-RU').format(num);
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(dateString));
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 5000);
}

function showLoading() {
  document.getElementById('loadingOverlay').classList.add('loading-overlay--active');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.remove('loading-overlay--active');
}

// Theme Management
function toggleTheme() {
  const newTheme = appState.currentTheme === 'light' ? 'dark' : 'light';
  appState.currentTheme = newTheme;
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('qiyal_theme', newTheme);

  const themeIcon = document.querySelector('.theme-toggle__icon use');
  themeIcon.setAttribute('href', newTheme === 'light' ? '#icon-moon' : '#icon-sun');
}

function initTheme() {
  document.documentElement.setAttribute('data-theme', appState.currentTheme);
  const themeIcon = document.querySelector('.theme-toggle__icon use');
  themeIcon.setAttribute('href', appState.currentTheme === 'light' ? '#icon-moon' : '#icon-sun');
}

// Navigation
function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('page--active');
  });

  // Show selected page
  document.getElementById(pageId + 'Page').classList.add('page--active');

  // Update navigation
  document.querySelectorAll('.nav__link').forEach(link => {
    link.classList.remove('nav__link--active');
  });

  document.querySelectorAll(`[data-page="${pageId}"]`).forEach(link => {
    link.classList.add('nav__link--active');
  });

  appState.currentPage = pageId;

  // Load page-specific data
  switch(pageId) {
    case 'home':
      loadFeaturedProjects();
      break;
    case 'projects':
      loadProjects();
      break;
    case 'talents':
      loadTalents();
      break;
    case 'feed':
      loadFeedPosts();
      break;
    case 'chat':
      loadChatConversations();
      break;
    case 'profile':
      loadProfileData();
      break;
  }
}

// Role Switching
function switchRole(role) {
  appState.currentUser.role = role;

  // Update UI
  document.querySelectorAll('.role-switcher__btn').forEach(btn => {
    btn.classList.remove('role-switcher__btn--active');
  });

  document.querySelector(`[data-role="${role}"]`).classList.add('role-switcher__btn--active');

  // Update hero content
  const heroTitle = document.getElementById('heroTitle');
  const heroSubtitle = document.getElementById('heroSubtitle');

  if (role === 'freelancer') {
    heroTitle.textContent = 'Найдите идеальные проекты с AI';
    heroSubtitle.textContent = 'Персональные рекомендации на основе ваших навыков';
  } else {
    heroTitle.textContent = 'Найдите лучших исполнителей';
    heroSubtitle.textContent = 'AI поможет выбрать идеального фрилансера для вашего проекта';
  }

  // Update profile role
  document.querySelector('.user-profile__role').textContent = role === 'freelancer' ? 'Фрилансер' : 'Заказчик';

  showToast(`Переключено на режим "${role === 'freelancer' ? 'Фрилансер' : 'Заказчик'}"`, 'success');
}

// Search Functionality
function initSearch() {
  const searchInput = document.getElementById('searchInput');
  const debouncedSearch = debounce((query) => {
    performSearch(query);
  }, 300);

  searchInput.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
  });
}

function performSearch(query) {
  if (!query.trim()) {
    loadFeaturedProjects();
    return;
  }

  const filteredProjects = mockData.projects.filter(project => 
    project.title.toLowerCase().includes(query.toLowerCase()) ||
    project.description.toLowerCase().includes(query.toLowerCase()) ||
    project.skills.some(skill => skill.toLowerCase().includes(query.toLowerCase()))
  );

  renderProjects(filteredProjects, 'featuredProjectsGrid');
}

// Categories
function loadCategories() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;

  grid.innerHTML = mockData.categories.map(category => `
    <div class="category-card" onclick="filterByCategory('${category.name}')">
      <svg class="category-card__icon">
        <use href="#icon-${category.icon}"></use>
      </svg>
      <h3 class="category-card__name">${category.name}</h3>
      <p class="category-card__count">${formatNumber(category.count)} проектов</p>
    </div>
  `).join('');
}

function filterByCategory(categoryName) {
  const filteredProjects = mockData.projects.filter(project => 
    project.category === categoryName
  );

  showPage('projects');
  renderProjects(filteredProjects, 'projectsGrid');
  showToast(`Фильтр: ${categoryName}`);
}

// Projects
function loadFeaturedProjects() {
  const featuredProjects = mockData.projects.filter(project => project.featured);
  renderProjects(featuredProjects, 'featuredProjectsGrid');
}

function loadProjects() {
  renderProjects(mockData.projects, 'projectsGrid');
  initProjectFilters();
}

function renderProjects(projects, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (projects.length === 0) {
    container.innerHTML = '<p class="text-center">Проекты не найдены</p>';
    return;
  }

  container.innerHTML = projects.map(project => `
    <div class="project-card" onclick="openProjectModal(${project.id})">
      <div class="project-card__header">
        <h3 class="project-card__title">${project.title}</h3>
        <span class="project-card__status">${project.status}</span>
      </div>

      <p class="project-card__description">${project.description}</p>

      <div class="project-card__meta">
        <span class="project-card__budget">💰 ${project.budget}</span>
        <span class="project-card__deadline">⏰ ${project.deadline}</span>
        <span class="project-card__ai-score">🤖 AI Score: ${project.aiScore}%</span>
      </div>

      <div class="project-card__skills">
        ${project.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
      </div>

      <div class="project-card__footer">
        <div class="project-card__client">
          <div class="client-avatar">${project.client.avatar}</div>
          <span class="client-name">${project.client.name}</span>
          ${project.client.verified ? '<span title="Верифицирован">✓</span>' : ''}
        </div>

        <div class="project-card__stats">
          <span class="project-stat">
            <svg class="project-stat__icon"><use href="#icon-users"></use></svg>
            ${project.applicants}
          </span>
          <span class="project-stat">
            <svg class="project-stat__icon"><use href="#icon-eye"></use></svg>
            ${project.views}
          </span>
          <span class="project-stat">
            <svg class="project-stat__icon"><use href="#icon-bookmark"></use></svg>
            ${project.saves}
          </span>
        </div>
      </div>
    </div>
  `).join('');
}

function initProjectFilters() {
  // Category filter
  const categoryFilter = document.getElementById('categoryFilter');
  if (categoryFilter) {
    categoryFilter.innerHTML = '<option value="">Все категории</option>' +
      mockData.categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');

    categoryFilter.addEventListener('change', filterProjects);
  }

  // Budget range
  const budgetRange = document.getElementById('budgetRange');
  if (budgetRange) {
    budgetRange.addEventListener('input', (e) => {
      document.getElementById('budgetMax').textContent = formatNumber(e.target.value) + ' ₸';
      debounce(filterProjects, 300)();
    });
  }

  // Sort filter
  const sortFilter = document.getElementById('sortFilter');
  if (sortFilter) {
    sortFilter.addEventListener('change', filterProjects);
  }
}

function filterProjects() {
  let filteredProjects = [...mockData.projects];

  // Category filter
  const categoryFilter = document.getElementById('categoryFilter');
  if (categoryFilter && categoryFilter.value) {
    filteredProjects = filteredProjects.filter(project => 
      project.category === categoryFilter.value
    );
  }

  // Sort
  const sortFilter = document.getElementById('sortFilter');
  if (sortFilter) {
    switch (sortFilter.value) {
      case 'newest':
        filteredProjects.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
        break;
      case 'ai-score':
        filteredProjects.sort((a, b) => b.aiScore - a.aiScore);
        break;
    }
  }

  renderProjects(filteredProjects, 'projectsGrid');
}

function openProjectModal(projectId) {
  const project = mockData.projects.find(p => p.id === projectId);
  if (!project) return;

  const modal = document.getElementById('projectModal');
  const title = document.getElementById('projectModalTitle');
  const body = document.getElementById('projectModalBody');

  title.textContent = project.title;
  body.innerHTML = `
    <div class="project-detail">
      <p><strong>Описание:</strong></p>
      <p>${project.description}</p>

      <p><strong>Бюджет:</strong> ${project.budget}</p>
      <p><strong>Срок:</strong> ${project.deadline}</p>
      <p><strong>AI Score:</strong> ${project.aiScore}%</p>

      <p><strong>Необходимые навыки:</strong></p>
      <div class="skills-list">
        ${project.skills.map(skill => `<span class="skill-badge">${skill}</span>`).join('')}
      </div>

      <p><strong>О заказчике:</strong></p>
      <div class="client-info">
        <div class="client-avatar">${project.client.avatar}</div>
        <div>
          <strong>${project.client.name}</strong> ${project.client.verified ? '✓' : ''}<br>
          ⭐ ${project.client.rating} • ${project.client.projects} проектов
        </div>
      </div>

      <div style="margin-top: 20px;">
        <button class="btn btn--primary" onclick="applyToProject(${project.id})">
          Откликнуться на проект
        </button>
      </div>
    </div>
  `;

  modal.classList.add('modal--open');
}

function applyToProject(projectId) {
  showToast('Заявка отправлена!', 'success');
  closeModal();
}

// Talents
function loadTalents() {
  renderTalents(mockData.talents);
  initTalentFilters();
}

function renderTalents(talents) {
  const container = document.getElementById('talentsGrid');
  if (!container) return;

  container.innerHTML = talents.map(talent => `
    <div class="talent-card">
      <div class="talent-card__header">
        <div class="talent-card__avatar">${talent.avatar}</div>
        <div class="talent-card__info">
          <h3 class="talent-card__name">${talent.name}</h3>
          <p class="talent-card__specialty">${talent.specialty}</p>
          <p class="talent-card__location">${talent.location}</p>
        </div>
        <div class="talent-card__status talent-card__status--${talent.status.toLowerCase()}">${talent.status}</div>
      </div>

      <div class="talent-card__stats">
        <div class="talent-stat">
          <div class="talent-stat__value">⭐ ${talent.rating}</div>
          <div class="talent-stat__label">${talent.reviews} отзывов</div>
        </div>
        <div class="talent-stat">
          <div class="talent-stat__value">${talent.projects}</div>
          <div class="talent-stat__label">Проектов</div>
        </div>
        <div class="talent-stat">
          <div class="talent-stat__value">${talent.hourlyRate}</div>
          <div class="talent-stat__label">За час</div>
        </div>
      </div>

      <div class="talent-card__skills">
        ${talent.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
      </div>

      <div class="talent-card__badges">
        ${talent.badges.map(badge => `<span class="badge badge--success">${badge}</span>`).join('')}
      </div>

      <div class="talent-card__response">
        <small>Отвечает ${talent.responseTime}</small>
      </div>

      <div class="talent-card__actions">
        <button class="btn btn--primary" onclick="contactTalent(${talent.id})">
          Написать сообщение
        </button>
      </div>
    </div>
  `).join('');
}

function initTalentFilters() {
  // Skills filter
  const skillsFilter = document.getElementById('skillsFilter');
  if (skillsFilter) {
    skillsFilter.addEventListener('input', debounce(filterTalents, 300));
  }

  // Rate range
  const rateRange = document.getElementById('rateRange');
  if (rateRange) {
    rateRange.addEventListener('input', (e) => {
      document.getElementById('rateMax').textContent = formatNumber(e.target.value) + ' ₸';
      debounce(filterTalents, 300)();
    });
  }

  // Rating filter
  const ratingFilter = document.getElementById('ratingFilter');
  if (ratingFilter) {
    ratingFilter.addEventListener('change', filterTalents);
  }
}

function filterTalents() {
  let filteredTalents = [...mockData.talents];

  // Skills filter
  const skillsFilter = document.getElementById('skillsFilter');
  if (skillsFilter && skillsFilter.value) {
    const skills = skillsFilter.value.toLowerCase().split(',').map(s => s.trim());
    filteredTalents = filteredTalents.filter(talent => 
      skills.some(skill => 
        talent.skills.some(talentSkill => 
          talentSkill.toLowerCase().includes(skill)
        )
      )
    );
  }

  // Rating filter
  const ratingFilter = document.getElementById('ratingFilter');
  if (ratingFilter && ratingFilter.value) {
    const minRating = parseFloat(ratingFilter.value);
    filteredTalents = filteredTalents.filter(talent => talent.rating >= minRating);
  }

  renderTalents(filteredTalents);
}

function contactTalent(talentId) {
  const talent = mockData.talents.find(t => t.id === talentId);
  if (!talent) return;

  // Create new conversation or switch to existing
  showPage('chat');
  showToast(`Начат диалог с ${talent.name}`, 'success');
}

// Social Feed
function loadFeedPosts() {
  renderFeedPosts(mockData.posts);
  initFeedFilters();
}

function renderFeedPosts(posts) {
  const container = document.getElementById('feedPosts');
  if (!container) return;

  container.innerHTML = posts.map(post => `
    <article class="post-card">
      <div class="post-card__header">
        <div class="post-card__author">
          <div class="post-card__avatar">${post.authorAvatar}</div>
          <div class="post-card__author-info">
            <h4 class="post-card__author-name">${post.authorName}</h4>
            <p class="post-card__time">${post.createdAt}</p>
          </div>
        </div>
        <button class="post-card__follow ${post.isFollowing ? 'post-card__follow--following' : ''}" 
                onclick="toggleFollow(${post.authorId})">
          ${post.isFollowing ? 'Отписаться' : 'Подписаться'}
        </button>
      </div>

      <h2 class="post-card__title">${post.title}</h2>

      <div class="post-card__content">
        ${formatPostContent(post.content)}
      </div>

      <div class="post-card__tags">
        ${post.tags.map(tag => `<span class="tag" onclick="filterByTag('${tag}')">#${tag}</span>`).join('')}
      </div>

      <div class="post-card__actions">
        <div class="post-actions">
          <button class="post-action ${post.isLiked ? 'post-action--liked' : ''}" 
                  onclick="toggleLike(${post.id})">
            <svg class="post-action__icon">
              <use href="#icon-heart"></use>
            </svg>
            <span>${post.likes}</span>
          </button>

          <button class="post-action" onclick="showComments(${post.id})">
            <svg class="post-action__icon">
              <use href="#icon-message-circle"></use>
            </svg>
            <span>${post.comments}</span>
          </button>

          <button class="post-action" onclick="sharePost(${post.id})">
            <svg class="post-action__icon">
              <use href="#icon-send"></use>
            </svg>
            <span>${post.shares}</span>
          </button>
        </div>
      </div>
    </article>
  `).join('');
}

function formatPostContent(content) {
  // Simple markdown parsing
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

function initFeedFilters() {
  document.querySelectorAll('.feed-filter').forEach(filter => {
    filter.addEventListener('click', (e) => {
      document.querySelectorAll('.feed-filter').forEach(f => 
        f.classList.remove('feed-filter--active')
      );
      e.target.classList.add('feed-filter--active');

      const filterType = e.target.dataset.filter;
      filterFeedPosts(filterType);
    });
  });
}

function filterFeedPosts(filterType) {
  let filteredPosts = [...mockData.posts];

  switch (filterType) {
    case 'following':
      filteredPosts = filteredPosts.filter(post => post.isFollowing);
      break;
    case 'trending':
      filteredPosts = filteredPosts.sort((a, b) => 
        (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares)
      );
      break;
    default:
      // 'all' - no filtering
      break;
  }

  renderFeedPosts(filteredPosts);
}

function toggleFollow(authorId) {
  const posts = mockData.posts.filter(post => post.authorId === authorId);
  posts.forEach(post => {
    post.isFollowing = !post.isFollowing;
  });

  renderFeedPosts(mockData.posts);
  showToast(posts[0]?.isFollowing ? 'Подписка оформлена' : 'Отписка выполнена', 'success');
}

function toggleLike(postId) {
  const post = mockData.posts.find(p => p.id === postId);
  if (!post) return;

  post.isLiked = !post.isLiked;
  post.likes += post.isLiked ? 1 : -1;

  renderFeedPosts(mockData.posts);
}

function filterByTag(tag) {
  const filteredPosts = mockData.posts.filter(post => 
    post.tags.includes(tag)
  );

  renderFeedPosts(filteredPosts);
  showToast(`Фильтр по тегу: #${tag}`);
}

function sharePost(postId) {
  showToast('Ссылка скопирована в буфер обмена', 'success');
}

function showComments(postId) {
  showToast('Функция комментариев будет добавлена в следующем обновлении');
}

// Create Post
function initCreatePost() {
  const createPostBtn = document.getElementById('createPostBtn');
  const createPostModal = document.getElementById('createPostModal');
  const createPostForm = document.getElementById('createPostForm');
  const cancelPostBtn = document.getElementById('cancelPost');
  const previewToggle = document.getElementById('previewToggle');
  const postContent = document.getElementById('postContent');
  const postPreview = document.getElementById('postPreview');

  if (createPostBtn) {
    createPostBtn.addEventListener('click', () => {
      createPostModal.classList.add('modal--open');
    });
  }

  if (cancelPostBtn) {
    cancelPostBtn.addEventListener('click', () => {
      createPostModal.classList.remove('modal--open');
    });
  }

  if (previewToggle && postContent && postPreview) {
    let isPreview = false;

    previewToggle.addEventListener('click', () => {
      isPreview = !isPreview;

      if (isPreview) {
        postPreview.innerHTML = formatPostContent(postContent.value);
        postContent.style.display = 'none';
        postPreview.style.display = 'block';
        previewToggle.textContent = 'Edit';
      } else {
        postContent.style.display = 'block';
        postPreview.style.display = 'none';
        previewToggle.textContent = 'Preview';
      }
    });
  }

  if (createPostForm) {
    createPostForm.addEventListener('submit', (e) => {
      e.preventDefault();
      createPost();
    });
  }
}

function createPost() {
  const title = document.getElementById('postTitle').value.trim();
  const content = document.getElementById('postContent').value.trim();
  const tags = document.getElementById('postTags').value.split(',').map(t => t.trim()).filter(t => t);

  if (!title || !content) {
    showToast('Заполните все обязательные поля', 'error');
    return;
  }

  // NDA Filter
  if (checkNDAContent(title + ' ' + content)) {
    showToast('Пост содержит конфиденциальную информацию и не может быть опубликован', 'error');
    return;
  }

  const newPost = {
    id: Date.now(),
    authorId: appState.currentUser.id,
    authorName: appState.currentUser.name,
    authorAvatar: appState.currentUser.avatar,
    title,
    content,
    tags,
    createdAt: 'только что',
    likes: 0,
    comments: 0,
    shares: 0,
    isLiked: false,
    isFollowing: false
  };

  mockData.posts.unshift(newPost);

  // Close modal and clear form
  document.getElementById('createPostModal').classList.remove('modal--open');
  document.getElementById('createPostForm').reset();

  // Refresh feed
  if (appState.currentPage === 'feed') {
    renderFeedPosts(mockData.posts);
  }

  showToast('Пост опубликован!', 'success');
}

// Chat
function loadChatConversations() {
  const container = document.getElementById('chatConversations');
  if (!container) return;

  container.innerHTML = mockData.conversations.map(conv => `
    <div class="chat-conversation ${conv.active ? 'chat-conversation--active' : ''}"
         onclick="selectConversation(${conv.id})">
      <div class="chat-conversation__avatar">${conv.avatar}</div>
      <div class="chat-conversation__info">
        <h4 class="chat-conversation__name">${conv.name}</h4>
        <p class="chat-conversation__message">${conv.lastMessage}</p>
      </div>
      ${conv.unread > 0 ? `<span class="chat-unread">${conv.unread}</span>` : ''}
    </div>
  `).join('');

  if (mockData.conversations.find(c => c.active)) {
    loadChatMessages();
  }
}

function selectConversation(convId) {
  // Update active conversation
  mockData.conversations.forEach(conv => {
    conv.active = conv.id === convId;
    if (conv.active) conv.unread = 0;
  });

  appState.activeChat = convId;
  loadChatConversations();
  loadChatMessages();
}

function loadChatMessages() {
  const container = document.getElementById('chatMessages');
  if (!container || !appState.activeChat) return;

  const messages = mockData.messages.filter(msg => 
    msg.conversationId === appState.activeChat
  );

  container.innerHTML = messages.map(msg => `
    <div class="chat-message ${msg.isOwn ? 'chat-message--own' : ''}">
      <div class="chat-message__avatar">${msg.senderAvatar}</div>
      <div class="chat-message__content">
        ${msg.content}
        <small style="display: block; margin-top: 4px; opacity: 0.7;">${msg.time}</small>
      </div>
    </div>
  `).join('');

  container.scrollTop = container.scrollHeight;
}

function initChat() {
  const messageInput = document.getElementById('messageInput');
  const sendMessageBtn = document.getElementById('sendMessageBtn');

  if (messageInput && sendMessageBtn) {
    const sendMessage = () => {
      const content = messageInput.value.trim();
      if (!content || !appState.activeChat) return;

      const newMessage = {
        id: Date.now(),
        conversationId: appState.activeChat,
        senderId: appState.currentUser.id,
        senderName: appState.currentUser.name,
        senderAvatar: appState.currentUser.avatar,
        content,
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        isOwn: true
      };

      mockData.messages.push(newMessage);
      messageInput.value = '';
      loadChatMessages();

      // Update conversation last message
      const conv = mockData.conversations.find(c => c.id === appState.activeChat);
      if (conv) {
        conv.lastMessage = content;
        conv.time = newMessage.time;
        loadChatConversations();
      }
    };

    sendMessageBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
}

// Profile
function loadProfileData() {
  const skillsList = document.getElementById('skillsList');
  if (skillsList && appState.currentUser.skills) {
    skillsList.innerHTML = appState.currentUser.skills.map(skill => 
      `<span class="skill-badge">${skill}</span>`
    ).join('');
  }
}

// AI Assistant
function initAIAssistant() {
  const trigger = document.getElementById('aiAssistantTrigger');
  const close = document.getElementById('aiChatClose');
  const input = document.getElementById('aiInput');
  const send = document.getElementById('aiSend');

  if (trigger) {
    trigger.addEventListener('click', toggleAIAssistant);
  }

  if (close) {
    close.addEventListener('click', toggleAIAssistant);
  }

  if (input && send) {
    const sendAIMessage = () => {
      const message = input.value.trim();
      if (!message) return;

      addAIMessage(message, 'user');
      input.value = '';

      // Simulate AI response
      setTimeout(() => {
        const response = generateAIResponse(message);
        addAIMessage(response, 'assistant');
      }, 1000);
    };

    send.addEventListener('click', sendAIMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendAIMessage();
      }
    });
  }
}

function toggleAIAssistant() {
  const assistant = document.querySelector('.ai-assistant');
  appState.isAIAssistantOpen = !appState.isAIAssistantOpen;

  if (appState.isAIAssistantOpen) {
    assistant.classList.add('ai-assistant--open');
  } else {
    assistant.classList.remove('ai-assistant--open');
  }
}

function addAIMessage(content, type) {
  const container = document.getElementById('aiMessages');
  if (!container) return;

  const messageDiv = document.createElement('div');
  messageDiv.className = `ai-message ai-message--${type}`;

  if (type === 'assistant') {
    messageDiv.innerHTML = `
      <div class="ai-message__avatar">
        <svg class="ai-message__avatar-icon">
          <use href="#icon-robot"></use>
        </svg>
      </div>
      <div class="ai-message__content">
        <p>${content}</p>
      </div>
    `;
  } else {
    messageDiv.innerHTML = `
      <div class="ai-message__content" style="background: var(--accent-primary); color: white; margin-left: auto; max-width: 80%;">
        <p>${content}</p>
      </div>
    `;
  }

  container.appendChild(messageDiv);
  container.scrollTop = container.scrollHeight;
}

function generateAIResponse(userMessage) {
  const responses = {
    'проект': 'На основе ваших навыков я рекомендую обратить внимание на проект "Разработка мобильного приложения". Он имеет AI Score 94% совпадения с вашим профилем!',
    'навык': 'Рекомендую изучить TypeScript - это увеличит ваши шансы на получение высокооплачиваемых проектов на 35%.',
    'ставка': 'Судя по вашему опыту и рейтингу, вы можете повысить часовую ставку до 10,000 ₸. Это соответствует рыночным ценам для ваших навыков.',
    'карьера': 'Для развития карьеры советую: 1) Добавить в портфолио проект с микросервисной архитектурой, 2) Получить сертификацию AWS, 3) Изучить Docker и Kubernetes.',
    'default': 'Интересный вопрос! Как AI-ассистент Qiyal.ai, я помогаю с поиском проектов, оценкой навыков и планированием карьеры. Задайте более конкретный вопрос о работе или проектах.'
  };

  const lowerMessage = userMessage.toLowerCase();

  for (const [key, response] of Object.entries(responses)) {
    if (lowerMessage.includes(key)) {
      return response;
    }
  }

  return responses.default;
}

// Notifications
function initNotifications() {
  const trigger = document.getElementById('notificationsTrigger') || document.querySelector('.notifications__trigger');

  if (trigger) {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleNotifications();
    });
  }

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (appState.isNotificationsOpen && !e.target.closest('.notifications')) {
      toggleNotifications();
    }
  });

  loadNotifications();
}

function toggleNotifications() {
  const notifications = document.querySelector('.notifications');
  appState.isNotificationsOpen = !appState.isNotificationsOpen;

  if (appState.isNotificationsOpen) {
    notifications.classList.add('notifications--open');
  } else {
    notifications.classList.remove('notifications--open');
  }
}

function loadNotifications() {
  const container = document.getElementById('notificationsList');
  if (!container) return;

  container.innerHTML = mockData.notifications.map(notif => `
    <div class="notification ${notif.read ? '' : 'notification--unread'}">
      <h4 class="notification__title">${notif.title}</h4>
      <p class="notification__message">${notif.message}</p>
      <small class="notification__time">${notif.time}</small>
    </div>
  `).join('');

  // Update badge count
  const unreadCount = mockData.notifications.filter(n => !n.read).length;
  const badge = document.querySelector('.notifications__badge');
  if (badge) {
    badge.textContent = unreadCount;
    badge.style.display = unreadCount > 0 ? 'flex' : 'none';
  }
}

// Modal Management
function initModals() {
  // Close modals on backdrop click
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal__backdrop')) {
      closeModal();
    }
  });

  // Close modals on close button click
  document.querySelectorAll('.modal__close').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
}

function closeModal() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.classList.remove('modal--open');
  });
}

// Event Listeners
function initEventListeners() {
  // Navigation
  document.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = e.currentTarget.dataset.page;
      if (page) showPage(page);
    });
  });

  // Role switcher
  document.querySelectorAll('.role-switcher__btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const role = e.target.dataset.role;
      if (role) switchRole(role);
    });
  });

  // Theme toggle
  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}

// Application Initialization
function initApp() {
  // Initialize theme
  initTheme();

  // Initialize components
  initEventListeners();
  initSearch();
  initAIAssistant();
  initNotifications();
  initModals();
  initChat();
  initCreatePost();

  // Load initial data
  loadCategories();
  loadFeaturedProjects();

  // Show initial page
  showPage(appState.currentPage);

  console.log('🚀 Qiyal.ai приложение инициализировано');
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Error handling
window.addEventListener('error', (e) => {
  console.error('Application error:', e.error);
  showToast('Произошла ошибка. Перезагрузите страницу.', 'error');
});

// Service Worker registration (for PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('ServiceWorker registered'))
      .catch(() => console.log('ServiceWorker registration failed'));
  });
}

// Export for global access (if needed)
window.QiyalApp = {
  showToast,
  showPage,
  switchRole,
  toggleTheme,
  appState,
  mockData
};
