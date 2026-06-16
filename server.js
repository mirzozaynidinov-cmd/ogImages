import express from 'express'
import cors from 'cors'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { URL } from 'url'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = express()
app.use(cors())
app.use(express.json())

function resolveUrl(src, base) {
  if (!src || src.startsWith('data:')) return null
  try { return new URL(src, base).href } catch { return null }
}

// unwrap CDN proxy URLs to get the original high-res image
function unwrapCdn(abs) {
  // Cloudflare: /cdn-cgi/image/width=343,.../https://original.cdn/image.jpg
  const cf = abs.match(/\/cdn-cgi\/image\/[^/]+\/(https?:\/\/.+)/)
  if (cf) return cf[1]
  // Generic fit=cover proxy: /fit=cover/https://original/image.jpg
  const fit = abs.match(/\/(?:fit=[^/]+|resize|thumb)\/?(https?:\/\/.+)/)
  if (fit) return fit[1]
  return abs
}

function shortTitle(s, maxWords = 7) {
  if (!s) return ''
  // strip "| Brand" or "- Brand" suffixes
  const clean = s.replace(/\s*[\|—–\-]\s*[^\|\-–—]+$/, '').trim() || s.trim()
  const words = clean.split(/\s+/)
  if (words.length <= maxWords) return clean
  return words.slice(0, maxWords).join(' ') + '…'
}

function shortDesc(s, maxWords = 12) {
  if (!s) return ''
  // take first sentence
  const first = s.split(/(?<=\.)\s+/)[0].trim()
  const words = first.split(/\s+/)
  if (words.length <= maxWords) return first
  return words.slice(0, maxWords).join(' ') + '…'
}

app.post('/api/analyze', async (req, res) => {
  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'URL required' })

  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OGImageBot/1.0)' },
    })

    const $ = cheerio.load(response.data)

    const seen = new Set()
    const images = []

    const isJunk = (abs, el) => {
      if (/\.(svg|ico|gif)(\?|#|$)/i.test(abs)) return true
      if (/\/(favicon|apple-touch-icon|pixel|tracker|beacon|spacer|blank|placeholder)\b/i.test(abs)) return true
      if (/\/(icon|logo)\.(png|jpe?g|webp)/i.test(abs)) return true
      // skip by explicit tiny dimensions in HTML attributes
      const w = parseInt(el.attribs?.width || '0')
      const h = parseInt(el.attribs?.height || '0')
      if ((w > 0 && w <= 4) || (h > 0 && h <= 4)) return true
      return false
    }

    // from srcset pick entry closest to 1200px (skip huge >2500px)
    const bestSrcset = (srcset) => {
      if (!srcset) return []
      const entries = srcset.split(',')
        .map(s => { const p = s.trim().split(/\s+/); return { url: p[0], w: parseInt(p[1]) || 0 } })
        .filter(e => e.url)
      const sized = entries.filter(e => e.w > 0 && e.w <= 2500)
      if (sized.length) {
        sized.sort((a, b) => Math.abs(a.w - 1200) - Math.abs(b.w - 1200))
        return [sized[0].url]
      }
      return entries.map(e => e.url)
    }

    const addImg = (src) => {
      const abs = resolveUrl(src, url)
      if (!abs) return
      const original = unwrapCdn(abs)
      if (seen.has(original)) return
      if (isJunk(original, {})) return
      seen.add(original)
      images.push(original)
    }

    $('img').each((_, el) => {
      const a = el.attribs || {}
      const srcs = [
        // srcset ~1200px first = better quality than src thumbnail
        ...bestSrcset(a.srcset || a['data-srcset']),
        a['data-src'],
        a['data-lazy-src'],
        a['data-original'],
        a['data-img-src'],
        a.src,  // fallback — often a small thumbnail
      ].filter(Boolean)
      for (const s of srcs) addImg(s)
    })

    res.json({
      title: shortTitle(
        $('meta[property="og:title"]').attr('content') ||
        $('title').text() ||
        ''
      ),
      description: shortDesc(
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="description"]').attr('content') ||
        ''
      ),
      images,
      siteName: $('meta[property="og:site_name"]').attr('content') || '',
      url,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/image', async (req, res) => {
  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'URL required' })
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OGImageBot/1.0)' },
    })
    // resize to max 2400px wide (2× retina for 1200px OG), convert to WebP q=90
    const processed = await sharp(Buffer.from(response.data))
      .resize(2400, null, { withoutEnlargement: true })
      .webp({ quality: 90 })
      .toBuffer()
    const base64 = processed.toString('base64')
    res.json({ dataUrl: `data:image/webp;base64,${base64}` })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// раздаём собранный Vite если dist существует
const distPath = join(__dirname, 'dist')
if (existsSync(distPath)) {
  app.use(express.static(distPath))
  app.use((req, res) => res.sendFile(join(distPath, 'index.html')))
}

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
