// 详情页JavaScript逻辑

let currentFlight = null;
let passengerCount = 1;

document.addEventListener('DOMContentLoaded', function() {
  // 从URL获取航班ID
  const urlParams = new URLSearchParams(window.location.search);
  const flightId = parseInt(urlParams.get('id')) || 101;

  // 加载航班数据
  loadFlightDetail(flightId);
  loadPriceComparison(flightId);
  setupPassengerControls();
  setupShareButtons();
});

// 加载航班详情
function loadFlightDetail(flightId) {
  currentFlight = flightData.flights.find(f => f.id === flightId) ||
                  flightData.recommendations.find(f => f.id === flightId);

  if (!currentFlight) {
    // 如果没有找到，使用第一个推荐航班
    currentFlight = flightData.recommendations[0];
  }

  updateFlightDetails();
  loadSimilarFlights();
}

// 加载相似航班推荐
function loadSimilarFlights() {
  const container = document.getElementById('similar-flights-container');
  if (!container || !currentFlight) return;

  // 使用协同过滤算法获取相似航班
  let similarFlights = [];
  if (window.RecommendationEngine) {
    similarFlights = window.RecommendationEngine.getCollaborativeFilteringRecommendations(
      flightData.flights,
      currentFlight,
      4
    );
  }

  // 如果推荐引擎不可用，使用备用相似度计算
  if (similarFlights.length === 0) {
    similarFlights = getFallbackSimilarFlights(currentFlight, flightData.flights);
  }

  if (similarFlights.length === 0) {
    container.innerHTML = `
      <div class="col-span-2 text-center text-gray-500 py-8">
        <i class="fas fa-search text-2xl mb-2"></i>
        <p>暂无相似航班推荐</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  similarFlights.forEach((flight, index) => {
    const similarity = calculateSimpleSimilarity(currentFlight, flight);
    const card = createSimilarFlightCard(flight, similarity, index);
    container.appendChild(card);
  });
}

// 创建相似航班卡片
function createSimilarFlightCard(flight, similarity, index) {
  const discount = flight.originalPrice
    ? Math.round((1 - flight.price / flight.originalPrice) * 100)
    : 0;

  const card = document.createElement('a');
  card.href = `detail.html?id=${flight.id}`;
  card.className = 'block bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 hover:from-purple-100 hover:to-indigo-100 transition-all duration-200 border border-purple-100 hover:border-purple-300';

  card.innerHTML = `
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center">
        <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
          <i class="fas fa-plane text-purple-600"></i>
        </div>
        <div>
          <div class="font-bold text-gray-800">${flight.airline}</div>
          <div class="text-gray-500 text-sm">${flight.flightNumber}</div>
        </div>
      </div>
      <div class="text-right">
        <div class="text-2xl font-bold text-purple-600">¥${flight.price.toLocaleString()}</div>
        ${flight.originalPrice ? `<div class="text-gray-400 text-sm line-through">¥${flight.originalPrice.toLocaleString()}</div>` : ''}
      </div>
    </div>
    <div class="flex items-center justify-between text-sm">
      <div class="flex items-center space-x-4">
        <span class="text-gray-600">${flight.departure.city}</span>
        <i class="fas fa-arrow-right text-gray-400"></i>
        <span class="text-gray-600">${flight.arrival.city}</span>
      </div>
      ${discount > 0 ? `<span class="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">省${discount}%</span>` : ''}
    </div>
    <div class="mt-3 pt-3 border-t border-purple-100 flex items-center justify-between">
      <div class="flex items-center text-xs text-gray-500">
        <i class="fas fa-clock mr-1"></i>${flight.duration}
        ${flight.stops === 0 ? '<span class="ml-2"><i class="fas fa-check-circle text-green-500 mr-1"></i>直飞</span>' : `<span class="ml-2">${flight.stops}程中转</span>`}
      </div>
      <div class="flex items-center">
        <i class="fas fa-robot text-purple-500 text-xs mr-1"></i>
        <span class="text-purple-600 text-xs font-medium">相似度 ${similarity}%</span>
      </div>
    </div>
    <div class="mt-3 feedback-container" onclick="event.stopPropagation();">
      ${typeof createFeedbackButtons === 'function' ? createFeedbackButtons(flight.id, 'detail-similar', similarity) : ''}
    </div>
  `;

  return card;
}

// 计算简单相似度（备用算法）
function calculateSimpleSimilarity(flightA, flightB) {
  let similarity = 50; // 基础相似度

  // 相同航空公司
  if (flightA.airline === flightB.airline) similarity += 15;

  // 相同舱位
  if (flightA.cabin === flightB.cabin) similarity += 10;

  // 价格相近（±20%）
  const priceDiff = Math.abs(flightA.price - flightB.price) / flightA.price;
  if (priceDiff < 0.2) similarity += 15;
  else if (priceDiff < 0.5) similarity += 5;

  // 相同中转次数
  if (flightA.stops === flightB.stops) similarity += 10;

  return Math.min(99, similarity);
}

// 备用相似航班获取（当推荐引擎不可用时）
function getFallbackSimilarFlights(targetFlight, allFlights) {
  return allFlights
    .filter(f => f.id !== targetFlight.id)
    .map(f => ({
      ...f,
      _similarity: calculateSimpleSimilarity(targetFlight, f)
    }))
    .sort((a, b) => b._similarity - a._similarity)
    .slice(0, 4);
}

// 更新航班详情显示
function updateFlightDetails() {
  if (!currentFlight) return;

  // 更新标题和基本信息
  document.getElementById('flight-title').textContent =
    `${currentFlight.departure.city} → ${currentFlight.arrival.city}`;

  document.getElementById('flight-subtitle').textContent =
    `${currentFlight.airline} ${currentFlight.flightNumber} · ${formatDate(currentFlight.date)} · ${currentFlight.cabin}`;

  // 价格信息
  document.getElementById('flight-price').textContent =
    `¥${currentFlight.price.toLocaleString('zh-CN')}`;

  if (currentFlight.originalPrice) {
    document.getElementById('original-price').textContent =
      `原价 ¥${currentFlight.originalPrice.toLocaleString('zh-CN')}`;
    document.getElementById('original-price').classList.remove('hidden');

    const discount = Math.round((1 - currentFlight.price / currentFlight.originalPrice) * 100);
    document.getElementById('discount-rate').textContent = `节省 ${discount}%`;
    document.getElementById('discount-rate').classList.remove('hidden');
  }

  // 出发信息
  document.getElementById('departure-city').textContent = currentFlight.departure.city;
  document.getElementById('departure-airport').textContent = currentFlight.departure.airport;
  document.getElementById('departure-time').textContent = currentFlight.departure.time;
  document.getElementById('departure-date').textContent = formatDate(currentFlight.date);

  // 到达信息
  document.getElementById('arrival-city').textContent = currentFlight.arrival.city;
  document.getElementById('arrival-airport').textContent = currentFlight.arrival.airport;
  document.getElementById('arrival-time').textContent = currentFlight.arrival.time;
  document.getElementById('arrival-date').textContent = formatDate(currentFlight.date);

  // 飞行时长
  document.getElementById('flight-duration').textContent = currentFlight.duration;

  // 特价标签
  const specialTag = document.querySelector('.special-tag');
  if (currentFlight.isSpecial && specialTag) {
    specialTag.classList.remove('hidden');
  }

  // 有效期
  if (currentFlight.validUntil) {
    const validDate = new Date(currentFlight.validUntil);
    document.getElementById('valid-until').textContent =
      validDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }) +
      ' ' + validDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }

  // 更新总价格
  updateTotalPrice();
}

// 加载价格对比
function loadPriceComparison(flightId) {
  const container = document.getElementById('price-comparison');
  if (!container) return;

  const comparisons = flightData.priceComparisons[flightId] ||
                     flightData.priceComparisons[101] ||
                     generateDefaultComparisons(currentFlight);

  container.innerHTML = '';

  comparisons.forEach((item, index) => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50';

    // 最佳价格标记
    const bestPriceBadge = item.isBest ?
      '<span class="inline-block bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded ml-2">最低价</span>' : '';

    row.innerHTML = `
      <td class="py-4 px-4">
        <div class="flex items-center">
          <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <span class="text-blue-600 font-bold">${item.platform.charAt(0)}</span>
          </div>
          <span class="font-medium text-gray-800">${item.platform}</span>
          ${bestPriceBadge}
        </div>
      </td>
      <td class="py-4 px-4">
        <div class="text-2xl font-bold text-gray-800">¥${item.price.toLocaleString('zh-CN')}</div>
        ${item.isBest ?
          '<div class="text-green-600 text-sm font-medium">比平均价低15%</div>' :
          '<div class="text-gray-500 text-sm">市场平均价</div>'
        }
      </td>
      <td class="py-4 px-4">
        <div class="text-gray-600 text-sm mb-1">
          <i class="fas fa-check text-green-500 mr-1"></i>支持支付宝/微信
        </div>
        <div class="text-gray-600 text-sm">
          <i class="fas fa-check text-green-500 mr-1"></i>24小时免费取消
        </div>
      </td>
      <td class="py-4 px-4">
        <a href="${item.url || '#'}" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200" target="_blank">
          前往预订
        </a>
      </td>
    `;

    container.appendChild(row);
  });
}

// 生成默认价格对比数据
function generateDefaultComparisons(flight) {
  const basePrice = flight.price;
  return [
    { platform: "携程旅行", price: basePrice, url: "#", isBest: true },
    { platform: "飞猪", price: basePrice + 50, url: "#", isBest: false },
    { platform: "去哪儿", price: basePrice + 20, url: "#", isBest: false },
    { platform: `${flight.airline}官网`, price: basePrice - 20, url: "#", isBest: false }
  ];
}

// 设置乘客数量控制
function setupPassengerControls() {
  const decreaseBtn = document.getElementById('decrease-passenger');
  const increaseBtn = document.getElementById('increase-passenger');
  const passengerCount = document.getElementById('passenger-count');

  if (decreaseBtn && increaseBtn && passengerCount) {
    decreaseBtn.addEventListener('click', function() {
      let count = parseInt(passengerCount.textContent);
      if (count > 1) {
        count--;
        passengerCount.textContent = count;
        updateTotalPrice();
      }
    });

    increaseBtn.addEventListener('click', function() {
      let count = parseInt(passengerCount.textContent);
      if (count < 9) {
        count++;
        passengerCount.textContent = count;
        updateTotalPrice();
      }
    });
  }
}

// 更新总价格
function updateTotalPrice() {
  const passengerCount = parseInt(document.getElementById('passenger-count').textContent);
  const totalPrice = document.getElementById('total-price');

  if (currentFlight && totalPrice) {
    const total = currentFlight.price * passengerCount;
    totalPrice.textContent = `¥${total.toLocaleString('zh-CN')}`;
  }
}

// 设置分享按钮
function setupShareButtons() {
  const shareButtons = document.querySelectorAll('.share-button');
  shareButtons.forEach(button => {
    button.addEventListener('click', function() {
      const platform = this.querySelector('i').className;

      let message = `发现特价机票：${currentFlight.departure.city} → ${currentFlight.arrival.city} 仅 ¥${currentFlight.price}`;
      if (currentFlight.originalPrice) {
        message += `，原价¥${currentFlight.originalPrice}，节省${Math.round((1 - currentFlight.price / currentFlight.originalPrice) * 100)}%`;
      }
      message += ` 通过特价机票发现平台`;

      if (platform.includes('weixin')) {
        showNotification('请使用微信扫一扫分享');
      } else if (platform.includes('weibo')) {
        const url = `http://service.weibo.com/share/share.php?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      } else if (platform.includes('link')) {
        navigator.clipboard.writeText(window.location.href)
          .then(() => showNotification('链接已复制到剪贴板'))
          .catch(() => {
            // 备用方案
            const tempInput = document.createElement('input');
            tempInput.value = window.location.href;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            showNotification('链接已复制到剪贴板');
          });
      }
    });
  });
}

