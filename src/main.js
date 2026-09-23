import './style.css';
import { Runner, FixedClock } from './simulation.js';
import { attachInput } from './input.js';
import { RunnerView } from './renderer.js';
import { FrameMetrics } from './performance.js';

const $ = id => document.getElementById(id);
const canvas = $('game'), primary = $('primary');
const params = new URLSearchParams(location.search);
const debug = params.has('debug') || (import.meta.env.DEV && params.has('qa'));
const qa = import.meta.env.DEV && params.has('qa');
const runner = new Runner(), clock = new FixedClock(runner), metrics = new FrameMetrics();
let view, input, last = performance.now(), uiTime = 0, shownState = '', warmup = 0, slowWindows = 0, lastQualityCheck = 0;

function syncUI() {
  if (shownState === runner.state) return;
  shownState = runner.state;
  const running = runner.state === 'running';
  $('overlay').hidden = running; $('hud').hidden = !running; $('hint').hidden = !running;
  if (running) { canvas.focus({ preventScroll: true }); return; }
  if (runner.state === 'paused') { $('title').textContent = 'Corrida pausada'; $('message').textContent = 'Tudo parado. Continue quando estiver pronta.'; primary.textContent = 'Continuar'; }
  if (runner.state === 'over') { $('title').textContent = 'Vamos de novo?'; $('message').textContent = `Você percorreu ${Math.floor(runner.distance)} m. Desvie dos blocos altos e salte os baixos.`; primary.textContent = 'Jogar novamente'; }
  if (runner.state !== 'ready') primary.focus({ preventScroll: true });
}
function resetTiming() { last = performance.now(); clock.reset(); metrics.reset(); warmup = 0; slowWindows = 0; lastQualityCheck = 0; input?.cancel(); }
function pause() { runner.pause(); input?.cancel(); syncUI(); }
function launch() { if (runner.state === 'paused') runner.resume(); else runner.start(); resetTiming(); syncUI(); }

async function boot() {
  view = new RunnerView(canvas, runner);
  await view.ready();
  input = attachInput(canvas, action => { if (runner.command(action)) metrics.inputAt = performance.now(); }, pause);
  primary.disabled = false; primary.textContent = 'Começar corrida';
  primary.addEventListener('click', launch);
  $('pause').addEventListener('click', pause);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); last = performance.now(); });
  window.addEventListener('blur', pause);
  window.addEventListener('pagehide', pause);
  canvas.addEventListener('webglcontextlost', () => { pause(); primary.disabled = true; $('message').textContent = 'O 3D foi interrompido. Aguarde a recuperação.'; });
  view.engine.onContextRestoredObservable.add(() => { primary.disabled = false; $('message').textContent = '3D recuperado. Toque em continuar.'; resetTiming(); });
  $('diagnostics').hidden = !debug; $('qa').hidden = !qa;
  if (qa) $('apply-scenario').addEventListener('click', () => { runner.scenario = $('scenario').value; runner.start(); resetTiming(); syncUI(); });
  syncUI();
  view.engine.runRenderLoop(() => {
    const now = performance.now(), elapsed = (now - last) / 1000; last = now;
    if (document.hidden) return;
    const alpha = clock.advance(elapsed);
    view.draw(alpha);
    if (runner.state === 'running') {
      warmup += elapsed;
      metrics.record(performance.now(), warmup > 2);
      if (warmup - lastQualityCheck >= 3 && metrics.count > 60) {
        lastQualityCheck = warmup;
        if (metrics.snapshot().fps < 50) slowWindows++; else slowWindows = 0;
        if (slowWindows >= 2) { view.lowerResolution(); slowWindows = 0; }
      }
    }
    syncUI();
    if (now - uiTime > 200) {
      uiTime = now; $('distance').textContent = Math.floor(runner.distance);
      if (debug) {
        const m = metrics.snapshot();
        $('diagnostics').textContent = `${runner.state} · ${Math.floor(runner.distance)} m · ${runner.speed.toFixed(1)} m/s\nFaixa ${runner.player.lane + 1}/3 · x ${runner.player.x.toFixed(2)} · salto ${runner.player.y.toFixed(2)} m\nComandos ${runner.commands} · último ${runner.lastAction}\n${m.fps.toFixed(1)} FPS · p95 ${m.p95.toFixed(1)} ms · >50ms ${m.slow}/${m.frames}\nComando→quadro ${metrics.inputMs.toFixed(1)} ms · máx ${metrics.maxInputMs.toFixed(1)} ms\n${canvas.clientWidth}×${canvas.clientHeight} · escala ${view.pixelRatio.toFixed(2)} · meshes ${view.scene.meshes.length}`;
      }
    }
  });
}
boot().catch(error => {
  console.error(error); view?.dispose();
  $('title').textContent = 'Não foi possível abrir o 3D';
  $('message').textContent = 'Recarregue a página em um navegador com WebGL habilitado.';
  primary.textContent = 'Recarregar'; primary.disabled = false;
  primary.addEventListener('click', () => location.reload(), { once: true });
});
