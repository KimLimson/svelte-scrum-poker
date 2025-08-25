<script>
  import { toasts, dismissToast } from './toast';
  let list = [];
  const unsub = toasts.subscribe(v => list = v);
  export let position = 'top-right';
  $: classes = position;
  
  function cls(t) {
    return `toast ${t.type}`;
  }
</script>

<style>
  .top-right { position: fixed; top: 16px; right: 16px; z-index: 9999; display: flex; flex-direction: column; gap: 10px }
  .toast { padding: 12px 14px; border-radius: 10px; font-weight: 600; box-shadow: 0 8px 24px rgba(0,0,0,.25); border: 1px solid rgba(250, 163, 7, 0.35); background: rgba(3,7,30,.75); color: var(--text-primary); backdrop-filter: blur(6px) }
  .toast.error { border-color: rgba(220, 47, 2, .65); }
  .toast.success { border-color: rgba(244, 140, 6, .65); }
</style>

<div class={classes}>
  {#each list as t}
    <div class={cls(t)} on:click={() => dismissToast(t.id)}>
      {t.message}
    </div>
  {/each}
</div>

