/**
 * JZAGENTIC AI Designer - Figma Plugin Main Sandboxed Code
 * Zero-error native node generator for Figma & FigJam
 */

figma.showUI(__html__, {
  width: 420,
  height: 640,
  themeColors: true
});

// Cache for loaded fonts to avoid redundant async loads
const loadedFonts = new Set();

async function loadFontSafe(family = "Inter", style = "Regular") {
  const fontKey = `${family}::${style}`;
  if (loadedFonts.has(fontKey)) return true;

  try {
    await figma.loadFontAsync({ family, style });
    loadedFonts.add(fontKey);
    return true;
  } catch (err) {
    console.warn(`[JZAGENTIC] Font ${family} ${style} not available, falling back to Inter Regular:`, err);
    try {
      if (!loadedFonts.has("Inter::Regular")) {
        await figma.loadFontAsync({ family: "Inter", style: "Regular" });
        loadedFonts.add("Inter::Regular");
      }
      return true;
    } catch (e2) {
      console.error("[JZAGENTIC] Critical: Could not load fallback font Inter Regular", e2);
      return false;
    }
  }
}

// Convert Hex or RGBA string/object to Figma RGB (0..1)
function parseFigmaColor(colorInput) {
  if (!colorInput) return { r: 1, g: 1, b: 1 };

  if (typeof colorInput === 'object') {
    if ('r' in colorInput && 'g' in colorInput && 'b' in colorInput) {
      return {
        r: colorInput.r > 1 ? colorInput.r / 255 : Math.max(0, Math.min(1, colorInput.r)),
        g: colorInput.g > 1 ? colorInput.g / 255 : Math.max(0, Math.min(1, colorInput.g)),
        b: colorInput.b > 1 ? colorInput.b / 255 : Math.max(0, Math.min(1, colorInput.b)),
      };
    }
  }

  let hex = String(colorInput).replace(/[^0-9a-fA-F]/g, '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  if (hex.length >= 6) {
    const num = parseInt(hex.substring(0, 6), 16);
    if (!isNaN(num)) {
      return {
        r: ((num >> 16) & 255) / 255,
        g: ((num >> 8) & 255) / 255,
        b: (num & 255) / 255
      };
    }
  }

  return { r: 0.9, g: 0.9, b: 0.9 };
}

