// AI智能推荐系统
// 基于用户偏好和航班特征的个性化推荐算法

/**
 * 推荐系统配置
 */
const RecommendationConfig = {
  // 权重配置
  weights: {
    priceScore: 0.25,      // 价格得分权重
    discountScore: 0.30,   // 折扣得分权重
    preferenceScore: 0.25, // 偏好匹配得分权重
    timeScore: 0.10,       // 时间得分权重（出发时间）
    popularityScore: 0.10  // 热门度得分权重
  },

  // 价格得分计算参数
  priceScoring: {
    // 根据价格敏感度调整价格接受范围
    sensitivityMultiplier: {
      1: 0.6,  // 价格优先 - 只接受低价
      2: 0.75,
      3: 1.0,  // 中等
      4: 1.25,
      5: 1.5   // 品质优先 - 接受更高价
    }
  },

  // 时间偏好（模拟数据）
  timePreferences: {
    morning: ['08:00', '12:00'],
    afternoon: ['12:00', '18:00'],
    evening: ['18:00', '24:00']
  }
};

/**
 * 主推荐函数
 * @param {Array} flights - 航班列表
 * @param {Object} userPreferences - 用户偏好设置
 * @param {number} limit - 返回的推荐数量
 * @returns {Array} 推荐航班列表（带推荐分数）
 */
function getPersonalizedRecommendations(flights, userPreferences, limit = 6) {
  if (!flights || flights.length === 0) return [];

  // 如果没有用户偏好，返回热门推荐
  if (!userPreferences) {
    return getPopularRecommendations(flights, limit);
  }

  // 为每个航班计算推荐分数
  const scoredFlights = flights.map(flight => {
    const scores = calculateFlightScores(flight, userPreferences);
    const totalScore = calculateTotalScore(scores);

    return {
      ...flight,
      recommendationScores: scores,
      recommendationScore: totalScore,
      algorithmVersion: 'rule_v1',
      algorithmName: '规则推荐'
    };
  });

  // 按推荐分数排序
  scoredFlights.sort((a, b) => b.recommendationScore - a.recommendationScore);

  // 返回前limit个推荐
  return scoredFlights.slice(0, limit);
}

/**
 * 计算航班的各项分数
 */
function calculateFlightScores(flight, userPreferences) {
  return {
    priceScore: calculatePriceScore(flight, userPreferences),
    discountScore: calculateDiscountScore(flight),
    preferenceScore: calculatePreferenceScore(flight, userPreferences),
    timeScore: calculateTimeScore(flight, userPreferences),
    popularityScore: calculatePopularityScore(flight)
  };
}

/**
 * 计算价格分数（0-100）
 * 价格越低，分数越高（根据用户价格敏感度调整）
 */
function calculatePriceScore(flight, userPreferences) {
  if (!flight.price) return 50;

  // 获取用户价格敏感度（1-5）
  const sensitivity = userPreferences.priceSensitivity || 3;

  // 计算价格接受阈值（基于平均价格和敏感度）
  const avgPrice = 1500; // 模拟平均价格
  const threshold = avgPrice * RecommendationConfig.priceScoring.sensitivityMultiplier[sensitivity] || 1.0;

  // 价格低于阈值时得分高
  if (flight.price <= threshold) {
    // 线性映射：价格越低，分数越高
    const normalizedPrice = Math.max(0, 1 - (flight.price / threshold));
    return Math.round(normalizedPrice * 80 + 20); // 20-100分
  } else {
    // 价格超过阈值，分数较低
    const excessRatio = (flight.price - threshold) / threshold;
    const penalty = Math.min(0.7, excessRatio * 0.5); // 最大扣70%
    return Math.round(50 * (1 - penalty));
  }
}

/**
 * 计算折扣分数（0-100）
 * 折扣越大，分数越高
 */
function calculateDiscountScore(flight) {
  if (!flight.discount) return 30;

  // 折扣越大分数越高
  if (flight.discount >= 50) return 100;
  if (flight.discount >= 40) return 90;
  if (flight.discount >= 30) return 80;
  if (flight.discount >= 20) return 60;
  if (flight.discount >= 10) return 40;
  return 30;
}

/**
 * 计算偏好匹配分数（0-100）
 * 考虑航空公司偏好、舱位偏好等
 */
