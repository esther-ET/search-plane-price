// ============================================
// 搜索页 JavaScript - 重构版本 v2
// 重构日期: 2026-04-11
// 交互模式: 点击确认筛选
// ============================================

// ============================================
// 1. 常量与配置
// ============================================
const CONFIG = {
  PRICE_MIN: 500,
  PRICE_MAX: 5000,
  PRICE_DEFAULT: 2500,
  DISCOUNT_SPECIAL_THRESHOLD: 40,
  AI_RECOMMENDATION_THRESHOLD: 70
};

// ============================================
// 2. 状态管理 - 集中管理应用状态
// ============================================
const FilterState = {
  // 原始数据
  allFlights: [],

  // 当前筛选后的航班
  filteredFlights: [],

  // 筛选条件（用户选择的条件）
  filters: {
    departureCity: '',
    arrivalCity: '',
    minPrice: CONFIG.PRICE_MIN,
    maxPrice: CONFIG.PRICE_MAX,
    airlines: [],
    cabins: ['经济舱'],
    specialOnly: false,
    preferDirect: false,
    allowTransit: true
  },

  // 排序
  sortBy: '价格从低到高',

  // AI推荐显示
  showAIRecommendations: true,

  // 是否已点击"确认筛选"
  isFilterConfirmed: false,

  // 重置为默认值
  reset() {
    this.filters = {
      departureCity: '',
      arrivalCity: '',
      minPrice: CONFIG.PRICE_MIN,
      maxPrice: CONFIG.PRICE_MAX,
      airlines: [],
      cabins: ['经济舱'],
      specialOnly: false,
      preferDirect: false,
      allowTransit: true
    };
    this.sortBy = '价格从低到高';
    this.isFilterConfirmed = false;
  }
};

// ============================================
// 3. 筛选引擎 - 纯函数，无副作用
// ============================================
const FilterEngine = {
  /**
   * 根据筛选条件过滤航班
   */
  apply(flights, filters) {
    return flights.filter(flight => this.passesFilter(flight, filters));
  },

  /**
   * 单个航班是否通过筛选
   */
  passesFilter(flight, filters) {
    // 出发城市
    if (filters.departureCity && !flight.departure.city.includes(filters.departureCity)) {
      return false;
    }

    // 到达城市
    if (filters.arrivalCity && !flight.arrival.city.includes(filters.arrivalCity)) {
      return false;
    }

    // 价格范围
    if (flight.price < filters.minPrice || flight.price > filters.maxPrice) {
      return false;
    }

    // 航空公司（空数组 = 全选，不筛选）
    if (filters.airlines.length > 0 && !filters.airlines.includes(flight.airline)) {
      return false;
    }

    // 舱位
    if (filters.cabins.length > 0 && !filters.cabins.includes(flight.cabin)) {
      return false;
    }

    // 仅显示特价（折扣 >= 40%）
    if (filters.specialOnly && flight.discount < CONFIG.DISCOUNT_SPECIAL_THRESHOLD) {
      return false;
    }

    // 中转偏好 - 优先直飞时过滤中转航班
    if (filters.preferDirect && flight.stops > 0) {
      return false;
    }

    return true;
  },

  /**
   * 对航班进行排序
   */
  sort(flights, sortBy) {
    const sorted = [...flights];

    switch (sortBy) {
      case '价格从低到高':
        return sorted.sort((a, b) => a.price - b.price);

      case '价格从高到低':
        return sorted.sort((a, b) => b.price - a.price);

      case '出发时间最早':
        return sorted.sort((a, b) =>
          new Date(a.date + 'T' + a.departure.time) - new Date(b.date + 'T' + b.departure.time)
        );

      case '折扣幅度最大':
        return sorted.sort((a, b) => (b.discount || 0) - (a.discount || 0));

      default:
        return sorted;
    }
  }
};

