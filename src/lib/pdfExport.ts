import { HSKWord } from '@/types/hsk';

/**
 * Creates and triggers a print-to-PDF study sheet containing all Hanzi, Pinyin,
 * and English meanings for the selected HSK level.
 */
export function exportVocabularyToPDF(level: number, words: HSKWord[]) {
  const levelWords = words.filter((w) => w.level === level);
  const wordsToPrint = levelWords.length > 0 ? levelWords : words;

  const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>Suji 速记 - HSK ${level} Vocabulary Sheet</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 10mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      color: #18181b;
      margin: 0;
      padding: 16px;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .no-print-bar {
      position: sticky;
      top: 0;
      background: #18181b;
      color: #ffffff;
      padding: 12px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-radius: 12px;
      margin-bottom: 20px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      z-index: 9999;
      font-size: 13px;
    }
    .btn-print {
      background: #e11d48;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-close {
      background: #27272a;
      color: #d4d4d8;
      border: 1px solid #3f3f46;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
    }
    .sheet-header {
      border-bottom: 2.5px solid #dc2626;
      padding-bottom: 10px;
      margin-bottom: 14px;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
    }
    .sheet-title {
      font-size: 22px;
      font-weight: 900;
      color: #09090b;
      letter-spacing: -0.5px;
    }
    .sheet-subtitle {
      font-size: 12px;
      color: #71717a;
      margin-top: 3px;
    }
    .sheet-badge {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      font-weight: 800;
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    thead {
      display: table-header-group;
    }
    th {
      background: #f4f4f5;
      color: #27272a;
      text-align: left;
      padding: 7px 10px;
      border: 1px solid #d4d4d8;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    td {
      padding: 5px 10px;
      border: 1px solid #e4e4e7;
      vertical-align: middle;
    }
    tr {
      page-break-inside: avoid;
    }
    tr:nth-child(even) {
      background: #fafafa;
    }
    .col-idx {
      width: 36px;
      text-align: center;
      color: #a1a1aa;
      font-size: 10px;
      font-weight: 600;
    }
    .col-hanzi {
      width: 85px;
      font-family: "Songti SC", "SimSun", "STSong", "Noto Serif CJK SC", serif;
      font-size: 18px;
      font-weight: 700;
      color: #09090b;
    }
    .col-pinyin {
      width: 110px;
      color: #b91c1c;
      font-weight: 600;
      font-size: 12px;
    }
    .col-meaning {
      color: #27272a;
      line-height: 1.35;
      font-size: 11px;
    }
    .col-check {
      width: 36px;
      text-align: center;
    }
    .checkbox-box {
      display: inline-block;
      width: 13px;
      height: 13px;
      border: 1.5px solid #a1a1aa;
      border-radius: 3px;
    }
    .sheet-footer {
      margin-top: 16px;
      font-size: 10px;
      color: #a1a1aa;
      text-align: center;
      border-top: 1px solid #e4e4e7;
      padding-top: 8px;
    }
    @media print {
      .no-print-bar {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <strong>HSK ${level} Vocabulary Sheet Ready</strong>
      <span style="margin-left: 8px; opacity: 0.7;">(${wordsToPrint.length} words loaded) • Choose &quot;Save as PDF&quot; in the dialog</span>
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn-print" onclick="window.print()">
        <span>🖨️ Print / Save PDF</span>
      </button>
      <button class="btn-close" onclick="window.close()">Close</button>
    </div>
  </div>

  <div class="sheet-header">
    <div>
      <div class="sheet-title">Suji 速记 — HSK ${level} Vocabulary Sheet</div>
      <div class="sheet-subtitle">Complete vocabulary list with Hanzi, Pinyin & Meanings • ${wordsToPrint.length} Words</div>
    </div>
    <div class="sheet-badge">HSK Level ${level}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="col-idx">#</th>
        <th class="col-hanzi">Hanzi (汉字)</th>
        <th class="col-pinyin">Pinyin (拼音)</th>
        <th class="col-meaning">Meaning (释义)</th>
        <th class="col-check">✓</th>
      </tr>
    </thead>
    <tbody>
      ${wordsToPrint
        .map(
          (w, idx) => `
        <tr>
          <td class="col-idx">${idx + 1}</td>
          <td class="col-hanzi">${w.hanzi}</td>
          <td class="col-pinyin">${w.pinyin}</td>
          <td class="col-meaning">${w.translations.join('; ')}</td>
          <td class="col-check"><span class="checkbox-box"></span></td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div class="sheet-footer">
    Generated with Suji 速记 Mandarin Learning Platform • Master HSK 1–6 with Spaced Repetition
  </div>
</body>
</html>`;

  // Try opening a new window to render and print
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  } else {
    // If popup was blocked by browser, fallback to hidden iframe print
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 3000);
      }, 500);
    }
  }
}
