// 偏好设置页面JavaScript逻辑

// 默认偏好设置
const defaultPreferences = {
  departureCities: [],
  priceSensitivity: 3, // 1-5, 1=价格优先, 5=品质优先
  cabinPreferences: ['经济舱'],
  airlinePreferences: ['中国东方航空', '中国国际航空', '南方航空'],
  priceAlertsEnabled: true,
  dealNotificationsEnabled: true,
  notificationFrequency: '每日一次',
  createdAt: new Date().toISOString()
};

// 当前偏好设置
let userPreferences = { ...defaultPreferences };

document.addEventListener('DOMContentLoaded', function() {
  loadPreferences();
  setupEventListeners();
  updateSummary();
  loadActiveAlerts();
});

// 加载用户偏好设置
function loadPreferences() {
  try {
    const saved = localStorage.getItem('flightPreferences');
    if (saved) {
      userPreferences = JSON.parse(saved);
      updateUIFromPreferences();
    }
  } catch (error) {
    console.error('加载偏好设置失败:', error);
  }
}

// 将偏好设置更新到UI
function updateUIFromPreferences() {
  // 出发城市
  const dep1 = document.getElementById('departure-city-1');
  const dep2 = document.getElementById('departure-city-2');
  if (dep1 && userPreferences.departureCities[0]) {
    dep1.value = userPreferences.departureCities[0];
  }
  if (dep2 && userPreferences.departureCities[1]) {
    dep2.value = userPreferences.departureCities[1];
  }

  // 价格敏感度
  const sensitivitySlider = document.getElementById('price-sensitivity');
  const sensitivityValue = document.getElementById('sensitivity-value');
  if (sensitivitySlider) {
    sensitivitySlider.value = userPreferences.priceSensitivity;
    updateSensitivityDisplay(userPreferences.priceSensitivity);
  }

  // 舱位偏好
  const cabinCheckboxes = document.querySelectorAll('input[type="checkbox"]');
  cabinCheckboxes.forEach(checkbox => {
    const label = checkbox.parentElement.querySelector('span');
    if (label && userPreferences.cabinPreferences.includes(label.textContent)) {
      checkbox.checked = true;
    }
  });

  // 航空公司偏好
  // 注意：这里简化处理，实际需要更精确的匹配

  // 通知设置
  const priceAlertsToggle = document.getElementById('price-alerts-toggle');
  const dealNotificationsToggle = document.getElementById('deal-notifications-toggle');
  if (priceAlertsToggle) priceAlertsToggle.checked = userPreferences.priceAlertsEnabled;
  if (dealNotificationsToggle) dealNotificationsToggle.checked = userPreferences.dealNotificationsEnabled;

  // 通知频率
  const frequencyRadios = document.querySelectorAll('input[name="frequency"]');
  frequencyRadios.forEach(radio => {
    if (radio.parentElement.querySelector('span').textContent === userPreferences.notificationFrequency) {
      radio.checked = true;
    }
  });
}

// 设置事件监听器
function setupEventListeners() {
  // 价格敏感度滑块
  const sensitivitySlider = document.getElementById('price-sensitivity');
  if (sensitivitySlider) {
    sensitivitySlider.addEventListener('input', function() {
      const value = parseInt(this.value);
      updateSensitivityDisplay(value);
      userPreferences.priceSensitivity = value;
      updateSummary();
    });
  }

  // 保存按钮
  const saveButton = document.getElementById('save-preferences');
  if (saveButton) {
    saveButton.addEventListener('click', savePreferences);
  }

  // 重置按钮
  const resetButton = document.getElementById('reset-preferences');
  if (resetButton) {
    resetButton.addEventListener('click', resetPreferences);
  }

  // 舱位偏好复选框
  const cabinCheckboxes = document.querySelectorAll('input[type="checkbox"]');
  cabinCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      updateCabinPreferences();
    });
  });

  // 通知开关
  const priceAlertsToggle = document.getElementById('price-alerts-toggle');
  const dealNotificationsToggle = document.getElementById('deal-notifications-toggle');
  if (priceAlertsToggle) {
    priceAlertsToggle.addEventListener('change', function() {
      userPreferences.priceAlertsEnabled = this.checked;
      updateSummary();
    });
  }
  if (dealNotificationsToggle) {
    dealNotificationsToggle.addEventListener('change', function() {
      userPreferences.dealNotificationsEnabled = this.checked;
      updateSummary();
    });
  }

  // 通知频率单选按钮
  const frequencyRadios = document.querySelectorAll('input[name="frequency"]');
  frequencyRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.checked) {
        userPreferences.notificationFrequency = this.parentElement.querySelector('span').textContent;
      }
    });
  });

  // 出发城市输入框
  const depInputs = [document.getElementById('departure-city-1'), document.getElementById('departure-city-2')];
  depInputs.forEach(input => {
    if (input) {
      input.addEventListener('input', function() {
        updateDepartureCities();
      });
    }
  });
}

