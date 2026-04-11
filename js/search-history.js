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

// 从航班数据中获取热门目的地（动态，基于实际航班数据）
function getPopularDestinationsFromFlights() {
  // 硬编码的热门目的地映射表（城市 -> icon）
  const cityIconMap = {
    '东京': '🇯🇵', '大阪': '🇯🇵', '名古屋': '🇯🇵', '福冈': '🇯🇵',
    '曼谷': '🇹🇭', '清迈': '🇹🇭', '普吉岛': '🇹🇭',
    '新加坡': '🇸🇬',
    '首尔': '🇰🇷', '济州岛': '🇰🇷',
    '台北': '🇹🇼', '高雄': '🇹🇼',
    '巴黎': '🇫🇷',
    '伦敦': '🇬🇧',
    '纽约': '🇺🇸', '洛杉矶': '🇺🇸', '旧金山': '🇺🇸',
    '悉尼': '🇦🇺', '墨尔本': '🇦🇺',
    '迪拜': '🇦🇪',
    '香港': '🇭🇰', '上海': '🇨🇳', '北京': '🇨🇳', '广州': '🇨🇳', '深圳': '🇨🇳', '成都': '🇨🇳', '杭州': '🇨🇳',
    '马尼拉': '🇵🇭',
    '伊斯坦布尔': '🇹🇷',
    '卡萨布兰卡': '🇲🇦',
    '亚的斯亚贝巴': '🇪🇹'
  };

  // 航班数据中的目的地城市集合
  const flightDestinations = new Set();

  // 从flightData.flights获取目的地
  if (window.flightData && window.flightData.flights) {
    window.flightData.flights.forEach(flight => {
      if (flight.arrival && flight.arrival.city) {
        flightDestinations.add(flight.arrival.city);
      }
    });
  }

  // 从flightData.recommendations获取目的地
  if (window.flightData && window.flightData.recommendations) {
    window.flightData.recommendations.forEach(flight => {
      if (flight.arrival && flight.arrival.city) {
        flightDestinations.add(flight.arrival.city);
      }
    });
  }

  // 只保留航班数据中存在的城市
  const validDestinations = SearchHistory.popularDestinations.filter(
    dest => flightDestinations.has(dest.city)
  );

  // 如果有效目的地少于4个，使用allCities中存在于航班数据中的城市补充
  if (validDestinations.length < 4 && window.flightData) {
    const allWithFlights = SearchHistory.allCities.filter(
      city => flightDestinations.has(city.city)
    );
    // 补充城市
    const needed = 8 - validDestinations.length;
    const cityNames = new Set(validDestinations.map(d => d.city));
    for (const city of allWithFlights) {
      if (!cityNames.has(city.city)) {
        validDestinations.push({
          city: city.city,
          country: city.country,
          icon: cityIconMap[city.city] || '🏙️'
        });
        cityNames.add(city.city);
        if (validDestinations.length >= 8) break;
      }
    }
  }

  return validDestinations.slice(0, 8); // 最多8个
}

