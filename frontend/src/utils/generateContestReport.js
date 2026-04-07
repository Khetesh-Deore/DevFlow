import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function formatDate(d) {
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function formatDuration(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatTime(sec) {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function generateContestPDF(reportData) {
  const { contest, problemStats, leaderboard } = reportData;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const PRIMARY = [29, 78, 216];   // blue-700
  const DARK    = [15, 23, 42];    // slate-900
  const GRAY    = [100, 116, 139]; // slate-500
  const GREEN   = [22, 163, 74];
  const RED     = [220, 38, 38];

  const W = doc.internal.pageSize.getWidth();
  let y = 0;

  // ── Header Banner ──────────────────────────────────────────────────────────
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, W, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('DevFlow', 14, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('College Competitive Programming Platform', 14, 20);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Contest Report', W - 14, 13, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${formatDate(new Date())}`, W - 14, 20, { align: 'right' });

  y = 40;

  // ── Contest Info ───────────────────────────────────────────────────────────
  doc.setTextColor(...DARK);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(contest.title, 14, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(`Type: ${contest.type?.toUpperCase()}  |  Duration: ${formatDuration(contest.duration)}  |  Start: ${formatDate(contest.startTime)}  |  End: ${formatDate(contest.endTime)}`, 14, y);
  y += 10;

  // ── Summary Cards ──────────────────────────────────────────────────────────
  const cards = [
    { label: 'Registered', value: contest.totalRegistered },
    { label: 'Participated', value: contest.totalParticipants || leaderboard.filter(r => r.solvedCount > 0 || r.totalPoints > 0).length },
    { label: 'Problems', value: contest.totalProblems },
    { label: 'Top Score', value: leaderboard[0]?.totalPoints || 0 }
  ];

  const cardW = (W - 28 - 9) / 4;
  cards.forEach((c, i) => {
    const x = 14 + i * (cardW + 3);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(x, y, cardW, 18, 2, 2, 'F');
    doc.setTextColor(...PRIMARY);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(String(c.value), x + cardW / 2, y + 9, { align: 'center' });
    doc.setTextColor(...GRAY);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(c.label, x + cardW / 2, y + 15, { align: 'center' });
  });
  y += 26;

  // ── Problem Statistics ─────────────────────────────────────────────────────
  doc.setTextColor(...DARK);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Problem Statistics', 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['#', 'Problem', 'Points', 'Solvers', 'Attempts', 'Solve Rate']],
    body: problemStats.map(p => [
      p.label,
      p.title,
      p.points,
      p.solvers,
      p.attempts,
      p.attempts > 0 ? `${((p.solvers / p.attempts) * 100).toFixed(1)}%` : '0%'
    ]),
    headStyles: { fillColor: PRIMARY, textColor: 255, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: DARK },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' }
    },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 10;

  // ── Leaderboard ────────────────────────────────────────────────────────────
  doc.setTextColor(...DARK);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Final Standings', 14, y);
  y += 4;

  const lbBody = leaderboard.map((row, i) => [
    row.rank,
    row.user?.name || '—',
    row.user?.rollNumber || '—',
    row.user?.branch || '—',
    row.user?.batch || '—',
    row.solvedCount,
    row.totalPoints,
    formatTime(row.totalTimeSec)
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Rank', 'Name', 'Roll No', 'Branch', 'Batch', 'Solved', 'Points', 'Time']],
    body: lbBody,
    headStyles: { fillColor: PRIMARY, textColor: 255, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: DARK },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didDrawCell: (data) => {
      // Highlight top 3
      if (data.section === 'body' && data.column.index === 0) {
        const rank = data.cell.raw;
        if (rank === 1) doc.setTextColor(202, 138, 4);
        else if (rank === 2) doc.setTextColor(107, 114, 128);
        else if (rank === 3) doc.setTextColor(194, 65, 12);
      }
    },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 18, halign: 'center' },
      7: { cellWidth: 18, halign: 'center' }
    },
    margin: { left: 14, right: 14 }
  });

  // ── Footer ─────────────────────────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text(`Page ${i} of ${pageCount}  |  DevFlow Contest Report  |  ${contest.title}`,
      W / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
  }

  doc.save(`${contest.title.replace(/\s+/g, '_')}_Report.pdf`);
}
