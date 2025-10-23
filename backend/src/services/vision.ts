import vision from '@google-cloud/vision';

const credsBase64 = process.env.GOOGLE_VISION_CREDENTIALS_BASE64;
const client = new vision.ImageAnnotatorClient({
  credentials: credsBase64 ? JSON.parse(Buffer.from(credsBase64, 'base64').toString('utf8')) : undefined
});

export async function extractTextFromImage(buffer: Buffer) {
  const [textResult] = await client.textDetection({ image: { content: buffer }});
  const text = textResult?.fullTextAnnotation?.text || '';

  const barcode = (text.match(/\b\d{8,13}\b/g) || [])[0] || null;
  const ingredientsMatch = text.match(/ingredients?:?\s*([\s\S]*?)(?:\n\n|\r\n\r\n|$)/i);
  const ingredients = ingredientsMatch ? ingredientsMatch[1].trim() : '';

  return { text, barcode, ingredients };
}
