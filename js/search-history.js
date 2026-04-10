// 搜索历史和热门目的地功能

const SearchHistory = {
  STORAGE_KEY: 'searchHistory',
  MAX_HISTORY: 10,

  // 热门目的地数据
  popularDestinations: [
    { city: '东京', country: '日本', icon: '🇯🇵' },
    { city: '曼谷', country: '泰国', icon: '🇹🇭' },
    { city: '新加坡', country: '新加坡', icon: '🇸🇬' },
    { city: '首尔', country: '韩国', icon: '🇰🇷' },
    { city: '大阪', country: '日本', icon: '🇯🇵' },
    { city: '巴黎', country: '法国', icon: '🇫🇷' },
    { city: '伦敦', country: '英国', icon: '🇬🇧' },
    { city: '悉尼', country: '澳大利亚', icon: '🇦🇺' }
  ],

  // 所有支持的城市（用于模糊搜索）
  allCities: [
    { city: '东京', country: '日本', pinyin: 'dongjing dj', code: 'TYO' },
    { city: '大阪', country: '日本', pinyin: 'daban db osaka', code: 'OSA' },
    { city: '名古屋', country: '日本', pinyin: 'minggu wool nagoya', code: 'NGO' },
    { city: '福冈', country: '日本', pinyin: 'fuken fukuoka', code: 'FUK' },
    { city: '曼谷', country: '泰国', pinyin: 'mang gu bangkok', code: 'BKK' },
    { city: '清迈', country: '泰国', pinyin: 'qing mai chiang mai', code: 'CNX' },
    { city: '普吉岛', country: '泰国', pinyin: 'pujidao phuket', code: 'HKT' },
    { city: '新加坡', country: '新加坡', pinyin: 'xinjiapo singapore', code: 'SIN' },
    { city: '首尔', country: '韩国', pinyin: 'shou er seoul', code: 'SEL' },
    { city: '济州岛', country: '韩国', pinyin: 'jizhoudao jeju', code: 'CJU' },
    { city: '台北', country: '中国台湾', pinyin: 'tai bei taibei', code: 'TPE' },
    { city: '高雄', country: '中国台湾', pinyin: 'gaoxiong kaohsiung', code: 'KHH' },
    { city: '巴黎', country: '法国', pinyin: 'bali paris', code: 'PAR' },
    { city: '伦敦', country: '英国', pinyin: 'lun dun london', code: 'LHR' },
    { city: '纽约', country: '美国', pinyin: 'niu yue new york', code: 'JFK' },
    { city: '洛杉矶', country: '美国', pinyin: 'luo shan ji los angeles', code: 'LAX' },
    { city: '旧金山', country: '美国', pinyin: 'jiu jin shan san francisco', code: 'SFO' },
    { city: '悉尼', country: '澳大利亚', pinyin: 'xi ni sydney', code: 'SYD' },
    { city: '墨尔本', country: '澳大利亚', pinyin: 'mo er ben melbourne', code: 'MEL' },
    { city: '迪拜', country: '阿联酋', pinyin: 'di wan dubai', code: 'DXB' },
    { city: '香港', country: '中国', pinyin: 'xianggang hongkong', code: 'HKG' },
    { city: '上海', country: '中国', pinyin: 'shanghai', code: 'SHA' },
    { city: '北京', country: '中国', pinyin: 'beijing', code: 'PEK' },
    { city: '广州', country: '中国', pinyin: 'guangzhou', code: 'CAN' },
    { city: '深圳', country: '中国', pinyin: 'shenzhen', code: 'SZX' },
    { city: '成都', country: '中国', pinyin: 'chengdu', code: 'CTU' },
    { city: '杭州', country: '中国', pinyin: 'hangzhou', code: 'HGH' },
    { city: '南京', country: '中国', pinyin: 'nanjing', code: 'NKG' },
    { city: '西安', country: '中国', pinyin: 'xian', code: 'XIY' },
    { city: '厦门', country: '中国', pinyin: 'xiamen', code: 'XMN' }
  ],

  // 热门出发地
  popularDepartures: ['上海', '北京', '广州', '深圳', '成都', '杭州', '香港'],

  // 搜索城市（模糊匹配）
  searchCities(keyword) {
    if (!keyword || keyword.length < 1) return [];
    const lowerKeyword = keyword.toLowerCase();
    return this.allCities.filter(city =>
      city.city.includes(keyword) ||
      city.pinyin.includes(lowerKeyword) ||
      city.code.toLowerCase().includes(lowerKeyword)
    ).slice(0, 6);
  },

  // 添加搜索历史
  addSearch(departure, arrival) {
    const history = this.getHistory();

    // 移除重复
    const existingIndex = history.findIndex(
      h => h.departure === departure && h.arrival === arrival
    );
    if (existingIndex >= 0) {
      history.splice(existingIndex, 1);
    }

    // 添加到开头
    history.unshift({
      departure,
      arrival,
      timestamp: new Date().toISOString()
    });

    // 限制数量
    if (history.length > this.MAX_HISTORY) {
      history.pop();
    }

    this.saveHistory(history);
    return history;
  },

  // 获取搜索历史
  getHistory() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  },

  // 保存搜索历史
  saveHistory(history) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
  },

  // 清除搜索历史
  clearHistory() {
    localStorage.removeItem(this.STORAGE_KEY);
  },

  // 格式化历史时间为友好显示
  formatHistoryTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  }
};

