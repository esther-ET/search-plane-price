// 特价机票发现平台 - 模拟数据
// 数据仅供演示原型使用

const flightData = {
  // 首页推荐特价航班
  recommendations: [
    {
      id: 101,
      airline: "中国东方航空",
      airlineLogo: "MU",
      flightNumber: "MU586",
      departure: { city: "上海", airport: "浦东机场 (PVG)", time: "08:30" },
      arrival: { city: "东京", airport: "羽田机场 (HND)", time: "12:00" },
      date: "2025-04-15",
      duration: "3小时30分",
      price: 1200,
      originalPrice: 1800,
      discount: 33,
      cabin: "经济舱",
      stops: 0,
      isSpecial: true,
      tags: ["限时特价", "直飞", "早鸟优惠"],
      seatsLeft: 5,
      validUntil: new Date(Date.now() + 6 * 3600000).toISOString()
    },
    {
      id: 102,
      airline: "中国国际航空",
      airlineLogo: "CA",
      flightNumber: "CA929",
      departure: { city: "北京", airport: "首都机场 (PEK)", time: "14:20" },
      arrival: { city: "曼谷", airport: "素万那普机场 (BKK)", time: "18:45" },
      date: "2025-04-20",
      duration: "5小时25分",
      price: 899,
      originalPrice: 1599,
      discount: 44,
      cabin: "经济舱",
      stops: 0,
      isSpecial: true,
      tags: ["海岛度假", "直飞", "热门"],
      seatsLeft: 12,
      validUntil: new Date(Date.now() + 24 * 3600000).toISOString()
    },
    {
      id: 103,
      airline: "南方航空",
      airlineLogo: "CZ",
      flightNumber: "CZ3049",
      departure: { city: "广州", airport: "白云机场 (CAN)", time: "09:15" },
      arrival: { city: "新加坡", airport: "樟宜机场 (SIN)", time: "13:00" },
      date: "2025-05-10",
      duration: "3小时45分",
      price: 1099,
      originalPrice: 1999,
      discount: 45,
      cabin: "经济舱",
      stops: 0,
      isSpecial: true,
      tags: ["商务优选", "直飞", "五星航空"],
      seatsLeft: 8,
      validUntil: new Date(Date.now() + 48 * 3600000).toISOString()
    }
  ],

  // 搜索页航班列表
  flights: [
    {
      id: 101,
      airline: "中国东方航空",
      airlineLogo: "MU",
      flightNumber: "MU586",
      departure: { city: "上海", airport: "浦东机场 (PVG)", time: "08:30" },
      arrival: { city: "东京", airport: "羽田机场 (HND)", time: "12:00" },
      date: "2025-04-15",
      duration: "3小时30分",
      price: 1200,
      originalPrice: 1800,
      discount: 33,
      cabin: "经济舱",
      stops: 0,
      isSpecial: true,
      tags: ["限时特价", "直飞", "早鸟优惠"]
    },
    {
      id: 201,
      airline: "中国国际航空",
      airlineLogo: "CA",
      flightNumber: "CA929",
      departure: { city: "上海", airport: "浦东机场 (PVG)", time: "10:15" },
      arrival: { city: "东京", airport: "成田机场 (NRT)", time: "14:00" },
      date: "2025-04-16",
      duration: "2小时45分",
      price: 1350,
      originalPrice: 2100,
      discount: 36,
      cabin: "经济舱",
      stops: 0,
      isSpecial: true,
      tags: ["直飞", "热门航线"]
    },
    {
      id: 202,
      airline: "日本航空",
      airlineLogo: "JL",
      flightNumber: "JL872",
      departure: { city: "上海", airport: "虹桥机场 (SHA)", time: "13:45" },
      arrival: { city: "东京", airport: "羽田机场 (HND)", time: "17:30" },
      date: "2025-04-17",
      duration: "2小时45分",
      price: 1450,
      originalPrice: 2200,
      discount: 34,
      cabin: "经济舱",
      stops: 0,
      isSpecial: false,
      tags: ["优质服务"]
    },
    {
      id: 203,
      airline: "春秋航空",
      airlineLogo: "9C",
      flightNumber: "9C6217",
      departure: { city: "上海", airport: "浦东机场 (PVG)", time: "22:10" },
      arrival: { city: "东京", airport: "成田机场 (NRT)", time: "02:15 (+1)" },
      date: "2025-04-15",
      duration: "3小时05分",
      price: 899,
      originalPrice: 1200,
      discount: 25,
      cabin: "经济舱",
      stops: 0,
      isSpecial: true,
      tags: ["廉航特价", "红眼航班"]
    },
    {
      id: 301,
      airline: "中国东方航空",
      airlineLogo: "MU",
      flightNumber: "MU5071",
      departure: { city: "上海", airport: "浦东机场 (PVG)", time: "08:00" },
      arrival: { city: "首尔", airport: "仁川机场 (ICN)", time: "10:30" },
      date: "2025-04-18",
      duration: "1小时30分",
      price: 850,
      originalPrice: 1300,
      discount: 35,
      cabin: "经济舱",
      stops: 0,
      isSpecial: true,
      tags: ["短途特价", "直飞"]
    },
    {
      id: 302,
      airline: "大韩航空",
      airlineLogo: "KE",
      flightNumber: "KE898",
      departure: { city: "上海", airport: "浦东机场 (PVG)", time: "19:30" },
      arrival: { city: "首尔", airport: "仁川机场 (ICN)", time: "22:00" },
      date: "2025-04-19",
      duration: "1小时30分",
      price: 950,
      originalPrice: 1600,
      discount: 41,
      cabin: "经济舱",
      stops: 0,
      isSpecial: true,
      tags: ["五星航空", "夜间航班"]
    },
    {
      id: 401,
      airline: "中国国际航空",
      airlineLogo: "CA",
      flightNumber: "CA821",
      departure: { city: "北京", airport: "首都机场 (PEK)", time: "09:45" },
      arrival: { city: "曼谷", airport: "素万那普机场 (BKK)", time: "13:30" },
      date: "2025-04-20",
      duration: "4小时45分",
      price: 1299,
      originalPrice: 2200,
      discount: 41,
      cabin: "经济舱",
      stops: 0,
      isSpecial: true,
      tags: ["热带度假", "直飞"]
    },
    {
      id: 402,
      airline: "泰国国际航空",
      airlineLogo: "TG",
      flightNumber: "TG614",
      departure: { city: "北京", airport: "首都机场 (PEK)", time: "16:20" },
      arrival: { city: "曼谷", airport: "素万那普机场 (BKK)", time: "20:45" },
      date: "2025-04-21",
      duration: "5小时25分",
      price: 1450,
      originalPrice: 2500,
      discount: 42,
      cabin: "经济舱",
      stops: 0,
      isSpecial: false,
      tags: ["传统航空", "优质服务"]
    },
    {
      id: 501,
      airline: "新加坡航空",
      airlineLogo: "SQ",
      flightNumber: "SQ825",
      departure: { city: "上海", airport: "浦东机场 (PVG)", time: "10:00" },
      arrival: { city: "新加坡", airport: "樟宜机场 (SIN)", time: "15:30" },
      date: "2025-05-05",
      duration: "5小时30分",
      price: 1650,
      originalPrice: 2800,
      discount: 41,
      cabin: "经济舱",
      stops: 0,
      isSpecial: true,
      tags: ["五星航空", "优质服务"]
    },
    {
      id: 502,
      airline: "酷航",
      airlineLogo: "TR",
      flightNumber: "TR137",
      departure: { city: "上海", airport: "浦东机场 (PVG)", time: "01:30" },
      arrival: { city: "新加坡", airport: "樟宜机场 (SIN)", time: "07:00" },
      date: "2025-05-08",
      duration: "5小时30分",
      price: 899,
      originalPrice: 1500,
      discount: 40,
      cabin: "经济舱",
      stops: 0,
      isSpecial: true,
      tags: ["廉航特价", "红眼航班"]
    }
  ],

  // 价格对比数据
  priceComparisons: {
    101: [
      { platform: "携程旅行", price: 1200, url: "#", isBest: true },
      { platform: "飞猪", price: 1250, url: "#", isBest: false },
      { platform: "去哪儿", price: 1220, url: "#", isBest: false },
      { platform: "东方航空官网", price: 1180, url: "#", isBest: false }
    ],
    102: [
      { platform: "携程旅行", price: 899, url: "#", isBest: true },
      { platform: "飞猪", price: 950, url: "#", isBest: false },
      { platform: "去哪儿", price: 920, url: "#", isBest: false },
      { platform: "国航官网", price: 880, url: "#", isBest: false }
    ]
  },

  // 筛选选项
  filters: {
    airlines: ["中国东方航空", "中国国际航空", "南方航空", "日本航空", "大韩航空", "泰国国际航空", "新加坡航空", "春秋航空", "酷航"],
    cabinClasses: ["经济舱", "超级经济舱", "商务舱", "头等舱"],
    priceRange: { min: 500, max: 3000 }
  }
};

// 导出数据供页面使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = flightData;
} else {
  window.flightData = flightData;
}

// 工具函数
function formatCurrency(amount) {
  return '¥' + amount.toLocaleString('zh-CN');
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getFlightById(id) {
  return flightData.flights.find(flight => flight.id === id) ||
         flightData.recommendations.find(flight => flight.id === id);
}

function getPriceComparisons(id) {
  return flightData.priceComparisons[id] || [];
}