(function () {
  function injectHopeFlowLayout() {
    if (document.getElementById("hopeflow-retrace-layout")) return;

    const style = document.createElement("style");
    style.id = "hopeflow-retrace-layout";
    style.textContent = `
      html,
      body,
      #root {
        width: 100% !important;
        height: 100% !important;
        min-height: 0 !important;
        overflow: hidden !important;
      }

      .container {
        flex-direction: column !important;
        width: 100% !important;
        height: 100vh !important;
        min-height: 0 !important;
        overflow: hidden !important;
      }

      .container > input[type="file"] {
        display: none !important;
      }

      .container > :not(input):first-of-type {
        display: none !important;
      }

      .left-col,
      .main-area {
        width: 100% !important;
        min-width: 0 !important;
        height: 100% !important;
        min-height: 0 !important;
        flex: 1 1 auto !important;
        padding: 0 !important;
        overflow: hidden !important;
      }

      .container > :last-child {
        display: none !important;
      }

      .main-area button,
      .main-area input,
      .main-area select,
      .main-area label,
      .main-area [role="button"],
      .main-area [role="checkbox"],
      .main-area [role="slider"],
      .main-area [class*="toolbar"],
      .main-area [class*="Toolbar"],
      .main-area [class*="controls"],
      .main-area [class*="Controls"] {
        display: none !important;
      }

      .left-footer,
      .canvas-overlay-controls,
      .canvas-zoom-controls {
        display: none !important;
      }

      .preview-area {
        width: 100% !important;
        height: 100% !important;
        min-height: 0 !important;
        flex: 1 1 auto !important;
        margin: 0 !important;
        overflow: hidden !important;
      }

      .preview-area img,
      .svg-preview,
      .svg-preview svg,
      canvas {
        max-width: 100% !important;
        max-height: 100% !important;
      }

      .preview-area img,
      .svg-preview svg {
        width: 100% !important;
        height: 100% !important;
        object-fit: contain !important;
      }

      .svg-preview {
        width: 100% !important;
        height: 100% !important;
        max-height: none !important;
        overflow: hidden !important;
        transform: none !important;
      }

      [style*="overflow: auto"],
      [style*="overflow:auto"],
      [style*="overflow-y: auto"],
      [style*="overflow-y:auto"] {
        overflow: hidden !important;
        overflow-y: hidden !important;
      }
    `;
    document.head.appendChild(style);
  }

  const MODE_LABELS = {
    single: ["单色", "單色"],
    multi: ["多色"],
    gradient: ["渐变", "漸變"],
    auto: ["自动", "自動"],
    pro: ["专业", "專業"],
  };

  const SELECT_LABELS = {
    source: { alpha: ["Alpha"], luminance: ["明度"] },
    turnpolicy: {
      minority: ["少数优先", "少數優先", "少数", "minority"],
      majority: ["多数优先", "多數優先", "多数", "majority"],
      black: ["黑色优先", "black"],
      white: ["白色优先", "white"],
      left: ["左转优先", "left"],
      right: ["右转优先", "right"],
    },
    fillColor: { original: ["原色"], black: ["黑色"], magenta: ["洋红", "洋紅"] },
    colorMode: { color: ["彩色"], binary: ["二值"] },
    hierarchical: { stacked: ["堆叠", "堆疊"], cutout: ["镂空", "鏤空"] },
  };

  const LABEL_BY_PARAM = {
    autoThreshold: ["阈值", "閾值"],
    autoFilterSize: ["噪点忽略", "噪點忽略", "自动去噪"],
    strokeDetail: ["线条粗细", "線條粗細"],
    alphamax: ["平滑度"],
    opttolerance: ["精简度", "精簡度"],
    filterSpeckle: ["多色去噪"],
    colorPrecision: ["颜色精度", "顏色精度"],
    gradientStep: ["渐变步长", "漸變步長"],
    cornerThreshold: ["转角阈值", "轉角閾值"],
    segmentLength: ["分段长度", "分段長度"],
    spliceThreshold: ["拼接阈值", "拼接閾值"],
    edgeThreshold: ["边缘阈值", "邊緣閾值"],
    colorTolerance: ["颜色容差", "顏色容差"],
    minRegionArea: ["最小区域", "最小區域"],
    maxRegions: ["最大区域", "最大區域"],
    maxLayers: ["最大图层", "最大圖層"],
    fitStrictness: ["拟合严格度", "擬合嚴格度"],
    overlayExpandPx: ["覆盖扩展", "覆蓋擴展"],
  };

  const BOOLEAN_LABELS = {
    invert: ["黑白反相", "反相"],
    showAnchors: ["显示锚点", "顯示錨點"],
    optcurve: ["优化贝塞尔曲线", "優化貝塞爾曲線"],
    autoSimplify: ["自动简化", "自動簡化"],
    preserveNearLinear: ["保留近直线", "保留近直線"],
    multiCleanEdge: ["多色净边", "多色淨邊"],
    multiPaletteConstraint: ["限制调色板", "限制調色板"],
    gradientPreprocess: ["渐变预处理", "漸變預處理"],
    enableRadial: ["径向渐变", "徑向漸變"],
    debugLeakPreview: ["泄漏调试", "洩漏調試"],
    stackedFriendlyOutput: ["堆叠友好输出", "堆疊友好輸出"],
  };

  Object.assign(MODE_LABELS, {
    single: ["单色", "單色", ...(MODE_LABELS.single || [])],
    multi: ["多色", ...(MODE_LABELS.multi || [])],
    gradient: ["渐变", "漸變", ...(MODE_LABELS.gradient || [])],
    auto: ["自动", "自動", ...(MODE_LABELS.auto || [])],
    pro: ["专业", "專業", ...(MODE_LABELS.pro || [])],
  });

  Object.assign(SELECT_LABELS, {
    source: { alpha: ["Alpha"], luminance: ["明度", "亮度"] },
    turnpolicy: {
      minority: ["少数优先", "少數優先", "minority"],
      majority: ["多数优先", "多數優先", "majority"],
      black: ["黑色优先", "黑色優先", "black"],
      white: ["白色优先", "白色優先", "white"],
      left: ["左转优先", "左轉優先", "left"],
      right: ["右转优先", "右轉優先", "right"],
    },
    fillColor: { original: ["原色", "原始"], black: ["黑色"], magenta: ["洋红", "洋紅"] },
    colorMode: { color: ["彩色"], binary: ["二值"] },
    hierarchical: { stacked: ["堆叠", "堆疊"], cutout: ["镂空", "鏤空"] },
    curveFitting: { spline: ["样条曲线", "樣條曲線", "Spline"], polyline: ["折线", "折線", "Polyline"] },
  });

  Object.assign(LABEL_BY_PARAM, {
    autoThreshold: ["阈值", "閾值"],
    autoFilterSize: ["噪点忽略", "噪點忽略", "自动去噪", "自動去噪"],
    strokeDetail: ["线条粗细", "線條粗細"],
    alphamax: ["平滑度"],
    opttolerance: ["精简度", "精簡度"],
    filterSpeckle: ["过滤斑点", "過濾斑點"],
    colorPrecision: ["颜色精度", "顏色精度"],
    targetColors: ["目标颜色数", "目標顏色數"],
    gradientStep: ["梯度步长", "梯度步長", "渐变步长", "漸變步長"],
    cornerThreshold: ["拐角平滑", "转角阈值", "轉角閾值"],
    segmentLength: ["分段长度", "分段長度"],
    spliceThreshold: ["拼接阈值", "拼接閾值"],
    blendStrength: ["混合强度", "混合強度"],
    preprocessStrength: ["预处理强度", "預處理強度"],
    edgeThreshold: ["边缘阈值", "邊緣閾值"],
    colorTolerance: ["颜色容差", "顏色容差"],
    minRegionArea: ["最小区域", "最小區域"],
    maxRegions: ["最大区域数", "最大區域數", "最大区域", "最大區域"],
    maxLayers: ["最大叠加层", "最大疊加層", "最大图层", "最大圖層"],
    fitStrictness: ["拟合严格度", "擬合嚴格度"],
    pathSimplify: ["路径简化", "路徑簡化"],
    overlayExpandPx: ["覆盖扩展", "覆蓋擴展"],
  });

  Object.assign(BOOLEAN_LABELS, {
    invert: ["黑白反相", "反相"],
    showAnchors: ["显示锚点", "顯示錨點"],
    optcurve: ["优化贝塞尔曲线", "優化貝塞爾曲線"],
    autoSimplify: ["自动简化", "自動簡化"],
    preserveNearLinear: ["保留近直线", "保留近直線"],
    multiCleanEdge: ["清理碎块", "清理碎塊"],
    multiPaletteConstraint: ["调色板约束", "調色板約束", "限制调色板", "限制調色板"],
    gradientPreprocess: ["渐变预处理", "漸變預處理"],
    enableRadial: ["启用径向渐变拟合", "啟用徑向漸變擬合", "径向渐变", "徑向漸變"],
    debugLeakPreview: ["泄漏调试", "洩漏調試"],
    stackedFriendlyOutput: ["叠层友好输出", "疊層友好輸出", "减少镂空", "減少鏤空"],
  });

  function textMatches(text, labels) {
    const normalized = normalizeButtonText(text);
    return labels.some((label) => normalized.includes(normalizeButtonText(label)));
  }

  function clickByLabels(labels) {
    const candidates = Array.from(document.querySelectorAll("button, [role='button'], [role='tab'], label, div, span"));
    const el = candidates.find((node) => textMatches(node.textContent, labels));
    if (!el) return false;
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    return true;
  }

  function findControlByLabel(labels) {
    const nodes = Array.from(document.querySelectorAll("label, div, span, p"));
    const labelNode = nodes.find((node) => textMatches(node.textContent, labels));
    if (!labelNode) return null;
    let scope = labelNode;
    for (let i = 0; i < 4 && scope; i++) {
      const control = scope.querySelector && scope.querySelector("input, select");
      if (control) return control;
      scope = scope.parentElement;
    }
    return null;
  }

  function setNativeValue(control, value) {
    if (!control) return false;
    const prototype = control instanceof HTMLInputElement
      ? HTMLInputElement.prototype
      : control instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLTextAreaElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    if (descriptor && descriptor.set) descriptor.set.call(control, String(value));
    else control.value = String(value);
    control.dispatchEvent(new Event("input", { bubbles: true }));
    control.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function setParamByLabel(name, value) {
    const labels = LABEL_BY_PARAM[name];
    if (!labels) return false;
    return setNativeValue(findControlByLabel(labels), value);
  }

  function setSelectByText(name, value) {
    const options = SELECT_LABELS[name] && SELECT_LABELS[name][value];
    if (!options) return false;
    return clickByLabels(options);
  }

  function setBooleanByLabel(name, value) {
    const labels = BOOLEAN_LABELS[name];
    if (!labels) return false;
    const nodes = Array.from(document.querySelectorAll("label, button, [role='checkbox'], div, span"));
    const node = nodes.find((candidate) => textMatches(candidate.textContent, labels));
    if (!node) return false;
    const checked = node.getAttribute("aria-checked") === "true" || /checked|active|selected/i.test(node.className || "");
    if (checked !== !!value) {
      node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    }
    return true;
  }

  function applyHopeFlowParams(params) {
    if (!params || typeof params !== "object") return;
    if (params.traceMode) clickByLabels(MODE_LABELS[params.traceMode] || [params.traceMode]);
    if (params.detailMode) clickByLabels(MODE_LABELS[params.detailMode] || [params.detailMode]);

    Object.keys(LABEL_BY_PARAM).forEach((name) => {
      if (params[name] !== undefined) setParamByLabel(name, params[name]);
    });
    Object.keys(SELECT_LABELS).forEach((name) => {
      if (params[name] !== undefined) setSelectByText(name, params[name]);
    });
    Object.keys(BOOLEAN_LABELS).forEach((name) => {
      if (params[name] !== undefined) setBooleanByLabel(name, params[name]);
    });
  }

  function getCurrentSvgText() {
    const svgHost = document.querySelector(".svg-preview");
    const svg = svgHost ? svgHost.querySelector("svg") : null;
    return svg ? svg.outerHTML : "";
  }

  function extractSvgSize(svgCode) {
    const viewBox = svgCode.match(/\bviewBox=(["'])([^"']+)\1/i);
    if (viewBox) {
      const parts = viewBox[2].trim().split(/[\s,]+/).map(Number);
      if (parts.length === 4 && Number.isFinite(parts[2]) && Number.isFinite(parts[3]) && parts[2] > 0 && parts[3] > 0) {
        return { width: parts[2], height: parts[3] };
      }
    }
    const width = svgCode.match(/\bwidth=(["'])([\d.]+)\1/i);
    const height = svgCode.match(/\bheight=(["'])([\d.]+)\1/i);
    const parsedWidth = width ? Number(width[2]) : 1;
    const parsedHeight = height ? Number(height[2]) : 1;
    return {
      width: Number.isFinite(parsedWidth) && parsedWidth > 0 ? parsedWidth : 1,
      height: Number.isFinite(parsedHeight) && parsedHeight > 0 ? parsedHeight : 1,
    };
  }

  function renderHopeFlowVectorizeSvg(svgCode, sourceUrl) {
    if (!svgCode || typeof svgCode !== "string") return false;
    const previewArea = document.querySelector(".preview-area") || document.querySelector(".main-area") || document.body;
    let host = document.getElementById("hopeflow-live-vectorize-preview");
    if (!host) {
      host = document.createElement("div");
      host.id = "hopeflow-live-vectorize-preview";
      host.style.position = "absolute";
      host.style.inset = "0";
      host.style.display = "flex";
      host.style.alignItems = "center";
      host.style.justifyContent = "center";
      host.style.overflow = "hidden";
      host.style.background = "transparent";
      host.style.zIndex = "20";
      host.style.pointerEvents = "none";
      if (getComputedStyle(previewArea).position === "static") {
        previewArea.style.position = "relative";
      }
      previewArea.appendChild(host);
    }

    Array.from(previewArea.children).forEach((child) => {
      if (child !== host && child instanceof HTMLElement) {
        child.style.opacity = "0";
        child.style.pointerEvents = "none";
      }
    });

    const size = extractSvgSize(svgCode);
    const aspect = size.width / Math.max(1, size.height);
    const safeSourceUrl = sourceUrl ? String(sourceUrl).replace(/"/g, "&quot;") : "";
    const imageLayer = safeSourceUrl
      ? '<img src="' + safeSourceUrl + '" style="position:absolute;inset:0;width:100%;height:100%;object-fit:fill;opacity:.2;"/>'
      : "";

    if (sourceUrl) {
      host.innerHTML = '<div class="hopeflow-live-fitbox" style="position:relative;width:100%;height:100%;max-width:calc(100vh * ' +
        aspect +
        ');max-height:calc(100vw / ' +
        aspect +
        ');aspect-ratio:' +
        size.width +
        " / " +
        size.height +
        ';overflow:hidden;background:#fff;">' +
        imageLayer +
        '<div class="svg-preview" style="position:absolute;inset:0;width:100%;height:100%;overflow:hidden;">' +
        svgCode +
        "</div></div>";
    } else {
      host.innerHTML = svgCode;
    }

    const svg = host.querySelector("svg");
    if (svg) {
      svg.style.width = "100%";
      svg.style.height = "100%";
      svg.style.maxWidth = "100%";
      svg.style.maxHeight = "100%";
      svg.style.display = "block";
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    }
    return true;
  }

  function flashButton(btn, text, ms) {
    const old = btn.textContent;
    btn.textContent = text;
    window.setTimeout(() => {
      btn.textContent = old;
    }, ms || 1200);
  }

  function showToast(text, kind) {
    let toast = document.getElementById("custom-app-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "custom-app-toast";
      toast.style.position = "fixed";
      toast.style.left = "50%";
      toast.style.bottom = "24px";
      toast.style.transform = "translateX(-50%)";
      toast.style.zIndex = "99999";
      toast.style.padding = "10px 14px";
      toast.style.borderRadius = "10px";
      toast.style.fontSize = "14px";
      toast.style.lineHeight = "1.4";
      toast.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.24)";
      toast.style.pointerEvents = "none";
      toast.style.transition = "opacity 160ms ease";
      document.body.appendChild(toast);
    }

    toast.textContent = text;
    toast.style.background = kind === "error" ? "#8f1d1d" : "#1f7a37";
    toast.style.color = "#ffffff";
    toast.style.opacity = "1";

    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() => {
      toast.style.opacity = "0";
    }, 1600);
  }

  function normalizeButtonText(text) {
    return (text || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function findNativeDownloadBtn() {
    const buttons = Array.from(document.querySelectorAll("button"));
    return (
      buttons.find((button) => {
        const text = normalizeButtonText(button.textContent);
        return text === "download svg" || (text.includes("svg") && text.includes("download") && !text.includes("all"));
      }) || null
    );
  }

  function ensureCopyBtnBesideNativeDownload() {
    const nativeBtn = findNativeDownloadBtn();
    if (!nativeBtn || !nativeBtn.parentNode) return;

    let copyBtn = document.getElementById("copy-svg-btn-inline");
    if (!copyBtn) {
      copyBtn = document.createElement("button");
      copyBtn.id = "copy-svg-btn-inline";
      copyBtn.className = nativeBtn.className || "text-btn";
      copyBtn.textContent = "Copy SVG";
      copyBtn.style.height = nativeBtn.style.height || "32px";
      copyBtn.style.background = nativeBtn.style.background || "transparent";
      copyBtn.style.border = nativeBtn.style.border || "1px solid var(--border-subtle)";
      copyBtn.style.color = nativeBtn.style.color || "var(--text-primary)";
      copyBtn.style.marginRight = "8px";

      copyBtn.addEventListener("click", async () => {
        const text = getCurrentSvgText();
        if (!text) {
          flashButton(copyBtn, "No SVG", 1400);
          return;
        }

        try {
          await navigator.clipboard.writeText(text);
        } catch (_) {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }

        flashButton(copyBtn, "Copied", 1000);
      });

      nativeBtn.parentNode.insertBefore(copyBtn, nativeBtn);
    }

    copyBtn.disabled = !!nativeBtn.disabled;
  }

  function isEditableTarget(target) {
    if (!(target instanceof Element)) return false;
    return !!target.closest('input, textarea, [contenteditable=""], [contenteditable="true"], [role="textbox"]');
  }

  function extensionFromMimeType(type) {
    if (type === "image/png") return "png";
    if (type === "image/jpeg") return "jpg";
    if (type === "image/webp") return "webp";
    if (type === "image/gif") return "gif";
    return "png";
  }

  function toUploadableFiles(fileList) {
    const now = Date.now();
    return fileList.map((file, index) => {
      const safeName =
        file.name && file.name.trim()
          ? file.name
          : "pasted-image-" + now + "-" + (index + 1) + "." + extensionFromMimeType(file.type);

      if (file.name === safeName) return file;

      return new File([file], safeName, {
        type: file.type || "image/png",
        lastModified: now,
      });
    });
  }

  function setInputFiles(input, files) {
    const dataTransfer = new DataTransfer();
    files.forEach((file) => dataTransfer.items.add(file));
    input.files = dataTransfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return dataTransfer;
  }

  function dispatchDrop(files) {
    const container = document.querySelector(".container") || document.body;
    const dataTransfer = new DataTransfer();
    files.forEach((file) => dataTransfer.items.add(file));

    const dropEvent = new DragEvent("drop", {
      bubbles: true,
      cancelable: true,
      dataTransfer,
    });

    return container.dispatchEvent(dropEvent);
  }

  function uploadPastedFiles(files) {
    const uploadInput = document.querySelector('input[type="file"][accept*="image"]');
    if (uploadInput) {
      try {
        setInputFiles(uploadInput, files);
        return true;
      } catch (_) {
        // Fall through to drop simulation.
      }
    }

    try {
      return dispatchDrop(files);
    } catch (_) {
      return false;
    }
  }

  function extractImageFiles(event) {
    const clipboard = event.clipboardData;
    if (!clipboard || !clipboard.items) return [];

    const files = [];
    for (const item of clipboard.items) {
      if (!item.type || !item.type.startsWith("image/")) continue;
      const file = item.getAsFile();
      if (file) files.push(file);
    }
    return files;
  }

  function handlePaste(event) {
    const imageFiles = extractImageFiles(event);
    if (imageFiles.length === 0 || isEditableTarget(event.target)) return;

    event.preventDefault();
    event.stopPropagation();

    const files = toUploadableFiles(imageFiles);
    const ok = uploadPastedFiles(files);
    showToast(ok ? "Image pasted" : "Paste failed, please use upload", ok ? "success" : "error");
  }

  function blockPreviewZoom(event) {
    if (isEditableTarget(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
  }

  const observer = new MutationObserver(() => {
    injectHopeFlowLayout();
    ensureCopyBtnBesideNativeDownload();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  document.addEventListener("paste", handlePaste, true);
  document.addEventListener("wheel", blockPreviewZoom, { capture: true, passive: false });
  window.addEventListener("message", function (event) {
    const data = event.data || {};
    if (data.type === "hopeflow:render-vectorize-svg") {
      renderHopeFlowVectorizeSvg(data.svgCode, data.sourceUrl);
      return;
    }
    if (data.type !== "hopeflow:set-vectorize-params") return;
    window.setTimeout(function () {
      applyHopeFlowParams(data.params);
    }, 20);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      injectHopeFlowLayout();
      ensureCopyBtnBesideNativeDownload();
    });
  } else {
    injectHopeFlowLayout();
    ensureCopyBtnBesideNativeDownload();
  }
})();
