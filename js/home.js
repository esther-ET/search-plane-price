// 首页JavaScript逻辑

document.addEventListener('DOMContentLoaded', function() {
  loadFeaturedFlights();
  setupSearchForm();
});

// 加载特价推荐航班 - AI智能推荐版本
function loadFeaturedFlights() {
  const container = document.getElementById('featured-flights');
  if (!container) return;

  // 显示骨架屏
  if (window.showSkeleton) {
    container.innerHTML = window.createRecommendationCardSkeleton() +
                          window.createRecommendationCardSkeleton() +
                          window.createRecommendationCardSkeleton();
  }

  // 延迟执行以确保DOM已更新
  setTimeout(() => {
    try {
      // 获取用户偏好
      const userPreferences = window.getUserPreferences ? window.getUserPreferences() : null;

      // 获取所有航班数据
      const allFlights = window.flightData ? [...window.flightData.flights, ...window.flightData.recommendations] : [];

      // 去重，避免重复航班
      const uniqueFlights = [];
      const seenIds = new Set();
      for (const flight of allFlights) {
        if (flight.id && !seenIds.has(flight.id)) {
          uniqueFlights.push(flight);
          seenIds.add(flight.id);
        }
      }

      // 使用AI推荐算法获取个性化推荐
      let recommendedFlights = [];

      if (window.RecommendationEngine && userPreferences) {
        // 尝试获取用户最近查看的航班（模拟数据）
        const recentFlight = getRecentFlight();

        if (recentFlight) {
          // 使用混合推荐算法（结合基于规则和协同过滤）
          recommendedFlights = window.RecommendationEngine.getHybridRecommendations(
            uniqueFlights,
            userPreferences,
            recentFlight,
            6
          );
        } else {
          // 使用基于规则的个性化推荐
          recommendedFlights = window.RecommendationEngine.getPersonalizedRecommendations(
            uniqueFlights,
            userPreferences,
            6
          );
        }

        // 为每个推荐航班添加推荐理由
        recommendedFlights = recommendedFlights.map(flight => ({
          ...flight,
          recommendationReason: window.RecommendationEngine.generateRecommendationReason(flight, userPreferences),
          recommendationCategory: window.RecommendationEngine.getRecommendationCategory(flight, userPreferences)
        }));
      } else {
        // 如果没有推荐引擎或用户偏好，使用热门推荐
        if (window.RecommendationEngine) {
          recommendedFlights = window.RecommendationEngine.getPopularRecommendations(uniqueFlights, 6);
        } else {
          // 回退到静态推荐
          recommendedFlights = window.flightData ? window.flightData.recommendations.slice(0, 6) : [];
        }
      }

      // 清空容器
      container.innerHTML = '';

      // 显示推荐结果
      if (recommendedFlights.length > 0) {
        recommendedFlights.forEach(flight => {
          const card = createFlightCard(flight, true);
          container.appendChild(card);

          // A/B测试追踪：记录推荐展示
          if (window.ABTest && flight.algorithmVersion) {
            window.ABTest.trackRecommendationShow('home_recommendation', flight.id, flight.algorithmVersion);
          }
        });

        // 添加AI推荐标识
        if (userPreferences) {
          const sectionTitle = document.querySelector('#featured-flights').closest('section').querySelector('h3');
          if (sectionTitle) {
            sectionTitle.innerHTML = `今日特价推荐 <span class="text-sm font-normal bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2">AI智能推荐</span>`;
          }
        }
      } else {
        // 没有推荐结果时显示提示
        container.innerHTML = `
          <div class="col-span-3 text-center py-12">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-plane text-gray-400 text-2xl"></i>
            </div>
            <h4 class="text-xl font-medium text-gray-800 mb-2">暂无特价推荐</h4>
            <p class="text-gray-600 max-w-md mx-auto">暂时没有找到匹配您偏好的特价航班，请尝试调整搜索条件或偏好设置。</p>
            <a href="preferences.html" class="inline-block mt-4 text-blue-600 hover:text-blue-800 font-medium">
              去设置偏好 →
            </a>
          </div>
        `;
      }
    } catch (error) {
      console.error('AI推荐加载失败:', error);
      // 出错时回退到静态推荐
      container.innerHTML = '';
      if (window.flightData && window.flightData.recommendations) {
        window.flightData.recommendations.slice(0, 3).forEach(flight => {
          const card = createFlightCard(flight, true);
          container.appendChild(card);
        });
      }
    }
  }, 300); // 300ms延迟让加载动画可见
}

