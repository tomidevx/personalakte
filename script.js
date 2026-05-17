const form = document.getElementById('akteForm');
const nameInput = document.getElementById('name');
const alterInput = document.getElementById('alter');
const beschreibungInput = document.getElementById('beschreibung');
const personAugenfarbeInput = document.getElementById('personAugenfarbe');
const personGeburtstagInput = document.getElementById('personGeburtstag');
const personHaarfarbeInput = document.getElementById('personHaarfarbe');
const personZugehoerigkeitInput = document.getElementById('personZugehoerigkeit');
const personExtrasContainer = document.getElementById('personExtras');
const addExtraBtn = document.getElementById('addExtraBtn');
const mugshotInput = document.getElementById('mugshot');
const mugshotOffsetXInput = document.getElementById('mugshotOffsetX');
const mugshotOffsetYInput = document.getElementById('mugshotOffsetY');
const mugshotScaleInput = document.getElementById('mugshotScale');
const topSecretScaleInput = document.getElementById('topSecretScale');
const showTopSecretInput = document.getElementById('showTopSecret');
const downloadBtn = document.getElementById('downloadBtn');
const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');

let mugshotImage = null;
let bgImage = null;
let topSecretImage = null;
let isDraggingTopSecret = false;

const state = {
  name: 'Jose Kawasaki',
  alter: '36',
  beschreibung: 'Priester / Dämonenaustreiber. Intensive spirituelle Erfahrungen, hoher Stress und starke Glaubensüberzeugungen.',
  personAugenfarbe: 'Braun',
  personGeburtstag: '01.01.1988',
  personHaarfarbe: 'Schwarz',
  personZugehoerigkeit: 'Liga der Schatten',
  personExtras: [],
  personbeschreibung: 'Geburtstag: 01.01.1988\nAugenfarbe: Braun\nHaarfarbe: Schwarz\nZugehörigkeit: Liga der Schatten',
  showTopSecret: true,
  mugshotOffsetX: 0,
  mugshotOffsetY: 0,
  mugshotScale: 100,
  topSecret: {
    xPct: 0.5,
    yPct: 0.22,
    scale: 1.2,
  },
};

function drawAkte() {
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  if (bgImage) {
    drawBackgroundImage(ctx, bgImage, width, height);
  } else {
    drawPaperBackground(ctx, width, height);
  }

  const contentX = 60;
  let y = 80;

  ctx.fillStyle = '#111111';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText('PERSONALAKTE', contentX, y);

  ctx.fillStyle = '#222222';
  ctx.font = '600 18px Georgia, serif';
  y += 42;
  ctx.fillText(`Erstellt: ${new Date().toLocaleDateString('de-DE')}`, contentX, y);

  if (mugshotImage) {
    const frameX = width - 300;
    const frameY = 130;
    const frameW = 220;
    const frameH = 300;

    const imageRatio = mugshotImage.width / mugshotImage.height;
    const frameRatio = frameW / frameH;
    let drawW = frameW;
    let drawH = frameH;
    if (imageRatio > frameRatio) {
      drawH = frameW / imageRatio;
    } else {
      drawW = frameH * imageRatio;
    }

    const scale = state.mugshotScale / 100;
    drawW *= scale;
    drawH *= scale;

    const centerX = frameX + frameW / 2 + state.mugshotOffsetX;
    const centerY = frameY + frameH / 2 + state.mugshotOffsetY;
    const drawX = centerX - drawW / 2;
    const drawY = centerY - drawH / 2;

    ctx.save();
    ctx.beginPath();
    ctx.rect(frameX, frameY, frameW, frameH);
    ctx.clip();
    ctx.drawImage(mugshotImage, drawX, drawY, drawW, drawH);
    ctx.restore();

    if (state.showTopSecret) {
      drawTopSecretStamp(ctx, frameX, frameY, frameW, frameH, state.topSecret);
    }

    ctx.save();
    ctx.strokeStyle = 'rgba(104, 72, 44, 0.32)';
    ctx.lineWidth = 4;
    ctx.strokeRect(frameX - 2, frameY - 2, frameW + 4, frameH + 4);
    ctx.restore();
  } else {
    const frameX = width - 300;
    const frameY = 130;
    const frameW = 220;
    const frameH = 300;

    ctx.fillStyle = 'rgba(255, 253, 236, 0.65)';
    ctx.fillRect(frameX, frameY, frameW, frameH);
    ctx.fillStyle = '#8d7a5d';
    ctx.font = '600 20px Georgia, serif';
    ctx.fillText('kein Mugshot', frameX + 18, frameY + frameH / 2 + 8);
  }

  y += 40;
  ctx.fillStyle = '#111111';
  ctx.font = '800 28px Georgia, serif';
  ctx.fillText(state.name || 'Name fehlt', contentX, y);

  y += 38;
  ctx.fillStyle = '#222222';
  ctx.font = '700 22px Georgia, serif';
  ctx.fillText(`Alter: ${state.alter || '-'}`, contentX, y);

  y += 42;
  ctx.fillStyle = '#111111';
  ctx.font = '700 22px Georgia, serif';
  ctx.fillText('Personenbeschreibung:', contentX, y);

  y += 34;
  ctx.fillStyle = '#222222';
  ctx.font = '600 18px Inter';
  y = wrapText(ctx, state.personbeschreibung || 'Keine Detailbeschreibung', contentX, y, width - 500, 28);

  const descriptionTitleY = 580;
  ctx.fillStyle = '#111111';
  ctx.font = '700 22px Inter';
  ctx.fillText('Beschreibung:', contentX, descriptionTitleY);

  const descriptionTextY = descriptionTitleY + 34;
  ctx.fillStyle = '#222222';
  ctx.font = '600 18px Georgia, serif';
  y = wrapText(ctx, state.beschreibung || 'Keine Beschreibung', contentX, descriptionTextY, width - 500, 28);
}

