/* =====================================================
   CARDIY · Customer App JS
   SPA-style view switching. Reuses helpers from main.js
   when loaded together; otherwise self-contained.
   ===================================================== */
(function () {
  'use strict';

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const formatVN = (n) => Math.round(n).toLocaleString('vi-VN');
  const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function paintIcons() { if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.75 } }); }
  document.addEventListener('DOMContentLoaded', paintIcons);
  window.addEventListener('load', paintIcons);

  // ---------- Toast ----------
  let toastHost;
  function ensureToastHost() {
    if (!toastHost) {
      toastHost = document.createElement('div');
      toastHost.className = 'toast-host';
      document.body.appendChild(toastHost);
    }
    return toastHost;
  }
  function toast(msg, iconName) {
    const host = ensureToastHost();
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = (iconName ? `<i data-lucide="${iconName}" class="ic" style="width:18px;height:18px"></i>` : '') + escapeHTML(msg);
    host.appendChild(el);
    paintIcons();
    setTimeout(() => { el.classList.add('is-leaving'); setTimeout(() => el.remove(), 260); }, 3200);
  }

  // ---------- Modal ----------
  function openModal(opts) {
    const root = document.createElement('div');
    root.className = 'modal is-open';
    root.innerHTML = `
      <div class="modal__box" role="dialog" aria-modal="true">
        <button class="modal__close" aria-label="Đóng">
          <i data-lucide="x" class="ic" style="width:18px;height:18px"></i>
        </button>
        ${opts.icon ? `<div class="modal__icon"><i data-lucide="${opts.icon}" style="width:28px;height:28px"></i></div>` : ''}
        <h3>${escapeHTML(opts.title)}</h3>
        <p>${opts.html || escapeHTML(opts.body || '')}</p>
        ${opts.code ? `<div class="modal__code">${escapeHTML(opts.code)}</div>` : ''}
        <div class="modal__row">
          ${(opts.actions || [{ label: 'Đóng', variant: 'outline' }]).map((a, i) =>
            `<button class="btn btn--${a.variant || 'outline'}" data-action="${i}">${escapeHTML(a.label)}${a.icon ? ` <i data-lucide="${a.icon}" class="ic"></i>` : ''}</button>`
          ).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(root);
    paintIcons();
    const close = () => root.remove();
    root.addEventListener('click', (e) => {
      if (e.target === root) close();
      const btn = e.target.closest('[data-action]');
      if (btn) {
        const idx = +btn.dataset.action;
        const cb = (opts.actions || [])[idx]?.onClick;
        if (cb) cb();
        close();
      }
      if (e.target.closest('.modal__close')) close();
    });
    document.addEventListener('keydown', function onEsc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onEsc); }
    });
    return close;
  }

  // ============================================================
  // View routing
  // ============================================================
  const views = {
    overview: $('#view-overview'),
    cars: $('#view-cars'),
    book: $('#view-book'),
    history: $('#view-history'),
    ai: $('#view-ai'),
    settings: $('#view-settings'),
  };
  const titles = {
    overview: { t: 'Tổng quan', s: 'Tóm tắt nhanh tình trạng xe của bạn' },
    cars: { t: 'Xe của tôi', s: 'Quản lý tất cả xe đang sử dụng' },
    book: { t: 'Đặt lịch dịch vụ', s: 'KTV tới tận nơi trong 30 phút' },
    history: { t: 'Lịch sử bảo dưỡng', s: 'Tất cả lượt dịch vụ + hoá đơn VAT' },
    ai: { t: 'Trợ lý AI', s: 'Hỏi gì cũng được — mình hiểu xe bạn' },
    settings: { t: 'Cài đặt', s: 'Thông tin tài khoản & thông báo' },
  };

  function setView(name) {
    Object.entries(views).forEach(([k, el]) => {
      if (el) el.classList.toggle('is-active', k === name);
    });
    $$('.aside__nav button[data-view]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.view === name);
    });
    const meta = titles[name] || titles.overview;
    if ($('#topbar-title')) $('#topbar-title').textContent = meta.t;
    if ($('#topbar-sub')) $('#topbar-sub').textContent = meta.s;
    // close mobile drawer
    $('#aside')?.classList.remove('is-open');
    $('#aside-scrim')?.classList.remove('is-open');
    if (location.hash.slice(1) !== name) {
      history.replaceState(null, '', '#' + name);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  $$('.aside__nav button[data-view]').forEach(btn => {
    btn.addEventListener('click', () => setView(btn.dataset.view));
  });

  // Anywhere on page: data-goto="book"
  document.addEventListener('click', (e) => {
    const goto = e.target.closest('[data-goto]');
    if (goto) { e.preventDefault(); setView(goto.dataset.goto); }
  });

  // Initial view from hash
  const initial = location.hash.slice(1);
  if (initial && views[initial]) setView(initial);
  else setView('overview');

  // ---------- Mobile drawer ----------
  $('#topbar-burger')?.addEventListener('click', () => {
    $('#aside').classList.toggle('is-open');
    $('#aside-scrim').classList.toggle('is-open');
  });
  $('#aside-scrim')?.addEventListener('click', () => {
    $('#aside').classList.remove('is-open');
    $('#aside-scrim').classList.remove('is-open');
  });

  // ---------- Notifications ----------
  $('#notif-btn')?.addEventListener('click', () => {
    openModal({
      icon: 'bell',
      title: 'Thông báo (3)',
      html: `<strong>KTV đang đến</strong> · Nguyễn Văn Hùng còn 8 phút.<br/><br/>
             <strong>Bảo dưỡng 50.000 km</strong> · gợi ý đặt thứ Bảy 8h30.<br/><br/>
             <strong>Hoá đơn tháng 5</strong> đã được gửi qua email.`,
      actions: [{ label: 'Đánh dấu đã đọc', variant: 'primary', icon: 'check', onClick: () => {
        $('#notif-btn .dot')?.remove();
        toast('Đã đánh dấu tất cả thông báo là đã đọc', 'check-circle-2');
      }}, { label: 'Đóng', variant: 'outline' }],
    });
  });

  // ============================================================
  // BOOKING form (inside app)
  // ============================================================
  const checks = $$('#booking-app-form input[type=checkbox]');
  const totalEl = $('#ba-total');
  const listEl = $('#ba-list');
  const etaEl = $('#ba-eta');
  const carSel = $('#ba-car');
  const labels = {
    '450000': 'Thay dầu + lọc',
    '680000': 'Má phanh',
    '350000': 'Cân thước lái',
    '550000': 'Vệ sinh điều hoà',
    '1850000': 'Bình ắc-quy',
    '1450000': 'Gói bảo dưỡng 10k',
    '250000': 'Cảm biến + đèn báo',
    '2400000': 'Đánh bóng + ceramic',
  };
  function recalcBooking() {
    if (!totalEl || !carSel) return;
    const mult = parseFloat(carSel.options[carSel.selectedIndex]?.dataset.mult || '1');
    let total = 0, time = 0;
    const items = [];
    checks.forEach(c => {
      if (c.checked) {
        const p = parseInt(c.dataset.price, 10);
        const t = parseInt(c.dataset.time || '45', 10);
        const adj = Math.round(p * mult);
        total += adj; time += t;
        items.push({ name: labels[c.dataset.price], price: adj });
      }
    });
    listEl.innerHTML = items.length === 0
      ? '<li style="opacity:0.7"><span>Chưa chọn dịch vụ</span><span class="v">—</span></li>'
      : items.map(i => `<li><span>${escapeHTML(i.name)}</span><span class="v">${formatVN(i.price)} ₫</span></li>`).join('');
    totalEl.textContent = formatVN(total);
    if (etaEl) etaEl.textContent = time > 0 ? `${time} phút` : '—';
  }
  checks.forEach(c => c.addEventListener('change', recalcBooking));
  if (carSel) carSel.addEventListener('change', recalcBooking);
  recalcBooking();

  $('#booking-app-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    let count = 0; checks.forEach(c => { if (c.checked) count++; });
    if (count === 0) { toast('Vui lòng chọn ít nhất 1 dịch vụ', 'alert-circle'); return; }
    const code = 'CARDIY-' + Math.random().toString(36).slice(2, 7).toUpperCase();
    openModal({
      icon: 'check-circle-2',
      title: 'Đặt lịch thành công!',
      html: 'KTV sẽ liên hệ xác nhận trong <strong>15 phút</strong>. Mã đặt lịch:',
      code,
      actions: [
        { label: 'Xem trên Tổng quan', variant: 'primary', icon: 'arrow-right', onClick: () => setView('overview') },
        { label: 'Đặt lịch khác', variant: 'outline' }
      ],
    });
  });

  // ============================================================
  // Quick actions (overview)
  // ============================================================
  document.addEventListener('click', (e) => {
    const q = e.target.closest('[data-quick]');
    if (!q) return;
    const action = q.dataset.quick;
    if (action === 'book') setView('book');
    else if (action === 'history') setView('history');
    else if (action === 'ai') setView('ai');
    else if (action === 'invoice') {
      toast('Đang tải hoá đơn PDF…', 'file-text');
      setTimeout(() => toast('Đã tải hoá-don-T5.pdf', 'check-circle-2'), 800);
    } else if (action === 'add-car') {
      openModal({
        icon: 'plus-circle',
        title: 'Thêm xe mới',
        body: 'Quét tem đăng kiểm hoặc nhập biển số để thêm xe vào CARDIY. Mình sẽ tự động lấy thông tin từ hãng.',
        actions: [
          { label: 'Quét bằng camera', variant: 'primary', icon: 'camera', onClick: () => toast('Tính năng quét tem sắp ra mắt', 'info') },
          { label: 'Nhập thủ công', variant: 'outline', onClick: () => toast('Form thêm xe sẽ mở trong app v2.0', 'info') }
        ],
      });
    } else if (action === 'call-ktv') {
      openModal({
        icon: 'phone',
        title: 'Gọi KTV',
        body: 'Bạn muốn liên hệ Nguyễn Văn Hùng — KTV đang trên đường tới?',
        actions: [
          { label: 'Gọi ngay', variant: 'primary', icon: 'phone', onClick: () => { window.location.href = 'tel:+84901234567'; } },
          { label: 'Nhắn tin', variant: 'outline', icon: 'message-square', onClick: () => toast('Mở khung chat với KTV…', 'message-circle') }
        ],
      });
    } else if (action === 'cancel-booking') {
      openModal({
        icon: 'alert-triangle',
        title: 'Huỷ lịch hẹn?',
        body: 'KTV đang trên đường tới (còn 8 phút). Huỷ sau giờ này có thể bị phí 50.000 ₫.',
        actions: [
          { label: 'Vẫn huỷ', variant: 'outline', onClick: () => toast('Đã huỷ lịch hẹn.', 'x-circle') },
          { label: 'Giữ lịch', variant: 'primary' }
        ],
      });
    }
  });

  // ---------- Car row actions ----------
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-car-action]');
    if (!btn) return;
    const action = btn.dataset.carAction;
    const plate = btn.closest('[data-plate]')?.dataset.plate || '';
    if (action === 'book-for') {
      toast(`Đặt lịch cho ${plate}`, 'calendar-plus');
      setView('book');
    } else if (action === 'detail') {
      openModal({
        icon: 'car',
        title: plate,
        html: 'Trang chi tiết xe đang được hoàn thiện — sẽ có lịch sử thay phụ tùng, ước tính giá bán lại, và export PDF.',
        actions: [{ label: 'Đóng', variant: 'outline' }],
      });
    }
  });

  // ---------- Invoice download ----------
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-invoice]');
    if (!btn) return;
    const id = btn.dataset.invoice;
    toast(`Đang tải hoá đơn ${id}…`, 'file-text');
    setTimeout(() => toast(`Đã tải hoa-don-${id}.pdf`, 'check-circle-2'), 800);
  });

  // ============================================================
  // AI Chat (mirror landing version)
  // ============================================================
  const chatBody = $('#chat-body');
  const chatForm = $('#chat-form');
  const chatInput = $('#chat-input');
  const chatSend = $('#chat-send');
  const chatSuggest = $('#chat-suggest');

  function localBotReply(text) {
    const t = text.toLowerCase();
    if (/dầu|nhớt/.test(t)) return `Thay <strong>dầu máy + lọc dầu</strong> nên làm mỗi 5.000–7.000 km hoặc 6 tháng. Vios của bạn đang ở <strong>42.180 km</strong> — vẫn còn 1.500 km nữa mới tới mốc. Mình sẽ nhắc bạn nhé.`;
    if (/phanh|kẹt|kêu/.test(t)) return `Tiếng kẹt thường do <strong>má phanh</strong> hoặc <strong>rotuyn lái</strong>. Mình đề xuất:<ul><li>Kiểm tra (~200k)</li><li>Thay nếu cần (680k)</li></ul>Đặt lịch không?`;
    if (/điều hoà|mát|nóng/.test(t)) return `Vệ sinh điều hoà: <strong>550.000 ₫</strong> — bao gồm hút bụi dàn lạnh, thay lọc, nạp gas. ~75 phút.`;
    if (/giá|báo giá|bao nhiêu/.test(t)) return `Vài giá phổ biến cho Vios:<ul><li>Thay dầu: <strong>450k</strong></li><li>Má phanh: <strong>680k</strong></li><li>Vệ sinh điều hoà: <strong>550k</strong></li></ul>Vào tab <em>Đặt lịch</em> để tính chính xác.`;
    if (/đặt lịch|booking/.test(t)) return `Vào tab <strong>Đặt lịch</strong> ở sidebar — chọn xe + dịch vụ, mình báo giá ngay. KTV tới trong 30 phút giờ hành chính.`;
    if (/lịch sử|history/.test(t)) return `Tab <strong>Lịch sử bảo dưỡng</strong> có toàn bộ 5 lượt dịch vụ + hoá đơn VAT. Bạn cũng có thể export PDF nguyên cuốn để mang đi bán xe (tăng giá 10–15%).`;
    if (/bảo hành|warranty/.test(t)) return `Mọi dịch vụ bảo hành <strong>tối thiểu 6 tháng</strong>. Phụ tùng chính: <strong>12 tháng</strong>. Có vấn đề trong thời gian này — CARDIY sửa miễn phí.`;
    return `Mình là trợ lý AI của CARDIY. Có thể giúp bạn:<ul><li>Báo giá theo dòng xe</li><li>Tư vấn khi xe có triệu chứng lạ</li><li>Đặt lịch trong cuộc trò chuyện</li><li>Tra cứu lịch sử dịch vụ</li></ul>Bạn cứ hỏi tự nhiên nhé!`;
  }
  function appendMsg(role, html) {
    if (!chatBody) return null;
    const d = document.createElement('div');
    d.className = 'msg ' + role; d.innerHTML = html;
    chatBody.appendChild(d); chatBody.scrollTop = chatBody.scrollHeight;
    return d;
  }
  function appendTyping() {
    const d = appendMsg('bot', '<span class="typing"><span></span><span></span><span></span></span>');
    if (d) d.style.maxWidth = '120px';
    return d;
  }
  async function askAI(text) {
    if (!chatBody) return;
    appendMsg('user', escapeHTML(text));
    const tn = appendTyping();
    chatSend.disabled = true;
    let answer;
    try {
      if (typeof window.claude !== 'undefined' && typeof window.claude.complete === 'function') {
        const prompt = `Bạn là trợ lý AI của CARDIY — nền tảng sửa xe tận nơi tại Việt Nam. Đây là bối cảnh khách hàng: tên Nguyễn Quốc Hùng, có 1 xe Toyota Vios 1.5G 2021 biển 51K-238.79, hiện 42.180 km, sức khoẻ xe 87%, mốc bảo dưỡng tiếp 50.000 km (~ 15/06). Trả lời ngắn gọn (2-4 câu), thân thiện, bằng tiếng Việt. Dùng "bạn". Có thể dùng <strong>, <ul><li>. Không emoji. Người dùng hỏi: "${text}"`;
        answer = await window.claude.complete(prompt);
      } else {
        await new Promise(r => setTimeout(r, 800 + Math.random() * 500));
        answer = localBotReply(text);
      }
    } catch (e) { answer = localBotReply(text); }
    tn?.remove();
    appendMsg('bot', answer);
    chatSend.disabled = false;
    chatInput?.focus();
  }
  chatForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const t = chatInput.value.trim();
    if (!t) return;
    chatInput.value = '';
    askAI(t);
  });
  chatSuggest?.addEventListener('click', (e) => {
    const c = e.target.closest('.chip');
    if (c) askAI(c.textContent.trim());
  });

  // ============================================================
  // Settings
  // ============================================================

  // Load profile data into settings form
  async function loadProfileSettings() {
    if (!window.firebaseProfile) return;
    try {
      const result = await window.firebaseProfile.getUserProfile();
      if (result.success && result.data) {
        const d = result.data;
        const el = (id) => document.getElementById(id);
        if (el('profile-fullname')) el('profile-fullname').value = d.fullName || '';
        if (el('profile-phone')) el('profile-phone').value = d.phone || '';
        if (el('profile-email')) el('profile-email').value = d.email || '';
        if (el('profile-region')) el('profile-region').value = d.region || '';
        if (el('profile-address')) el('profile-address').value = d.address || '';
        // Update display name in profile header
        if (el('profile-display-name')) el('profile-display-name').textContent = d.fullName || d.email || '';
        // Update avatar initials
        if (el('profile-avatar-initials')) {
          const name = d.fullName || d.email || 'U';
          const parts = name.trim().split(' ');
          const initials = parts.length >= 2
            ? parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase()
            : name.substring(0, 2).toUpperCase();
          el('profile-avatar-initials').textContent = initials;
        }
      }
    } catch (e) { console.error('loadProfileSettings error:', e); }
  }

  // Load when settings view is shown
  const origSetView = typeof setView === 'function' ? setView : null;
  document.addEventListener('authReady', () => {
    // Load profile after auth is ready
    if (location.hash === '#settings') loadProfileSettings();
  });
  // Also load when navigating to settings tab
  $$('.aside__nav button[data-view="settings"]').forEach(btn => {
    btn.addEventListener('click', () => {
      setTimeout(loadProfileSettings, 100);
    });
  });
  // Load immediately if already on settings
  if (location.hash === '#settings') {
    const tryLoad = () => {
      if (window.firebaseProfile) loadProfileSettings();
      else setTimeout(tryLoad, 200);
    };
    setTimeout(tryLoad, 300);
  }

  $('#settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!window.firebaseProfile) {
      toast('Không thể lưu: chưa kết nối Firebase.', 'alert-circle');
      return;
    }
    const btn = e.target.querySelector('[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Đang lưu...'; }
    const profileData = {
      fullName: document.getElementById('profile-fullname')?.value?.trim() || '',
      phone: document.getElementById('profile-phone')?.value?.trim() || '',
      email: document.getElementById('profile-email')?.value?.trim() || '',
      region: document.getElementById('profile-region')?.value?.trim() || '',
      address: document.getElementById('profile-address')?.value?.trim() || '',
    };
    const result = await window.firebaseProfile.updateUserProfile(profileData);
    if (btn) { btn.disabled = false; btn.innerHTML = 'Lưu thay đổi <i data-lucide="check" class="ic"></i>'; if (typeof lucide !== 'undefined') lucide.createIcons(); }
    if (result.success) {
      toast('Đã lưu thay đổi thành công!', 'check-circle-2');
      // Update display name in header
      const nameEl = document.getElementById('profile-display-name');
      if (nameEl && profileData.fullName) nameEl.textContent = profileData.fullName;
    } else {
      toast('Lỗi lưu: ' + (result.error || 'Vui lòng thử lại.'), 'alert-circle');
    }
  });

  })();
