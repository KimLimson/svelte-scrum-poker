<script>
  export let data = [];
  export let size = 520; // big by default
  export let stroke = 'var(--accent)';
  // data: Array<{ label: string, value: number, color?: string }>
  const colors = ['#ffba08', '#faa307', '#f48c06', '#e85d04', '#dc2f02', '#d00000', '#9d0208', '#6a040f'];
  $: total = data.reduce((a, b) => a + b.value, 0) || 1;
  $: segments = data.map((d, i) => ({
    ...d,
    pct: d.value / total,
    color: d.color || colors[i % colors.length]
  }));
  let cx, cy, r;
  $: cx = size / 2, cy = size / 2, r = Math.max(10, size / 2 - 8);
  $: arcs = (() => {
    let a = 0; const out = [];
    for (const s of segments) {
      const start = a * 2 * Math.PI;
      const end = (a + s.pct) * 2 * Math.PI;
      out.push({ start, end, mid: (start + end) / 2, color: s.color, label: s.label, value: s.value });
      a += s.pct;
    }
    return out;
  })();
  function polarToCartesian(cx, cy, r, angle) {
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }
  function arcPath(cx, cy, r, start, end) {
    const largeArc = end - start > Math.PI ? 1 : 0;
    const s = polarToCartesian(cx, cy, r, start);
    const e = polarToCartesian(cx, cy, r, end);
    return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y} Z`;
  }
</script>

<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} class="chart">
  <circle cx={cx} cy={cy} r={r} fill="none" stroke={stroke} stroke-width="3" />
  {#each arcs as a}
    <path d={arcPath(cx,cy,r,a.start,a.end)} fill={a.color} opacity="0.9" stroke={stroke} stroke-width="1" />
  {/each}
  {#each arcs as a}
    {#if a.value > 0}
      {#key a.label}
        <text x={polarToCartesian(cx,cy,r*0.6,a.mid).x}
              y={polarToCartesian(cx,cy,r*0.6,a.mid).y}
              text-anchor="middle" dominant-baseline="middle" class="label">
          {a.label}: {a.value}
        </text>
      {/key}
    {/if}
  {/each}
</svg>

<style>
  .chart { display:block; margin: 0 auto; max-width: 100%; filter: drop-shadow(0 6px 16px rgba(0,0,0,.25)); border-radius: 12px }
  .label { fill: var(--text-primary); font-weight: 800; font-size: 18px }
  @media (max-width: 640px) {
    .label { font-size: 14px }
  }
</style>

