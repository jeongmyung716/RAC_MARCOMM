/**
 * Air Conditioner Specs & Marketing Communication Intelligence Dashboard
 * Simple, Verified & Concrete MarCom Analytics Engine (v3.1 Official Links)
 */

// Global Application State
const state = {
  data: null,
  filters: {
    productType: 'ALL',
    brand: 'ALL',
    energyGrade: 'ALL',
    targetCustomer: 'ALL',
    searchQuery: '',
  },
  catalogPage: 1,
  catalogPageSize: 8,
  activeTab: 'tab-catalog',
  theme: 'dark',
  comparator: {
    category: '2in1',
    modelAId: 'OWN-01',
    modelBId: 'AC-0001'
  }
};

const BRAND_COLORS = {
  '캐리어': '#0284c7',
  '삼성전자': '#2563eb',
  '센추리': '#0d9488',
  '위닉스': '#7c3aed',
  'LG전자': '#e11d48',
  '하이얼': '#ea580c',
  '위니아': '#059669',
  '파세코': '#d97706',
  'TCL': '#dc2626',
  '신일전자': '#4f46e5',
  '자사': '#10b981'
};

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  if (typeof RAW_DATA !== 'undefined') {
    state.data = RAW_DATA;
    postProcessData();
    populateFilterDropdowns();
    setupEventListeners();
    applyTheme(state.theme);
    refreshAllViews();
  } else {
    console.error('RAW_DATA not found. Please ensure data.js is loaded.');
  }
}

// Data Pre-processing & Enriching
function postProcessData() {
  const compDb = state.data.competitor_db || [];
  const rawWebList = state.data.raw_web_data || [];
  const rawMap = {};
  rawWebList.forEach(r => { rawMap[r.product_id] = r.raw_page_text; });

  compDb.forEach(item => {
    item.price_num = parseFloat(item.price_krw) || 0;
    item.capacity_w_num = parseFloat(item.cooling_capacity_W) || 0;
    item.capacity_pyeong_num = parseFloat(item.capacity_pyeong) || 0;
    item.noise_num = parseFloat(item.min_noise_dBA) || 0;
    item.air_vol_num = parseFloat(item.max_air_volume_m3h) || 0;
    item.krw_per_w = item.capacity_w_num > 0 ? (item.price_num / item.capacity_w_num) : 0;
    item.raw_text = rawMap[item.product_id] || '크롤링 원본 데이터가 없습니다.';
  });

  const ownDb = state.data.own_product_db || [];
  ownDb.forEach(item => {
    item.price_num = 2000000; // Baseline estimated price
    item.capacity_w_num = parseFloat(item.cooling_capacity_W) || 0;
    item.capacity_pyeong_num = parseFloat(item.capacity_pyeong) || 0;
    item.noise_num = parseFloat(item.min_noise_dBA) || 0;
    item.krw_per_w = item.capacity_w_num > 0 ? (item.price_num / item.capacity_w_num) : 0;
    item.raw_text = `[자사 신제품 내부 사양서]\n모델명: ${item.model_name}\n유형: ${item.product_type}\n냉방능력: ${item.cooling_capacity_W}W (${item.capacity_pyeong}평)\n최저소음: ${item.min_noise_dBA}dB\n에너지효율: ${item.energy_grade}\nWi-Fi: ${item.wifi_control}\nUSP 1: ${item.usp_1}\nUSP 2: ${item.usp_2}`;
  });
}

function getBrandLinkHtml(item) {
  if (!item.product_page_url) return '';
  let label = '공식 제품 페이지';
  if (item.brand === '삼성전자') {
    label = '삼성 공식몰 검색 바로가기';
  } else if (item.brand === 'LG전자') {
    label = 'LG전자 공식몰 검색 바로가기';
  } else if (item.brand === '캐리어') {
    label = '캐리어 공식몰 바로가기';
  } else if (item.brand === '파세코') {
    label = '파세코 공식몰 바로가기';
  } else if (item.brand === '위닉스') {
    label = '위닉스 공식몰 바로가기';
  } else if (item.brand === '신일전자') {
    label = '신일 공식몰 바로가기';
  }
  return `
    <a href="${item.product_page_url}" target="_blank" class="btn btn-outline-cyan" style="font-size: 0.72rem; padding: 0.25rem 0.6rem;">
      <i data-lucide="external-link" style="width: 12px; height: 12px;"></i> ${label}
    </a>
  `;
}