// ============================================
// 4. UI 控制器 - DOM 操作封装
// ============================================
const UIController = {
  elements: {},

  init() {
    this.elements = {
      flightList: document.getElementById('flight-list'),
      noResults: document.getElementById('no-results'),
      searchSummary: document.getElementById('searchSummary'),
      priceRange: document.getElementById('priceRange'),
      priceValue: document.getElementById('priceValue'),
      specialOnly: document.getElementById('specialOnly'),
      preferDirect: document.getElementById('prefer-direct'),
      allowTransit: document.getElementById('allow-transit'),
      flexibleDatesToggle: document.getElementById('flexible-dates-toggle'),
      priceTrendSection: document.getElementById('price-trend-section'),
      showAIRecommendations: document.getElementById('show-ai-recommendations'),
      filterStatus: document.getElementById('filter-status')
    };
  },

  /**
   * 渲染航班列表
   */
  renderFlightList(flights) {
    const container = this.elements.flightList;
    const noResults = this.elements.noResults;

    if (!container) return;

    container.innerHTML = '<div class="space-y-4" id="flight-cards-container"></div>';
    const cardsContainer = document.getElementById('flight-cards-container');

    if (flights.length === 0) {
      container.innerHTML = '';
      noResults?.classList.remove('hidden');
      return;
    }

    noResults?.classList.add('hidden');

    let counter = 0;
    flights.forEach(flight => {
      counter++;
      const card = this.createFlightCard(flight, counter);
      cardsContainer.appendChild(card);
    });
  },

  /**
   * 创建航班卡片
   */
  createFlightCard(flight) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-md overflow-hidden card-hover';
    card.setAttribute('data-flight-id', flight.id);

    // AI推荐标签
    let aiBadge = '';
    if (FilterState.showAIRecommendations) {
      const score = getFlightRecommendationScore(flight);
      if (score >= CONFIG.AI_RECOMMENDATION_THRESHOLD) {
        aiBadge = `
          <div class="flex justify-center mb-3">
            <div class="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow">
              <i class="fas fa-robot mr-1"></i>AI推荐 ${Math.round(score)}分
            </div>
          </div>
        `;
      }
    }

    // 特价标签
    const isSpecial = flight.discount >= CONFIG.DISCOUNT_SPECIAL_THRESHOLD;
    const specialBadge = isSpecial ? `
      <div class="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow z-10">
        <i class="fas fa-bolt mr-1"></i>特价
      </div>
    ` : '';

    // 折扣标签
    const discountBadge40 = flight.discount >= 40 ? `
      <div class="absolute top-4 right-28 bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded shadow z-10">-${flight.discount}%</div>
    ` : '';
    const discountBadge30 = flight.discount >= 30 && flight.discount < 40 ? `
      <span class="inline-block bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded mr-2">-${flight.discount}%</span>
    ` : '';

    // 标签
    const tagsHtml = (flight.tags || []).map(tag =>
      `<span class="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded mr-1 mb-1">${tag}</span>`
    ).join('');

    // 座位剩余提示
    const seatsLeftHtml = flight.seatsLeft && flight.seatsLeft <= 10 ? `
      <div class="text-orange-600 text-sm mt-1">
        <i class="fas fa-chair mr-1"></i>仅剩 ${flight.seatsLeft} 个座位
      </div>
    ` : '';

    card.innerHTML = `
      <div class="relative">
        ${specialBadge}
        ${discountBadge40}
        <div class="p-6">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div class="flex-1 mb-4 md:mb-0">
              <div class="flex items-center mb-3">
                <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span class="text-blue-600 font-bold text-lg">${flight.airlineLogo}</span>
                </div>
                <div>
                  <h3 class="font-bold text-gray-800 text-lg">${flight.airline} ${flight.flightNumber}</h3>
                  <p class="text-gray-600">${flight.cabin} · ${flight.stops === 0 ? '直飞' : `${flight.stops}次转机`}</p>
                </div>
              </div>
              <div class="flex items-center mb-4">
                <div class="text-center">
                  <div class="text-xl font-bold text-gray-800">${flight.departure.time}</div>
                  <div class="text-gray-700">${flight.departure.city}</div>
                  <div class="text-gray-500 text-sm">${flight.departure.airport}</div>
                </div>
                <div class="flex-1 px-6">
                  <div class="relative">
                    <div class="h-0.5 bg-gray-300"></div>
                    <div class="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-gray-500 rounded-full"></div>
                    <div class="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-gray-500 rounded-full"></div>
                    <div class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <i class="fas fa-plane text-gray-500"></i>
                    </div>
                  </div>
                  <div class="text-center text-gray-600 text-sm mt-1">${flight.duration}</div>
                </div>
                <div class="text-center">
                  <div class="text-xl font-bold text-gray-800">${flight.arrival.time}</div>
                  <div class="text-gray-700">${flight.arrival.city}</div>
                  <div class="text-gray-500 text-sm">${flight.arrival.airport}</div>
                </div>
              </div>
              <div class="mb-3">${tagsHtml}</div>
              <div class="text-gray-600 text-sm">
                <i class="far fa-calendar mr-1"></i>${Utils.formatDate(flight.date)}
                ${seatsLeftHtml}
              </div>
            </div>
            <div class="border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-6 md:w-64">
              <div class="text-right">
                ${discountBadge30 ? `<div class="mb-1">${discountBadge30}</div>` : ''}
                <div class="text-3xl font-bold text-gray-800">¥${flight.price.toLocaleString('zh-CN')}</div>
                ${flight.originalPrice ? `
                  <div class="text-gray-500 line-through">原价 ¥${flight.originalPrice.toLocaleString('zh-CN')}</div>
                  <div class="text-green-600 font-medium mt-1">节省 ¥${(flight.originalPrice - flight.price).toLocaleString('zh-CN')}</div>
                ` : ''}
              </div>
              ${aiBadge}
              <div class="mt-4 flex space-x-3">
                <button class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition" onclick="App.viewDetail(${flight.id})">
                  查看详情
                </button>
                <button class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition" onclick="App.toggleFavorite(${flight.id}, event)">
                  <i class="far fa-heart"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    return card;
  },

  /**
   * 更新搜索摘要
   */
  updateSummary(count) {
    const summary = this.elements.searchSummary;
    if (summary) {
      if (!FilterState.isFilterConfirmed) {
        summary.textContent = `显示全部 ${count} 个航班`;
      } else {
        const suffix = FilterState.filters.specialOnly ? '（仅显示特价）' : '';
        summary.textContent = `找到 ${count} 个航班${suffix}`;
      }
    }
  },

  /**
   * 更新筛选状态提示
   */
  updateFilterStatus() {
    const statusEl = this.elements.filterStatus;
    if (!statusEl) return;

    if (FilterState.isFilterConfirmed) {
      statusEl.innerHTML = '<span class="text-orange-500"><i class="fas fa-filter mr-1"></i>已应用筛选条件</span>';
    } else {
      statusEl.innerHTML = '<span class="text-gray-500"><i class="fas fa-info-circle mr-1"></i>请选择条件后点击"确认筛选"</span>';
    }
  },

  /**
   * 显示通知
   */
  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    const typeClasses = {
      info: 'bg-blue-500 text-white',
      success: 'bg-green-500 text-white',
      warning: 'bg-yellow-500 text-white',
      error: 'bg-red-500 text-white'
    };

    notification.className = `fixed top-4 right-4 ${typeClasses[type] || typeClasses.success} px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('animate-fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  },

  /**
   * 更新价格滑块显示
   */
  updatePriceRange(maxPrice) {
    const priceValue = this.elements.priceValue;
    if (priceValue) {
      priceValue.textContent = `¥${CONFIG.PRICE_MIN} - ¥${maxPrice}`;
    }
  }
};

// ============================================
// 5. 工具函数
// ============================================
const Utils = {
  formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
    return date.toLocaleDateString('zh-CN', options);
  },

  getCheckedValues(selector) {
    const checkboxes = document.querySelectorAll(selector);
    const values = [];
    checkboxes.forEach(checkbox => {
      if (checkbox.checked) {
        const label = checkbox.parentElement.querySelector('span');
        if (label) {
          values.push(label.textContent);
        }
      }
    });
    return values;
  },

  setCheckedValues(selector, values) {
    const checkboxes = document.querySelectorAll(selector);
    checkboxes.forEach(checkbox => {
      const label = checkbox.parentElement.querySelector('span');
      if (label) {
        checkbox.checked = values.includes(label.textContent);
      }
    });
  }
};

