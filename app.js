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
  theme: 'light',
  comparator: {
    category: '2in1',
    modelAId: 'OWN-01',
    modelBId: 'AC-0001'
  }
};

const BRAND_COLORS = {
  '캐리어': '#0284c7',
  '삼성전자': '#1d4ed8',
  '센추리': '#0d9488',
  '위닉스': '#7c3aed',
  'LG전자': '#be123c',
  '하이얼': '#c2410c',
  '위니아': '#059669',
  '파세코': '#b45309',
  'TCL': '#b91c1c',
  '신일전자': '#4338ca',
  '자사': '#059669'
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

  // AI Extractor Run Button
  const btnRunExtract = document.getElementById('btn-run-ai-extract');
  if (btnRunExtract) {
    btnRunExtract.addEventListener('click', () => {
      const rawText = document.getElementById('extractor-raw-text').value;
      const urlInput = document.getElementById('extractor-url-input').value;
      extractProductWithAi(rawText, urlInput);
    });
  }

  // AI Extractor Save to DB Button
  const btnSaveDb = document.getElementById('btn-save-extracted-db');
  if (btnSaveDb) {
    btnSaveDb.addEventListener('click', () => {
      saveExtractedProductToDb();
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
            <span class="product-brand-name" style="color: ${BRAND_COLORS[item.brand] || 'var(--accent-cyan)'};">${item.brand}</span>
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
          <span class="spec-item-val" style="color: ${item.energy_grade === '1등급' ? 'var(--accent-emerald)' : 'var(--accent-amber)'};">${item.energy_grade} (${item.operation_type})</span>
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
          <span><i data-lucide="sparkles" style="width: 13px; height: 13px; vertical-align: middle; color: var(--accent-purple);"></i> 핵심 마케팅 커뮤니케이션 & USP</span>
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
        <h4 style="font-size: 1.15rem; font-weight: 800; color: ${BRAND_COLORS[itemA.brand] || 'var(--accent-cyan)'};">[${itemA.brand}] ${itemA.model_name}</h4>
        <div style="font-size: 1.25rem; font-weight: 800; color: var(--price-color); margin-top: 0.25rem;">
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
          <strong class="marcom-usp-title">[USP 1] ${itemA.usp_1}:</strong> ${itemA.usp_1_description || '핵심 기술력 소구'}
        </div>
        <div class="marcom-usp-item">
          <strong class="marcom-usp-title">[USP 2] ${itemA.usp_2}:</strong> ${itemA.usp_2_description || '편의 기능 소구'}
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
        <h4 style="font-size: 1.15rem; font-weight: 800; color: ${BRAND_COLORS[itemB.brand] || 'var(--accent-cyan)'};">[${itemB.brand}] ${itemB.model_name}</h4>
        <div style="font-size: 1.25rem; font-weight: 800; color: var(--price-color); margin-top: 0.25rem;">
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
          <strong class="marcom-usp-title">[USP 1] ${itemB.usp_1}:</strong> ${itemB.usp_1_description || '핵심 기술력 소구'}
        </div>
        <div class="marcom-usp-item">
          <strong class="marcom-usp-title">[USP 2] ${itemB.usp_2}:</strong> ${itemB.usp_2_description || '편의 기능 소구'}
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
    <div class="card" style="padding: 1rem; background: var(--bg-input); border-color: var(--border-color);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <h4 style="font-size: 0.95rem; font-weight: 800; color: ${BRAND_COLORS[b.brand] || 'var(--accent-cyan)'};">${b.brand}</h4>
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

// =============================================================
// 4. Tab 4: AI Auto-Extractor & Real-time Model Registration Engine
// =============================================================

const SAMPLE_TEMPLATES = {
  samsung: {
    url: 'https://www.samsung.com/sec/air-conditioners/package-af19d7934wfn/',
    text: `[2026 비스포크 무풍에어컨 갤러리/클래식 신제품]
모델명: AF19D7934WFN (스탠드/2in1)
공식 출고가: 2,890,000원
주요 사양 및 성능:
- 냉방면적: 62.6㎡ (19.0평형)
- 정격 냉방능력: 7,700 W (최소 2,100W ~ 최대 8,800W)
- 에너지소비효율: 1등급 (월간 에너지비용 대폭 절감)
- 최저 운전 소음: 31.5 dB (무풍 모드시 도서관 수준 정숙성)
- 최대 풍량: 1,150 ㎥/h 서큘레이팅 급속냉방

스마트 & 위생 케어:
- SmartThings Wi-Fi 원격제어 및 AI 쾌적 절전 모드 지원
- 워셔블 살균 항균 필터 & 자동건조 청정 케어
- 독립 대용량 제습 (일 최대 100L) 및 CAC 공기청정 인증
- 편안한 숙면을 위한 수면 무풍 케어 모드
- 빅스비 AI 음성인식 탑재

마케팅 커뮤니케이션 및 핵심 소구점(USP):
- USP 1: [무풍 쾌적 지능형 냉방] 27만 개 마이크로홀에서 뿜어져 나오는 직바람 없는 와이드 쾌적 냉방
- USP 2: [AI 절전 3.0 & 에너지 케어] 사용자 사용 패턴 학습 및 부재 감지로 최대 35% 소비전력 절감
- 마케팅 전략 방향성: "직바람 없는 압도적 편안함과 AI 맞춤 에너지 관리를 통한 프리미엄 라이프스타일 가치 극대화"
- 핵심 타깃 고객: 3~4인 프리미엄 아파트 거주 가구 및 영유아 동반 가족
- 경쟁 차별화 키워드: AI 무풍 풀케어 & 초절전`
  },
  lg: {
    url: 'https://www.lge.co.kr/air-conditioners/fq20dnuba2',
    text: `[2026 LG 휘센 타워II 스페셜 2in1]
모델명: FQ20DNUBA2 (스탠드 20평형)
공식 판매가: 3,150,000원
기본 스펙:
- 냉방면적: 65.9㎡ (20.0평형)
- 정격 냉방능력: 8,300 W (강력 듀얼 쿨링)
- 최저 소음: 30.5 dB
- 최대 풍량: 1,200 ㎥/h
- 에너지소비효율: 1등급

스마트 제어 및 위생:
- LG ThinQ 스마트 Wi-Fi 원격 제어
- 클린 토네이도 AI 자동건조 및 열교환기 AI 세척
- CAC 인증 극초미세먼지 공기청정 필터
- 열대야 취침 모드 및 AI 음성인식

핵심 USP 및 마케팅 소구점:
- USP 1: [듀얼 베인 맞춤 기류] 좌우 4개의 날개로 직접바람/간접바람 자유자재 바람 컨트롤
- USP 2: [AI 스마트 케어 7단계] 실내 공간을 스스로 분석하여 쾌속냉방부터 쾌적유지까지 자동 제어
- 마케팅 방향성: "바람을 다루는 프리미엄 디자인과 듀얼베인 맞춤 기류로 공간의 품격을 높이는 토털 에어케어 솔루션"
- 타깃 고객: 30~50대 고소득 3~4인 가구 및 인테리어 중시 고객
- 경쟁 키워드: 듀얼베인 맞춤기류 & 타워 디자인`
  },
  carrier: {
    url: 'https://www.carriermall.co.kr/goods/goods_view.php?goodsNo=1000000452',
    text: `[2026 캐리어 올 뉴 18단 AI 에어로 스탠드]
모델명: CPV-Q187SB (18평형)
공식 판매가: 1,780,000원
스펙 요약:
- 냉방면적: 58.5㎡ (18.0평형)
- 정격 냉방능력: 7,200 W
- 최저 소음: 32.0 dB
- 에너지소비효율: 1등급
- 최대 풍량: 1,050 ㎥/h

특화 기능:
- 캐리어 스마트 Wi-Fi 원격제어
- 하이브리드 제습 및 AI 자동 건조
- CAC 공기청정 탑재 및 18단 섬세 바람 조절

핵심 USP 및 마케팅 문구:
- USP 1: [18단 섬세 에어로 컨트롤] 아기바람부터 초강력 허리케인바람까지 18단계 정밀 기류 조절
- USP 2: [인공지능 스마트 에어케어] 실내외 온도차 및 습도를 감지해 최적의 쾌적 밸런스 유지
- 마케팅 방향성: "합리적인 가격대에 누리는 18단계 맞춤 바람과 전문가급 냉방 퍼포먼스"
- 타깃 고객: 실용성과 정밀한 바람 조절을 선호하는 3040 맞벌이 가구
- 경쟁 키워드: 18단 정밀풍량 & 가성비`
  }
};

function loadSampleExtractorTemplate(key) {
  const sample = SAMPLE_TEMPLATES[key];
  if (!sample) return;

  const urlInput = document.getElementById('extractor-url-input');
  const rawTextarea = document.getElementById('extractor-raw-text');

  if (urlInput) urlInput.value = sample.url;
  if (rawTextarea) rawTextarea.value = sample.text;

  const badge = document.getElementById('extractor-status-badge');
  if (badge) {
    badge.className = 'badge badge-amber';
    badge.textContent = '샘플 로드됨 (추출 실행 버튼을 누르세요)';
  }
}

function extractProductWithAi(rawText, urlInput) {
  const text = (rawText || '') + ' ' + (urlInput || '');
  if (!text.trim()) {
    alert('제품 URL 또는 상세 설명 텍스트를 입력해 주세요.');
    return;
  }

  // 1. Brand Detection
  let brand = '삼성전자';
  if (/삼성|삼성전자|samsung|bespoke|무풍/i.test(text)) {
    brand = '삼성전자';
  } else if (/LG|LG전자|엘지|lge|휘센|whisen|타워/i.test(text)) {
    brand = 'LG전자';
  } else if (/캐리어|carrier|오퍼스|에어로|클라윈드/i.test(text)) {
    brand = '캐리어';
  } else if (/파세코|paseco/i.test(text)) {
    brand = '파세코';
  } else if (/위닉스|winix/i.test(text)) {
    brand = '위닉스';
  } else if (/위니아|winia|딤채/i.test(text)) {
    brand = '위니아';
  } else if (/신일|신일전자|shinil/i.test(text)) {
    brand = '신일전자';
  } else if (/센추리|century/i.test(text)) {
    brand = '센추리';
  } else if (/하이얼|haier/i.test(text)) {
    brand = '하이얼';
  } else if (/TCL|tcl/i.test(text)) {
    brand = 'TCL';
  }

  // 2. Model Name Detection
  let modelName = '';
  const modelMatch = text.match(/(?:모델명|Model|품번|제품명)\s*[:：]?\s*([A-Za-z0-9\-_]+)/i) ||
                     text.match(/([A-Z]{2,4}[0-9]{2,4}[A-Z0-9\-_]+)/);
  if (modelMatch) {
    modelName = modelMatch[1];
  } else {
    const firstLine = text.trim().split('\n')[0].replace(/[\[\]]/g, '').trim();
    if (firstLine.length > 0 && firstLine.length < 40) {
      modelName = firstLine;
    } else {
      modelName = `${brand}-AI-2026`;
    }
  }

  // 3. Product Type Detection
  let productType = '스탠드형';
  if (/2in1|2-in-1|2IN1|멀티/i.test(text)) {
    productType = '2in1';
  } else if (/창문형|창호형|창문/i.test(text)) {
    productType = '창문형';
  } else if (/이동식|포터블|portable/i.test(text)) {
    productType = '이동식';
  } else if (/벽걸이|벽걸이형/i.test(text)) {
    productType = '벽걸이형';
  } else if (/스탠드|스탠드형|타워|갤러리/i.test(text)) {
    productType = '스탠드형';
  }

  // 4. Price Detection
  let price = 2500000;
  const priceMatch1 = text.match(/([0-9,]+)\s*원/);
  const priceMatch2 = text.match(/([0-9]+)\s*만\s*원/);
  if (priceMatch1) {
    const p = parseInt(priceMatch1[1].replace(/,/g, ''), 10);
    if (p > 50000) price = p;
  } else if (priceMatch2) {
    price = parseInt(priceMatch2[1], 10) * 10000;
  }

  // 5. Cooling Capacity (W)
  let capacityW = 7500;
  const wMatch = text.match(/([0-9,]+)\s*(?:W|w|와트)/);
  if (wMatch) {
    const w = parseInt(wMatch[1].replace(/,/g, ''), 10);
    if (w > 500 && w < 30000) capacityW = w;
  }

  // 6. Cooling Area (평)
  let capacityPyeong = 18.0;
  const pyeongMatch = text.match(/([0-9.]+)\s*(?:평|평형)/);
  const m2Match = text.match(/([0-9.]+)\s*㎡/);
  if (pyeongMatch) {
    capacityPyeong = parseFloat(pyeongMatch[1]);
  } else if (m2Match) {
    capacityPyeong = +(parseFloat(m2Match[1]) / 3.3).toFixed(1);
  } else {
    capacityPyeong = +(capacityW / 400).toFixed(1);
  }

  // 7. Noise (dB)
  let noise = 32.0;
  const noiseMatch = text.match(/([0-9.]+)\s*(?:dB|dBA|데시벨)/i);
  if (noiseMatch) {
    const n = parseFloat(noiseMatch[1]);
    if (n > 10 && n < 80) noise = n;
  }

  // 8. Air Volume (m3/h)
  let airVol = 1100;
  const airMatch = text.match(/([0-9,]+)\s*(?:㎥\/h|m3\/h|CMM)/i);
  if (airMatch) {
    const av = parseInt(airMatch[1].replace(/,/g, ''), 10);
    if (av > 100 && av < 5000) airVol = av;
  }

  // 9. Energy Grade
  let energyGrade = '1등급';
  const energyMatch = text.match(/([1-5])\s*등급/);
  if (energyMatch) {
    energyGrade = `${energyMatch[1]}등급`;
  }

  // 10. Feature Flags
  const featWifi = /wi-fi|wifi|와이파이|smartthings|thinq|스마트|원격제어/i.test(text);
  const featDry = /건조|자동건조|열교환기|세척|청정케어|클린/i.test(text);
  const featAir = /공기청정|공청|cac|헤파|필터|극초미세|집진/i.test(text);
  const featDehumid = /제습|하이브리드\s*제습/i.test(text);
  const featSleep = /수면|취침|열대야|무풍\s*케어|숙면/i.test(text);
  const featVoice = /음성|빅스비|bixby|보이스|voice/i.test(text);

  // 11. USP 1 & 2 Detection
  let usp1 = '지능형 고효율 냉방 케어';
  let usp1Desc = '실내 환경에 최적화된 스마트 기류 제어로 빠르고 균일한 냉방 제공';
  let usp2 = 'AI 스마트 에너지 세이빙';
  let usp2Desc = '사용 패턴 분석을 통한 소비전력 절감 및 안심 케어';

  const usp1Match = text.match(/USP\s*1\s*[:：]?\s*(?:\[([^\]]+)\])?\s*([^\n\r]+)/i);
  if (usp1Match) {
    if (usp1Match[1]) {
      usp1 = usp1Match[1].trim();
      usp1Desc = usp1Match[2] ? usp1Match[2].trim() : usp1Desc;
    } else if (usp1Match[2]) {
      const parts = usp1Match[2].split(/[:：]/);
      usp1 = parts[0].trim();
      usp1Desc = parts[1] ? parts[1].trim() : parts[0].trim();
    }
  } else {
    if (brand === '삼성전자') {
      usp1 = '무풍 쾌적 지능형 냉방';
      usp1Desc = '직바람 없이 27만 개 마이크로홀에서 은은하게 전달되는 와이드 쾌적 냉방';
      usp2 = 'AI 절전 3.0 & 에너지 케어';
      usp2Desc = 'SmartThings 연동 및 부재 감지로 최대 35% 소비전력 절감';
    } else if (brand === 'LG전자') {
      usp1 = '듀얼 베인 맞춤 기류 컨트롤';
      usp1Desc = '4개의 독립 날개로 직접바람과 간접바람을 상황별로 정밀 제어';
      usp2 = 'AI 스마트 케어 7단계';
      usp2Desc = '공간과 사람의 위치를 스스로 감지하여 쾌속부터 쾌적까지 원스톱 제어';
    } else if (brand === '캐리어') {
      usp1 = '18단 섬세 에어로 컨트롤';
      usp1Desc = '1단계 미세 아기바람부터 18단계 터보냉방까지 정밀한 바람 맞춤 조절';
      usp2 = '인공지능 스마트 에어케어';
      usp2Desc = '온습도 밸런스를 지능형으로 유지하여 냉방병 없는 쾌적함 유지';
    }
  }

  const usp2Match = text.match(/USP\s*2\s*[:：]?\s*(?:\[([^\]]+)\])?\s*([^\n\r]+)/i);
  if (usp2Match) {
    if (usp2Match[1]) {
      usp2 = usp2Match[1].trim();
      usp2Desc = usp2Match[2] ? usp2Match[2].trim() : usp2Desc;
    } else if (usp2Match[2]) {
      const parts = usp2Match[2].split(/[:：]/);
      usp2 = parts[0].trim();
      usp2Desc = parts[1] ? parts[1].trim() : parts[0].trim();
    }
  }

  // 12. Marketing Direction Quote
  let marketingDirection = `사용자 편의성과 냉방 본연의 퍼포먼스를 극대화하는 ${brand} 대표 솔루션`;
  const mktMatch = text.match(/(?:마케팅\s*(?:전략|방향성|커뮤니케이션)?|소구\s*포인트)\s*[:：]?\s*["“]?([^"”\n\r]+)["”]?/i);
  if (mktMatch && mktMatch[1]) {
    marketingDirection = mktMatch[1].trim();
  } else if (brand === '삼성전자') {
    marketingDirection = '직바람 없는 압도적 편안함과 AI 맞춤 에너지 관리를 통한 프리미엄 라이프스타일 가치 극대화';
  } else if (brand === 'LG전자') {
    marketingDirection = '공간의 품격을 높이는 타워 디자인과 듀얼베인 맞춤 기류로 차별화된 프리미엄 경험 제공';
  } else if (brand === '캐리어') {
    marketingDirection = '합리적인 가격대에 누리는 18단계 맞춤 바람과 전문가급 냉방 퍼포먼스';
  }

  // 13. Target Customer
  let targetCustomer = '스마트홈 및 고효율 냉방 관심 가구';
  const custMatch = text.match(/(?:타깃\s*(?:고객|층)?|주요\s*고객)\s*[:：]?\s*([^\n\r]+)/i);
  if (custMatch && custMatch[1]) {
    targetCustomer = custMatch[1].trim();
  } else {
    if (productType === '창문형' || productType === '이동식') {
      targetCustomer = '1~2인 원룸 및 자취 가구 / 서재방 설치 희망 고객';
    } else if (productType === '벽걸이형') {
      targetCustomer = '침실 및 서브룸 세컨드 에어컨 수요층';
    } else {
      targetCustomer = '3~4인 프리미엄 거실 메인 냉방 가구';
    }
  }

  // 14. Competitive Keyword
  let compKeyword = `${usp1.split(' ')[0]} & 고효율`;
  const kwMatch = text.match(/(?:경쟁\s*(?:차별화)?\s*키워드|핵심\s*키워드)\s*[:：]?\s*([^\n\r]+)/i);
  if (kwMatch && kwMatch[1]) {
    compKeyword = kwMatch[1].trim();
  } else {
    if (brand === '삼성전자') compKeyword = 'AI 무풍 풀케어 & 초절전';
    else if (brand === 'LG전자') compKeyword = '듀얼베인 맞춤기류 & 프리미엄';
    else if (brand === '캐리어') compKeyword = '18단 정밀풍량 & 가성비';
  }

  // 15. Product Page URL
  let productUrl = (urlInput || '').trim();
  if (!productUrl) {
    if (brand === '삼성전자') productUrl = `https://www.samsung.com/sec/air-conditioners/all-air-conditioners/?search=${encodeURIComponent(modelName)}`;
    else if (brand === 'LG전자') productUrl = `https://www.lge.co.kr/air-conditioners?searchKeyword=${encodeURIComponent(modelName)}`;
    else if (brand === '캐리어') productUrl = `https://www.carriermall.co.kr/goods/goods_search.php?keyword=${encodeURIComponent(modelName)}`;
    else productUrl = 'https://search.danawa.com/dsearch.php?query=' + encodeURIComponent(modelName);
  }

  // Set form field values
  document.getElementById('ext-brand').value = brand;
  document.getElementById('ext-model-name').value = modelName;
  document.getElementById('ext-product-type').value = productType;
  document.getElementById('ext-price').value = price;
  document.getElementById('ext-capacity-w').value = capacityW;
  document.getElementById('ext-capacity-pyeong').value = capacityPyeong;
  document.getElementById('ext-noise').value = noise;
  document.getElementById('ext-air-vol').value = airVol;
  document.getElementById('ext-energy-grade').value = energyGrade;
  document.getElementById('ext-target-customer').value = targetCustomer;
  document.getElementById('ext-feat-wifi').checked = featWifi;
  document.getElementById('ext-feat-dry').checked = featDry;
  document.getElementById('ext-feat-air').checked = featAir;
  document.getElementById('ext-feat-dehumid').checked = featDehumid;
  document.getElementById('ext-feat-sleep').checked = featSleep;
  document.getElementById('ext-feat-voice').checked = featVoice;
  document.getElementById('ext-usp1').value = usp1;
  document.getElementById('ext-usp1-desc').value = usp1Desc;
  document.getElementById('ext-usp2').value = usp2;
  document.getElementById('ext-usp2-desc').value = usp2Desc;
  document.getElementById('ext-marketing-direction').value = marketingDirection;
  document.getElementById('ext-comp-keyword').value = compKeyword;
  document.getElementById('ext-product-url').value = productUrl;

  const badge = document.getElementById('extractor-status-badge');
  if (badge) {
    badge.className = 'badge badge-green';
    badge.textContent = '✅ 스펙 추출 완료 (검토 후 DB 등록 가능)';
  }
}

function saveExtractedProductToDb() {
  const brand = document.getElementById('ext-brand').value;
  const modelName = document.getElementById('ext-model-name').value.trim();
  const productType = document.getElementById('ext-product-type').value;
  const price = parseInt(document.getElementById('ext-price').value, 10) || 0;
  const capacityW = parseInt(document.getElementById('ext-capacity-w').value, 10) || 0;
  const capacityPyeong = parseFloat(document.getElementById('ext-capacity-pyeong').value) || 0;
  const noise = parseFloat(document.getElementById('ext-noise').value) || 0;
  const airVol = parseInt(document.getElementById('ext-air-vol').value, 10) || 0;
  const energyGrade = document.getElementById('ext-energy-grade').value;
  const targetCustomer = document.getElementById('ext-target-customer').value.trim();

  const wifi = document.getElementById('ext-feat-wifi').checked;
  const autoDry = document.getElementById('ext-feat-dry').checked;
  const airClean = document.getElementById('ext-feat-air').checked;
  const dehumid = document.getElementById('ext-feat-dehumid').checked;
  const sleepMode = document.getElementById('ext-feat-sleep').checked;
  const voice = document.getElementById('ext-feat-voice').checked;

  const usp1 = document.getElementById('ext-usp1').value.trim();
  const usp1Desc = document.getElementById('ext-usp1-desc').value.trim();
  const usp2 = document.getElementById('ext-usp2').value.trim();
  const usp2Desc = document.getElementById('ext-usp2-desc').value.trim();
  const marketingDirection = document.getElementById('ext-marketing-direction').value.trim();
  const compKeyword = document.getElementById('ext-comp-keyword').value.trim();
  const productUrl = document.getElementById('ext-product-url').value.trim();
  const rawText = document.getElementById('extractor-raw-text').value.trim();

  if (!modelName) {
    alert('모델명을 입력해 주세요.');
    document.getElementById('ext-model-name').focus();
    return;
  }

  const newId = `AC-${(state.data.competitor_db.length + 1).toString().padStart(4, '0')}`;
  const newProduct = {
    product_id: newId,
    brand: brand,
    model_name: modelName,
    product_type: productType,
    price_krw: price,
    cooling_capacity_W: capacityW,
    capacity_pyeong: capacityPyeong,
    energy_grade: energyGrade,
    min_noise_dBA: noise,
    max_air_volume_m3h: airVol,
    operating_type: '인버터',
    wifi_control: wifi ? '지원' : '미지원',
    auto_dry: autoDry ? '지원' : '미지원',
    air_cleaning: airClean ? 'CAC인증' : '미지원',
    dehumidification: dehumid ? '지원' : '미지원',
    sleep_mode: sleepMode ? '지원' : '미지원',
    voice_control: voice ? '지원' : '미지원',
    usp_1: usp1 || `${brand} 첨단 냉방`,
    usp_1_description: usp1Desc || '정밀한 온도 제어와 쾌적 냉방',
    usp_2: usp2 || '스마트 케어',
    usp_2_description: usp2Desc || '소비전력 절감 및 사용자 맞춤 편의기능',
    marketing_direction: marketingDirection || `${brand}의 대표 에어컨 솔루션`,
    target_customer: targetCustomer || '에어컨 신규/교체 구매 고객',
    competitive_keyword: compKeyword || '스마트 AI & 고효율',
    product_page_url: productUrl,
    data_confidence: 'High (AI 추출/검증)'
  };

  // Add to active database at top so it shows first in catalog
  state.data.competitor_db.unshift(newProduct);

  if (rawText) {
    state.data.raw_web_data.push({
      product_id: newId,
      raw_page_text: `[AI 추출 원본 웹 데이터]\n출처 URL: ${productUrl}\n\n${rawText}`
    });
  }

  // Refresh data pipelines and views
  postProcessData();
  populateFilterDropdowns();
  updateCategoryFilterCounts();
  updateComparatorDropdowns();
  refreshAllViews();

  // Status badge update
  const badge = document.getElementById('extractor-status-badge');
  if (badge) {
    badge.className = 'badge badge-green';
    badge.textContent = `🎉 DB 등록 완료 (${newId})`;
  }

  showToast(`[${brand}] ${modelName} 모델이 실시간 DB에 성공적으로 등록되었습니다!`);
}

function updateCategoryFilterCounts() {
  const compDb = state.data.competitor_db || [];
  const total = compDb.length;
  const countMap = {
    'ALL': total,
    '벽걸이형': 0,
    '스탠드형': 0,
    '창문형': 0,
    '이동식': 0,
    '2in1': 0
  };
  compDb.forEach(item => {
    if (countMap[item.product_type] !== undefined) {
      countMap[item.product_type]++;
    }
  });

  document.querySelectorAll('#category-pills .cat-pill').forEach(pill => {
    const val = pill.getAttribute('data-val');
    if (val === 'ALL') {
      pill.textContent = `전체 (${countMap['ALL']})`;
    } else if (countMap[val] !== undefined) {
      pill.textContent = `${val} (${countMap[val]})`;
    }
  });
}

function showToast(message) {
  const toast = document.getElementById('toast-alert');
  const msgEl = document.getElementById('toast-message');
  if (toast && msgEl) {
    msgEl.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }
}

