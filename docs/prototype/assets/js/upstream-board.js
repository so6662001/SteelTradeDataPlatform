/* 上游聚合看板组件：正式看板（dashboard.html）与模拟数据演示看板（demo.html）共用。 */
(function () {
  const { fmt, band, disclose, chart, hash, PV } = STP;
  const nOf = (share, total) => Math.min(total, Math.round(total * Math.pow(share, 0.55) * 1.1));

  window.UpBoard = {
    props: { demo: Boolean },
    data() {
      const s = this.demo ? 0.58 : 1;
      /* 指标卡的环比、同比由每日序列算出，与下方趋势图、多维查询一致 */
      const K = M.kpiOf(this.demo ? { sales: 50120, stock: 742600, avg7: 47380 } : M.KPI, this.demo ? 'demo' : 'real');
      return {
        K, scale: s, poolTotal: this.demo ? 120 : M.POOL.total,
        brandName: this.demo ? '示例品牌' : M.BRAND.name,
        colors: chart.COLORS, metric: 'sales', mapLevel: 'china', mapProv: null, mapReady: 0,
        catPath: [], grain: '日', showYoy: true, regionMode: '仓库所在地', dimLevel: '', dimMetric: 'sales', bandVer: M.BAND_VER,
        metricOpts: [{ k: 'sales', t: '销量' }, { k: 'stock', t: '库存' }, { k: 'days', t: '可销天数' }],
      };
    },
    computed: {
      metricName() { return { sales: '昨日销量', stock: '日末库存', days: '库存可销天数' }[this.metric]; },
      metricUnit() { return this.metric === 'days' ? '天' : '吨'; },
      seed() { return this.demo ? 'demo' : 'real'; },
      /* 库存始终按仓库所在地拆分；销量按所选地区口径拆分（流向地只含已填报流向地的部分） */
      tree() { return M.stockTree(this.K.stock, this.seed); },
      sTree() { return M.salesTree(this.K.sales, this.regionMode); },
      sTreeAll() { return M.salesTree(this.K.sales); },
      /* 省级原始行（引擎内部口径，页面只展示披露结果） */
      provRaw() {
        const K = this.K;
        const pw = M.provShares(this.regionMode), sa = this.sTree.provs, st = this.tree.provs;
        /* avgWh：按仓库所在地的近 7 日日均销量，只用于计算可销天数（库存与可销天数始终按仓库所在地） */
        return M.provinces.map((p, i) => ({ name: p.name, file: p.file, muni: p.muni, n: Math.max(1, Math.round(p.ent * (this.demo ? 0.65 : 1))), sales: sa[i], avg: K.avg7 * pw[i], avgWh: K.avg7 * p.share, stock: st[i], cities: p.cities }));
      },
      cityRaw() {
        if (!this.mapProv) return [];
        const p = this.provRaw.find((r) => r.name === this.mapProv);
        const pv = M.provinces.find((x) => x.name === p.name), st = this.tree.cities(pv), sa = this.sTree.cities(pv);
        return p.cities.map((c, i) => ({ name: c[0], n: Math.max(1, Math.round(c[2] * (this.demo ? 0.7 : 1))), sales: sa[i], avg: p.avg * c[1], avgWh: p.avgWh * c[1], stock: st[i] }));
      },
      regionRows() {
        const raw = this.mapLevel === 'china' ? this.provRaw : this.cityRaw;
        const d = disclose(raw, ['sales', 'stock', 'avg', 'avgWh'], this.metric === 'stock' ? 'stock' : 'sales');
        d.rows.forEach((r) => { r.days = r.avgWh ? +(r.stock / r.avgWh).toFixed(1) : null; });
        if (this.metric === 'days') d.rows.sort((a, b) => (a.merged ? 1 : b.merged ? -1 : b.days - a.days));
        const total = d.rows.reduce((a, r) => a + r.sales, 0);
        d.rows.forEach((r) => { r.share = +(r.sales / total * 100).toFixed(1); });
        return d.rows;
      },
      regionTotal() {
        const rs = this.regionRows;
        const sales = rs.reduce((a, r) => a + r.sales, 0), stock = rs.reduce((a, r) => a + r.stock, 0), avg = rs.reduce((a, r) => a + r.avgWh, 0);
        return { sales, stock, days: +(stock / avg).toFixed(1) };
      },
      mapOption() {
        void this.mapReady;
        const m = this.metric;
        const vis = {}; this.regionRows.filter((r) => !r.merged).forEach((r) => { vis[r.name] = r; });
        const merged = this.regionRows.find((r) => r.merged);
        const names = this.mapLevel === 'china' ? M.allProvinceNames : ((window.__GEO__[this.mapFile] || { features: [] }).features.map((f) => f.properties.name));
        const data = names.map((nm) => {
          const r = vis[nm];
          if (r) return { name: nm, value: r[m], n: r.n };
          return { name: nm, value: null, inMerged: merged && merged.members.indexOf(nm) >= 0, itemStyle: { areaColor: '#e9ecf1', decal: { symbol: 'rect', dashArrayX: [1, 0], dashArrayY: [3, 5], rotation: -0.78, color: 'rgba(120,132,150,0.35)' } }, emphasis: { itemStyle: { areaColor: '#dfe3ea' } } };
        });
        const vals = data.filter((d) => d.value != null).map((d) => d.value);
        const unit = this.metricUnit, mname = this.metricName;
        return {
          aria: { enabled: false },
          tooltip: {
            trigger: 'item',
            formatter: (p) => {
              const d = p.data || {};
              if (d.value == null || Number.isNaN(d.value)) return '<b>' + p.name + '</b><br>— 样本不足，不予披露' + (d.inMerged ? '<br><span style="color:#999">已并入“其他（合并披露）”</span>' : '');
              return '<b>' + p.name + '</b><br>' + mname + '：<b>' + fmt(d.value, m === 'days' ? 1 : 0) + '</b> ' + unit + '<br>贡献企业数：' + band(d.n) + ' 家';
            },
          },
          visualMap: { type: 'continuous', show: vals.length > 0, min: vals.length ? Math.min.apply(null, vals) * 0.8 : 0, max: vals.length ? Math.max.apply(null, vals) : 1, left: 8, bottom: 8, itemWidth: 10, itemHeight: 90, text: ['高', '低'], textStyle: { color: '#6b7787', fontSize: 11 }, inRange: { color: m === 'days' ? ['#fff3e0', '#ffb74d', '#e65100'] : ['#e3f0ff', '#7db8ff', '#1f6fd6'] }, calculable: false },
          series: [{
            type: 'map', map: this.mapLevel === 'china' ? 'china' : this.mapFile, roam: false, zoom: this.mapLevel === 'china' ? 1.2 : 1, top: this.mapLevel === 'china' ? 46 : 20, bottom: this.mapLevel === 'china' ? 0 : 20, selectedMode: false,
            label: { show: this.mapLevel !== 'china', fontSize: 10, color: '#4a5568' },
            itemStyle: { borderColor: '#fff', borderWidth: 0.8, areaColor: '#e9ecf1' },
            emphasis: { label: { show: true, color: '#1f2d3d' }, itemStyle: { areaColor: '#ffd666' } },
            data,
          }],
        };
      },
      mapFile() { const p = M.provinces.find((x) => x.name === this.mapProv); return p ? p.file : null; },
      /* 品类结构 */
      catCur() { return this.catPath.length ? M.categories.find((x) => x.name === this.catPath[0]) : null; },
      /* 第三层随该品类的标准化深度开放：L4 及以上到规格段，L3 到材质，L2 不再下钻 */
      catThird() { const c = this.catCur; return !c ? null : c.depth >= 'L4' ? '规格段' : c.depth === 'L3' ? '材质' : null; },
      catLevelName() { return this.catPath.length < 2 ? ['大类', '品名'][this.catPath.length] : this.catDim ? this.catDim.d.levels.find((l) => l.k === (this.dimLevel || this.catDim.d.defLevel)).t : this.catThird; },
      /* 品名以下：标准化深度到 L4 的大类按统计维度模板展示，披露与上卷结果与多维查询同源。
         V0.7：默认层级与多维查询的规格段层级一致，管材为规格段 × 壁厚段，板材为厚度段 × 宽度段（UP-105）；建材、型材、其他品类不变 */
      catDim() {
        if (this.catPath.length !== 2 || this.catThird !== '规格段') return null;
        const c = this.catCur, p = c.products.find((x) => x.name === this.catPath[1]), k = c.products.indexOf(p);
        return { d: M.dimsOf(p.name), name: p.name, sales: this.sTreeAll.prods(c)[k], stock: this.tree.prods(c)[k], n: nOf(c.share * p.share, this.poolTotal), stockW: this.tree.leaf(c, p, p.bands, p.bandShare) };
      },
      /* 非钢材：按数量统计，每个品名一个数量单位，不合计，也不与钢材的吨位相加 */
      nsRows() {
        const s = this.scale;
        return M.nonSteel[0].products.map((p) => { const k = M.nsKpi(p.name); return { name: k.name, unit: k.unit, n: Math.max(1, Math.round(k.n * (this.demo ? 0.65 : 1))), sales: Math.round(k.sales * s), stock: Math.round(k.stock * s), avg7: Math.round(k.avg7 * s), days: k.days }; });
      },
      catRows() {
        const K = this.K, total = this.poolTotal;
        let items;
        let st, sa;
        const T = this.sTreeAll;
        /* 最细时间粒度为旬的大类（优特钢、不锈钢）：看板是日粒度，不单独披露，合并为一行 */
        if (this.catPath.length === 0) { items = M.categories.map((c) => ({ name: c.name, sh: c.share, child: true, depth: c.depth, dom: c.time === '旬' })); st = this.tree.cats; sa = T.cats; }
        else {
          const c = this.catCur;
          if (this.catPath.length === 1) { items = c.products.map((p) => ({ name: p.name, sh: c.share * p.share, child: !!this.catThird, locked: !this.catThird })); st = this.tree.prods(c); sa = T.prods(c); }
          else {
            const p = c.products.find((x) => x.name === this.catPath[1]);
            /* 规格段、材质的拆分权重与多维查询相同 */
            const byBand = this.catThird === '规格段', names = byBand ? p.bands : p.materials, w = byBand ? p.bandShare : M.matShare(p);
            items = names.map((b, i) => ({ name: b, sh: c.share * p.share * w[i] })); st = this.tree.leaf(c, p, names, w); sa = T.leaf(c, p, w);
          }
        }
        const raw = items.map((i, k) => ({ name: i.name, child: i.child, locked: i.locked, depth: i.depth, dom: i.dom, n: nOf(i.sh, total), sales: sa[k], avg: K.avg7 * i.sh, stock: st[k] }));
        const d = disclose(raw, ['sales', 'stock', 'avg']);
        const tot = d.rows.reduce((a, r) => a + r.sales, 0);
        d.rows.forEach((r) => { r.days = +(r.stock / r.avg).toFixed(1); r.share = +(r.sales / tot * 100).toFixed(1); });
        if (d.merged && this.catPath.length === 0) d.merged.why = '其中' + M.categories.filter((c) => c.time === '旬').map((c) => c.name).join('、') + '的最细时间粒度为旬，日粒度不单独披露';
        return d.rows;
      },
      catOption() {
        const o = chart.pie({ name: '销量', unit: '吨', data: this.catRows.map((r) => ({ name: r.name, value: r.sales })), center: ['50%', '50%'], radius: ['48%', '78%'] });
        o.legend = undefined;
        return o;
      },
      /* 趋势 */
      /* 趋势：与多维查询按时间查询的结果同源 */
      trend() { return M.trendSeries(this.K, this.seed, this.grain); },
      trendOption() {
        const t = this.trend;
        const series = [{ name: '销量', type: 'bar', data: t.sales, unit: '吨', barMaxWidth: 14, itemStyle: { borderRadius: [2, 2, 0, 0] } }];
        if (this.showYoy) series.push({ name: '销量（上年同期）', data: t.yoy, unit: '吨', lineStyle: { width: 1.5, type: 'dashed' }, showSymbol: false, color: '#b9c2cf' });
        series.push({ name: '日末库存', data: t.stock, unit: '吨', yAxisIndex: 1, color: '#ff7a45', showSymbol: false });
        return chart.line({ x: t.x, series, yName: '销量（吨）', y2: '库存（吨）', marks: t.marks });
      },
      /* 本厂品牌 */
      /* 本厂品牌的销量、库存拆分与多维查询“品牌 = 本厂”的结果同源 */
      brandRows() {
        const own = M.salesTree(this.K.sales, this.regionMode, '本厂').provs, bs = M.brandStock(this.tree, this.seed);
        return this.provRaw.slice(0, 12).map((p, i) => {
          const n = M.brandN(p.n, i);
          /* 第 10 行为优势度屏蔽示例：单家企业占比过高 */
          const ok = n >= PV.k && i !== 9;
          const sales = own[i], stock = bs[i];
          return { name: p.name, n, ok, total: p.sales, sales: ok ? sales : null, other: ok ? p.sales - sales : null, share: ok ? +(sales / p.sales * 100).toFixed(1) : null, stock: ok ? stock : null, days: ok ? +(stock / (p.avgWh * M.BRAND_SH[i])).toFixed(1) : null };
        });
      },
      brandOption() {
        const rows = this.brandRows;
        const o = chart.bar({
          x: rows.map((r) => r.name), stack: true, unit: '吨',
          series: [
            { name: this.brandName + '（本厂）', data: rows.map((r) => r.sales), color: '#409eff' },
            { name: '其他品牌', data: rows.map((r) => r.other), color: '#c9d6e6' },
            { name: '未披露品牌拆分', data: rows.map((r) => (r.ok ? null : r.total)), color: '#e2e6ec', itemStyle: { decal: { symbol: 'rect', dashArrayX: [1, 0], dashArrayY: [3, 5], rotation: -0.78, color: 'rgba(120,132,150,0.4)' } }, label: { show: true, position: 'inside', formatter: '—', color: '#6b7787' } },
          ],
        });
        o.aria = { enabled: false };
        return o;
      },
      priceRows() {
        /* 每行与量价视图同一规格、全国口径的结果一致；不锈钢最细时间粒度为旬，取本旬均价与旬环比 */
        const of = (label, name, material, band) => { const s = M.priceSample(name, material, band), ok = s.show; return { name: label, pn: s.pn, grain: s.grain, price: ok ? s.price : null, chg: s.chgShow ? s.chg : null, cover: ok ? s.cover : null }; };
        return [
          of('螺纹钢 HRB400E Φ16–25', '螺纹钢', 'HRB400E', 'Φ16–25'),
          of('热轧卷板 Q235B 3.0–6.0mm', '热轧卷板', 'Q235B', '3.0–6.0mm'),
          of('普碳中厚板 Q235B 8–20mm', '普碳中厚板', 'Q235B', '8–20mm'),
          of('冷轧卷板 DC01', '冷轧卷板', 'DC01', ''),
          of('H 型钢 Q235B HN 系列', 'H 型钢', 'Q235B', 'HN 系列'),
          of('不锈钢冷轧卷板', '不锈钢冷轧卷板', '', ''),
        ];
      },
      priceOn() { return this.$state.gate === 'open'; },
    },
    methods: {
      async onMapClick(p) {
        if (this.mapLevel !== 'china') return;
        const prov = this.provRaw.find((r) => r.name === p.name);
        const row = this.regionRows.find((r) => r.name === p.name);
        if (!prov || !row) { this.$info(p.name + '：样本不足，不予披露，无法下钻'); return; }
        this.drillProv(prov);
      },
      async drillProv(prov) {
        if (prov.merged) return;
        const p = this.provRaw.find((r) => r.name === prov.name);
        if (!p) return;
        if (p.muni) { this.$info(p.name + '为直辖市，地区最细粒度为地级市，不再下钻'); return; }
        await STP.loadGeo(p.file);
        echarts.registerMap(p.file, window.__GEO__[p.file]);
        this.mapProv = p.name; this.mapLevel = 'prov'; this.mapReady++;
      },
      backChina() { this.mapLevel = 'china'; this.mapProv = null; },
      drillCat(row) {
        if (row.merged) return;
        if (row.locked) { this.$info('该品类暂不提供此粒度：' + this.catCur.name + '的标准化深度为品名级，暂不开放材质与规格段下钻'); return; }
        if (row.child && this.catPath.length < 2) this.catPath = this.catPath.concat([row.name]);
      },
      depthText(d) { return d >= 'L4' ? '可到规格段' : d === 'L3' ? '可到材质' : '仅到品名'; },
      catTo(i) { this.catPath = this.catPath.slice(0, i); this.dimLevel = ''; },
      rowClass({ row }) { return row.merged ? 'merged-row' : ''; },
    },
    template: `
<div>
  <sample-note :pool="poolTotal" :region="regionMode" :demo="demo"></sample-note>

  <div class="grp-head"><span class="unit-pill">钢材 · 吨</span><span>以下指标卡、地区分布、趋势、品类结构与本厂品牌视图，都是按吨位统计的钢材；非钢材按数量另列一组，两者不合计。</span></div>
  <div class="grid c5">
    <stat-card label="昨日销量" :value="K.sales" unit="吨" :mom="K.salesMom" :yoy="K.salesYoy" mom-label="较上周同日" icon="Sell" tip="销售出库重量 − 销售退货重量，按出库日期归属；环比与上周同一星期的那天比较，避免周末成交偏少造成的波动"></stat-card>
    <stat-card label="昨日日末库存" :value="K.stock" unit="吨" :mom="K.stockMom" :yoy="K.stockYoy" mom-label="日环比" icon="Box" tip="货权属于上传企业的账面实物库存，日末全量快照"></stat-card>
    <stat-card label="近 7 日日均销量" :value="K.avg7" unit="吨/日" :mom="K.avg7Mom" :yoy="K.avg7Yoy" mom-label="周环比" icon="TrendCharts"></stat-card>
    <stat-card label="库存可销天数" :value="K.days" :d="1" unit="天" icon="Timer" tip="期末库存量 ÷ 近 7 日日均销量。销量含不落库企业的直发销量；平台不提供剔除这类企业或只含这类企业的口径"><span>较上周 <b :class="K.daysMom < 0 ? 'down' : 'up'">{{ (K.daysMom > 0 ? '+' : '') + K.daysMom }} 天</b></span><span>较上年 <b :class="K.daysYoy < 0 ? 'down' : 'up'">{{ (K.daysYoy > 0 ? '+' : '') + K.daysYoy }} 天</b></span></stat-card>
    <stat-card label="数据池企业数" :value="poolTotal" unit="家" icon="OfficeBuilding" tip="当前生效的已购下游企业数，是全部聚合计算的范围">
      <template v-if="!demo"><span>有效 <b>183</b></span><span>冻结 <b style="color:#f0a020">3</b></span><a href="pool.html">查看名单</a></template>
      <template v-else><span>模拟样本企业</span></template>
    </stat-card>
  </div>

  <div class="card">
    <div class="card-title">
      <span><span class="unit-pill ns" style="margin-right:8px">非钢材 · 数量</span>非钢材品类<small>昨日销量与日末库存 · 按数量统计，各品名使用自己的数量单位</small></span>
      <a v-if="!demo" href="query.html" style="font-weight:400;font-size:13px">到多维查询按规格查看 ›</a>
    </div>
    <table class="plain-table">
      <thead><tr><th>品名</th><th class="c">数量单位</th><th class="r">昨日销量</th><th class="r">昨日日末库存</th><th class="r">近 7 日日均销量</th><th class="r">库存可销天数</th><th class="c">贡献企业数</th></tr></thead>
      <tbody><tr v-for="r in nsRows" :key="r.name"><td><b>{{ r.name }}</b></td><td class="c"><span class="unit-pill ns">{{ r.unit }}</span></td><td class="r"><span class="num">{{ $fmt(r.sales) }}</span></td><td class="r"><span class="num">{{ $fmt(r.stock) }}</span></td><td class="r"><span class="num">{{ $fmt(r.avg7) }}</span></td><td class="r"><span class="num">{{ r.days }}</span> 天</td><td class="c"><contrib-tag :n="r.n" /></td></tr></tbody>
    </table>
    <div class="small muted mt8">不同数量单位之间不相加，所以这里没有合计行，也没有占比；数量不换算成吨位。非钢材暂不提供价格指标，地区最细到省。非钢材的范围与各品名的数量单位由业务方确定，此处为示例。</div>
  </div>

  <div class="grid" style="grid-template-columns:minmax(0,11fr) minmax(0,10fr)">
    <div class="card">
      <div class="card-title">
        <span>地区分布<small>{{ mapLevel==='china' ? '全国 · 省级（点击省份下钻）' : mapProv + ' · 地级市' }}</small></span>
        <span class="right">
          <el-radio-group v-model="regionMode" size="small"><el-radio-button label="仓库所在地" value="仓库所在地" /><el-radio-button label="流向地" value="流向地" /></el-radio-group>
          <el-radio-group v-model="metric" size="small"><el-radio-button v-for="o in metricOpts" :key="o.k" :label="o.t" :value="o.k" /></el-radio-group>
        </span>
      </div>
      <el-alert v-if="regionMode==='流向地'" type="info" :closable="false" show-icon style="margin-bottom:8px" title="流向地为下游选填字段，当前数据池销量的流向地填报覆盖率为 71.4%，未填报部分不计入流向地口径，因此各地区销量合计小于昨日销量；库存与可销天数仍按仓库所在地统计。" />
      <div style="position:relative">
        <el-button v-if="mapLevel!=='china'" size="small" style="position:absolute;left:0;top:0;z-index:2" @click="backChina"><el-icon><Back /></el-icon>返回全国</el-button>
        <ve-chart :option="mapOption" height="430px" @chart-click="onMapClick"></ve-chart>
        <div class="legend-inline" style="position:absolute;right:4px;bottom:6px"><span class="mask-cell" style="min-width:26px;height:16px">—</span>未披露地区（样本不足）</div>
      </div>
    </div>
    <div class="card">
      <div class="card-title"><span>{{ mapLevel==='china' ? '省级排行' : mapProv + ' · 地级市排行' }}<small>按{{ regionMode }}</small></span>
        <el-button v-if="mapLevel!=='china'" link type="primary" @click="backChina">返回全国</el-button></div>
      <el-table :data="regionRows" size="small" height="398" :row-class-name="rowClass" @row-click="drillProv">
        <el-table-column label="地区" min-width="104">
          <template #default="{row}">
            <template v-if="row.merged"><el-tooltip placement="top" :content="'合并成员：' + row.members.join('、') + '。这些地区单独不满足披露条件，为防止用合计倒推，合并为一行披露。'"><span>其他<span class="merged-row-tag">合并披露</span></span></el-tooltip></template>
            <a v-else-if="mapLevel==='china'" href="javascript:;">{{ row.name }}</a><span v-else>{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="销量(吨)" align="right" min-width="84"><template #default="{row}"><v-num :v="row.sales" /></template></el-table-column>
        <el-table-column label="库存(吨)" align="right" min-width="92"><template #default="{row}"><v-num :v="row.stock" /></template></el-table-column>
        <el-table-column label="可销天数" align="right" width="76"><template #default="{row}"><v-num :v="row.days" :d="1" /></template></el-table-column>
        <el-table-column label="贡献企业数" width="100" align="center"><template #default="{row}"><contrib-tag :n="row.n" /></template></el-table-column>
      </el-table>
      <div class="tbl-foot"><span>合计　销量 <b class="num">{{ $fmt(regionTotal.sales) }}</b> 吨　库存 <b class="num">{{ $fmt(regionTotal.stock) }}</b> 吨　可销 <b class="num">{{ regionTotal.days }}</b> 天</span>
        <el-tooltip placement="top" content="贡献企业数按仓库所在地统计：一家企业在多个省、市有仓库的，在每个地区各计一次，所以各地区之和大于数据池企业数；企业名单里的“所在地”是企业注册地，两者口径不同。"><span class="small muted" style="cursor:help">贡献企业数口径 <el-icon style="vertical-align:-2px"><QuestionFilled /></el-icon></span></el-tooltip></div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">
      <span>销量与库存趋势</span>
      <span class="right">
        <el-checkbox v-model="showYoy" size="small">叠加同比</el-checkbox>
        <el-radio-group v-model="grain" size="small"><el-radio-button v-for="g in ['日','周','旬','月']" :key="g" :label="g" :value="g" /></el-radio-group>
      </span>
    </div>
    <ve-chart :option="trendOption" height="280px"></ve-chart>
    <div class="small muted mt8"><span style="color:#7044c4">┆ 口径变更</span>：数据池成员在该日变更（{{ demo ? '演示' : '11-01 起新增 6 家、免费替换 1 家' }}）。变更日前的数据仍按当时的成员集合计算，历史不重算。<template v-if="grain!=='日'">周、旬、月销量为周期内每日销量之和，库存为周期最后一天的日末库存；{{ grain==='周' ? '周为截至数据日期、每 7 天一段' : grain==='旬' ? '旬只展示已结束的完整旬，最新为 11 月中旬' : '2026-11 为截至 11-23 的累计' }}。</template></div>
  </div>

  <div class="grid" :class="priceOn ? 'c-3-2' : ''">
    <div class="card">
      <div class="card-title">
        <span>品类结构<small>昨日销量与日末库存 · 当前层级：{{ catLevelName }}</small></span>
        <el-breadcrumb separator=">" style="font-weight:400;font-size:13px">
          <el-breadcrumb-item><a href="javascript:;" @click="catTo(0)">全部大类</a></el-breadcrumb-item>
          <el-breadcrumb-item v-for="(c,i) in catPath" :key="c"><a href="javascript:;" @click="catTo(i+1)">{{ c }}</a></el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div v-if="catDim">
        <div class="row small" style="gap:10px;margin-bottom:8px;flex-wrap:wrap">
          <span class="dim-chip" style="margin:0">{{ catDim.d.tpl.name }}模板</span>
          <span>层级 <el-radio-group :model-value="dimLevel || catDim.d.defLevel" size="small" @update:model-value="(v) => { dimLevel = v; }"><el-radio-button v-for="l in catDim.d.levels" :key="l.k" :value="l.k" :label="l.t" /></el-radio-group></span>
          <el-radio-group v-model="dimMetric" size="small"><el-radio-button label="销量" value="sales" /><el-radio-button label="库存" value="stock" /></el-radio-group>
          <span v-if="catDim.d.tplKey==='型材'" class="muted">{{ catDim.name }}的第二维度固定为{{ catDim.d.d2.segName }}（按品名配置，不能切换）</span>
          <span class="muted">分段方案 {{ bandVer.ver }}（示例参数）</span>
        </div>
        <dim-table compact :name="catDim.name" :total="dimMetric==='stock' ? catDim.stock : catDim.sales" :n="catDim.n" :seg-w="dimMetric==='stock' ? catDim.stockW : undefined" :metric="dimMetric==='stock' ? '日末库存' : '昨日销量'" :level="dimLevel || catDim.d.defLevel"></dim-table>
      </div>
      <div v-else class="grid" style="grid-template-columns: 170px minmax(0,1fr); margin-bottom:0">
        <ve-chart :option="catOption" height="290px"></ve-chart>
        <el-table :data="catRows" size="small" height="290" @row-click="drillCat">
          <el-table-column :label="catLevelName" min-width="92">
            <template #default="{row, $index}"><span class="dot" :style="{background: colors[$index % colors.length]}"></span>
              <template v-if="row.merged"><el-tooltip placement="top" :content="'合并成员：' + row.members.join('、') + (row.why ? '。' + row.why : '')"><span>其他<span class="merged-row-tag">合并披露</span></span></el-tooltip></template>
              <a v-else-if="row.child" href="javascript:;">{{ row.name }}</a>
              <el-tooltip v-else-if="row.locked" placement="top" content="该品类暂不提供此粒度：标准化深度为品名级，材质与规格段暂不开放下钻"><span>{{ row.name }}<el-icon style="color:#b0b7c3;vertical-align:-2px;margin-left:4px"><Lock /></el-icon></span></el-tooltip>
              <span v-else>{{ row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="catPath.length===0" label="可下钻层级" width="96"><template #default="{row}"><span v-if="!row.merged" class="level-tag" :class="{lock: row.depth<'L3'}" style="margin-left:0">{{ depthText(row.depth) }}</span></template></el-table-column>
          <el-table-column label="销量(吨)" align="right" width="76"><template #default="{row}"><v-num :v="row.sales" /></template></el-table-column>
          <el-table-column label="占比" align="right" width="58"><template #default="{row}"><v-num :v="row.share" :d="1" suffix="%" /></template></el-table-column>
          <el-table-column label="库存(吨)" align="right" width="84"><template #default="{row}"><v-num :v="row.stock" /></template></el-table-column>
          <el-table-column label="可销天" align="right" width="64"><template #default="{row}"><v-num :v="row.days" :d="1" /></template></el-table-column>
          <el-table-column label="企业数" width="94" align="center"><template #default="{row}"><contrib-tag :n="row.n" /></template></el-table-column>
        </el-table>
      </div>
      <div class="small muted mt8">品名以下按该品类的统计维度查看：管材默认到规格段 × 壁厚段（可再细到规格 × 壁厚段），板材为厚度段 × 宽度段，建材为规格，型材为规格加公斤段或负差段（按品名固定其一）；不提供按壁厚段、宽度段的列合计；冷轧及涂镀的标准化深度到材质，模板维度已采集、暂不披露。优特钢、不锈钢样本较稀疏，最细披露粒度为“地区到省、时间到旬”；看板为日粒度，这两个大类合并为“其他”一行，分品类数据请到<a v-if="!demo" href="query.html">多维查询</a><template v-else>多维查询</template>按旬查看。</div>
    </div>
    <div class="card" v-if="priceOn">
      <div class="card-title"><span>量价速览<small>含税、自提、非暂估 · 加权均价 · 元/吨 · 日粒度（标“旬”的为旬粒度）</small></span><a v-if="!demo" href="price.html" style="font-weight:400;font-size:13px">进入量价视图 ›</a></div>
      <el-table :data="priceRows" size="small">
        <el-table-column label="品种" min-width="150"><template #default="{row}">{{ row.name }}<el-tooltip v-if="row.grain==='旬'" placement="top" content="该品类最细时间粒度为旬：均价为本旬加权均价，涨跌为旬环比"><span class="level-tag" style="margin-left:6px">旬</span></el-tooltip></template></el-table-column>
        <el-table-column label="加权均价" align="right" width="78"><template #default="{row}"><v-num :v="row.price" /></template></el-table-column>
        <el-table-column label="涨跌" align="right" width="66"><template #default="{row}"><v-num :v="row.chg" signed /></template></el-table-column>
        <el-table-column label="价格覆盖率" align="center" width="112"><template #default="{row}"><cover-tag :r="row.cover" /></template></el-table-column>
      </el-table>
      <div class="tip-box blue mt12 small"><b>样本成交均价，不是市场报价。</b>价格为下游自愿上传，只统计有价样本；有价企业数不少于 {{ $PV.kPrice }} 家才披露，覆盖率只给区间，不提供金额合计与有价样本销量。</div>
    </div>
  </div>

  <div class="card">
    <div class="card-title"><span>本厂品牌视图<small>{{ brandName }} 品牌在各地区的渠道动销 · 其他品牌合并为“其他品牌”展示</small></span>
      <span class="right"><el-tag type="info" size="small" effect="plain">竞品品牌不实名披露</el-tag></span></div>
    <div class="grid" style="grid-template-columns: minmax(0,1fr) 500px; margin-bottom:0">
      <ve-chart :option="brandOption" height="290px"></ve-chart>
      <el-table :data="brandRows" size="small" height="290">
        <el-table-column prop="name" label="地区" width="58" />
        <el-table-column label="本厂销量(吨)" align="right" min-width="92"><template #default="{row}"><v-num :v="row.sales" /></template></el-table-column>
        <el-table-column label="份额" align="right" width="64"><template #default="{row}"><v-num :v="row.share" :d="1" suffix="%" /></template></el-table-column>
        <el-table-column label="渠道库存(吨)" align="right" min-width="92"><template #default="{row}"><v-num :v="row.stock" /></template></el-table-column>
        <el-table-column label="可销天数" align="right" width="74"><template #default="{row}"><v-num :v="row.days" :d="1" tip="分子或分母被屏蔽时，比率类指标同步屏蔽" /></template></el-table-column>
      </el-table>
    </div>
  </div>
</div>`,
  };
})();