// 更新价格敏感度显示
function updateSensitivityDisplay(value) {
  const display = document.getElementById('sensitivity-value');
  if (!display) return;

  const labels = {
    1: '价格优先',
    2: '偏向价格',
    3: '中等',
    4: '偏向品质',
    5: '品质优先'
  };

  display.textContent = labels[value] || '中等';
}

// 更新出发城市
function updateDepartureCities() {
  const dep1 = document.getElementById('departure-city-1');
  const dep2 = document.getElementById('departure-city-2');

  userPreferences.departureCities = [];
  if (dep1 && dep1.value.trim()) {
    userPreferences.departureCities.push(dep1.value.trim());
  }
  if (dep2 && dep2.value.trim()) {
    userPreferences.departureCities.push(dep2.value.trim());
  }

  updateSummary();
}

// 更新舱位偏好
function updateCabinPreferences() {
  const cabinCheckboxes = document.querySelectorAll('input[type="checkbox"]');
  userPreferences.cabinPreferences = [];

  cabinCheckboxes.forEach(checkbox => {
    const label = checkbox.parentElement.querySelector('span');
    if (checkbox.checked && label && ['经济舱', '超级经济舱', '商务舱', '头等舱'].includes(label.textContent)) {
      userPreferences.cabinPreferences.push(label.textContent);
    }
  });
}

// 更新摘要显示
function updateSummary() {
  // 出发城市
  const departureSummary = document.getElementById('summary-departure');
  if (departureSummary) {
    if (userPreferences.departureCities.length > 0) {
      departureSummary.textContent = userPreferences.departureCities.join(', ');
    } else {
      departureSummary.textContent = '未设置';
    }
  }

  // 价格敏感度
  const sensitivitySummary = document.getElementById('summary-sensitivity');
  if (sensitivitySummary) {
    const labels = {
      1: '价格优先',
      2: '偏向价格',
      3: '中等',
      4: '偏向品质',
      5: '品质优先'
    };
    sensitivitySummary.textContent = labels[userPreferences.priceSensitivity] || '中等';
  }

  // 价格提醒
  const alertsSummary = document.getElementById('summary-alerts');
  if (alertsSummary) {
    alertsSummary.textContent = userPreferences.priceAlertsEnabled ? '开启' : '关闭';
    alertsSummary.className = userPreferences.priceAlertsEnabled ? 'font-medium text-green-600' : 'font-medium text-gray-600';
  }

  // 特价推送
  const dealsSummary = document.getElementById('summary-deals');
  if (dealsSummary) {
    dealsSummary.textContent = userPreferences.dealNotificationsEnabled ? '开启' : '关闭';
    dealsSummary.className = userPreferences.dealNotificationsEnabled ? 'font-medium text-green-600' : 'font-medium text-gray-600';
  }
}

// 保存偏好设置
function savePreferences() {
  try {
    // 收集所有设置
    updateDepartureCities();
    updateCabinPreferences();

    // 更新最后修改时间
    userPreferences.updatedAt = new Date().toISOString();

    // 保存到localStorage
    localStorage.setItem('flightPreferences', JSON.stringify(userPreferences));

    showNotification('偏好设置已保存');

    // 更新摘要
    updateSummary();
  } catch (error) {
    console.error('保存偏好设置失败:', error);
    showNotification('保存失败，请重试', 'error');
  }
}

