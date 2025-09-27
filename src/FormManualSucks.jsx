import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const FormManualSucks = () => {
  const [nama, setNama] = useState("");
  const [npp, setNpp] = useState("");
  const lokasi = "Jakarta Barat";
  const [range, setRange] = useState({ start: "", end: "" });
  const [records, setRecords] = useState([]);
  const [currentDate, setCurrentDate] = useState(null);
  const [form, setForm] = useState({ datang: "", pulang: "" });
  const [showModal, setShowModal] = useState(false);
  const [signature, setSignature] = useState(null);

  const parseDateInput = (dateString) => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleGenerate = () => {
    if (!range.start || !range.end) return;
    const start = parseDateInput(range.start);
    const end = parseDateInput(range.end);
    if (start > end) return alert("Tanggal mulai harus <= tanggal akhir");
    setCurrentDate(start);
    setRecords([]);
    setForm({ datang: "", pulang: "" });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.datang || !form.pulang)
      return alert("Isi jam datang dan pulang dulu!");
    if (form.datang > form.pulang)
      return alert("Jam datang tidak boleh lebih besar dari jam pulang!");
    const newRecord = {
      tgl: new Date(currentDate),
      datang: form.datang,
      pulang: form.pulang,
      paraf: signature,
    };
    setRecords([...records, newRecord]);
    moveNextDay();
  };

  const handleLibur = () => {
    const newRecord = {
      tgl: new Date(currentDate),
      datang: "-",
      pulang: "-",
      paraf: signature,
    };
    setRecords([...records, newRecord]);
    moveNextDay();
  };

  const moveNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    const end = parseDateInput(range.end);
    if (next <= end) {
      setCurrentDate(next);
      setForm({ datang: "", pulang: "" });
      setShowModal(true);
    } else {
      setCurrentDate(null);
      setShowModal(false);
    }
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignature(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExport = () => {
    if (!nama || !npp) return alert("Isi Nama dan NPP dulu!");

    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.setFont("", "bold");
    doc.text("ABSENSI ISTE ODP 326", 105, 32, {
      align: "center",
      fontWeight: "bold",
    });
    doc.setFont("", "normal");
    doc.setFont("", "");
    doc.setFontSize(10);
    doc.text(`Nama                                      : ${nama}`, 14, 52);
    doc.text(`NPP                                        : ${npp}`, 14, 58);
    doc.text(`Lokasi ISTE                           : ${lokasi}`, 14, 64);

    doc.setFontSize(9);
    doc.text("ODP 326 Information Technology", 14, 72);

    const tableData = records.map((rec, idx) => [
      idx + 1,
      formatDate(rec.tgl),
      rec.datang,
      rec.pulang,
      rec.paraf ? "signed" : "",
      "",
    ]);

    autoTable(doc, {
      startY: 78,
      head: [
        [
          "No",
          "Hari/Tanggal",
          "Jam\nKedatangan",
          "Jam\nPulang",
          "Paraf",
          "Paraf Atasan",
        ],
      ],
      body: tableData,
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 50 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 40 },
        5: { cellWidth: 40 },
      },
      headStyles: {
        fontSize: 8,
        halign: "center",
        valign: "middle",
        lineWidth: 0.2,
        lineColor: [0, 0, 0],
        fillColor: false,
        textColor: [0, 0, 0],
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 3,
        minCellHeight: 20,
        halign: "center",
        valign: "middle",
        lineWidth: 0.2,
        lineColor: [0, 0, 0],
      },
      styles: {
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
      },
      didDrawCell: (data) => {
        if (data.column.index === 4 && data.cell.section === "body") {
          const record = records[data.row.index];
          if (record.paraf) {
            const imgW = data.cell.width - 6;
            const imgH = data.cell.height - 6;
            const x = data.cell.x + (data.cell.width - imgW) / 2;
            const y = data.cell.y + (data.cell.height - imgH) / 2;

            doc.addImage(record.paraf, "PNG", x, y, imgW, imgH);
          }
        }
      },
    });

    doc.save(`Absensi ISTE - ${nama}_${npp}`);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto font-sans">
      <h1 className="text-center text-3xl font-extrabold mb-8 text-blue-700">
        ABSENSI ODP
      </h1>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div>
          <label className="block mb-1 font-medium">Nama:</label>
          <input
            type="text"
            value={nama}
            placeholder="input nama"
            onChange={(e) => setNama(e.target.value)}
            className="w-full border p-2 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">NPP:</label>
          <input
            type="text"
            value={npp}
            placeholder="input npp"
            onChange={(e) => setNpp(e.target.value)}
            className="w-full border p-2 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Lokasi:</label>
          <input
            type="text"
            value={lokasi}
            disabled
            className="w-full border p-2 rounded-lg bg-gray-100 text-gray-600"
          />
        </div>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-4">
        <div>
          <label className="mr-2 block font-medium">Tanggal Mulai:</label>
          <input
            type="date"
            value={range.start}
            onChange={(e) => setRange({ ...range, start: e.target.value })}
            className="border p-2 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mr-2 block font-medium">Tanggal Akhir:</label>
          <input
            type="date"
            value={range.end}
            onChange={(e) => setRange({ ...range, end: e.target.value })}
            className="border p-2 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className=" mr-2 block font-medium">Add Signature:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleSignatureUpload}
            className="bg-red-100 p-1"
          />
        </div>

        <button
          onClick={handleGenerate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-md transition w-full sm:w-auto flex flex-1 justify-center"
        >
          Generate
        </button>
      </div>

      {records.length === 0 && !currentDate && (
        <p className="text-center text-gray-500">Belum ada data</p>
      )}

      {records.length > 0 && (
        <div className="overflow-x-auto mb-8">
          <table className="w-full border-collapse border rounded-lg shadow-sm text-sm sm:text-base">
            <thead>
              <tr className="bg-gradient-to-r from-blue-500 to-blue-700 text-white">
                <th className="border px-3 py-3 min-h-[40px]">No</th>
                <th className="border px-3 py-3 min-h-[40px]">Hari/Tanggal</th>
                <th className="border px-3 py-3 min-h-[40px]">
                  Jam Kedatangan
                </th>
                <th className="border px-3 py-3 min-h-[40px]">Jam Pulang</th>
                <th className="border px-3 py-3 min-h-[40px]">Paraf</th>
                <th className="border px-3 py-3 min-h-[40px]">Paraf Atasan</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec, idx) => (
                <tr
                  key={idx}
                  className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}
                >
                  <td className="border px-3 py-3 text-center">{idx + 1}</td>
                  <td className="border px-3 py-3">{formatDate(rec.tgl)}</td>
                  <td className="border px-3 py-3 text-center">{rec.datang}</td>
                  <td className="border px-3 py-3 text-center">{rec.pulang}</td>
                  <td className="border px-3 py-3 text-center">
                    {rec.paraf && (
                      <img
                        src={rec.paraf}
                        alt="signature"
                        className="mx-auto h-10 w-20 object-contain"
                      />
                    )}
                  </td>
                  <td className="border px-3 py-3"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {records.length > 0 && (
        <button
          onClick={handleExport}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg shadow-lg block mx-auto transition"
        >
          Export PDF
        </button>
      )}

      {showModal && currentDate && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 text-center text-blue-700">
              {formatDate(currentDate)}
            </h2>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Jam Datang:</label>
              <input
                type="time"
                value={form.datang}
                onChange={(e) => setForm({ ...form, datang: e.target.value })}
                className="border p-2 rounded-lg w-full shadow-sm focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Jam Pulang:</label>
              <input
                type="time"
                value={form.pulang}
                onChange={(e) => setForm({ ...form, pulang: e.target.value })}
                className="border p-2 rounded-lg w-full shadow-sm focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex flex-wrap gap-3 justify-between">
              <button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg shadow-md transition flex-1"
              >
                Simpan
              </button>
              <button
                onClick={handleLibur}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-lg shadow-md transition flex-1"
              >
                Libur
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-400 hover:bg-gray-500 text-white px-5 py-2 rounded-lg shadow-md transition flex-1"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormManualSucks;
