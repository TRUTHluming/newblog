const BGM_DISABLED_KEY = 'arknights.bgm.disabled';

function readBgmDisabled(): boolean {
  try {
    return window.localStorage.getItem(BGM_DISABLED_KEY) === '1';
  } catch {
    return false;
  }
}

function writeBgmDisabled(disabled: boolean): void {
  try {
    if (disabled) window.localStorage.setItem(BGM_DISABLED_KEY, '1');
    else window.localStorage.removeItem(BGM_DISABLED_KEY);
  } catch {
    // ignore (e.g. storage disabled)
  }
}

function setBgmControlUI(isPlaying: boolean): void {
  const control = document.getElementById('bgm-control') as SVGElement | null;
  if (!control) return;
  control.setAttribute('fill', isPlaying ? '#18d1ff' : 'currentColor');
  control.style.transform = isPlaying ? 'scaleY(1)' : 'scaleY(.5)';
}

function getDefaultAutoplay(bgm: HTMLAudioElement): boolean {
  const raw = bgm.getAttribute('data-autoplay');
  if (raw === null) return Boolean(bgm.autoplay);
  return raw === '' || raw === 'true' || raw === '1';
}

function initBgmState(): void {
  const bgm = document.getElementById('bgm') as HTMLAudioElement | null;
  if (!bgm) return;

  if (readBgmDisabled()) {
    bgm.autoplay = false;
    bgm.removeAttribute('autoplay');
    bgm.pause();
    setBgmControlUI(false);
    return;
  }

  const shouldAutoplay = getDefaultAutoplay(bgm);
  if (shouldAutoplay) {
    const p = bgm.play();
    if (p && typeof (p as Promise<void>).catch === 'function') {
      p.catch(() => setBgmControlUI(false));
    }
    setBgmControlUI(true);
  } else {
    setBgmControlUI(!bgm.paused);
  }
}

function BgmControl(): void {
  const bgm = document.getElementById('bgm') as HTMLAudioElement | null;
  if (!bgm) return;

  if (bgm.paused) {
    writeBgmDisabled(false);
    const p = bgm.play();
    if (p && typeof (p as Promise<void>).catch === 'function') {
      p.catch(() => {
        writeBgmDisabled(true);
        setBgmControlUI(false);
      });
    }
    setBgmControlUI(true);
  } else {
    writeBgmDisabled(true);
    bgm.pause();
    setBgmControlUI(false);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBgmState);
} else {
  initBgmState();
}
document.addEventListener('pjax:complete', initBgmState);