// 生成热门目的地HTML
function renderPopularDestinations(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // 基于航班数据动态获取热门目的地
  const popularCities = getPopularDestinationsFromFlights();

  const html = popularCities.map(dest => `
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
// 注意：热门目的地不设置出发城市，只设置到达城市，以显示所有出发地的航班
function quickSearch(arrival, departure = '') {
  // 保存到搜索历史
  SearchHistory.addSearch(departure || '上海', arrival);

  // 跳转到搜索页 - 热门目的地不限制出发城市，只筛选目的地
  let url = `search.html?to=${encodeURIComponent(arrival)}`;
  if (departure) {
    url += `&from=${encodeURIComponent(departure)}`;
  }
  window.location.href = url;
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

// ============================================
// 统一的搜索状态管理 - 首页和搜索页状态同步
// ============================================
const SearchState = {
  STORAGE_KEY: 'searchState',

  // 默认状态
  DEFAULT_STATE: {
    departure: '上海',
    arrival: '',
    date: '',
    passengers: '1',
    preferDirect: false,
    allowTransit: true,
    // 筛选器状态
    minPrice: 500,
    maxPrice: 3000,
    airlines: [],
    cabins: [],
    specialOnly: true
  },

  // 获取当前状态
  getState() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        return { ...this.DEFAULT_STATE, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('获取搜索状态失败:', error);
    }
    return { ...this.DEFAULT_STATE };
  },

  // 保存状态
  saveState(state) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('保存搜索状态失败:', error);
    }
  },

  // 从当前页面收集状态
  collectFromPage() {
    const state = {};

    // 收集搜索条件
    const departureInput = document.getElementById('search-departure');
    const arrivalInput = document.getElementById('search-arrival');
    const dateInput = document.getElementById('search-date');
    const passengerSelect = document.getElementById('passenger-count');

    state.departure = departureInput ? departureInput.value.trim() || '上海' : '上海';
    state.arrival = arrivalInput ? arrivalInput.value.trim() : '';
    state.date = dateInput ? dateInput.value : '';
    state.passengers = passengerSelect ? passengerSelect.value : '1';

    // 收集中转偏好
    const preferDirect = document.getElementById('prefer-direct');
    const allowTransit = document.getElementById('allow-transit');
    state.preferDirect = preferDirect ? preferDirect.checked : false;
    state.allowTransit = allowTransit ? allowTransit.checked : true;

    // 收集筛选器状态（仅在搜索页）
    const priceRange = document.getElementById('priceRange');
    if (priceRange) {
      state.minPrice = 500;
      state.maxPrice = parseInt(priceRange.value) || 3000;
    }

    // 收集航空公司
    const airlineCheckboxes = document.querySelectorAll('.airline-checkbox');
    if (airlineCheckboxes.length > 0) {
      state.airlines = [];
      airlineCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
          const airlineName = checkbox.parentElement.querySelector('span').textContent;
          state.airlines.push(airlineName);
        }
      });
    }

    // 收集舱位
    const cabinCheckboxes = document.querySelectorAll('.cabin-checkbox');
    if (cabinCheckboxes.length > 0) {
      state.cabins = [];
      cabinCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
          const cabinName = checkbox.parentElement.querySelector('span').textContent;
          state.cabins.push(cabinName);
        }
      });
    }

    // 收集特价筛选
    const specialOnly = document.getElementById('specialOnly');
    state.specialOnly = specialOnly ? specialOnly.checked : true;

    return state;
  },

  // 应用状态到当前页面
  applyToPage(state) {
    // 应用搜索条件
    const departureInput = document.getElementById('search-departure');
    const arrivalInput = document.getElementById('search-arrival');
    const dateInput = document.getElementById('search-date');
    const passengerSelect = document.getElementById('passenger-count');

    if (departureInput && state.departure) departureInput.value = state.departure;
    if (arrivalInput && state.arrival) arrivalInput.value = state.arrival;
    if (dateInput && state.date) dateInput.value = state.date;
    if (passengerSelect && state.passengers) passengerSelect.value = state.passengers;

    // 应用中转偏好
    const preferDirect = document.getElementById('prefer-direct');
    const allowTransit = document.getElementById('allow-transit');
    if (preferDirect) preferDirect.checked = state.preferDirect;
    if (allowTransit) allowTransit.checked = state.allowTransit;

    // 应用价格范围
    const priceRange = document.getElementById('priceRange');
    const priceValue = document.getElementById('priceValue');
    if (priceRange && state.maxPrice) {
      priceRange.value = Math.min(state.maxPrice, parseInt(priceRange.max) || 5000);
      if (priceValue) {
        priceValue.textContent = `¥500 - ¥${priceRange.value}`;
      }
    }

    // 应用航空公司
    const airlineCheckboxes = document.querySelectorAll('.airline-checkbox');
    if (airlineCheckboxes.length > 0 && state.airlines) {
      airlineCheckboxes.forEach(checkbox => {
        const airlineName = checkbox.parentElement.querySelector('span').textContent;
        checkbox.checked = state.airlines.includes(airlineName);
      });
    }

    // 应用舱位
    const cabinCheckboxes = document.querySelectorAll('.cabin-checkbox');
    if (cabinCheckboxes.length > 0 && state.cabins) {
      cabinCheckboxes.forEach(checkbox => {
        const cabinName = checkbox.parentElement.querySelector('span').textContent;
        checkbox.checked = state.cabins.includes(cabinName);
      });
    }

    // 应用特价筛选
    const specialOnly = document.getElementById('specialOnly');
    if (specialOnly) specialOnly.checked = state.specialOnly;
  },

  // 初始化页面状态（优先从URL恢复，否则从localStorage恢复）
  initPageState() {
    // 首先尝试从URL恢复
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    const to = params.get('to');
    const date = params.get('date');
    const passengers = params.get('passengers');

    // 如果URL中有参数，使用URL参数
    if (from || to) {
      const state = this.getState();
      // 只有明确指定了出发城市才设置，热门搜索不限制出发城市
      if (from) state.departure = decodeURIComponent(from);
      if (to) state.arrival = decodeURIComponent(to);
      if (date) state.date = decodeURIComponent(date);
      if (passengers) state.passengers = decodeURIComponent(passengers);
      if (params.get('preferDirect')) state.preferDirect = params.get('preferDirect') === 'true';
      if (params.get('allowTransit')) state.allowTransit = params.get('allowTransit') === 'true';
      this.saveState(state);
      this.applyToPage(state);
      return true;
    }

    // 否则从localStorage恢复
    const savedState = this.getState();
    // 只有当有保存的目的地时才应用状态
    if (savedState.arrival || savedState.departure) {
      this.applyToPage(savedState);
      return true;
    }

    return false;
  },

  // 同步当前筛选状态到localStorage
  syncFiltersToStorage() {
    const state = this.collectFromPage();
    this.saveState(state);
  }
};

// 修改submitSearch函数使用SearchState
const originalSubmitSearch = submitSearch;
submitSearch = function() {
  const departureInput = document.getElementById('search-departure');
  const arrivalInput = document.getElementById('search-arrival');
  const dateInput = document.getElementById('search-date');
  const passengerSelect = document.getElementById('passenger-count');

  const departure = departureInput ? departureInput.value.trim() || '上海' : '上海';
  const arrival = arrivalInput ? arrivalInput.value.trim() : '';
  const date = dateInput ? dateInput.value : '';
  const passengers = passengerSelect ? passengerSelect.value : '1';

  if (!arrival) {
    if (arrivalInput) arrivalInput.focus();
    return;
  }

  // 使用SearchState保存状态
  const state = SearchState.getState();
  state.departure = departure;
  state.arrival = arrival;
  state.date = date;
  state.passengers = passengers;
  SearchState.saveState(state);

  // 保存到搜索历史
  SearchHistory.addSearch(departure, arrival);

  // 跳转到搜索页（不传递中转偏好，让搜索页从localStorage读取）
  let url = `search.html?from=${encodeURIComponent(departure)}&to=${encodeURIComponent(arrival)}`;
  if (date) {
    url += `&date=${encodeURIComponent(date)}`;
  }
  url += `&passengers=${encodeURIComponent(passengers)}`;
  window.location.href = url;
};

// 导出到全局
window.SearchHistory = SearchHistory;
window.SearchState = SearchState;
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
