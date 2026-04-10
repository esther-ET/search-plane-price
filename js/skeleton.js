// Skeleton Loading 组件

// 生成航班卡片骨架屏
function createFlightCardSkeleton() {
  return `
    <div class="bg-white rounded-xl shadow-md p-6 animate-pulse">
      <div class="flex justify-between items-start mb-4">
        <div class="h-6 bg-gray-200 rounded w-1/4"></div>
        <div class="h-6 bg-gray-200 rounded w-16"></div>
      </div>
      <div class="space-y-3 mb-4">
        <div class="h-4 bg-gray-200 rounded w-3/4"></div>
        <div class="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-4">
          <div class="h-8 w-16 bg-gray-200 rounded"></div>
          <div class="h-4 bg-gray-200 rounded w-24"></div>
        </div>
        <div class="h-8 w-20 bg-gray-200 rounded"></div>
      </div>
      <div class="flex space-x-3">
        <div class="h-10 flex-1 bg-gray-200 rounded"></div>
        <div class="h-10 w-10 bg-gray-200 rounded"></div>
      </div>
    </div>
  `;
}

// 生成推荐卡片骨架屏
function createRecommendationCardSkeleton() {
  return `
    <div class="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
      <div class="bg-gradient-to-r from-gray-300 to-gray-200 h-32"></div>
      <div class="p-6">
        <div class="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div class="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div class="flex items-center mb-4">
          <div class="h-4 bg-gray-200 rounded w-1/4 mr-4"></div>
          <div class="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div class="h-8 bg-gray-200 rounded w-1/3"></div>
      </div>
    </div>
  `;
}

// 生成列表骨架屏
function createListSkeleton(count = 3) {
  let html = '';
  for (let i = 0; i < count; i++) {
    html += createFlightCardSkeleton();
  }
  return html;
}

// 显示骨架屏
function showSkeleton(containerId, type = 'list') {
  const container = document.getElementById(containerId);
  if (!container) return;

  let skeletonHtml = '';
  switch (type) {
    case 'list':
      skeletonHtml = `<div class="space-y-4">${createListSkeleton(3)}</div>`;
      break;
    case 'recommendation':
      skeletonHtml = `<div class="grid grid-cols-1 md:grid-cols-3 gap-6">${createRecommendationCardSkeleton()}${createRecommendationCardSkeleton()}${createRecommendationCardSkeleton()}</div>`;
      break;
    case 'detail':
      skeletonHtml = `
        <div class="bg-white rounded-xl shadow-lg p-6 animate-pulse">
          <div class="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div class="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div class="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
          <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="h-24 bg-gray-200 rounded"></div>
            <div class="h-24 bg-gray-200 rounded"></div>
            <div class="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      `;
      break;
    default:
      skeletonHtml = createListSkeleton();
  }

  container.innerHTML = skeletonHtml;
}

// 隐藏骨架屏（加载真实数据后）
function hideSkeleton(containerId) {
  // 实际使用中不需要调用，loadFlightList等函数会直接替换innerHTML
}

// 添加骨架屏动画样式到head
function initSkeletonStyles() {
  // 添加脉冲动画
  const styleId = 'skeleton-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
  `;
  document.head.appendChild(style);
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', initSkeletonStyles);

// 导出到全局
window.createFlightCardSkeleton = createFlightCardSkeleton;
window.createRecommendationCardSkeleton = createRecommendationCardSkeleton;
window.showSkeleton = showSkeleton;
window.hideSkeleton = hideSkeleton;
