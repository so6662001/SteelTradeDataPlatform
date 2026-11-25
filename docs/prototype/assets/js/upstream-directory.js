/* 上游企业名录的模拟数据：企业名录选购（directory.html）与数据来源企业名单（pool.html）共用，
 * 保证两页看到的是同一批企业、同一个数据池。所有企业名称均为虚构。 */
(function () {
  const PLATE = ['热轧板卷', '中厚板', '冷轧及涂镀'];
  const PACKS = [
    { k: 'east', name: '华东建材样本包', n: 86, desc: '华东七省市 · 主营建筑钢材', test: (e) => e.region === '华东' && e.cat === '建筑钢材', set: { region: ['华东'], cats: ['建筑钢材'] } },
    { k: 'south', name: '华南板材样本包', n: 42, desc: '华南 · 主营热轧板卷、中厚板、冷轧及涂镀', test: (e) => e.region === '华南' && PLATE.indexOf(e.cat) >= 0, set: { region: ['华南'], cats: PLATE } },
    { k: 'special', name: '全国优特钢样本包', n: 38, desc: '全国 · 主营优特钢', test: (e) => e.cat === '优特钢', set: { region: [], cats: ['优特钢'] } },
  ];
  /* 池可用性提示用到的“省 × 大类”缺口（预估示例） */
  const GAPS = [
    { prov: '湖南', cat: '建筑钢材', abbr: '建材', need: 3 },
    { prov: '四川', cat: '热轧板卷', abbr: '热卷', need: 2 },
    { prov: '辽宁', cat: '建筑钢材', abbr: '建材', need: 2 },
  ];
  const inPoolAt = (i) => (i * 163) % 420 < 186;

  /* 名录数据：以 M.enterprises(420, 11) 为基础。为了让预置组合包的家数与卡片一致、提示可被满足，
   * 用另一组种子生成的企业替换少量条目（总数保持 420），再用确定性规则标出 186 家“已在池”。 */
  const LIST = (function build() {
    const list = M.enterprises(420, 11), extra = M.enterprises(1600, 12);
    const names = {}; list.forEach((e) => { names[e.name] = 1; });
    const inPack = (e) => PACKS.some((q) => q.test(e));
    const isGap = (e) => GAPS.some((g) => g.prov === e.prov && g.cat === e.cat);
    const take = (fn) => { const r = extra.find((x) => !names[x.name] && fn(x)); if (r) names[r.name] = 1; return r; };
    PACKS.forEach((p) => {
      let have = list.filter(p.test).length;
      for (let i = list.length - 1; i >= 0 && have !== p.n; i--) {
        const e = list[i];
        if (have > p.n) { if (!p.test(e)) continue; const r = take((x) => !inPack(x) && !isGap(x)); list[i] = r; have--; }
        else { if (inPack(e) || isGap(e)) continue; const r = take((x) => p.test(x) && !PACKS.some((q) => q !== p && q.test(x))); if (!r) break; list[i] = r; have++; }
      }
    });
    GAPS.forEach((g) => {
      const test = (e) => e.prov === g.prov && e.cat === g.cat;
      let have = list.filter((e, i) => test(e) && !inPoolAt(i)).length;
      for (let i = list.length - 1; i >= 0 && have < g.need + 1; i--) {
        if (inPoolAt(i) || inPack(list[i]) || isGap(list[i])) continue;
        const r = take(test); if (!r) break; list[i] = r; have++;
      }
    });
    /* 在池企业的固定设定（与数据来源企业名单、下游端示例企业一致）：
     * 第 183 家为下游示例企业苏州恒运；连续断传而冻结的 2 家活跃等级为“停更”，其余在池企业不为“停更”。 */
    const pool = list.filter((e, i) => inPoolAt(i));
    Object.assign(pool[182], { name: '苏州恒运钢铁贸易有限公司', mode: '实名', quality: 'A', scale: '50–100 万吨', cover: '部分上传：仅主营大类', months: 14, grain: '单据行级', brands: ['东岳钢铁', '金江钢铁'], priceOn: false, related: false });
    pool.forEach((e, i) => { e.activity = i === 23 || i === 97 ? '停更' : e.activity === '停更' ? '一般' : e.activity; });
    const anon = {};
    list.forEach((e, i) => {
      e.id = 'E' + (200001 + i); e.inPool = inPoolAt(i);
      while (anon[e.anon]) e.anon = e.anon.slice(0, -4) + String(1000 + (M.hash(e.anon) % 8999)).slice(-4);
      anon[e.anon] = 1; e.display = e.mode === '实名' ? e.name : e.anon;
    });
    return list;
  })();
  PACKS.forEach((p) => { p.inPool = LIST.filter((e) => p.test(e) && e.inPool).length; });
  /* 数据池调整已提交、将于 2026-12-01 生效的入池企业（替换 5 家、新增 1 家）：名录中不可重复选购 */
  const inPack = (e) => PACKS.some((q) => q.test(e));
  const isGap = (e) => GAPS.some((g) => g.prov === e.prov && g.cat === e.cat);
  const PENDING_ADJ = LIST.filter((e) => !e.inPool && e.activity === '活跃' && !inPack(e) && !isGap(e)).filter((e, i) => i % 9 === 4).slice(0, 6);
  PENDING_ADJ.forEach((e) => { e.pendIn = true; });
  /* 2026-11-20 的企业名录选购共选 43 家（对应加购订单 DO-20261120-0052）：
   * 13 家使用名额包内的未分配名额，不产生费用，已列为待生效；其余 30 家为加购（实名 22 家、匿名 8 家），订单待核销。
   * 至此东岳 200 个名额 = 在池 186 + 待生效 14（上面的新增 1 家 + 这 13 家）+ 未分配 0。 */
  const REST = LIST.filter((e) => !e.inPool && !e.pendIn && e.activity !== '停更' && !inPack(e) && !isGap(e));
  const PENDING_FREE = REST.filter((e, i) => i % 8 === 2).slice(0, 13);
  PENDING_FREE.forEach((e) => { e.pendIn = true; });
  const REST2 = REST.filter((e) => !e.pendIn);
  const PENDING_ORDER = REST2.filter((e) => e.mode === '实名').filter((e, i) => i % 2 === 0).slice(0, 22).concat(REST2.filter((e) => e.mode === '匿名').filter((e, i) => i % 4 === 1).slice(0, 8));
  PENDING_ORDER.forEach((e) => { e.pendOrder = true; });
  /* PENDING_IN：全部待生效入池企业，前 6 家为数据池调整（替换 5 家、新增 1 家），后 13 家为名录选购时用未分配名额分配的 */
  const PENDING_IN = PENDING_ADJ.concat(PENDING_FREE);
  window.UpDir = { PLATE, PACKS, GAPS, LIST, PENDING_IN, PENDING_FREE, PENDING_ORDER };
})();
