(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

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

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 })
    : null;
  $$('.reveal').forEach(el => observer ? observer.observe(el) : el.classList.add('visible'));

  const localLinks = $$('a[href]');
  localLinks.forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:') || link.target === '_blank') return;
      let url;
      try { url = new URL(href, location.href); } catch { return; }
      if (url.origin !== location.origin || url.pathname === location.pathname && url.hash) return;
      if (url.protocol === 'file:' || url.origin === location.origin) {
        e.preventDefault();
        document.body.classList.add('is-leaving');
        setTimeout(() => { location.href = href; }, 150);
      }
    });
  });

  const bookingForm = $('#booking-form');
  if (bookingForm) {
    const checkin = $('#checkin');
    const checkout = $('#checkout');
    const today = new Date();
    const toISO = d => d.toISOString().split('T')[0];
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
    family: {
      name: 'Family Room 4', subtitle: 'Include Breakfast 4 Pax', image: 'images/kamar-family.jpg',
      features: ['King & Queen Bed','Luas 36 m²','Smart TV','AC','Wardrobe','Luggage Rack','Safe Box','Minibar','Hot & Cold Shower','No Smoking'],
      wa: 'Booking FAMILY ROOM 4'
    },
    junior1: {
      name: 'Junior Suite 1', subtitle: 'Include Breakfast 2 Pax', image: 'images/kamar-junior1.jpg',
      features: ['King Bed','Luas 34 m²','Sofa','Smart TV','AC','Wardrobe','No Smoking'],
      wa: 'Booking JUNIOR SUITE 1'
    },
    junior2: {
      name: 'Junior Suite 2', subtitle: 'Include Breakfast 2 Pax', image: 'images/kamar-junior2.jpg',
      features: ['King Bed','Luas 36 m²','Sofa','Dressing Table','Smart TV','No Smoking'],
      wa: 'Booking JUNIOR SUITE 2'
    },
    wnsuite1: {
      name: 'WN Suite 1', subtitle: 'Include Breakfast 2 Pax', image: 'images/kamar-wnsuite.jpg',
      features: ['Super King Bed','2 Smart TV','3 AC','Mini Refrigerator'],
      wa: 'Booking WN SUITE 1'
    },
    wnsuite2: {
      name: 'WN Suite 2', subtitle: 'Include Breakfast 2 Pax', image: 'images/kamar-wnsuite2.jpg',
      features: ['Super King Bed','Luas 55 m²','Living Room','Kitchenette','Whirlpool & Shower','No Smoking'],
      wa: 'Booking WN SUITE 2'
    }
  };

  const roomDialog = $('#room-dialog');
  if (roomDialog && typeof roomDialog.showModal === 'function') {
    const dialogImg = $('[data-dialog-image]', roomDialog);
    const dialogTitle = $('[data-dialog-title]', roomDialog);
    const dialogSubtitle = $('[data-dialog-subtitle]', roomDialog);
    const dialogFeatures = $('[data-dialog-features]', roomDialog);
    const dialogBook = $('[data-dialog-book]', roomDialog);

    $$('[data-room]').forEach(btn => {
      btn.addEventListener('click', () => {
        const room = roomData[btn.dataset.room];
        if (!room) return;
        dialogImg.src = room.image;
        dialogImg.alt = room.name;
        dialogTitle.textContent = room.name;
        dialogSubtitle.textContent = room.subtitle;
        dialogFeatures.innerHTML = room.features.map(item => `<span class="dialog-feature">${item}</span>`).join('');
        dialogBook.href = `https://wa.me/6282256795679?text=${encodeURIComponent(`Halo Wisata Niaga Hotel, saya ingin menanyakan ${room.wa}.`)}`;
        roomDialog.showModal();
      });
    });
    $$('[data-dialog-close]', roomDialog).forEach(btn => btn.addEventListener('click', () => roomDialog.close()));
    roomDialog.addEventListener('click', e => {
      const rect = roomDialog.getBoundingClientRect();
      const inDialog = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      if (!inDialog) roomDialog.close();
    });
  }

  const inquiryButtons = $$('[data-inquiry]');
  inquiryButtons.forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const service = btn.dataset.inquiry || 'MICE';
      const number = btn.dataset.number || '6282265003510';
      const text = `Halo Wisata Niaga Hotel, saya ingin menanyakan ${service}. Mohon informasi paket, ketersediaan, dan penawaran terbaik.`;
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    });
  });
})();