// 生成热门目的地HTML
function renderPopularDestinations(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const html = SearchHistory.popularDestinations.map(dest => `
    <button onclick="quickSearch('${dest.city}')"
      class="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-full hover:bg-blue-50 hover:border-blue-300 transition-colors">
      <span class="mr-2">${dest.icon}</span>
      <span class="font-medium text-gray-700">${dest.city}</span>
      <span class="text-gray-400 text-sm ml-1">${dest.country}</span>
    </button>
  `).join('');

  container.innerHTML = `
    <div class="flex flex-wrap gap-2">
      ${html}
    </div>
  `;
}

// 生成搜索历史HTML
function renderSearchHistory(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const history = SearchHistory.getHistory();

  if (history.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4">
        <p class="text-gray-400 text-sm">暂无搜索历史</p>
      </div>
    `;
    return;
  }

  const html = history.slice(0, 5).map(item => `
    <button onclick="quickSearch('${item.arrival}', '${item.departure}')"
      class="flex items-center w-full px-4 py-3 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors text-left">
      <i class="fas fa-history text-gray-400 mr-3"></i>
      <div class="flex-1">
        <span class="font-medium text-gray-700">${item.departure}</span>
        <i class="fas fa-arrow-right text-gray-400 mx-2 text-xs"></i>
        <span class="font-medium text-gray-700">${item.arrival}</span>
      </div>
      <span class="text-gray-400 text-xs">${SearchHistory.formatHistoryTime(item.timestamp)}</span>
    </button>
  `).join('');

  container.innerHTML = html;
}

// 快速搜索（从热门目的地或历史点击）
function quickSearch(arrival, departure = '上海') {
  // 保存到搜索历史
  SearchHistory.addSearch(departure, arrival);

  // 跳转到搜索页（可以带上参数）
  window.location.href = `search.html?from=${encodeURIComponent(departure)}&to=${encodeURIComponent(arrival)}`;
}

// 清除搜索历史
function clearSearchHistory() {
  SearchHistory.clearHistory();
  renderSearchHistory('search-history-container');
  // 简单的通知实现
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
  notification.textContent = '搜索历史已清除';
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 2000);
}

// 提交搜索
function submitSearch() {
  const departureInput = document.getElementById('search-departure');
  const arrivalInput = document.getElementById('search-arrival');
  const dateInput = document.getElementById('search-date');
  const passengerSelect = document.getElementById('passenger-count');
  const preferDirectCheckbox = document.getElementById('prefer-direct');
  const allowTransitCheckbox = document.getElementById('allow-transit');

  const departure = departureInput ? departureInput.value.trim() : '上海';
  const arrival = arrivalInput ? arrivalInput.value.trim() : '';
  const date = dateInput ? dateInput.value : '';
  const passengers = passengerSelect ? passengerSelect.value : '1';
  const preferDirect = preferDirectCheckbox ? preferDirectCheckbox.checked : false;
  const allowTransit = allowTransitCheckbox ? allowTransitCheckbox.checked : true;

  if (!arrival) {
    // 如果没输入目的地，提示用户
    arrivalInput.focus();
    return;
  }

  // 保存到搜索历史
  SearchHistory.addSearch(departure, arrival);

  // 跳转到搜索页
  let url = `search.html?from=${encodeURIComponent(departure)}&to=${encodeURIComponent(arrival)}`;
  if (date) {
    url += `&date=${encodeURIComponent(date)}`;
  }
  url += `&passengers=${encodeURIComponent(passengers)}`;
  url += `&preferDirect=${encodeURIComponent(preferDirect)}`;
  url += `&allowTransit=${encodeURIComponent(allowTransit)}`;
  window.location.href = url;
}

// 跳转到搜索页面时恢复搜索条件
function restoreSearchFromURL() {
  const params = new URLSearchParams(window.location.search);
  const from = params.get('from');
  const to = params.get('to');
  const date = params.get('date');
  const passengers = params.get('passengers');
  const preferDirect = params.get('preferDirect');
  const allowTransit = params.get('allowTransit');

  if (from) {
    const departureInput = document.getElementById('search-departure');
    if (departureInput) departureInput.value = from;
  }
  if (to) {
    const arrivalInput = document.getElementById('search-arrival');
    if (arrivalInput) arrivalInput.value = to;
  }
  if (date) {
    const dateInput = document.getElementById('search-date');
    if (dateInput) dateInput.value = date;
  }

  // 恢复中转偏好设置
  if (preferDirect !== null) {
    const preferDirectInput = document.getElementById('prefer-direct');
    if (preferDirectInput) preferDirectInput.checked = preferDirect === 'true';
  }
  if (allowTransit !== null) {
    const allowTransitInput = document.getElementById('allow-transit');
    if (allowTransitInput) allowTransitInput.checked = allowTransit === 'true';
  }

  // 更新搜索摘要的人数显示
  if (passengers) {
    const summary = document.getElementById('searchSummary');
    if (summary) {
      summary.textContent = `${from || '上海'} → ${to || ''} · ${date || ''} · ${passengers}位乘客`;
    }
  }
}

// 显示城市搜索建议
function showCitySuggestions(inputId, suggestionBoxId) {
  const input = document.getElementById(inputId);
  const suggestionBox = document.getElementById(suggestionBoxId);

  if (!input || !suggestionBox) return;

  input.addEventListener('input', function() {
    const keyword = this.value.trim();
    const suggestions = SearchHistory.searchCities(keyword);

    if (suggestions.length === 0) {
      suggestionBox.style.display = 'none';
      return;
    }

    suggestionBox.innerHTML = suggestions.map(city => `
      <button onclick="selectCity('${inputId}', '${suggestionBoxId}', '${city.city}')"
        class="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center justify-between border-b border-gray-100 last:border-b-0">
        <div>
          <span class="font-medium text-gray-800">${city.city}</span>
          <span class="text-gray-400 text-sm ml-2">${city.country}</span>
        </div>
        <span class="text-gray-400 text-xs">${city.code}</span>
      </button>
    `).join('');

    suggestionBox.style.display = 'block';
  });

  // 点击其他地方关闭建议框
  document.addEventListener('click', function(e) {
    if (!e.target.closest(`#${inputId}`) && !e.target.closest(`#${suggestionBoxId}`)) {
      suggestionBox.style.display = 'none';
    }
  });
}

