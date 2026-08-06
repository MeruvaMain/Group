/* ═══════════════════════════════════════════════════════════════
   MERUVA Thiết kế — lớp nối ngôn ngữ
   Dùng lại toàn bộ 137 khoá d3_* đã dịch sẵn trong Meruva3D_lang.js,
   chỉ bổ sung những khoá mới mà bố cục v2 cần.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var BASE = window.MERUVA3D_LANG || { vi: {}, en: {}, ja: {} };

  var EXTRA = {
    vi: {
      page_title: 'MERUVA Thiết kế — Nhận diện thương hiệu · 3D Visualization · In 3D · TP.HCM',
      meta_desc: 'MERUVA Thiết kế — xây dựng nhận diện thương hiệu, dựng hình 3D sản phẩm, thiết kế giao diện web/app và in 3D theo yêu cầu. Giao trong 3–5 ngày tại TP.HCM.',
      brand_sub: 'Thiết kế',
      back: 'Trang chủ',
      hero_eyebrow: 'Thiết kế thương hiệu · 3D · In theo yêu cầu · TP.HCM',
      m1_v: '4', m1_k: 'Mảng dịch vụ<br>từ logo tới in thật',
      m2_v: '24h', m2_k: 'Phản hồi<br>trong giờ làm việc',
      m3_v: '3–5', m3_k: 'Ngày giao<br>hàng in 3D',
      m4_v: 'VI · EN', m4_k: 'Làm việc với khách<br>Việt Nam &amp; quốc tế',
      sec_svc_idx: 'Dịch vụ',
      sec_print_idx: 'In 3D',
      sec_why_idx: 'Vì sao',
      sec_contact_idx: 'Liên hệ',
      price_from: 'Khoảng giá',
      f_date: 'Ngày mong muốn',
      form_sending: 'Đang gửi...',
      form_err: 'Có lỗi xảy ra. Vui lòng thử lại hoặc nhắn Zalo.',
      form_neterr: 'Không gửi được. Kiểm tra kết nối và thử lại.',
      f_tag: 'Từ đỉnh cao — chúng tôi phục vụ.'
    },
    en: {
      page_title: 'MERUVA Design — Brand identity · 3D visualization · 3D printing · Ho Chi Minh City',
      meta_desc: 'MERUVA Design — brand identity systems, 3D product visualization, web/app UI design and custom 3D printing. Delivered in 3–5 days in Ho Chi Minh City.',
      brand_sub: 'Design',
      back: 'Home',
      hero_eyebrow: 'Brand design · 3D · Custom printing · Ho Chi Minh City',
      m1_v: '4', m1_k: 'Service areas<br>from logo to printed object',
      m2_v: '24h', m2_k: 'Reply within<br>working hours',
      m3_v: '3–5', m3_k: 'Days to deliver<br>3D prints',
      m4_v: 'VI · EN', m4_k: 'Working with Vietnamese<br>&amp; international clients',
      sec_svc_idx: 'Services',
      sec_print_idx: '3D Print',
      sec_why_idx: 'Why me',
      sec_contact_idx: 'Contact',
      price_from: 'Price range',
      f_date: 'Preferred date',
      form_sending: 'Sending...',
      form_err: 'Something went wrong. Please try again or message us on Zalo.',
      form_neterr: 'Could not send. Check your connection and try again.',
      f_tag: 'From the summit, we serve.'
    },
    ja: {
      page_title: 'MERUVA デザイン — ブランドアイデンティティ · 3Dビジュアライゼーション · 3Dプリント · ホーチミン',
      meta_desc: 'MERUVA デザイン — ブランドアイデンティティ構築、3D製品ビジュアライゼーション、ウェブ/アプリUIデザイン、オーダー3Dプリント。ホーチミンで3〜5日でお届け。',
      brand_sub: 'デザイン',
      back: 'ホーム',
      hero_eyebrow: 'ブランドデザイン · 3D · オーダープリント · ホーチミン',
      m1_v: '4', m1_k: 'サービス領域<br>ロゴから実物まで',
      m2_v: '24h', m2_k: '営業時間内に<br>ご返信',
      m3_v: '3–5', m3_k: '3Dプリント<br>お届け日数',
      m4_v: 'VI · EN', m4_k: 'ベトナム国内および<br>海外のお客様に対応',
      sec_svc_idx: 'サービス',
      sec_print_idx: '3Dプリント',
      sec_why_idx: '選ばれる理由',
      sec_contact_idx: 'お問い合わせ',
      price_from: '価格帯',
      f_date: 'ご希望日',
      form_sending: '送信中...',
      form_err: 'エラーが発生しました。もう一度お試しいただくか、Zaloでご連絡ください。',
      form_neterr: '送信できませんでした。接続を確認して再度お試しください。',
      f_tag: '頂きから、私たちは尽くす。'
    }
  };

  var T = {};
  ['vi', 'en', 'ja'].forEach(function (lang) {
    T[lang] = Object.assign({}, BASE[lang] || {}, EXTRA[lang]);
  });
  window.MERUVA_T = T;
})();
