function loadCorsImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function getTileImages(mapContainer) {
  const tilePane = mapContainer.querySelector('.leaflet-tile-pane');
  if (!tilePane) return [];
  const imgs = tilePane.querySelectorAll('img');
  const tiles = [];
  const containerRect = mapContainer.getBoundingClientRect();
  for (const img of imgs) {
    if (!img.complete || !img.naturalWidth) continue;
    const rect = img.getBoundingClientRect();
    tiles.push({
      src: img.src,
      x: rect.left - containerRect.left,
      y: rect.top - containerRect.top,
      w: rect.width,
      h: rect.height,
    });
  }
  return tiles;
}

// Leaflet's overlay SVGs use a CSS transform to position them.
// getBoundingClientRect() accounts for transforms, so we use that.
function getOverlaySvgs(mapContainer) {
  const svgs = mapContainer.querySelectorAll('.leaflet-overlay-pane svg');
  const result = [];
  const containerRect = mapContainer.getBoundingClientRect();
  for (const svg of svgs) {
    const rect = svg.getBoundingClientRect();
    result.push({
      svg,
      x: rect.left - containerRect.left,
      y: rect.top - containerRect.top,
      w: rect.width,
      h: rect.height,
    });
  }
  return result;
}

function getMarkerElements(mapContainer) {
  const pane = mapContainer.querySelector('.leaflet-marker-pane');
  const results = [];
  const containerRect = mapContainer.getBoundingClientRect();
  if (pane) {
    for (const el of pane.children) {
      const rect = el.getBoundingClientRect();
      results.push({
        el,
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        w: rect.width,
        h: rect.height,
      });
    }
  }
  return results;
}