// 选择城市
function selectCity(inputId, suggestionBoxId, city) {
  const input = document.getElementById(inputId);
  const suggestionBox = document.getElementById(suggestionBoxId);

  if (input) input.value = city;
  if (suggestionBox) suggestionBox.style.display = 'none';

  // 如果是目的地字段且有默认值上海，自动聚焦到目的地
  if (inputId === 'search-departure') {
    const arrivalInput = document.getElementById('search-arrival');
    if (arrivalInput && !arrivalInput.value) {
      arrivalInput.focus();
    }
  }

  // 如果是目的地字段，自动提交搜索
  if (inputId === 'search-arrival' && city) {
    // 延迟一下让用户看到选择了哪个城市
    setTimeout(() => {
      submitSearch();
    }, 200);
  }
}

// 初始化城市建议
function initCitySuggestions() {
  showCitySuggestions('search-departure', 'departure-suggestions');
  showCitySuggestions('search-arrival', 'arrival-suggestions');
}

// 个性化问候语
function getGreeting() {
  const hour = new Date().getHours();
  let greeting = '';
  let icon = '';

  if (hour >= 5 && hour < 11) {
    greeting = '早上好';
    icon = '☀️';
  } else if (hour >= 11 && hour < 14) {
    greeting = '中午好';
    icon = '🌞';
  } else if (hour >= 14 && hour < 18) {
    greeting = '下午好';
    icon = '🌤️';
  } else if (hour >= 18 && hour < 22) {
    greeting = '晚上好';
    icon = '🌙';
  } else {
    greeting = '夜深了';
    icon = '🌛';
  }

  return { greeting, icon };
}

