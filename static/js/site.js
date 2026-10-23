// skyseekerlabs.net. CC0: see LICENSE. Works without this script; this is the fun layer.

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
function seeded(n) { let s = n; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const $ = id => document.getElementById(id);

// ---------- shut up: one switch that stops Xenia, the cloud and every animation ----------
let quiet = reduce;
try { const v = localStorage.getItem("skyseeker-quiet"); if (v !== null) quiet = v === "1"; } catch {}

// ---------- night mode: after midnight, local time, everyone sleeps (click Xenia or Nimbus to wake them) ----------
let forceNight = null, awakeUntil = 0;
const isNight = () => forceNight ?? (new Date().getHours() < 6);
const sleeping = () => !quiet && isNight() && Date.now() > awakeUntil;
function wakeUp() { awakeUntil = Date.now() + 3 * 60 * 1000; weather.look(); }

// ---------- calm mode: on the serious pages (and for visits that start on hire or labs) Xenia sits typing and
// Nimbus stays content with no weather, until someone clicks one of them ----------
const PAGE = document.body.dataset.page || "page";
const SERIOUS = document.body.dataset.serious === "true";
const session = (k, v) => { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch { return null; } };
if (session("skyseeker-entry") === null) session("skyseeker-entry", PAGE);
const startedSerious = ["hire", "labs"].includes(session("skyseeker-entry"));
let unlocked = session("skyseeker-unlocked") === "1";
const calm = () => !unlocked && (startedSerious || SERIOUS);
function unlock() { if (!unlocked) { unlocked = true; session("skyseeker-unlocked", "1"); weather.look(); } }

// ---------- the lid: stickers placed like a person did it ----------
const stickers = (function () {
  const box = $("collage");
  if (!box) return { layout() {}, els: [], box: null };
  box.classList.remove("nojs-flow");
  const rnd = seeded(42);
  let top = 100;
  const els = [...box.querySelectorAll(".st")];
  els.forEach(a => {
    const kind = a.dataset.kind, img = a.querySelector("img");
    if (kind === "cut" && img) img.style.setProperty("--h", (a.dataset.id === "vinyl-scratch" ? 180 : 96 + Math.round(rnd() * 40)) + "px");
    if (kind === "disc") a.querySelector(".disc").style.setProperty("--s", 96 + Math.round(rnd() * 34) + "px");
    if ((kind === "label" || kind === "game") && img) img.style.height = (kind === "game" ? 40 + Math.round(rnd() * 16) : 40 + Math.round(rnd() * 18)) + "px";
    if (kind === "word") a.querySelector(".word").style.setProperty("--fs", 22 + Math.round(rnd() * 8) + "px");
    a.style.setProperty("--r", (rnd() * 32 - 16).toFixed(1) + "deg");
    a.style.zIndex = 1 + Math.floor(rnd() * 40);
    const lift = () => { a.style.zIndex = ++top; a.classList.add("lifted"); };
    a.addEventListener("pointerenter", lift); a.addEventListener("focus", lift);
    a.addEventListener("pointerleave", () => a.classList.remove("lifted")); a.addEventListener("blur", () => a.classList.remove("lifted"));
  });
  // best-candidate placement: each sticker tries spots at random and keeps the one that overlaps least,
  // biggest first, so the lid fills edge to edge with a few honest overlaps, like a person slapped them on
  function layout() {
    const W = box.clientWidth, H = box.clientHeight;
    if (!W || !H) return;
    const k = W < 760 ? .45 : 1; box.style.setProperty("--k", k);
    const m = 14, logo = { x: W - (W < 760 ? 120 : 190), y: H - (W < 760 ? 64 : 92), w: 999, h: 999 };
    // each sticker's real footprint after its tilt (it rotates about its top-left corner)
    const sized = els.map(a => {
      const w = a.offsetWidth * k, h = a.offsetHeight * k, r = parseFloat(a.style.getPropertyValue("--r")) * Math.PI / 180;
      const c = Math.cos(r), sn = Math.sin(r), xs = [0, w * c, -h * sn, w * c - h * sn], ys = [0, w * sn, h * c, w * sn + h * c];
      return { a, minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
    }).sort((p, q) => (q.maxX - q.minX) * (q.maxY - q.minY) - (p.maxX - p.minX) * (p.maxY - p.minY));
    const placed = [], r2 = seeded(7);
    const ov = (x, y, w, h, o) => Math.max(0, Math.min(x + w, o.x + o.w) - Math.max(x, o.x)) * Math.max(0, Math.min(y + h, o.y + o.h) - Math.max(y, o.y));
    for (const s of sized) {
      const bw = s.maxX - s.minX, bh = s.maxY - s.minY;
      let best = null;
      for (let t = 0; t < 70; t++) {
        // bx, by: top-left of the tilted footprint, kept fully inside the lid's rim
        const bx = m + r2() * Math.max(0, W - 2 * m - bw), by = m + r2() * Math.max(0, H - 2 * m - bh);
        let score = ov(bx, by, bw, bh, logo) * 50;
        for (const o of placed) score += ov(bx, by, bw, bh, o);
        if (!best || score < best.score) best = { bx, by, score };
      }
      placed.push({ x: best.bx, y: best.by, w: bw, h: bh });
      s.a.style.left = (best.bx - s.minX) + "px"; s.a.style.top = (best.by - s.minY) + "px";
    }
  }
  let relayT; const relayout = () => { clearTimeout(relayT); relayT = setTimeout(layout, 60); };
  box.querySelectorAll("img").forEach(im => { if (!im.complete) im.addEventListener("load", relayout); });
  requestAnimationFrame(layout); addEventListener("resize", relayout);
  document.fonts && document.fonts.ready.then(relayout);
  return { layout, els, box };
})();

// ---------- the cloud (he/him) and the internet weather, on the Beaufort scale ----------
// The weather lives in the page background only: it never touches the stickers or the text.
// The real site would get one reading a day from the fleet's security-watch job: mostly fair,
// stormy only when something big breaks. The prototype cycles faster so you can see it.
const BFT = ["calm", "light air", "light breeze", "gentle breeze", "moderate breeze", "fresh breeze", "strong breeze", "near gale", "gale", "strong gale", "storm", "violent storm", "hurricane force"];
// today's reading is written into the page by the build (content/weather/, newest entry wins)
const TODAY = (() => { try { return JSON.parse($("wx-data").textContent); } catch { return { f: 1, text: "Fair, as far as anyone knows.", url: "/weather/" }; } })();
const ASIDES = ["Oh good. Another one.", "I'd stay indoors. Metaphorically.", "Don't mind Nimbus. He reads the news all day.", "This is fine. Everything is fine.", "Patch your stuff. I'm not saying it twice.", "He'll calm down if you click him. Probably."];
const flakeImg = new Image(); flakeImg.src = "/img/flakes/nix-colours.svg";
// AI lab logos (Simple Icons, CC0 data; trademarks of their owners) plus OpenAI's, for model-release snow
const AI_FLAKES = [{"id":"claude","hex":"#D97757","path":"m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"},{"id":"googlegemini","hex":"#8E75B2","path":"M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81"},{"id":"meta","hex":"#0467DF","path":"M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"},{"id":"mistralai","hex":"#FA520F","path":"M17.143 3.429v3.428h-3.429v3.429h-3.428V6.857H6.857V3.43H3.43v13.714H0v3.428h10.286v-3.428H6.857v-3.429h3.429v3.429h3.429v-3.429h3.428v3.429h-3.428v3.428H24v-3.428h-3.43V3.429z"},{"id":"deepseek","hex":"#5786FE","path":"M23.748 4.651c-.254-.124-.364.113-.512.233-.051.04-.094.09-.137.137-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.155-.708-.311-.955-.65-.172-.24-.219-.509-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.094.172.187.129.323-.082.28-.18.553-.266.833-.055.179-.137.218-.328.14a5.5 5.5 0 0 1-1.737-1.179c-.857-.828-1.631-1.743-2.597-2.46a12 12 0 0 0-.689-.47c-.985-.957.13-1.743.387-1.836.27-.098.094-.433-.778-.428-.872.003-1.67.295-2.687.685a3 3 0 0 1-.465.136 9.6 9.6 0 0 0-2.883-.101c-1.885.21-3.39 1.1-4.497 2.622C.082 8.776-.231 10.854.152 13.02c.403 2.284 1.568 4.175 3.36 5.653 1.857 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.132-.284 4.994-1.86.47.234.962.328 1.78.398.629.058 1.235-.031 1.705-.129.735-.155.684-.836.418-.961-2.155-1.004-1.682-.595-2.112-.926 1.095-1.295 2.768-3.598 3.284-6.733.05-.346.115-.834.108-1.114-.004-.171.035-.238.23-.257a4.2 4.2 0 0 0 1.545-.475c1.397-.763 1.96-2.016 2.093-3.517.02-.23-.004-.467-.247-.588M11.58 18.168c-2.088-1.642-3.101-2.183-3.52-2.16-.39.024-.32.472-.234.763.09.288.207.487.371.74.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.168-1.361-.801-2.5-1.86-3.301-3.306-.775-1.393-1.225-2.888-1.299-4.482-.02-.385.094-.522.477-.592a4.7 4.7 0 0 1 1.53-.038c2.131.311 3.946 1.264 5.467 2.774.868.86 1.525 1.887 2.202 2.89.72 1.066 1.494 2.082 2.48 2.915.348.291.626.513.892.677-.802.09-2.14.109-3.055-.615zm1.001-6.44a.306.306 0 0 1 .415-.287.3.3 0 0 1 .113.074.3.3 0 0 1 .086.214c0 .17-.136.307-.308.307a.303.303 0 0 1-.306-.307m3.11 1.596c-.2.081-.4.151-.591.16a1.25 1.25 0 0 1-.798-.254c-.274-.23-.47-.358-.551-.758a1.7 1.7 0 0 1 .015-.588c.07-.327-.007-.537-.238-.727-.188-.156-.426-.199-.689-.199a.6.6 0 0 1-.254-.078.253.253 0 0 1-.114-.358 1 1 0 0 1 .192-.21c.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.392.451.462.576.685.915.176.264.336.536.446.848.066.194-.02.353-.25.45"},{"id":"qwen","hex":"#6950EF","path":"M23.919 14.545 20.817 9.17l1.47-2.544a.56.56 0 0 0 0-.566l-1.633-2.83a.57.57 0 0 0-.49-.283h-6.207L12.487.402a.57.57 0 0 0-.49-.284H8.732a.56.56 0 0 0-.49.284L5.139 5.775h-2.94a.56.56 0 0 0-.49.284L.077 8.887a.56.56 0 0 0 0 .567L3.18 14.83l-1.47 2.545a.56.56 0 0 0 0 .566l1.634 2.83a.57.57 0 0 0 .49.283h6.205l1.47 2.545a.57.57 0 0 0 .49.284h3.266a.57.57 0 0 0 .49-.284l3.104-5.375h2.94a.57.57 0 0 0 .49-.283l1.634-2.828a.55.55 0 0 0-.004-.568M8.733.686l1.634 2.828-1.634 2.828H21.8L20.164 9.17H7.425L5.63 6.06Zm1.306 19.801-6.205-.002 1.634-2.83h3.265L2.201 6.344h3.267q3.182 5.517 6.367 11.032zm10.124-5.66L18.53 12l-6.532 11.315-1.634-2.83c2.129-3.673 4.25-7.351 6.373-11.028h3.592l3.102 5.374z"},{"id":"huggingface","hex":"#FFD21E","path":"M12.025 1.13c-5.77 0-10.449 4.647-10.449 10.378 0 1.112.178 2.181.503 3.185.064-.222.203-.444.416-.577a.96.96 0 0 1 .524-.15c.293 0 .584.124.84.284.278.173.48.408.71.694.226.282.458.611.684.951v-.014c.017-.324.106-.622.264-.874s.403-.487.762-.543c.3-.047.596.06.787.203s.31.313.4.467c.15.257.212.468.233.542.01.026.653 1.552 1.657 2.54.616.605 1.01 1.223 1.082 1.912.055.537-.096 1.059-.38 1.572.637.121 1.294.187 1.967.187.657 0 1.298-.063 1.921-.178-.287-.517-.44-1.041-.384-1.581.07-.69.465-1.307 1.081-1.913 1.004-.987 1.647-2.513 1.657-2.539.021-.074.083-.285.233-.542.09-.154.208-.323.4-.467a1.08 1.08 0 0 1 .787-.203c.359.056.604.29.762.543s.247.55.265.874v.015c.225-.34.457-.67.683-.952.23-.286.432-.52.71-.694.257-.16.547-.284.84-.285a.97.97 0 0 1 .524.151c.228.143.373.388.43.625l.006.04a10.3 10.3 0 0 0 .534-3.273c0-5.731-4.678-10.378-10.449-10.378M8.327 6.583a1.5 1.5 0 0 1 .713.174 1.487 1.487 0 0 1 .617 2.013c-.183.343-.762-.214-1.102-.094-.38.134-.532.914-.917.71a1.487 1.487 0 0 1 .69-2.803m7.486 0a1.487 1.487 0 0 1 .689 2.803c-.385.204-.536-.576-.916-.71-.34-.12-.92.437-1.103.094a1.487 1.487 0 0 1 .617-2.013 1.5 1.5 0 0 1 .713-.174m-10.68 1.55a.96.96 0 1 1 0 1.921.96.96 0 0 1 0-1.92m13.838 0a.96.96 0 1 1 0 1.92.96.96 0 0 1 0-1.92M8.489 11.458c.588.01 1.965 1.157 3.572 1.164 1.607-.007 2.984-1.155 3.572-1.164.196-.003.305.12.305.454 0 .886-.424 2.328-1.563 3.202-.22-.756-1.396-1.366-1.63-1.32q-.011.001-.02.006l-.044.026-.01.008-.03.024q-.018.017-.035.036l-.032.04a1 1 0 0 0-.058.09l-.014.025q-.049.088-.11.19a1 1 0 0 1-.083.116 1.2 1.2 0 0 1-.173.18q-.035.029-.075.058a1.3 1.3 0 0 1-.251-.243 1 1 0 0 1-.076-.107c-.124-.193-.177-.363-.337-.444-.034-.016-.104-.008-.2.022q-.094.03-.216.087-.06.028-.125.063l-.13.074q-.067.04-.136.086a3 3 0 0 0-.135.096 3 3 0 0 0-.26.219 2 2 0 0 0-.12.121 2 2 0 0 0-.106.128l-.002.002a2 2 0 0 0-.09.132l-.001.001a1.2 1.2 0 0 0-.105.212q-.013.036-.024.073c-1.139-.875-1.563-2.317-1.563-3.203 0-.334.109-.457.305-.454m.836 10.354c.824-1.19.766-2.082-.365-3.194-1.13-1.112-1.789-2.738-1.789-2.738s-.246-.945-.806-.858-.97 1.499.202 2.362c1.173.864-.233 1.45-.685.64-.45-.812-1.683-2.896-2.322-3.295s-1.089-.175-.938.647 2.822 2.813 2.562 3.244-1.176-.506-1.176-.506-2.866-2.567-3.49-1.898.473 1.23 2.037 2.16c1.564.932 1.686 1.178 1.464 1.53s-3.675-2.511-4-1.297c-.323 1.214 3.524 1.567 3.287 2.405-.238.839-2.71-1.587-3.216-.642-.506.946 3.49 2.056 3.522 2.064 1.29.33 4.568 1.028 5.713-.624m5.349 0c-.824-1.19-.766-2.082.365-3.194 1.13-1.112 1.789-2.738 1.789-2.738s.246-.945.806-.858.97 1.499-.202 2.362c-1.173.864.233 1.45.685.64.451-.812 1.683-2.896 2.322-3.295s1.089-.175.938.647-2.822 2.813-2.562 3.244 1.176-.506 1.176-.506 2.866-2.567 3.49-1.898-.473 1.23-2.037 2.16c-1.564.932-1.686 1.178-1.464 1.53s3.675-2.511 4-1.297c.323 1.214-3.524 1.567-3.287 2.405.238.839 2.71-1.587 3.216-.642.506.946-3.49 2.056-3.522 2.064-1.29.33-4.568 1.028-5.713-.624"},{"id":"ollama","hex":"#F3F3F6","path":"M16.361 10.26a.894.894 0 0 0-.558.47l-.072.148.001.207c0 .193.004.217.059.353.076.193.152.312.291.448.24.238.51.3.872.205a.86.86 0 0 0 .517-.436.752.752 0 0 0 .08-.498c-.064-.453-.33-.782-.724-.897a1.06 1.06 0 0 0-.466 0zm-9.203.005c-.305.096-.533.32-.65.639a1.187 1.187 0 0 0-.06.52c.057.309.31.59.598.667.362.095.632.033.872-.205.14-.136.215-.255.291-.448.055-.136.059-.16.059-.353l.001-.207-.072-.148a.894.894 0 0 0-.565-.472 1.02 1.02 0 0 0-.474.007Zm4.184 2c-.131.071-.223.25-.195.383.031.143.157.288.353.407.105.063.112.072.117.136.004.038-.01.146-.029.243-.02.094-.036.194-.036.222.002.074.07.195.143.253.064.052.076.054.255.059.164.005.198.001.264-.03.169-.082.212-.234.15-.525-.052-.243-.042-.28.087-.355.137-.08.281-.219.324-.314a.365.365 0 0 0-.175-.48.394.394 0 0 0-.181-.033c-.126 0-.207.03-.355.124l-.085.053-.053-.032c-.219-.13-.259-.145-.391-.143a.396.396 0 0 0-.193.032zm.39-2.195c-.373.036-.475.05-.654.086-.291.06-.68.195-.951.328-.94.46-1.589 1.226-1.787 2.114-.04.176-.045.234-.045.53 0 .294.005.357.043.524.264 1.16 1.332 2.017 2.714 2.173.3.033 1.596.033 1.896 0 1.11-.125 2.064-.727 2.493-1.571.114-.226.169-.372.22-.602.039-.167.044-.23.044-.523 0-.297-.005-.355-.045-.531-.288-1.29-1.539-2.304-3.072-2.497a6.873 6.873 0 0 0-.855-.031zm.645.937a3.283 3.283 0 0 1 1.44.514c.223.148.537.458.671.662.166.251.26.508.303.82.02.143.01.251-.043.482-.08.345-.332.705-.672.957a3.115 3.115 0 0 1-.689.348c-.382.122-.632.144-1.525.138-.582-.006-.686-.01-.853-.042-.57-.107-1.022-.334-1.35-.68-.264-.28-.385-.535-.45-.946-.03-.192.025-.509.137-.776.136-.326.488-.73.836-.963.403-.269.934-.46 1.422-.512.187-.02.586-.02.773-.002zm-5.503-11a1.653 1.653 0 0 0-.683.298C5.617.74 5.173 1.666 4.985 2.819c-.07.436-.119 1.04-.119 1.503 0 .544.064 1.24.155 1.721.02.107.031.202.023.208a8.12 8.12 0 0 1-.187.152 5.324 5.324 0 0 0-.949 1.02 5.49 5.49 0 0 0-.94 2.339 6.625 6.625 0 0 0-.023 1.357c.091.78.325 1.438.727 2.04l.13.195-.037.064c-.269.452-.498 1.105-.605 1.732-.084.496-.095.629-.095 1.294 0 .67.009.803.088 1.266.095.555.288 1.143.503 1.534.071.128.243.393.264.407.007.003-.014.067-.046.141a7.405 7.405 0 0 0-.548 1.873c-.062.417-.071.552-.071.991 0 .56.031.832.148 1.279L3.42 24h1.478l-.05-.091c-.297-.552-.325-1.575-.068-2.597.117-.472.25-.819.498-1.296l.148-.29v-.177c0-.165-.003-.184-.057-.293a.915.915 0 0 0-.194-.25 1.74 1.74 0 0 1-.385-.543c-.424-.92-.506-2.286-.208-3.451.124-.486.329-.918.544-1.154a.787.787 0 0 0 .223-.531c0-.195-.07-.355-.224-.522a3.136 3.136 0 0 1-.817-1.729c-.14-.96.114-2.005.69-2.834.563-.814 1.353-1.336 2.237-1.475.199-.033.57-.028.776.01.226.04.367.028.512-.041.179-.085.268-.19.374-.431.093-.215.165-.333.36-.576.234-.29.46-.489.822-.729.413-.27.884-.467 1.352-.561.17-.035.25-.04.569-.04.319 0 .398.005.569.04a4.07 4.07 0 0 1 1.914.997c.117.109.398.457.488.602.034.057.095.177.132.267.105.241.195.346.374.43.14.068.286.082.503.045.343-.058.607-.053.943.016 1.144.23 2.14 1.173 2.581 2.437.385 1.108.276 2.267-.296 3.153-.097.15-.193.27-.333.419-.301.322-.301.722-.001 1.053.493.539.801 1.866.708 3.036-.062.772-.26 1.463-.533 1.854a2.096 2.096 0 0 1-.224.258.916.916 0 0 0-.194.25c-.054.109-.057.128-.057.293v.178l.148.29c.248.476.38.823.498 1.295.253 1.008.231 2.01-.059 2.581a.845.845 0 0 0-.044.098c0 .006.329.009.732.009h.73l.02-.074.036-.134c.019-.076.057-.3.088-.516.029-.217.029-1.016 0-1.258-.11-.875-.295-1.57-.597-2.226-.032-.074-.053-.138-.046-.141.008-.005.057-.074.108-.152.376-.569.607-1.284.724-2.228.031-.26.031-1.378 0-1.628-.083-.645-.182-1.082-.348-1.525a6.083 6.083 0 0 0-.329-.7l-.038-.064.131-.194c.402-.604.636-1.262.727-2.04a6.625 6.625 0 0 0-.024-1.358 5.512 5.512 0 0 0-.939-2.339 5.325 5.325 0 0 0-.95-1.02 8.097 8.097 0 0 1-.186-.152.692.692 0 0 1 .023-.208c.208-1.087.201-2.443-.017-3.503-.19-.924-.535-1.658-.98-2.082-.354-.338-.716-.482-1.15-.455-.996.059-1.8 1.205-2.116 3.01a6.805 6.805 0 0 0-.097.726c0 .036-.007.066-.015.066a.96.96 0 0 1-.149-.078A4.857 4.857 0 0 0 12 3.03c-.832 0-1.687.243-2.456.698a.958.958 0 0 1-.148.078c-.008 0-.015-.03-.015-.066a6.71 6.71 0 0 0-.097-.725C8.997 1.392 8.337.319 7.46.048a2.096 2.096 0 0 0-.585-.041Zm.293 1.402c.248.197.523.759.682 1.388.03.113.06.244.069.292.007.047.026.152.041.233.067.365.098.76.102 1.24l.002.475-.12.175-.118.178h-.278c-.324 0-.646.041-.954.124l-.238.06c-.033.007-.038-.003-.057-.144a8.438 8.438 0 0 1 .016-2.323c.124-.788.413-1.501.696-1.711.067-.05.079-.049.157.013zm9.825-.012c.17.126.358.46.498.888.28.854.36 2.028.212 3.145-.019.14-.024.151-.057.144l-.238-.06a3.693 3.693 0 0 0-.954-.124h-.278l-.119-.178-.119-.175.002-.474c.004-.669.066-1.19.214-1.772.157-.623.434-1.185.68-1.382.078-.062.09-.063.159-.012z"}].map(a => ({ ...a, p: new Path2D(a.path) }));
const openaiImg = new Image(); openaiImg.src = "/img/logos/openai-codex.png";
const tuxImg = new Image(); tuxImg.src = "/img/logos/tux.svg";
// release-day snow: whatever got released falls from the sky (and from Nimbus)
const FLAKE_SETS = { nix: [{ img: flakeImg }], ai: [...AI_FLAKES.map(a => ({ path: a.p, hex: a.hex })), { img: openaiImg }], kernel: [{ img: tuxImg }] };
function drawFlake(ctx, d, x, y, size, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  if (d.img) ctx.drawImage(d.img, -size / 2, -size / 2, size, size);
  else { ctx.scale(size / 24, size / 24); ctx.translate(-12, -12); ctx.fillStyle = d.hex; ctx.fill(d.path); }
  ctx.restore();
}
const weather = (function () {
  const box = $("wx"), btn = $("cloudBtn"), panel = $("headline"), link = $("hlLink"), mood = $("hlMood"), bft = $("hlBft");
  const sky = $("flakes"), ctx = sky.getContext("2d");
  let cur = TODAY, tamedUntil = 0, hideT, cycleT, raf = 0, parts = [], flurry = [], bolt = null, nextBolt = 0, W = 0, H = 0, lookT;
  function size() { const dpr = devicePixelRatio || 1; W = innerWidth; H = innerHeight; sky.width = W * dpr; sky.height = H * dpr; sky.style.width = W + "px"; sky.style.height = H + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); parts = []; }
  size(); addEventListener("resize", size);
  const tamed = () => Date.now() < tamedUntil;
  const kind = () => tamed() ? 0 : cur.f;            // a number on the Beaufort scale, or snow / rainbow / fog
  const force = () => typeof kind() === "number" ? kind() : 1;
  const CLOUD_W = { sunny: 193, content: 188, smug: 191, breezy: 219, meh: 195, drizzle: 197, rain: 199, storm: 199, hurricane: 200, snowy: 200, sheepish: 240, sulk: 199, asleep: 211, "snowy-bare": 196, drowsy: 196 };
  const cimg = $("cloudImg");
  const ALIAS = {};                                   // filled in below if night art is missing
  function art(n) { n = ALIAS[n] || n; if (cimg.dataset.n === n) return; cimg.dataset.n = n; cimg.src = `/img/nimbus/${n}.webp`; cimg.style.setProperty("--cw", Math.round(CLOUD_W[n] * .55) + "px"); }
  Object.keys(CLOUD_W).forEach(n => { const im = new Image(); im.src = `/img/nimbus/${n}.webp`; });
  if (!CLOUD_W.asleep) Object.assign(ALIAS, { asleep: "content", drowsy: "meh", "snowy-bare": "snowy" });
  function cloudMood() {
    if (quiet) return "sulk";
    if (calm()) return "content";
    if (isNight() && Date.now() > awakeUntil) return Date.now() < awakeUntil + 8000 ? "drowsy" : "asleep";
    if (tamed()) return "sheepish";
    const k = kind(), f = force();
    if (k === "snow") return "snowy-bare"; if (k === "rainbow") return "smug"; if (k === "fog") return "meh";
    return f >= 12 ? "hurricane" : f >= 8 ? "storm" : f >= 6 ? "rain" : f >= 5 ? "drizzle" : f >= 3 ? "breezy" : f >= 2 ? "content" : "sunny";
  }
  function look() {
    art(cloudMood());
    document.body.classList.toggle("night", isNight());
    document.querySelectorAll(".st-nimbus").forEach(el => el.textContent = "Nimbus: " + (quiet ? "sulking" : calm() ? "chill" : sleeping() ? "asleep" : ($("hlMood").textContent || "fair")));
    if (quiet) { box.dataset.band = "sulk"; box.dataset.face = "sulk"; delete box.dataset.f; return; }
    const f = force();
    box.dataset.f = f;
    box.dataset.band = f >= 12 ? "hurricane" : f >= 8 ? "angry" : f >= 6 ? "grey" : f <= 2 ? "sunny" : "white";
    box.dataset.face = tamed() ? "sheepish" : f >= 8 ? "angry" : f >= 6 ? "sad" : f >= 4 ? "meh" : "happy";
  }
  function show(item) {
    cur = item; tamedUntil = 0;
    const f = typeof item.f === "number" ? item.f : null;
    mood.textContent = f === null ? item.f : (f >= 8 ? "storm warning" : f >= 6 ? "rain" : f >= 3 ? "breezy" : "fair");
    bft.textContent = f === null ? "special" : `force ${f} · ${BFT[f]}`;
    link.textContent = item.text; link.href = item.url;
    look(); open(7000);
    if (f >= 8) setTimeout(() => mascot.aside(item), 1400);
  }
  function next() { if (calm()) return; show(TODAY); }
  function open(ms) { panel.hidden = false; btn.setAttribute("aria-expanded", "true"); clearTimeout(hideT); if (ms) hideT = setTimeout(() => { panel.hidden = true; btn.setAttribute("aria-expanded", "false"); }, ms); }

  // background painter: sun glow, wind, rain, lightning, snow, rainbow, fog, hurricane debris
  function paint(t) {
    ctx.clearRect(0, 0, W, H);
    if (quiet || calm()) return;
    const k = kind(), f = force(), still = reduce;
    if (k === "rainbow") {                             // a flat sticker-style rainbow out of Nimbus, ending in a puff
      const R = Math.min(310, W * .42), bw = Math.max(9, R / 20), cx = W - 70 - R * .55, cy = 96 + R * .9;
      const cols = ["#ff4f5e", "#ff8a2a", "#ffd23f", "#7bd94f", "#3db8ff", "#b18be0"], a0 = Math.PI * 1.02, a1 = Math.PI * 1.86;
      ctx.globalAlpha = .9; ctx.lineCap = "butt";
      ctx.strokeStyle = "#141214"; ctx.lineWidth = bw * 6 + 8; ctx.beginPath(); ctx.arc(cx, cy, R - bw * 2.5, a0, a1); ctx.stroke();
      cols.forEach((c, n) => { ctx.strokeStyle = c; ctx.lineWidth = bw; ctx.beginPath(); ctx.arc(cx, cy, R - n * bw, a0, a1); ctx.stroke(); });
      const ex = cx + Math.cos(a0) * (R - bw * 2.5), ey = cy + Math.sin(a0) * (R - bw * 2.5);
      ctx.fillStyle = "#fbfbfb"; ctx.strokeStyle = "#141214"; ctx.lineWidth = 3;
      [[-bw * 1.6, 0, bw * 1.5], [0, -bw * .9, bw * 1.9], [bw * 1.8, 0, bw * 1.5], [0, bw * .5, bw * 1.6]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(ex + dx, ey + dy, r, 0, 7); ctx.fill(); ctx.stroke(); });
      [[-bw * 1.6, 0, bw * 1.5], [0, -bw * .9, bw * 1.9], [bw * 1.8, 0, bw * 1.5], [0, bw * .5, bw * 1.6]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(ex + dx, ey + dy, r - 2, 0, 7); ctx.fill(); });
      for (let n = 0; n < 9; n++) {                    // twinkles
        const ang = a0 + (a1 - a0) * ((n * .137 + .05) % 1), rr = R + 26 + (n % 3) * 18;
        const sx = cx + Math.cos(ang) * rr, sy = cy + Math.sin(ang) * rr, tw = still ? .8 : .5 + .5 * Math.sin(t / 380 + n * 1.7), z = (6 + (n % 3) * 3) * tw;
        ctx.globalAlpha = .85 * tw; ctx.fillStyle = n % 2 ? "#ffd23f" : "#fbfbfb";
        ctx.beginPath(); ctx.moveTo(sx, sy - z); ctx.quadraticCurveTo(sx, sy, sx + z, sy); ctx.quadraticCurveTo(sx, sy, sx, sy + z); ctx.quadraticCurveTo(sx, sy, sx - z, sy); ctx.quadraticCurveTo(sx, sy, sx, sy - z); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    if (f <= 2 && typeof k === "number") {           // fair: warm glow behind the cloud
      const g = ctx.createRadialGradient(W - 70, 70, 10, W - 70, 70, 360);
      g.addColorStop(0, "rgba(255,210,63,.16)"); g.addColorStop(1, "rgba(255,210,63,0)");
      ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    if (k === "fog") {
      const g = ctx.createLinearGradient(0, H, 0, 0);
      g.addColorStop(0, "rgba(200,205,220,.16)"); g.addColorStop(.6, "rgba(200,205,220,.05)"); g.addColorStop(1, "rgba(200,205,220,0)");
      ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    const snow = k === "snow";
    const want = snow ? 70 : f >= 6 ? 110 + (f - 6) * 30 : f >= 5 ? 45 : f >= 3 ? 14 : 0;
    while (parts.length < want) parts.push({ x: Math.random() * W, y: Math.random() * H, v: Math.random(), r: Math.random() * 6 });
    if (parts.length > want) parts.length = want;
    const wind = f >= 3 ? f * .55 : 0;
    for (const p of parts) {
      if (!still) {
        if (snow) { p.y += .5 + p.v; p.x += Math.sin((p.y + p.v * 400) / 50) * .5; }
        else if (f >= 12) { const a = Math.atan2(p.y - H * .4, p.x - W * .75) + .05; const d = Math.hypot(p.x - W * .75, p.y - H * .4) * .995; p.x = W * .75 + Math.cos(a) * d; p.y = H * .4 + Math.sin(a) * d; if (d < 20) { p.x = Math.random() * W; p.y = Math.random() * H; } }
        else if (f >= 5) { p.y += 9 + p.v * 6; p.x += wind * .6; }
        else { p.x += 5 + p.v * 4; p.y += Math.sin(p.x / 70) * .3; }
      }
      if (snow) {
        const set = FLAKE_SETS[cur.flakes] || FLAKE_SETS.nix, d = set[Math.floor(p.r * 10) % set.length];
        ctx.globalAlpha = .55; drawFlake(ctx, d, p.x, p.y, cur.flakes === "nix" ? 16 : 26, Math.sin(p.y / 90 + p.v * 6) * .35);
      }
      else if (f >= 12) { ctx.globalAlpha = .45; ctx.fillStyle = ["#ff4f5e", "#ffd23f", "#3db8ff", "#7bd94f"][Math.floor(p.r) % 4]; ctx.fillRect(p.x, p.y, 4 + p.r, 3 + p.r * .6); }
      else if (f >= 5) { ctx.globalAlpha = .26; ctx.strokeStyle = "#7ec8ff"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - wind * 1.2, p.y - 12); ctx.stroke(); }
      else { ctx.globalAlpha = .14; ctx.strokeStyle = "#f3f3f6"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 46, p.y); ctx.stroke(); }
      if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }
      if (p.x > W + 60) { p.x = -60; p.y = Math.random() * H; }
    }
    if (snow && !sleeping()) {                         // Nimbus's own flurry: the same things, falling right under him
      const r = btn.getBoundingClientRect(), set = FLAKE_SETS[cur.flakes] || FLAKE_SETS.nix;
      while (flurry.length < 7) flurry.push({ x: Math.random(), y: Math.random(), v: Math.random(), r: Math.random() });
      for (const q of flurry) {
        if (!still) { q.y += .012 + q.v * .01; if (q.y > 1) { q.y = 0; q.x = Math.random(); } }
        const x = r.left + 18 + q.x * (r.width - 36), y = r.top + r.height * .62 + q.y * 70;
        ctx.globalAlpha = .95 * (1 - q.y * .7); drawFlake(ctx, set[Math.floor(q.r * 10) % set.length], x, y, cur.flakes === "nix" ? 13 : 17, (q.v - .5) * .6);
      }
    }
    if (isNight() && !quiet) {                          // night sky
      const rs = seeded(3);
      for (let n = 0; n < 70; n++) { const x = rs() * W, y = rs() * H, tw = still ? .6 : .35 + .35 * Math.sin(t / 900 + n); ctx.globalAlpha = tw; ctx.fillStyle = n % 7 ? "#f3f3f6" : "#ffd23f"; ctx.fillRect(x, y, n % 9 ? 2 : 3, n % 9 ? 2 : 3); }
    }
    // lightning in the distance: a jagged bolt behind the content, now and then
    if (f >= 8 && f < 12 && !still) {
      if (!bolt && t > nextBolt) {
        const x0 = W * (.15 + Math.random() * .7), pts = [[x0, -10]];
        let x = x0, y = -10; while (y < H * (.5 + Math.random() * .4)) { x += (Math.random() - .5) * 70; y += 30 + Math.random() * 40; pts.push([x, y]); }
        bolt = { pts, born: t };
      }
      if (bolt) {
        const age = t - bolt.born;
        if (age < 140) { ctx.globalAlpha = .06; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H); }
        ctx.globalAlpha = Math.max(0, .55 - age / 700);
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#111"; ctx.lineWidth = 9; ctx.beginPath(); bolt.pts.forEach(([x, y], n) => n ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
        ctx.strokeStyle = "#ffd23f"; ctx.lineWidth = 4; ctx.stroke();
        if (age > 400) { bolt = null; nextBolt = t + 1800 + Math.random() * (f >= 10 ? 1500 : 4000); }
      }
    }
    ctx.globalAlpha = 1;
  }
  function loop(t) { paint(t); raf = reduce ? 0 : requestAnimationFrame(loop); }
  btn.addEventListener("click", () => {
    if (quiet) { open(4000); return; }
    if (calm()) { unlock(); mascot.unlock(); next(); return; }
    if (isNight() && sleeping()) { wakeUp(); mascot.wake(); open(5000); return; }
    const wasBad = force() >= 4 || cur.f === "fog";
    tamedUntil = Date.now() + 30000; look(); open(5000); if (reduce) paint(0);
    if (wasBad) mascot.brolly();
  });
  let startT;
  function start() { if (quiet) return; clearInterval(lookT); lookT = setInterval(look, 1000); clearInterval(cycleT); clearTimeout(startT); startT = setTimeout(next, 1500); if (!raf) raf = requestAnimationFrame(loop); if (reduce) paint(0); }
  function stop() { clearInterval(cycleT); clearTimeout(startT); parts = []; bolt = null; ctx.clearRect(0, 0, W, H); look(); }
  look();
  // preview any weather from the terminal: `weather 9`, `weather snow ai`, `weather rainbow`
  function preview(f, flakes) { show({ f, flakes, text: `Preview: ${typeof f === "number" ? "force " + f + ", " + BFT[f] : f}. Real weather comes back on reload.`, url: "/weather/" }); }
  return { start, stop, look, preview, today: () => cur };
})();

