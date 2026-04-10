// A/B测试框架 - 推荐算法效果对比

const ABTest = {
  // 测试配置
  CONFIG_KEY: 'abtest_config',
  USER_GROUP_KEY: 'abtest_user_group',
  EXPERIMENTS_KEY: 'abtest_experiments',

  // 默认实验配置
  DEFAULT_EXPERIMENTS: {
    'home_recommendation': {
      name: '首页推荐算法测试',
      description: '比较规则推荐、协同过滤、混合推荐的效果',
      groups: {
        'rule': { label: '规则推荐', weight: 33 },
        'cf': { label: '协同过滤', weight: 33 },
        'hybrid': { label: '混合推荐', weight: 34 }
      },
      metric: 'positive_rate' // 主要衡量指标：正反馈率
    },
    'similar_flights': {
      name: '相似航班推荐测试',
      description: '比较不同相似度计算权重',
      groups: {
        'price_weight': { label: '价格权重优先', weight: 50 },
        'airline_weight': { label: '航司权重优先', weight: 50 }
      },
      metric: 'positive_rate'
    }
  },

  // 初始化测试
  init() {
    this.ensureUserGroup();
    this.trackPageView();
  },

  // 确保用户有分组
  ensureUserGroup() {
    let userGroup = this.getUserGroup();

    if (!userGroup) {
      // 随机分配用户到实验组
      userGroup = {};
      const experiments = this.getExperiments();

      for (const [expId, exp] of Object.entries(experiments)) {
        const groupId = this.randomSelectGroup(exp.groups);
        userGroup[expId] = groupId;
      }

      this.saveUserGroup(userGroup);
    }

    return userGroup;
  },

  // 获取用户分组
  getUserGroup() {
    try {
      return JSON.parse(localStorage.getItem(this.USER_GROUP_KEY));
    } catch {
      return null;
    }
  },

  // 保存用户分组
  saveUserGroup(userGroup) {
    localStorage.setItem(this.USER_GROUP_KEY, JSON.stringify(userGroup));
  },

  // 获取实验配置
  getExperiments() {
    try {
      const stored = localStorage.getItem(this.EXPERIMENTS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    // 使用默认配置
    this.saveExperiments(this.DEFAULT_EXPERIMENTS);
    return this.DEFAULT_EXPERIMENTS;
  },

  // 保存实验配置
  saveExperiments(experiments) {
    localStorage.setItem(this.EXPERIMENTS_KEY, JSON.stringify(experiments));
  },

  // 随机选择实验组（加权随机）
  randomSelectGroup(groups) {
    const groupIds = Object.keys(groups);
    const weights = groupIds.map(id => groups[id].weight);
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    let random = Math.random() * totalWeight;
    for (let i = 0; i < groupIds.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return groupIds[i];
      }
    }
    return groupIds[groupIds.length - 1];
  },

  // 获取用户在某个实验中的分组
  getUserExpGroup(experimentId) {
    const userGroup = this.getUserGroup();
    return userGroup ? userGroup[experimentId] : null;
  },

  // 记录页面浏览
  trackPageView() {
    const event = {
      type: 'page_view',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      groups: this.getUserGroup()
    };
    this.logEvent(event);
  },

  // 记录推荐展示
  trackRecommendationShow(experimentId, flightId, algorithmVersion) {
    const event = {
      type: 'recommendation_show',
      experimentId,
      flightId,
      algorithmVersion,
      userGroup: this.getUserExpGroup(experimentId),
      timestamp: new Date().toISOString()
    };
    this.logEvent(event);
    this.incrementMetric(experimentId, 'shows');
  },

  // 记录推荐点击
  trackRecommendationClick(experimentId, flightId, algorithmVersion) {
    const event = {
      type: 'recommendation_click',
      experimentId,
      flightId,
      algorithmVersion,
      userGroup: this.getUserExpGroup(experimentId),
      timestamp: new Date().toISOString()
    };
    this.logEvent(event);
    this.incrementMetric(experimentId, 'clicks');
  },

  // 记录反馈
  trackFeedback(experimentId, flightId, algorithmVersion, isUseful) {
    const event = {
      type: 'recommendation_feedback',
      experimentId,
      flightId,
      algorithmVersion,
      userGroup: this.getUserExpGroup(experimentId),
      isUseful,
      timestamp: new Date().toISOString()
    };
    this.logEvent(event);
    this.incrementMetric(experimentId, isUseful ? 'positive' : 'negative');
  },

  // 增加指标计数
  incrementMetric(experimentId, metric) {
    const key = `abtest_metrics_${experimentId}`;
    let metrics = this.getMetrics(experimentId);

    if (!metrics.groups) {
      const userGroup = this.getUserExpGroup(experimentId);
      metrics.groups = {};
      const experiments = this.getExperiments();
      if (experiments[experimentId]) {
        for (const groupId of Object.keys(experiments[experimentId].groups)) {
          metrics.groups[groupId] = { shows: 0, clicks: 0, positive: 0, negative: 0 };
        }
      }
    }

    const userGroup = this.getUserExpGroup(experimentId);
    if (userGroup && metrics.groups[userGroup]) {
      metrics.groups[userGroup][metric]++;
      this.saveMetrics(experimentId, metrics);
    }
  },

  // 获取指标
  getMetrics(experimentId) {
    const key = `abtest_metrics_${experimentId}`;
    try {
      return JSON.parse(localStorage.getItem(key)) || {};
    } catch {
      return {};
    }
  },

  // 保存指标
  saveMetrics(experimentId, metrics) {
    const key = `abtest_metrics_${experimentId}`;
    localStorage.setItem(key, JSON.stringify(metrics));
  },

  // 记录事件日志
  logEvent(event) {
    const key = 'abtest_events';
    let events = [];
    try {
      events = JSON.parse(localStorage.getItem(key)) || [];
    } catch {}

    events.push(event);

    // 只保留最近1000条事件
    if (events.length > 1000) {
      events = events.slice(-1000);
    }

    localStorage.setItem(key, JSON.stringify(events));
  },

  // 获取实验结果统计
  getExperimentResults(experimentId) {
    const experiments = this.getExperiments();
    const exp = experiments[experimentId];
    if (!exp) return null;

    const metrics = this.getMetrics(experimentId);
    const results = {
      experimentId,
      name: exp.name,
      description: exp.description,
      metric: exp.metric,
      groups: {}
    };

    for (const [groupId, group] of Object.entries(exp.groups)) {
      const groupMetrics = metrics.groups ? metrics.groups[groupId] : null;
      const shows = groupMetrics ? groupMetrics.shows : 0;
      const clicks = groupMetrics ? groupMetrics.clicks : 0;
      const positive = groupMetrics ? groupMetrics.positive : 0;
      const negative = groupMetrics ? groupMetrics.negative : 0;
      const totalFeedback = positive + negative;

      results.groups[groupId] = {
        label: group.label,
        weight: group.weight,
        shows,
        clicks,
        clickRate: shows > 0 ? (clicks / shows * 100).toFixed(2) : 0,
        positive,
        negative,
        positiveRate: totalFeedback > 0 ? (positive / totalFeedback * 100).toFixed(2) : 0,
        totalFeedback
      };
    }

    return results;
  },

  // 获取所有实验结果
  getAllResults() {
    const experiments = this.getExperiments();
    const results = {};

    for (const expId of Object.keys(experiments)) {
      results[expId] = this.getExperimentResults(expId);
    }

    return results;
  },

  // 获取最佳算法组（基于正反馈率）
  getBestGroup(experimentId) {
    const results = this.getExperimentResults(experimentId);
    if (!results) return null;

    let bestGroup = null;
    let bestRate = -1;

    for (const [groupId, data] of Object.entries(results.groups)) {
      if (data.totalFeedback >= 5 && parseFloat(data.positiveRate) > bestRate) {
        bestRate = parseFloat(data.positiveRate);
        bestGroup = groupId;
      }
    }

    return bestGroup;
  },

  // 重置实验数据
  resetExperiment(experimentId) {
    const key = `abtest_metrics_${experimentId}`;
    localStorage.removeItem(key);
  },

  // 重置所有实验
  resetAll() {
    localStorage.removeItem(this.USER_GROUP_KEY);
    localStorage.removeItem(this.EXPERIMENTS_KEY);
    localStorage.removeItem('abtest_events');

    // 清除所有指标
    const experiments = this.getExperiments();
    for (const expId of Object.keys(experiments)) {
      this.resetExperiment(expId);
    }
  },

  // 获取分组标签（用于UI显示）
  getGroupLabel(experimentId) {
    const userGroup = this.getUserExpGroup(experimentId);
    if (!userGroup) return null;

    const experiments = this.getExperiments();
    const exp = experiments[experimentId];
    if (!exp || !exp.groups[userGroup]) return null;

    return exp.groups[userGroup].label;
  }
};

// 初始化A/B测试
ABTest.init();

// 导出到全局
window.ABTest = ABTest;
