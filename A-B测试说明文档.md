# A/B测试框架说明文档

**创建时间**：2026年4月10日
**功能**：比较不同推荐算法的效果，优化推荐质量

---

## 一、测试目的

A/B测试的核心目的是**比较不同推荐算法的效果**，通过数据驱动的方式找出用户更喜欢的算法，并据此优化推荐策略。

### 核心问题
- 哪种推荐算法更适合当前用户群体？
- 用户对不同算法的满意度如何？
- 如何基于数据做出优化决策？

---

## 二、衡量标准

### 主要指标

| 指标 | 计算方式 | 说明 |
|------|---------|------|
| **正反馈率** | 有用数 / (有用数 + 无用数) | 越高推荐越精准 |
| **点击率(CTR)** | 点击数 / 展示数 | 用户是否感兴趣 |
| **采纳率** | 收藏/预订/查看详情 / 展示数 | 最终转化效果 |

### 辅助指标
- **样本量**：统计显著性需要足够的样本量
- **置信区间**：判断结果是否可靠
- **用户分佈**：各实验组用户数量是否均衡

---

## 三、我们的A/B测试设计

### 实验一：首页推荐算法测试 (`home_recommendation`)

| 实验组 | 算法 | 描述 |
|--------|------|------|
| **规则推荐** | rule_v1 | 基于价格、折扣、用户偏好的个性化评分 |
| **协同过滤** | cf_v1 | 基于项目相似度的推荐 |
| **混合推荐** | hybrid_v1 | 70%规则推荐 + 30%协同过滤 |

### 实验二：相似航班推荐测试 (`similar_flights`)

| 实验组 | 算法 | 描述 |
|--------|------|------|
| **价格权重优先** | price_weight | 相似度计算以价格为核心 |
| **航司权重优先** | airline_weight | 相似度计算以航空公司为核心 |

---

## 四、数据收集

### 反馈数据结构
```javascript
{
  flightId: 101,           // 航班ID
  flightType: 'home',      // 推荐来源：home | search | detail-similar
  isUseful: true,          // 用户评价
  recommendationScore: 85, // 推荐分数
  timestamp: '2026-04-10T10:30:00.000Z',
  sessionId: 'sess_xxx',   // 会话ID
  algorithmVersion: 'hybrid_v1'  // 算法版本
}
```

### A/B测试追踪事件
```javascript
// 推荐展示
{ type: 'recommendation_show', experimentId, flightId, algorithmVersion }
{ type: 'recommendation_click', experimentId, flightId, algorithmVersion }
{ type: 'recommendation_feedback', experimentId, flightId, algorithmVersion, isUseful }
```

---

## 五、统计结果示例

### 效果对比表
```
┌─────────────┬──────────┬──────────┬──────────┬──────────┐
│  算法版本    │ 展示数   │ 点击率   │ 有用率   │ 样本量   │
├─────────────┼──────────┼──────────┼──────────┼──────────┤
│ 规则推荐v1   │  120     │  35%     │  72%     │  45      │
│ 协同过滤v1   │  118     │  28%     │  68%     │  38      │
│ 混合推荐v1   │  125     │  42%     │  81%     │  52      │  ← 最佳
└─────────────┴──────────┴──────────┴──────────┴──────────┘
```

### 结论
- **混合推荐**正反馈率最高(81%)，应作为主推算法
- 用户更看重直飞和价格相似度
- 建议加大混合推荐算法的投入

---

## 六、代码调用示例

### 1. 初始化A/B测试
```javascript
// 页面加载时自动初始化
ABTest.init();
```

### 2. 记录推荐展示
```javascript
ABTest.trackRecommendationShow(
  'home_recommendation',  // 实验ID
  flight.id,              // 航班ID
  flight.algorithmVersion // 算法版本
);
```

### 3. 记录用户反馈
```javascript
ABTest.trackFeedback(
  'home_recommendation',
  flight.id,
  flight.algorithmVersion,
  isUseful // true=有用, false=无用
);
```

### 4. 获取实验结果
```javascript
const results = ABTest.getExperimentResults('home_recommendation');
console.log(results.groups);

// 输出示例
{
  'rule_v1': { label: '规则推荐', shows: 45, positiveRate: '72.00', ... },
  'cf_v1': { label: '协同过滤', shows: 38, positiveRate: '68.00', ... },
  'hybrid_v1': { label: '混合推荐', shows: 52, positiveRate: '81.00', ... }
}
```

### 5. 获取最佳算法
```javascript
const bestGroup = ABTest.getBestGroup('home_recommendation');
// 返回: 'hybrid_v1'
```

---

## 七、数据存储

### localStorage键名
| 键名 | 内容 |
|------|------|
| `abtest_user_group` | 用户实验分组 |
| `abtest_experiments` | 实验配置 |
| `abtest_events` | 事件日志（最多1000条） |
| `abtest_metrics_{expId}` | 各实验的指标数据 |

### 重置实验数据
```javascript
// 重置单个实验
ABTest.resetExperiment('home_recommendation');

// 重置所有实验
ABTest.resetAll();
```

---

## 八、后续优化方向

1. **增加统计显著性检验**
   - 使用卡方检验判断差异是否显著
   - 计算置信区间

2. **扩展实验维度**
   - 不同用户群体的效果对比（新用户 vs 老用户）
   - 不同场景的效果对比（商务出行 vs 休闲旅游）

3. **自适应算法**
   - 根据用户反馈动态调整推荐权重
   - 个性化算法选择

4. **长期效果追踪**
   - 追踪用户的最终预订行为
   - 分析推荐对转化率的影响

---

## 九、注意事项

1. **样本量要求**：每组至少30-50个样本才能得出可靠结论
2. **时间因素**：避免在节假日/促销期间进行测试，结果可能失真
3. **排除干扰**：测试期间保持其他功能不变
4. **用户知情权**：可考虑在UI中显示"正在进行算法测试"

---

**维护人**：AI开发助手
**下次评审**：收集足够样本数据后（约1-2周）
