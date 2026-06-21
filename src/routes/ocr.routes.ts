import { Router, Request, Response, NextFunction } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';

const router = Router();

const PROMPT = `Esta es la foto de una etiqueta de calibracion de un robot industrial (ABB o KUKA). Contiene una tabla "Axis calibration" con "Resolver values" por eje (Axis 1 a 6). La etiqueta puede estar girada (incluso 180 grados), con reflejos, suciedad o escarcha.
Extrae los valores de resolver/calibracion por eje. Algunos robots (p.ej. paletizadores de 4 ejes) tienen ejes en blanco: omite los que no tengan valor, NO inventes.
Devuelve SOLO un JSON valido, sin texto adicional ni markdown, con esta forma exacta:
{"serial": "<numero de serie de la etiqueta si se ve, si no null>", "axes": {"1": "0.0000", "2": "0.0000"}}
Los valores son numeros con 4 decimales, rango 0 a 6.2832, con punto decimal.`;

type MediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

// POST /ocr/calibracion-label  { image: dataURL | base64 } -> { serial, axes: { eje: valor } }
// Lee la etiqueta de calibracion ABB con un modelo de vision (Anthropic). Auth requerida.
router.post('/calibracion-label', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!env.ANTHROPIC_API_KEY) {
      res.status(503).json({ error: 'OCR en la nube no configurado (falta ANTHROPIC_API_KEY en el servidor).' });
      return;
    }
    const image = (req.body?.image ?? '') as string;
    if (typeof image !== 'string' || image.length < 16) {
      res.status(400).json({ error: 'Falta la imagen.' });
      return;
    }
    const mm = image.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
    const mediaType = (mm ? mm[1] : 'image/jpeg') as MediaType;
    const data = mm ? mm[2]! : image;

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: env.OCR_MODEL,
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
          { type: 'text', text: PROMPT },
        ],
      }],
    });
    const text = msg.content.map((c) => (c.type === 'text' ? c.text : '')).join('\n');
    const jsonM = text.match(/\{[\s\S]*\}/);
    if (!jsonM) {
      res.json({ serial: null, axes: {} });
      return;
    }
    let parsed: { serial?: string | null; axes?: Record<string, unknown> };
    try {
      parsed = JSON.parse(jsonM[0]);
    } catch {
      res.json({ serial: null, axes: {} });
      return;
    }
    // Normaliza: solo ejes 1-6 con valor string no vacio.
    const axes: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed.axes ?? {})) {
      if (/^[1-6]$/.test(k) && v != null && String(v).trim()) axes[k] = String(v).trim();
    }
    res.json({ serial: parsed.serial ?? null, axes });
  } catch (err) {
    next(err);
  }
});

export default router;
