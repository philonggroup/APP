/* =====================================================
   CARDIY · Main JS
   All interactivity: nav, quote calc, AI chat, modals, toasts.
   No frameworks. No build step.
   ===================================================== */
(function () {
  'use strict';

  // ---------- Helpers ----------
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const formatVN = (n) => Math.round(n).toLocaleString('vi-VN');
  const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- Lucide icons ----------
  function paintIcons() {
    if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.75 } });
  }
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
    setTimeout(() => {
      el.classList.add('is-leaving');
      setTimeout(() => el.remove(), 260);
    }, 3200);
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
          ${(opts.actions || [{ label: 'Đóng', variant: 'primary' }]).map((a, i) =>
            `<button class="btn btn--${a.variant || 'outline'}" data-action="${i}">${escapeHTML(a.label)}${a.icon ? ` <i data-lucide="${a.icon}" class="ic"></i>` : ''}</button>`
          ).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(root);
    paintIcons();
    const close = () => { root.remove(); };
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
    })();
    document.addEventListener('keydown', function onEsc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onEsc); }
    });
    return close;
  }

  // ---------- Nav scrolled state ----------
  const nav = $('#nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---------- Mobile drawer ----------
  const burger = $('#burger');
  const drawer = $('#drawer');
  if (burger && drawer) {
    const toggle = () => {
      const open = drawer.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      burger.innerHTML = open
        ? '<i data-lucide="x" class="ic"></i>'
        : '<i data-lucide="menu" class="ic"></i>';
      paintIcons();
    };
    burger.addEventListener('click', toggle);
    drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      drawer.classList.remove('is-open');
      burger.innerHTML = '<i data-lucide="menu" class="ic"></i>';
      paintIcons();
    }));
  }

  // ---------- Reveal on scroll ----------
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  $$('.reveal').forEach(el => io.observe(el));

  // ---------- Service cards → toggle quote ----------
  const checks = $$('.checks input[type=checkbox]');
  const priceToService = {};
  checks.forEach(c => { priceToService[c.dataset.price] = c; });

  $$('.service[data-price]').forEach(card => {
    card.addEventListener('click', () => {
      const p = card.dataset.price;
      const c = priceToService[p];
      if (c) {
        c.checked = !c.checked;
        card.classList.toggle('is-selected', c.checked);
        recalc();
        toast(c.checked ? `Đã thêm: ${card.dataset.name}` : `Đã bỏ: ${card.dataset.name}`, c.checked ? 'check-circle-2' : 'minus-circle');
      }
    });
  });

  // ---------- Quote calculator ----------
  const carSel = $('#q-car');
  const locSel = $('#q-loc');
  const totalEl = $('#qs-total');
  const listEl = $('#qs-list');
  const etaEl = $('#qs-eta');
  const labels = {
    '450000': 'Thay dầu + lọc',
    '680000': 'Má phanh',
    '350000': 'Cân thước lái',
    '550000': 'Vệ sinh điều hoà',
    '1850000': 'Bình ắc-quy',
    '1450000': 'Gói bảo dưỡng 10k',
    '2400000': 'Đánh bóng + ceramic',
    '250000': 'Cảm biến + đèn báo',
  };
  function recalc() {
    if (!carSel || !totalEl) return;
    const mult = parseFloat(carSel.options[carSel.selectedIndex].dataset.mult || '1');
    let total = 0;
    const items = [];
    let totalTime = 0;
    checks.forEach(c => {
      if (c.checked) {
        const price = parseInt(c.dataset.price, 10);
        const t = parseInt(c.dataset.time || '45', 10);
        const adj = Math.round(price * mult);
        total += adj;
        totalTime += t;
        items.push({ name: labels[c.dataset.price] || 'Dịch vụ', price: adj });
      }
      const card = $(`.service[data-price="${c.dataset.price}"]`);
      if (card) card.classList.toggle('is-selected', c.checked);
    });
    if (items.length === 0) {
      listEl.innerHTML = '<li style="opacity:0.7"><span>Chọn ít nhất 1 dịch vụ</span><span class="v">—</span></li>';
    } else {
      listEl.innerHTML = items.map(i => `<li><span>${escapeHTML(i.name)}</span><span class="v">${formatVN(i.price)} ₫</span></li>`).join('');
    }
    totalEl.textContent = formatVN(total);
    if (etaEl) etaEl.textContent = totalTime > 0 ? `${totalTime} phút` : '—';
  }
  if (carSel) carSel.addEventListener('change', recalc);
  if (locSel) locSel.addEventListener('change', recalc);
  checks.forEach(c => c.addEventListener('change', recalc));
  recalc();

  // ---------- Booking submit ----------
  const bookingForm = $('#booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#q-name').value.trim();
      const phone = $('#q-phone').value.trim();
      const date = $('#q-date').value;
      const selectedCount = checks.filter ? 0 : 0;
      let count = 0;
      checks.forEach(c => { if (c.checked) count++; });

      if (!name || !phone) {
        toast('Vui lòng nhập họ tên và số điện thoại', 'alert-circle');
        if (!name) $('#q-name').focus();
        else $('#q-phone').focus();
        return;
      }
      if (!/^(0|\+?84)\d{9}$/.test(phone.replace(/\s/g, ''))) {
        toast('Số điện thoại không hợp lệ', 'alert-circle');
        $('#q-phone').focus();
        return;
      }
      if (count === 0) {
        toast('Vui lòng chọn ít nhất 1 dịch vụ', 'alert-circle');
        return;
      }

      const code = 'CARDIY-' + Math.random().toString(36).slice(2, 7).toUpperCase();
      const dateStr = date ? new Date(date).toLocaleDateString('vi-VN') : 'sớm nhất có thể';
      openModal({
        icon: 'check-circle-2',
        title: 'Đặt lịch thành công!',
        html: `Cảm ơn <strong>${escapeHTML(name)}</strong>. Mã đặt lịch của bạn:`,
        code,
        actions: [
          { label: 'Xem chi tiết', variant: 'primary', icon: 'arrow-right', onClick: () => toast('Mã đặt lịch đã được gửi qua SMS đến ' + phone, 'message-square') },
          { label: 'Đóng', variant: 'outline' }
        ],
      });
    });
  }

  // ---------- "Đặt lịch ngay" buttons (anywhere on page) ----------
  $$('[data-action="book"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      $('#booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // ---------- App store buttons → coming soon ----------
  $$('.store-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const platform = btn.dataset.platform || 'Ứng dụng';
      openModal({
        icon: 'rocket',
        title: 'Sắp ra mắt!',
        body: `App CARDIY trên ${platform} đang trong giai đoạn beta — bạn có thể đăng ký nhận thông báo khi ra mắt chính thức.`,
        actions: [
          { label: 'Đăng ký nhận thông báo', variant: 'primary', icon: 'bell', onClick: () => toast('Đã ghi nhận! Bạn sẽ là người đầu tiên biết khi app ra mắt.', 'check-circle-2') },
          { label: 'Để sau', variant: 'outline' }
        ],
      });
    });
  });

  // ---------- Newsletter ----------
  const news = $('#newsletter');
  if (news) {
    news.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = $('#newsletter-email').value.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast('Email không hợp lệ', 'alert-circle');
        return;
      }
      $('#newsletter-email').value = '';
      toast('Cảm ơn! Bạn đã đăng ký nhận tin từ CARDIY.', 'check-circle-2');
    });
  }

  // ---------- Sign-in / login (footer + nav) ----------
  $$('[data-action="signin"]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openModal({
        icon: 'log-in',
        title: 'Đăng nhập CARDIY',
        body: 'Đăng nhập bằng số điện thoại để quản lý xe, đặt lịch nhanh và xem lịch sử bảo dưỡng.',
        actions: [
          { label: 'Tiếp tục với SĐT', variant: 'primary', icon: 'phone', onClick: () => toast('Tính năng đăng nhập đang được hoàn thiện.', 'info') },
          { label: 'Để sau', variant: 'outline' }
        ],
      });
    });
  });

  // ---------- Fleet B2B contact ----------
  $$('[data-action="contact-fleet"]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openModal({
        icon: 'building-2',
        title: 'CARDIY Fleet — gói doanh nghiệp',
        body: 'Quản lý từ 5 xe trở lên với ưu đãi 12–18%, một hoá đơn VAT hàng tháng, dashboard riêng. Để lại email, đội sales sẽ liên hệ trong 24h.',
        actions: [
          { label: 'Gửi email cho sales', variant: 'primary', icon: 'mail', onClick: () => { window.location.href = 'mailto:fleet@cardiy.vn?subject=Quan%20t%C3%A2m%20g%C3%B3i%20CARDIY%20Fleet'; } },
          { label: 'Để sau', variant: 'outline' }
        ],
      });
    });
  });

  // ---------- Generic placeholders ----------
  $$('[data-action="soon"]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      toast(el.dataset.msg || 'Tính năng đang được phát triển.', 'info');
    });
  });

  // ============================================================
  // AI CHAT — uses window.claude.complete in preview, smart local
  // fallback in production (Vercel) where claude.complete isn't.
  // ============================================================

  const chatBody = $('#chat-body');
  const chatForm = $('#chat-form');
  const chatInput = $('#chat-input');
  const chatSend = $('#chat-send');
  const chatSuggest = $('#chat-suggest');

  // Local smart fallback: keyword-based replies that feel real.
  // Used when window.claude isn't available (i.e. deployed site).
  function localBotReply(text) {
    const t = text.toLowerCase();
    if (/dầu|nhớt|engine oil/.test(t)) {
      return `Thay <strong>dầu máy + lọc dầu</strong> nên làm mỗi 5.000–7.000 km hoặc 6 tháng (cái nào tới trước).
Chi phí cho dòng sedan B (Vios, City…): khoảng <strong>450.000 ₫</strong> đã bao gồm dầu chính hãng + công thợ.
Đặt lịch luôn?`;
    }
    if (/phanh|brake|kẹt kẹt|kêu/.test(t)) {
      return `Tiếng kẹt khi phanh hoặc rẽ thường do <strong>má phanh mòn</strong> hoặc <strong>rotuyn lái</strong>.
Mình đề xuất:
<ul><li>Kiểm tra má phanh + rotuyn (~200k)</li><li>Thay nếu cần (650k–1.200k)</li></ul>
KTV CARDIY tới tận nơi kiểm tra miễn phí — đặt lịch không?`;
    }
    if (/điều hoà|aircon|ac|mát|nóng/.test(t)) {
      return `Điều hoà yếu/không mát thường do <strong>thiếu gas</strong>, <strong>lọc gió bẩn</strong>, hoặc <strong>dàn lạnh đóng bụi</strong>.
Gói vệ sinh điều hoà CARDIY: <strong>550.000 ₫</strong> — bao gồm hút bụi dàn lạnh, thay lọc, nạp gas R134a. Mất khoảng 75 phút.`;
    }
    if (/giá|báo giá|bao nhiêu|chi phí/.test(t)) {
      return `CARDIY niêm yết giá cố định cho 10+ dịch vụ phổ biến. Vài ví dụ:
<ul><li>Thay dầu + lọc: <strong>450k</strong></li><li>Má phanh: <strong>680k</strong></li><li>Vệ sinh điều hoà: <strong>550k</strong></li><li>Gói bảo dưỡng 10.000 km: <strong>1.450k</strong></li></ul>
Bạn dùng <strong>báo giá nhanh</strong> phía trên để tính chính xác theo dòng xe nhé.`;
    }
    if (/đặt lịch|booking|hẹn/.test(t)) {
      return `Đặt lịch siêu nhanh trong 3 bước:
<ul><li>Chọn xe + dịch vụ</li><li>Chọn ngày giờ + địa chỉ</li><li>Xác nhận — KTV sẽ tới tận nơi</li></ul>
Cuộn lên form <strong>Báo giá nhanh</strong> phía trên hoặc click <em>Đặt lịch ngay</em> nhé!`;
    }
    if (/ktv|thợ|kỹ thuật/.test(t)) {
      return `100% KTV CARDIY đều có chứng chỉ Cao đẳng Cơ khí Ô tô, đào tạo nội bộ 4 tuần, và có <strong>bảo hiểm trách nhiệm nghề nghiệp</strong>.
Bạn xem được hồ sơ + đánh giá của KTV <strong>trước khi xác nhận lịch</strong> và theo dõi vị trí trực tiếp trên bản đồ.`;
    }
    if (/fleet|doanh nghiệp|công ty|taxi/.test(t)) {
      return `CARDIY Fleet dành cho doanh nghiệp từ 5 xe trở lên: giá ưu đãi 12–18%, một hoá đơn VAT hàng tháng, dashboard riêng, KTV ưu tiên.
Để lại email, đội sales sẽ liên hệ trong 24h. Bạn nhấp nút <em>CARDIY Fleet</em> phía dưới nhé.`;
    }
    if (/bảo hành|warranty/.test(t)) {
      return `Mọi gói dịch vụ CARDIY đều bảo hành <strong>tối thiểu 6 tháng</strong>. Phụ tùng chính: <strong>12 tháng</strong>.
Nếu có vấn đề trong thời gian bảo hành — CARDIY sửa miễn phí, KTV tới tận nơi.`;
    }
    return `Mình là trợ lý AI của CARDIY — mình có thể giúp bạn:
<ul><li>Báo giá nhanh theo dòng xe</li><li>Tư vấn dịch vụ phù hợp</li><li>Đặt lịch trong cuộc trò chuyện</li><li>Giải thích thuật ngữ ô tô</li></ul>
Bạn cứ hỏi tự nhiên nhé — "xe mình kêu gì đó", "thay dầu giá bao nhiêu?", "đặt lịch thứ Bảy"…`;
  }

  function appendMsg(role, html) {
    if (!chatBody) return null;
    const div = document.createElement('div');
    div.className = 'msg ' + role;
    div.innerHTML = html;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
    return div;
  }
  function appendTyping() {
    const div = appendMsg('bot', '<span class="typing"><span></span><span></span><span></span></span>');
    if (div) div.style.maxWidth = '120px';
    return div;
  }

  async function askAI(text) {
    if (!chatBody) return;
    appendMsg('user', escapeHTML(text));
    const typingNode = appendTyping();
    chatSend.disabled = true;

    let answer;
    try {
      if (typeof window.claude !== 'undefined' && typeof window.claude.complete === 'function') {
        // Use Claude when available (preview environment)
        const prompt = `Bạn là trợ lý AI của CARDIY — nền tảng sửa xe tận nơi tại Việt Nam. Trả lời ngắn gọn (2-4 câu), thân thiện, bằng tiếng Việt. Dùng "bạn". Có thể dùng <strong> và <ul><li> trong câu trả lời nếu cần làm rõ. Không dùng emoji. Bối cảnh: dịch vụ tận nơi tại HCM/HN/ĐN, giá cố định, bảo hành 6 tháng. Người dùng hỏi: "${text}"`;
        answer = await window.claude.complete(prompt);
      } else {
        // Local fallback (production deploy)
        await new Promise(r => setTimeout(r, 900 + Math.random() * 600));
        answer = localBotReply(text);
      }
    } catch (e) {
      answer = localBotReply(text);
    }

    typingNode?.remove();
    appendMsg('bot', answer);
    chatSend.disabled = false;
    chatInput?.focus();
  }

  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;
      chatInput.value = '';
      askAI(text);
    });
  }
  if (chatSuggest) {
    chatSuggest.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip');
      if (!btn) return;
      askAI(btn.textContent.trim());
    });
  }

  // ---------- Phone hover wiggle ----------
  const phoneMain = $('.phone--main');
  if (phoneMain) {
    phoneMain.addEventListener('mouseenter', () => { phoneMain.style.transition = 'transform 400ms cubic-bezier(.16,1,.3,1)'; phoneMain.style.transform = 'translateX(-50%) rotate(-2deg) translateY(-6px)'; });
    phoneMain.addEventListener('mouseleave', () => { phoneMain.style.transform = 'translateX(-50%)'; });
  }

  // Mark page as ready (for any CSS hooks)
  document.documentElement.classList.add('is-ready');

  // ============================================================
  // CARDIY · Phí Lưu Động (Mobile Service Fee Calculator)
  // Tính phí GPS: 150k cho 5km đầu, 30k/km ban ngày, 35k/km ban đêm
  // Phụ thu ngày lễ 30%. Cộng phí cầu đường thực tế.
  // ============================================================

  function calcMobileFee(km, isNight, isHoliday) {
    const BASE = 150000;       // 5km đầu
    const BASE_KM = 5;
    const RATE_DAY = 30000;    // per km, ban ngày
    const RATE_NIGHT = 35000;  // per km, ban đêm
    const km_num = parseFloat(km) || 0;
    let fee = BASE;
    if (km_num > BASE_KM) {
      const extra = km_num - BASE_KM;
      fee += extra * (isNight ? RATE_NIGHT : RATE_DAY);
    }
    if (isHoliday) fee = Math.round(fee * 1.3);
    return Math.round(fee);
  }

  function updateMobileFeeDisplay() {
    const kmEl = document.getElementById('q-km');
    const daytimeEl = document.getElementById('q-daytime');
    const holidayEl = document.getElementById('q-holiday');
    const feeValueEl = document.getElementById('mobile-fee-value');
    const feeNoteEl = document.getElementById('mobile-fee-note');
    if (!kmEl || !feeValueEl) return;

    const km = parseFloat(kmEl.value) || 0;
    const isNight = daytimeEl ? daytimeEl.value === 'night' : false;
    const isHoliday = holidayEl ? holidayEl.checked : false;
    const fee = calcMobileFee(km, isNight, isHoliday);

    feeValueEl.textContent = formatVN(fee) + ' ₫';
    let note = '';
    if (km <= 5) note = '≤ 5 km đầu tiên';
    else note = km.toFixed(1) + ' km' + (isNight ? ' · đêm' : ' · ngày') + (isHoliday ? ' · lễ +30%' : '');
    if (feeNoteEl) feeNoteEl.textContent = note;
  }

  // Attach listeners for mobile fee inputs
  function bindMobileFeeListeners() {
    const inputs = ['q-km', 'q-daytime', 'q-holiday', 'q-toll'];
    inputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', updateMobileFeeDisplay);
      if (el && el.type === 'number') el.addEventListener('input', updateMobileFeeDisplay);
    });
    updateMobileFeeDisplay(); // initial render
  }

  document.addEventListener('DOMContentLoaded', bindMobileFeeListeners);


  // ================================================================
  // CARDIY · 3-Step Booking Bill Logic
  // ================================================================
  // ================================================================
  // CARDIY · 3-Step Booking Bill Logic (clean, no $ conflicts)
  // ================================================================
  (function() {
    function gid(id) { return document.getElementById(id); }

    function calcFee(km, night, holiday) {
      var BASE = 150000, BASE_KM = 5, fee = BASE;
      var k = parseFloat(km) || 0;
      if (k > BASE_KM) fee += (k - BASE_KM) * (night ? 35000 : 30000);
      return holiday ? Math.round(fee * 1.3) : Math.round(fee);
    }

    function setStep(n) {
      document.querySelectorAll('.bk-step').forEach(function(s) {
        var sn = +s.dataset.step;
        s.classList.toggle('is-active', sn === n);
        s.classList.toggle('is-done', sn < n);
      });
      ['bstep-1','bstep-2','bstep-3'].forEach(function(id, i) {
        var el = document.getElementById(id);
        if (el) el.style.display = (i + 1 === n) ? 'block' : 'none';
      });
      var bill = document.getElementById('booking');
      if (bill) bill.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function getSelected() {
      return Array.from(document.querySelectorAll('.bsvc-card input:checked')).map(function(cb) {
        var card = cb.closest('.bsvc-card');
        var timeEl = card && card.querySelector('.bsvc-time');
        return { name: cb.dataset.name || '', time: timeEl ? timeEl.textContent : '' };
      });
    }

    function updateTable() {
      var sel = getSelected();
      var empty = gid('bill-empty-hint');
      var table = gid('bill-table');
      var tbody = gid('bill-table-body');
      var btn = gid('bstep1-next');
      if (!btn) return;
      if (sel.length === 0) {
        if (empty) empty.style.display = 'flex';
        if (table) table.style.display = 'none';
        btn.disabled = true;
      } else {
        if (empty) empty.style.display = 'none';
        if (table) table.style.display = 'table';
        btn.disabled = false;
        if (tbody) tbody.innerHTML = sel.map(function(s, i) {
          return '<tr><td>' + (i+1) + '</td><td>' + escapeHTML(s.name) + '</td><td>' + escapeHTML(s.time) + '</td><td>B\u00e1o gi\u00e1 theo th\u1ef1c t\u1ebf</td></tr>';
        }).join('');
      }
    }

    function updateFee() {
      var kmEl = gid('bk-km'), dtEl = gid('bk-daytime'), hlEl = gid('bk-holiday');
      var km = kmEl ? kmEl.value : 5;
      var night = dtEl ? dtEl.value === 'night' : false;
      var holiday = hlEl ? hlEl.checked : false;
      var fee = calcFee(km, night, holiday);
      var fv = gid('bk-fee-value'), fn = gid('bk-fee-note');
      if (fv) fv.textContent = formatVN(fee) + ' \u20ab';
      if (fn) { var k = parseFloat(km)||0; fn.textContent = k<=5 ? '\u22645km' : k.toFixed(1)+'km'; }
    }

    // Wire up service checkboxes
    document.querySelectorAll('.bsvc-card input[type="checkbox"]').forEach(function(cb) {
      cb.addEventListener('change', updateTable);
    });
    updateTable();

    // Wire up fee inputs
    ['bk-km','bk-daytime','bk-holiday','bk-toll'].forEach(function(id) {
      var el = gid(id);
      if (!el) return;
      el.addEventListener('change', updateFee);
      if (el.type === 'number') el.addEventListener('input', updateFee);
    });
    updateFee();

    // Step buttons
    var b = gid('bstep1-next');
    if (b) b.addEventListener('click', function() { if (getSelected().length > 0) setStep(2); });
    b = gid('bstep2-back');
    if (b) b.addEventListener('click', function() { setStep(1); });
    b = gid('bstep3-back');
    if (b) b.addEventListener('click', function() { setStep(2); });

    b = gid('bstep2-next');
    if (b) b.addEventListener('click', function() {
      var nm = gid('bk-name'), ph = gid('bk-phone'), ad = gid('bk-address'), dt = gid('bk-date');
      var name = nm ? nm.value.trim() : '';
      var phone = ph ? ph.value.trim() : '';
      var addr = ad ? ad.value.trim() : '';
      var date = dt ? dt.value : '';
      if (!name) { toast('Vui l\u00f2ng nh\u1eadp h\u1ecd t\u00ean', 'user'); if (nm) nm.focus(); return; }
      if (!phone || !/^0\d{8,9}$/.test(phone.replace(/\s/g,''))) { toast('S\u1ed1 \u0111i\u1ec7n tho\u1ea1i ch\u01b0a \u0111\u00fang', 'phone'); if (ph) ph.focus(); return; }
      if (!addr) { toast('Vui l\u00f2ng nh\u1eadp \u0111\u1ecba ch\u1ec9', 'map-pin'); if (ad) ad.focus(); return; }
      if (!date) { toast('Vui l\u00f2ng ch\u1ecdn ng\u00e0y h\u1eb9n', 'calendar'); if (dt) dt.focus(); return; }
      function sp(id, v) { var e = gid(id); if (e) e.textContent = v; }
      var carEl = gid('bk-car'), plEl = gid('bk-plate'), slEl = gid('bk-slot'), fvEl = gid('bk-fee-value');
      sp('prev-name', name); sp('prev-phone', phone);
      sp('prev-car', carEl ? carEl.value.trim() || '\u2014' : '\u2014');
      sp('prev-plate', plEl ? plEl.value.trim() || '\u2014' : '\u2014');
      sp('prev-address', addr);
      sp('prev-date', new Date(date).toLocaleDateString('vi-VN', {weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'}));
      sp('prev-slot', slEl ? slEl.options[slEl.selectedIndex].text : '\u2014');
      sp('prev-fee', fvEl ? fvEl.textContent : '150.000 \u20ab');
      var sc = gid('prev-services');
      if (sc) sc.innerHTML = getSelected().map(function(s) {
        return '<div class="bill-preview-svc-row"><span>'+escapeHTML(s.name)+'</span><span>'+escapeHTML(s.time)+'</span></div>';
      }).join('');
      setStep(3);
    });

    b = gid('bstep3-submit');
    if (b) b.addEventListener('click', function() {
      var code = 'CDY-' + Date.now().toString(36).toUpperCase().slice(-6);
      var cd = gid('bill-code-display'); if (cd) cd.textContent = 'M\u00e3: ' + code;
      openModal({
        icon: 'check-circle', title: '\u0110\u1eb7t l\u1ecbch th\u00e0nh c\u00f4ng! \ud83c\udf89',
        html: '<p>M\u00e3 \u0111\u1eb7t l\u1ecbch: <strong style="font-family:monospace;font-size:18px;color:var(--cardiy-blue-600)">' + code + '</strong></p><p style="color:var(--fg-2);font-size:13px;margin-top:8px">KTV g\u1ecdi x\u00e1c nh\u1eadn trong <b>5 ph\u00fat</b>. H\u1eb9n g\u1eb7p! \ud83d\ude97</p>',
        actions: [{ label: 'Tuy\u1ec7t v\u1eddi!', variant: 'primary', icon: 'thumbs-up' }]
      });
      setTimeout(function() {
        document.querySelectorAll('.bsvc-card input').forEach(function(cb) { cb.checked = false; });
        ['bk-name','bk-phone','bk-car','bk-plate','bk-address','bk-note'].forEach(function(id) { var e = gid(id); if (e) e.value = ''; });
        var de = gid('bk-date'); if (de) de.value = '';
        updateTable(); setStep(1);
      }, 300);
    });

    // CTA buttons
    document.querySelectorAll('[data-action="book"]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var el = document.getElementById('booking');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

  })();

})();
