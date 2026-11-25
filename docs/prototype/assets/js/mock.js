/* 钢贸上下游数据平台 · 原型模拟数据。所有企业名称、数值均为虚构，仅用于演示。 */
(function () {
  const rngOf = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

  const TODAY = '2026-11-24';
  const DATA_DATE = '2026-11-23';

  /* ---------------- 品类树：大类 → 品名 →（材质、规格段、参考含税价 元/吨） */
  const categories = [
    { name: '建筑钢材', depth: 'L4', geo: '市', time: '日', share: 0.37, products: [
      { name: '螺纹钢', share: 0.68, materials: ['HRB400E', 'HRB500E'], bands: ['Φ12–14', 'Φ16–25', 'Φ28–40'], bandShare: [0.2, 0.62, 0.18], price: 3420, attrs: '直径、长度' },
      { name: '盘螺', share: 0.2, materials: ['HRB400E'], bands: ['Φ6–8', 'Φ10–12'], bandShare: [0.55, 0.45], price: 3630, attrs: '直径' },
      { name: '高线', share: 0.12, materials: ['HPB300', 'Q195'], bands: ['Φ6.5', 'Φ8–10'], bandShare: [0.4, 0.6], price: 3590, attrs: '直径' } ] },
    { name: '热轧板卷', depth: 'L4', geo: '市', time: '日', share: 0.21, products: [
      { name: '热轧卷板', share: 0.84, materials: ['Q235B', 'Q355B', 'SPHC'], bands: ['1.5–3.0mm', '3.0–6.0mm', '6.0–12.0mm', '12.0mm 以上'], bandShare: [0.18, 0.46, 0.28, 0.08], price: 3560, attrs: '厚度、宽度' },
      { name: '热轧带钢', share: 0.16, materials: ['Q195', 'Q235B'], bands: ['2.0–4.0mm', '4.0mm 以上'], bandShare: [0.7, 0.3], price: 3480, attrs: '厚度、宽度' } ] },
    { name: '中厚板', depth: 'L4', geo: '市', time: '日', share: 0.1, products: [
      { name: '普碳中厚板', share: 0.58, materials: ['Q235B'], bands: ['8–20mm', '20–40mm', '40mm 以上'], bandShare: [0.56, 0.32, 0.12], price: 3680, attrs: '厚度、宽度、长度' },
      { name: '低合金中厚板', share: 0.42, materials: ['Q355B', 'Q390B'], bands: ['8–20mm', '20–40mm', '40mm 以上'], bandShare: [0.5, 0.34, 0.16], price: 3870, attrs: '厚度、宽度、长度' } ] },
    { name: '冷轧及涂镀', depth: 'L3', geo: '市', time: '日', share: 0.09, products: [
      { name: '冷轧卷板', share: 0.45, materials: ['DC01', 'SPCC'], bands: ['0.3–0.5mm', '0.5–1.0mm', '1.0–2.0mm'], bandShare: [0.15, 0.5, 0.35], price: 4180, attrs: '厚度、宽度' },
      { name: '镀锌板卷', share: 0.4, materials: ['DX51D+Z', 'SGCC'], bands: ['0.4–0.8mm', '0.8–1.5mm', '1.5mm 以上'], bandShare: [0.4, 0.45, 0.15], price: 4390, attrs: '厚度、宽度、锌层' },
      { name: '彩涂板卷', share: 0.15, materials: ['TDC51D+Z'], bands: ['0.3–0.5mm', '0.5mm 以上'], bandShare: [0.6, 0.4], price: 5650, attrs: '厚度、宽度、涂层' } ] },
    { name: '管材', depth: 'L3', geo: '市', time: '日', share: 0.08, products: [
      { name: '焊管', share: 0.36, materials: ['Q195', 'Q235B'], bands: ['DN15–50', 'DN65–150', 'DN200 以上'], bandShare: [0.45, 0.4, 0.15], price: 3790, attrs: '外径、壁厚' },
      { name: '镀锌管', share: 0.22, materials: ['Q235B'], bands: ['DN15–50', 'DN65–150'], bandShare: [0.6, 0.4], price: 4480, attrs: '外径、壁厚' },
      { name: '无缝管', share: 0.26, materials: ['20#', '45#', 'Q355B'], bands: ['Φ57 以下', 'Φ57–159', 'Φ159 以上'], bandShare: [0.25, 0.5, 0.25], price: 4620, attrs: '外径、壁厚' },
      { name: '方矩管', share: 0.16, materials: ['Q235B'], bands: ['边长 100 以下', '边长 100 以上'], bandShare: [0.6, 0.4], price: 3760, attrs: '边长、壁厚' } ] },
    { name: '型钢', depth: 'L4', geo: '市', time: '日', share: 0.07, products: [
      { name: 'H 型钢', share: 0.46, materials: ['Q235B', 'Q355B'], bands: ['HW 系列', 'HM 系列', 'HN 系列'], bandShare: [0.3, 0.25, 0.45], price: 3520, attrs: '型号' },
      { name: '工字钢', share: 0.18, materials: ['Q235B'], bands: ['10#–25#', '28#–63#'], bandShare: [0.6, 0.4], price: 3610, attrs: '型号' },
      { name: '槽钢', share: 0.18, materials: ['Q235B'], bands: ['5#–16#', '18#–40#'], bandShare: [0.65, 0.35], price: 3600, attrs: '型号' },
      { name: '角钢', share: 0.18, materials: ['Q235B', 'Q355B'], bands: ['边宽 75 以下', '边宽 80 以上'], bandShare: [0.6, 0.4], price: 3640, attrs: '型号' } ] },
    { name: '优特钢', depth: 'L3', geo: '省', time: '旬', share: 0.06, products: [
      { name: '碳结钢', share: 0.42, materials: ['45#', '20#'], bands: ['Φ16–50', 'Φ55–120', 'Φ130 以上'], bandShare: [0.35, 0.45, 0.2], price: 3890, attrs: '直径' },
      { name: '合结钢', share: 0.3, materials: ['40Cr', '42CrMo'], bands: ['Φ16–50', 'Φ55–120', 'Φ130 以上'], bandShare: [0.3, 0.45, 0.25], price: 4350, attrs: '直径' },
      { name: '轴承钢', share: 0.14, materials: ['GCr15'], bands: ['Φ16–50', 'Φ55 以上'], bandShare: [0.55, 0.45], price: 4720, attrs: '直径' },
      { name: '齿轮钢', share: 0.14, materials: ['20CrMnTi'], bands: ['Φ16–50', 'Φ55 以上'], bandShare: [0.5, 0.5], price: 4480, attrs: '直径' } ] },
    { name: '不锈钢', depth: 'L2', geo: '省', time: '旬', share: 0.02, products: [
      { name: '不锈钢冷轧卷板', share: 0.7, materials: ['304', '201', '316L'], bands: ['0.5–1.0mm', '1.0–2.0mm', '2.0–3.0mm'], bandShare: [0.4, 0.42, 0.18], price: 13450, attrs: '厚度、宽度' },
      { name: '不锈钢热轧卷板', share: 0.3, materials: ['304'], bands: ['3.0–6.0mm', '6.0mm 以上'], bandShare: [0.6, 0.4], price: 12980, attrs: '厚度、宽度' } ] },
  ];

  /* ---------------- 地区：share 为示例数据池内的销量占比，ent 为池内企业数（仅内部用于生成区间） */
  const provinces = [
    { name: '江苏', file: 'jiangsu', region: '华东', share: 0.168, ent: 34, cities: [['苏州市', 0.24, 9], ['无锡市', 0.2, 8], ['南京市', 0.16, 7], ['常州市', 0.11, 6], ['徐州市', 0.09, 5], ['南通市', 0.08, 5], ['扬州市', 0.05, 5], ['连云港市', 0.04, 5], ['宿迁市', 0.03, 2]] },
    { name: '浙江', file: 'zhejiang', region: '华东', share: 0.122, ent: 24, cities: [['杭州市', 0.34, 8], ['宁波市', 0.28, 7], ['绍兴市', 0.14, 5], ['温州市', 0.12, 5], ['嘉兴市', 0.08, 3], ['金华市', 0.04, 2]] },
    { name: '上海', file: 'shanghai', muni: true, region: '华东', share: 0.108, ent: 19, cities: [['上海市', 1, 19]] },
    { name: '山东', file: 'shandong', region: '华东', share: 0.098, ent: 18, cities: [['济南市', 0.3, 6], ['青岛市', 0.26, 6], ['临沂市', 0.2, 5], ['潍坊市', 0.14, 5], ['淄博市', 0.1, 3]] },
    { name: '广东', file: 'guangdong', region: '华南', share: 0.092, ent: 17, cities: [['佛山市', 0.42, 8], ['广州市', 0.3, 6], ['东莞市', 0.16, 5], ['深圳市', 0.12, 4]] },
    { name: '河北', file: 'hebei', region: '华北', share: 0.071, ent: 13, cities: [['唐山市', 0.44, 6], ['石家庄市', 0.3, 5], ['邯郸市', 0.26, 5]] },
    { name: '安徽', file: 'anhui', region: '华东', share: 0.058, ent: 11, cities: [['合肥市', 0.52, 6], ['马鞍山市', 0.3, 5], ['芜湖市', 0.18, 3]] },
    { name: '河南', file: 'henan', region: '华中', share: 0.049, ent: 9, cities: [['郑州市', 0.7, 6], ['洛阳市', 0.3, 3]] },
    { name: '天津', file: 'tianjin', muni: true, region: '华北', share: 0.044, ent: 8, cities: [['天津市', 1, 8]] },
    { name: '湖北', file: 'hubei', region: '华中', share: 0.041, ent: 7, cities: [['武汉市', 1, 7]] },
    { name: '福建', file: 'fujian', region: '华东', share: 0.036, ent: 7, cities: [['福州市', 0.55, 5], ['厦门市', 0.45, 3]] },
    { name: '四川', file: 'sichuan', region: '西南', share: 0.031, ent: 6, cities: [['成都市', 1, 6]] },
    { name: '湖南', file: 'hunan', region: '华中', share: 0.026, ent: 5, cities: [['长沙市', 1, 5]] },
    { name: '陕西', file: 'shanxi1', region: '西北', share: 0.021, ent: 5, cities: [['西安市', 1, 5]] },
    { name: '辽宁', file: 'liaoning', region: '东北', share: 0.014, ent: 5, cities: [['沈阳市', 0.6, 3], ['大连市', 0.4, 2]] },
    { name: '江西', file: 'jiangxi', region: '华东', share: 0.009, ent: 4, cities: [['南昌市', 1, 4]] },
    { name: '重庆', file: 'chongqing', muni: true, region: '西南', share: 0.007, ent: 3, cities: [['重庆市', 1, 3]] },
    { name: '甘肃', file: 'gansu', region: '西北', share: 0.005, ent: 2, cities: [['兰州市', 1, 2]] },
  ];
  const allProvinceNames = ['北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江', '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北', '湖南', '广东', '广西', '海南', '重庆', '四川', '贵州', '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆', '台湾', '香港', '澳门'];

  /* ---------------- 上游示例：东岳钢铁（虚构） */
  const POOL = { total: 186, active: 183, frozen: 2, paused: 1 };
  /* 环比、同比由 kpiOf 按每日序列计算，这里只放三个基础量 */
  const KPI = { sales: 86420, stock: 1268350, avg7: 81930, days: 15.5 };
  const BRAND = { name: '东岳', sales: 21870, share: 25.3, stock: 286400, days: 13.9 };

  /* 近 n 日销量 / 库存序列（周末走低） */
  const dailySeries = (n, base, seed, opts) => {
    opts = opts || {};
    const r = rngOf(seed);
    const end = new Date(DATA_DATE + 'T00:00:00');
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(end); d.setDate(d.getDate() - i);
      const wd = d.getDay();
      const wk = wd === 0 ? 0.62 : wd === 6 ? 0.78 : 1.06;
      const trend = 1 + (opts.trend || 0) * ((n - i) / n);
      out.push({ date: d, label: (d.getMonth() + 1) + '-' + String(d.getDate()).padStart(2, '0'), v: Math.round(base * wk * trend * (0.93 + r() * 0.14)) });
    }
    return out;
  };
  const stockSeries = (n, endVal, seed, drift) => {
    const r = rngOf(seed);
    const out = []; let v = endVal;
    for (let i = 0; i < n; i++) { out.unshift(Math.round(v)); v = v * (1 + (drift || 0.002) + (r() - 0.5) * 0.008); }
    return out;
  };

  /* ---------------- 下游企业生成（虚构名称） */
  const SHOP = ['恒运', '鑫盛', '瑞丰', '华昌', '永泰', '金汇', '同创', '宏达', '顺通', '广源', '嘉禾', '万隆', '正阳', '天润', '久隆', '联众', '佳合', '博远', '裕丰', '兴盛', '东方', '中泰', '海纳', '锦程', '百川', '启航', '国联', '长风', '盛达', '汇通', '鼎力', '安信', '宝源', '协力', '荣昌', '泰和', '志诚', '双赢', '凯达', '明辉'];
  const SUFFIX = ['钢铁贸易有限公司', '物资有限公司', '金属材料有限公司', '钢铁有限公司', '供应链管理有限公司', '实业有限公司', '物贸有限公司'];
  const SCALE = ['5 万吨以下', '5–20 万吨', '20–50 万吨', '50–100 万吨', '100 万吨以上'];
  const MAIN_CAT = ['建筑钢材', '建筑钢材', '建筑钢材', '热轧板卷', '热轧板卷', '中厚板', '冷轧及涂镀', '管材', '型钢', '优特钢', '不锈钢', '综合'];
  const CAT_ABBR = { 建筑钢材: '建材', 热轧板卷: '热卷', 中厚板: '中板', 冷轧及涂镀: '冷镀', 管材: '管材', 型钢: '型钢', 优特钢: '优特', 不锈钢: '不锈', 综合: '综合' };
  const MILLS = ['东岳钢铁', '金江钢铁', '海川特钢', '云岭钢铁', '北辰钢铁', '瀚阳钢铁', '昆仑钢铁', '南粤钢铁', '中洲钢铁', '汉江钢铁'];
  const COVER = ['全量上传', '全量上传', '全量上传', '部分上传：仅主营大类', '部分上传：指定仓库', '部分上传：指定品牌'];
  const enterprises = (n, seed) => {
    const r = rngOf(seed || 7);
    const pick = (arr) => arr[Math.floor(r() * arr.length)];
    const flat = [];
    provinces.forEach((p) => p.cities.forEach((c) => { for (let i = 0; i < Math.max(1, Math.round(c[2])); i++) flat.push({ prov: p.name, city: c[0], region: p.region }); }));
    const list = [];
    const used = {};
    for (let i = 0; i < n; i++) {
      const loc = flat[Math.floor(r() * flat.length)];
      const cat = pick(MAIN_CAT);
      let nm;
      do { nm = loc.city.replace(/(市|新区|区)$/, '') + pick(SHOP) + pick(SUFFIX); } while (used[nm]);
      used[nm] = 1;
      const mode = r() < 0.58 ? '实名' : '匿名';
      const sc = r(); const scale = sc < 0.38 ? SCALE[0] : sc < 0.72 ? SCALE[1] : sc < 0.9 ? SCALE[2] : sc < 0.97 ? SCALE[3] : SCALE[4];
      const q = r(); const quality = q < 0.42 ? 'A' : q < 0.82 ? 'B' : 'C';
      const a = r(); const activity = a < 0.8 ? '活跃' : a < 0.95 ? '一般' : '停更';
      const months = 2 + Math.floor(r() * 22);
      const brands = [pick(MILLS)]; if (r() < 0.5) { const b = pick(MILLS); if (b !== brands[0]) brands.push(b); }
      list.push({
        id: 'E' + String(100001 + i), name: nm, mode, anon: loc.region + '·' + CAT_ABBR[cat] + '·A' + String(1000 + Math.floor(r() * 8999)).slice(-4),
        prov: loc.prov, city: loc.city, region: loc.region, cat, scale, quality, activity, months, brands, cover: pick(COVER),
        priceOn: r() < 0.41, grain: r() < 0.66 ? '单据行级' : '按日汇总', related: r() < 0.04,
      });
    }
    list.forEach((e) => { e.display = e.mode === '实名' ? e.name : e.anon; });
    return list;
  };

  /* 计费示例参数（待业务方确定，D-15） */
  const PRICING = {
    base: 400, yearOff: 0.85, quarterOff: 0.95, minQty: 20, shareRate: 0.2,
    tiers: [
      { min: 20, max: 49, label: '20–49', off: 1 }, { min: 50, max: 99, label: '50–99', off: 0.95 }, { min: 100, max: 199, label: '100–199', off: 0.9 },
      { min: 200, max: 499, label: '200–499', off: 0.85 }, { min: 500, max: 999, label: '500–999', off: 0.8 }, { min: 1000, max: 1e9, label: '1000+', off: 0.75 }],
  };
  const tierOf = (q) => PRICING.tiers.find((t) => q >= t.min && q <= t.max) || (q < 20 ? null : PRICING.tiers[5]);

  /* 库存拆分：聚合看板与多维查询共用同一套拆分结果，保证同一地区、同一品类在两页的库存一致，且各级合计等于上一级 */
  const split = (total, ws) => {
    const s = ws.reduce((a, b) => a + b, 0);
    if (!s) return ws.map(() => 0);
    const out = ws.map((w) => Math.round(total * w / s));
    out[out.indexOf(Math.max.apply(null, out))] += total - out.reduce((a, b) => a + b, 0);
    return out;
  };
  const stockTree = (total, seed) => {
    const cw = (name) => 0.8 + (hash(name + seed) % 42) / 100;
    const provs = split(total, provinces.map((p) => p.share * (0.78 + (hash(p.name + seed) % 45) / 100)));
    const cats = split(total, categories.map((c) => c.share * cw(c.name)));
    const prods = (c) => split(cats[categories.indexOf(c)], c.products.map((p) => p.share * cw(p.name)));
    return {
      provs, cats, prods,
      prov: (name) => provs[provinces.findIndex((p) => p.name === name)],
      cities: (p) => split(provs[provinces.indexOf(p)], p.cities.map((c) => c[1] * (0.8 + (hash(c[0] + seed) % 40) / 100))),
      leaf: (c, p, names, ws) => split(prods(c)[c.products.indexOf(p)], names.map((n, i) => ws[i] * cw(n))),
    };
  };
  /* ---------------- 销量拆分：聚合看板、多维查询、量价视图共用，保证同一地区、同一品类、同一日期在各页一致 */
  /* 材质权重：单一材质为 1；多材质时首个材质 0.7，其余平分 0.3 */
  const matShare = (p) => p.materials.map((m, i) => (p.materials.length === 1 ? 1 : i === 0 ? 0.7 : 0.3 / (p.materials.length - 1)));
  /* 各省销量占比。流向地为选填字段：只统计已填报流向地的销量（填报覆盖率 DEST_COVER），各省合计小于全口径销量 */
  const DEST_COVER = 0.714;
  const provShares = (mode) => {
    if (mode !== '流向地') return provinces.map((p) => p.share);
    const w = provinces.map((p) => p.share * (0.85 + (hash(p.name + 'd') % 30) / 100));
    const s = w.reduce((a, b) => a + b, 0);
    return w.map((x) => x / s * DEST_COVER);
  };
  /* 本厂品牌在各省的销量份额（与 provinces 顺序一致）：聚合看板“本厂品牌视图”与多维查询的品牌筛选共用 */
  const BRAND_SH = [0.38, 0.31, 0.35, 0.22, 0.08, 0.06, 0.33, 0.12, 0.05, 0.1, 0.16, 0.07, 0.3, 0.2, 0.25, 0.15, 0.1, 0.1];
  const BRAND_F = provinces.reduce((a, p, i) => a + p.share * BRAND_SH[i], 0);
  /* 本厂品牌的贡献企业数：只有经销本厂品牌的企业才计入 */
  const brandN = (n, i) => Math.round(n * (0.25 + BRAND_SH[i] * 1.6));
  /* 销量拆分树。mode：仓库所在地 / 流向地；brand：全部 / 本厂 / 其他；sel：筛选的品名（[{c, p}]），不传为全部品类。
     各级合计严格等于上一级；“其他品牌”= 全部 − 本厂 */
  const salesTree = (total, mode, brand, sel) => {
    const pw = provShares(mode), pwSum = pw.reduce((a, b) => a + b, 0);
    const minus = (a, b) => a.map((v, i) => v - b[i]);
    const pick = (all, own) => (brand === '本厂' ? own : brand === '其他' ? minus(all, own) : all);
    const sum = (a) => a.reduce((x, y) => x + y, 0);
    const catsAll = split(total, categories.map((c) => c.share));
    const ownTot = Math.round(total * BRAND_F), catsOwn = split(ownTot, categories.map((c) => c.share));
    const prodsOf = (cats, c) => split(cats[categories.indexOf(c)], c.products.map((p) => p.share));
    const selOf = (cats) => (sel ? sum(sel.map((s) => prodsOf(cats, s.c)[s.c.products.indexOf(s.p)])) : sum(cats));
    const gAll = selOf(catsAll), gOwn = selOf(catsOwn);
    const provsAll = split(Math.round(gAll * pwSum), pw);
    const provsOwn = mode === '流向地' ? split(Math.round(sum(provsAll.map((v, i) => v * BRAND_SH[i]))), pw.map((w, i) => w * BRAND_SH[i])) : split(gOwn, pw.map((w, i) => w * BRAND_SH[i]));
    const provs = pick(provsAll, provsOwn);
    const cityW = (p) => p.cities.map((c) => c[1]);
    const prods = (c) => pick(prodsOf(catsAll, c), prodsOf(catsOwn, c));
    return {
      provs, total: pick([gAll], [gOwn])[0],
      cats: pick(catsAll, catsOwn), prods,
      prov: (name) => provs[provinces.findIndex((p) => p.name === name)],
      cities: (p) => { const i = provinces.indexOf(p); return pick(split(provsAll[i], cityW(p)), split(provsOwn[i], cityW(p))); },
      leaf: (c, p, ws) => { const j = c.products.indexOf(p); return pick(split(prodsOf(catsAll, c)[j], ws), split(prodsOf(catsOwn, c)[j], ws)); },
    };
  };
  /* 本厂品牌的渠道库存：各省 = 该省库存 × 本厂份额 × 库存偏离系数 */
  const brandStock = (tree, seed) => provinces.map((p, i) => Math.round(tree.provs[i] * BRAND_SH[i] * (0.72 + (hash(p.name + 'b' + seed) % 40) / 100)));
  /* 行合计、列合计都严格相等的整数交叉表：单元格约等于 行合计 × 列合计 ÷ 总计 */
  const split2 = (rowTot, colTot) => {
    const T = rowTot.reduce((a, b) => a + b, 0);
    if (!T) return rowTot.map(() => colTot.map(() => 0));
    const exact = rowTot.map((r) => colTot.map((c) => r * c / T));
    const cell = exact.map((row) => row.map((v) => Math.floor(v)));
    const rr = rowTot.map((r, i) => r - cell[i].reduce((a, b) => a + b, 0));
    const cc = colTot.map((c, j) => c - cell.reduce((a, row) => a + row[j], 0));
    const order = [];
    exact.forEach((row, i) => row.forEach((v, j) => order.push([v - Math.floor(v), i, j])));
    order.sort((a, b) => b[0] - a[0]);
    for (let pass = 0; pass < 3; pass++) order.forEach(([f, i, j]) => { if (rr[i] > 0 && cc[j] > 0) { cell[i][j]++; rr[i]--; cc[j]--; } });
    return cell;
  };
  const ymd = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const WK = (d) => { const wd = d.getDay(); return wd === 0 ? 0.62 : wd === 6 ? 0.78 : 1.06; };
  /* 近 30 日每日销量与日末库存：最后一天等于“昨日销量”，最近 7 日均值等于“近 7 日日均销量”，最后一天库存等于“昨日日末库存” */
  const dailyCache = {};
  const daily = (K, seed) => {
    const key = seed + '|' + K.sales + '|' + K.avg7 + '|' + K.stock;
    if (dailyCache[key]) return dailyCache[key];
    const ds = dailySeries(30, K.avg7 * 1.02, hash('d' + seed), { trend: 0.04 });
    const v = ds.map((d) => d.v), n = v.length; v[n - 1] = K.sales;
    const want = Math.round(K.avg7 * 7) - K.sales, got = v.slice(n - 7, n - 1).reduce((a, b) => a + b, 0);
    let acc = 0; for (let i = n - 7; i < n - 1; i++) { v[i] = Math.round(v[i] * want / got); acc += v[i]; } v[n - 2] += want - acc;
    const st = stockSeries(30, K.stock, hash('s' + seed), 0.0016);
    const out = ds.map((d, i) => ({ date: d.date, key: ymd(d.date), label: d.label, sales: v[i], stock: st[i] }));
    out.byKey = {}; out.forEach((d) => { out.byKey[d.key] = d; });
    return (dailyCache[key] = out);
  };
  /* 任意一天的全口径销量与日末库存：30 日窗口内取每日序列；窗口外按日均、星期系数、月度季节系数推算，
     周、旬、月各粒度都由同一套每日数据加总，保证不同粒度、不同页面互相对得上 */
  const SEASON = [0.86, 0.7, 0.95, 1, 1.02, 1, 0.97, 0.98, 1.01, 1, 1, 0.93];
  const salesOn = (K, seed, d) => {
    const k = ymd(d), hit = daily(K, seed).byKey[k];
    return hit ? hit.sales : Math.round(K.avg7 * WK(d) * SEASON[d.getMonth()] * 0.985 * (0.93 + (hash(seed + 'v' + k) % 1000) / 1000 * 0.14));
  };
  /* 上年同期销量（按对应日期）：窗口内取同期序列，窗口外按当日销量折算 */
  const yoyOn = (K, seed, d) => {
    const k = ymd(d), dl = daily(K, seed);
    if (!dl.yoy) { dl.yoy = {}; dailySeries(30, K.avg7, hash('y' + seed)).forEach((x, i) => { dl.yoy[dl[i].key] = x.v; }); }
    return dl.yoy[k] != null ? dl.yoy[k] : Math.round(salesOn(K, seed, d) * (0.92 + (hash(seed + 'y' + k) % 600) / 10000));
  };
  const between = (fn) => (K, seed, from, to) => {
    let s = 0; const d = new Date(from + 'T00:00:00'), end = new Date(to + 'T00:00:00');
    for (let i = 0; i < 1200 && d <= end; i++) { s += fn(K, seed, d); d.setDate(d.getDate() + 1); }
    return s;
  };
  const salesBetween = between(salesOn), yoyBetween = between(yoyOn);
  const stockOn = (K, seed, key) => {
    const dl = daily(K, seed);
    if (dl.byKey[key]) return dl.byKey[key].stock;
    if (!dl.old) {
      dl.old = {}; let v = dl[0].stock; const d = new Date(dl[0].date);
      for (let i = 0; i < 800; i++) { d.setDate(d.getDate() - 1); const k = ymd(d); v = v * (1 + 0.00015 + ((hash(seed + 's' + k) % 1000) / 1000 - 0.5) * 0.006); dl.old[k] = Math.round(v); }
    }
    return dl.old[key] == null ? null : dl.old[key];
  };
  /* 趋势序列（日、周、旬、月）：销量为周期内每日销量之和，期末库存为周期最后一天的日末库存 */
  const trendSeries = (K, seed, g, count) => {
    const dl = daily(K, seed);
    if (g === '日') {
      return { x: dl.map((d) => d.label), sales: dl.map((d) => d.sales), yoy: dl.map((d) => yoyOn(K, seed, d.date)), stock: dl.map((d) => d.stock), marks: [{ x: '11-01', name: '口径变更' }], ranges: dl.map((d) => [d.key, d.key]) };
    }
    const n = count || 12, x = [], ranges = [];
    const D = (y, m, d) => new Date(y, m - 1, d);
    if (g === '周') for (let i = n - 1; i >= 0; i--) { const a = new Date(DATA_DATE + 'T00:00:00'); a.setDate(a.getDate() - i * 7 - 6); const b = new Date(a); b.setDate(b.getDate() + 6); x.push((a.getMonth() + 1) + '/' + a.getDate() + ' 周'); ranges.push([ymd(a), ymd(b)]); }
    /* 旬只取完整的旬：最新为 11 月中旬（11-11 至 11-20） */
    if (g === '旬') { const names = ['上旬', '中旬', '下旬']; let yr = 2026, mth = 11, t = 1; for (let i = 0; i < n; i++) { x.unshift((yr === 2026 ? '' : yr + ' 年 ') + mth + ' 月' + names[t]); ranges.unshift([ymd(D(yr, mth, t * 10 + 1)), ymd(t === 2 ? D(yr, mth + 1, 0) : D(yr, mth, t * 10 + 10))]); t--; if (t < 0) { t = 2; mth--; if (mth < 1) { mth = 12; yr--; } } } }
    if (g === '月') for (let i = n - 1; i >= 0; i--) { const a = new Date(2026, 10 - i, 1); x.push(a.getFullYear() + '-' + String(a.getMonth() + 1).padStart(2, '0')); ranges.push([ymd(a), i === 0 ? DATA_DATE : ymd(new Date(2026, 11 - i, 0))]); }
    const sales = ranges.map((rg) => salesBetween(K, seed, rg[0], rg[1]));
    const yoy = ranges.map((rg) => yoyBetween(K, seed, rg[0], rg[1]));
    const stock = ranges.map((rg) => stockOn(K, seed, rg[1]));
    const marks = g === '月' ? [{ x: '2026-11', name: '口径变更' }, { x: '2026-08', name: '口径变更' }] : g === '旬' ? [{ x: '11 月上旬', name: '口径变更' }] : [{ x: x[n - 4], name: '口径变更' }];
    return { x, sales, yoy, stock, marks, ranges };
  };

  /* 指标卡的环比、同比：全部由上面的每日序列算出，与趋势图一致 */
  const kpiOf = (K0, seed) => {
    const K = Object.assign({}, K0), dl = daily(K, seed), n = dl.length, pct = (a, b) => +((a / b - 1) * 100).toFixed(1);
    const yoyD = dl.map((d) => yoyOn(K, seed, d.date));
    const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const prev7 = mean(dl.slice(n - 14, n - 7).map((d) => d.sales)), yoy7 = mean(yoyD.slice(n - 7));
    const lastYear = new Date(dl[n - 1].date); lastYear.setFullYear(lastYear.getFullYear() - 1);
    const stockLy = stockOn(K, seed, ymd(lastYear));
    K.salesMom = pct(K.sales, dl[n - 8].sales); K.salesYoy = pct(K.sales, yoyD[n - 1]);
    K.stockMom = pct(K.stock, dl[n - 2].stock); K.stockYoy = pct(K.stock, stockLy);
    K.avg7Mom = pct(K.avg7, prev7); K.avg7Yoy = pct(K.avg7, yoy7);
    K.days = +(K.stock / K.avg7).toFixed(1);
    K.daysMom = +(K.stock / K.avg7 - dl[n - 8].stock / prev7).toFixed(1); K.daysYoy = +(K.stock / K.avg7 - stockLy / yoy7).toFixed(1);
    return K;
  };

  /* 示例规格的涨跌（元/吨）：看板“量价速览”与量价视图共用 */
  const DAY_CHG = { 螺纹钢: 10, 热轧卷板: -20, 普碳中厚板: 0, 冷轧卷板: -10 };
  const dayChg = (name) => (name in DAY_CHG ? DAY_CHG[name] : (hash(name) % 5 - 2) * 10);
  const periodChg = (name, g) => ({ 日: dayChg(name), 周: -30, 旬: -20, 月: 40 }[g]);

  /* 价格样本（引擎内部值）：聚合看板“量价速览”、多维查询的价格列、量价视图的指标卡、分地区表、交叉表都从这里取，
     同一品名、材质、规格段、地区的均价、涨跌、覆盖率、有价企业数在各处一致。
     o: { material, band, weight, prov, city, grain }，不传 prov 为全国口径 */
  const nOf = (share, total) => Math.min(total || POOL.total, Math.round((total || POOL.total) * Math.pow(share, 0.55) * 1.1));
  /* 分地区的贡献企业数系数：品类越窄，在该地区有此品类销量的企业越少 */
  const nReg = (sh) => Math.min(1, Math.pow(sh, 0.25) * 1.25);
  const productOf = (name) => { let p; categories.forEach((c) => c.products.forEach((x) => { if (x.name === name) p = Object.assign({ cat: c }, x); })); return p; };
  const priceCell = (name, o) => {
    o = o || {};
    const PV = window.STP.PV, p = productOf(name);
    const mi = p.materials.indexOf(o.material), bi = p.bands.indexOf(o.band);
    const wF = !o.weight || o.weight === '全部' ? 1 : o.weight === '理计' ? 0.62 : 0.38;
    const sh = p.cat.share * p.share * (bi >= 0 ? p.bandShare[bi] : 1) * (mi < 0 ? 1 : matShare(p)[mi]) * wF;
    const prov = o.prov ? provinces.find((x) => x.name === o.prov) : null;
    const city = prov && o.city ? prov.cities.find((c) => c[0] === o.city) : null;
    const rname = city ? city[0] : prov ? prov.name : '全国';
    let n, cover, pn;
    if (!prov) { n = Math.max(1, nOf(sh)); cover = 0.22 + (hash(p.name + '全国') % 30) / 100; pn = Math.round(n * (0.42 + cover * 0.5)); }
    else { const ent = city ? city[2] : prov.ent; n = Math.max(1, Math.round(ent * nReg(sh))); cover = 0.18 + (hash(p.name + rname) % 52) / 100; pn = Math.round(n * (0.5 + cover * 0.6)); }
    /* 样本稀疏、最细时间粒度为旬的品类不提供日、周粒度 */
    const grain = o.grain || (p.cat.time === '旬' ? '旬' : '日');
    const raw = p.price + Math.max(0, mi) * 160 + (bi < 0 ? 0 : (bi - 1) * 30) + (o.weight === '磅计' ? 60 : o.weight === '理计' ? -30 : 0) + (prov ? (hash(prov.name) % 9 - 4) * 10 : 0) + (city ? (hash(city[0]) % 5 - 2) * 10 : 0);
    const okVol = n >= PV.k, ok = okVol && pn >= PV.kPrice;
    return { n, pn, cover, sh, rshare: city ? prov.share * city[1] : prov ? prov.share : 1, grain, raw, price: Math.round(raw / 10) * 10, chg: periodChg(name, grain) + (prov ? (hash(rname + grain) % 3 - 1) * 10 : 0), okVol, ok };
  };
  /* 某地区按规格段（标准化到规格段的品类）或材质展开的一行价格：有价样本不足的屏蔽；
     只剩 1 个被屏蔽时，追加屏蔽有价企业数最少的可见单元格 */
  const priceDim = (p) => (p.cat.depth >= 'L4' ? 'band' : p.cat.depth === 'L3' ? 'material' : '');
  const priceRow = (name, o) => {
    const p = productOf(name), dim = priceDim(p);
    if (!dim) return [];
    const row = (dim === 'band' ? p.bands : p.materials).map((b) => { const q = Object.assign({}, o); q[dim] = b; const cell = priceCell(name, q); return { col: b, cell, show: cell.ok }; });
    if (row.length > 1 && row.filter((c) => !c.show).length === 1) { const v = row.filter((c) => c.show).sort((a, b) => a.cell.pn - b.cell.pn)[0]; if (v) v.show = false; }
    return row;
  };
  /* 带披露结论的价格单元格：show 为 false 时页面一律显示为屏蔽 */
  const priceOf = (name, o) => {
    o = o || {};
    const cell = priceCell(name, o), dim = priceDim(productOf(name));
    let show = cell.ok;
    if (show && dim && o[dim]) { const hit = priceRow(name, o).find((c) => c.col === o[dim]); if (hit) show = hit.show; }
    /* 日粒度下有价样本偏少（不足 16 家）时，周末成交稀疏达不到门槛，上一日价格屏蔽，涨跌随之屏蔽 */
    return Object.assign(cell, { show, chgShow: show && !(cell.grain === '日' && cell.pn < 16) });
  };
  /* 均价的历史序列（长度 n，最后一项为最新一期）：从最新一期往前推，同一条件在任何页面取到的同一期数值相同 */
  const priceTrail = (name, o, n) => {
    o = o || {};
    const c = priceCell(name, o), g = c.grain, r = rngOf(hash('pt' + name + [o.material || '', o.band || '', o.weight || '全部', o.prov || '', o.city || '', g].join('|')));
    const out = [c.price, c.price - c.chg]; let w = 0;
    for (let k = 2; k < n; k++) { w += (r() - 0.54) * (g === '日' ? 36 : 64); out.push(Math.round((c.price - c.chg + w) / 10) * 10); }
    return out.slice(0, n).reverse();
  };
  /* 本厂品牌、其他品牌相对全部品牌均价的差（元/吨）；k 为距最新一期的期数 */
  const brandOff = (name, kind, k) => (kind === '本厂' ? (k === 0 ? 20 : 10 + (hash(name + 'own' + k) % 3) * 10) : (k === 0 ? -10 : -10 + (hash(name + 'oth' + k) % 2) * 10));
  const priceSample = (name, material, band) => priceOf(name, { material, band });
  /* 某品名（可再限定规格段、材质、计重方式）在一个周期内的全国销量：total 为该周期全口径销量 */
  const specSales = (total, name, o) => {
    o = o || {};
    const p = productOf(name), c = p.cat, pp = c.products.find((x) => x.name === name);
    const mi = pp.materials.indexOf(o.material), bi = pp.bands.indexOf(o.band), ms = matShare(pp);
    let v = salesTree(total, '仓库所在地', '全部', [{ c, p: pp }]).total;
    if (bi >= 0) { v = split(v, pp.bandShare)[bi]; if (mi >= 0) v = Math.round(v * ms[mi]); }
    else if (mi >= 0) v = split(v, ms)[mi];
    return !o.weight || o.weight === '全部' ? v : Math.round(v * (o.weight === '理计' ? 0.62 : 0.38));
  };

  window.M = { TODAY, DATA_DATE, rngOf, hash, split, split2, stockTree, salesTree, brandStock, brandN, BRAND_SH, BRAND_F, yoyOn, yoyBetween, priceOf, priceRow, priceTrail, brandOff, specSales, matShare, provShares, DEST_COVER, daily, salesOn, salesBetween, stockOn, trendSeries, kpiOf, ymd, dayChg, periodChg, priceSample, priceCell, productOf, nOf, nReg, categories, provinces, allProvinceNames, POOL, KPI, BRAND, dailySeries, stockSeries, enterprises, SCALE, MILLS, CAT_ABBR, PRICING, tierOf };
})();