// ---------- Xenia: on the page floor; follows you, keeps her distance, backs off ----------
const POSE_SIZE = { stand: [119, 285], front: [108, 284], "walk-a": [190, 277], "walk-b": [143, 278], talk: [164, 282], peek: [113, 190], lean: [191, 268], point: [195, 270], sign: [144, 280], wave: [159, 257], sit: [135, 237], type: [193, 198], sleep: [232, 133], crossed: [163, 260] };
const SCALE = .47;
Object.keys(POSE_SIZE).forEach(k => { const im = new Image(); im.src = `/img/xenia/${k}.webp`; });
// the quote jar, loaded once; she says nothing until it arrives
let QUOTES = [];
fetch("/data/quotes.json").then(r => r.json()).then(q => { QUOTES = q; }).catch(() => {});
const mascot = (function () {
  const m = $("mascot"), fox = $("fox"), img = $("foxImg"), bubble = $("bubble"), q = $("quote"), cite = $("cite");
  let poseName = "stand";
  function pose(n) { if (n === poseName) return; poseName = n; const [w, h] = POSE_SIZE[n]; img.src = `/img/xenia/${n}.webp`; img.style.setProperty("--h", Math.round(h * SCALE) + "px"); m.style.setProperty("--w", Math.round(w * SCALE) + "px"); }
  let holding = false, firstT, pos = 24, face = 1, frame = 0, talking = 0, qi = 0, idle = 0, px = null, timer = 0, brollyT, lastSeen = Date.now();
  const idleLong = () => Date.now() - lastSeen > 12000;     // left alone a while: she gets some work done
  const W = () => document.documentElement.clientWidth;
  addEventListener("pointermove", e => { px = e.clientX; lastSeen = Date.now(); });
  bubble.addEventListener("pointerenter", () => { holding = true; });
  bubble.addEventListener("pointerleave", () => { holding = false; if (talking < 8) talking = 8; });
  bubble.addEventListener("focusin", () => { holding = true; }); bubble.addEventListener("focusout", () => { holding = false; });
  addEventListener("pointerdown", e => { px = e.clientX; });
  function place() { m.style.setProperty("--x", pos + "px"); fox.style.setProperty("--face", face); }
  function say(text, who, url) {
    if (quiet) return;
    q.textContent = /^["“]/.test(text) ? text : "“" + text + "”";
    cite.innerHTML = url ? `<a href="${url}" target="_blank" rel="noopener">${who}</a>` : who;
    const bw = Math.min(300, W() - 24), bx = Math.max(-pos + 12, Math.min(-40, W() - pos - bw - 12));
    bubble.style.setProperty("--bx", bx + "px"); bubble.style.setProperty("--tail", Math.max(14, Math.min(-bx + 40, bw - 30)) + "px");
    bubble.classList.add("on"); talking = 30; pose("talk");
  }
  let bag = [];
  function quote() { if (quiet || sleeping() || calm() || !QUOTES.length) return; if (!bag.length) bag = QUOTES.map((_, n) => n).sort(() => Math.random() - .5); const [t, c, u] = QUOTES[bag.pop()]; say(t, c, u); }
  function aside(item) { if (quiet) return; say(ASIDES[Math.floor(Math.random() * ASIDES.length)], "Xenia, re: the weather", item.url); pose("crossed"); }
  function brolly() { m.classList.add("brolly"); say("Thanks. He gets like this.", "Xenia", ""); clearTimeout(brollyT); brollyT = setTimeout(() => m.classList.remove("brolly"), 8000); }
  const NIGHT_LINES = ["Up late, aren't ya?", "It's past midnight. The internet will still be broken tomorrow.", "Go to bed. I'll watch the servers.", "Shh. The homelab's asleep.", "Another quick fix at 2 a.m.? Bold.", "Nimbus is asleep. Don't poke him. Okay, poke him a bit."];
  let nightTick = 0;
  function tick() {
    if (quiet) return;
    if (calm()) { if (holding) return; if (talking > 0) { if (--talking === 0) bubble.classList.remove("on"); return; } pose("type"); place(); return; }
    if (sleeping()) {                                  // asleep on the floor; now and then she wakes up long enough to judge you
      if (holding) return;
      if (talking > 0) { if (--talking === 0) { bubble.classList.remove("on"); pose("sleep"); } return; }
      pose("sleep"); place();
      if (++nightTick % 540 === 48) { say(NIGHT_LINES[Math.floor(Math.random() * NIGHT_LINES.length)], "Xenia, half awake", ""); pose("sit"); }
      return;
    }
    if (holding) return;                               // you are reading the bubble: wait
    if (talking > 0) { if (--talking === 0) { bubble.classList.remove("on"); pose(idleLong() ? "type" : "stand"); } return; }
    const max = W() - 100, center = pos + 30;
    let move = 0;
    if (px !== null) {
      const d = px - center, dist = Math.abs(d);
      face = Math.sign(d) || face;
      if (dist > 170) move = Math.sign(d) * 10;          // catch up
      else if (dist < 110) move = -Math.sign(d) * 8;     // too close: back up, still facing you
    }
    const nextPos = Math.max(8, Math.min(pos + move, max));
    if (move === 0 || nextPos === pos) { pose(idleLong() ? "type" : "stand"); place(); if (++idle % 45 === 0) quote(); return; }
    frame ^= 1; pose(frame ? "walk-a" : "walk-b"); pos = nextPos; place();
  }
  function start() { pose(calm() ? "type" : sleeping() ? "sleep" : "wave"); place(); clearInterval(timer); if (!quiet && !reduce) timer = setInterval(tick, 166); clearTimeout(firstT); if (!quiet) firstT = setTimeout(quote, 2000); }
  function stop() { clearInterval(timer); clearTimeout(firstT); talking = 0; bubble.classList.remove("on"); m.classList.remove("brolly"); pose("sleep"); place(); }
  fox.addEventListener("click", () => { if (quiet) return; if (calm()) { unlock(); say("Oh, hi. Didn't see you there. I'll stop typing.", "Xenia", ""); return; } if (sleeping()) { wakeUp(); wake(); } else quote(); });
  function wake() { pose("wave"); say("Huh? Oh. I'm up. I was resting my eyes.", "Xenia", ""); }
  function unlockMe() { say("Fine, I'm off the clock.", "Xenia", ""); }
  return { start, stop, aside, brolly, wake, quoteNow: quote, unlock: unlockMe };
})();


// ---------- vim keys, like Vimium: j/k, d/u, gg/G, H/L, gt/gT, f/F link hints, yy, ? help, : or ` terminal ----------
const vim = (function () {
  const order = ["/", "/projects/", "/fleet/", "/writing/", "/labs/", "/slashes/"];
  let seq = "", seqT, hints = null, typed = "", newTab = false;
  const help = $("vimHelp");
  const typing = e => e.target.closest && e.target.closest("input, textarea, select, [contenteditable]");
  function go(dir) { const n = order.indexOf(location.pathname); location.href = order[(Math.max(0, n) + dir + order.length) % order.length]; }
  function clearHints() { if (hints) hints.forEach(h => h.tag.remove()); hints = null; typed = ""; }
  function showHints(tab) {
    clearHints(); newTab = tab;
    const els = [...document.querySelectorAll("a[href], button, select")].filter(el => { const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && getComputedStyle(el).visibility !== "hidden"; });
    const keys = "asdfghjklqwertyuiopzxcvbnm", two = els.length > keys.length;
    hints = els.map((el, n) => {
      const label = two ? keys[Math.floor(n / keys.length) % keys.length] + keys[n % keys.length] : keys[n];
      const r = el.getBoundingClientRect(), tag = document.createElement("span");
      tag.className = "vhint"; tag.textContent = label; tag.style.left = Math.max(0, r.left) + "px"; tag.style.top = Math.max(0, r.top) + "px";
      document.body.appendChild(tag); return { el, label, tag };
    });
  }
  function hintKey(k) {
    typed += k;
    const left = hints.filter(h => h.label.startsWith(typed));
    hints.forEach(h => h.tag.classList.toggle("dim", !h.label.startsWith(typed)));
    if (left.length === 1 && left[0].label === typed) {
      const el = left[0].el; clearHints();
      if (newTab && el.tagName === "A") { const t = el.target; el.target = "_blank"; el.click(); el.target = t; } else { el.focus(); el.click(); }
    } else if (!left.length) clearHints();
  }
  addEventListener("keydown", e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Escape") { clearHints(); help.hidden = true; seq = ""; return; }
    if (typing(e)) return;
    if (hints) { if (/^[a-z]$/.test(e.key)) { e.preventDefault(); hintKey(e.key); } return; }
    const k = e.key; seq += k; clearTimeout(seqT); seqT = setTimeout(() => seq = "", 700);
    const did = () => { e.preventDefault(); seq = ""; };
    const half = innerHeight / 2;
    if (seq.endsWith("gg")) { scrollTo({ top: 0 }); return did(); }
    if (seq.endsWith("gt")) { go(1); return did(); }
    if (seq.endsWith("gT")) { go(-1); return did(); }
    if (seq.endsWith("yy")) { navigator.clipboard?.writeText(location.href).catch(() => {}); toast("Copied this page's address."); return did(); }
    switch (k) {
      case "j": scrollBy({ top: 70 }); return did();
      case "k": scrollBy({ top: -70 }); return did();
      case "d": scrollBy({ top: half }); return did();
      case "u": scrollBy({ top: -half }); return did();
      case "G": scrollTo({ top: document.body.scrollHeight }); return did();
      case "H": history.back(); return did();
      case "L": history.forward(); return did();
      case "f": showHints(false); return did();
      case "F": showHints(true); return did();
      case "?": help.hidden = !help.hidden; return did();
      case ":": case "`": term.open(); return did();
    }
  });
  function toast(t) { const el = $("vtoast"); el.textContent = t; el.hidden = false; clearTimeout(el._t); el._t = setTimeout(() => el.hidden = true, 1800); }
  return { clearHints };
})();