// Populate Filter Options
function populateFilterDropdowns() {
  const compDb = state.data.competitor_db;
  
  const brands = Array.from(new Set(compDb.map(d => d.brand))).filter(Boolean);
  const targetCustomers = Array.from(new Set(compDb.map(d => d.target_customer))).filter(Boolean);

  const brandSelect = document.getElementById('filter-brand');
  if (brandSelect) {
    brandSelect.innerHTML = '<option value="ALL">전체 브랜드 (10개사)</option>' + 
      brands.map(b => `<option value="${b}">${b}</option>`).join('');
  }

  const customerSelect = document.getElementById('filter-customer');
  if (customerSelect) {
    customerSelect.innerHTML = '<option value="ALL">전체 타깃 고객군</option>' + 
      targetCustomers.map(c => `<option value="${c}">${c}</option>`).join('');
  }
}

// Event Listeners
function setupEventListeners() {
  // Tab Navigation
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      const target = btn.getAttribute('data-tab');
      btn.classList.add('active');
      const content = document.getElementById(target);
      if (content) content.classList.add('active');
      state.activeTab = target;

      if (target === 'tab-compare') {
        renderComparator();
      } else if (target === 'tab-audit') {
        renderAuditCenter();
      }
      if (window.lucide) lucide.createIcons();
    });
  });

  // Category Filter Pills
  document.querySelectorAll('#category-pills .cat-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#category-pills .cat-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.filters.productType = pill.getAttribute('data-val');
      state.catalogPage = 1;
      refreshAllViews();
    });
  });

  // Secondary Filters
  const brandSelect = document.getElementById('filter-brand');
  if (brandSelect) {
    brandSelect.addEventListener('change', (e) => {
      state.filters.brand = e.target.value;
      state.catalogPage = 1;
      refreshAllViews();
    });
  }

  const energySelect = document.getElementById('filter-energy');
  if (energySelect) {
    energySelect.addEventListener('change', (e) => {
      state.filters.energyGrade = e.target.value;
      state.catalogPage = 1;
      refreshAllViews();
    });
  }

  const customerSelect = document.getElementById('filter-customer');
  if (customerSelect) {
    customerSelect.addEventListener('change', (e) => {
      state.filters.targetCustomer = e.target.value;
      state.catalogPage = 1;
      refreshAllViews();
    });
  }

  const searchInput = document.getElementById('global-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      state.filters.searchQuery = e.target.value;
      state.catalogPage = 1;
      refreshAllViews();
    }, 200));
  }

  const resetBtn = document.getElementById('btn-reset-filters');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetFilters();
    });
  }

  // Theme Toggle
  const themeBtn = document.getElementById('btn-toggle-theme');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme(state.theme);
    });
  }

  // CSV Export
  const csvBtn = document.getElementById('btn-export-csv');
  if (csvBtn) {
    csvBtn.addEventListener('click', () => {
      exportToCsv();
    });
  }

  // Print Report
  const printBtn = document.getElementById('btn-print-report');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Comparator Dropdowns
  const compCatSelect = document.getElementById('comp-category-select');
  if (compCatSelect) {
    compCatSelect.addEventListener('change', (e) => {
      state.comparator.category = e.target.value;
      updateComparatorDropdowns();
      renderComparator();
    });
  }

  const compModelA = document.getElementById('comp-model-a-select');
  if (compModelA) {
    compModelA.addEventListener('change', (e) => {
      state.comparator.modelAId = e.target.value;
      renderComparator();
    });
  }

  const compModelB = document.getElementById('comp-model-b-select');
  if (compModelB) {
    compModelB.addEventListener('change', (e) => {
      state.comparator.modelBId = e.target.value;
      renderComparator();
    });
  }
}

function resetFilters() {
  state.filters = {
    productType: 'ALL',
    brand: 'ALL',
    energyGrade: 'ALL',
    targetCustomer: 'ALL',
    searchQuery: '',
  };

  document.querySelectorAll('#category-pills .cat-pill').forEach(p => {
    p.classList.toggle('active', p.getAttribute('data-val') === 'ALL');
  });

  const brandSelect = document.getElementById('filter-brand');
  if (brandSelect) brandSelect.value = 'ALL';
  const energySelect = document.getElementById('filter-energy');
  if (energySelect) energySelect.value = 'ALL';
  const customerSelect = document.getElementById('filter-customer');
  if (customerSelect) customerSelect.value = 'ALL';
  const searchInput = document.getElementById('global-search-input');
  if (searchInput) searchInput.value = '';

  state.catalogPage = 1;
  refreshAllViews();
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const themeIcon = document.getElementById('theme-icon');
  if (themeIcon) {
    themeIcon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
    if (window.lucide) lucide.createIcons();
  }
}