function svgToImage(svgEl, w, h) {
  return new Promise((resolve) => {
    const clone = svgEl.cloneNode(true);
    // Remove any transform on the cloned SVG since we position via x,y on canvas
    clone.style.transform = 'none';
    clone.removeAttribute('style');
    clone.setAttribute('width', w);
    clone.setAttribute('height', h);
    // Ensure viewBox matches the SVG's own viewBox or dimensions
    if (!clone.getAttribute('viewBox')) {
      const origW = svgEl.getAttribute('width') || svgEl.viewBox?.baseVal?.width || w;
      const origH = svgEl.getAttribute('height') || svgEl.viewBox?.baseVal?.height || h;
      clone.setAttribute('viewBox', `0 0 ${origW} ${origH}`);
    }
    const data = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

async function renderMapToCanvas(mapContainer, scale) {
  const w = mapContainer.offsetWidth;
  const h = mapContainer.offsetHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  // 1. Background: use the map container's background color (handles landmass water color)
  const containerBg = getComputedStyle(mapContainer).backgroundColor;
  ctx.fillStyle = (containerBg && containerBg !== 'rgba(0, 0, 0, 0)' && containerBg !== 'transparent')
    ? containerBg : '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // 2. Tile images
  const tiles = getTileImages(mapContainer);
  const tileImages = await Promise.all(tiles.map(t => loadCorsImage(t.src)));
  for (let i = 0; i < tiles.length; i++) {
    if (tileImages[i]) ctx.drawImage(tileImages[i], tiles[i].x, tiles[i].y, tiles[i].w, tiles[i].h);
  }

  // 3. SVG overlays (routes, borders, land: getBoundingClientRect gives correct position)
  const svgs = getOverlaySvgs(mapContainer);
  for (const s of svgs) {
    const img = await svgToImage(s.svg, s.w, s.h);
    if (img) ctx.drawImage(img, s.x, s.y, s.w, s.h);
  }

  // 4. Markers
  const markers = getMarkerElements(mapContainer);
  for (const m of markers) {
    const imgEl = m.el.tagName === 'IMG' ? m.el : m.el.querySelector('img');
    if (imgEl && imgEl.src) {
      const corsImg = await loadCorsImage(imgEl.src);
      if (corsImg) ctx.drawImage(corsImg, m.x, m.y, m.w, m.h);
    }
  }

  // 5. Labels (div icons with city-label class)
  const containerRect = mapContainer.getBoundingClientRect();
  const allDivIcons = mapContainer.querySelectorAll('.city-label');
  for (const div of allDivIcons) {
    const span = div.querySelector('span') || div;
    const cs = getComputedStyle(span);
    const rect = div.getBoundingClientRect();
    const x = rect.left - containerRect.left;
    const y = rect.top - containerRect.top;

    ctx.font = `${cs.fontSize} ${cs.fontFamily}`;
    ctx.fillStyle = cs.color || '#000';
    ctx.textBaseline = 'top';

    if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') {
      ctx.save();
      const tm = ctx.measureText(span.textContent);
      const pad = 3;
      ctx.fillStyle = cs.backgroundColor;
      ctx.fillRect(x - pad, y - pad, tm.width + pad * 2, parseFloat(cs.fontSize) + pad * 2);
      ctx.restore();
      ctx.fillStyle = cs.color || '#000';
    }
    ctx.fillText(span.textContent, x, y);
  }

  // 6. Scale bar
  const scaleLine = mapContainer.querySelector('.leaflet-control-scale-line');
  if (scaleLine) {
    const lr = scaleLine.getBoundingClientRect();
    const lx = lr.left - containerRect.left;
    const ly = lr.top - containerRect.top;
    const lw = lr.width;
    const lh = lr.height;

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(lx - 2, ly - 2, lw + 4, lh + 4);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(lx, ly + lh); ctx.lineTo(lx, ly); ctx.lineTo(lx + lw, ly); ctx.lineTo(lx + lw, ly + lh);
    ctx.stroke();
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(scaleLine.textContent, lx + lw / 2, ly + lh / 2);
  }

  // 7. Legend
  const legend = mapContainer.querySelector('.legend-overlay');
  if (legend) {
    const lr = legend.getBoundingClientRect();
    const lx = lr.left - containerRect.left;
    const ly = lr.top - containerRect.top;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.fillRect(lx, ly, lr.width, lr.height);
    ctx.strokeRect(lx, ly, lr.width, lr.height);

    for (const entry of legend.children) {
      const svg = entry.querySelector('svg');
      if (svg) {
        const sr = svg.getBoundingClientRect();
        const svgImg = await svgToImage(svg, sr.width, sr.height);
        if (svgImg) ctx.drawImage(svgImg, sr.left - containerRect.left, sr.top - containerRect.top, sr.width, sr.height);
      }
      const span = entry.querySelector('span');
      if (span) {
        const sr = span.getBoundingClientRect();
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#333';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText(span.textContent, sr.left - containerRect.left, sr.top - containerRect.top + sr.height / 2);
      }
    }
  }

  return canvas;
}

export async function exportPNG(mapContainer, dpi = 300) {
  const canvas = await renderMapToCanvas(mapContainer, dpi / 96);
  return new Promise((resolve) => { canvas.toBlob(resolve, 'image/png'); });
}

export async function exportPDF(mapContainer, dpi = 300, pageSize = 'a4') {
  const { jsPDF } = await import('jspdf');
  const canvas = await renderMapToCanvas(mapContainer, dpi / 96);
  const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);

  const rect = mapContainer.getBoundingClientRect();
  const aspectRatio = rect.width / rect.height;

  let pdfW, pdfH;
  if (pageSize === 'a4') {
    pdfW = 297; pdfH = 210;
    if (rect.height > rect.width) { pdfW = 210; pdfH = 297; }
  } else if (pageSize === 'letter') {
    pdfW = 279.4; pdfH = 215.9;
    if (rect.height > rect.width) { pdfW = 215.9; pdfH = 279.4; }
  } else {
    pdfW = rect.width * 0.264583;
    pdfH = rect.height * 0.264583;
  }

  const orientation = pdfW > pdfH ? 'landscape' : 'portrait';
  const pdf = new jsPDF({ orientation, unit: 'mm', format: pageSize === 'viewport' ? [pdfW, pdfH] : pageSize, compress: true });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  let imgW = pageW, imgH = imgW / aspectRatio;
  if (imgH > pageH) { imgH = pageH; imgW = imgH * aspectRatio; }

  pdf.addImage(jpegDataUrl, 'JPEG', (pageW - imgW) / 2, (pageH - imgH) / 2, imgW, imgH, undefined, 'FAST');
  return pdf.output('blob');
}