// ---------- a tiny fake terminal: terminal style as an accent ----------
const term = (function () {
  const box = $("term"), out = $("termOut"), inp = $("termIn");
  const pages = ["projects", "hire", "fleet", "writing", "labs", "slashes", "weather", "quote-jar", "stickers"];
  const print = (t, cls) => { const d = document.createElement("div"); if (cls) d.className = cls; d.textContent = t; out.appendChild(d); out.scrollTop = out.scrollHeight; };
  const CMDS = {
    help: () => "commands: ls, cd <page>, cat now, neofetch, whoami, weather [force|snow nix|snow ai|snow kernel|rainbow|fog], night [on|off], quote, shutup, stickers, clear, exit. Vim keys work everywhere (press ?).",
    ls: () => pages.map(p => p + "/").join("  "),
    cd: a => { const p = (a || "").replace(/^\/|\/$/g, ""); if (!p || p === "~" || p === "home") { location.href = "/"; return "cd ~"; } if (pages.includes(p)) { location.href = `/${p}/`; return `cd ${p}`; } return `cd: no such page: ${a}`; },
    cat: a => { if (a !== "now") return `cat: ${a || "(nothing)"}: try 'cat now'`; const li = [...document.querySelectorAll(".now li")]; return li.length ? li.map(l => "- " + l.textContent).join("\n") : "It's on the home page and at /now/."; },
    neofetch: () => "lilijoy@torrent\n---------------\nOS: NixOS unstable\nKernel: Linux 6.18\nCPU: Ryzen 7 9800X3D (16)\nGPU: Radeon RX 7900 XTX\nMemory: 96 GB\nMascots: 2 (Xenia, Nimbus)",
    whoami: () => "a visitor. Xenia has noticed you.",
    weather: a => { if (!a) { const t = weather.today(); return `${typeof t.f === "number" ? "force " + t.f : t.f}: ${t.text}`; } const [k, f] = a.split(/\s+/); unlock(); weather.preview(isNaN(+k) ? k : Math.max(0, Math.min(12, +k)), f || (k === "snow" ? "nix" : undefined)); return "Previewing. Reload for the real weather."; },
    night: a => { forceNight = a === "off" ? false : true; awakeUntil = 0; weather.look(); return forceNight ? "Night mode. Shh." : "Day mode."; },
    quote: () => { mascot.quoteNow(); return "Xenia clears her throat."; },
    shutup: () => { $("shutup").click(); return quiet ? "Fine. They're sulking now." : "They're back."; },
    stickers: () => `${document.querySelectorAll("#collage .st").length} stickers on the lid. Yes, all of them.`,
    sudo: () => "Nice try. This incident will be reported to Nimbus.",
    rm: () => "Absolutely not.",
    vim: () => "You're already in it. Press Escape, then ? for the keys.",
    exit: () => { close(); return ""; },
    clear: () => { out.textContent = ""; return ""; },
  };
  function run(line) {
    print("lilijoy@skyseekerlabs:~$ " + line, "cmd");
    const [c, ...rest] = line.trim().split(/\s+/);
    if (!c) return;
    const f = CMDS[c]; const r = f ? f(rest.join(" ")) : `${c}: command not found. Try 'help'.`;
    if (r) print(r);
  }
  function open() { box.hidden = false; inp.value = ""; inp.focus(); if (!out.childElementCount) print("SkyseekerLabs shell. Type 'help'. Escape or 'exit' to leave."); }
  function close() { box.hidden = true; inp.blur(); }
  inp.addEventListener("keydown", e => { if (e.key === "Enter") { run(inp.value); inp.value = ""; } if (e.key === "Escape") close(); e.stopPropagation(); });
  $("termClose").addEventListener("click", close);
  return { open, close };
})();