function createSeededRandom(seed) {
  let value = seed;
  return function () {
    value += 0x6D2B79F5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawBackgroundImage(context, image, width, height) {
  const imageRatio = image.width / image.height;
  const canvasRatio = width / height;
  let drawWidth = width;
  let drawHeight = height;
  let offsetX = 0;
  let offsetY = 0;

  if (imageRatio > canvasRatio) {
    drawHeight = height;
    drawWidth = imageRatio * drawHeight;
    offsetX = (width - drawWidth) / 2;
  } else {
    drawWidth = width;
    drawHeight = drawWidth / imageRatio;
    offsetY = (height - drawHeight) / 2;
  }
  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

function drawPaperBackground(context, width, height) {
  const rand = createSeededRandom(248192);
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#ede0c2');
  gradient.addColorStop(0.2, '#e4d2a5');
  gradient.addColorStop(0.65, '#d0b688');
  gradient.addColorStop(1, '#bfa678');

  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.save();
  context.globalAlpha = 0.18;
  for (let i = 0; i < 6; i += 1) {
    const x = width * (0.1 + rand() * 0.75);
    const y = height * (0.1 + rand() * 0.75);
    const rx = width * (0.06 + rand() * 0.1);
    const ry = height * (0.03 + rand() * 0.08);
    const stain = context.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
    stain.addColorStop(0, 'rgba(155, 108, 70, 0.24)');
    stain.addColorStop(0.34, 'rgba(200, 158, 104, 0.16)');
    stain.addColorStop(1, 'rgba(239, 229, 197, 0)');
    context.fillStyle = stain;
    context.beginPath();
    context.ellipse(x, y, rx, ry, rand() * Math.PI, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();

  context.save();
  context.globalAlpha = 0.08;
  context.fillStyle = 'rgba(255, 255, 255, 0.14)';
  for (let i = 0; i < 20; i += 1) {
    const x = width * (0.08 + rand() * 0.84);
    const y = height * (0.08 + rand() * 0.84);
    const w = width * (0.01 + rand() * 0.012);
    const h = height * (0.001 + rand() * 0.007);
    context.fillRect(x, y, w, h);
  }
  context.restore();

  context.save();
  context.globalAlpha = 0.08;
  context.lineWidth = 1.2;
  context.strokeStyle = 'rgba(127, 90, 50, 0.12)';
  for (let i = 0; i < 3; i += 1) {
    const startY = height * (0.18 + i * 0.22 + rand() * 0.03);
    context.beginPath();
    context.moveTo(width * 0.06, startY);
    let x = width * 0.06;
    while (x < width * 0.94) {
      x += width * (0.07 + rand() * 0.07);
      context.lineTo(x, startY + (rand() * 18 - 9));
    }
    context.stroke();
  }
  context.restore();

  context.save();
  context.globalAlpha = 0.12;
  context.strokeStyle = 'rgba(114, 76, 45, 0.18)';
  context.lineWidth = 2;
  context.setLineDash([10, 12]);
  [0.24, 0.48, 0.72].forEach((lineFactor) => {
    const y = height * (lineFactor + rand() * 0.01);
    context.beginPath();
    context.moveTo(width * 0.08, y);
    let x = width * 0.08;
    while (x < width * 0.92) {
      x += width * 0.03;
      context.lineTo(x, y + (rand() * 8 - 4));
    }
    context.stroke();
  });
  context.restore();

  context.save();
  context.globalAlpha = 0.18;
  context.fillStyle = 'rgba(137, 92, 53, 0.14)';
  context.beginPath();
  context.moveTo(width * 0.06, height * 0.08);
  context.lineTo(width * 0.12, height * 0.03);
  context.lineTo(width * 0.17, height * 0.07);
  context.lineTo(width * 0.13, height * 0.12);
  context.closePath();
  context.fill();
  context.restore();

  context.save();
  context.globalAlpha = 0.08;
  context.fillStyle = 'rgba(110, 78, 45, 0.16)';
  for (let i = 0; i < 12; i += 1) {
    const x = width * (0.08 + rand() * 0.84);
    const y = height * (0.08 + rand() * 0.84);
    const r = width * (0.008 + rand() * 0.018);
    context.beginPath();
    context.ellipse(x, y, r * 1.4, r * 0.5, rand() * Math.PI, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();

  context.save();
  context.globalAlpha = 0.02;
  context.fillStyle = 'rgba(255,255,255,0.45)';
  for (let i = 0; i < 450; i += 1) {
    const x = rand() * width;
    const y = rand() * height;
    const s = rand() * 1.0 + 0.14;
    context.fillRect(x, y, s, s);
  }
  context.restore();

  context.save();
  const edge = context.createLinearGradient(0, 0, 0, height);
  edge.addColorStop(0, 'rgba(0,0,0,0.04)');
  edge.addColorStop(0.08, 'transparent');
  edge.addColorStop(0.92, 'transparent');
  edge.addColorStop(1, 'rgba(0,0,0,0.06)');
  context.fillStyle = edge;
  context.fillRect(0, 0, width, height);
  context.restore();
}

function drawTopSecretStamp(context, x, y, width, height, topSecret) {
  context.save();
  const maxWidth = width * 0.84 * topSecret.scale;
  const maxHeight = height * 0.14 * topSecret.scale;
  const centerX = x + width * topSecret.xPct;
  const centerY = y + height * topSecret.yPct;

  context.save();
  context.translate(centerX, centerY);
  context.rotate(-0.16);

  if (topSecretImage && topSecretImage.complete && topSecretImage.naturalWidth) {
    const aspectRatio = topSecretImage.naturalWidth / topSecretImage.naturalHeight;
    let drawWidth = maxWidth;
    let drawHeight = maxWidth / aspectRatio;
    if (drawHeight > maxHeight) {
      drawHeight = maxHeight;
      drawWidth = drawHeight * aspectRatio;
    }
    context.drawImage(topSecretImage, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  } else {
    const stampWidth = maxWidth;
    const stampHeight = maxHeight;

    context.fillStyle = 'rgba(190, 25, 25, 0.24)';
    context.fillRect(-stampWidth / 2, -stampHeight / 2, stampWidth, stampHeight);

    context.save();
    context.lineWidth = 4;
    context.strokeStyle = 'rgba(180, 20, 20, 0.75)';
    context.strokeRect(-stampWidth / 2, -stampHeight / 2, stampWidth, stampHeight);
    context.restore();

    context.fillStyle = 'rgba(215, 30, 30, 0.94)';
    context.font = 'bold 40px Georgia, serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    const text = 'TOP SECRET';
    context.globalAlpha = 0.7;
    context.fillText(text, 0, 0);

    context.globalAlpha = 0.22;
    for (let i = 0; i < 6; i += 1) {
      const tx = (Math.random() - 0.5) * 8;
      const ty = (Math.random() - 0.5) * 5;
      context.fillText(text, tx, ty);
    }

    context.globalCompositeOperation = 'destination-out';
    context.globalAlpha = 0.16;
    for (let i = 0; i < 12; i += 1) {
      const px = -stampWidth / 2 + Math.random() * stampWidth;
      const py = -stampHeight / 2 + Math.random() * stampHeight;
      const r = Math.random() * 3 + 1;
      context.beginPath();
      context.arc(px, py, r, 0, Math.PI * 2);
      context.fill();
    }
    context.globalCompositeOperation = 'source-over';

    context.globalAlpha = 0.1;
    context.fillStyle = 'rgba(255,255,255,0.26)';
    for (let i = 0; i < 10; i += 1) {
      const px = -stampWidth / 2 + Math.random() * stampWidth;
      const py = -stampHeight / 2 + Math.random() * stampHeight;
      const rw = Math.random() * 3 + 0.5;
      const rh = Math.random() * 1 + 0.4;
      context.fillRect(px, py, rw, rh);
    }
  }

  context.restore();
}

function setTopSecretPosition(clientX, clientY) {
  const canvasRect = canvas.getBoundingClientRect();
  const frameLeft = canvasRect.left + 380 * (canvasRect.width / canvas.width);
  const frameTop = canvasRect.top + 120 * (canvasRect.height / canvas.height);
  const frameW = 320 * (canvasRect.width / canvas.width);
  const frameH = 420 * (canvasRect.height / canvas.height);

  const xPct = (clientX - frameLeft) / frameW;
  const yPct = (clientY - frameTop) / frameH;

  state.topSecret.xPct = Math.min(0.92, Math.max(0.08, xPct));
  state.topSecret.yPct = Math.min(0.86, Math.max(0.12, yPct));

  drawAkte();
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const paragraphs = text.split('\n');

  paragraphs.forEach((paragraph, index) => {
    const words = paragraph.split(' ');
    let line = '';

    for (let n = 0; n < words.length; n += 1) {
      const testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        context.fillText(line, x, y);
        line = `${words[n]} `;
        y += lineHeight;
      } else {
        line = testLine;
      }
    }

    context.fillText(line, x, y);
    if (index < paragraphs.length - 1) {
      y += lineHeight;
    }
  });

  return y + lineHeight;
}

function getPersonExtras() {
  const rows = [...personExtrasContainer.querySelectorAll('.extra-row')];
  return rows.map((row) => {
    const labelInput = row.querySelector('.extra-label');
    const valueInput = row.querySelector('.extra-value');
    return {
      label: labelInput.value.trim(),
      value: valueInput.value.trim(),
    };
  }).filter((extra) => extra.label || extra.value);
}

function createExtraRow(label = '', value = '') {
  const row = document.createElement('div');
  row.className = 'extra-row';

  const labelInput = document.createElement('input');
  labelInput.type = 'text';
  labelInput.className = 'extra-label';
  labelInput.placeholder = 'Label';
  labelInput.value = label;
  labelInput.addEventListener('input', updateState);

  const valueInput = document.createElement('input');
  valueInput.type = 'text';
  valueInput.className = 'extra-value';
  valueInput.placeholder = 'Info';
  valueInput.value = value;
  valueInput.addEventListener('input', updateState);

  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'removeExtra';
  removeButton.textContent = '×';
  removeButton.addEventListener('click', () => {
    row.remove();
    updateState();
  });

  row.append(labelInput, valueInput, removeButton);
  return row;
}

function updatePersonExtrasUI() {
  addExtraBtn.disabled = personExtrasContainer.childElementCount >= 8;
}

function updateState() {
  state.name = nameInput.value.trim() || 'Unbekannt';
  state.alter = alterInput.value.trim() || 'n/a';
  state.beschreibung = beschreibungInput.value.trim() || 'Keine Beschreibung hinzugefügt.';
  state.personAugenfarbe = personAugenfarbeInput.value.trim();
  state.personGeburtstag = personGeburtstagInput.value.trim();
  state.personHaarfarbe = personHaarfarbeInput.value.trim();
  state.personZugehoerigkeit = personZugehoerigkeitInput.value.trim();
  state.personExtras = getPersonExtras();
  state.mugshotOffsetX = Number(mugshotOffsetXInput.value);
  state.mugshotOffsetY = Number(mugshotOffsetYInput.value);
  state.mugshotScale = Number(mugshotScaleInput.value);
  state.topSecret.scale = Number(topSecretScaleInput.value) / 100;
  state.showTopSecret = showTopSecretInput.checked;

  const extrasText = state.personExtras
    .map((extra) => `${extra.label || 'Merkmal'}: ${extra.value || '-'}`)
    .join('\n');

  state.personbeschreibung = `Geburtstag: ${state.personGeburtstag || '-'}\nAugenfarbe: ${state.personAugenfarbe || '-'}\nHaarfarbe: ${state.personHaarfarbe || '-'}\nZugehörigkeit: ${state.personZugehoerigkeit || '-'}${extrasText ? `\n${extrasText}` : ''}`;
  updatePersonExtrasUI();
  drawAkte();
}

nameInput.addEventListener('input', updateState);
alterInput.addEventListener('input', updateState);
beschreibungInput.addEventListener('input', updateState);
personAugenfarbeInput.addEventListener('input', updateState);
personHaarfarbeInput.addEventListener('input', updateState);
personZugehoerigkeitInput.addEventListener('input', updateState);
addExtraBtn.addEventListener('click', () => {
  if (personExtrasContainer.childElementCount < 8) {
    personExtrasContainer.appendChild(createExtraRow('', ''));
    updateState();
  }
});
mugshotOffsetXInput.addEventListener('input', updateState);
mugshotOffsetYInput.addEventListener('input', updateState);
mugshotScaleInput.addEventListener('input', updateState);
showTopSecretInput.addEventListener('change', updateState);
topSecretScaleInput.addEventListener('input', updateState);

canvas.addEventListener('pointerdown', (event) => {
  if (!state.showTopSecret) return;
  const canvasRect = canvas.getBoundingClientRect();
  const canvasX = (event.clientX - canvasRect.left) * (canvas.width / canvasRect.width);
  const canvasY = (event.clientY - canvasRect.top) * (canvas.height / canvasRect.height);

  const frameX = canvas.width - 380;
  const frameY = 120;
  const frameW = 320;
  const frameH = 420;
  const stampWidth = frameW * 0.84;
  const stampHeight = frameH * 0.14;
  const stampCenterX = frameX + frameW * state.topSecret.xPct;
  const stampCenterY = frameY + frameH * state.topSecret.yPct;
  const stampLeft = stampCenterX - stampWidth / 2;
  const stampTop = stampCenterY - stampHeight / 2;

  if (
    canvasX >= stampLeft &&
    canvasX <= stampLeft + stampWidth &&
    canvasY >= stampTop &&
    canvasY <= stampTop + stampHeight
  ) {
    isDraggingTopSecret = true;
    canvas.setPointerCapture(event.pointerId);
  }
});

canvas.addEventListener('pointermove', (event) => {
  if (!isDraggingTopSecret) return;
  setTopSecretPosition(event.clientX, event.clientY);
});

canvas.addEventListener('pointerup', () => {
  isDraggingTopSecret = false;
});

canvas.addEventListener('pointercancel', () => {
  isDraggingTopSecret = false;
});

window.addEventListener('resize', drawAkte);

function loadDefaultBackground() {
  const img = new Image();
  img.onload = () => {
    bgImage = img;
    updateState();
  };
  img.onerror = () => {
    bgImage = null;
    updateState();
  };
  img.src = 'background.png';
}

function loadTopSecretImage() {
  const img = new Image();
  img.onload = () => {
    topSecretImage = img;
    updateState();
  };
  img.onerror = () => {
    topSecretImage = null;
    updateState();
  };
  img.src = 'top_secret.png';
}

loadDefaultBackground();
loadTopSecretImage();

mugshotInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) {
    mugshotImage = null;
    updateState();
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      mugshotImage = img;
      updateState();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

downloadBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = `${state.name.replace(/\s+/g, '_') || 'personendatei'}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
});

updatePersonExtrasUI();
updateState();
