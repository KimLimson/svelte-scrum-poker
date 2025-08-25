<style>
  :global(:root) {
    --bg-primary: #03071e;
    --bg-secondary: #370617;
    --bg-tertiary: #6a040f;
    --card-bg: #370617;
    --card-border: #6a040f;
    --text-primary: #feedcd;
    --text-secondary: #fcc969;
    --text-muted: #fdbb92;
    --accent: #f48c06;
    --accent-hover: #faa307;
    --accent-light: #ffba08;
    --danger: #dc2f02;
    --success: #f48c06;
    --warning: #faa307;
  }

  :global(*) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    margin: 0;
    font-family:
      Inter,
      system-ui,
      -apple-system,
      Segoe UI,
      Roboto,
      sans-serif;
    background: linear-gradient(
      135deg,
      var(--bg-primary) 0%,
      var(--bg-secondary) 50%,
      var(--bg-tertiary) 100%
    );
    color: var(--text-primary);
    min-height: 100vh;
    line-height: 1.6;
  }

  :global(.container) {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    min-height: 100vh;
  }

  :global(.header) {
    text-align: center;
    margin-bottom: 3rem;
  }

  :global(.header h1) {
    font-size: 3rem;
    font-weight: 800;
    background: linear-gradient(135deg, var(--accent-light), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.5rem;
    text-shadow: 0 4px 8px rgba(244, 140, 6, 0.3);
  }

  :global(.header h1.app) {
    font-size: 2rem;
    font-weight: 800;
    background: linear-gradient(135deg, var(--accent-light), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.5rem;
    text-shadow: 0 4px 8px rgba(244, 140, 6, 0.3);
  }

  :global(.subtitle) {
    color: var(--text-muted);
    font-size: 1.1rem;
    font-weight: 400;
  }

  :global(.section) {
    margin-bottom: 2.5rem;
  }

  :global(.row) {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
    margin-bottom: 2rem;
  }

  :global(.card) {
    background: linear-gradient(135deg, var(--card-bg), rgba(106, 4, 15, 0.8));
    border: 2px solid var(--card-border);
    border-radius: 20px;
    padding: 2rem;
    box-shadow:
      0 12px 40px rgba(3, 7, 30, 0.4),
      0 4px 12px rgba(244, 140, 6, 0.1);
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  :global(.card::before) {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--accent), var(--accent-light));
    opacity: 0.6;
  }

  :global(.card:hover) {
    transform: translateY(-2px);
    box-shadow:
      0 16px 50px rgba(3, 7, 30, 0.5),
      0 6px 16px rgba(244, 140, 6, 0.15);
  }

  :global(.title) {
    font-size: 1.125rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
    color: var(--text-secondary);
  }

  :global(.muted) {
    color: var(--text-muted);
  }

  :global(.badge) {
    font-size: 12px;
    opacity: 0.85;
    color: var(--text-secondary);
  }

  :global(.grid) {
    display: grid;
    gap: 1rem;
  }

  :global(.two) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  :global(.hstack) {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  :global(.vstack) {
    display: flex;
    flex-direction: column;
  }

  :global(.cards) {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 0.5rem;
  }

  :global(.card-btn) {
    padding: 18px 20px;
    border-radius: 16px;
    background: rgba(250, 163, 7, 0.08);
    border: 1px solid rgba(250, 163, 7, 0.35);
    font-weight: 800;
    min-width: 64px;
    text-align: center;
    color: var(--text-primary);
    transition: all 0.2s ease;
  }

  :global(.card-btn:hover),
  :global(.card-btn.active) {
    transform: translateY(-1px);
    border-color: var(--accent);
    box-shadow: 0 6px 16px rgba(244, 140, 6, 0.2);
  }

  :global(.user) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border: 1px solid rgba(250, 163, 7, 0.25);
    border-radius: 12px;
    background: rgba(106, 4, 15, 0.35);
  }

  :global(.user .vote) {
    font-weight: 800;
    color: var(--accent-light);
  }

  :global(input),
  :global(select),
  :global(button) {
    background: rgba(3, 7, 30, 0.4);
    color: var(--text-primary);
    border: 1px solid rgba(250, 163, 7, 0.25);
    padding: 12px 14px;
    border-radius: 12px;
    outline: none;
  }

  :global(input:focus),
  :global(select:focus) {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(244, 140, 6, 0.25);
  }

  :global(button) {
    cursor: pointer;
    font-weight: 700;
  }

  :global(button.primary) {
    background: linear-gradient(135deg, var(--accent), var(--accent-light));
    color: #1a1a1a;
    border: none;
  }

  :global(button.ghost) {
    background: transparent;
    border-color: rgba(250, 163, 7, 0.35);
    color: var(--text-secondary);
  }

  :global(button.small) {
    padding: 8px 12px;
    font-size: 12px;
    border-radius: 10px;
  }

  :global(input:disabled) {
    opacity: 0.7;
    cursor: not-allowed;
  }

  /* Layout helpers */
  :global(.col) {
    flex: 1;
    min-width: 300px;
  }

  :global(.col-wide) {
    flex: 2;
    min-width: 360px;
  }

  :global(.between) {
    justify-content: space-between;
  }

  :global(.mt-1) {
    margin-top: 0.5rem;
  }

  :global(.mt-2) {
    margin-top: 0.75rem;
  }

  :global(.mt-3) {
    margin-top: 1rem;
  }

  /* Notes section styles */
  :global(.notes-header) {
    margin-bottom: 0.75rem;
  }

  :global(.note-icon svg) {
    display: block;
  }

  :global(.note-list) {
    gap: 0.75rem;
  }

  :global(.notes-footer) {
    margin-top: 0.75rem;
  }

  :global(.icon-btn) {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 8px 10px;
    border-radius: 10px;
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid rgba(250, 163, 7, 0.35);
  }

  :global(.icon-btn:hover) {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(244, 140, 6, 0.12);
  }

  :global(.icon-btn svg) {
    pointer-events: none;
  }

  :global(.icon-btn .btn-text) {
    font-size: 12px;
    font-weight: 700;
  }

  :global(.save-btn) {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  :global(.note-readonly) {
    padding: 0.5rem 0;
  }

  :global(.topic-display) {
    margin-top: 0.5rem;
    padding: 0.75rem;
    background: rgba(106, 4, 15, 0.3);
    border: 1px solid rgba(250, 163, 7, 0.25);
    border-radius: 8px;
  }

  :global(.topic-text) {
    font-weight: 600;
    color: var(--text-primary);
  }
</style>