// 获取用户最近查看的航班（模拟实现）
function getRecentFlight() {
  try {
    // 从localStorage获取最近查看的航班ID
    const recentFlightId = localStorage.getItem('recentFlightId');
    if (recentFlightId) {
      // 在所有航班中查找
      const allFlights = window.flightData ? [...window.flightData.flights, ...window.flightData.recommendations] : [];
      return allFlights.find(flight => flight.id === parseInt(recentFlightId));
    }
  } catch (error) {
    console.error('获取最近查看航班失败:', error);
  }
  return null;
}

// 创建航班卡片
function createFlightCard(flight, isFeatured = false) {
  const card = document.createElement('div');
  card.className = 'bg-white rounded-xl shadow-lg overflow-hidden card-hover cursor-pointer';
  card.setAttribute('data-flight-id', flight.id);

  // 点击卡片跳转到详情页
  card.addEventListener('click', function() {
    // 保存为最近查看的航班，用于协同过滤推荐
    try {
      localStorage.setItem('recentFlightId', flight.id);
      localStorage.setItem('recentFlightTime', new Date().toISOString());
    } catch (error) {
      console.error('保存最近查看航班失败:', error);
    }
    window.location.href = `detail.html?id=${flight.id}`;
  });

  // 卡片头部（特价标签）
  let tagsHtml = '';
  if (flight.tags && flight.tags.length > 0) {
    tagsHtml = flight.tags.map(tag =>
      `<span class="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-1 mb-1">${tag}</span>`
    ).join('');
  }

  // 折扣徽章
  const discountBadge = flight.discount >= 30 ?
    `<div class="absolute top-4 right-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">-${flight.discount}%</div>` : '';

  // 紧迫感提示（座位剩余和价格过期）
  let urgencyHtml = '';
  if (flight.seatsLeft && flight.seatsLeft < 10) {
    urgencyHtml += `
      <div class="mt-2 flex items-center text-xs text-red-600">
        <i class="fas fa-fire mr-1"></i>
        <span>仅剩 <strong>${flight.seatsLeft}</strong> 个座位</span>
      </div>
    `;
  }
  if (flight.validUntil) {
    const validDate = new Date(flight.validUntil);
    const now = new Date();
    const hoursLeft = Math.max(0, Math.round((validDate - now) / 3600000));
    if (hoursLeft < 48) {
      urgencyHtml += `
        <div class="mt-1 flex items-center text-xs text-orange-600">
          <i class="fas fa-clock mr-1"></i>
          <span>${hoursLeft <= 0 ? '即将过期' : `${hoursLeft}小时后过期`}</span>
        </div>
      `;
    }
  }

  // 价格显示
  const priceHtml = flight.originalPrice ?
    `<div class="mt-4">
      <div class="text-3xl font-bold text-gray-800">¥${flight.price.toLocaleString('zh-CN')}</div>
      <div class="text-gray-500 line-through text-sm">原价 ¥${flight.originalPrice.toLocaleString('zh-CN')}</div>
      ${urgencyHtml}
    </div>` :
    `<div class="text-3xl font-bold text-gray-800 mt-4">¥${flight.price.toLocaleString('zh-CN')}</div>`;

  card.innerHTML = `
    <div class="relative">
      ${discountBadge}
      <div class="bg-gradient-to-r from-blue-500 to-blue-600 h-32 flex items-center justify-center">
        <div class="text-center text-white">
          <div class="text-2xl font-bold">${flight.departure.city} → ${flight.arrival.city}</div>
          <div class="text-sm opacity-90 mt-1">${flight.airline} ${flight.flightNumber}</div>
        </div>
      </div>
    </div>
    <div class="p-6">
      <div class="flex justify-between items-start">
        <div>
          <div class="flex items-center mb-2">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
              <span class="text-blue-600 font-bold">${flight.airlineLogo}</span>
            </div>
            <div>
              <h3 class="font-bold text-gray-800">${flight.airline}</h3>
              <p class="text-gray-600 text-sm">${flight.flightNumber} · ${flight.cabin}</p>
            </div>
          </div>
          <div class="mb-3">
            ${tagsHtml}
          </div>
        </div>
      </div>

      <div class="border-t border-gray-200 pt-4">
        <div class="flex justify-between items-center mb-2">
          <div>
            <div class="text-lg font-semibold text-gray-800">${flight.departure.time}</div>
            <div class="text-gray-600 text-sm">${flight.departure.airport}</div>
          </div>
          <div class="text-center flex-1 px-4">
            <div class="text-gray-500 text-sm mb-1">${flight.duration}</div>
            <div class="relative">
              <div class="h-0.5 bg-gray-300"></div>
              <div class="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-gray-400 rounded-full"></div>
              <div class="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-gray-400 rounded-full"></div>
              <div class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <i class="fas fa-plane text-gray-400"></i>
              </div>
            </div>
            <div class="text-gray-500 text-sm mt-1">${flight.stops === 0 ? '直飞' : flight.stops + '次中转'}</div>
          </div>
          <div class="text-right">
            <div class="text-lg font-semibold text-gray-800">${flight.arrival.time}</div>
            <div class="text-gray-600 text-sm">${flight.arrival.airport}</div>
          </div>
        </div>
        <div class="text-gray-500 text-sm text-center">${formatDate(flight.date)}</div>
      </div>

      <!-- AI推荐信息 -->
      ${flight.recommendationReason || flight.recommendationScore || flight.recommendationCategory ? `
      <div class="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        ${flight.recommendationCategory ? `
          <div class="flex justify-between items-center mb-2">
            <span class="text-xs font-semibold ${getCategoryColorClass(flight.recommendationCategory)} px-2 py-1 rounded-full">
              <i class="fas fa-${getCategoryIcon(flight.recommendationCategory)} mr-1"></i>${flight.recommendationCategory}
            </span>
            ${flight.recommendationScore ? `
              <div class="flex items-center">
                <div class="flex mr-2">
                  ${getRecommendationStars(flight.recommendationScore)}
                </div>
                <span class="text-sm font-bold text-blue-800">${flight.recommendationScore.toFixed(1)}</span>
              </div>
            ` : ''}
          </div>
        ` : ''}
        ${flight.recommendationReason ? `
          <div class="flex items-start mt-1">
            <i class="fas fa-lightbulb text-blue-500 mt-0.5 mr-2"></i>
            <p class="text-sm text-blue-800 flex-1">${flight.recommendationReason}</p>
          </div>
        ` : ''}
        ${flight.algorithmName ? `
          <div class="flex items-center mt-2 pt-2 border-t border-blue-200">
            <i class="fas fa-robot text-purple-500 text-xs mr-1"></i>
            <span class="text-xs text-purple-600">${flight.algorithmName}</span>
          </div>
        ` : ''}
        ${flight.similarityScore ? `
          <div class="mt-2 text-xs text-gray-600">
            <i class="fas fa-project-diagram mr-1"></i>相似度: ${(flight.similarityScore * 100).toFixed(0)}%
          </div>
        ` : ''}
        ${typeof createFeedbackButtons === 'function' ? createFeedbackButtons(flight.id, 'home', flight.recommendationScore) : ''}
      </div>
      ` : ''}

      ${priceHtml}

      <button class="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200">
        查看详情
      </button>
    </div>
  `;

  return card;
}

// 设置搜索表单
function setupSearchForm() {
  const searchButton = document.querySelector('button[onclick*="search.html"]');
  if (searchButton) {
    searchButton.addEventListener('click', function(e) {
      e.preventDefault();
      // 在实际应用中，这里会收集搜索表单数据
      window.location.href = 'search.html';
    });
  }
}

// 格式化日期
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
}

// 获取推荐类别的颜色类
function getCategoryColorClass(category) {
  const colorMap = {
    '超高折扣': 'bg-red-100 text-red-800 border border-red-200',
    '限时特价': 'bg-orange-100 text-orange-800 border border-orange-200',
    '超值低价': 'bg-green-100 text-green-800 border border-green-200',
    '偏好匹配': 'bg-blue-100 text-blue-800 border border-blue-200',
    '便捷直飞': 'bg-purple-100 text-purple-800 border border-purple-200',
    '智能推荐': 'bg-indigo-100 text-indigo-800 border border-indigo-200'
  };
  return colorMap[category] || 'bg-blue-100 text-blue-800 border border-blue-200';
}

// 获取推荐类别的图标
function getCategoryIcon(category) {
  const iconMap = {
    '超高折扣': 'fire',
    '限时特价': 'clock',
    '超值低价': 'money-bill-wave',
    '偏好匹配': 'heart',
    '便捷直飞': 'route',
    '智能推荐': 'brain'
  };
  return iconMap[category] || 'star';
}

// 根据推荐分数生成星级显示
function getRecommendationStars(score) {
  // 将0-100的分数转换为0-5星
  const starCount = Math.round((score / 100) * 5);
  let starsHtml = '';

  for (let i = 1; i <= 5; i++) {
    if (i <= starCount) {
      starsHtml += '<i class="fas fa-star text-yellow-500 text-xs"></i>';
    } else {
      starsHtml += '<i class="far fa-star text-gray-300 text-xs"></i>';
    }
  }

  return starsHtml;
}