// ---------- projects page: filter cards by vibe and tag (cards are plain HTML without JS) ----------
(function () {
  const bar = $("pfilters"), cards = [...document.querySelectorAll(".proj[data-vibe]")];
  if (!bar || !cards.length) return;
  const counts = {}; cards.forEach(c => c.dataset.tags.split(" ").filter(Boolean).forEach(t => counts[t] = (counts[t] || 0) + 1));
  const tags = Object.keys(counts).filter(t => counts[t] > 1).sort((a, b) => counts[b] - counts[a]);
  let vibe = "all", tag = null;
  bar.innerHTML = ["all", "serious", "fun"].map(v => `<button type="button" data-v="${v}">${v}</button>`).join("") + '<span class="sep"></span>' + tags.map(t => `<button type="button" data-t="${t}">#${t}</button>`).join("");
  function render() {
    cards.forEach(c => c.hidden = !((vibe === "all" || c.dataset.vibe === vibe) && (!tag || c.dataset.tags.split(" ").includes(tag))));
    bar.querySelectorAll("[data-v]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === vibe)));
    bar.querySelectorAll("[data-t]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.t === tag)));
  }
  bar.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; if (b.dataset.v) vibe = b.dataset.v; if (b.dataset.t) tag = tag === b.dataset.t ? null : b.dataset.t; render(); });
  render();
})();