// Filter Matching
function getFilteredCompetitors() {
  const { productType, brand, energyGrade, targetCustomer, searchQuery } = state.filters;
  
  return state.data.competitor_db.filter(d => {
    if (productType !== 'ALL' && d.product_type !== productType) return false;
    if (brand !== 'ALL' && d.brand !== brand) return false;
    if (energyGrade !== 'ALL' && d.energy_grade !== energyGrade) return false;
    if (targetCustomer !== 'ALL' && d.target_customer !== targetCustomer) return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = (d.model_name && d.model_name.toLowerCase().includes(q)) ||
                    (d.brand && d.brand.toLowerCase().includes(q)) ||
                    (d.usp_1 && d.usp_1.toLowerCase().includes(q)) ||
                    (d.usp_1_description && d.usp_1_description.toLowerCase().includes(q)) ||
                    (d.usp_2 && d.usp_2.toLowerCase().includes(q)) ||
                    (d.usp_2_description && d.usp_2_description.toLowerCase().includes(q)) ||
                    (d.marketing_direction && d.marketing_direction.toLowerCase().includes(q)) ||
                    (d.target_customer && d.target_customer.toLowerCase().includes(q)) ||
                    (d.product_id && d.product_id.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });
}

function refreshAllViews() {
  renderCatalog();
  renderComparator();
  renderAuditCenter();
  if (window.lucide) lucide.createIcons();
}

// -------------------------------------------------------------
// 1. Tab 1: Product & Marketing Communication Catalog
// -------------------------------------------------------------
function renderCatalog() {
  const container = document.getElementById('product-cards-container');
  if (!container) return;

  const filtered = getFilteredCompetitors();
  const total = filtered.length;

  const countEl = document.getElementById('catalog-count');
  if (countEl) countEl.textContent = total;

  const badgeEl = document.getElementById('catalog-category-badge');
  if (badgeEl) {
    badgeEl.textContent = `제품군: ${state.filters.productType === 'ALL' ? '전체' : state.filters.productType}`;
  }

  if (total === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--bg-card); border-radius: var(--radius-lg);">
        <i data-lucide="search-x" style="width: 36px; height: 36px; color: var(--text-muted); margin-bottom: 0.5rem;"></i>
        <p style="color: var(--text-secondary); font-size: 0.95rem;">선택된 조건에 맞는 제품이 없습니다. 필터를 완화해 보세요.</p>
      </div>
    `;
    return;
  }

  const totalPages = Math.ceil(total / state.catalogPageSize) || 1;
  if (state.catalogPage > totalPages) state.catalogPage = totalPages;

  const start = (state.catalogPage - 1) * state.catalogPageSize;
  const pageItems = filtered.slice(start, start + state.catalogPageSize);

  container.innerHTML = pageItems.map(item => `
    <div class="product-item-card">
      <!-- Card Top -->
      <div class="product-card-top">
        <div class="product-brand-title">
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <span class="product-brand-name" style="color: ${BRAND_COLORS[item.brand] || '#38bdf8'};">${item.brand}</span>
            <span class="badge badge-blue">${item.product_type}</span>
            <span class="badge ${item.data_confidence === 'High' ? 'badge-green' : 'badge-amber'}">
              <i data-lucide="check-circle-2" style="width: 10px; height: 10px;"></i> ${item.data_confidence} 신뢰도
            </span>
          </div>
          <div class="product-model-name">${item.model_name}</div>
          <span style="font-size: 0.7rem; color: var(--text-muted);">모델 ID: ${item.product_id} | 출시: ${item.launch_date || '2026'}</span>
        </div>

        <div class="product-price-box">
          <div class="product-price-val">${(item.price_num / 10000).toLocaleString()}만원</div>
          <div class="product-price-unit">${(item.price_num).toLocaleString()}원</div>
        </div>
      </div>

      <!-- Specs Box -->
      <div class="product-specs-box">
        <div class="spec-item">
          <span class="spec-item-label">냉방 용량</span>
          <span class="spec-item-val">${item.cooling_capacity_W} W (${item.capacity_pyeong}평)</span>
        </div>
        <div class="spec-item">
          <span class="spec-item-label">최저 소음</span>
          <span class="spec-item-val">${item.min_noise_dBA} dB(A)</span>
        </div>
        <div class="spec-item">
          <span class="spec-item-label">에너지 등급</span>
          <span class="spec-item-val" style="color: ${item.energy_grade === '1등급' ? '#34d399' : '#fbbf24'};">${item.energy_grade} (${item.operation_type})</span>
        </div>
        <div class="spec-item">
          <span class="spec-item-label">최대 풍량</span>
          <span class="spec-item-val">${item.max_air_volume_m3h} ㎥/h</span>
        </div>
        <div class="spec-item">
          <span class="spec-item-label">W당 가성비 단가</span>
          <span class="spec-item-val">${item.krw_per_w.toFixed(0)} 원/W</span>
        </div>
        <div class="spec-item">
          <span class="spec-item-label">스마트 제어</span>
          <span class="spec-item-val">${item.wifi_control === '지원' ? 'Wi-Fi 지원' : 'Wi-Fi 미지원'}</span>
        </div>
      </div>

      <!-- Feature Badges -->
      <div class="product-features-row">
        <span class="feat-tag ${item.wifi_control === '지원' ? 'active' : ''}">Wi-Fi 제어</span>
        <span class="feat-tag ${item.voice_control === '지원' ? 'active' : ''}">음성 제어</span>
        <span class="feat-tag ${item.auto_dry === '지원' ? 'active' : ''}">자동 건조</span>
        <span class="feat-tag ${item.air_cleaning === '지원' ? 'active' : ''}">공기 청정</span>
        <span class="feat-tag ${item.dehumidification === '지원' ? 'active' : ''}">제습 운전</span>
        <span class="feat-tag ${item.sleep_mode === '지원' ? 'active' : ''}">취침 모드</span>
      </div>

      <!-- Marketing Communication Block (Deep) -->
      <div class="product-marcom-box">
        <div class="marcom-header">
          <span><i data-lucide="sparkles" style="width: 13px; height: 13px; vertical-align: middle; color: #a78bfa;"></i> 핵심 마케팅 커뮤니케이션 & USP</span>
          <span class="badge badge-purple">${item.competitive_keyword}</span>
        </div>

        <div class="marcom-usp-item">
          <span class="marcom-usp-title">[USP 1] ${item.usp_1}:</span>
          <span>${item.usp_1_description}</span>
        </div>

        <div class="marcom-usp-item">
          <span class="marcom-usp-title">[USP 2] ${item.usp_2}:</span>
          <span>${item.usp_2_description}</span>
        </div>

        <div class="marcom-direction-quote">
          "${item.marketing_direction}"
        </div>

        <div class="marcom-target-row">
          <span><strong>타깃 고객:</strong> <span class="badge badge-cyan">${item.target_customer}</span></span>
          ${getBrandLinkHtml(item)}
        </div>
      </div>

      <!-- Raw Web Crawl Verification Accordion -->
      <div class="raw-verify-accordion">
        <button class="raw-toggle-btn" onclick="toggleRawText('${item.product_id}')">
          <span><i data-lucide="file-text" style="width: 12px; height: 12px; vertical-align: middle;"></i> 크롤링 원본 텍스트 정합성 대조</span>
          <i data-lucide="chevron-down" id="raw-icon-${item.product_id}" style="width: 14px; height: 14px;"></i>
        </button>
        <div class="raw-text-content" id="raw-text-${item.product_id}">${item.raw_text}</div>
      </div>
    </div>
  `).join('');

  // Update Pagination UI
  const pageInfo = document.getElementById('catalog-page-info');
  if (pageInfo) {
    pageInfo.textContent = `${total}개 중 ${start + 1}~${Math.min(start + state.catalogPageSize, total)}개 표시 (페이지 ${state.catalogPage} / ${totalPages})`;
  }

  const prevBtn = document.getElementById('btn-page-prev');
  const nextBtn = document.getElementById('btn-page-next');
  if (prevBtn) prevBtn.disabled = state.catalogPage <= 1;
  if (nextBtn) nextBtn.disabled = state.catalogPage >= totalPages;
}

window.changeCatalogPage = function(delta) {
  state.catalogPage += delta;
  renderCatalog();
  if (window.lucide) lucide.createIcons();
  window.scrollTo({ top: 180, behavior: 'smooth' });
};

window.toggleRawText = function(productId) {
  const content = document.getElementById(`raw-text-${productId}`);
  const icon = document.getElementById(`raw-icon-${productId}`);
  if (content) {
    content.classList.toggle('open');
    if (icon) {
      icon.style.transform = content.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
    }
  }
};

// -------------------------------------------------------------
// 2. Tab 2: 1:1 Side-by-Side Spec & Marketing Comparator
// -------------------------------------------------------------
function updateComparatorDropdowns() {
  const cat = state.comparator.category;
  const compDb = state.data.competitor_db.filter(c => c.product_type === cat);
  const ownDb = state.data.own_product_db.filter(o => o.product_type === cat);

  const selectA = document.getElementById('comp-model-a-select');
  const selectB = document.getElementById('comp-model-b-select');

  // Model A options: Own products in this category (if any) + competitors
  let optionsA = '';
  if (ownDb.length > 0) {
    optionsA += '<optgroup label="★ 자사 신제품 라인업">';
    optionsA += ownDb.map(o => `<option value="${o.own_product_id}">[자사] ${o.own_product_id} - ${o.model_name}</option>`).join('');
    optionsA += '</optgroup>';
  }
  optionsA += '<optgroup label="경쟁사 모델">';
  optionsA += compDb.map(c => `<option value="${c.product_id}">[${c.brand}] ${c.model_name}</option>`).join('');
  optionsA += '</optgroup>';

  if (selectA) {
    selectA.innerHTML = optionsA;
    if (ownDb.length > 0) {
      state.comparator.modelAId = ownDb[0].own_product_id;
      selectA.value = ownDb[0].own_product_id;
    } else if (compDb.length > 0) {
      state.comparator.modelAId = compDb[0].product_id;
      selectA.value = compDb[0].product_id;
    }
  }

  // Model B options: Competitors in this category
  let optionsB = compDb.map(c => `<option value="${c.product_id}">[${c.brand}] ${c.model_name}</option>`).join('');
  if (selectB) {
    selectB.innerHTML = optionsB;
    if (compDb.length > 1) {
      state.comparator.modelBId = compDb[1].product_id;
      selectB.value = compDb[1].product_id;
    } else if (compDb.length > 0) {
      state.comparator.modelBId = compDb[0].product_id;
      selectB.value = compDb[0].product_id;
    }
  }
}

function renderComparator() {
  const container = document.getElementById('comparator-output-container');
  if (!container) return;

  const selectA = document.getElementById('comp-model-a-select');
  if (selectA && selectA.options.length === 0) {
    updateComparatorDropdowns();
  }

  const idA = state.comparator.modelAId;
  const idB = state.comparator.modelBId;

  const allItems = [...state.data.competitor_db, ...state.data.own_product_db];
  const itemA = allItems.find(d => (d.product_id === idA || d.own_product_id === idA)) || state.data.competitor_db[0];
  const itemB = allItems.find(d => (d.product_id === idB || d.own_product_id === idB)) || state.data.competitor_db[1];

  if (!itemA || !itemB) return;

  const isOwnA = !!itemA.own_product_id;
  const isOwnB = !!itemB.own_product_id;

  container.innerHTML = `
    <!-- Column Model A -->
    <div class="comp-column ${isOwnA ? 'own-col' : ''}">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span class="badge ${isOwnA ? 'badge-green' : 'badge-blue'}">${isOwnA ? '★ 자사 제품' : '기준 모델'}</span>
        <span class="badge badge-purple">${itemA.product_type}</span>
      </div>
      <div>
        <h4 style="font-size: 1.15rem; font-weight: 800; color: ${BRAND_COLORS[itemA.brand] || '#38bdf8'};">[${itemA.brand}] ${itemA.model_name}</h4>
        <div style="font-size: 1.25rem; font-weight: 800; color: #34d399; margin-top: 0.25rem;">
          ${(itemA.price_num / 10000).toLocaleString()}만원 <span style="font-size: 0.75rem; color: var(--text-muted);">(${itemA.krw_per_w.toFixed(0)} 원/W)</span>
        </div>
      </div>

      <!-- Specs Table -->
      <table class="comparison-table">
        <tr><th>냉방용량</th><td><strong>${itemA.cooling_capacity_W} W</strong> (${itemA.capacity_pyeong}평)</td></tr>
        <tr><th>최저소음</th><td><strong>${itemA.min_noise_dBA} dB</strong></td></tr>
        <tr><th>에너지효율</th><td><span class="badge ${itemA.energy_grade === '1등급' ? 'badge-green' : 'badge-amber'}">${itemA.energy_grade}</span></td></tr>
        <tr><th>스마트제어</th><td>${itemA.wifi_control === '지원' ? 'Wi-Fi 지원' : 'Wi-Fi 미지원'}</td></tr>
        <tr><th>자동건조 / 공청</th><td>${itemA.auto_dry} / ${itemA.air_cleaning}</td></tr>
      </table>

      <!-- MarCom Deep Box -->
      <div class="product-marcom-box">
        <div class="marcom-header">
          <span>마케팅 커뮤니케이션 & 메시징</span>
          <span class="badge badge-cyan">${itemA.competitive_keyword || '핵심 차별화'}</span>
        </div>
        <div class="marcom-usp-item">
          <strong style="color: #93c5fd;">[USP 1] ${itemA.usp_1}:</strong> ${itemA.usp_1_description || '핵심 기술력 소구'}
        </div>
        <div class="marcom-usp-item">
          <strong style="color: #93c5fd;">[USP 2] ${itemA.usp_2}:</strong> ${itemA.usp_2_description || '편의 기능 소구'}
        </div>
        <div class="marcom-direction-quote">
          "${itemA.marketing_direction || '사용자 편의성과 냉방 본연의 성능을 균형 있게 강조'}"
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 0.4rem;">
          <span style="font-size: 0.75rem; color: var(--text-secondary);">
            <strong>타깃 고객:</strong> <span class="badge badge-purple">${itemA.target_customer || '스마트홈 관심 고객'}</span>
          </span>
          ${getBrandLinkHtml(itemA)}
        </div>
      </div>
    </div>

    <!-- Column Model B -->
    <div class="comp-column ${isOwnB ? 'own-col' : ''}">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span class="badge ${isOwnB ? 'badge-green' : 'badge-blue'}">${isOwnB ? '★ 자사 제품' : '비교 경쟁 모델'}</span>
        <span class="badge badge-purple">${itemB.product_type}</span>
      </div>
      <div>
        <h4 style="font-size: 1.15rem; font-weight: 800; color: ${BRAND_COLORS[itemB.brand] || '#38bdf8'};">[${itemB.brand}] ${itemB.model_name}</h4>
        <div style="font-size: 1.25rem; font-weight: 800; color: #34d399; margin-top: 0.25rem;">
          ${(itemB.price_num / 10000).toLocaleString()}만원 <span style="font-size: 0.75rem; color: var(--text-muted);">(${itemB.krw_per_w.toFixed(0)} 원/W)</span>
        </div>
      </div>

      <!-- Specs Table -->
      <table class="comparison-table">
        <tr><th>냉방용량</th><td><strong>${itemB.cooling_capacity_W} W</strong> (${itemB.capacity_pyeong}평)</td></tr>
        <tr><th>최저소음</th><td><strong>${itemB.min_noise_dBA} dB</strong></td></tr>
        <tr><th>에너지효율</th><td><span class="badge ${itemB.energy_grade === '1등급' ? 'badge-green' : 'badge-amber'}">${itemB.energy_grade}</span></td></tr>
        <tr><th>스마트제어</th><td>${itemB.wifi_control === '지원' ? 'Wi-Fi 지원' : 'Wi-Fi 미지원'}</td></tr>
        <tr><th>자동건조 / 공청</th><td>${itemB.auto_dry} / ${itemB.air_cleaning}</td></tr>
      </table>

      <!-- MarCom Deep Box -->
      <div class="product-marcom-box">
        <div class="marcom-header">
          <span>마케팅 커뮤니케이션 & 메시징</span>
          <span class="badge badge-cyan">${itemB.competitive_keyword || '핵심 차별화'}</span>
        </div>
        <div class="marcom-usp-item">
          <strong style="color: #93c5fd;">[USP 1] ${itemB.usp_1}:</strong> ${itemB.usp_1_description || '핵심 기술력 소구'}
        </div>
        <div class="marcom-usp-item">
          <strong style="color: #93c5fd;">[USP 2] ${itemB.usp_2}:</strong> ${itemB.usp_2_description || '편의 기능 소구'}
        </div>
        <div class="marcom-direction-quote">
          "${itemB.marketing_direction || '사용자 편의성과 냉방 본연의 성능을 균형 있게 강조'}"
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 0.4rem;">
          <span style="font-size: 0.75rem; color: var(--text-secondary);">
            <strong>타깃 고객:</strong> <span class="badge badge-purple">${itemB.target_customer || '스마트홈 관심 고객'}</span>
          </span>
          ${getBrandLinkHtml(itemB)}
        </div>
      </div>
    </div>
  `;
  if (window.lucide) lucide.createIcons();
}

// -------------------------------------------------------------
// 3. Tab 3: Marketing Intelligence & Data Verification Center
// -------------------------------------------------------------
function renderAuditCenter() {
  const container = document.getElementById('brand-marketing-strategy-grid');
  if (!container) return;

  const compDb = state.data.competitor_db;
  const brands = Array.from(new Set(compDb.map(d => d.brand))).filter(Boolean);

  const brandStats = brands.map(brand => {
    const list = compDb.filter(d => d.brand === brand);
    const count = list.length;
    const avgPrice = Math.round(list.reduce((a, b) => a + b.price_num, 0) / count / 10000);

    const uspCounts = {};
    list.forEach(d => {
      if (d.usp_1) uspCounts[d.usp_1] = (uspCounts[d.usp_1] || 0) + 1;
      if (d.usp_2) uspCounts[d.usp_2] = (uspCounts[d.usp_2] || 0) + 1;
    });
    const topUsps = Object.entries(uspCounts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(u => u[0]);

    const custCounts = {};
    list.forEach(d => { custCounts[d.target_customer] = (custCounts[d.target_customer] || 0) + 1; });
    const topCust = Object.entries(custCounts).sort((a, b) => b[1] - a[1])[0] || ['-', 0];

    const kwCounts = {};
    list.forEach(d => { kwCounts[d.competitive_keyword] = (kwCounts[d.competitive_keyword] || 0) + 1; });
    const topKw = Object.entries(kwCounts).sort((a, b) => b[1] - a[1])[0] || ['-', 0];

    return {
      brand,
      count,
      avgPrice,
      topUsps,
      topCust: topCust[0],
      topKw: topKw[0]
    };
  });

  container.innerHTML = brandStats.map(b => `
    <div class="card" style="padding: 1rem; background: var(--bg-input); border-color: rgba(75, 85, 99, 0.5);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <h4 style="font-size: 0.95rem; font-weight: 800; color: ${BRAND_COLORS[b.brand] || '#38bdf8'};">${b.brand}</h4>
        <span class="badge badge-blue">${b.count}개 모델 (평균 ${b.avgPrice}만)</span>
      </div>
      <div style="font-size: 0.775rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.35rem;">
        <div><strong>주력 소구 USP:</strong> <span class="badge badge-green">${b.topUsps.join(', ') || '-'}</span></div>
        <div><strong>핵심 타깃:</strong> <span class="badge badge-purple">${b.topCust}</span></div>
        <div><strong>경쟁 키워드:</strong> <span class="badge badge-amber">${b.topKw}</span></div>
      </div>
    </div>
  `).join('');
}

// -------------------------------------------------------------
// Utilities & CSV Export
// -------------------------------------------------------------
function exportToCsv() {
  const data = getFilteredCompetitors();
  if (!data.length) {
    alert('내보낼 데이터가 없습니다.');
    return;
  }

  const headers = ['product_id', 'brand', 'model_name', 'product_type', 'price_krw', 'cooling_capacity_W', 'capacity_pyeong', 'energy_grade', 'min_noise_dBA', 'wifi_control', 'usp_1', 'usp_1_description', 'usp_2', 'usp_2_description', 'marketing_direction', 'target_customer', 'product_page_url', 'data_confidence'];
  let csv = '\uFEFF' + headers.join(',') + '\n';

  data.forEach(row => {
    const values = headers.map(h => {
      let val = row[h] || '';
      val = val.toString().replace(/"/g, '""');
      return `"${val}"`;
    });
    csv += values.join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `AC_Verified_MarCom_DB_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
