import { useCallback, useEffect, useMemo, useState } from 'react'
import { generateImage } from '@/services/reveClient'
import { DisplayResult, GenerationPayload } from '@/types/reve'

const HISTORY_STORAGE_KEY = 'reve-image-history'
const HISTORY_LIMIT = 10
const DEFAULT_FORM: GenerationPayload = { prompt: '', aspect_ratio: '3:2', version: 'latest' }
const DEV_ONLY = import.meta.env.DEV

const formatTimestamp = (timestamp: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(timestamp))

export const useReveGenerator = () => {
  const [form, setForm] = useState<GenerationPayload>(DEFAULT_FORM)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<DisplayResult | null>(null)
  const [history, setHistory] = useState<DisplayResult[]>([])
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

  useEffect(() => {
    if (!DEV_ONLY) return
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as DisplayResult[]
      if (Array.isArray(parsed)) setHistory(parsed)
    } catch (err) {
      console.warn('Failed to parse REVE history.', err)
    }
  }, [])

  useEffect(() => {
    if (!DEV_ONLY) return
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
  }, [history])

  const setFormValue = useCallback((key: keyof GenerationPayload, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  const generate = useCallback(async () => {
    if (!form.prompt.trim()) {
      setError('Prompt is required.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await generateImage(form)
      const now = new Date().toISOString()
      const entry: DisplayResult = {
        ...data,
        httpStatus: 200,
        createdAt: now,
        payload: form,
        id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `local-${Date.now()}`,
      }

      setResult(entry)
      if (DEV_ONLY) {
        setHistory((prev) => [entry, ...prev.filter((item) => item.id !== entry.id)].slice(0, HISTORY_LIMIT))
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate image.'
      setError(message)
      setResult(null)
    } finally {
      setIsLoading(false)
    }
  }, [form])

  const copyBase64 = useCallback(async () => {
    if (!result?.image || !navigator?.clipboard) {
      setCopyFeedback('Clipboard API unavailable.')
      return
    }
    try {
      await navigator.clipboard.writeText(result.image)
      setCopyFeedback('Copied base64 to clipboard.')
    } catch (err) {
      setCopyFeedback(err instanceof Error ? err.message : 'Failed to copy image data.')
    }
    setTimeout(() => setCopyFeedback(null), 2500)
  }, [result])

  const selectHistory = useCallback(
    (id: string) => {
      const entry = history.find((item) => item.id === id)
      if (!entry) return
      setResult({ ...entry })
      setForm(entry.payload)
    },
    [history],
  )

  const removeHistory = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id))
    setResult((prev) => (prev?.id === id ? null : prev))
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    setResult(null)
  }, [])

  const imageUrl = useMemo(() => (result?.image ? `data:image/png;base64,${result.image}` : null), [result])
  const imageSizeKb = useMemo(() => {
    if (!result?.image) return null
    const bytes = Math.ceil((result.image.length * 3) / 4)
    return (bytes / 1024).toFixed(2)
  }, [result])

  return {
    form,
    setFormValue,
    generate,
    isLoading,
    error,
    result,
    history,
    copyFeedback,
    handlers: {
      selectHistory,
      removeHistory,
      clearHistory,
      copyBase64,
    },
    computed: {
      imageUrl,
      imageSizeKb,
      formatTimestamp,
    },
  }
}
