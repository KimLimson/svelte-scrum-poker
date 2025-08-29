<script>
  import { pieChartData } from '../../stores/gameStore.js';
  import PieChart from './PieChart.svelte';

  $: chartData = $pieChartData;
</script>

<div class="row">
  <div class="card col-wide" style="text-align:center">
    <div class="title">Results</div>
    <div style="display:flex; justify-content:center; align-items:center;">
      <PieChart data={chartData} size={520} />
    </div>
  </div>
</div>
