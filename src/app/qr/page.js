"use client";

import { QRCodeCanvas } from "qrcode.react";

export default function QRPage() {
  return (
    <div>
      <h2>Scan to Join</h2>

      <QRCodeCanvas value="http://localhost:3000/join?class=demo" />
    </div>
  );
}