/* 钢贸上下游数据平台 · 高保真原型 · 公共框架（布局、通用组件、工具函数）
 * 纯静态：Vue 3 全局构建 + Element Plus + ECharts，全部从 assets/lib 本地加载。 */
(function () {
  const { createApp } = Vue;

  /* ------------------------------------------------------------------ 工具 */
  const fmt = (n, d = 0) => {
    if (n === null || n === undefined || n === '') return '—';
    return Number(n).toLocaleString('zh-CN', { minimumFractionDigits: d, maximumFractionDigits: d });
  };
  const pct = (n, d = 1) => (n === null || n === undefined ? '—' : (n > 0 ? '+' : '') + Number(n).toFixed(d) + '%');
  const rng = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const hash = (s) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const addDays = (s, n) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return dateStr(d); };
  const dayList = (end, n) => Array.from({ length: n }, (_, i) => addDays(end, i - n + 1));

  /* 防反推展示规则（与运营后台“防反推参数”页的默认值一致） */
  const PV = { nMin: 20, k: 5, dom1: 50, dom2: 80, bands: ['5–9', '10–19', '20–49', '50+'], roundTon: 1, roundPrice: 10, kPrice: 8, otherBrands: 3, coverBands: ['低于 30%', '30%–60%', '高于 60%'] };
  /* 价格覆盖率（有价销量 ÷ 全部销量）只以区间展示 */
  const coverBand = (r) => (r == null ? null : r < 0.3 ? '低于 30%' : r <= 0.6 ? '30%–60%' : '高于 60%');
  const band = (n) => (n == null || n < PV.k ? null : n < 10 ? '5–9' : n < 20 ? '10–19' : n < 50 ? '20–49' : '50+');
  const MASK_TIP = '样本不足，不予披露';

  /* 一维列表的披露处理：不满足门槛的成员与最小可见成员合并为“其他（合并披露）”。
   * items: [{name, n, ...数值字段}]，sumKeys: 需要求和的字段。 */
  const disclose = (items, sumKeys, sortKey) => {
    const key = sortKey || sumKeys[0];
    const visible = items.filter((i) => i.n >= PV.k && !i.dom).sort((a, b) => b[key] - a[key]);
    const masked = items.filter((i) => !(i.n >= PV.k && !i.dom));
    if (!masked.length) return { rows: visible, merged: null };
    const group = masked.slice();
    const gN = () => group.reduce((s, i) => s + i.n, 0);
    while ((group.length < 2 || gN() < PV.k) && visible.length > 1) group.push(visible.pop());
    const merged = { name: '其他（合并披露）', merged: true, members: group.map((g) => g.name), n: gN() };
    sumKeys.forEach((k2) => { merged[k2] = group.reduce((s, i) => s + (i[k2] || 0), 0); });
    return { rows: visible.concat([merged]), merged };
  };

  /* ------------------------------------------------------------------ 原型状态（跨页面保持）
   * gate：上游价格功能闸口（运营后台控制，默认关闭）；dnPrice：下游示例企业的价格上传开关（默认关闭）。
   * 同时写入 localStorage 与链接 hash，保证在各浏览器以 file:// 打开时都能跨页保持。 */
  const STATE_DEFAULT = { gate: 'closed', dnPrice: 'off' };
  const state = Vue.reactive(Object.assign({}, STATE_DEFAULT));
  const stateHash = () => {
    const diff = Object.keys(STATE_DEFAULT).filter((k) => state[k] !== STATE_DEFAULT[k]).map((k) => k + ':' + state[k]);
    return diff.length ? '#s=' + diff.join(',') : '';
  };
  (function loadState() {
    try { const s = JSON.parse(localStorage.getItem('stp-proto-state') || '{}'); Object.keys(STATE_DEFAULT).forEach((k) => { if (typeof s[k] === 'string') state[k] = s[k]; }); } catch (e) { /* ignore */ }
    const m = /#s=([^&]*)/.exec(location.hash || '');
    if (m) m[1].split(',').forEach((kv) => { const a = kv.split(':'); if (a[0] in STATE_DEFAULT && a[1]) state[a[0]] = a[1]; });
  })();
  const setState = (k, v) => {
    state[k] = v;
    try { localStorage.setItem('stp-proto-state', JSON.stringify(state)); } catch (e) { /* ignore */ }
    try { history.replaceState(null, '', location.pathname + location.search + (stateHash() || '#')); } catch (e) { /* ignore */ }
  };
  const withState = (u) => (/^[^#:?]+\.html$/.test(u) ? u + stateHash() : u);
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const h = a.getAttribute('href');
    if (/^[^#:?]+\.html$/.test(h) && stateHash()) { e.preventDefault(); location.href = h + stateHash(); }
  });

  /* ------------------------------------------------------------------ 三端菜单 */
  const PORTALS = {
    upstream: {
      name: '上游钢厂端', color: '#409eff', org: '东岳钢铁集团有限公司', user: '周立明', role: '企业管理员', home: 'dashboard.html',
      menu: [
        { group: '数据洞察', items: [
          { key: 'dashboard', title: '聚合看板', icon: 'DataBoard' },
          { key: 'query', title: '多维查询', icon: 'Grid' },
          { key: 'price', title: '量价视图', icon: 'TrendCharts', gate: true },
          { key: 'export', title: '导出中心', icon: 'Download' } ] },
        { group: '数据池与选购', items: [
          { key: 'pool', title: '数据来源企业名单', icon: 'OfficeBuilding' },
          { key: 'directory', title: '企业名录选购', icon: 'ShoppingCart' },
          { key: 'quota-package', title: '批量购买名额包', icon: 'Box' } ] },
        { group: '订单与账务', items: [
          { key: 'orders', title: '订单与订阅', icon: 'Tickets' } ] },
        { group: '试用', items: [
          { key: 'demo', title: '模拟数据演示看板', icon: 'Monitor' } ] },
      ],
    },
    downstream: {
      name: '下游钢贸端', color: '#18a058', org: '苏州恒运钢铁贸易有限公司', user: '陈海峰', role: '企业管理员', home: 'home.html',
      menu: [
        { group: '总览', items: [
          { key: 'home', title: '工作台', icon: 'HomeFilled' } ] },
        { group: '数据接入', items: [
          { key: 'api-access', title: 'ERP 接口接入', icon: 'Connection' },
          { key: 'api-docs', title: '接口文档中心', icon: 'Document' },
          { key: 'upload-rules', title: '上传条件规则', icon: 'Filter' },
          { key: 'upload-settings', title: '上传设置', icon: 'SetUp' } ] },
        { group: '数据自查', items: [
          { key: 'daily-summary', title: '每日上传汇总', icon: 'Calendar' },
          { key: 'data-check', title: '已上传数据自查', icon: 'Search' } ] },
        { group: '数据安全中心', items: [
          { key: 'visibility', title: '名称可见性设置', icon: 'View' },
          { key: 'ledger', title: '数据使用透明账本', icon: 'Notebook' },
          { key: 'pause-exit', title: '暂停与退出', icon: 'SwitchButton' } ] },
        { group: '权益回馈', items: [
          { key: 'benchmark', title: '行业对标数据', icon: 'Histogram' },
          { key: 'revenue', title: '我的收益', icon: 'Coin' } ] },
      ],
    },
    admin: {
      name: '平台运营后台', color: '#f0a020', org: '货袋子平台 · 数据板块', user: '林若彤', role: '运营主管', home: 'workbench.html',
      menu: [
        { group: '总览', items: [
          { key: 'workbench', title: '运营工作台', icon: 'Odometer' } ] },
        { group: '企业与数据池', items: [
          { key: 'enterprises', title: '企业管理', icon: 'OfficeBuilding' },
          { key: 'pools', title: '数据池管理', icon: 'Coin' } ] },
        { group: '主数据', items: [
          { key: 'master-category', title: '全品类主数据工作台', icon: 'Files' },
          { key: 'master-region', title: '地区与仓库', icon: 'MapLocation' } ] },
        { group: '数据治理', items: [
          { key: 'quality', title: '数据质量监控', icon: 'DataLine' },
          { key: 'grain-monitor', title: '上传粒度监控', icon: 'Operation' },
          { key: 'privacy-params', title: '防反推参数', icon: 'Lock' },
          { key: 'price-control', title: '价格数据管控', icon: 'PriceTag' } ] },
        { group: '交易与结算', items: [
          { key: 'billing', title: '订单与计费', icon: 'Tickets' },
          { key: 'share-rules', title: '分成规则与台账', icon: 'Notebook' },
          { key: 'settlement', title: '分成结算', icon: 'Wallet' } ] },
        { group: '安全审计', items: [
          { key: 'audit', title: '审计日志', icon: 'Memo' } ] },
      ],
    },
  };

  /* ------------------------------------------------------------------ 布局组件 */
  const AppLayout = {
    props: { portal: String, active: String, title: String, desc: String, watermark: Boolean, user: String, role: String },
    data() {
      return { P: PORTALS[this.portal], portals: PORTALS, state };
    },
    computed: {
      wm() {
        if (!this.watermark) return null;
        const text = this.P.org.replace('集团有限公司', '') + ' zhoulm 2026-11-24';
        const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='320' height='200'><text x='20' y='120' transform='rotate(-22 160 100)' font-size='13' fill='rgba(60,80,110,0.13)' font-family='sans-serif'>" + text + '</text></svg>';
        return { backgroundImage: 'url("data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '")' };
      },
    },
    methods: {
      setState,
      show(m) { return !m.gate || state.gate === 'open'; },
      go(p) { location.href = withState('../' + p + '/' + PORTALS[p].home); },
      cmd(c) {
        if (c === 'index') location.href = withState('../index.html');
        else if (PORTALS[c]) this.go(c);
        else ElementPlus.ElMessage.info('原型演示：该功能复用货袋子平台现有能力');
      },
    },
    template: `
    <div class="stp-shell">
      <aside class="stp-side">
        <a class="stp-logo" href="../index.html" title="返回原型入口">
          <span class="stp-logo-mark">袋</span>
          <span class="stp-logo-text"><b>货袋子</b><span>钢贸上下游数据平台</span></span>
        </a>
        <div class="stp-portal-badge"><i :style="{background:P.color}"></i>{{ P.name }}</div>
        <template v-for="g in P.menu" :key="g.group">
          <div class="stp-menu-group">{{ g.group }}</div>
          <template v-for="m in g.items" :key="m.key">
            <a v-if="show(m)" class="stp-menu-item" :class="{active: m.key===active}" :href="m.key + '.html'">
              <el-icon><component :is="m.icon" /></el-icon><span>{{ m.title }}</span>
            </a>
          </template>
        </template>
        <div style="height:24px"></div>
      </aside>
      <div class="stp-main">
        <header class="stp-header">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>货袋子</el-breadcrumb-item>
            <el-breadcrumb-item>数据板块</el-breadcrumb-item>
            <el-breadcrumb-item>{{ P.name }}</el-breadcrumb-item>
            <el-breadcrumb-item>{{ title }}</el-breadcrumb-item>
          </el-breadcrumb>
          <span class="spacer"></span>
          <el-tooltip v-if="portal==='upstream'" placement="bottom" content="原型演示用：模拟运营后台的“上游价格功能闸口”。默认关闭；关闭时上游侧不出现任何价格入口、指标与导出列。正式环境由运营后台经双人复核后开启。">
            <span class="proto-switch">原型状态 · 价格闸口
              <el-switch :model-value="state.gate==='open'" size="small" @change="v => setState('gate', v ? 'open' : 'closed')" />
              <b :style="{color: state.gate==='open' ? '#18a058' : '#8a94a3'}">{{ state.gate==='open' ? '已开放' : '未开放' }}</b>
            </span>
          </el-tooltip>
          <a class="stp-header-tool" href="../index.html"><el-icon><Menu /></el-icon>原型导航</a>
          <el-dropdown @command="cmd">
            <span class="stp-header-tool"><el-icon><Switch /></el-icon>切换身份<el-icon><ArrowDown /></el-icon></span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="(v,k) in portals" :key="k" :command="k" :disabled="k===portal">
                  <span class="dot" :style="{background:v.color}"></span>{{ v.name }}<span v-if="k===portal" class="muted small">（当前）</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-badge :value="portal==='admin'?12:3" :max="99"><el-icon :size="18" style="color:#5b6778;cursor:pointer" @click="cmd('msg')"><Bell /></el-icon></el-badge>
          <el-dropdown @command="cmd">
            <span class="stp-user">
              <el-avatar :size="30" :style="{background:P.color}">{{ (user || P.user).slice(0,1) }}</el-avatar>
              <span class="meta"><b>{{ user || P.user }} · {{ role || P.role }}</b><span>{{ P.org }}</span></span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="member">成员与角色</el-dropdown-item>
                <el-dropdown-item command="profile">企业认证信息</el-dropdown-item>
                <el-dropdown-item command="index" divided>返回原型入口</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </header>
        <main class="stp-content">
          <div v-if="wm" class="stp-watermark" :style="wm"></div>
          <div class="stp-page-head">
            <div><h1>{{ title }}</h1><p v-if="desc">{{ desc }}</p></div>
            <div class="actions"><slot name="actions"></slot></div>
          </div>
          <slot></slot>
        </main>
        <footer class="stp-footer">货袋子 · 钢贸上下游数据平台 高保真原型 · 页面数据均为模拟数据，企业名称均为虚构</footer>
      </div>
    </div>`,
  };

  /* ------------------------------------------------------------------ 通用组件 */
  const MaskCell = {
    props: { tip: String, lg: Boolean },
    template: `<el-tooltip placement="top" :content="tip || '样本不足，不予披露'"><span class="mask-cell" :class="{lg}">—</span></el-tooltip>`,
  };
  /* 数值单元格：null 即被屏蔽 */
  const VNum = {
    props: { v: { default: null }, d: { type: Number, default: 0 }, suffix: String, tip: String, signed: Boolean },
    computed: {
      text() { return (this.signed && this.v > 0 ? '+' : '') + fmt(this.v, this.d) + (this.suffix || ''); },
      cls() { return this.signed ? (this.v > 0 ? 'up' : this.v < 0 ? 'down' : '') : ''; },
    },
    template: `<mask-cell v-if="v===null || v===undefined" :tip="tip" /><span v-else class="num" :class="cls">{{ text }}</span>`,
  };
  const ContribTag = {
    props: { n: { default: null }, band: String, label: String },
    computed: { b() { return this.band || band(this.n); } },
    template: `<mask-cell v-if="!b" />
      <el-tooltip v-else placement="top" content="贡献企业数只展示区间，不展示精确家数与企业名称">
        <span class="contrib-tag" :class="{b1: b==='5–9'}"><el-icon><UserFilled /></el-icon>{{ label || '' }}{{ b }} 家</span>
      </el-tooltip>`,
  };
  /* 价格覆盖率区间标签（上游侧每个价格数旁展示） */
  const CoverTag = {
    props: { r: { default: null }, band: String },
    computed: { b() { return this.band || coverBand(this.r); } },
    template: `<mask-cell v-if="!b" />
      <el-tooltip v-else placement="top" content="价格覆盖率 = 有价样本销量 ÷ 全部销量，只展示区间；不披露有价样本的精确销量与金额合计">
        <span class="cover-tag">覆盖率 {{ b }}</span>
      </el-tooltip>`,
  };
  const StatCard = {
    props: { label: String, value: { default: null }, unit: String, d: { type: Number, default: 0 }, mom: { default: undefined }, yoy: { default: undefined }, momLabel: { type: String, default: '环比' }, tip: String, icon: String, note: String },
    methods: { pct },
    template: `<div class="stat">
      <div class="label">{{ label }}<el-tooltip v-if="tip" :content="tip" placement="top"><el-icon><QuestionFilled /></el-icon></el-tooltip></div>
      <div class="value num"><mask-cell v-if="value===null" lg /><template v-else>{{ $fmt(value, d) }}<span class="unit">{{ unit }}</span></template></div>
      <div class="foot">
        <span v-if="mom!==undefined">{{ momLabel }} <mask-cell v-if="mom===null" /><b v-else :class="mom>=0?'up':'down'">{{ pct(mom) }}</b></span>
        <span v-if="yoy!==undefined">同比 <mask-cell v-if="yoy===null" /><b v-else :class="yoy>=0?'up':'down'">{{ pct(yoy) }}</b></span>
        <span v-if="note">{{ note }}</span>
        <slot></slot>
      </div>
      <div v-if="icon" class="ico"><el-icon><component :is="icon" /></el-icon></div>
    </div>`,
  };
  const SampleNote = {
    props: { date: { type: String, default: '2026-11-23' }, pool: { type: [Number, String], default: 186 }, region: { type: String, default: '仓库所在地' }, demo: Boolean, price: Boolean },
    template: `<div class="sample-note">
      <span><el-icon><Calendar /></el-icon>数据日期 <b>{{ date }}</b>（T+1，每日 8:00 前发布）</span>
      <span><el-icon><OfficeBuilding /></el-icon>数据池 <b>{{ pool }}</b> 家企业<template v-if="!demo">，名单见 <a href="pool.html">数据来源企业名单</a></template></span>
      <span>销量：销售出库 − 退货，按<b>{{ region }}</b>；库存：日末账面实物库存；吨位取整到 1 吨</span>
      <span v-if="price">价格：仅统计已选择上传价格的企业，含税加权均价，修约到 10 元/吨</span>
      <span class="warn"><el-icon><Warning /></el-icon>{{ demo ? '演示用模拟数据，不代表任何真实企业或市场' : '样本聚合数据，不代表全市场' }}</span>
      <span><span class="mask-cell" style="min-width:30px;height:18px">—</span> 表示样本不足，不予披露</span>
    </div>`,
  };
  const VeChart = {
    props: { option: Object, height: { type: String, default: '300px' } },
    emits: ['chart-click'],
    template: `<div :style="{height: height, width: '100%'}"></div>`,
    mounted() {
      this._chart = echarts.init(this.$el);
      if (this.option) this._chart.setOption(this.option);
      this._chart.on('click', (p) => this.$emit('chart-click', p));
      this._rs = () => this._chart && this._chart.resize();
      window.addEventListener('resize', this._rs);
      if (window.ResizeObserver) { this._ro = new ResizeObserver(this._rs); this._ro.observe(this.$el); }
    },
    watch: { option(v) { if (this._chart && v) this._chart.setOption(v, true); } },
    beforeUnmount() {
      window.removeEventListener('resize', this._rs);
      if (this._ro) this._ro.disconnect();
      if (this._chart) this._chart.dispose();
    },
  };

  /* ------------------------------------------------------------------ 图表选项辅助 */
  const COLORS = ['#409eff', '#36cfc9', '#f7b500', '#ff7a45', '#9254de', '#73d13d', '#ff85c0', '#5c6bc0', '#8c9bb0'];
  const baseGrid = { left: 8, right: 16, top: 36, bottom: 8, containLabel: true };
  const axisStyle = { axisLine: { lineStyle: { color: '#d5dbe3' } }, axisLabel: { color: '#6b7787' }, splitLine: { lineStyle: { color: '#eef1f5' } } };
  const tipFmt = (unit) => (ps) => {
    ps = Array.isArray(ps) ? ps : [ps];
    let s = '<b>' + (ps[0].axisValueLabel || ps[0].name) + '</b>';
    ps.forEach((p) => {
      const v = Array.isArray(p.value) ? p.value[1] : p.value;
      const u = typeof unit === 'function' ? unit(p) : (unit || '');
      s += '<br>' + p.marker + p.seriesName + '：' + (v === null || v === undefined || v === '-' || Number.isNaN(v) ? '— <span style="color:#999">（' + MASK_TIP + '）</span>' : '<b>' + fmt(v, Math.abs(v) < 100 && v % 1 ? 1 : 0) + '</b> ' + u);
    });
    return s;
  };
  const chart = {
    COLORS, baseGrid, axisStyle, tipFmt,
    line({ x, series, unit, area, yName, y2, smooth = true, marks, legend = true, grid }) {
      return {
        color: COLORS, grid: Object.assign({}, baseGrid, grid),
        tooltip: { trigger: 'axis', formatter: tipFmt((p) => (p.seriesIndex != null && series[p.seriesIndex] && series[p.seriesIndex].unit) || unit) },
        legend: legend ? { top: 0, right: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 4, textStyle: { color: '#6b7787' } } : undefined,
        xAxis: Object.assign({ type: 'category', data: x, boundaryGap: series.some((s) => s.type === 'bar') }, axisStyle, { splitLine: { show: false } }),
        yAxis: [Object.assign({ type: 'value', name: yName, nameTextStyle: { color: '#8a94a3', align: 'left' }, scale: true }, axisStyle)].concat(
          y2 ? [Object.assign({ type: 'value', name: y2, nameTextStyle: { color: '#8a94a3', align: 'right' }, scale: true }, axisStyle, { splitLine: { show: false } })] : []),
        series: series.map((s, i) => Object.assign({
          type: 'line', smooth, symbol: 'circle', symbolSize: 4, showSymbol: x.length <= 16, connectNulls: false, lineStyle: { width: 2 },
          areaStyle: area && i === 0 ? { opacity: 0.08 } : undefined,
          markLine: marks && i === 0 ? { symbol: 'none', silent: false, lineStyle: { color: '#9254de', type: 'dashed' }, label: { formatter: '{b}', color: '#7044c4', fontSize: 11 }, data: marks.map((m) => ({ xAxis: m.x, name: m.name })) } : undefined,
        }, s)),
      };
    },
    bar({ x, series, unit, horizontal, stack, legend = true, grid }) {
      const cat = Object.assign({ type: 'category', data: x }, axisStyle, { splitLine: { show: false } });
      const val = Object.assign({ type: 'value' }, axisStyle);
      return {
        color: COLORS, grid: Object.assign({}, baseGrid, grid),
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: tipFmt(unit) },
        legend: legend && series.length > 1 ? { top: 0, right: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 8, textStyle: { color: '#6b7787' } } : undefined,
        xAxis: horizontal ? val : cat, yAxis: horizontal ? Object.assign(cat, { inverse: true }) : val,
        series: series.map((s) => Object.assign({ type: 'bar', barMaxWidth: 22, stack: stack ? 'a' : undefined, itemStyle: { borderRadius: stack ? 0 : (horizontal ? [0, 3, 3, 0] : [3, 3, 0, 0]) } }, s)),
      };
    },
    pie({ data, unit, name, center = ['38%', '52%'], radius = ['48%', '72%'] }) {
      return {
        color: COLORS,
        tooltip: { trigger: 'item', formatter: (p) => p.marker + p.name + '<br><b>' + fmt(p.value) + '</b> ' + (unit || '') + '（' + p.percent + '%）' },
        legend: { orient: 'vertical', right: 0, top: 'middle', icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { color: '#4a5568' } },
        series: [{ name, type: 'pie', center, radius, avoidLabelOverlap: true, itemStyle: { borderColor: '#fff', borderWidth: 2 }, label: { show: false }, data }],
      };
    },
  };

  /* 动态加载省级地图（file:// 下可用，不依赖网络请求） */
  const loadGeo = (file) => new Promise((resolve, reject) => {
    const G = (window.__GEO__ = window.__GEO__ || {});
    if (G[file]) return resolve(G[file]);
    const s = document.createElement('script');
    s.src = '../assets/lib/geo/province/' + file + '.js';
    s.onload = () => resolve(G[file]);
    s.onerror = reject;
    document.head.appendChild(s);
  });

  /* ------------------------------------------------------------------ 启动 */
  const mount = (opts) => {
    const app = createApp(Object.assign({ template: '#page' }, opts));
    app.use(ElementPlus, { locale: window.ElementPlusLocaleZhCn });
    Object.keys(ElementPlusIconsVue).forEach((k) => app.component(k, ElementPlusIconsVue[k]));
    app.component('app-layout', AppLayout);
    app.component('mask-cell', MaskCell);
    app.component('v-num', VNum);
    app.component('contrib-tag', ContribTag);
    app.component('cover-tag', CoverTag);
    app.component('stat-card', StatCard);
    app.component('sample-note', SampleNote);
    app.component('ve-chart', VeChart);
    const g = app.config.globalProperties;
    g.$fmt = fmt; g.$pct = pct; g.$band = band; g.$PV = PV; g.$coverBand = coverBand;
    g.$demo = (msg) => ElementPlus.ElMessage({ message: msg || '原型演示：操作已模拟完成', type: 'success' });
    g.$go = (u) => { window.location.href = withState(u); };
    g.$state = state; g.$setState = setState;
    g.$info = (msg) => ElementPlus.ElMessage({ message: msg, type: 'info' });
    if (window.__GEO__ && window.__GEO__.china && window.echarts) echarts.registerMap('china', window.__GEO__.china);
    const vm = app.mount('#app');
    window.__APP__ = vm;
    return vm;
  };

  window.STP = { fmt, pct, rng, hash, pad, dateStr, addDays, dayList, PV, band, coverBand, MASK_TIP, disclose, PORTALS, chart, loadGeo, mount, state, setState, withState };
})();
