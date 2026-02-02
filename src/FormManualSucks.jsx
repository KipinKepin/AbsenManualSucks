import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.min";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url,
).toString();

const MONTH_MAP = {
  Januari: 0,
  Februari: 1,
  Maret: 2,
  April: 3,
  Mei: 4,
  Juni: 5,
  Juli: 6,
  Agustus: 7,
  September: 8,
  Oktober: 9,
  November: 10,
  Desember: 11,
};

const parseIndoDate = (str) => {
  const [d, m, y] = str.split(" ");
  return new Date(y, MONTH_MAP[m], d);
};

const FormManualSucks = () => {
  const [nama, setNama] = useState("");
  const [npp, setNpp] = useState("");
  const [lokasi, setLokasi] = useState("");

  const [records, setRecords] = useState([]);
  const [signature, setSignature] = useState(null);
  const [mentorSignature, setMentorSignature] = useState(null);

  const loadPdfItems = async (file) => {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

    let items = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      content.items.forEach((it) => {
        items.push({
          text: it.str.trim(),
          x: it.transform[4],
          y: it.transform[5],
        });
      });
    }

    return items;
  };

  const parseAttendanceByColumn = (items) => {
    const COL = {
      tanggal: [40, 220],
      datang: [300, 360],
      pulang: [380, 460],
      workTime: [470, 550],
    };

    const rowsMap = {};

    items.forEach((it) => {
      const y = Math.round(it.y);
      if (!rowsMap[y]) rowsMap[y] = [];
      rowsMap[y].push(it);
    });

    const rows = [];

    Object.values(rowsMap).forEach((row) => {
      let tanggal = null;
      let datang = "";
      let pulang = "";
      let workTime = "";

      row.forEach(({ text, x }) => {
        if (
          x >= COL.tanggal[0] &&
          x <= COL.tanggal[1] &&
          /\d{1,2} \w+ \d{4}/.test(text)
        ) {
          tanggal = parseIndoDate(text);
        }

        if (
          x >= COL.datang[0] &&
          x <= COL.datang[1] &&
          /^\d{2}:\d{2}/.test(text)
        ) {
          datang = text.slice(0, 5);
        }

        if (
          x >= COL.pulang[0] &&
          x <= COL.pulang[1] &&
          /^\d{2}:\d{2}/.test(text)
        ) {
          pulang = text.slice(0, 5);
        }

        if (x >= COL.workTime[0] && x <= COL.workTime[1]) {
          workTime = text.trim();
        }
      });

      if (!tanggal) return;

      const day = tanggal.getDay();
      const isWeekend = day === 0 || day === 6;
      const isLibur = workTime === "-";

      const hasCheckin = datang && datang !== "-";
      const hasCheckout = pulang && pulang !== "-";

      if (isWeekend) {
        if (!hasCheckin && !hasCheckout) {
          return;
        }

        if (!hasCheckin) datang = "08:00";
        if (!hasCheckout) pulang = "18:00";

        rows.push({ tgl: tanggal, datang, pulang });
        return;
      }

      if (isLibur) {
        rows.push({ tgl: tanggal, datang: "-", pulang: "-" });
        return;
      }

      if (!hasCheckin) datang = "08:00";
      if (!hasCheckout) pulang = "18:00";

      rows.push({ tgl: tanggal, datang, pulang });
    });

    return rows.sort((a, b) => a.tgl - b.tgl);
  };

  const handleUploadPDF = async (e) => {
    const files = Array.from(e.target.files);
    let merged = [];

    for (const file of files) {
      const items = await loadPdfItems(file);
      merged.push(...parseAttendanceByColumn(items));
    }

    setRecords(merged);
  };

  const readImage = (file, setter) => {
    const reader = new FileReader();
    reader.onload = () => setter(reader.result);
    reader.readAsDataURL(file);
  };

  const formatDate = (date) =>
    date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const drawImageCentered = (doc, img, cell) => {
    const props = doc.getImageProperties(img);

    const padding = 3;

    const maxW = cell.width - padding * 2;
    const maxH = cell.height - padding * 2;

    const ratio = Math.min(maxW / props.width, maxH / props.height);

    const w = props.width * ratio;
    const h = props.height * ratio;

    const x = cell.x + (cell.width - w) / 2;
    const y = cell.y + (cell.height - h) / 2;

    doc.addImage(img, "PNG", x, y, w, h);
  };

  const handleExport = () => {
    if (!nama || !npp || !lokasi) return alert("Lengkapi data");

    const doc = new jsPDF();

    doc.setFontSize(12);
    doc.text("ABSENSI ISTE ODP 326", 105, 25, { align: "center" });

    doc.setFontSize(10);
    const lx = 14,
      cx = 40,
      vx = 44;

    doc.text("Nama", lx, 40);
    doc.text(":", cx, 40);
    doc.text(nama, vx, 40);
    doc.text("NPP", lx, 46);
    doc.text(":", cx, 46);
    doc.text(npp, vx, 46);
    doc.text("Lokasi", lx, 52);
    doc.text(":", cx, 52);
    doc.text(lokasi, vx, 52);

    autoTable(doc, {
      startY: 60,

      pageBreak: "auto",
      rowPageBreak: "avoid",

      styles: {
        minCellHeight: 22,
        valign: "middle",
        lineWidth: 0.2,
        lineColor: [0, 0, 0],
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
      },

      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        cellWidth: "wrap",
        halign: "center",
        valign: "middle",
      },

      alternateRowStyles: {
        fillColor: [255, 255, 255],
      },

      columnStyles: {
        0: { cellWidth: 10, halign: "center", valign: "middle" },
        1: { cellWidth: 55, valign: "middle" },
        2: { cellWidth: 35, halign: "center", valign: "middle" },
        3: { cellWidth: 35, halign: "center", valign: "middle" },
        4: { cellWidth: 30 },
        5: { cellWidth: 30 },
      },

      head: [
        [
          "No",
          "Hari / Tanggal",
          "Jam Datang",
          "Jam Pulang",
          "TTD Peserta",
          "TTD Mentor",
        ],
      ],

      body: records.map((r, i) => [
        i + 1,
        formatDate(r.tgl),
        r.datang,
        r.pulang,
        "",
        "",
      ]),

      didDrawCell: (data) => {
        if (data.section !== "body") return;

        if (data.column.index === 4 && signature) {
          drawImageCentered(doc, signature, data.cell);
        }

        if (data.column.index === 5 && mentorSignature) {
          drawImageCentered(doc, mentorSignature, data.cell);
        }
      },

      didDrawPage: () => {
        const h = doc.internal.pageSize.height;
        doc.setFillColor(255, 255, 255);
        doc.rect(0, h - 2, 210, 2, "F");
      },
    });

    doc.save(`Absensi_${nama}_${npp}.pdf`);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto max-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-center">
        ABSENSI ODP (AUTO PDF)
      </h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <input
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="Nama"
          className="border p-2 rounded"
        />
        <input
          value={npp}
          onChange={(e) => setNpp(e.target.value)}
          placeholder="NPP"
          className="border p-2 rounded"
        />
        <input
          value={lokasi}
          onChange={(e) => setLokasi(e.target.value)}
          placeholder="Lokasi"
          className="border p-2 rounded"
        />
      </div>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <label className="block text-sm font-semibold mb-1">
            📄 PDF Absensi IHCS
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Upload satu atau beberapa file PDF absensi
          </p>
          <input
            type="file"
            multiple
            accept="application/pdf"
            onChange={handleUploadPDF}
            className="block w-full text-sm
        file:mr-3 file:py-2 file:px-4
        file:rounded-md file:border-0
        file:bg-blue-600 file:text-white
        hover:file:bg-blue-700
        cursor-pointer"
          />
        </div>

        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <label className="block text-sm font-semibold mb-1">
            ✍️ Tanda Tangan Peserta
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Digunakan pada kolom <b>TTD Peserta</b>
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => readImage(e.target.files[0], setSignature)}
            className="block w-full text-sm
        file:mr-3 file:py-2 file:px-4
        file:rounded-md file:border-0
        file:bg-gray-700 file:text-white
        hover:file:bg-gray-800
        cursor-pointer"
          />
          {signature && (
            <img
              src={signature}
              alt="Preview TTD Peserta"
              className="mt-3 h-12 object-contain border rounded p-1 mx-auto"
            />
          )}
        </div>

        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <label className="block text-sm font-semibold mb-1">
            🧑‍🏫 Tanda Tangan Mentor
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Digunakan pada kolom <b>TTD Mentor</b>
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => readImage(e.target.files[0], setMentorSignature)}
            className="block w-full text-sm
        file:mr-3 file:py-2 file:px-4
        file:rounded-md file:border-0
        file:bg-gray-700 file:text-white
        hover:file:bg-gray-800
        cursor-pointer"
          />
          {mentorSignature && (
            <img
              src={mentorSignature}
              alt="Preview TTD Mentor"
              className="mt-3 h-12 object-contain border rounded p-1 mx-auto"
            />
          )}
        </div>
      </div>

      {records.length > 0 && (
        <>
          <div className="max-h-[380px] overflow-y-auto border rounded mb-6">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 bg-white z-10">
                <tr>
                  <th className="border p-2">No</th>
                  <th className="border p-2">Tanggal</th>
                  <th className="border p-2">Datang</th>
                  <th className="border p-2">Pulang</th>
                  <th className="border p-2">TTD Peserta</th>
                  <th className="border p-2">TTD Mentor</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={i}>
                    <td className="border p-2 text-center">{i + 1}</td>
                    <td className="border p-2">{formatDate(r.tgl)}</td>
                    <td className="border p-2 text-center">{r.datang}</td>
                    <td className="border p-2 text-center">{r.pulang}</td>
                    <td className="border p-2 text-center">
                      {signature && (
                        <img src={signature} className="h-8 mx-auto" />
                      )}
                    </td>
                    <td className="border p-2 text-center">
                      {mentorSignature && (
                        <img src={mentorSignature} className="h-8 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleExport}
              className="bg-blue-600 text-white px-6 py-2 rounded cursor-pointer hover:bg-blue-700 active:scale-95 transition"
            >
              Export PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default FormManualSucks;
