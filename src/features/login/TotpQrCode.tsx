'use client';

import { useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import styles from './login.module.css';

// ISO/IEC 18004 QR Code Version 1..10 (EC Level L): [totalCodewords, ecCodewordsPerBlock, numBlocks]
const VERSION_TABLE: ReadonlyArray<readonly [number, number, number]> = [
  [0, 0, 0],
  [26, 7, 1], // V1: 17 bytes
  [44, 10, 1], // V2: 32 bytes
  [70, 15, 1], // V3: 53 bytes
  [100, 20, 1], // V4: 78 bytes
  [134, 26, 1], // V5: 106 bytes
  [172, 18, 2], // V6: 134 bytes
  [196, 20, 2], // V7: 154 bytes
  [242, 24, 2], // V8: 192 bytes
  [292, 30, 2], // V9: 230 bytes
  [346, 18, 4], // V10: 271 bytes
];

const ALIGNMENT_POS: ReadonlyArray<readonly number[]> = [
  [],
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
];

function gfMul(a: number, b: number): number {
  let res = 0;
  let x = a;
  let y = b;
  while (y > 0) {
    if (y & 1) res ^= x;
    y >>= 1;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  return res;
}

function rsGeneratorPoly(degree: number): number[] {
  let poly = [1];
  let root = 1;
  for (let i = 0; i < degree; i++) {
    const next = new Array<number>(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] = (next[j] ?? 0) ^ poly[j]!;
      next[j + 1] = (next[j + 1] ?? 0) ^ gfMul(poly[j]!, root);
    }
    poly = next;
    root = gfMul(root, 2);
  }
  return poly;
}

function rsRemainder(data: number[], degree: number): number[] {
  const gen = rsGeneratorPoly(degree);
  const rem = new Array<number>(degree).fill(0);
  for (const byte of data) {
    const factor = byte ^ rem[0]!;
    rem.shift();
    rem.push(0);
    for (let j = 0; j < degree; j++) {
      rem[j] = (rem[j] ?? 0) ^ gfMul(gen[j + 1]!, factor);
    }
  }
  return rem;
}

function buildQrMatrix(text: string): boolean[][] {
  const bytes = Array.from(new TextEncoder().encode(text));
  let version = 1;
  while (version <= 10) {
    const entry = VERSION_TABLE[version]!;
    const dataCap = entry[0] - entry[1] * entry[2];
    const headerBytes = version <= 9 ? 2 : 3;
    if (bytes.length + headerBytes <= dataCap) break;
    version++;
  }
  if (version > 10) version = 10;

  const [totalCw, ecCw, blocks] = VERSION_TABLE[version]!;
  const dataCwCount = totalCw - ecCw * blocks;

  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
  };

  pushBits(0b0100, 4); // Byte mode
  pushBits(bytes.length, version <= 9 ? 8 : 16);
  for (const b of bytes) {
    if (bits.length + 8 <= dataCwCount * 8) pushBits(b, 8);
  }
  const terminator = Math.min(4, dataCwCount * 8 - bits.length);
  pushBits(0, terminator);
  while (bits.length % 8 !== 0) bits.push(0);

  const dataCodewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j]!;
    dataCodewords.push(byte);
  }
  let padToggle = true;
  while (dataCodewords.length < dataCwCount) {
    dataCodewords.push(padToggle ? 0xec : 0x11);
    padToggle = !padToggle;
  }

  const blockData: number[][] = [];
  const blockEc: number[][] = [];
  const shortBlockLen = Math.floor(dataCwCount / blocks);
  const numLongBlocks = dataCwCount % blocks;
  let offset = 0;
  for (let b = 0; b < blocks; b++) {
    const len = shortBlockLen + (b >= blocks - numLongBlocks ? 1 : 0);
    const slice = dataCodewords.slice(offset, offset + len);
    offset += len;
    blockData.push(slice);
    blockEc.push(rsRemainder(slice, ecCw));
  }

  const finalCodewords: number[] = [];
  const maxDataLen = shortBlockLen + (numLongBlocks > 0 ? 1 : 0);
  for (let i = 0; i < maxDataLen; i++) {
    for (let b = 0; b < blocks; b++) {
      if (i < blockData[b]!.length) finalCodewords.push(blockData[b]![i]!);
    }
  }
  for (let i = 0; i < ecCw; i++) {
    for (let b = 0; b < blocks; b++) {
      finalCodewords.push(blockEc[b]![i]!);
    }
  }

  const size = version * 4 + 17;
  const modules: boolean[][] = Array.from({ length: size }, () =>
    new Array<boolean>(size).fill(false),
  );
  const isFunc: boolean[][] = Array.from({ length: size }, () =>
    new Array<boolean>(size).fill(false),
  );

  const setFunction = (r: number, c: number, dark: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      modules[r]![c] = dark;
      isFunc[r]![c] = true;
    }
  };

  const drawFinder = (r: number, c: number) => {
    for (let dy = -1; dy <= 7; dy++) {
      for (let dx = -1; dx <= 7; dx++) {
        const dist = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
        const dark = dist !== 2 && dist !== 4;
        setFunction(r + dy, c + dx, dark);
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  for (let i = 8; i < size - 8; i++) {
    setFunction(6, i, i % 2 === 0);
    setFunction(i, 6, i % 2 === 0);
  }

  const alignCoords = ALIGNMENT_POS[version]!;
  for (const r of alignCoords) {
    for (const c of alignCoords) {
      if (
        (r === 6 && c === 6) ||
        (r === 6 && c === size - 7) ||
        (r === size - 7 && c === 6)
      )
        continue;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          setFunction(
            r + dy,
            c + dx,
            Math.max(Math.abs(dx), Math.abs(dy)) !== 1,
          );
        }
      }
    }
  }

  // Reserve format info areas
  for (let i = 0; i <= 8; i++) {
    if (!isFunc[8]![i]) setFunction(8, i, false);
    if (!isFunc[i]![8]) setFunction(i, 8, false);
  }
  for (let i = 0; i < 8; i++) {
    setFunction(8, size - 1 - i, false);
    setFunction(size - 1 - i, 8, false);
  }
  setFunction(size - 8, 8, true); // Dark module

  // Place data bits + apply mask 0 ((r + c) % 2 === 0)
  let bitIdx = 0;
  const totalBits = finalCodewords.length * 8;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      const r = upward ? size - 1 - vert : vert;
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        if (!isFunc[r]![c]) {
          let dark = false;
          if (bitIdx < totalBits) {
            const cw = finalCodewords[bitIdx >> 3]!;
            dark = ((cw >> (7 - (bitIdx & 7))) & 1) === 1;
            bitIdx++;
          }
          if ((r + c) % 2 === 0) dark = !dark;
          modules[r]![c] = dark;
        }
      }
    }
    upward = !upward;
  }

  // Format bits for EC Level L (01) and Mask 0 (000) -> 0x77c4
  const formatBits = 0x77c4;
  const getFormatBit = (i: number) => ((formatBits >> i) & 1) === 1;
  for (let i = 0; i <= 5; i++) modules[8]![i] = getFormatBit(i);
  modules[8]![7] = getFormatBit(6);
  modules[8]![8] = getFormatBit(7);
  modules[7]![8] = getFormatBit(8);
  for (let i = 9; i < 15; i++) modules[14 - i]![8] = getFormatBit(i);
  for (let i = 0; i < 8; i++) modules[8]![size - 1 - i] = getFormatBit(i);
  for (let i = 8; i < 15; i++) modules[size - 15 + i]![8] = getFormatBit(i);

  return modules;
}

