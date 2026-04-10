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

  // 热门出发地
  popularDepartures: ['上海', '北京', '广州', '深圳', '成都', '杭州', '香港'],

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

  const departure = departureInput ? departureInput.value.trim() : '上海';
  const arrival = arrivalInput ? arrivalInput.value.trim() : '';
  const date = dateInput ? dateInput.value : '';

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
  window.location.href = url;
}

// 跳转到搜索页面时恢复搜索条件
function restoreSearchFromURL() {
  const params = new URLSearchParams(window.location.search);
  const from = params.get('from');
  const to = params.get('to');
  const date = params.get('date');

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
}

// 初始化搜索历史和热门目的地
document.addEventListener('DOMContentLoaded', function() {
  // 渲染热门目的地
  renderPopularDestinations('popular-destinations');

  // 渲染搜索历史
  renderSearchHistory('search-history-container');

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