// Recursive Node Builder
async function createFigmaNode(spec, parent = null) {
  if (!spec || typeof spec !== 'object') return null;

  const nodeType = (spec.type || 'FRAME').toUpperCase();
  let node = null;

  if (nodeType === 'TEXT') {
    node = figma.createText();
    node.name = spec.name || 'Text';

    const fontStyle = spec.fontWeight === 'Bold' ? 'Bold' : (spec.fontWeight === 'Medium' ? 'Medium' : 'Regular');
    await loadFontSafe('Inter', fontStyle);
    node.fontName = { family: 'Inter', style: fontStyle };

    node.characters = String(spec.characters || spec.text || 'Label');
    if (spec.fontSize) node.fontSize = Number(spec.fontSize);

    // Text Align
    if (spec.textAlignHorizontal) {
      const align = spec.textAlignHorizontal.toUpperCase();
      if (['LEFT', 'CENTER', 'RIGHT', 'JUSTIFIED'].includes(align)) {
        node.textAlignHorizontal = align;
      }
    }

    // Fills
    if (spec.fills && Array.isArray(spec.fills) && spec.fills.length > 0) {
      node.fills = spec.fills.map(f => ({
        type: 'SOLID',
        color: parseFigmaColor(f.color || f)
      }));
    } else if (spec.color) {
      node.fills = [{ type: 'SOLID', color: parseFigmaColor(spec.color) }];
    } else {
      node.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.98 } }];
    }

  } else if (nodeType === 'RECTANGLE') {
    node = figma.createRectangle();
    node.name = spec.name || 'Rectangle';

    if (spec.width && spec.height) {
      node.resize(Math.max(1, Number(spec.width)), Math.max(1, Number(spec.height)));
    }
    if (spec.cornerRadius) {
      node.cornerRadius = Number(spec.cornerRadius);
    }
    if (spec.fills && Array.isArray(spec.fills)) {
      node.fills = spec.fills.map(f => ({
        type: 'SOLID',
        color: parseFigmaColor(f.color || f)
      }));
    } else if (spec.color) {
      node.fills = [{ type: 'SOLID', color: parseFigmaColor(spec.color) }];
    }

    if (spec.strokes && Array.isArray(spec.strokes)) {
      node.strokes = spec.strokes.map(s => ({
        type: 'SOLID',
        color: parseFigmaColor(s.color || s)
      }));
      node.strokeWeight = Number(spec.strokeWeight || 1);
    }

  } else {
    // Default is FRAME
    node = figma.createFrame();
    node.name = spec.name || 'Frame';

    const width = Math.max(10, Number(spec.width || 360));
    const height = Math.max(10, Number(spec.height || 180));
    node.resize(width, height);

    if (spec.cornerRadius) {
      node.cornerRadius = Number(spec.cornerRadius);
    }
    if (spec.clipsContent !== undefined) {
      node.clipsContent = Boolean(spec.clipsContent);
    }

    // Fills
    if (spec.fills && Array.isArray(spec.fills) && spec.fills.length > 0) {
      node.fills = spec.fills.map(f => ({
        type: 'SOLID',
        color: parseFigmaColor(f.color || f),
        opacity: f.opacity !== undefined ? Number(f.opacity) : 1
      }));
    } else if (spec.color) {
      node.fills = [{ type: 'SOLID', color: parseFigmaColor(spec.color) }];
    } else if (parent === null) {
      // Dark theme default for root frame
      node.fills = [{ type: 'SOLID', color: { r: 0.05, g: 0.05, b: 0.07 } }];
    }

    // Strokes (Border)
    if (spec.strokes && Array.isArray(spec.strokes) && spec.strokes.length > 0) {
      node.strokes = spec.strokes.map(s => ({
        type: 'SOLID',
        color: parseFigmaColor(s.color || s)
      }));
      node.strokeWeight = Number(spec.strokeWeight || 1);
    }

    // Auto-Layout
    if (spec.layoutMode) {
      const mode = spec.layoutMode.toUpperCase();
      if (mode === 'HORIZONTAL' || mode === 'VERTICAL') {
        node.layoutMode = mode;
        node.itemSpacing = Number(spec.itemSpacing || 0);
        node.paddingTop = Number(spec.paddingTop || spec.padding || 0);
        node.paddingRight = Number(spec.paddingRight || spec.padding || 0);
        node.paddingBottom = Number(spec.paddingBottom || spec.padding || 0);
        node.paddingLeft = Number(spec.paddingLeft || spec.padding || 0);

        if (spec.primaryAxisAlignItems) {
          const pAlign = spec.primaryAxisAlignItems.toUpperCase();
          if (['MIN', 'CENTER', 'MAX', 'SPACE_BETWEEN'].includes(pAlign)) {
            node.primaryAxisAlignItems = pAlign;
          }
        }
        if (spec.counterAxisAlignItems) {
          const cAlign = spec.counterAxisAlignItems.toUpperCase();
          if (['MIN', 'CENTER', 'MAX'].includes(cAlign)) {
            node.counterAxisAlignItems = cAlign;
          }
        }

        // Sizing
        if (spec.primaryAxisSizingMode) {
          const pSize = spec.primaryAxisSizingMode.toUpperCase();
          if (['FIXED', 'AUTO'].includes(pSize)) node.primaryAxisSizingMode = pSize;
        }
        if (spec.counterAxisSizingMode) {
          const cSize = spec.counterAxisSizingMode.toUpperCase();
          if (['FIXED', 'AUTO'].includes(cSize)) node.counterAxisSizingMode = cSize;
        }
      }
    }

    // Render Children
    if (spec.children && Array.isArray(spec.children)) {
      for (const childSpec of spec.children) {
        const childNode = await createFigmaNode(childSpec, node);
        if (childNode) {
          node.appendChild(childNode);
        }
      }
    }
  }

  return node;
}

// Handle UI Messages
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'render-design') {
    try {
      const designSpec = msg.payload;
      if (!designSpec) {
        figma.ui.postMessage({ type: 'error', message: 'Spesifikasi desain kosong!' });
        return;
      }

      figma.notify('⚡ JZAGENTIC: Sedang merakit elemen desain di canvas...', { timeout: 3000 });

      // Create Root Node
      const rootNode = await createFigmaNode(designSpec, null);
      if (!rootNode) {
        figma.ui.postMessage({ type: 'error', message: 'Gagal membuat root node desain.' });
        return;
      }

      // Center in current Figma viewport
      const center = figma.viewport.center;
      rootNode.x = Math.round(center.x - rootNode.width / 2);
      rootNode.y = Math.round(center.y - rootNode.height / 2);

      figma.currentPage.appendChild(rootNode);
      figma.currentPage.selection = [rootNode];
      figma.viewport.scrollAndZoomIntoView([rootNode]);

      figma.notify('✨ Desain JZAGENTIC AI berhasil dibuat di Canvas!');
      figma.ui.postMessage({
        type: 'success',
        message: 'Desain berhasil digenerate langsung ke Canvas Figma!'
      });

    } catch (err) {
      console.error('[JZAGENTIC Figma Render Error]', err);
      figma.notify('⚠️ Terjadi kendala saat merender desain.', { error: true });
      figma.ui.postMessage({
        type: 'error',
        message: 'Render error: ' + (err.message || String(err))
      });
    }
  } else if (msg.type === 'close-plugin') {
    figma.closePlugin();
  }
};
