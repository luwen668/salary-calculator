// 中国地图城市选择器 · 与计算器双向联动
// 依赖：echarts（页面已加载）、CITIES / DATA_YEAR（data.js）
window.initCityMap = function (opts) {
  const { container, onSelect, initial } = opts;
  let chart = null;
  let selected = initial;
  let geoReady = false;

  // 城市名 → 所属省份名（用于省份高亮）
  const PROVINCE_OF = {
    beijing: "北京市", shanghai: "上海市", guangzhou: "广东省", shenzhen: "广东省",
    hangzhou: "浙江省", chengdu: "四川省", wuhan: "湖北省", nanjing: "江苏省",
    chongqing: "重庆市", xian: "陕西省",
  };

  const cityPoints = Object.entries(CITIES).map(([key, c]) => ({
    key, name: c.name, value: c.coord.concat(c.socialBase.min, c.socialBase.max),
  }));

  function render() {
    if (!chart || !geoReady) return;
    const selProvince = PROVINCE_OF[selected];
    chart.setOption({
      tooltip: {
        backgroundColor: "rgba(11,15,26,0.95)",
        borderColor: "rgba(34,211,238,0.3)",
        textStyle: { color: "#e2e8f0", fontSize: 13 },
        formatter(p) {
          if (p.seriesType === "effectScatter") {
            const d = p.data;
            return `<b style="font-size:15px;color:#22d3ee">${d.name}</b><br/>
                    社保基数 ${Number(d.value[2]).toLocaleString()} – ${Number(d.value[3]).toLocaleString()}<br/>
                    <span style="color:#64748b;font-size:12px">点击选择该城市</span>`;
          }
          const hit = cityPoints.find((c) => PROVINCE_OF[c.key] === p.name);
          if (hit) return `<b>${p.name}</b><br/><span style="color:#64748b;font-size:12px">含已支持城市：${hit.name} 等 · 点击光点切换</span>`;
          return `<b>${p.name}</b><br/><span style="color:#64748b;font-size:12px">该省数据筹备中</span>`;
        },
      },
      geo: {
        map: "china",
        roam: false,
        zoom: 1.62,
        center: [104.5, 36.5],
        scaleLimit: { min: 1, max: 4 },
        label: {
          show: true, color: "rgba(148,163,184,0.75)", fontSize: 10.5,
          fontFamily: "Noto Sans SC, sans-serif",
        },
        emphasis: {
          label: { color: "#e2e8f0" },
          itemStyle: { areaColor: "rgba(34,211,238,0.14)" },
        },
        select: {
          label: { color: "#e2e8f0" },
          itemStyle: { areaColor: "rgba(34,211,238,0.10)" },
        },
        itemStyle: {
          areaColor: "rgba(17,24,39,0.85)",
          borderColor: "rgba(34,211,238,0.35)",
          borderWidth: 0.7,
          shadowColor: "rgba(34,211,238,0.15)",
          shadowBlur: 12,
        },
        regions: selProvince ? [{
          name: selProvince,
          itemStyle: { areaColor: "rgba(34,211,238,0.13)", borderColor: "#22d3ee", borderWidth: 1.1 },
          label: { color: "#22d3ee" },
        }] : [],
      },
      series: [
        {
          type: "effectScatter",
          coordinateSystem: "geo",
          zlevel: 2,
          rippleEffect: { brushType: "stroke", scale: 3.2 },
          symbolSize: (val, params) => (params.data.key === selected ? 13 : 9),
          label: {
            show: true, position: "right", distance: 6,
            formatter: (p) => p.data.name,
            color: "#cbd5e1", fontSize: 12, fontWeight: 600,
            fontFamily: "Noto Sans SC, sans-serif",
            backgroundColor: "rgba(11,15,26,0.6)",
            padding: [2, 6], borderRadius: 4,
          },
          emphasis: { scale: 1.4 },
          itemStyle: {
            color: (p) => (p.data.key === selected ? "#22d3ee" : "rgba(34,211,238,0.55)"),
            shadowColor: "#22d3ee",
            shadowBlur: (p) => (p.data.key === selected ? 18 : 8),
          },
          data: cityPoints,
        },
      ],
    });
  }

  chart = echarts.init(container);
  chart.on("click", (p) => {
    if (p.seriesType === "effectScatter" && p.data && p.data.key) {
      selected = p.data.key;
      render();
      onSelect(selected);
    }
  });
  window.addEventListener("resize", () => chart.resize());

  fetch("china.json").then((r) => r.json()).then((geoJson) => {
    echarts.registerMap("china", geoJson);
    geoReady = true;
    render();
  }).catch(() => {
    container.innerHTML = '<p style="color:#64748b;font-size:13px;padding:40px 0">地图数据加载失败，请使用左侧下拉框选择城市。</p>';
  });

  return {
    setSelected(key) { selected = key; render(); },
    resize() { chart && chart.resize(); },
  };
};