export function TotpQrCode({
  secret,
  otpauthUri,
}: {
  secret: string;
  otpauthUri: string;
}) {
  const [copied, setCopied] = useState(false);
  const matrix = useMemo(
    () =>
      buildQrMatrix(otpauthUri || `otpauth://totp/AccionesUD?secret=${secret}`),
    [otpauthUri, secret],
  );
  const quietZone = 4;
  const totalSize = matrix.length + quietZone * 2;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* Portapapeles opcional */
    }
  }

  return (
    <div className={styles.enrollmentBox}>
      <div className={styles.securityIntro}>
        <span className={styles.qrBadge}>
          <Icon name="shield" size={14} /> Protege tu cuenta · 2FA
        </span>
        <h2>Configura tu autenticador</h2>
        <p>
          Vincula una aplicación como Google Authenticator o Authy para
          confirmar cada inicio de sesión.
        </p>
      </div>
      <div className={styles.qrLayout}>
        <div className={styles.qrFrame}>
          <svg
            viewBox={`0 0 ${totalSize} ${totalSize}`}
            role="img"
            aria-label="Código QR de configuración 2FA"
            className={styles.qrSvg}
            shapeRendering="crispEdges"
          >
            <rect width={totalSize} height={totalSize} fill="#ffffff" rx="2" />
            {matrix.map((row, r) =>
              row.map((cell, c) =>
                cell ? (
                  <rect
                    key={`${r}-${c}`}
                    x={c + quietZone}
                    y={r + quietZone}
                    width={1}
                    height={1}
                    fill="#0c0e13"
                  />
                ) : null,
              ),
            )}
          </svg>
          <span className={styles.qrCaption}>Escanear con Authenticator</span>
        </div>

        <div className={styles.qrDetails}>
          <ol className={styles.setupSteps}>
            <li>Abre tu aplicación de autenticación.</li>
            <li>Añade una cuenta y escanea este QR.</li>
            <li>
              Escribe abajo el código de 6 dígitos que aparece en la aplicación.
            </li>
          </ol>
          <details className={styles.manualSetup}>
            <summary>¿No puedes escanear el QR?</summary>
            <p>
              Introduce esta clave en tu autenticador y selecciona códigos
              basados en tiempo.
            </p>
            <code className={styles.secretCode}>{secret}</code>

            <button
              type="button"
              onClick={handleCopy}
              className={styles.copySecretBtn}
            >
              {copied ? '✓ Código copiado' : 'Copiar código de configuración'}
            </button>
          </details>
        </div>
      </div>
    </div>
  );
}