function calculatePreferenceScore(flight, userPreferences) {
  let score = 50; // 基础分

  // 航空公司偏好匹配
  if (userPreferences.airlinePreferences && userPreferences.airlinePreferences.length > 0) {
    if (userPreferences.airlinePreferences.includes(flight.airline)) {
      score += 30;
    } else {
      score -= 10;
    }
  }

  // 舱位偏好匹配
  if (userPreferences.cabinPreferences && userPreferences.cabinPreferences.length > 0) {
    if (userPreferences.cabinPreferences.includes(flight.cabin)) {
      score += 15;
    } else {
      score -= 5;
    }
  }

  // 出发城市匹配（如果设置了常用出发地）
  if (userPreferences.departureCities && userPreferences.departureCities.length > 0) {
    if (userPreferences.departureCities.includes(flight.departure.city)) {
      score += 10;
    }
  }

  // 确保分数在0-100之间
  return Math.max(0, Math.min(100, score));
}

/**
 * 计算时间分数（0-100）
 * 根据出发时间评分（模拟：上午和下午航班得分高）
 */
function calculateTimeScore(flight, userPreferences) {
  if (!flight.departure || !flight.departure.time) return 60;

  const time = flight.departure.time;
  const hour = parseInt(time.split(':')[0]);

  // 模拟时间偏好：上午和下午航班更受欢迎
  if (hour >= 8 && hour < 12) return 90;    // 上午
  if (hour >= 12 && hour < 18) return 85;   // 下午
  if (hour >= 18 && hour < 22) return 70;   // 晚上
  if (hour >= 22 || hour < 6) return 40;    // 深夜/凌晨
  if (hour >= 6 && hour < 8) return 75;     // 清晨

  return 60;
}

/**
 * 计算热门度分数（0-100）
 * 模拟航班的受欢迎程度
 */
function calculatePopularityScore(flight) {
  // 基于一些规则模拟热门度
  let score = 50;

  // 特价航班更热门
  if (flight.isSpecial) score += 20;

  // 直飞航班更热门
  if (flight.stops === 0) score += 15;

  // 热门目的地
  const popularDestinations = ['东京', '曼谷', '新加坡', '首尔', '香港'];
  if (popularDestinations.includes(flight.arrival.city)) score += 10;

  // 热门航空公司
  const popularAirlines = ['中国东方航空', '中国国际航空', '南方航空', '新加坡航空'];
  if (popularAirlines.includes(flight.airline)) score += 5;

  return Math.min(100, score);
}

/**
 * 计算总推荐分数
 */
function calculateTotalScore(scores) {
  let total = 0;
  const weights = RecommendationConfig.weights;

  total += scores.priceScore * weights.priceScore;
  total += scores.discountScore * weights.discountScore;
  total += scores.preferenceScore * weights.preferenceScore;
  total += scores.timeScore * weights.timeScore;
  total += scores.popularityScore * weights.popularityScore;

  return Math.round(total * 10) / 10; // 保留一位小数
}

/**
 * 获取热门推荐（无用户偏好时使用）
 */
function getPopularRecommendations(flights, limit) {
  // 简单按折扣和价格排序
  return [...flights]
    .sort((a, b) => {
      // 先按折扣排序
      const discountDiff = (b.discount || 0) - (a.discount || 0);
      if (Math.abs(discountDiff) > 10) return discountDiff;

      // 再按价格排序
      return a.price - b.price;
    })
    .slice(0, limit)
    .map(flight => ({
      ...flight,
      recommendationScore: 70 + Math.random() * 20, // 模拟分数
      isPopularRecommendation: true,
      algorithmVersion: 'rule_v1',
      algorithmName: '规则推荐'
    }));
}

/**
 * 生成推荐理由
 */
function generateRecommendationReason(flight, userPreferences) {
  const reasons = [];

  // 基于折扣
  if (flight.discount >= 30) {
    reasons.push(`折扣高达${flight.discount}%`);
  }

  // 基于价格
  if (flight.price < 1000) {
    reasons.push('超值低价');
  } else if (flight.price < 1500) {
    reasons.push('性价比高');
  }

  // 基于偏好匹配
  if (userPreferences) {
    if (userPreferences.airlinePreferences && userPreferences.airlinePreferences.includes(flight.airline)) {
      reasons.push('符合您的航空公司偏好');
    }

    if (userPreferences.cabinPreferences && userPreferences.cabinPreferences.includes(flight.cabin)) {
      reasons.push('符合您的舱位偏好');
    }
  }

  // 基于其他特征
  if (flight.stops === 0) {
    reasons.push('直飞航班');
  }

  if (flight.isSpecial) {
    reasons.push('限时特价');
  }

  // 如果没有特定理由，使用通用理由
  if (reasons.length === 0) {
    reasons.push('热门精选航班');
  }

  return reasons.join(' · ');
}

