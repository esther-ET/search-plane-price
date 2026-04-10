// 搜索页JavaScript逻辑

let currentFlights = [...flightData.flights];
let currentFilters = {
  minPrice: 500,
  maxPrice: 3000,
  airlines: flightData.filters.airlines, // 默认全选
  specialOnly: false,
  cabin: '经济舱',
  preferDirect: false,
  allowTransit: true
};

// AI推荐配置
let showAIRecommendations = true;
const AI_RECOMMENDATION_THRESHOLD = 70; // 分数阈值

document.addEventListener('DOMContentLoaded', function() {
  // 恢复URL中的搜索条件
  if (window.restoreSearchFromURL) {
    restoreSearchFromURL();
  }
  loadFlightList();
  setupFilterEvents();
  setupSorting();
  updateSearchSummary();
});

// 获取航班的AI推荐分数
function getFlightRecommendationScore(flight) {
  // 获取用户偏好
  const userPreferences = getUserPreferences();

  // 如果没有推荐引擎或没有用户偏好，返回基础分数
  if (!window.RecommendationEngine || !userPreferences) {
    // 基于折扣和价格计算简单分数
    let score = 50;
    if (flight.discount >= 30) score += 20;
    if (flight.price < 1000) score += 15;
    if (flight.isSpecial) score += 10;
    if (flight.stops === 0) score += 5;
    return Math.min(100, score);
  }

  // 使用推荐引擎计算分数
  try {
    // 注意：这里我们简化计算，实际应该调用推荐引擎
    // 由于推荐引擎是为列表设计的，我们这里使用简化的分数计算
    // 或者我们可以调用推荐引擎的评分函数
    const scores = RecommendationEngine.calculateFlightScores?.(flight, userPreferences);
    if (scores) {
      // 计算总分
      const totalScore = RecommendationEngine.calculateTotalScore?.(scores);
      if (totalScore) return totalScore;
    }
  } catch (error) {
    console.error('计算推荐分数时出错:', error);
  }

  // 默认回退
  return 60;
}

// 加载航班列表
function loadFlightList() {
  const container = document.getElementById('flight-list');
  const noResults = document.getElementById('no-results');

  if (!container) return;

  // 清空容器，保留加载状态
  container.innerHTML = '<div class="space-y-4" id="flight-cards-container"></div>';
  const cardsContainer = document.getElementById('flight-cards-container');

  if (currentFlights.length === 0) {
    container.innerHTML = '';
    noResults.classList.remove('hidden');
    return;
  }

  noResults.classList.add('hidden');

  currentFlights.forEach(flight => {
    const card = createFlightCard(flight);
    cardsContainer.appendChild(card);
  });
}