// 渲染个性化问候
function renderGreeting() {
  const container = document.getElementById('greeting-container');
  if (!container) return;

  const { greeting, icon } = getGreeting();
  const userPrefs = window.getUserPreferences ? window.getUserPreferences() : null;

  let greetingText = `${icon} ${greeting}！`;

  if (userPrefs && userPrefs.departureCity) {
    greetingText += ` 从${userPrefs.departureCity}出发`;
    if (userPrefs.destinationCity) {
      greetingText += `，寻找${userPrefs.destinationCity}的特价`;
    }
  }

  container.innerHTML = `
    <div class="text-center mb-4">
      <h2 class="text-3xl md:text-4xl font-bold text-gray-800 mb-2">${greetingText}</h2>
      <p class="text-gray-600">发现隐藏的特价机票，AI智能推荐，帮您节省高达60%的机票费用</p>
    </div>
  `;
}

// 初始化搜索历史和热门目的地
document.addEventListener('DOMContentLoaded', function() {
  // 渲染个性化问候
  renderGreeting();

  // 渲染热门目的地
  renderPopularDestinations('popular-destinations');

  // 渲染搜索历史
  renderSearchHistory('search-history-container');

  // 初始化城市建议
  initCitySuggestions();

  // 显示/隐藏搜索历史区域
  const historySection = document.getElementById('search-history-section');
  if (historySection) {
    const history = SearchHistory.getHistory();
    if (history.length > 0) {
      historySection.style.display = 'block';
    }
  }

  // 绑定清除历史按钮
  const clearBtn = document.getElementById('clear-history-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearSearchHistory);
  }
});

// 导出到全局
window.SearchHistory = SearchHistory;
window.quickSearch = quickSearch;
window.submitSearch = submitSearch;
window.clearSearchHistory = clearSearchHistory;
window.renderPopularDestinations = renderPopularDestinations;
window.renderSearchHistory = renderSearchHistory;
window.restoreSearchFromURL = restoreSearchFromURL;
window.showCitySuggestions = showCitySuggestions;
window.selectCity = selectCity;
window.initCitySuggestions = initCitySuggestions;
window.getGreeting = getGreeting;
window.renderGreeting = renderGreeting;