/**
 * 获取推荐类别
 */
function getRecommendationCategory(flight, userPreferences) {
  if (flight.discount >= 40) return '超高折扣';
  if (flight.discount >= 30) return '限时特价';
  if (flight.price < 1000) return '超值低价';

  if (userPreferences) {
    if (userPreferences.airlinePreferences && userPreferences.airlinePreferences.includes(flight.airline)) {
      return '偏好匹配';
    }
  }

  if (flight.stops === 0) return '便捷直飞';

  return '智能推荐';
}

/**
 * 基于项目的协同过滤算法
 * 计算航班之间的相似度，基于相似航班推荐
 * @param {Array} flights - 所有航班列表
 * @param {Object} targetFlight - 目标航班（用户当前查看或感兴趣的航班）
 * @param {number} limit - 返回的相似航班数量
 * @returns {Array} 相似航班列表
 */
function getCollaborativeFilteringRecommendations(flights, targetFlight, limit = 5) {
  if (!flights || flights.length === 0 || !targetFlight) return [];

  // 排除目标航班本身
  const otherFlights = flights.filter(flight => flight.id !== targetFlight.id);

  // 计算每个航班与目标航班的相似度
  const flightsWithSimilarity = otherFlights.map(flight => {
    const similarity = calculateFlightSimilarity(targetFlight, flight);
    return {
      ...flight,
      similarityScore: similarity,
      recommendationScore: similarity * 100, // 转换为百分比分数
      recommendationReason: `与您感兴趣的${targetFlight.departure.city}→${targetFlight.arrival.city}航班相似`,
      algorithmVersion: 'cf_v1',
      algorithmName: '协同过滤推荐'
    };
  });

  // 按相似度排序
  flightsWithSimilarity.sort((a, b) => b.similarityScore - a.similarityScore);

  // 返回前limit个相似航班
  return flightsWithSimilarity.slice(0, limit);
}

/**
 * 计算两个航班之间的相似度（0-1）
 * 基于多个特征：航空公司、舱位、价格范围、折扣、目的地类型等
 */
function calculateFlightSimilarity(flightA, flightB) {
  let similarity = 0;
  const weights = {
    airline: 0.25,
    cabin: 0.15,
    priceRange: 0.20,
    discountRange: 0.15,
    destinationType: 0.15,
    stops: 0.10
  };

  // 1. 航空公司相似度
  if (flightA.airline === flightB.airline) {
    similarity += weights.airline;
  } else {
    // 同一联盟或类似航空公司给部分分数
    const airlineGroups = {
      '中国东方航空': ['中国东方航空', '上海航空'],
      '中国国际航空': ['中国国际航空', '深圳航空'],
      '南方航空': ['南方航空', '厦门航空'],
      '星空联盟': ['中国国际航空', '新加坡航空', '泰国国际航空'],
      '天合联盟': ['中国东方航空', '大韩航空', '南方航空']
    };

    let found = false;
    for (const [group, airlines] of Object.entries(airlineGroups)) {
      if (airlines.includes(flightA.airline) && airlines.includes(flightB.airline)) {
        similarity += weights.airline * 0.7;
        found = true;
        break;
      }
    }

    if (!found && flightA.airlineLogo && flightB.airlineLogo &&
        flightA.airlineLogo[0] === flightB.airlineLogo[0]) {
      // 相同首字母（简化处理）
      similarity += weights.airline * 0.3;
    }
  }

  // 2. 舱位相似度
  if (flightA.cabin === flightB.cabin) {
    similarity += weights.cabin;
  } else {
    // 舱位等级相似性（经济舱与超级经济舱的相似度高于经济舱与头等舱）
    const cabinHierarchy = ['经济舱', '超级经济舱', '商务舱', '头等舱'];
    const indexA = cabinHierarchy.indexOf(flightA.cabin);
    const indexB = cabinHierarchy.indexOf(flightB.cabin);

    if (indexA !== -1 && indexB !== -1) {
      const levelDiff = Math.abs(indexA - indexB);
      if (levelDiff === 1) similarity += weights.cabin * 0.7;
      else if (levelDiff === 2) similarity += weights.cabin * 0.3;
    }
  }

  // 3. 价格范围相似度
  const priceDiff = Math.abs(flightA.price - flightB.price);
  const maxPriceDiff = 2000; // 假设最大价格差为2000元
  const priceSimilarity = Math.max(0, 1 - priceDiff / maxPriceDiff);
  similarity += weights.priceRange * priceSimilarity;

  // 4. 折扣范围相似度
  const discountDiff = Math.abs((flightA.discount || 0) - (flightB.discount || 0));
  const discountSimilarity = Math.max(0, 1 - discountDiff / 50); // 最大折扣差50%
  similarity += weights.discountRange * discountSimilarity;

  // 5. 目的地类型相似度（按地区分组）
  const destinationGroups = {
    '东亚': ['东京', '首尔', '大阪', '台北'],
    '东南亚': ['曼谷', '新加坡', '吉隆坡', '巴厘岛'],
    '欧洲': ['巴黎', '伦敦', '法兰克福', '罗马'],
    '北美': ['纽约', '洛杉矶', '温哥华', '多伦多']
  };

  const destA = flightA.arrival.city;
  const destB = flightB.arrival.city;

  if (destA === destB) {
    similarity += weights.destinationType;
  } else {
    let foundGroup = false;
    for (const [group, cities] of Object.entries(destinationGroups)) {
      if (cities.includes(destA) && cities.includes(destB)) {
        similarity += weights.destinationType * 0.8;
        foundGroup = true;
        break;
      }
    }

    // 如果没有找到相同组，检查是否都是热门旅游城市
    if (!foundGroup) {
      const popularDestinations = ['东京', '曼谷', '新加坡', '首尔', '香港', '巴黎', '伦敦'];
      if (popularDestinations.includes(destA) && popularDestinations.includes(destB)) {
        similarity += weights.destinationType * 0.5;
      }
    }
  }

  // 6. 中转次数相似度
  if (flightA.stops === flightB.stops) {
    similarity += weights.stops;
  } else if (Math.abs(flightA.stops - flightB.stops) === 1) {
    similarity += weights.stops * 0.5;
  }

  return Math.min(1, similarity); // 确保相似度在0-1之间
}

