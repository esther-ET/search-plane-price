// 用户反馈系统 - 推荐有用/无用反馈收集

const RecommendationFeedback = {
  // 存储键名
  STORAGE_KEY: 'recommendationFeedback',

  // 收集反馈
  submitFeedback(flightId, flightType, isUseful, recommendationScore = null) {
    const feedback = this.getFeedback();

    // 检查是否已经反馈过
    const existingIndex = feedback.findIndex(f => f.flightId === flightId && f.flightType === flightType);

    const newFeedback = {
      flightId,
      flightType, // 'home' | 'search' | 'detail-similar'
      isUseful,
      recommendationScore,
      timestamp: new Date().toISOString(),
      // 用于A/B测试追踪
      sessionId: this.getSessionId(),
      algorithmVersion: 'v1'
    };

    if (existingIndex >= 0) {
      // 更新已有反馈
      feedback[existingIndex] = newFeedback;
    } else {
      // 添加新反馈
      feedback.push(newFeedback);
    }

    this.saveFeedback(feedback);
    this.updateRecommendationWeights(flightId, flightType, isUseful);

    return true;
  },

  // 获取所有反馈
  getFeedback() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  },

  // 保存反馈
  saveFeedback(feedback) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(feedback));
    } catch (error) {
      console.error('保存反馈失败:', error);
    }
  },

  // 获取会话ID（用于A/B测试）
  getSessionId() {
    let sessionId = sessionStorage.getItem('feedbackSessionId');
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('feedbackSessionId', sessionId);
    }
    return sessionId;
  },

  // 更新推荐权重（根据用户反馈调整）
  updateRecommendationWeights(flightId, flightType, isUseful) {
    const weights = this.getWeights();

    // 增加该航班的权重或降低
    if (!weights[flightId]) {
      weights[flightId] = {
        count: 0,
        positive: 0,
        negative: 0,
        lastUpdate: null
      };
    }

    weights[flightId].count++;
    if (isUseful) {
      weights[flightId].positive++;
    } else {
      weights[flightId].negative++;
    }
    weights[flightId].lastUpdate = new Date().toISOString();

    this.saveWeights(weights);
  },

  // 获取权重数据
  getWeights() {
    try {
      return JSON.parse(localStorage.getItem('recommendationWeights')) || {};
    } catch {
      return {};
    }
  },

  // 保存权重数据
  saveWeights(weights) {
    try {
      localStorage.setItem('recommendationWeights', JSON.stringify(weights));
    } catch (error) {
      console.error('保存权重失败:', error);
    }
  },

  // 获取航班的质量分数（基于用户反馈）
  getFlightQualityScore(flightId) {
    const weights = this.getWeights();
    const data = weights[flightId];

    if (!data || data.count === 0) {
      return null; // 没有反馈数据
    }

    // 计算质量分数：正反馈比例 * 100
    return (data.positive / data.count) * 100;
  },

  // 检查用户是否已对某航班反馈
  hasFeedback(flightId, flightType = null) {
    const feedback = this.getFeedback();
    if (flightType) {
      return feedback.findIndex(f => f.flightId === flightId && f.flightType === flightType);
    }
    return feedback.findIndex(f => f.flightId === flightId);
  },

  // 获取统计信息
  getStats() {
    const feedback = this.getFeedback();
    const total = feedback.length;
    const positive = feedback.filter(f => f.isUseful).length;
    const negative = total - positive;

    // 按类型统计
    const byType = {
      home: { total: 0, positive: 0 },
      search: { total: 0, positive: 0 },
      'detail-similar': { total: 0, positive: 0 }
    };

    feedback.forEach(f => {
      if (byType[f.flightType]) {
        byType[f.flightType].total++;
        if (f.isUseful) byType[f.flightType].positive++;
      }
    });

    return {
      total,
      positive,
      negative,
      positiveRate: total > 0 ? (positive / total * 100).toFixed(1) : 0,
      byType
    };
  },

  // 清除所有反馈（测试用）
  clearAllFeedback() {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem('recommendationWeights');
  }
};