// 显示通知
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
  notification.innerHTML = `
    <div class="flex items-center">
      <i class="fas fa-check-circle mr-2"></i>
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
  const date = new Date(dateStr);
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  return date.toLocaleDateString('zh-CN', options);
}

// 添加到收藏
function addToFavorites() {
  const favorites = JSON.parse(localStorage.getItem('flightFavorites') || '[]');

  if (!favorites.includes(currentFlight.id)) {
    favorites.push(currentFlight.id);
    localStorage.setItem('flightFavorites', JSON.stringify(favorites));
    showNotification('已添加到收藏夹');
  } else {
    showNotification('已在收藏夹中');
  }
}

// 设置价格提醒
function setPriceAlert() {
  const targetPrice = prompt('请输入目标价格（¥）:', Math.round(currentFlight.price * 0.9));

  if (targetPrice && !isNaN(targetPrice)) {
    const alerts = JSON.parse(localStorage.getItem('priceAlerts') || '[]');
    alerts.push({
      flightId: currentFlight.id,
      targetPrice: parseInt(targetPrice),
      currentPrice: currentFlight.price,
      createdAt: new Date().toISOString()
    });

    localStorage.setItem('priceAlerts', JSON.stringify(alerts));
    showNotification(`价格提醒已设置：当价格低于¥${targetPrice}时通知您`);
  }
}

// 出行小工具 - 行李额计算
function showBaggageCalculator() {
  const modal = document.getElementById('baggage-modal');
  if (modal) {
    modal.classList.remove('hidden');
  }
}

// 出行小工具 - 时差计算
function showTimezoneCalculator() {
  if (!currentFlight) return;

  const modal = document.getElementById('timezone-modal');
  if (!modal) return;

  modal.classList.remove('hidden');

  // 时区数据
  const timezones = {
    '东京': { tz: 'Asia/Tokyo', diff: '+1小时' },
    '大阪': { tz: 'Asia/Tokyo', diff: '+1小时' },
    '曼谷': { tz: 'Asia/Bangkok', diff: '-1小时' },
    '新加坡': { tz: 'Asia/Singapore', diff: '0小时' },
    '首尔': { tz: 'Asia/Seoul', diff: '+1小时' },
    '巴黎': { tz: 'Europe/Paris', diff: '-6小时' },
    '伦敦': { tz: 'Europe/London', diff: '-8小时' },
    '纽约': { tz: 'America/New_York', diff: '-13小时' },
    '洛杉矶': { tz: 'America/Los_Angeles', diff: '-16小时' },
    '悉尼': { tz: 'Australia/Sydney', diff: '+2小时' }
  };

  const city = currentFlight.arrival.city;
  const tzData = timezones[city] || { tz: 'Asia/Shanghai', diff: '0小时' };

  // 获取目的地当前时间
  const now = new Date();
  const destTime = new Date(now.toLocaleString('en-US', { timeZone: tzData.tz }));

  document.getElementById('destination-time').textContent =
    destTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('destination-date').textContent =
    destTime.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
  document.getElementById('timezone-diff').textContent = tzData.diff;
}

// 出行小工具 - 签证信息
function showVisaInfo() {
  if (!currentFlight) return;

  const modal = document.getElementById('visa-modal');
  if (!modal) return;

  modal.classList.remove('hidden');

  const city = currentFlight.arrival.city;

  // 签证信息数据
  const visaInfo = {
    '东京': { needVisa: false, note: '持中国大陆护照免签入境15天' },
    '大阪': { needVisa: false, note: '持中国大陆护照免签入境15天' },
    '曼谷': { needVisa: true, note: '需办理落地签或提前申请旅游签证' },
    '新加坡': { needVisa: true, note: '需提前申请签证，96小时转机免签' },
    '首尔': { needVisa: false, note: '持中国大陆护照免签入境30天' },
    '巴黎': { needVisa: true, note: '需办理申根签证（90天）' },
    '伦敦': { needVisa: true, note: '需办理英国标准访客签证' },
    '纽约': { needVisa: true, note: '需办理B1/B2旅游签证' },
    '洛杉矶': { needVisa: true, note: '需办理B1/B2旅游签证' },
    '悉尼': { needVisa: true, note: '需提前申请访客签证（600类）' }
  };

  const info = visaInfo[city] || { needVisa: true, note: '请提前查询最新签证政策' };

  const content = document.getElementById('visa-info-content');
  content.innerHTML = `
    <div class="bg-gray-50 rounded-lg p-4">
      <div class="flex items-center mb-2">
        <i class="fas ${info.needVisa ? 'fa-exclamation-circle text-red-500' : 'fa-check-circle text-green-500'} mr-2"></i>
        <span class="font-medium text-gray-800">${info.needVisa ? '需要签证' : '可能免签'}</span>
      </div>
      <p class="text-sm text-gray-600">${info.note}</p>
    </div>
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div class="flex items-center mb-2">
        <i class="fas fa-info-circle text-yellow-600 mr-2"></i>
        <span class="font-medium text-gray-800">温馨提示</span>
      </div>
      <p class="text-sm text-gray-600">请以当地使领馆最新政策为准，建议提前3个月准备签证材料</p>
    </div>
  `;
}

// 关闭弹窗
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
  }
}

// 点击弹窗背景关闭
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('fixed') && e.target.classList.contains('bg-black')) {
    e.target.classList.add('hidden');
  }
});