// 创建航班卡片（搜索页版本）
function createFlightCard(flight) {
  const card = document.createElement('div');
  card.className = 'bg-white rounded-xl shadow-md overflow-hidden card-hover';
  card.setAttribute('data-flight-id', flight.id);

  // 特价标签
  const specialBadge = flight.isSpecial ?
    `<div class="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow">
      <i class="fas fa-bolt mr-1"></i>特价
    </div>` : '';

  // AI推荐标签
  let aiRecommendationBadge = '';
  if (showAIRecommendations) {
    const score = getFlightRecommendationScore(flight);
    if (score >= AI_RECOMMENDATION_THRESHOLD) {
      const scorePercent = Math.round(score);
      const feedbackHtml = typeof createFeedbackButtons === 'function'
        ? `<div class="absolute top-14 right-0 ${specialBadge ? 'translate-y-10' : ''} bg-white rounded-lg shadow-lg border border-purple-200 p-2 z-10">
            ${createFeedbackButtons(flight.id, 'search', score)}
           </div>`
        : '';
      aiRecommendationBadge = `
        <div class="absolute top-4 right-4 ${specialBadge ? 'translate-y-10' : ''} bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow cursor-pointer hover:from-purple-600 hover:to-indigo-600 transition-colors" onclick="toggleSearchFeedback(this)">
          <i class="fas fa-robot mr-1"></i>AI推荐 ${scorePercent}分
        </div>
        ${feedbackHtml}
      `;
    }
  }

  // 折扣显示
  const discountBadge = flight.discount >= 30 ?
    `<span class="inline-block bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded mr-2">-${flight.discount}%</span>` : '';

  // 标签
  let tagsHtml = '';
  if (flight.tags && flight.tags.length > 0) {
    tagsHtml = flight.tags.map(tag =>
      `<span class="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded mr-1 mb-1">${tag}</span>`
    ).join('');
  }

  card.innerHTML = `
    <div class="relative">
      ${specialBadge}${aiRecommendationBadge}
      <div class="p-6">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center">
          <!-- 航班信息 -->
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

            <!-- 行程 -->
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

            <!-- 标签 -->
            <div class="mb-3">
              ${tagsHtml}
            </div>

            <div class="text-gray-600 text-sm">
              <i class="far fa-calendar mr-1"></i>${formatDate(flight.date)}
            </div>
          </div>

          <!-- 价格和操作 -->
          <div class="border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-6 md:w-64">
            <div class="text-right">
              <div class="flex items-center justify-end mb-2">
                ${discountBadge}
              </div>
              <div class="text-3xl font-bold text-gray-800">¥${flight.price.toLocaleString('zh-CN')}</div>
              ${flight.originalPrice ?
                `<div class="text-gray-500 line-through">原价 ¥${flight.originalPrice.toLocaleString('zh-CN')}</div>` :
                ''
              }
              <div class="text-green-600 font-medium mt-1">节省 ¥${flight.originalPrice ? (flight.originalPrice - flight.price).toLocaleString('zh-CN') : '0'}</div>
            </div>
            <div class="mt-4 flex space-x-3">
              <button class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200" onclick="viewFlightDetail(${flight.id})">
                查看详情
              </button>
              <button class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50" onclick="toggleFavorite(${flight.id}, event)">
                <i class="far fa-heart"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  return card;
}

// 设置筛选事件
function setupFilterEvents() {
  // 价格滑块
  const priceRange = document.getElementById('priceRange');
  const priceValue = document.getElementById('priceValue');

  if (priceRange && priceValue) {
    priceRange.addEventListener('input', function() {
      const value = parseInt(this.value);
      priceValue.textContent = `¥500 - ¥${value}`;
      currentFilters.maxPrice = value;
      applyFilters();
    });
  }

  // 航空公司复选框
  const airlineCheckboxes = document.querySelectorAll('input[type="checkbox"]');
  airlineCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      updateSelectedAirlines();
      applyFilters();
    });
  });

  // 仅显示特价
  const specialOnly = document.getElementById('specialOnly');
  if (specialOnly) {
    specialOnly.addEventListener('change', function() {
      currentFilters.specialOnly = this.checked;
      applyFilters();
    });
  }

  // 舱位等级单选按钮
  const cabinRadios = document.querySelectorAll('input[name="cabin"]');
  cabinRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.checked) {
        currentFilters.cabin = this.parentElement.querySelector('span').textContent;
        applyFilters();
      }
    });
  });

  // 中转偏好 - 优先直飞
  const preferDirect = document.getElementById('prefer-direct');
  if (preferDirect) {
    preferDirect.addEventListener('change', function() {
      currentFilters.preferDirect = this.checked;
      applyFilters();
    });
  }

  // 中转偏好 - 允许中转
  const allowTransit = document.getElementById('allow-transit');
  if (allowTransit) {
    allowTransit.addEventListener('change', function() {
      currentFilters.allowTransit = this.checked;
      // 如果不允许中转，自动关闭优先直飞
      if (!this.checked) {
        currentFilters.preferDirect = false;
        const preferDirectEl = document.getElementById('prefer-direct');
        if (preferDirectEl) preferDirectEl.checked = false;
      }
      applyFilters();
    });
  }
}

// 更新选中的航空公司
function updateSelectedAirlines() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  currentFilters.airlines = [];

  checkboxes.forEach(checkbox => {
    if (checkbox.checked) {
      const airlineName = checkbox.parentElement.querySelector('span').textContent;
      currentFilters.airlines.push(airlineName);
    }
  });
}

// 应用筛选
function applyFilters() {
  currentFlights = flightData.flights.filter(flight => {
    // 价格筛选
    if (flight.price < currentFilters.minPrice || flight.price > currentFilters.maxPrice) {
      return false;
    }

    // 航空公司筛选
    if (!currentFilters.airlines.includes(flight.airline)) {
      return false;
    }

    // 舱位筛选
    if (currentFilters.cabin !== '所有舱位' && flight.cabin !== currentFilters.cabin) {
      return false;
    }

    // 仅显示特价
    if (currentFilters.specialOnly && !flight.isSpecial) {
      return false;
    }

    // 中转偏好筛选
    if (!currentFilters.allowTransit && flight.stops > 0) {
      return false;
    }

    // 优先直飞：如果开启，会在排序时把直飞排到前面（不过滤掉中转）
    // allowTransit 为 false 时才过滤中转航班

    return true;
  });

  // 如果开启了"优先直飞"，对结果排序
  if (currentFilters.preferDirect) {
    currentFlights.sort((a, b) => {
      // 直飞优先
      if (a.stops === 0 && b.stops > 0) return -1;
      if (a.stops > 0 && b.stops === 0) return 1;
      // 都是直飞或都是中转，按价格排序
      return a.price - b.price;
    });
  }

  loadFlightList();
  updateSearchSummary();
}

// 重置筛选
function resetFilters() {
  // 重置UI
  const priceRange = document.getElementById('priceRange');
  if (priceRange) priceRange.value = 2500;

  const priceValue = document.getElementById('priceValue');
  if (priceValue) priceValue.textContent = '¥500 - ¥2500';

  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => checkbox.checked = true);

  const specialOnly = document.getElementById('specialOnly');
  if (specialOnly) specialOnly.checked = true;

  const cabinRadios = document.querySelectorAll('input[name="cabin"]');
  if (cabinRadios[0]) cabinRadios[0].checked = true;

  // 重置中转偏好
  const preferDirect = document.getElementById('prefer-direct');
  if (preferDirect) preferDirect.checked = false;
  const allowTransit = document.getElementById('allow-transit');
  if (allowTransit) allowTransit.checked = true;

  // 重置筛选状态
  currentFilters = {
    minPrice: 500,
    maxPrice: 3000,
    airlines: flightData.filters.airlines,
    specialOnly: true,
    cabin: '经济舱',
    preferDirect: false,
    allowTransit: true
  };

  applyFilters();
}

// 设置排序
function setupSorting() {
  const sortSelect = document.querySelector('select');
  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      sortFlights(this.value);
    });
  }
}

// 排序航班
function sortFlights(sortBy) {
  switch (sortBy) {
    case '价格从低到高':
      currentFlights.sort((a, b) => a.price - b.price);
      break;
    case '价格从高到低':
      currentFlights.sort((a, b) => b.price - a.price);
      break;
    case '出发时间最早':
      currentFlights.sort((a, b) => new Date(a.date + 'T' + a.departure.time) - new Date(b.date + 'T' + b.departure.time));
      break;
    case '折扣幅度最大':
      currentFlights.sort((a, b) => (b.discount || 0) - (a.discount || 0));
      break;
  }

  loadFlightList();
}

// 查看航班详情
function viewFlightDetail(flightId) {
  window.location.href = `detail.html?id=${flightId}`;
}

// 切换搜索页反馈显示
function toggleSearchFeedback(element) {
  // 关闭其他已打开的反馈面板
  document.querySelectorAll('.feedback-dropdown-open').forEach(el => {
    if (el !== element) el.classList.remove('feedback-dropdown-open');
  });

  // 找到对应的反馈面板
  const feedbackPanel = element.nextElementSibling;
  if (feedbackPanel && feedbackPanel.classList.contains('bg-white')) {
    element.classList.toggle('feedback-dropdown-open');
    feedbackPanel.classList.toggle('hidden');
  }
}

// 收藏航班
function toggleFavorite(flightId, event) {
  if (event) event.stopPropagation();
  const button = event.target.closest('button');
  const icon = button.querySelector('i');

  if (icon.classList.contains('far')) {
    icon.classList.remove('far');
    icon.classList.add('fas', 'text-red-500');
    button.title = '已收藏';
    showNotification('已添加到收藏夹');
  } else {
    icon.classList.remove('fas', 'text-red-500');
    icon.classList.add('far');
    button.title = '收藏';
    showNotification('已从收藏夹移除');
  }
}

// 显示通知
function showNotification(message) {
  // 简单的通知实现
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in';
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('animate-fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// 更新搜索摘要
function updateSearchSummary() {
  const summary = document.getElementById('searchSummary');
  if (summary) {
    const count = currentFlights.length;
    summary.textContent = `找到 ${count} 个航班${currentFilters.specialOnly ? '（仅显示特价）' : ''}`;
  }
}

// 格式化日期
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
  return date.toLocaleDateString('zh-CN', options);
}

// ============================================
// 用户偏好集成功能
// ============================================

// 获取用户偏好设置
function getUserPreferences() {
  try {
    const saved = localStorage.getItem('flightPreferences');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('加载偏好设置失败:', error);
  }
  return null;
}

// 应用用户偏好到筛选器
function applyUserPreferences() {
  const preferences = getUserPreferences();
  if (!preferences) return false;

  // 应用航空公司偏好
  if (preferences.airlinePreferences && preferences.airlinePreferences.length > 0) {
    // 更新复选框状态
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      const label = checkbox.parentElement.querySelector('span');
      if (label) {
        const airlineName = label.textContent;
        checkbox.checked = preferences.airlinePreferences.includes(airlineName);
      }
    });

    // 更新当前筛选器
    updateSelectedAirlines();
  }

  // 应用舱位偏好
  if (preferences.cabinPreferences && preferences.cabinPreferences.length > 0) {
    const firstCabin = preferences.cabinPreferences[0];
    currentFilters.cabin = firstCabin;

    // 更新单选按钮
    const cabinRadios = document.querySelectorAll('input[name="cabin"]');
    cabinRadios.forEach(radio => {
      const label = radio.parentElement.querySelector('span');
      if (label && label.textContent === firstCabin) {
        radio.checked = true;
      }
    });
  }

  // 应用价格敏感度（调整价格范围）
  if (preferences.priceSensitivity) {
    const sensitivity = preferences.priceSensitivity;
    // 价格敏感度：1=价格优先（低价），5=品质优先（接受高价）
    const priceRange = document.getElementById('priceRange');
    if (priceRange) {
      let maxPrice;
      switch(sensitivity) {
        case 1: maxPrice = 1500; break; // 价格优先
        case 2: maxPrice = 2000; break;
        case 3: maxPrice = 2500; break; // 中等
        case 4: maxPrice = 3000; break;
        case 5: maxPrice = 5000; break; // 品质优先
        default: maxPrice = 2500;
      }
      priceRange.value = maxPrice;
      document.getElementById('priceValue').textContent = `¥500 - ¥${maxPrice}`;
      currentFilters.maxPrice = maxPrice;
    }
  }

  // 应用特价筛选
  if (preferences.dealNotificationsEnabled !== undefined) {
    const specialOnly = document.getElementById('specialOnly');
    if (specialOnly) {
      specialOnly.checked = preferences.dealNotificationsEnabled;
      currentFilters.specialOnly = preferences.dealNotificationsEnabled;
    }
  }

  // 重新应用筛选
  applyFilters();
  return true;
}

// 设置偏好相关事件
function setupPreferenceEvents() {
  const preferenceToggle = document.getElementById('use-preferences-toggle');
  if (!preferenceToggle) return;

  // 检查是否有保存的偏好
  const hasPreferences = getUserPreferences() !== null;
  preferenceToggle.checked = hasPreferences;

  if (hasPreferences) {
    // 默认应用一次偏好
    applyUserPreferences();
  }

  // 切换事件
  preferenceToggle.addEventListener('change', function() {
    if (this.checked) {
      const applied = applyUserPreferences();
      if (!applied) {
        showNotification('未找到偏好设置，请先到"我的偏好"页面设置', 'info');
        this.checked = false;
      }
    } else {
      // 重置筛选器
      resetFilters();
    }
  });
}

// 设置AI推荐事件
function setupAIRecommendationEvents() {
  const aiToggle = document.getElementById('show-ai-recommendations');
  if (!aiToggle) return;

  // 设置初始状态
  aiToggle.checked = showAIRecommendations;

  // 切换事件
  aiToggle.addEventListener('change', function() {
    showAIRecommendations = this.checked;
    loadFlightList(); // 重新加载列表以更新推荐标注
    showNotification(
      showAIRecommendations ? '已显示AI推荐标注' : '已隐藏AI推荐标注',
      'success'
    );
  });
}

// 修改现有的setupFilterEvents函数以包含偏好事件
// 注意：这需要替换原来的setupFilterEvents调用
// 我们在DOMContentLoaded中添加setupPreferenceEvents()

// 修改DOMContentLoaded事件
document.addEventListener('DOMContentLoaded', function() {
  // 恢复URL中的搜索条件
  if (window.restoreSearchFromURL) {
    restoreSearchFromURL();
  }
  loadFlightList();
  setupFilterEvents();
  setupPreferenceEvents(); // 新增
  setupAIRecommendationEvents(); // AI推荐事件
  setupFlexibleDateEvents(); // 灵活日期事件
  setupSorting();
  updateSearchSummary();
  renderPriceTrend(); // 渲染价格趋势图
  // 恢复中转偏好设置
  restoreTransitPreferences();
});

// 恢复中转偏好设置
function restoreTransitPreferences() {
  const params = new URLSearchParams(window.location.search);
  const preferDirect = params.get('preferDirect');
  const allowTransit = params.get('allowTransit');

  if (preferDirect !== null) {
    const preferDirectEl = document.getElementById('prefer-direct');
    if (preferDirectEl) {
      preferDirectEl.checked = preferDirect === 'true';
      currentFilters.preferDirect = preferDirect === 'true';
    }
  }
  if (allowTransit !== null) {
    const allowTransitEl = document.getElementById('allow-transit');
    if (allowTransitEl) {
      allowTransitEl.checked = allowTransit === 'true';
      currentFilters.allowTransit = allowTransit === 'true';
    }
  }
}

// 灵活日期搜索事件
function setupFlexibleDateEvents() {
  const flexibleToggle = document.getElementById('flexible-dates-toggle');
  if (!flexibleToggle) return;

  flexibleToggle.addEventListener('change', function() {
    if (this.checked) {
      showNotification('已开启灵活日期，查看前后3天价格', 'info');
      renderFlexibleDatesInfo();
    } else {
      showNotification('已关闭灵活日期', 'info');
      hideFlexibleDatesInfo();
    }
  });
}

// 显示灵活日期信息
function renderFlexibleDatesInfo() {
  const trendSection = document.getElementById('price-trend-section');
  if (!trendSection) return;

  // 在趋势图下方显示日期价格
  let infoHtml = `
    <div id="flexible-dates-info" class="mt-4 grid grid-cols-7 gap-2 text-center">
      ${generateFlexibleDatesHTML()}
    </div>
  `;

  // 移除已存在的
  const existing = document.getElementById('flexible-dates-info');
  if (existing) existing.remove();

  trendSection.insertAdjacentHTML('beforeend', infoHtml);
}

// 隐藏灵活日期信息
function hideFlexibleDatesInfo() {
  const existing = document.getElementById('flexible-dates-info');
  if (existing) existing.remove();
}

// 生成灵活日期HTML
function generateFlexibleDatesHTML() {
  const dates = [];
  const today = new Date();
  const currentPrice = 1200; // 从选中航班获取

  for (let i = -3; i <= 3; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    const dayName = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];

    // 模拟价格波动
    const priceVariation = Math.floor(Math.random() * 400) - 200;
    const price = Math.max(800, currentPrice + priceVariation);
    const isLowest = i === 0;
    const isToday = i === 0;

    dates.push(`
      <div class="${isToday ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'} border rounded-lg p-2 ${isLowest ? 'ring-2 ring-green-500' : ''}">
        <div class="text-xs text-gray-500">${dateStr}</div>
        <div class="text-xs text-gray-400">周${dayName}</div>
        <div class="font-bold ${price < currentPrice ? 'text-green-600' : 'text-gray-700'}">¥${price}</div>
        ${isLowest ? '<div class="text-xs text-green-600 font-medium">最低</div>' : ''}
        ${price < currentPrice ? '<div class="text-xs text-green-500">省' + (currentPrice - price) + '</div>' : ''}
      </div>
    `);
  }
  return dates.join('');
}

// 渲染价格趋势图
function renderPriceTrend() {
  const canvas = document.getElementById('price-trend-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;

  canvas.width = width;
  canvas.height = height;

  // 模拟30天价格数据
  const prices = [];
  const basePrice = 1200;
  for (let i = 0; i < 30; i++) {
    const variation = Math.sin(i / 5) * 200 + Math.random() * 100;
    prices.push(basePrice + variation);
  }

  // 绘制
  ctx.clearRect(0, 0, width, height);

  // 绘制填充
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
  gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

  ctx.beginPath();
  ctx.moveTo(0, height);

  prices.forEach((price, i) => {
    const x = (i / (prices.length - 1)) * width;
    const y = height - ((price - 800) / 800) * height;
    if (i === 0) {
      ctx.lineTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // 绘制线
  ctx.beginPath();
  prices.forEach((price, i) => {
    const x = (i / (prices.length - 1)) * width;
    const y = height - ((price - 800) / 800) * height;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 绘制数据点
  prices.forEach((price, i) => {
    const x = (i / (prices.length - 1)) * width;
    const y = height - ((price - 800) / 800) * height;

    // 今天的数据点高亮
    if (i === prices.length - 1) {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });

  // 更新当前价格显示
  const currentPriceEl = document.getElementById('trend-current-price');
  if (currentPriceEl) {
    const currentPrice = prices[prices.length - 1];
    const lowestPrice = Math.min(...prices);
    const isLowest = currentPrice === lowestPrice;
    currentPriceEl.innerHTML = isLowest
      ? `<span class="text-green-600">当前: ¥${Math.round(currentPrice)} (最低价!)</span>`
      : `当前: ¥${Math.round(currentPrice)}`;
  }
}

// 添加一个显示通知的函数（如果不存在）
if (typeof showNotification === 'undefined') {
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in ${
      type === 'info' ? 'bg-blue-500 text-white' :
      type === 'success' ? 'bg-green-500 text-white' :
      'bg-yellow-500 text-white'
    }`;
    notification.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-${type === 'info' ? 'info-circle' : type === 'success' ? 'check-circle' : 'exclamation-circle'} mr-2"></i>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}