// 重置偏好设置
function resetPreferences() {
  if (confirm('确定要恢复默认设置吗？当前设置将丢失。')) {
    userPreferences = { ...defaultPreferences };
    updateUIFromPreferences();
    updateSummary();
    showNotification('已恢复默认设置');
  }
}

// 加载活跃的价格提醒
function loadActiveAlerts() {
  const container = document.getElementById('active-alerts');
  if (!container) return;

  try {
    const alerts = JSON.parse(localStorage.getItem('priceAlerts') || '[]');

    if (alerts.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4 text-gray-500">
          <i class="fas fa-bell-slash text-2xl mb-2"></i>
          <p>暂无活跃的价格提醒</p>
        </div>
      `;
      return;
    }

    // 显示最近的3个提醒
    const recentAlerts = alerts.slice(0, 3);
    container.innerHTML = '';

    recentAlerts.forEach(alert => {
      // 获取航班信息
      const flight = getFlightById(alert.flightId);
      if (!flight) return;

      const alertElement = document.createElement('div');
      alertElement.className = 'border border-gray-200 rounded-lg p-4';
      alertElement.innerHTML = `
        <div class="flex justify-between items-start">
          <div>
            <h4 class="font-medium text-gray-800">${flight.departure.city} → ${flight.arrival.city}</h4>
            <p class="text-gray-600 text-sm">${flight.airline} ${flight.flightNumber}</p>
            <p class="text-gray-500 text-xs mt-1">
              <i class="far fa-clock mr-1"></i>设置于 ${formatDate(alert.createdAt)}
            </p>
          </div>
          <div class="text-right">
            <div class="text-lg font-bold text-blue-600">¥${alert.targetPrice}</div>
            <div class="text-gray-500 text-sm">当前 ¥${alert.currentPrice}</div>
          </div>
        </div>
        <div class="mt-3 flex justify-between items-center">
          <span class="text-sm ${alert.currentPrice <= alert.targetPrice ? 'text-green-600' : 'text-gray-600'}">
            ${alert.currentPrice <= alert.targetPrice ? '✓ 已达到目标价' : '等待降价中...'}
          </span>
          <button onclick="removeAlert(${alert.flightId})" class="text-gray-400 hover:text-red-500 text-sm">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `;

      container.appendChild(alertElement);
    });

    // 如果还有更多提醒，显示查看更多
    if (alerts.length > 3) {
      const moreElement = document.createElement('div');
      moreElement.className = 'text-center mt-4';
      moreElement.innerHTML = `
        <button onclick="showAllAlerts()" class="text-blue-600 hover:text-blue-800 text-sm">
          查看全部 ${alerts.length} 个提醒 →
        </button>
      `;
      container.appendChild(moreElement);
    }

  } catch (error) {
    console.error('加载价格提醒失败:', error);
  }
}

// 移除价格提醒
function removeAlert(flightId) {
  try {
    const alerts = JSON.parse(localStorage.getItem('priceAlerts') || '[]');
    const newAlerts = alerts.filter(alert => alert.flightId !== flightId);
    localStorage.setItem('priceAlerts', JSON.stringify(newAlerts));
    loadActiveAlerts();
    showNotification('价格提醒已移除');
  } catch (error) {
    console.error('移除提醒失败:', error);
  }
}

// 显示所有提醒（简化版）
function showAllAlerts() {
  alert('功能开发中：这里将显示所有价格提醒的详细页面。');
}

// 显示通知
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in ${
    type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
  }`;
  notification.innerHTML = `
    <div class="flex items-center">
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} mr-2"></i>
      <span>${message}</span>
    </div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// 格式化日期
function formatDate(dateStr) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  } catch (error) {
    return '未知时间';
  }
}

// 获取航班信息（从data.js中）
function getFlightById(id) {
  if (typeof window.getFlightById === 'function') {
    return window.getFlightById(id);
  }

  // 备用方案
  const allFlights = [...(window.flightData?.flights || []), ...(window.flightData?.recommendations || [])];
  return allFlights.find(flight => flight.id === id);
}

// 导出函数供其他页面使用
window.getUserPreferences = function() {
  try {
    const saved = localStorage.getItem('flightPreferences');
    return saved ? JSON.parse(saved) : { ...defaultPreferences };
  } catch (error) {
    return { ...defaultPreferences };
  }
};