// ============================================
// 6. 应用主控制器
// ============================================
const App = {
  init() {
    UIController.init();
    FilterState.allFlights = [...flightData.flights];

    // 初始化时显示全部
    FilterState.filteredFlights = [...FilterState.allFlights];

    this.bindEvents();
    this.renderAll();
    this.renderPriceTrend();
  },

  /**
   * 渲染全部内容
   */
  renderAll() {
    UIController.renderFlightList(FilterState.filteredFlights);
    UIController.updateSummary(FilterState.filteredFlights.length);
    UIController.updateFilterStatus();
  },

  /**
   * 绑定所有事件
   */
  bindEvents() {
    // 价格滑块 - 只更新显示，不触发筛选
    const priceRange = UIController.elements.priceRange;
    if (priceRange) {
      priceRange.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        FilterState.filters.maxPrice = value;
        UIController.updatePriceRange(value);
      });
    }

    // 航空公司复选框 - 只更新状态，不触发筛选
    document.querySelector('.filter-sidebar')?.addEventListener('change', (e) => {
      if (e.target.classList.contains('airline-checkbox')) {
        FilterState.filters.airlines = Utils.getCheckedValues('.airline-checkbox');
      }
    });

    // 舱位复选框 - 只更新状态，不触发筛选
    document.querySelector('.filter-sidebar')?.addEventListener('change', (e) => {
      if (e.target.classList.contains('cabin-checkbox')) {
        FilterState.filters.cabins = Utils.getCheckedValues('.cabin-checkbox');
      }
    });

    // 仅显示特价 - 只更新状态，不触发筛选
    const specialOnly = UIController.elements.specialOnly;
    if (specialOnly) {
      specialOnly.addEventListener('change', (e) => {
        FilterState.filters.specialOnly = e.target.checked;
      });
    }

    // 中转偏好 - 只更新状态，不触发筛选
    this.bindTransitToggle();

    // 灵活日期 - 不影响筛选，只显示信息
    const flexibleToggle = UIController.elements.flexibleDatesToggle;
    if (flexibleToggle) {
      flexibleToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
          UIController.showNotification('已开启灵活日期，查看前后3天价格', 'info');
          this.renderFlexibleDates();
        } else {
          UIController.showNotification('已关闭灵活日期', 'info');
          this.hideFlexibleDates();
        }
      });
    }

    // AI推荐显示切换 - 实时更新
    const aiToggle = UIController.elements.showAIRecommendations;
    if (aiToggle) {
      aiToggle.addEventListener('change', (e) => {
        FilterState.showAIRecommendations = e.target.checked;
        UIController.renderFlightList(FilterState.filteredFlights);
      });
    }

    // 排序选择 - 实时排序（不影响筛选）
    const sortSelect = document.querySelector('.sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        FilterState.sortBy = e.target.value;
        this.applySort();
      });
    }

    // ========== 核心按钮事件 ==========

    // 搜索按钮 - 根据城市条件筛选
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.handleSearch());
    }

    // 确认筛选按钮 - 根据所有筛选条件筛选
    const confirmBtn = document.querySelector('.confirm-filter-btn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => this.confirmFilter());
    }

    // 重置按钮 - 恢复默认状态
    const resetBtn = document.querySelector('.reset-filters-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetFilters());
    }

    // 偏好开关
    const prefToggle = document.getElementById('use-preferences-toggle');
    if (prefToggle) {
      prefToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.applyPreferences();
        } else {
          this.resetFilters();
        }
      });
    }
  },

  /**
   * 绑定中转偏好切换
   */
  bindTransitToggle() {
    const preferDirect = UIController.elements.preferDirect;
    const allowTransit = UIController.elements.allowTransit;

    if (!preferDirect || !allowTransit) return;

    preferDirect.addEventListener('change', () => {
      if (preferDirect.checked) {
        allowTransit.checked = false;
        FilterState.filters.preferDirect = true;
        FilterState.filters.allowTransit = false;
      } else {
        FilterState.filters.preferDirect = false;
        FilterState.filters.allowTransit = true;
      }
    });

    allowTransit.addEventListener('change', () => {
      if (allowTransit.checked) {
        preferDirect.checked = false;
        FilterState.filters.allowTransit = true;
        FilterState.filters.preferDirect = false;
      } else {
        FilterState.filters.allowTransit = false;
        FilterState.filters.preferDirect = false;
      }
    });
  },

  /**
   * 搜索按钮 - 根据城市条件筛选
   */
  handleSearch() {
    const departureInput = document.getElementById('search-departure');
    const arrivalInput = document.getElementById('search-arrival');

    const departure = departureInput?.value.trim() || '';
    const arrival = arrivalInput?.value.trim() || '';

    FilterState.filters.departureCity = departure;
    FilterState.filters.arrivalCity = arrival;

    if (arrival && window.SearchHistory) {
      SearchHistory.addSearch(departure, arrival);
    }

    // 执行筛选
    this.doFilter();
    UIController.showNotification('已根据搜索条件筛选', 'success');
  },

  /**
   * 确认筛选按钮 - 根据所有筛选条件筛选
   */
  confirmFilter() {
    this.doFilter();
    UIController.showNotification('筛选条件已应用', 'success');
  },

  /**
   * 执行筛选逻辑
   */
  doFilter() {
    FilterState.isFilterConfirmed = true;

    // 1. 筛选
    FilterState.filteredFlights = FilterEngine.apply(
      FilterState.allFlights,
      FilterState.filters
    );

    // 2. 排序
    this.applySort();

    // 3. 渲染
    UIController.renderFlightList(FilterState.filteredFlights);
    UIController.updateSummary(FilterState.filteredFlights.length);
    UIController.updateFilterStatus();
  },

  /**
   * 应用排序
   */
  applySort() {
    FilterState.filteredFlights = FilterEngine.sort(
      FilterState.filteredFlights,
      FilterState.sortBy
    );
    UIController.renderFlightList(FilterState.filteredFlights);
  },

  /**
   * 重置所有筛选
   */
  resetFilters() {
    FilterState.reset();

    // 重置 UI
    const priceRange = UIController.elements.priceRange;
    if (priceRange) {
      priceRange.value = CONFIG.PRICE_DEFAULT;
      UIController.updatePriceRange(CONFIG.PRICE_DEFAULT);
    }

    Utils.setCheckedValues('.airline-checkbox', []);
    Utils.setCheckedValues('.cabin-checkbox', ['经济舱']);

    if (UIController.elements.specialOnly) {
      UIController.elements.specialOnly.checked = false;
    }
    if (UIController.elements.preferDirect) {
      UIController.elements.preferDirect.checked = false;
    }
    if (UIController.elements.allowTransit) {
      UIController.elements.allowTransit.checked = true;
    }

    // 显示全部
    FilterState.filteredFlights = [...FilterState.allFlights];
    this.applySort();
    UIController.updateSummary(FilterState.filteredFlights.length);
    UIController.updateFilterStatus();
    UIController.showNotification('已重置，显示全部航班', 'success');
  },

  /**
   * 应用用户偏好
   */
  applyPreferences() {
    const preferences = this.getUserPreferences();
    if (!preferences) {
      UIController.showNotification('未找到偏好设置', 'info');
      return;
    }

    // 应用航空公司偏好
    if (preferences.airlinePreferences?.length > 0) {
      Utils.setCheckedValues('.airline-checkbox', preferences.airlinePreferences);
      FilterState.filters.airlines = preferences.airlinePreferences;
    }

    // 应用舱位偏好
    if (preferences.cabinPreferences?.length > 0) {
      Utils.setCheckedValues('.cabin-checkbox', preferences.cabinPreferences);
      FilterState.filters.cabins = preferences.cabinPreferences;
    }

    // 应用价格敏感度
    if (preferences.priceSensitivity) {
      const maxPrice = this.getPriceFromSensitivity(preferences.priceSensitivity);
      FilterState.filters.maxPrice = maxPrice;
      const priceRange = UIController.elements.priceRange;
      if (priceRange) {
        priceRange.value = maxPrice;
        UIController.updatePriceRange(maxPrice);
      }
    }

    // 应用特价偏好
    if (preferences.dealNotificationsEnabled !== undefined) {
      FilterState.filters.specialOnly = preferences.dealNotificationsEnabled;
      if (UIController.elements.specialOnly) {
        UIController.elements.specialOnly.checked = preferences.dealNotificationsEnabled;
      }
    }

    // 立即应用筛选
    this.doFilter();
    UIController.showNotification('已应用偏好设置', 'success');
  },

  getUserPreferences() {
    try {
      const saved = localStorage.getItem('flightPreferences');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('加载偏好设置失败:', error);
      return null;
    }
  },

  getPriceFromSensitivity(sensitivity) {
    const map = { 1: 1500, 2: 2000, 3: 2500, 4: 3000, 5: 5000 };
    return map[sensitivity] || 2500;
  },

  viewDetail(flightId) {
    window.location.href = `detail.html?id=${flightId}`;
  },

  toggleFavorite(flightId, event) {
    if (event) event.stopPropagation();
    const button = event.target.closest('button');
    const icon = button?.querySelector('i');
    if (!icon) return;

    if (icon.classList.contains('far')) {
      icon.classList.remove('far');
      icon.classList.add('fas', 'text-red-500');
      button.title = '已收藏';
      UIController.showNotification('已添加到收藏夹');
    } else {
      icon.classList.remove('fas', 'text-red-500');
      icon.classList.add('far');
      button.title = '收藏';
      UIController.showNotification('已从收藏夹移除');
    }
  },

  renderFlexibleDates() {
    const section = UIController.elements.priceTrendSection;
    if (!section) return;

    const existing = document.getElementById('flexible-dates-info');
    if (existing) existing.remove();

    const html = `
      <div id="flexible-dates-info" class="mt-4 grid grid-cols-7 gap-2 text-center">
        ${this.generateFlexibleDatesHTML()}
      </div>
    `;
    section.insertAdjacentHTML('beforeend', html);
  },

  hideFlexibleDates() {
    const existing = document.getElementById('flexible-dates-info');
    if (existing) existing.remove();
  },

  generateFlexibleDatesHTML() {
    const dates = [];
    const today = new Date();
    const basePrice = 1200;

    for (let i = -3; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
      const dayName = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
      const priceVariation = Math.floor(Math.random() * 400) - 200;
      const price = Math.max(800, basePrice + priceVariation);
      const isToday = i === 0;

      dates.push(`
        <div class="${isToday ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'} border rounded-lg p-2 ${i === 0 ? 'ring-2 ring-green-500' : ''}">
          <div class="text-xs text-gray-500">${dateStr}</div>
          <div class="text-xs text-gray-400">周${dayName}</div>
          <div class="font-bold ${price < basePrice ? 'text-green-600' : 'text-gray-700'}">¥${price}</div>
          ${isToday ? '<div class="text-xs text-green-600 font-medium">最低</div>' : ''}
          ${price < basePrice ? `<div class="text-xs text-green-500">省${basePrice - price}</div>` : ''}
        </div>
      `);
    }
    return dates.join('');
  },

  renderPriceTrend() {
    const canvas = document.getElementById('price-trend-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    canvas.width = width;
    canvas.height = height;

    const prices = [];
    const basePrice = 1200;
    for (let i = 0; i < 30; i++) {
      const variation = Math.sin(i / 5) * 200 + Math.random() * 100;
      prices.push(basePrice + variation);
    }

    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

    ctx.beginPath();
    ctx.moveTo(0, height);
    prices.forEach((price, i) => {
      const x = (i / (prices.length - 1)) * width;
      const y = height - ((price - 800) / 800) * height;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    prices.forEach((price, i) => {
      const x = (i / (prices.length - 1)) * width;
      const y = height - ((price - 800) / 800) * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.stroke();

    const lastX = width;
    const lastY = height - ((prices[29] - 800) / 800) * height;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#3b82f6';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    const currentPriceEl = document.getElementById('trend-current-price');
    if (currentPriceEl) {
      const lowestPrice = Math.min(...prices);
      const currentPrice = prices[29];
      const isLowest = Math.abs(currentPrice - lowestPrice) < 1;
      currentPriceEl.innerHTML = isLowest
        ? `<span class="text-green-600">当前: ¥${Math.round(currentPrice)} (最低价!)</span>`
        : `当前: ¥${Math.round(currentPrice)}`;
    }
  }
};

// ============================================
// 7. 获取航班 AI 推荐分数
// ============================================
function getFlightRecommendationScore(flight) {
  const userPreferences = App.getUserPreferences();

  if (!window.RecommendationEngine || !userPreferences) {
    let score = 50;
    if (flight.discount >= 30) score += 20;
    if (flight.price < 1000) score += 15;
    if (flight.isSpecial) score += 10;
    if (flight.stops === 0) score += 5;
    return Math.min(100, score);
  }

  try {
    const scores = RecommendationEngine.calculateFlightScores?.(flight, userPreferences);
    if (scores) {
      const totalScore = RecommendationEngine.calculateTotalScore?.(scores);
      if (totalScore) return totalScore;
    }
  } catch (error) {
    console.error('计算推荐分数时出错:', error);
  }

  return 60;
}

// ============================================
// 8. 初始化
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
