// static/app.js
(() => {
  const $ = (id) => document.getElementById(id);

  const inH = $("inH"), inW = $("inW"), inC = $("inC");
  const layerType = $("layerType");
  const k = $("k"), s = $("s"), p = $("p"), d = $("d"), outC = $("outC");
  const addLayerBtn = $("addLayer");
  const archTbody = $("archTbody");
  const clearBtn = $("clearLayers");
  const exampleBtn = $("exampleNet");
  const exportBtn = $("exportJson");
  const importInput = $("importJson");
  const imageUpload = $("imageUpload");
  const imagePreview = $("imagePreview");
  const imageInfo = $("imageInfo");
  const originalSize = $("originalSize");
  const currentSize = $("currentSize");
  const imageVisualization = $("imageVisualization");

  let layers = [];
  let currentImage = null;
  let originalImageData = null;

  function asInt(el) { return Math.max( parseInt(el.value || "0", 10), 0 ); }
  function asIntMin1(el) { return Math.max( parseInt(el.value || "1", 10), 1 ); }

  function compute() {
    // Read input image
    let H = asIntMin1(inH);
    let W = asIntMin1(inW);
    let C = asIntMin1(inC);

    // RF and jumps per axis
    let rfH = 1, rfW = 1;
    let jH = 1, jW = 1;

    const rows = [];

    for (let i = 0; i < layers.length; i++) {
      const L = layers[i];
      let note = "";

      if (L.type === "conv") {
        const kEff = L.d * (L.k - 1) + 1;
        const Hout = Math.floor((H + 2*L.p - kEff) / L.s) + 1;
        const Wout = Math.floor((W + 2*L.p - kEff) / L.s) + 1;
        if (Hout <= 0 || Wout <= 0) note = "⚠️ output <= 0 (check k/p/s/d)";
        // RF, jump update
        const rfHn = rfH + (kEff - 1) * jH;
        const rfWn = rfW + (kEff - 1) * jW;
        const jHn = jH * L.s, jWn = jW * L.s;

        H = Hout; W = Wout; C = L.outC;
        rfH = rfHn; rfW = rfWn; jH = jHn; jW = jWn;

      } else if (L.type === "maxpool" || L.type === "avgpool") {
        const kEff = L.d * (L.k - 1) + 1;
        const Hout = Math.floor((H + 2*L.p - kEff) / L.s) + 1;
        const Wout = Math.floor((W + 2*L.p - kEff) / L.s) + 1;
        if (Hout <= 0 || Wout <= 0) note = "⚠️ output <= 0 (check k/p/s/d)";
        // Pooling keeps channels, grows RF like a conv with no params
        const rfHn = rfH + (kEff - 1) * jH;
        const rfWn = rfW + (kEff - 1) * jW;
        const jHn = jH * L.s, jWn = jW * L.s;

        H = Hout; W = Wout; // C unchanged
        rfH = rfHn; rfW = rfWn; jH = jHn; jW = jWn;

      } else if (L.type === "fc") {
        // Flatten HxW -> 1x1, assume dense connects to all positions
        const rfHn = rfH + (H - 1) * jH;
        const rfWn = rfW + (W - 1) * jW;
        H = 1; W = 1; C = L.outC; // units
        rfH = rfHn; rfW = rfWn; /* jumps irrelevant after 1x1 but keep */
      }

      rows.push({
        idx: i+1,
        type: L.type,
        k: L.k, s: L.s, p: L.p, d: L.d,
        outShape: `${H}×${W}×${C}`,
        rf: `${rfH}×${rfW}`,
        jump: `${jH}×${jW}`,
        note,
      });
    }

    renderTable(rows);
    updateImageVisualization();
  }

  function renderTable(rows) {
    archTbody.innerHTML = "";
    rows.forEach((r, i) => {
      const tr = document.createElement("tr");
      tr.className = "border-b hover:bg-slate-50";
      tr.innerHTML = `
        <td class="p-2">${r.idx}</td>
        <td class="p-2">${prettyType(layers[i])}</td>
        <td class="p-2">${fmtKSPL(layers[i])}</td>
        <td class="p-2 font-mono">${r.outShape}</td>
        <td class="p-2 font-mono">${r.rf}</td>
        <td class="p-2 font-mono">${r.jump}</td>
        <td class="p-2">${r.note}</td>
        <td class="p-2">
          <button data-idx="${i}" class="del px-2 py-1 rounded-lg bg-white border shadow text-xs hover:bg-slate-100">Remove</button>
        </td>
      `;
      archTbody.appendChild(tr);
    });

    // Hook up delete buttons
    document.querySelectorAll("button.del").forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute("data-idx"), 10);
        layers.splice(idx, 1);
        compute();
      };
    });
  }

  function prettyType(L) {
    if (L.type === "conv") return `Conv2D → ${L.outC}`;
    if (L.type === "maxpool") return `MaxPool2D`;
    if (L.type === "avgpool") return `AvgPool2D`;
    if (L.type === "fc") return `FC → ${L.outC}`;
    return L.type;
  }
  function fmtKSPL(L) {
    if (L.type === "fc") return "—";
    return `k=${L.k} / s=${L.s} / p=${L.p} / d=${L.d}`;
  }

  // Image handling functions
  function handleImageUpload(file) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        currentImage = img;
        originalImageData = {
          width: img.naturalWidth,
          height: img.naturalHeight,
          src: img.src
        };
        
        // Update input fields with actual image dimensions
        inH.value = img.naturalHeight;
        inW.value = img.naturalWidth;
        inC.value = 3; // Assume RGB for now
        
        // Show image preview
        showImagePreview();
        
        // Recompute with new dimensions
        compute();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function showImagePreview() {
    if (!currentImage) return;
    
    imagePreview.innerHTML = `
      <img src="${currentImage.src}" alt="Uploaded Image" class="max-w-full h-auto rounded-lg shadow-sm" style="max-height: 200px;">
    `;
    
    imageInfo.classList.remove('hidden');
    originalSize.textContent = `${originalImageData.width}×${originalImageData.height}×3`;
    currentSize.textContent = `${asIntMin1(inH)}×${asIntMin1(inW)}×${asIntMin1(inC)}`;
  }

  function updateImageVisualization() {
    if (!currentImage) {
      imageVisualization.innerHTML = `
        <div class="bg-slate-100 rounded-lg p-8 border-2 border-dashed border-slate-300">
          <p class="text-slate-500 text-sm">Upload an image and add layers to see visualization</p>
          <p class="text-xs text-slate-400 mt-1">Shows how each layer affects the image dimensions</p>
        </div>
      `;
      return;
    }

    let H = asIntMin1(inH);
    let W = asIntMin1(inW);
    let C = asIntMin1(inC);
    
    let html = '<div class="space-y-4">';
    html += `<div class="text-center">
      <h3 class="font-medium text-sm text-slate-700 mb-2">Input Image</h3>
      <img src="${currentImage.src}" alt="Input" class="inline-block max-w-full h-auto rounded-lg shadow-sm" style="max-height: 150px;">
      <p class="text-xs text-slate-600 mt-1">${H}×${W}×${C}</p>
    </div>`;

    for (let i = 0; i < layers.length; i++) {
      const L = layers[i];
      let note = "";
      
      if (L.type === "conv") {
        const kEff = L.d * (L.k - 1) + 1;
        const Hout = Math.floor((H + 2*L.p - kEff) / L.s) + 1;
        const Wout = Math.floor((W + 2*L.p - kEff) / L.s) + 1;
        if (Hout <= 0 || Wout <= 0) note = "⚠️ Invalid parameters";
        
        H = Hout; W = Wout; C = L.outC;
        
        html += `<div class="text-center">
          <h3 class="font-medium text-sm text-slate-700 mb-2">Layer ${i+1}: Conv2D → ${L.outC}</h3>
          <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p class="text-xs text-slate-600 mb-2">k=${L.k}, s=${L.s}, p=${L.p}, d=${L.d}</p>
            <div class="bg-white rounded p-2 inline-block">
              <div class="text-xs font-mono">${H}×${W}×${C}</div>
            </div>
            ${note ? `<p class="text-red-500 text-xs mt-1">${note}</p>` : ''}
          </div>
        </div>`;
        
      } else if (L.type === "maxpool" || L.type === "avgpool") {
        const kEff = L.d * (L.k - 1) + 1;
        const Hout = Math.floor((H + 2*L.p - kEff) / L.s) + 1;
        const Wout = Math.floor((W + 2*L.p - kEff) / L.s) + 1;
        if (Hout <= 0 || Wout <= 0) note = "⚠️ Invalid parameters";
        
        H = Hout; W = Wout;
        
        html += `<div class="text-center">
          <h3 class="font-medium text-sm text-slate-700 mb-2">Layer ${i+1}: ${L.type === 'maxpool' ? 'MaxPool2D' : 'AvgPool2D'}</h3>
          <div class="bg-green-50 rounded-lg p-4 border border-green-200">
            <p class="text-xs text-slate-600 mb-2">k=${L.k}, s=${L.s}, p=${L.p}, d=${L.d}</p>
            <div class="bg-white rounded p-2 inline-block">
              <div class="text-xs font-mono">${H}×${W}×${C}</div>
            </div>
            ${note ? `<p class="text-red-500 text-xs mt-1">${note}</p>` : ''}
          </div>
        </div>`;
        
      } else if (L.type === "fc") {
        const rfH = H; const rfW = W;
        H = 1; W = 1; C = L.outC;
        
        html += `<div class="text-center">
          <h3 class="font-medium text-sm text-slate-700 mb-2">Layer ${i+1}: FC → ${L.outC}</h3>
          <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <p class="text-xs text-slate-600 mb-2">Flatten ${rfH}×${rfW} → 1×1</p>
            <div class="bg-white rounded p-2 inline-block">
              <div class="text-xs font-mono">${H}×${W}×${C}</div>
            </div>
          </div>
        </div>`;
      }
    }
    
    html += '</div>';
    imageVisualization.innerHTML = html;
  }

  // Event: add layer
  addLayerBtn.onclick = () => {
    const t = layerType.value;
    const layer = {
      type: t,
      k: asIntMin1(k),
      s: asIntMin1(s),
      p: asInt(p),
      d: asIntMin1(d),
      outC: asIntMin1(outC),
    };
    // For Pool, outC unused
    if (t === "maxpool" || t === "avgpool") {
      layer.outC = null;
    }
    // For FC, k/s/p/d irrelevant
    if (t === "fc") {
      layer.k = 1; layer.s = 1; layer.p = 0; layer.d = 1;
    }
    layers.push(layer);
    compute();
  };

  // Event: input image changes trigger recompute
  [inH, inW, inC].forEach(el => el.addEventListener("input", compute));

  // Event: image upload
  imageUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageUpload(file);
    }
  });

  // Clear
  clearBtn.onclick = () => { 
    layers = []; 
    compute(); 
    // Reset image visualization
    if (currentImage) {
      updateImageVisualization();
    }
  };

  // Example net (like quick VGG-ish)
  exampleBtn.onclick = () => {
    layers = [
      { type: "conv", k:3, s:1, p:1, d:1, outC:64 },
      { type: "conv", k:3, s:1, p:1, d:1, outC:64 },
      { type: "maxpool", k:2, s:2, p:0, d:1, outC:null },
      { type: "conv", k:3, s:1, p:1, d:1, outC:128 },
      { type: "conv", k:3, s:1, p:1, d:1, outC:128 },
      { type: "maxpool", k:2, s:2, p:0, d:1, outC:null },
      { type: "fc",   k:1, s:1, p:0, d:1, outC:256 },
      { type: "fc",   k:1, s:1, p:0, d:1, outC:10 },
    ];
    compute();
    // Update image visualization if image is loaded
    if (currentImage) {
      updateImageVisualization();
    }
  };

  // Export/Import JSON
  exportBtn.onclick = () => {
    const payload = {
      input: { H: asIntMin1(inH), W: asIntMin1(inW), C: asIntMin1(inC) },
      layers
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type:"application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cnn_architecture.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  importInput.onchange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result);
        if (obj.input) {
          inH.value = obj.input.H;
          inW.value = obj.input.W;
          inC.value = obj.input.C;
        }
        if (Array.isArray(obj.layers)) {
          layers = obj.layers;
        }
        compute();
      } catch (err) {
        alert("Invalid JSON");
      }
    };
    reader.readAsText(file);
    // reset input
    importInput.value = "";
  };

  // Initial render
  compute();
  updateImageVisualization();
})(); 