// ---------- copy buttons (email addresses) ----------
document.querySelectorAll("[data-copy]").forEach(b => b.addEventListener("click", async e => {
  e.preventDefault();
  try { await navigator.clipboard.writeText(b.dataset.copy); b.dataset.was = b.dataset.was || b.textContent; b.textContent = "Copied"; setTimeout(() => b.textContent = b.dataset.was, 1600); }
  catch { const r = document.createRange(); r.selectNodeContents(b); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
}));

// ---------- build stamp: "12 minutes ago" from the build date ----------
document.querySelectorAll("[data-built]").forEach(el => {
  const d = el.dataset.built; if (!/^\d{14}$/.test(d)) return;
  const t = Date.UTC(+d.slice(0, 4), +d.slice(4, 6) - 1, +d.slice(6, 8), +d.slice(8, 10), +d.slice(10, 12)), m = Math.round((Date.now() - t) / 60000);
  el.textContent = m < 60 ? `${m} minutes ago` : m < 2880 ? `${Math.round(m / 60)} hours ago` : `${Math.round(m / 1440)} days ago`;
});

// ---------- live status stickers: homelab writes /status.json; no file, no stickers ----------
fetch("/status.json", { cache: "no-store" }).then(r => r.ok ? r.json() : Promise.reject()).then(s => {
  const set = (k, t) => document.querySelectorAll(`[data-status="${k}"]`).forEach(el => { el.textContent = t; el.hidden = false; });
  if (s.uptime_days != null) set("uptime", `homelab ▲ up ${s.uptime_days} days`);
  if (s.deployed) { const m = Math.round((Date.now() - Date.parse(s.deployed)) / 60000); set("deployed", `deployed ${m < 60 ? m + " min" : Math.round(m / 60) + " h"} ago`); }
  if (s.flake_lock_days != null) set("lock", `flake.lock ${s.flake_lock_days} days old`);
}).catch(() => {});

// ---------- the SHUT UP button ----------
function applyQuiet() {
  document.body.classList.toggle("quiet", quiet);
  const b = $("shutup");
  b.setAttribute("aria-pressed", String(quiet));
  b.textContent = quiet ? "ok, you can talk" : "SHUT UP";
  if (quiet) { weather.stop(); mascot.stop(); } else { weather.look(); weather.start(); mascot.start(); }
}
$("shutup").addEventListener("click", () => {
  quiet = !quiet;
  try { localStorage.setItem("skyseeker-quiet", quiet ? "1" : "0"); } catch {}
  applyQuiet();
});

applyQuiet();
