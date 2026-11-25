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
    { name: '管材', depth: 'L4', geo: '市', time: '日', share: 0.08, products: [
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
    base: 400, yearOff: 0.85, quarterOff: 0.95, minQty: 20,
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

  /* ---------------- 分品类的统计维度与计量单位（业务方 2026-11-25 确认，对应需求文档 V0.4 的 6.10、9.11、10.5）
   * 管材 = 规格 + 壁厚；板材 = 厚度 + 宽度；建材 = 规格；型材 = 规格 + 公斤段或负差段（N-46 已确认：按品名固定其一，在品类主数据逐个品名配置）；其他品类 = 规格。
   * 钢材按吨位统计，非钢材按数量统计，两者不合并相加；非钢材不同数量单位之间也不相加。
   * 分段方式待业务方确定，下面的分段数值、上卷保留成员数全部是示例参数。
   * 上游看板、多维查询、量价视图、导出中心，以及运营后台品类主数据、颗粒度监控共用这一套定义与上卷结果。 */
  const DIM_TPL = {
    建材: { key: '建材', name: '建材', measure: '吨位', dims: [{ name: '规格', note: '公称直径', type: '离散', unit: 'mm', key: 'diameter' }], path: ['规格', '规格段', '品名'], eg: '螺纹钢、盘螺、高线' },
    板材: { key: '板材', name: '板材', measure: '吨位', dims: [{ name: '厚度', type: '连续', unit: 'mm', key: 'thickness' }, { name: '宽度', type: '连续', unit: 'mm', key: 'width' }], path: ['厚度段 × 宽度段', '厚度段（不分宽度）', '品名'], eg: '热轧、中厚板、冷轧及涂镀' },
    管材: { key: '管材', name: '管材', measure: '吨位', dims: [{ name: '规格', note: '外径或公称口径；方矩管为截面边长', type: '离散', unit: 'mm', key: 'outerDiameter / nominalSize' }, { name: '壁厚', type: '连续', unit: 'mm', key: 'wallThickness' }], path: ['规格 × 壁厚段', '规格（不分壁厚）', '规格段', '品名'], eg: '焊管、镀锌管、无缝管、方矩管' },
    型材: { key: '型材', name: '型材', measure: '吨位', dims: [{ name: '规格', note: '型号', type: '离散', unit: '', key: 'sectionModel' }, { name: '公斤段或负差段', note: '按品名固定其一，在主数据逐个品名配置', type: '连续', unit: 'kg/m 或 %', key: 'unitWeightKg / negTolerancePct' }], path: ['规格 × 公斤段或负差段（按品名固定）', '规格（不分段）', '规格段（型号系列）', '品名'], eg: 'H 型钢、工字钢、槽钢、角钢' },
    其他: { key: '其他', name: '其他品类', measure: '吨位或数量', dims: [{ name: '规格', type: '离散', unit: '', key: 'spec' }], path: ['规格', '规格段（如已定义）', '品名'], eg: '优特钢、不锈钢、非钢材品类' },
  };
  const CAT_TPL = { 建筑钢材: '建材', 热轧板卷: '板材', 中厚板: '板材', 冷轧及涂镀: '板材', 管材: '管材', 型钢: '型材', 优特钢: '其他', 不锈钢: '其他' };
  /* 分段字典版本（示例）。连续型维度的段为左闭右开区间，首段、末段为开口区间 */
  const BAND_VER = { ver: 'BD-2026.11', eff: '2026-11-01', prev: 'BD-2026.08', keep: 2 };
  const WALL = ['2.0mm 以下', '2.0–3.0mm', '3.0–4.5mm', '4.5mm 以上'], NEG = ['3% 以内', '3%–5%', '5%–8%', '8% 以上'];
  /* 型材第二维度按品名固定（N-46，2026-11-25 确认）：有的品名用公斤段，有的用负差段，在品类主数据逐个品名配置；一个品名只有一种，上游不能切换。
     公斤段的定义（示例参数）：各型号的每米公斤数不同，字典按“实际每米重量 ÷ 理论每米重量”归段，再按理论重量表换算出各型号的公斤数区间 */
  const KG_BANDS = ['理重 97% 以上', '理重 95%–97%', '理重 92%–95%', '理重 92% 以下'], KG_CUT = [0.97, 0.95, 0.92];
  const SEC_DIM2 = { 'H 型钢': '负差', 工字钢: '公斤', 槽钢: '公斤', 角钢: '公斤' };
  /* 理论每米重量（kg/m，示例，取自常用型号的国标理论重量） */
  const THEO_KG = { '∠40×4': 2.422, '∠50×5': 3.77, '∠63×6': 5.721, '∠75×7': 7.976, '∠80×8': 9.658, '∠100×10': 15.12, '∠125×12': 22.696, '10# 槽钢': 10.007, '16a 槽钢': 17.24, '20a 工字钢': 27.929, '25a 工字钢': 38.105, 'HW200×200': 49.9, 'HN300×150': 36.7 };
  const kgRange = (model) => { const w = THEO_KG[model]; if (!w) return null; const c = KG_CUT.map((x) => (w * x).toFixed(2)); return [c[0] + ' 以上', c[1] + '–' + c[0], c[2] + '–' + c[1], c[2] + ' 以下']; };
  const W_CR = ['1000mm 以下', '1000–1250mm', '1250mm 及以上'], W_MP = ['2000mm 以下', '2000–2500mm', '2500mm 及以上'];
  /* 第二维度：[维度名, 分段, 各段占比]。连续型维度只披露到段，不披露原始取值 */
  const DIM2 = {
    热轧卷板: ['宽度', ['1250mm 以下', '1250–1500mm', '1500mm 及以上'], [0.34, 0.46, 0.2]], 热轧带钢: ['宽度', ['355mm 以下', '355–600mm', '600mm 及以上'], [0.45, 0.4, 0.15]],
    普碳中厚板: ['宽度', W_MP, [0.3, 0.5, 0.2]], 低合金中厚板: ['宽度', W_MP, [0.26, 0.5, 0.24]],
    冷轧卷板: ['宽度', W_CR, [0.3, 0.52, 0.18]], 镀锌板卷: ['宽度', W_CR, [0.36, 0.5, 0.14]], 彩涂板卷: ['宽度', ['1000mm 以下', '1000mm 及以上'], [0.55, 0.45]],
    焊管: ['壁厚', WALL, [0.14, 0.4, 0.34, 0.12]], 镀锌管: ['壁厚', WALL, [0.1, 0.42, 0.36, 0.12]],
    无缝管: ['壁厚', ['4mm 以下', '4–8mm', '8–16mm', '16mm 以上'], [0.2, 0.42, 0.28, 0.1]], 方矩管: ['壁厚', ['3.0mm 以下', '3.0–6.0mm', '6.0mm 以上'], [0.42, 0.44, 0.14]],
    'H 型钢': ['负差', NEG, [0.34, 0.36, 0.22, 0.08]], 工字钢: ['公斤', KG_BANDS, [0.3, 0.38, 0.24, 0.08]], 槽钢: ['公斤', KG_BANDS, [0.26, 0.4, 0.26, 0.08]], 角钢: ['公斤', KG_BANDS, [0.28, 0.36, 0.26, 0.1]],
  };
  /* 第二维度缺失的数据归入“未分段”，作为该维度下的一个普通成员参与披露判定（PV-80）。占比为示例 */
  const UNBANDED = '未分段', UNBANDED_SH = 0.06;
  /* 单规格（离散的第一维度）：只给示例品名配置，其余品名的第一维度暂到规格段 */
  const DN_S = ['DN15', 'DN20', 'DN25', 'DN32', 'DN40', 'DN50'], DN_M = ['DN65', 'DN80', 'DN100', 'DN125', 'DN150'], DN_L = ['DN200', 'DN250', 'DN300'];
  const FINE = {
    螺纹钢: [['Φ12', 'Φ14'], ['Φ16', 'Φ18', 'Φ20', 'Φ22', 'Φ25'], ['Φ28', 'Φ32', 'Φ36', 'Φ40']],
    焊管: [DN_S, DN_M, DN_L],
    'H 型钢': [['HW100×100', 'HW150×150', 'HW200×200', 'HW250×250', 'HW300×300'], ['HM148×100', 'HM194×150', 'HM244×175', 'HM294×200', 'HM340×250'], ['HN150×75', 'HN200×100', 'HN250×125', 'HN300×150', 'HN350×175', 'HN400×200', 'HN500×200']],
    角钢: [['∠40×4', '∠50×5', '∠63×6', '∠75×7'], ['∠80×8', '∠100×10', '∠125×12']],
    钢筋连接套筒: [['Φ16', 'Φ18', 'Φ20', 'Φ22'], ['Φ25', 'Φ28', 'Φ32'], ['Φ36', 'Φ40']],
  };
  /* 非钢材品类：按数量统计，每个品名一个标准数量单位，不同品名之间不合计，也不计入钢材的吨位合计。
     n 为示例数据池内有该品名销量的企业数（仅内部用于生成区间）；sales、stock 为昨日销量与日末库存；地区只到省，暂不提供价格 */
  const nonSteel = [
    { name: '配套辅材', steel: false, tpl: '其他', depth: 'L4', geo: '省', time: '日', share: 1, products: [
      { name: '钢筋连接套筒', unit: '个', n: 31, sales: 20090, stock: 585700, materials: ['45#'], bands: ['Φ16–22', 'Φ25–32', 'Φ36–40'], bandShare: [0.3, 0.52, 0.18], attrs: '适配钢筋直径' },
      { name: '脚手架扣件', unit: '套', n: 22, sales: 12750, stock: 371700, materials: ['KTH330-08'], bands: ['直角扣件', '旋转扣件', '对接扣件'], bandShare: [0.6, 0.22, 0.18], attrs: '型式' },
      { name: '法兰', unit: '片', n: 12, sales: 5800, stock: 169000, materials: ['Q235B', '20#'], bands: ['DN15–50', 'DN65–150', 'DN200 以上'], bandShare: [0.42, 0.4, 0.18], attrs: '公称通径、压力等级' } ] },
  ];
  categories.forEach((c) => { c.steel = true; c.unit = '吨'; c.tpl = CAT_TPL[c.name]; });
  const allCats = categories.concat(nonSteel);
  const findProd = (name) => { let hit = null; allCats.forEach((c) => c.products.forEach((p) => { if (p.name === name) hit = { c, p }; })); return hit; };
  const unitOf = (name) => { const h = findProd(name); return h ? h.p.unit || h.c.unit : '吨'; };
  /* 某品名的统计维度。
     d1 为第一维度（建材、管材、型材、其他为规格，板材为厚度），fine 为单规格；d2 为第二维度的段（含“未分段”），没有则为 null。
     open：该大类标准化深度达到 L4 后，才按模板维度对上游披露（MD-23）；未达到的先采集、暂不披露。
     levels：上游可选的披露层级，只沿模板的固定路径由细到粗（PV-83），不提供其他划分方式 */
  const dimsOf = (name) => {
    const h = findProd(name);
    if (!h) return null;
    const { c, p } = h, tpl = DIM_TPL[c.tpl], x = DIM2[name], plate = c.tpl === '板材', fine = !plate && FINE[name] ? FINE[name] : null;
    const d1 = { name: tpl.dims[0].name, segName: tpl.dims[0].name + '段', bands: p.bands, share: p.bandShare, fine };
    const d2 = x ? { name: x[0], segName: x[0] + '段', bands: x[1].concat([UNBANDED]), share: x[2].map((s) => s * (1 - UNBANDED_SH)).concat([UNBANDED_SH]) } : null;
    const rowName = fine ? d1.name : d1.segName;
    const levels = [];
    if (d2) levels.push({ k: 'x', t: rowName + ' × ' + d2.segName });
    if (fine) levels.push({ k: 'spec', t: d1.name + (d2 ? '（不分' + d2.name + '）' : '') });
    levels.push({ k: 'seg', t: d1.segName + (d2 && !fine ? '（不分' + d2.name + '）' : '') });
    return { name, cat: c, p, tplKey: c.tpl, tpl, unit: p.unit || c.unit, steel: c.steel !== false, open: c.depth >= 'L4', d1, d2, rowName, levels };
  };
  const dimK = () => (window.STP && window.STP.PV ? window.STP.PV.k : 5);
  const sumOf = (a) => a.reduce((x, y) => x + y, 0);
  const pos2 = (i, len) => (len > 1 ? i / (len - 1) : 0.5);
  /* 某品名在示例数据池内的贡献企业数：钢材按品类占比推算，非钢材取配置值 */
  const dimN = (name) => { const d = dimsOf(name); return !d ? 0 : d.steel ? nOf(d.cat.share * d.p.share) : d.p.n; };
  /* 一组同父节点的成员做披露判定（PV-82）：
     全部满足则逐个披露；有不满足的，把它们与最小的可见成员合并为“其他（合并披露）”；
     合并后可单独展示的成员少于“上卷保留成员数”，或合并项仍不满足，则整组上卷到父节点（返回 rolled）。
     成员：{ v, n }。结果写回成员的 state：'ok' 或 'merged' */
  const judge = (items, nParent, k, keep) => {
    const bad = items.filter((x) => x.n < k);
    items.forEach((x) => { x.state = 'ok'; });
    if (!bad.length) return { rolled: false, other: null };
    const vis = items.filter((x) => x.n >= k).sort((a, b) => a.v - b.v), grp = bad.slice();
    if (vis.length) grp.push(vis.shift());
    while (Math.min(nParent, sumOf(grp.map((x) => x.n))) < k && vis.length) grp.push(vis.shift());
    const nO = Math.min(nParent, sumOf(grp.map((x) => x.n)));
    if (vis.length < keep || nO < k) return { rolled: true, other: null };
    grp.forEach((x) => { x.state = 'merged'; });
    return { rolled: false, other: { v: sumOf(grp.map((x) => x.v)), n: nO, members: grp.map((x) => x.name) } };
  };
  /* 按模板的固定路径生成披露结果（自细到粗：第一维度 × 第二维度的段 → 第一维度 → 规格段 → 品名）。
     total、n：该品名在查询范围内的合计与贡献企业数；o.level：请求的层级（'x'、'spec'、'seg'，缺省为最细）；
     o.segW：规格段的拆分权重（缺省为销量占比，库存传库存的占比）；o.nScale：地区、品牌筛选对企业数的缩放；o.seed：区分指标。
     相同的范围和层级得到相同的划分（PV-87），看板、查询、导出取同一结果 */
  const dimTree = (name, total, n, o) => {
    o = o || {};
    const d = dimsOf(name), k = o.k || dimK(), keep = o.keep || BAND_VER.keep, sd = o.seed || '';
    if (!d) return null;
    const level = d.levels.some((l) => l.k === o.level) ? o.level : d.levels[0].k;
    const nBase = dimN(name), sc = o.nScale != null ? o.nScale : (nBase ? n / nBase : 1);
    const segTot = split(total, o.segW || d.d1.share);
    const sh0 = d.steel ? d.cat.share * d.p.share : 0;
    const segN = d.d1.share.map((s) => Math.min(n, d.steel ? Math.round(nOf(sh0 * s) * sc) : Math.max(1, Math.round(n * Math.pow(s, 0.45)))));
    const cellsOf = (rowName, rowTot, rowN, i, len) => {
      const w = d.d2.bands.map((b, j) => (b === UNBANDED ? d.d2.share[j] * (0.7 + (hash(name + rowName + sd + 'u') % 60) / 100) : d.d2.share[j] * (0.6 + (hash(name + rowName + b + sd) % 80) / 100) * (0.4 + 1.4 * (1 - Math.abs(pos2(i, len) - pos2(j, d.d2.bands.length - 1))))));
      const vs = split(rowTot, w);
      return d.d2.bands.map((b, j) => ({ name: b, v: vs[j], n: vs[j] > 0 && rowTot > 0 ? Math.min(rowN, Math.max(1, Math.round(rowN * Math.pow(vs[j] / rowTot, 0.42)))) : 0 }));
    };
    const stat = { cellAll: 0, cellOk: 0, rowAll: 0, rowSplit: 0, rowRolled: 0, specAll: 0, specOk: 0, segAll: d.d1.bands.length, segRolled: 0 };
    const mkRow = (rowName, v, rn, i, len, kind) => {
      const r = { name: rowName, kind, total: v, n: rn, state: 'plain' };
      if (level === 'x' && d.d2) {
        r.cells = cellsOf(rowName, v, rn, i, len);
        stat.rowAll++; stat.cellAll += r.cells.length; stat.cellOk += r.cells.filter((c) => c.n >= k).length;
        const j = judge(r.cells, rn, k, keep);
        if (j.rolled) { r.state = 'rolled'; stat.rowRolled++; } else { r.state = 'cells'; r.other = j.other; stat.rowSplit++; }
      }
      return r;
    };
    /* 第一维度到单规格：逐个规格段处理其下的规格 */
    let groups;
    const nSpecAll = d.d1.fine ? sumOf(d.d1.fine.map((f) => f.length)) : 0;
    if (level !== 'seg' && d.d1.fine) {
      let idx = 0;
      groups = d.d1.bands.map((b, i) => {
        const vals = d.d1.fine[i];
        const ws = vals.map((v, j) => (0.55 + (hash(name + v + sd) % 90) / 100) * (1.3 - Math.abs(pos2(j, vals.length) - 0.4)));
        const vs = split(segTot[i], ws);
        const specs = vals.map((v, j) => ({ name: v, v: vs[j], n: Math.min(segN[i], Math.max(1, Math.round(segN[i] * Math.pow(vs[j] / Math.max(1, segTot[i]), 0.36)))), at: idx + j }));
        idx += vals.length;
        stat.specAll += specs.length; stat.specOk += specs.filter((s) => s.n >= k).length;
        const g = { seg: b, total: segTot[i], n: segN[i], rows: [] };
        const j = segN[i] < k ? { rolled: true } : judge(specs, segN[i], k, keep);
        if (j.rolled) { g.rolled = true; stat.segRolled++; return g; }
        g.rows = specs.filter((s) => s.state === 'ok').map((s) => mkRow(s.name, s.v, s.n, s.at, nSpecAll, 'spec'));
        if (j.other) g.rows.push({ name: '其他（合并披露）', kind: 'other', merged: true, members: j.other.members, total: j.other.v, n: j.other.n, state: level === 'x' && d.d2 ? 'rolled' : 'plain' });
        return g;
      });
    } else {
      /* 第一维度到段：各段作为同一父节点（品名）下的成员 */
      const segs = d.d1.bands.map((b, i) => ({ name: b, v: segTot[i], n: segN[i], i }));
      const j = judge(segs, n, k, keep);
      if (j.rolled) return { d, unit: d.unit, level, levelName: '品名', prodRolled: true, groups: [], total, n, cols: [], stat: Object.assign(stat, { segRolled: stat.segAll }) };
      const rows = segs.filter((s) => s.state === 'ok').map((s) => mkRow(s.name, s.v, s.n, s.i, segs.length, 'seg'));
      if (j.other) rows.push({ name: '其他（合并披露）', kind: 'other', merged: true, members: j.other.members, total: j.other.v, n: j.other.n, state: level === 'x' && d.d2 ? 'rolled' : 'plain' });
      groups = [{ seg: null, total, n, rows }];
    }
    /* 单规格层级下，规格段本身不满足门槛的，整段上卷；全部规格段都上卷时，结果只到规格段 */
    return {
      d, unit: d.unit, level, levelName: d.levels.find((l) => l.k === level).t, groups, total, n, prodRolled: false,
      cols: level === 'x' && d.d2 ? d.d2.bands : [], hasOther: groups.some((g) => g.rows.some((r) => r.other)),
      anyRolled: groups.some((g) => g.rolled || g.rows.some((r) => r.state === 'rolled' || r.merged)),
      stat,
    };
  };
  /* 把披露结果摊平成行，供导出预览与图表使用：每行带披露层级（单规格、段、已上卷） */
  const dimFlat = (t) => {
    const out = [], d = t.d;
    if (t.prodRolled) return [{ seg: '—', name: d.name, d2: '—', v: t.total, n: t.n, lv: '已上卷（品名）' }];
    t.groups.forEach((g) => {
      if (g.rolled) { out.push({ seg: g.seg, name: '—', d2: '—', v: g.total, n: g.n, lv: '已上卷（' + d.d1.segName + '）' }); return; }
      g.rows.forEach((r) => {
        const base = { seg: g.seg || (r.kind === 'seg' ? r.name : '—'), name: r.kind === 'seg' ? '—' : r.name };
        if (r.state === 'cells') {
          r.cells.filter((c) => c.state === 'ok').forEach((c) => out.push(Object.assign({ d2: c.name, v: c.v, n: c.n, lv: '段' }, base)));
          if (r.other) out.push(Object.assign({ d2: '其他（合并披露）', v: r.other.v, n: r.other.n, lv: '段（合并披露）' }, base));
        } else out.push(Object.assign({ d2: d.d2 && t.level === 'x' ? '—' : '', v: r.total, n: r.n, lv: r.merged ? '合并披露' : r.state === 'rolled' ? '已上卷（' + (r.kind === 'seg' ? d.d1.segName : d.d1.name) + '）' : r.kind === 'seg' ? '段' : '单规格' }, base));
      });
    });
    return out;
  };
  /* 非钢材的每日销量、日末库存：沿用钢材每日序列的形状，按各品名“昨日”数值等比换算，看板、查询、导出取到同一个数 */
  const nsBetween = (name, from, to) => { const p = findProd(name).p; return Math.round(salesBetween(KPI, 'real', from, to) * p.sales / KPI.sales); };
  const nsStockOn = (name, key) => { const p = findProd(name).p; return Math.round(stockOn(KPI, 'real', key) * p.stock / KPI.stock); };
  const nsKpi = (name) => { const p = findProd(name).p, avg7 = Math.round(nsBetween(name, '2026-11-17', '2026-11-23') / 7); return { name, unit: p.unit, n: p.n, sales: p.sales, stock: p.stock, avg7, days: +(p.stock / avg7).toFixed(1) }; };

  /* ---------------- 钢厂带动（协议户邀请与接入、带动关系与报送达标、邀请下级经销商、带动奖励规则与运营工作台、企业管理共用）
   * 业务方 2026-11-25 决定：取消下游现金分成，激励改为“钢厂带动 + 免费行业对标数据”，原分成预算改为奖励带动入驻的钢厂（名额或折扣）。
   * 对应需求文档 V0.4 的 6.9、7.10、8.10、9.10。以下规则数值全部是示例参数，待业务方确定。 */
  const REF = {
    /* 报送达标参数（示例参数，N-34 待定）：按达标周期给出达标、未达标（N-36 已确认二值），不满评定条件的周期为不适用；周期结束后在固定日期统一发布。
       报送的认定（N-35，业务方 2026-11-25 确认不认可零申报）：截止时点前平台收到该业务日期的实际数据才算报送，
       实际数据 = 经上传条件过滤后入库、通过字段校验且量不为零的记录（PV-93）；库存快照或销售数据任一即可（PV-94），当天没有销售的报了库存快照就算。
       N-53 已确认（2026-11-25）：库存快照或销售数据任一即可，库存快照不是必要条件。
       N-54 已确认（2026-11-25）：常年不落库的企业由企业申报、运营核实后标记为“无库存经营”，达标显示“不适用”，见下方 noStock。
       评定只用“有或没有”，不使用任何数量；钢厂端不显示单家的及时率数值。
       rateMinN（示例参数）：参与评定的协议户不足这个户数时，钢厂端不显示汇总达标率，只显示户数（PV-97）。
       参数取需求文档 V0.6 第 9.10 末“达标参数的建议取值范围”的起步建议：应报送日为工作日（周一至周五，剔除法定节假日，含调休上班日；日历由运营维护，可设免评日）、
       及时率 80%、最长连续缺报 3 个应报送日、周期内最少 10 个应报送日、次月 5 日发布、汇总达标率最小户数 5。仍是示例参数（N-34 待定）。
       截止时点文档建议与每日聚合的数据截取时点一致（约次日 06:00），原型沿用次日 08:00，在建议范围 06:00 至 10:00 之内。
       offDays 是示例日历里周一至周五中的法定节假日，workDays 是调休上班的周末；isDue 判断某个业务日期是不是应报送日 */
    std: {
      ver: 'RC-V2', eff: '2026-07-01', cycle: '自然月', dayType: '工作日', dayNote: '周一至周五，剔除法定节假日，含调休上班日', cutoff: '次日 08:00', rate: 80, gap: 3, minDays: 10, publish: '次月 5 日', breakDays: 10, rateMinN: 5,
      offDays: ['2026-10-01', '2026-10-02', '2026-10-05', '2026-10-06', '2026-10-07'], workDays: ['2026-10-10'],
      cycles: ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10'], last: '2026-10', lastPub: '2026-11-05', cur: '2026-11', nextPub: '2026-12-05',
    },
    /* 带动奖励规则（示例参数，N-30 至 N-33 待定）：一期为奖励名额，折扣为二期 */
    rule: {
      ver: 'RR-V2', eff: '2026-07-01', period: '自然季度', form: '奖励名额', needCycles: 2, quotaPer: 10, quotaMonths: 12, capPerMill: 30, budget: 1500,
      /* 二期：奖励折扣的分档（示例） */
      tiers: [{ min: 50, max: 99, label: '50–99 户', off: 0.98 }, { min: 100, max: 199, label: '100–199 户', off: 0.95 }, { min: 200, max: 1e9, label: '200 户及以上', off: 0.92 }],
    },
    /* 上游示例企业东岳钢铁的协议户带动情况（截至 2026-11-24；接入状态每日更新一次）
       邀请状态：待发送 2 + 已发送 57 + 已确认带动关系 248 + 已拒绝 4 + 已过期 9 = 320；
       已确认的 248 户按接入状态：未接入 21 + 接入中 31 + 已接入 183 + 报送中断 8 + 已暂停 5，其中后三项合计 196 户为已接入过；
       N-36 确认钢厂可见已接入、报送中断、已暂停、已退出；“未接入”是已接入的反面，“接入中”“已解除关联”按 UP-85 沿用原设计。
       2026-10 达标周期：达标 173 + 未达标 8 + 不适用 67（未接入与接入中 52 + 带动关系在周期中途成立或应报送天数不足 9 + 无库存经营 6）= 248；
       参与评定 181 户，汇总达标率 173 ÷ 181 = 95.6%。数字按 V0.6 的起步参数（工作日、及时率 80%、最少 10 个应报送日）重算。
       无库存经营的 6 户都在已接入的 183 户之内，接入状态照常显示。
       协议户占用名额（N-29 已确认：照常占用付费名额，带动奖励可抵用）：已接入过的 196 户 = 已选入本厂数据池 142（各占 1 个付费名额，含待生效）
       + 已对本厂上架、尚未选入 38 + 未对本厂上架或匿名上架未确认对应关系 16。
       东岳已购 200 个名额已全部分配（在池 186 + 待生效 14），把 38 户全部选入需 38 个名额：奖励名额 4 个可抵用，其余 34 个须加购 */
    dy: {
      invited: 320, toSend: 2, sent: 57, confirmed: 248, refused: 4, expired: 9, certified: 236, signed: 221,
      access: [['未接入', 21], ['接入中', 31], ['已接入', 183], ['报送中断', 8], ['已暂停', 5]], connected: 196, left: [['已退出', 2], ['已解除关联', 3]],
      ok: 173, fail: 8, na: 67, naNotIn: 52, naShort: 9, naNoStock: 6,
      seat: { bought: 200, inPool: 142, listedOut: 38, hidden: 16 },
      /* 二期：经一级代理带动接入的二级经销商，只有全厂汇总户数 */
      subConnected: 86,
      /* 带动奖励：只给计入奖励的汇总户数，不逐户标注 */
      reward: { cur: '2026 Q4', last: '2026 Q3', counted: 41, quota: 4, grantedAt: '2026-10-12', validTo: '2027-10-11', used: 0 },
      regions: [['华东', 142, 118, 101], ['华中', 86, 64, 47], ['华北', 52, 38, 28], ['华南', 40, 28, 20]],
      years: [['2025 年度签约并延续', 180, 161, 145], ['2026 年度新签', 140, 87, 51]],
    },
    /* 无库存经营（N-54，业务方 2026-11-25 确认；需求文档 V0.6 的 7.12、9.12、OP-23、DQ-25）。
       常年不落库的企业由企业申报并逐项确认告知文案、运营核实后生效。生效期间不参加报送达标评定，对带动钢厂显示“不适用”并带“无库存经营”标签，
       不计入汇总达标率；接入状态照常显示。标签只对有带动关系的钢厂显示，随达标周期结果在发布日更新；不进企业名录，不作为聚合的维度、筛选条件或分组（PV-103、PV-104）。
       状态：未申报、待核实、已生效、已驳回、已撤销、已到期（9.12）。
       参数取文档 N-58 的起步值，都是示例参数：申报截止日为周期第 15 日（之后提交的自下一周期起生效）、核实时限 5 个工作日、有效期 12 个月、
       主动撤销后再次申报间隔 3 个周期、申报不实被撤销后禁止期 6 个周期、一个周期内累计 3 天收到库存快照触发复核、这类企业连续 30 个自然日没有数据才算报送中断。
       核实只用平台内的汇总信号（OP-23）：wh 登记的仓库数、invDays 近 3 个月收到库存快照实际数据的天数、whShare 销售记录中带本企业仓库的比例（%），不打开明细。
       企业名称均为虚构；东岳的 3 家与“协议户邀请与接入”的示例名单一致 */
    noStock: {
      months: 3, sla: 5, deadlineDay: 15, validMonths: 12, reapplyGap: 3, banCycles: 6, recheckInvDays: 3, breakDays: 30, noticeVer: 'NSN-V0.6 草案',
      /* 告知文案（文档 7.12 的 V0.6 草案，上线前须法务审定）；{N} 由系统填入当前有带动关系的钢厂家数 */
      notice: [
        '标记生效后，与贵企业有带动关系的钢厂（当前 {N} 家，以及今后与贵企业建立带动关系的钢厂）会在其协议户列表中看到贵企业带有“无库存经营”标签，报送达标一栏显示“不适用”。',
        '钢厂仍然看不到贵企业的销量、库存、价格等任何数据内容，也看不到贵企业哪一天报送了数据。',
        '标记期间贵企业不参加报送达标评定，不会被评为达标或未达标。贵企业与钢厂在代理协议中关于数据报送的约定，由双方自行处理，平台不参与。',
        '标记期间贵企业仍应照常上传销售数据。连续多日没有任何数据时，钢厂端会显示“报送中断”。',
        '贵企业开始持有库存后，应及时撤销本标记并上传库存快照。',
        '平台会核实申报内容。标记期间如收到库存数据，或发现情况与申报不符，平台将复核并可能撤销标记；申报不实被撤销的，一段时间内不能再次申报。',
        '贵企业可随时撤销本标记，撤销自下一个达标周期起生效。标记有有效期，到期前需要确认情况未变。',
      ],
      platform: { active: 412, pending: 2, recheck: 3, revoked: 23, rejected: 17, expired: 4 },
      /* 监控（OP-23）：标记企业的占比、申报时点的分布、反复申报与撤销；只在平台内部使用 */
      monitor: {
        share: 1.9, repeat: 3, early: 81, late: 19,
        mills: [['汉江钢铁', 214, 11], ['东岳钢铁', 196, 6], ['金江钢铁', 171, 4], ['北辰钢铁', 158, 9], ['南粤钢铁', 143, 3]],
      },
      list: [
        { id: 'NS-20261123-01', ent: '唐山冀兴钢铁贸易有限公司', loc: '河北 · 唐山', mill: '北辰钢铁', mode: '订单或期货订货', startAt: '2026-09', applyAt: '2026-11-23 16:40', due: '2026-11-30', st: '待核实', wh: 1, invDays: 37, whShare: 41, note: '企业说明：2026-09 起退租自有仓库，改为按订单采购、到货即发' },
        { id: 'NS-20261121-03', ent: '青岛海岳钢铁贸易有限公司', loc: '山东 · 青岛', mill: '东岳钢铁', mode: '厂家直发', startAt: '2024-03', applyAt: '2026-11-21 10:18', due: '2026-11-27', st: '待核实', wh: 0, invDays: 0, whShare: 0, note: '企业说明：货物由钢厂直发工地，本企业不设仓库；附 3 份直发合同与发货单样本' },
        { id: 'NS-20260904-02', ent: '广州粤海金属贸易有限公司', loc: '广东 · 广州', mill: '金江钢铁', mode: '订单或期货订货', startAt: '2025-06', applyAt: '2026-09-04 09:12', st: '已生效', since: '2026-09', until: '2027-08-31', at: '2026-09-09 15:02', by: '林若彤', wh: 0, invDays: 5, whShare: 12, recheck: { src: '持续核验信号', text: '2026-11 周期内累计 5 天收到含实际数据的库存快照（复核阈值 3 天）' } },
        { id: 'NS-20260806-01', ent: '嘉兴远航供应链有限公司', loc: '浙江 · 嘉兴', mill: '东岳钢铁', mode: '厂家直发、代理撮合', startAt: '2023-05', applyAt: '2026-08-06 14:25', st: '已生效', since: '2026-08', until: '2027-07-31', at: '2026-08-12 11:30', by: '林若彤', wh: 0, invDays: 0, whShare: 0 },
        { id: 'NS-20260702-04', ent: '襄阳汉江物资贸易有限公司', loc: '湖北 · 襄阳', mill: '东岳钢铁', mode: '订单或期货订货', startAt: '2025-01', applyAt: '2026-07-02 09:48', st: '已生效', since: '2026-07', until: '2027-06-30', at: '2026-07-08 10:16', by: '何志远', wh: 0, invDays: 0, whShare: 0 },
        { id: 'NS-20251203-02', ent: '南通江海钢铁贸易有限公司', loc: '江苏 · 南通', mill: '汉江钢铁', mode: '厂家直发', startAt: '2022-10', applyAt: '2025-12-03 10:05', st: '已生效', since: '2025-12', until: '2026-11-30', at: '2025-12-08 14:40', by: '何志远', wh: 0, invDays: 0, whShare: 0, recheck: { src: '到期抽检', text: '标记 2026-11-30 到期，企业已确认情况未变；按比例抽中回访' } },
        { id: 'NS-20260512-03', ent: '郑州豫北物资有限公司', loc: '河南 · 郑州', mill: '中洲钢铁', mode: '厂家直发', startAt: '2024-08', applyAt: '2026-05-12 15:30', st: '已生效', since: '2026-05', until: '2027-04-30', at: '2026-05-15 09:20', by: '林若彤', wh: 0, invDays: 0, whShare: 0, recheck: { src: '钢厂异议', p2: true, text: '中洲钢铁 2026-11-20 提出异议：称该户在郑州有租用库房。平台只回复“维持”或“已撤销”' } },
        { id: 'NS-20260611-02', ent: '泉州闽南钢铁贸易有限公司', loc: '福建 · 泉州', mill: '南粤钢铁', mode: '厂家直发', startAt: '2024-11', applyAt: '2026-06-11 13:05', st: '已撤销', since: '2026-06', at: '2026-10-15 09:40', by: '企业管理员', wh: 1, invDays: 40, whShare: 36, note: '企业主动撤销：2026-10 起租用仓库开始落库。自 2026-11 周期起恢复评定' },
        { id: 'NS-20261026-01', ent: '保定中北物资有限公司', loc: '河北 · 保定', mill: '昆仑钢铁', mode: '订单或期货订货', startAt: '2026-08', applyAt: '2026-10-26 11:20', st: '已驳回', at: '2026-10-28 16:22', by: '何志远', wh: 2, invDays: 86, whShare: 74, note: '驳回理由：登记仓库 2 个，近 3 个月有 86 天收到库存快照，不属于无库存经营' },
      ],
    },
    /* 下游示例企业苏州恒运（东岳的协议户、一级代理）：与钢厂的带动关系，以及它邀请下级经销商的情况（二期） */
    hy: { inviter: '东岳钢铁集团有限公司', invitedAt: '2025-09-02', confirmedAt: '2025-09-05', firstReport: '2025-09-26', batch: 'INV-20250902-01', streak: 13, invited: 18 },
    /* 平台入驻下游 21,386 家的来源构成 */
    source: [{ k: '钢厂带动', n: 14870 }, { k: '一级代理带动', n: 2316 }, { k: '平台运营邀请', n: 3120 }, { k: '自主注册', n: 1080 }],
  };
  REF.std.isDue = (d) => { const w = new Date(d + 'T00:00:00').getDay(); return REF.std.workDays.indexOf(d) >= 0 || (w >= 1 && w <= 5 && REF.std.offDays.indexOf(d) < 0); };
  REF.dy.accessRate = +(REF.dy.connected / REF.dy.confirmed * 100).toFixed(1);
  REF.dy.okRate = +(REF.dy.ok / (REF.dy.ok + REF.dy.fail) * 100).toFixed(1);
  REF.dy.seat.rewardFree = REF.dy.reward.quota - REF.dy.reward.used;
  REF.dy.seat.needBuy = REF.dy.seat.listedOut - REF.dy.seat.rewardFree;

  window.M = { REF, judge, DIM_TPL, CAT_TPL, BAND_VER, DIM2, FINE, UNBANDED, KG_BANDS, SEC_DIM2, THEO_KG, kgRange, nonSteel, allCats, findProd, unitOf, dimsOf, dimTree, dimFlat, dimN, nsBetween, nsStockOn, nsKpi, TODAY, DATA_DATE, rngOf, hash, split, split2, stockTree, salesTree, brandStock, brandN, BRAND_SH, BRAND_F, yoyOn, yoyBetween, priceOf, priceRow, priceTrail, brandOff, specSales, matShare, provShares, DEST_COVER, daily, salesOn, salesBetween, stockOn, trendSeries, kpiOf, ymd, dayChg, periodChg, priceSample, priceCell, productOf, nOf, nReg, categories, provinces, allProvinceNames, POOL, KPI, BRAND, dailySeries, stockSeries, enterprises, SCALE, MILLS, CAT_ABBR, PRICING, tierOf };
})();
