/* assets/js/app.js
Modular JS for ERP pages.
Fungsi utama: parsingInput, validateInput, computeBOM, computeForecast, computeJSM, computeSAW,
computeMarketBasket, computeProfileMatching, computeMarkov, renderTable, renderChart, exportCSV.
Semua pesan & instruksi berbahasa Indonesia.
*/
const APP = (function(){
  /* Utility: parse lines CSV-like separated by newline or commas */
  function parsingInput(text){
    // Return array of trimmed non-empty lines
    return text.split(/\r?\n/).map(s=>s.trim()).filter(s=>s.length>0);
  }

  function showError(el, msg){
    const err = el.parentElement.querySelector('.input-error');
    if(err) err.textContent = msg;
    el.classList.add('invalid-input');
  }
  function clearError(el){
    const err = el.parentElement.querySelector('.input-error');
    if(err) err.textContent = '';
    el.classList.remove('invalid-input');
  }

  function validateInput(lines, minCount=1){
    if(!lines || lines.length < minCount) return {ok:false, msg:`Minimal ${minCount} record diperlukan.`};
    return {ok:true};
  }

  function exportCSV(filename, rows){
    const csv = rows.map(r=>r.map(cell=>`"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    a.remove(); URL.revokeObjectURL(url);
  }

  /* Render table */
  function renderTable(container, headers, rows){
    const table = document.createElement('table');
    table.className = 'table table-sm table-bordered';
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr>' + headers.map(h=>`<th>${h}</th>`).join('') + '</tr>';
    const tbody = document.createElement('tbody');
    tbody.innerHTML = rows.map(r=>'<tr>'+ r.map(c=>`<td>${c}</td>`).join('') + '</tr>').join('');
    table.appendChild(thead); table.appendChild(tbody);
    container.innerHTML = ''; container.appendChild(table);
  }

  /* Render chart using Chart.js; chartInstance returned for update */
  function renderChart(ctx, type, labels, datasets, existingChart){
    if(existingChart){
      // if same type, update data and datasets
      try{
        if(existingChart.config && existingChart.config.type === type){
          existingChart.data.labels = labels;
          existingChart.data.datasets = datasets;
          existingChart.update();
          return existingChart;
        }
        // different type -> destroy and recreate
        existingChart.destroy();
      }catch(e){
        try{ existingChart.destroy(); }catch(e){}
      }
    }
    return new Chart(ctx, {type, data:{labels, datasets}, options:{responsive:true}});
  }

  /* Simple number animator */
  function animateNumber(el, to, duration=900){
    if(!el) return;
    const start = 0;
    const startTime = performance.now();
    const target = Number(String(to).replace(/[^0-9\.\-]/g,'')) || 0;
    function step(ts){
      const progress = Math.min(1, (ts - startTime) / duration);
      const value = Math.round(start + (target - start) * progress);
      el.textContent = value.toLocaleString('id-ID');
      if(progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // sample previous-period values (used for trend demo)
  const SAMPLE_PREV = { numTx: 110, users: 30, revenue: 11500000 };

  function computeTrend(current, previous){
    previous = Number(previous) || 0;
    current = Number(current) || 0;
    if(previous === 0){
      if(current === 0) return { dir: 'same', pct: 0 };
      return { dir: 'up', pct: 100 };
    }
    const diff = current - previous;
    const pct = (diff / previous) * 100;
    return { dir: pct > 0 ? 'up' : (pct < 0 ? 'down' : 'same'), pct: Math.abs(pct) };
  }

  function formatCurrency(n){
    try{ return 'Rp ' + Number(n).toLocaleString('id-ID'); }catch(e){ return n; }
  }

  function updateStats(prev){
    prev = prev || SAMPLE_PREV;
    // read current DOM values (fallback to SAMPLE_PREV+delta/demo)
    const elNum = document.getElementById('numTxValue');
    const elNumTrend = document.getElementById('numTxTrend');
    const elUsers = document.getElementById('userCountValue');
    const elUserTrend = document.getElementById('userTrend');
    const elRev = document.getElementById('revenueValue');
    const elRevTrend = document.getElementById('revenueTrend');

    const curNum = elNum ? Number(String(elNum.textContent).replace(/[^0-9\-]/g,'')) || 0 : 0;
    const curUsers = elUsers ? Number(String(elUsers.textContent).replace(/[^0-9\-]/g,'')) || 0 : 0;
    const curRev = elRev ? Number(String(elRev.textContent).replace(/[^0-9\-]/g,'')) || 0 : 0;

    const tNum = computeTrend(curNum, prev.numTx);
    const tUsers = computeTrend(curUsers, prev.users);
    const tRev = computeTrend(curRev, prev.revenue);

    if(elNumTrend){
      elNumTrend.className = tNum.dir === 'up' ? 'trend-up' : (tNum.dir === 'down' ? 'trend-down' : '');
      var arrow = (tNum.dir === 'up' ? '<i class="bi bi-arrow-up-short"></i>' : (tNum.dir === 'down' ? '<i class="bi bi-arrow-down-short"></i>' : ''));
      elNumTrend.innerHTML = arrow + ' ' + tNum.pct.toFixed(0) + '% dari bulan lalu';
    }
    if(elUserTrend){
      elUserTrend.className = tUsers.dir === 'up' ? 'trend-up' : (tUsers.dir === 'down' ? 'trend-down' : '');
      elUserTrend.innerHTML = (tUsers.dir === 'up' ? '<i class="bi bi-arrow-up-short"></i>' : (tUsers.dir === 'down' ? '<i class="bi bi-arrow-down-short"></i>' : '')) + ' ' + tUsers.pct.toFixed(0) + '% dari bulan lalu';
    }
    if(elRevTrend){
      elRevTrend.className = tRev.dir === 'up' ? 'trend-up' : (tRev.dir === 'down' ? 'trend-down' : '');
      elRevTrend.innerHTML = (tRev.dir === 'up' ? '<i class="bi bi-arrow-up-short"></i>' : (tRev.dir === 'down' ? '<i class="bi bi-arrow-down-short"></i>' : '')) + ' ' + tRev.pct.toFixed(0) + '% dari bulan lalu';
    }
  }

  /* -- Compute BOM --
    Input format per line: ProdukX, Komp1:2, Komp2:3
    Optional per-line product quantity: ProdukX, qty:10, Komp1:2
    Or pass `extraQtyLine` as comma-separated product:qty pairs, e.g. "ProdukA:10,ProdukB:5"
  */
  function computeBOM(lines, extraQtyLine){
    // parse extra qty map if provided
    const qtyMap = {};
    if(extraQtyLine && typeof extraQtyLine === 'string' && extraQtyLine.trim()){
      extraQtyLine.split(',').map(s=>s.trim()).filter(Boolean).forEach(pair=>{
        const m = pair.split(':').map(x=>x.trim());
        if(m[0]) qtyMap[m[0]] = Number(m[1]) || 0;
      });
    }

    // parse into product -> list of [component, qtyPerUnit], and productQty
    const products = [];
    for(const line of lines){
      const parts = line.split(',').map(p=>p.trim()).filter(p=>p);
      if(parts.length<2) continue;
      const productName = parts[0];
      let productQty = 0;
      const comps = [];
      for(let i=1;i<parts.length;i++){
        const seg = parts[i];
        const m = seg.split(':').map(x=>x.trim());
        const key = m[0];
        const val = m[1];
        if(key.toLowerCase() === 'qty' || key.toLowerCase() === 'jumlah'){
          productQty = Number(val) || 0;
        } else {
          const qtyPerUnit = parseFloat(val||'1');
          comps.push([key, qtyPerUnit]);
        }
      }
      // override with extraQtyLine if specified for this product
      if((!productQty || productQty===0) && qtyMap[productName]) productQty = qtyMap[productName];
      // default productQty to 1 if none provided
      if(!productQty) productQty = 1;
      products.push({product: productName, qty: productQty, comps});
    }

    // compute aggregate component totals = sum(prodQty * qtyPerUnit)
    const totals = {};
    for(const p of products){
      for(const [c,qPerUnit] of p.comps){
        const need = p.qty * (Number(qPerUnit)||0);
        totals[c] = (totals[c]||0) + need;
      }
    }

    const steps = [
      'Parsing input menjadi daftar produk, kuantitas produk, dan komponen per unit.',
      'Menghitung total kebutuhan setiap komponen = kuantitas produk * komponen per unit.'
    ];

    const tableRows = Object.entries(totals).map(([c,q])=> [c, Number(q)]);
    // include product breakdown for step details
    const prodRows = products.map(p=> [p.product, p.qty, p.comps.map(x=>x.join(':')).join(', ')]);

    return {steps, tableHeaders:['Komponen','Total Qty'], tableRows, products: prodRows};
  }

  /* -- Forecasting: simple moving average (window=3), with multi-step forecast -- */
  function computeForecast(series, window=3, future=3){
    const nums = series.map(s=>Number(s)).filter(v=>!isNaN(v));
    const n = nums.length;
    const steps = [];
    if(n < window) return {error:'Data kurang untuk window yang dipilih.'};

    // In-sample forecasts aligned to actuals (t >= window)
    const tableRows = [];
    for(let i=0;i<n;i++){
      let f = '';
      if(i >= window){
        const arr = nums.slice(i-window, i);
        f = (arr.reduce((a,b)=>a+b,0)/window).toFixed(2);
      }
      tableRows.push([i+1, nums[i].toFixed(2), f]);
    }

    // Future forecasts (iterative using last values inc. forecasts)
    const extended = nums.slice();
    const nextVals = [];
    for(let h=1; h<=future; h++){
      const lastWindow = extended.slice(extended.length - window);
      const f = lastWindow.reduce((a,b)=>a+b,0)/window;
      nextVals.push(f);
      extended.push(f);
      tableRows.push([n+h, '-', f.toFixed(2)]);
    }

    // brief steps
    steps.push(`Gunakan Moving Average ${window} untuk menghitung forecast in-sample t>=${window+1}.`);
    steps.push(`Prediksi ${future} periode ke depan dihitung iteratif dari ${window} nilai terakhir.`);

    return {
      steps,
      tableHeaders:['Periode','Aktual','Forecast'],
      tableRows,
      next: nextVals.map(v=>v.toFixed(2))
    };
  }

  /* -- JSM heuristics: FCFS, SPT, EDD.
     Input format lines: AlternatifX, time, due(optional)
  */
  function computeJSM(lines){
    const data = [];
    for(const [i,line] of lines.entries()){
      const parts = line.split(',').map(p=>p.trim());
      if(parts.length<2) continue;
      data.push({name:parts[0], time:Number(parts[1])||0, due: parts[2]? new Date(parts[2].trim()):null});
    }
    const steps = [];
    // FCFS (as-is)
    steps.push('FCFS: urutan sesuai input.');
    const fcfsOrder = data.map(d=>({name:d.name, time:d.time, due:d.due}));
    // SPT: sort by time ascending
    steps.push('SPT: urutkan berdasarkan waktu proses (terpendek dulu).');
    const sptOrder = [...data].sort((a,b)=>a.time-b.time).map(d=>({name:d.name, time:d.time, due:d.due}));
    // EDD: sort by due date if available else keep original order
    steps.push('EDD: urutkan berdasarkan due date (tanggal jatuh tempo).');
    const eddOrder = [...data].sort((a,b)=>{
      if(!a.due && !b.due) return 0;
      if(!a.due) return 1;
      if(!b.due) return -1;
      return a.due - b.due;
    }).map(d=>({name:d.name, time:d.time, due:d.due}));

    // helper to compute schedule metrics assuming all arrivals = 0
    function scheduleMetrics(order){
      const rows = [];
      let currentTime = 0;
      for(let i=0;i<order.length;i++){
        const j = order[i];
        const start = currentTime;
        const completion = start + (Number(j.time)||0);
        const waiting = start; // arrival=0
        const turnaround = completion; // arrival=0
        const dueStr = j.due ? j.due.toISOString().split('T')[0] : '-';
        let lateness = '-';
        if(j.due){
          // assume due as date -> compare days between completion (as numeric) and due date
          // here completion is time units, not datetime; we can't compute real lateness in days
          lateness = '-';
        }
        rows.push([i+1, j.name, j.time, start, completion, waiting, turnaround, dueStr, lateness]);
        currentTime = completion;
      }
      return rows;
    }

    const fcfs = scheduleMetrics(fcfsOrder);
    const spt = scheduleMetrics(sptOrder);
    const edd = scheduleMetrics(eddOrder);

    const headers = ['#','Alternatif','ProcTime','Start','Completion','Waiting','Turnaround','Due','Lateness'];
    return {steps, tableHeaders:headers, fcfs, spt, edd};
  }

  /* -- SAW (Simple Additive Weighting) --
    Input lines: Alternatif, c1, c2, c3...
    Bobot: comma separated weights
  */
  function computeSAW(lines, weightLine){
    const weights = weightLine.split(',').map(w=>Number(w.trim()));
    const data = [];
    for(const line of lines){
      const parts = line.split(',').map(p=>p.trim());
      const name = parts[0];
      const nums = parts.slice(1).map(x=>Number(x));
      data.push({name, nums});
    }
    // normalize each criterion (benefit assumed)
    const m = data.length, n = data[0].nums.length;
    const colMax = [];
    for(let j=0;j<n;j++){
      colMax[j] = Math.max(...data.map(r=>r.nums[j]));
    }
    const scores = data.map(r=>{
      const norm = r.nums.map((v,j)=> v / (colMax[j]||1));
      const score = norm.reduce((s,x,j)=> s + x * (weights[j]||0), 0);
      return {name:r.name, score};
    }).sort((a,b)=>b.score-a.score);
    const steps = ['Normalisasi tiap kriteria terhadap max kolom.','Mengalikan dengan bobot lalu menjumlahkan.'];
    return {steps, tableHeaders:['Alternatif','Score'], rows: scores.map(s=>[s.name, s.score.toFixed(4)])};
  }

  /* -- Market Basket: simple frequent item pairs (Apriori-lite) --
      Input: each line is a transaction: item,item,...
  */
  function computeMarketBasket(lines){
    const tx = lines.map(l=> l.split(',').map(i=>i.trim()).filter(Boolean));
    const counts = {};
    for(const t of tx){
      const unique = Array.from(new Set(t));
      for(let i=0;i<unique.length;i++){
        for(let j=i+1;j<unique.length;j++){
          const key = [unique[i], unique[j]].sort().join('|');
          counts[key] = (counts[key]||0) + 1;
        }
      }
    }
    const rows = Object.entries(counts).map(([k,v])=> [k.replace('|',', '), v]).sort((a,b)=>b[1]-a[1]);
    const steps = ['Menghitung frekuensi pasangan item (pair) dari tiap transaksi.'];
    return {steps, tableHeaders:['Pair Item','Frekuensi'], rows};
  }

  /* -- Profile Matching --
    Input: Ideal, s1,s2,... and candidates
    Format:
    Ideal,5,5,5
    Budi,4,5,3
  */
  function computeProfileMatching(lines){
    const parsed = lines.map(l=> l.split(',').map(p=>p.trim()));
    const ideal = parsed[0].slice(1).map(Number);
    const results = [];
    for(let i=1;i<parsed.length;i++){
      const row = parsed[i];
      const name = row[0];
      const scores = row.slice(1).map(Number);
      // Gap and weight mapping simple: gap = ideal - actual; but we'll compute similarity as inverse of abs diff
      const similarity = scores.map((s,j)=> 1 - (Math.abs(ideal[j] - s) / (Math.max(ideal[j],1))));
      const total = similarity.reduce((a,b)=>a+b,0)/similarity.length;
      results.push([name, total.toFixed(4)]);
    }
    const steps = ['Menghitung kesamaan tiap atribut terhadap ideal, kemudian merata-ratakan.'];
    return {steps, tableHeaders:['Nama','Similarity'], rows:results.sort((a,b)=>b[1]-a[1])};
  }

  /* -- Markov chain simple transition matrix --
    Input: sequence like: A,B,A,C,B,A
  */
  function computeMarkov(lines){
    const seq = lines.join(',').split(',').map(s=>s.trim()).filter(Boolean);
    const states = Array.from(new Set(seq));
    const idx = {}; states.forEach((s,i)=> idx[s]=i);
    const mat = Array.from({length:states.length}, ()=> Array(states.length).fill(0));
    for(let i=0;i<seq.length-1;i++){
      const a = idx[seq[i]], b = idx[seq[i+1]];
      mat[a][b] += 1;
    }
    // normalize rows
    const prob = mat.map(row=>{
      const s = row.reduce((a,b)=>a+b,0);
      return s ? row.map(v=> (v/s).toFixed(3)) : row.map(()=> '0.000');
    });
    const steps = ['Membangun matriks transisi dan menormalisasi setiap baris ke probabilitas.'];
    const rows = states.map((st,i)=> [st, ...prob[i]]);
    const headers = ['State', ...states.map(s=>'->'+s)];
    return {steps, tableHeaders:headers, rows};
  }

  return {
    parsingInput, validateInput, computeBOM, computeForecast, computeJSM, computeSAW,
    computeMarketBasket, computeProfileMatching, computeMarkov, renderTable, renderChart, exportCSV, showError, clearError
    , animateNumber, updateStats
  };
})();

// auto-animate summary number if present
document.addEventListener('DOMContentLoaded', function(){
  try{
    const el = document.getElementById('numTxValue');
    if(el){
      const n = Number(String(el.textContent).replace(/[^0-9]/g,'')) || 0;
      APP.animateNumber(el, n, 900);
    }
  }catch(e){ }
});