/**
 * 混合推荐算法
 * 结合基于规则的推荐和协同过滤推荐
 * @param {Array} flights - 所有航班列表
 * @param {Object} userPreferences - 用户偏好
 * @param {Object} recentFlight - 用户最近查看的航班（用于协同过滤）
 * @param {number} limit - 返回的推荐数量
 * @returns {Array} 混合推荐结果
 */
function getHybridRecommendations(flights, userPreferences, recentFlight = null, limit = 6) {
  // 获取基于规则的推荐
  const ruleBasedRecs = getPersonalizedRecommendations(flights, userPreferences, Math.ceil(limit * 0.7));

  // 如果有最近查看的航班，添加协同过滤推荐
  let collaborativeRecs = [];
  if (recentFlight) {
    collaborativeRecs = getCollaborativeFilteringRecommendations(flights, recentFlight, Math.ceil(limit * 0.3));
  }

  // 合并推荐结果，去重，并标记混合算法来源
  const allRecs = [...ruleBasedRecs];
  const usedIds = new Set(ruleBasedRecs.map(r => r.id));

  for (const rec of collaborativeRecs) {
    if (!usedIds.has(rec.id) && allRecs.length < limit) {
      // 标记为混合推荐
      const hybridRec = {
        ...rec,
        algorithmVersion: 'hybrid_v1',
        algorithmName: '混合推荐',
        recommendationReason: rec.recommendationReason + ' · 混合推荐'
      };
      allRecs.push(hybridRec);
      usedIds.add(rec.id);
    }
  }

  // 如果数量不足，补充热门推荐
  if (allRecs.length < limit) {
    const remaining = limit - allRecs.length;
    const popularRecs = getPopularRecommendations(flights, remaining + 5); // 多取几个以防重复

    for (const rec of popularRecs) {
      if (!usedIds.has(rec.id) && allRecs.length < limit) {
        allRecs.push(rec);
        usedIds.add(rec.id);
      }
    }
  }

  return allRecs;
}

// 导出函数供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getPersonalizedRecommendations,
    generateRecommendationReason,
    getRecommendationCategory,
    getPopularRecommendations,
    getCollaborativeFilteringRecommendations,
    calculateFlightSimilarity,
    getHybridRecommendations,
    calculateFlightScores,
    calculateTotalScore
  };
} else {
  window.RecommendationEngine = {
    getPersonalizedRecommendations,
    generateRecommendationReason,
    getRecommendationCategory,
    getPopularRecommendations,
    getCollaborativeFilteringRecommendations,
    calculateFlightSimilarity,
    getHybridRecommendations,
    calculateFlightScores,
    calculateTotalScore
  };
}