(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Lightweight page progress / transition cue.
  const progress = document.createElement('div');
  progress.className = 'nav-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);
  requestAnimationFrame(() => document.body.classList.add('page-ready'));
  addEventListener('pageshow', () => {
    document.body.classList.remove('is-leaving');
    progress.classList.remove('active');
  });

  const header = $('.site-header');
  const nav = $('#main-nav');
  const toggle = $('.nav-toggle');

  const closeNav = () => {
    if (!nav || !toggle) return;
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
  };

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = !nav.classList.contains('open');
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('nav-open', open);
    });
    $$('a', nav).forEach(link => link.addEventListener('click', closeNav));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });
    document.addEventListener('click', e => {
      if (nav.classList.contains('open') && !nav.contains(e.target) && !toggle.contains(e.target)) closeNav();
    });
  }

  const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 12);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  // Reveal content with a subtle stagger, not a heavy animation library.
  const revealItems = $$('.reveal');
  revealItems.forEach((el, index) => el.style.setProperty('--reveal-delay', `${Math.min(index % 5, 4) * 45}ms`));
  const observer = !prefersReducedMotion && 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -4% 0px' })
    : null;
  revealItems.forEach(el => observer ? observer.observe(el) : el.classList.add('visible'));

  // Soft page exit for internal page navigation. Hash links keep native smooth scrolling.
  $$('a[href]').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (!href || href === '#' || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:') || link.target === '_blank') return;
      let url;
      try { url = new URL(href, location.href); } catch { return; }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return;
      e.preventDefault();
      progress.classList.add('active');
      document.body.classList.add('is-leaving');
      setTimeout(() => { location.href = href; }, prefersReducedMotion ? 0 : 220);
    });
  });

  // Reservation form -> WhatsApp.
  const bookingForm = $('#booking-form');
  if (bookingForm) {
    const checkin = $('#checkin');
    const checkout = $('#checkout');
    const today = new Date();
    const toISO = d => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    if (checkin && checkout) {
      checkin.min = toISO(today);
      checkout.min = toISO(tomorrow);
      if (!checkin.value) checkin.value = toISO(today);
      if (!checkout.value) checkout.value = toISO(tomorrow);
      checkin.addEventListener('change', () => {
        if (!checkin.value) return;
        const next = new Date(`${checkin.value}T12:00:00`);
        next.setDate(next.getDate() + 1);
        checkout.min = toISO(next);
        if (!checkout.value || checkout.value <= checkin.value) checkout.value = toISO(next);
      });
    }

    bookingForm.addEventListener('submit', e => {
      e.preventDefault();
      const data = new FormData(bookingForm);
      const formatDate = value => {
        if (!value) return '-';
        const [y,m,d] = value.split('-');
        return `${d}/${m}/${y}`;
      };
      const text = [
        'Halo Wisata Niaga Hotel, saya ingin menanyakan ketersediaan kamar.',
        '',
        `Check-in: ${formatDate(data.get('checkin'))}`,
        `Check-out: ${formatDate(data.get('checkout'))}`,
        `Tamu: ${data.get('guests')}`,
        `Jumlah kamar: ${data.get('rooms')}`,
        `Tipe kamar: ${data.get('room')}`,
        '',
        'Mohon informasi ketersediaan dan penawaran terbaik. Terima kasih.'
      ].join('\n');
      window.open(`https://wa.me/6282256795679?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    });
  }

  const roomData = {
    standardDouble: {
      name: 'Standard Double', subtitle: '14 m² · Maks. 2 tamu · 1 Queen Bed', image: 'images/standard-double.jpg',
      description: 'Pilihan ringkas dan nyaman untuk perjalanan singkat maupun kebutuhan bisnis di pusat Purwokerto.',
      features: ['Private bathroom', 'Shower', 'Towels & toiletries', 'Wi-Fi gratis', 'Satellite/cable channels', 'Air conditioning', 'Free instant coffee', 'Kettle', 'Desk', 'Non-smoking', 'In-room safe box'],
      wa: 'Standard Double'
    },
    standardTwin: {
      name: 'Standard Twin', subtitle: '14 m² · Maks. 2 tamu · 2 Single Beds', image: 'images/standard-twin.jpg',
      description: 'Konfigurasi dua tempat tidur terpisah untuk rekan perjalanan yang mengutamakan kenyamanan praktis.',
      features: ['Private bathroom', 'Shower', 'Towels & toiletries', 'Wi-Fi gratis', 'Satellite/cable channels', 'Air conditioning', 'Free instant coffee', 'Kettle', 'Refrigerator', 'Desk', 'Non-smoking', 'In-room safe box'],
      wa: 'Standard Twin'
    },
    superiorDouble: {
      name: 'Superior Double', subtitle: '24 m² · Maks. 2 tamu · 1 Queen Bed · City View', image: 'images/superior-double.jpg',
      description: 'Ruang lebih lega dengan queen bed dan city view untuk pengalaman menginap yang lebih santai.',
      features: ['City view', 'Private bathroom', 'Shower', 'Towels & toiletries', 'Wi-Fi gratis', 'Satellite/cable channels', 'Air conditioning', 'Free instant coffee', 'Kettle', 'Refrigerator', 'Desk', 'Non-smoking', 'In-room safe box'],
      wa: 'Superior Double'
    },
    superiorTwin: {
      name: 'Superior Twin', subtitle: '24 m² · Maks. 2 tamu · 2 Single Beds', image: 'images/superior-twin.jpg',
      description: 'Superior room dengan twin bed dan ruang yang lebih lapang untuk dua tamu.',
      features: ['Outdoor view', 'Private bathroom', 'Shower', 'Towels & toiletries', 'Wi-Fi gratis', 'Satellite/cable channels', 'Air conditioning', 'Free instant coffee', 'Kettle', 'Refrigerator', 'Desk', 'Non-smoking', 'In-room safe box'],
      wa: 'Superior Twin'
    },
    deluxeDouble: {
      name: 'Deluxe Double', subtitle: '28 m² · Maks. 2 tamu · 1 Queen Bed', image: 'images/deluxe-double.jpg',
      description: 'Deluxe room dengan area lebih luas untuk tamu yang menginginkan ruang gerak lebih nyaman.',
      features: ['Outdoor view', 'Private bathroom', 'Shower', 'Towels & toiletries', 'Wi-Fi gratis', 'Satellite/cable channels', 'Air conditioning', 'Free instant coffee', 'Kettle', 'Desk', 'Non-smoking', 'In-room safe box'],
      wa: 'Deluxe Double'
    },
    deluxeTwin: {
      name: 'Deluxe Twin', subtitle: '28 m² · Maks. 2 tamu · 2 Single Beds', image: 'images/deluxe-twin.jpg',
      description: 'Deluxe dengan dua single bed, cocok untuk perjalanan bersama dengan kebutuhan ruang yang lebih lega.',
      features: ['Outdoor view', 'Private bathroom', 'Shower', 'Towels & toiletries', 'Wi-Fi gratis', 'Streaming service', 'Satellite/cable channels', 'Air conditioning', 'Free instant coffee', 'Kettle', 'Desk', 'Non-smoking', 'In-room safe box'],
      wa: 'Deluxe Twin'
    },
    premiumDeluxe: {
      name: 'Premium Deluxe', subtitle: '34 m² · Maks. 2 tamu · 1 Queen Bed · Mountain View', image: 'images/premium-deluxe.jpg',
      description: 'Pilihan premium dengan ruang lebih luas dan mountain view untuk pengalaman menginap yang lebih istimewa.',
      features: ['Mountain view', 'Private bathroom', 'Shower', 'Towels', 'Hair dryer', 'Toiletries', 'Wi-Fi gratis', 'Streaming service', 'Satellite/cable channels', 'Air conditioning', 'Free instant coffee', 'Kettle', 'Refrigerator', 'Desk', 'Non-smoking', 'In-room safe box'],
      wa: 'Premium Deluxe'
    },
    family3: {
      name: 'Family 3', subtitle: '34 m² · 3 tamu · 1 Queen Bed + 1 Single Bed', image: 'images/family-3.jpg',
      description: 'Kamar keluarga untuk tiga tamu dengan kombinasi queen bed dan single bed dalam satu ruang yang lega.',
      features: ['1 Queen Bed + 1 Single Bed', 'Private bathroom', 'Shower', 'Towels & toiletries', 'Wi-Fi gratis', 'Satellite/cable channels', 'Air conditioning', 'Free instant coffee', 'Kettle', 'Refrigerator', 'Desk', 'Non-smoking', 'In-room safe box'],
      wa: 'Family 3'
    },
    family4: {
      name: 'Family 4', subtitle: '36 m² · Family Room · Breakfast 4 Pax', image: 'images/kamar-family.jpg',
      description: 'Ruang keluarga untuk empat tamu dengan king dan queen bed, cocok untuk menginap bersama keluarga.',
      features: ['King & Queen Bed', 'Luas 36 m²', 'Smart TV', 'AC', 'Wardrobe', 'Luggage Rack', 'Safe Box', 'Minibar', 'Hot & Cold Shower', 'No Smoking'],
      wa: 'Family 4'
    },
    junior1: {
      name: 'Junior Suite 1', subtitle: '34 m² · King Bed · Breakfast 2 Pax', image: 'images/kamar-junior1.jpg',
      description: 'Junior Suite dengan king bed dan sofa untuk kenyamanan ekstra selama menginap.',
      features: ['King Bed', 'Luas 34 m²', 'Sofa', 'Smart TV', 'AC', 'Wardrobe', 'No Smoking'],
      wa: 'Junior Suite 1'
    },
    junior2: {
      name: 'Junior Suite 2', subtitle: '36 m² · King Bed · Breakfast 2 Pax', image: 'images/kamar-junior2.jpg',
      description: 'Junior Suite yang lapang dengan area duduk dan dressing table untuk pengalaman menginap lebih nyaman.',
      features: ['King Bed', 'Luas 36 m²', 'Sofa', 'Dressing Table', 'Smart TV', 'No Smoking'],
      wa: 'Junior Suite 2'
    },
    wnsuite1: {
      name: 'WN Suite 1', subtitle: 'Super King Bed · Breakfast 2 Pax', image: 'images/kamar-wnsuite.jpg',
      description: 'Suite dengan super king bed, area lebih luas, dan fasilitas tambahan untuk pengalaman menginap premium.',
      features: ['Super King Bed', '2 Smart TV', '3 AC', 'Mini Refrigerator'],
      wa: 'WN Suite 1'
    },
    wnsuite2: {
      name: 'WN Suite 2', subtitle: '55 m² · Super King Bed · Breakfast 2 Pax', image: 'images/kamar-wnsuite2.jpg',
      description: 'Suite terluas dengan living room, kitchenette, serta whirlpool untuk pengalaman menginap yang lebih lengkap.',
      features: ['Super King Bed', 'Luas 55 m²', 'Living Room', 'Kitchenette', 'Whirlpool & Shower', 'No Smoking'],
      wa: 'WN Suite 2'
    }
  };

  // Room filter with a short fade so the grid does not jump abruptly.
  const filterButtons = $$('.room-filter-btn');
  const roomCards = $$('.room-card[data-room-category]');
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const selected = button.dataset.roomFilter || 'all';
      filterButtons.forEach(btn => {
        const active = btn === button;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', String(active));
      });
      roomCards.forEach(card => {
        const show = selected === 'all' || card.dataset.roomCategory === selected;
        if (show) {
          card.classList.remove('room-hidden');
          card.classList.add('room-showing');
          requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove('room-showing')));
        } else if (!card.classList.contains('room-hidden')) {
          card.classList.add('room-hiding');
          setTimeout(() => {
            card.classList.add('room-hidden');
            card.classList.remove('room-hiding');
          }, prefersReducedMotion ? 0 : 170);
        }
      });
    });
  });

  const roomDialog = $('#room-dialog');
  if (roomDialog && typeof roomDialog.showModal === 'function') {
    const dialogImg = $('[data-dialog-image]', roomDialog);
    const dialogImageLabel = $('[data-dialog-image-label]', roomDialog);
    const dialogTitle = $('[data-dialog-title]', roomDialog);
    const dialogSubtitle = $('[data-dialog-subtitle]', roomDialog);
    const dialogDescription = $('[data-dialog-description]', roomDialog);
    const dialogFeatures = $('[data-dialog-features]', roomDialog);
    const dialogBook = $('[data-dialog-book]', roomDialog);
    const dialogSelect = $('[data-dialog-select]', roomDialog);
    let activeRoom = null;
    let closeTimer = null;

    const closeDialog = () => {
      if (!roomDialog.open) return;
      clearTimeout(closeTimer);
      roomDialog.classList.add('closing');
      closeTimer = setTimeout(() => {
        roomDialog.close();
        roomDialog.classList.remove('closing');
        document.body.classList.remove('dialog-open');
      }, prefersReducedMotion ? 0 : 180);
    };

    $$('[data-room]').forEach(btn => {
      btn.addEventListener('click', () => {
        const room = roomData[btn.dataset.room];
        if (!room) return;
        activeRoom = room;
        dialogImg.src = room.image;
        dialogImg.alt = `${room.name} di Wisata Niaga Hotel`;
        dialogImageLabel.textContent = room.name;
        dialogTitle.textContent = room.name;
        dialogSubtitle.textContent = room.subtitle;
        dialogDescription.textContent = room.description;
        dialogFeatures.innerHTML = room.features.map(item => `<span class="dialog-feature">${item}</span>`).join('');
        dialogBook.href = `https://wa.me/6282256795679?text=${encodeURIComponent(`Halo Wisata Niaga Hotel, saya ingin menanyakan kamar ${room.wa}. Mohon informasi ketersediaan dan penawaran terbaik.`)}`;
        roomDialog.classList.remove('closing');
        roomDialog.showModal();
        document.body.classList.add('dialog-open');
      });
    });

    $$('[data-dialog-close]', roomDialog).forEach(btn => btn.addEventListener('click', closeDialog));
    roomDialog.addEventListener('cancel', e => { e.preventDefault(); closeDialog(); });
    roomDialog.addEventListener('click', e => { if (e.target === roomDialog) closeDialog(); });
    roomDialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));

    dialogSelect?.addEventListener('click', () => {
      if (!activeRoom) return;
      const select = $('#room-type');
      if (select) select.value = activeRoom.name;
      closeDialog();
      setTimeout(() => {
        $('#booking')?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
        setTimeout(() => $('#checkin')?.focus({ preventScroll: true }), prefersReducedMotion ? 0 : 450);
      }, prefersReducedMotion ? 0 : 220);
    });
  }

  // Service-specific inquiries.
  $$('[data-inquiry]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const service = btn.dataset.inquiry || 'MICE';
      const number = btn.dataset.number || '6282265003510';
      const text = `Halo Wisata Niaga Hotel, saya ingin menanyakan ${service}. Mohon informasi paket, ketersediaan, dan penawaran terbaik.`;
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    });
  });
})();