// 创建反馈按钮HTML
function createFeedbackButtons(flightId, flightType, recommendationScore = null) {
  const existingFeedback = RecommendationFeedback.hasFeedback(flightId, flightType);

  if (existingFeedback >= 0) {
    // 已反馈，显示感谢信息
    const feedback = RecommendationFeedback.getFeedback()[existingFeedback];
    return `
      <div class="feedback-buttons flex items-center space-x-2 mt-3" data-flight-id="${flightId}" data-flight-type="${flightType}">
        <span class="text-sm ${feedback.isUseful ? 'text-green-600' : 'text-red-600'}">
          <i class="fas ${feedback.isUseful ? 'fa-thumbs-up' : 'fa-thumbs-down'} mr-1"></i>
          ${feedback.isUseful ? '您觉得有用' : '您觉得无用'}
        </span>
        <button onclick="resetFeedback(${flightId}, '${flightType}')" class="text-xs text-gray-500 hover:text-gray-700 underline">
          重新评价
        </button>
      </div>
    `;
  }

  return `
    <div class="feedback-buttons flex items-center space-x-2 mt-3" data-flight-id="${flightId}" data-flight-type="${flightType}">
      <span class="text-xs text-gray-500">推荐有用吗？</span>
      <button onclick="submitFeedback(true, ${flightId}, '${flightType}', ${recommendationScore})"
        class="feedback-btn-useful flex items-center px-2 py-1 rounded-full bg-gray-100 hover:bg-green-100 text-gray-700 hover:text-green-700 transition-colors text-xs">
        <i class="far fa-thumbs-up mr-1"></i>有用
      </button>
      <button onclick="submitFeedback(false, ${flightId}, '${flightType}', ${recommendationScore})"
        class="feedback-btn-useless flex items-center px-2 py-1 rounded-full bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-700 transition-colors text-xs">
        <i class="far fa-thumbs-down mr-1"></i>无用
      </button>
    </div>
  `;
}

// 提交反馈
function submitFeedback(isUseful, flightId, flightType, recommendationScore) {
  RecommendationFeedback.submitFeedback(flightId, flightType, isUseful, recommendationScore);

  // A/B测试追踪：记录反馈
  if (window.ABTest) {
    // 根据反馈类型确定实验ID
    let experimentId = null;
    let algorithmVersion = null;

    if (flightType === 'home') {
      experimentId = 'home_recommendation';
      // 尝试从页面数据获取算法版本
      const recData = window.currentRecommendationData;
      if (recData && recData[flightId]) {
        algorithmVersion = recData[flightId].algorithmVersion;
      }
    } else if (flightType === 'detail-similar') {
      experimentId = 'similar_flights';
      algorithmVersion = 'cf_v1';
    }

    if (experimentId) {
      window.ABTest.trackFeedback(experimentId, flightId, algorithmVersion || 'unknown', isUseful);
    }
  }

  // 更新UI
  const buttonsContainer = document.querySelector(`.feedback-buttons[data-flight-id="${flightId}"][data-flight-type="${flightType}"]`);
  if (buttonsContainer) {
    buttonsContainer.innerHTML = `
      <span class="text-sm ${isUseful ? 'text-green-600' : 'text-red-600'}">
        <i class="fas ${isUseful ? 'fa-thumbs-up' : 'fa-thumbs-down'} mr-1"></i>
        ${isUseful ? '谢谢您的肯定！' : '我们会改进推荐'}
      </span>
    `;

    // 添加动画效果
    buttonsContainer.classList.add('animate-pulse');
    setTimeout(() => {
      buttonsContainer.classList.remove('animate-pulse');
    }, 1000);
  }

  // 显示通知
  showFeedbackNotification(isUseful);
}

// 重置反馈
function resetFeedback(flightId, flightType) {
  const buttonsContainer = document.querySelector(`.feedback-buttons[data-flight-id="${flightId}"][data-flight-type="${flightType}"]`);
  if (buttonsContainer) {
    buttonsContainer.innerHTML = `
      <span class="text-xs text-gray-500">推荐有用吗？</span>
      <button onclick="submitFeedback(true, ${flightId}, '${flightType}')"
        class="feedback-btn-useful flex items-center px-2 py-1 rounded-full bg-gray-100 hover:bg-green-100 text-gray-700 hover:text-green-700 transition-colors text-xs">
        <i class="far fa-thumbs-up mr-1"></i>有用
      </button>
      <button onclick="submitFeedback(false, ${flightId}, '${flightType}')"
        class="feedback-btn-useless flex items-center px-2 py-1 rounded-full bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-700 transition-colors text-xs">
        <i class="far fa-thumbs-down mr-1"></i>无用
      </button>
    `;
  }
}

// 显示反馈通知
function showFeedbackNotification(isUseful) {
  const notification = document.createElement('div');
  notification.className = 'fixed bottom-4 right-4 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
  notification.innerHTML = `
    <div class="flex items-center">
      <i class="fas ${isUseful ? 'fa-check-circle text-green-400' : 'fa-info-circle text-blue-400'} mr-2"></i>
      <span>${isUseful ? '感谢您的反馈！' : '感谢您的意见，我们会继续优化'}</span>
    </div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
    setTimeout(() => notification.remove(), 300);
  }, 2500);
}

// 导出到全局
window.RecommendationFeedback = RecommendationFeedback;
window.createFeedbackButtons = createFeedbackButtons;
window.submitFeedback = submitFeedback;
window.resetFeedback = resetFeedback;
